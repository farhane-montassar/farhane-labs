const componentRepository = require('../repositories/component.repository');
const compatibilityService = require('./compatibility.service');
const ApiError = require('../utils/ApiError');

// Un composant est-il un convertisseur (déclare une plage d'entrée) ? Même critère
// que le moteur de compatibilité — un convertisseur n'est pas une source autonome.
function isConverterSpec(specs = {}) {
  return specs.inputMin != null || specs.inputMax != null;
}

// Résout un descripteur `fix` (émis par le moteur) en un VRAI composant correctif du
// catalogue. `supplies` = alimentations déjà chargées (objets simples). Renvoie le
// composant ou null si rien d'adéquat n'existe (→ pas de bouton pour ce problème).
function resolveFix(fix, supplies) {
  if (fix.type === 'converter') {
    // LM2596 : convertisseur dont la sortie correspond à la tension voulue.
    return supplies.find((c) => {
      const s = c.specs || {};
      return isConverterSpec(s) && (s.powerOutput || {}).voltage === fix.voltage;
    });
  }
  if (fix.type === 'powerSupply') {
    // Alimentation directe (non-convertisseur) délivrant exactement la tension voulue.
    return supplies.find((c) => {
      const s = c.specs || {};
      return !isConverterSpec(s) && (s.powerOutput || {}).voltage === fix.voltage;
    });
  }
  if (fix.type === 'source') {
    // Plus petite vraie source dont la sortie est >= minVoltage (ex. alim 12V).
    return supplies
      .filter((c) => {
        const s = c.specs || {};
        const v = (s.powerOutput || {}).voltage;
        return !isConverterSpec(s) && v != null && v >= fix.minVoltage;
      })
      .sort((a, b) => a.specs.powerOutput.voltage - b.specs.powerOutput.voltage)[0];
  }
  return null;
}

// Enrichit les messages du moteur : chaque message portant un descripteur `fix` est
// résolu en un composant correctif → on y attache fixComponentId/Name/Price (que le
// front exploite pour le bouton « Corriger automatiquement »). Le `fix` brut est retiré.
async function attachFixes(messages) {
  if (!messages.some((m) => m.fix)) return messages;

  // Toutes les alimentations du catalogue, chargées une seule fois.
  const docs = await componentRepository.find({ 'specs.isPowerSupply': true }, { limit: 100 });
  const supplies = docs.map((c) => (typeof c.toObject === 'function' ? c.toObject() : c));

  return messages.map((m) => {
    if (!m.fix) return m;
    const { fix, ...rest } = m;
    const comp = resolveFix(fix, supplies);
    if (!comp) return rest; // aucun correctif au catalogue → problème affiché sans bouton
    return {
      ...rest,
      fixComponentId: String(comp._id),
      fixComponentName: comp.name,
      fixComponentPrice: comp.price
    };
  });
}

// Service du configurateur : orchestre le moteur de compatibilité.
//
// Rôle : recevoir des IDENTIFIANTS (jamais des specs brutes), recharger les
// vrais composants depuis la base, vérifier la cohérence (le board est bien une
// carte), puis déléguer le verdict au moteur pur `compatibility.service`.
//
// RÈGLE DE SÉCURITÉ : on ne fait jamais confiance au client. Les specs, prix et
// catégories utilisés pour la validation proviennent TOUJOURS de la base.
const configuratorService = {
  // body attendu : { boardId, items: [{ componentId, quantity }] }
  async validate({ boardId, items }) {
    // 1. La carte : doit exister ET être de category 'board'.
    const board = await componentRepository.findById(boardId);
    if (!board) {
      throw new ApiError(404, 'Carte (boardId) introuvable');
    }
    if (board.category !== 'board') {
      throw new ApiError(400, `Le composant ${board.name} n'est pas une carte (category 'board')`);
    }

    // 2. Les composants à monter : rechargés en une requête depuis la base.
    const itemIds = items.map((it) => it.componentId);
    const found = await componentRepository.findByIds(itemIds);

    // Index par id pour rattacher chaque composant réel à sa quantité demandée,
    // et détecter les ids introuvables.
    const byId = new Map(found.map((c) => [String(c._id), c]));

    const missing = itemIds.filter((id) => !byId.has(String(id)));
    if (missing.length) {
      throw new ApiError(404, `Composant(s) introuvable(s) : ${missing.join(', ')}`);
    }

    // 3. Construit la liste enrichie (composant réel + quantité) pour le moteur,
    //    et calcule le prix total (carte incluse) à partir des prix en base.
    let totalPrice = board.price || 0;

    const componentsForEngine = items.map((it) => {
      const component = byId.get(String(it.componentId));
      const quantity = it.quantity && it.quantity > 0 ? it.quantity : 1;
      totalPrice += (component.price || 0) * quantity;

      // On passe l'objet réel au moteur, en y ajoutant la quantité (pour les broches).
      // toObject() pour manipuler un objet simple plutôt qu'un document Mongoose.
      const plain = typeof component.toObject === 'function' ? component.toObject() : component;
      return { ...plain, quantity };
    });

    // 4. Verdict du moteur de compatibilité.
    const { status, usedPins, availablePins, messages } =
      compatibilityService.validateConfiguration(board, componentsForEngine);

    // 5. Résolution des correctifs auto-applicables (couche avec accès BD) : le moteur
    //    a marqué certains problèmes d'adaptation d'un descripteur `fix`, qu'on convertit
    //    ici en un vrai composant du catalogue (fixComponentId).
    const enrichedMessages = await attachFixes(messages);

    // Arrondi à 2 décimales pour éviter les artefacts de flottants sur les prix.
    totalPrice = Math.round(totalPrice * 100) / 100;

    return { status, messages: enrichedMessages, usedPins, availablePins, totalPrice };
  }
};

module.exports = configuratorService;
