// Moteur de compatibilité — la pièce maîtresse du configurateur.
//
// Service PUR : aucune dépendance à Mongoose ni à la base. Il reçoit une carte
// (board) et une liste de composants DÉJÀ chargés depuis la base par la couche
// service, puis applique les règles de classification et renvoie un verdict.
//
// Entrée :
//   - board       : un composant de category 'board' (porte boardCapabilities)
//   - components  : tableau de composants à monter sur la carte. Chaque élément
//                   peut porter une `quantity` (défaut 1) pour le calcul des broches.
// Sortie : { status, usedPins, availablePins, messages }
//   - status      : 'compatible' | 'compatible_adaptation' | 'incompatible'
//   - usedPins    : total de broches consommées (quantité comprise)
//   - availablePins : broches offertes par la carte (digital + analog)
//   - messages    : tableau d'objets { type, message, solution? }
//                   `solution` n'est présent que pour une adaptation (problème résolvable).
//
// LES 3 ÉTATS :
//   🟢 compatible            — fonctionne directement.
//   🟡 compatible_adaptation — fonctionne MAIS nécessite un ajout/ajustement (RÉSOLVABLE).
//   🔴 incompatible          — problème PHYSIQUEMENT IMPOSSIBLE à résoudre (vrai blocage).

// Les bus partagés : leur présence sur la carte est obligatoire si un composant
// les utilise. `analog`/`digital`/`power` ne sont pas des bus → pas de contrôle.
const BUS_TYPES = ['I2C', 'SPI', 'UART'];

// Frontière logique 3.3V ↔ 5V : un écart de tension DANS cette bande se résout par
// un level shifter ou un petit rail externe (→ adaptation). Une tension de
// fonctionnement strictement au-dessus (ex. 12V) branchée en direct sur une carte
// qui ne l'accepte pas est DESTRUCTRICE (→ incompatible).
const LOGIC_LEVEL_MAX = 5;

// Hiérarchie de gravité : on ne « rétrograde » jamais un statut. Le pire prime :
// incompatible (blocage physique) > compatible_adaptation (résolvable) > compatible.
const SEVERITY = { compatible: 0, compatible_adaptation: 1, incompatible: 2 };

function escalate(current, next) {
  return SEVERITY[next] > SEVERITY[current] ? next : current;
}

// Plage de tension d'un composant : [min, max].
// Valeur unique → on retombe sur `voltage` (min = max). Renvoie null si rien n'est
// renseigné (la tension ne pourra alors pas être tranchée → adaptation).
function voltageRange(specs) {
  if (specs.voltageMin != null || specs.voltageMax != null) {
    const min = specs.voltageMin != null ? specs.voltageMin : specs.voltageMax;
    const max = specs.voltageMax != null ? specs.voltageMax : specs.voltageMin;
    return [min, max];
  }
  if (specs.voltage != null) return [specs.voltage, specs.voltage];
  return null;
}

// Un composant est-il exempté de la vérification de tension de la CARTE ?
// - isPowerSupply         : l'alim ne se branche pas sur le rail logique de la carte.
// - isDriver              : la tension déclarée (ex. A4988 8-35V) est le rail MOTEUR, pas le logique.
// - requiresExternalPower : le moteur 12V est alimenté par l'alim externe, jamais par la carte.
// Ces composants sont validés par les règles « driver » et « alimentation externe ».
function isVoltageExempt(specs) {
  return Boolean(specs.isPowerSupply || specs.isDriver || specs.requiresExternalPower);
}

// Un composant est-il un convertisseur (ex. LM2596) ? Il déclare une plage d'ENTRÉE :
// il abaisse une source supérieure, donc il n'est pas une source autonome.
function isConverter(specs) {
  return specs.inputMin != null || specs.inputMax != null;
}

// Tension d'alimentation recommandée pour un composant : on privilégie une tension
// STANDARD comprise dans sa plage [vmin,vmax] (relais [5,5]→5, SG90 [4.8,6]→5,
// NEMA [12,12]→12). À défaut, la borne basse.
function recommendedSupplyVoltage(vmin, vmax) {
  for (const std of [5, 3.3, 12]) {
    if (std >= vmin && std <= vmax) return std;
  }
  return vmin;
}

// Existe-t-il déjà dans la config une VRAIE source (pas un convertisseur) de tension
// supérieure (≥ 12V et > supplyV) que l'on pourrait abaisser via un convertisseur ?
// Renvoie sa tension (ex. 12) ou null.
function higherSourceVoltage(powerSupplies, supplyV) {
  let found = null;
  for (const p of powerSupplies) {
    const ps = p.specs || {};
    if (isConverter(ps)) continue;
    const v = (ps.powerOutput || {}).voltage;
    if (v != null && v >= 12 && v > supplyV && (found == null || v < found)) found = v;
  }
  return found;
}

// Une alimentation présente dans la config délivre-t-elle une tension comprise dans la
// plage [vmin,vmax] du composant ? Sert à détecter qu'un besoin d'alimentation est DÉJÀ
// RÉSOLU. Un convertisseur (LM2596) compte ici comme source 5V : s'il lui manque sa propre
// source d'entrée, c'est la règle « convertisseur » (rule 5) qui le signalera séparément.
function hasSupplyInRange(vmin, vmax, powerSupplies) {
  if (vmin == null) return false;
  return powerSupplies.some((p) => {
    const pv = ((p.specs || {}).powerOutput || {}).voltage;
    return pv != null && pv >= vmin && pv <= vmax;
  });
}

// Recommandation CONTEXTUELLE pour un besoin d'alimentation de `supplyV` :
// - si une source supérieure (ex. 12V) est déjà présente → proposer le convertisseur
//   DC-DC LM2596 qui l'abaisse vers `supplyV` ;
// - sinon → proposer une alimentation directe de `supplyV`.
function powerSolution(supplyV, powerSupplies) {
  const src = higherSourceVoltage(powerSupplies, supplyV);
  if (src != null) {
    return `Ajouter un Convertisseur DC-DC LM2596 pour abaisser le ${src}V en ${supplyV}V.`;
  }
  return `Ajouter une alimentation ${supplyV}V directe à la configuration.`;
}

// Variante MACHINE de powerSolution : décrit le correctif AUTO-APPLICABLE (sans texte),
// que la couche service résoudra en un vrai composant du catalogue. Suit EXACTEMENT la
// même condition que powerSolution → cohérence B1 garantie (jamais un convertisseur
// proposé sans une source supérieure à abaisser).
//   - source supérieure présente  → { type: 'converter', voltage }  (LM2596)
//   - sinon                        → { type: 'powerSupply', voltage } (alim directe)
function powerFix(supplyV, powerSupplies) {
  const src = higherSourceVoltage(powerSupplies, supplyV);
  return src != null
    ? { type: 'converter', voltage: supplyV }
    : { type: 'powerSupply', voltage: supplyV };
}

function validateConfiguration(board, components = []) {
  const messages = [];
  let status = 'compatible';

  const caps = (board && board.boardCapabilities) || {};
  const supportedVoltages = caps.voltagesSupported || [];
  const boardMaxVoltage = supportedVoltages.length ? Math.max(...supportedVoltages) : null;
  const availablePins = (caps.digitalPins || 0) + (caps.analogPins || 0);
  const availableBuses = caps.buses || [];

  // Présence dans la config d'au moins un driver / une alimentation (pour les dépendances).
  const hasDriver = components.some((c) => (c.specs || {}).isDriver);
  const powerSupplies = components.filter((c) => (c.specs || {}).isPowerSupply);

  let usedPins = 0;

  for (const c of components) {
    const specs = c.specs || {};
    const quantity = c.quantity && c.quantity > 0 ? c.quantity : 1;
    const label = quantity > 1 ? `${c.name} (×${quantity})` : c.name;

    // 1. TENSION — la plage [min,max] du composant doit recouper une des tensions
    //    supportées par la carte. Les composants exemptés (alim / driver / moteur à
    //    alim externe) sont validés ailleurs.
    if (!isVoltageExempt(specs)) {
      const range = voltageRange(specs);
      if (range && supportedVoltages.length) {
        const [vmin, vmax] = range;
        const ok = supportedVoltages.some((v) => v >= vmin && v <= vmax);
        if (!ok) {
          const shown = vmin === vmax ? `${vmin}V` : `${vmin}-${vmax}V`;
          if (vmin > LOGIC_LEVEL_MAX) {
            // Tension de fonctionnement trop haute pour la carte → branchement destructeur.
            status = escalate(status, 'incompatible');
            messages.push({
              type: 'voltage',
              message: `${label} fonctionne uniquement en ${shown}, la carte accepte au max ${boardMaxVoltage}V (risque de destruction).`
            });
          } else if (!hasSupplyInRange(vmin, vmax, powerSupplies)) {
            // Écart dans la bande logique 3.3V↔5V → adaptable (alim externe / level shifter).
            // On n'émet le problème QUE si aucune alimentation de la config ne couvre déjà
            // la plage : sinon le besoin est RÉSOLU (rien à signaler, pas d'escalade).
            // La solution proposée est contextuelle (LM2596 si une source 12V est présente).
            status = escalate(status, 'compatible_adaptation');
            const supplyV = recommendedSupplyVoltage(vmin, vmax);
            messages.push({
              type: 'voltage',
              message: `${label} requiert ${shown}, la carte fournit ${supportedVoltages.join('/')}V.`,
              solution: `${powerSolution(supplyV, powerSupplies)} Pour un simple signal logique, un adaptateur de niveau (level shifter) peut suffire.`,
              fix: powerFix(supplyV, powerSupplies)
            });
          }
        }
      } else {
        // Tension inconnue : compatibilité non garantie, mais rien de bloquant → adaptation.
        status = escalate(status, 'compatible_adaptation');
        messages.push({
          type: 'voltage',
          message: `Tension non renseignée pour ${label} : compatibilité non garantie.`,
          solution: `Vérifier la tension de fonctionnement dans la fiche technique du composant.`
        });
      }
    }

    // 2. BUS — si le composant passe par un bus (I2C/SPI/UART), la carte doit l'offrir.
    //    Absence d'interface = blocage physique (la carte n'a pas le contrôleur).
    if (BUS_TYPES.includes(specs.interface) && !availableBuses.includes(specs.interface)) {
      status = escalate(status, 'incompatible');
      messages.push({
        type: 'bus',
        message: `${label} requiert l'interface ${specs.interface}, non disponible sur la carte.`
      });
    }

    // 3. DÉPENDANCE DRIVER — un composant qui requiert un driver (ex. NEMA 17) impose
    //    la présence d'un composant isDriver=true. Un moteur pas-à-pas sans driver est
    //    un vrai blocage : il ne peut PAS être piloté directement par la carte.
    if (specs.requiresDriver && !hasDriver) {
      status = escalate(status, 'incompatible');
      messages.push({
        type: 'driver',
        message: `${label} nécessite un driver (ex. A4988) pour être piloté, absent de la configuration.`
      });
    }

    // 4. ALIMENTATION EXTERNE — un composant qui requiert une alim externe (relais 5V,
    //    moteur 12V) impose une alimentation (isPowerSupply) dont la tension de sortie
    //    tombe dans sa plage. Matching PAR PLAGE (plus robuste que l'égalité stricte :
    //    une sortie 5V convient à un SG90 4.8-6V). Résolvable → adaptation, avec une
    //    solution contextuelle (LM2596 si une source supérieure est déjà présente).
    if (specs.requiresExternalPower) {
      const range = voltageRange(specs);
      const [vmin, vmax] = range || [null, null];
      const matched = hasSupplyInRange(vmin, vmax, powerSupplies);
      if (!matched) {
        status = escalate(status, 'compatible_adaptation');
        const supplyV = vmin != null ? recommendedSupplyVoltage(vmin, vmax) : null;
        messages.push({
          type: 'power',
          message: `${label} nécessite une alimentation externe${supplyV != null ? ` ${supplyV}V` : ''} (ne pas alimenter par la carte).`,
          solution: supplyV != null
            ? powerSolution(supplyV, powerSupplies)
            : `Ajouter une alimentation adaptée à la configuration.`,
          // Correctif auto-applicable seulement si la tension est connue (sinon on ne
          // sait pas quelle alim ajouter).
          ...(supplyV != null ? { fix: powerFix(supplyV, powerSupplies) } : {})
        });
      }
    }

    // 5. CONVERTISSEUR DC-DC (ex. LM2596) — il abaisse une source supérieure ; il lui faut
    //    donc une VRAIE source d'entrée (pas un autre convertisseur) dans sa plage d'entrée.
    //    Absente → adaptation (il ne peut rien délivrer sans source à convertir).
    if (isConverter(specs)) {
      const lo = specs.inputMin != null ? specs.inputMin : 0;
      const hi = specs.inputMax != null ? specs.inputMax : Infinity;
      const hasInput = powerSupplies.some((p) => {
        const ps = p.specs || {};
        if (isConverter(ps)) return false;
        const pv = (ps.powerOutput || {}).voltage;
        return pv != null && pv >= lo && pv <= hi;
      });
      if (!hasInput) {
        status = escalate(status, 'compatible_adaptation');
        messages.push({
          type: 'power',
          message: `${label} est un convertisseur : il nécessite une source d'entrée (${lo}-${hi}V) à abaisser.`,
          solution: `Ajouter une source d'alimentation supérieure (ex. 12V) en entrée du convertisseur.`,
          // Correctif : une VRAIE source d'au moins 12V (dans la plage d'entrée du convertisseur).
          fix: { type: 'source', minVoltage: Math.max(12, lo) }
        });
      }
    }

    // 6. BROCHES — on cumule (quantité comprise). Un composant piloté PAR UN DRIVER
    //    (ex. NEMA 17) ne consomme pas de broches carte : ce sont celles du driver qui
    //    comptent. En revanche un relais (requiresExternalPower SANS driver) occupe bien
    //    sa broche de signal sur la carte → on la compte.
    if (!specs.requiresDriver) {
      usedPins += (specs.pinsUsed || 0) * quantity;
    }

    // TODO (session future) : BUS SATURÉ / multiplexeur I2C. Le modèle Component ne
    // stocke ni adresse I2C ni occupation de bus → détection impossible de façon
    // fiable aujourd'hui (I2C gère plusieurs adresses nativement). À traiter quand le
    // schéma portera l'adresse du périphérique.
  }

  // 7. BROCHES TOTALES — la somme ne doit pas dépasser ce que la carte propose.
  //    Manque de broches = blocage physique.
  if (usedPins > availablePins) {
    status = escalate(status, 'incompatible');
    messages.push({
      type: 'pins',
      message: `Broches insuffisantes : ${usedPins} requises, la carte n'en a que ${availablePins}.`
    });
  }

  if (status === 'compatible') {
    messages.push({ type: 'ok', message: '✅ Configuration compatible.' });
  }

  return { status, usedPins, availablePins, messages };
}

module.exports = { validateConfiguration };
