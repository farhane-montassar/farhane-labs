// Test PUR du moteur de compatibilité — aucune dépendance à Mongoose ni à la base.
// Lancement : `npm run test:compat` (depuis le dossier server/).
//
// On construit des composants « à la main » (mêmes specs que le seed) et on vérifie
// le verdict du moteur sur les 3 états :
//   🟢 compatible  🟡 compatible_adaptation  🔴 incompatible
// On vérifie AUSSI la solution recommandée contextuelle (LM2596 si une source 12V est
// présente, sinon alimentation directe) via le champ `solutionContains`.

const { validateConfiguration } = require('../services/compatibility.service');

// ---- Cartes ----
const esp32 = {
  name: 'ESP32 DevKit V1', category: 'board',
  boardCapabilities: { voltagesSupported: [3.3], digitalPins: 25, analogPins: 6, buses: ['I2C', 'SPI', 'UART'] }
};
const uno = {
  name: 'Arduino Uno R3', category: 'board',
  boardCapabilities: { voltagesSupported: [5], digitalPins: 14, analogPins: 6, buses: ['I2C', 'SPI', 'UART'] }
};
// Carte minimaliste SANS bus I2C (pour tester l'interface absente).
const noI2cBoard = {
  name: 'Carte sans I2C', category: 'board',
  boardCapabilities: { voltagesSupported: [5], digitalPins: 14, analogPins: 6, buses: ['SPI', 'UART'] }
};

// ---- Composants (specs alignées sur le seed) ----
const dht22    = { name: 'DHT22', specs: { voltageMin: 3.3, voltageMax: 5, voltage: 5, interface: 'digital', pinsUsed: 1 } };
const oled     = { name: 'OLED 0.96 I2C', specs: { voltageMin: 3.3, voltageMax: 5, voltage: 5, interface: 'I2C', pinsUsed: 2 } };
const button   = { name: 'Push Button Metal', specs: { interface: 'digital', pinsUsed: 1 } }; // SANS tension → adaptation
const relay    = { name: 'Module relais 1 canal', specs: { voltageMin: 5, voltageMax: 5, voltage: 5, interface: 'digital', pinsUsed: 1, requiresExternalPower: true } };
const sg90     = { name: 'SG90', specs: { voltageMin: 4.8, voltageMax: 6, voltage: 5, interface: 'PWM', pinsUsed: 1 } }; // 5V non exempté → chemin tension
const ledStrip = { name: 'Ruban LED 12V', specs: { voltageMin: 12, voltageMax: 12, voltage: 12, interface: 'digital', pinsUsed: 1 } }; // 12V direct → destructeur
const nema     = { name: 'NEMA 17', specs: { voltageMin: 12, voltageMax: 12, voltage: 12, interface: 'driver', pinsUsed: 4, requiresDriver: true, requiresExternalPower: true } };
const a4988    = { name: 'Driver A4988', specs: { voltageMin: 8, voltageMax: 35, interface: 'driver', pinsUsed: 2, isDriver: true } };
const alim12   = { name: 'Alimentation 12V 5A', specs: { voltage: 12, interface: 'power', pinsUsed: 0, isPowerSupply: true, powerOutput: { voltage: 12, currentA: 5 } } };
const alim5    = { name: 'Alimentation 5V 2A', specs: { voltage: 5, interface: 'power', pinsUsed: 0, isPowerSupply: true, powerOutput: { voltage: 5, currentA: 2 } } };
const lm2596   = { name: 'Convertisseur DC-DC LM2596', specs: { voltage: 5, interface: 'power', pinsUsed: 0, isPowerSupply: true, inputMin: 4, inputMax: 35, powerOutput: { voltage: 5, currentA: 3 } } };

// ---- Cas de test : { name, board, components, expected, solutionContains? } ----
// solutionContains : sous-chaîne attendue dans AU MOINS une solution recommandée.
const CASES = [
  // --- Compatible direct ---
  { name: '1. ESP32 + DHT22 + OLED I2C', board: esp32, components: [dht22, oled], expected: 'compatible' },

  // --- Tension non renseignée → adaptation ---
  { name: '2. Uno + Push Button (sans tension)', board: uno, components: [button], expected: 'compatible_adaptation' },

  // --- Relais 5V (requiresExternalPower) : solution contextuelle ---
  { name: '3. ESP32 + Relais (seul)', board: esp32, components: [relay], expected: 'compatible_adaptation', solutionContains: 'alimentation 5V' },
  { name: '4. ESP32 + Relais + Alim 12V', board: esp32, components: [relay, alim12], expected: 'compatible_adaptation', solutionContains: 'LM2596' },
  { name: '5. ESP32 + Relais + LM2596 + Alim 12V', board: esp32, components: [relay, lm2596, alim12], expected: 'compatible' },
  { name: '6. ESP32 + Relais + LM2596 (sans source 12V)', board: esp32, components: [relay, lm2596], expected: 'compatible_adaptation', solutionContains: 'entrée du convertisseur' },

  // --- SG90 5V (chemin tension 5V↔3.3V) : solution contextuelle + RÉSOLUTION ---
  { name: '7. ESP32 + SG90 (seul)', board: esp32, components: [sg90], expected: 'compatible_adaptation', solutionContains: 'alimentation 5V' },
  { name: '8. ESP32 + SG90 + Alim 12V', board: esp32, components: [sg90, alim12], expected: 'compatible_adaptation', solutionContains: 'LM2596' },
  // Besoin 5V RÉSOLU par le LM2596 alimenté par l'alim 12V → plus de problème → compatible.
  { name: '8b. ESP32 + SG90 + Alim 12V + LM2596', board: esp32, components: [sg90, alim12, lm2596], expected: 'compatible' },
  // Besoin 5V RÉSOLU par une alim 5V directe → compatible.
  { name: '8c. ESP32 + SG90 + Alim 5V directe', board: esp32, components: [sg90, alim5], expected: 'compatible' },
  // Subtil : LM2596 présent mais SANS source 12V à convertir → ne résout rien → adaptation.
  { name: '8d. ESP32 + SG90 + LM2596 (sans 12V)', board: esp32, components: [sg90, lm2596], expected: 'compatible_adaptation', solutionContains: 'entrée du convertisseur' },

  // --- NEMA / driver / alimentation ---
  { name: '9. Uno + NEMA 17 (sans driver)', board: uno, components: [nema, alim12], expected: 'incompatible' },
  { name: '10. Uno + NEMA 17 + A4988 (sans alim)', board: uno, components: [nema, a4988], expected: 'compatible_adaptation', solutionContains: 'alimentation 12V' },
  { name: '11. Uno + NEMA 17 + A4988 + Alim 12V', board: uno, components: [nema, a4988, alim12], expected: 'compatible' },

  // --- Vrais blocages (incompatible) ---
  { name: '12. Uno (5V) + Ruban LED 12V (direct)', board: uno, components: [ledStrip], expected: 'incompatible' },
  { name: '13. Carte sans I2C + OLED I2C', board: noI2cBoard, components: [oled], expected: 'incompatible' },
  { name: '14. Uno + DHT22 ×30 (broches)', board: uno, components: [{ ...dht22, quantity: 30 }], expected: 'incompatible' }
];

let failures = 0;

for (const t of CASES) {
  const result = validateConfiguration(t.board, t.components);

  let pass = result.status === t.expected;
  const solutions = result.messages.filter((m) => m.solution).map((m) => m.solution);
  const solutionOk = !t.solutionContains || solutions.some((s) => s.includes(t.solutionContains));
  if (!solutionOk) pass = false;

  if (!pass) failures += 1;

  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} — ${t.name}`);
  console.log(`   attendu: ${t.expected}  |  obtenu: ${result.status}  (broches ${result.usedPins}/${result.availablePins})`);
  if (t.solutionContains) {
    console.log(`   solution doit contenir « ${t.solutionContains} » : ${solutionOk ? 'oui' : 'NON ❌'}`);
  }
  for (const m of result.messages) {
    console.log(`   • ${m.message}`);
    if (m.solution) console.log(`     💡 ${m.solution}`);
  }
  console.log('');
}

console.log('─'.repeat(60));
if (failures === 0) {
  console.log(`✅ Tous les cas passent (${CASES.length}/${CASES.length}).`);
} else {
  console.log(`❌ ${failures} cas en échec sur ${CASES.length}.`);
  process.exitCode = 1;
}
