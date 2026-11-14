/**
 * FarmIQ disease scanner — structured report parser tests (FIQ-098).
 * The vision model is untrusted: caps, enums, and source-id allowlisting.
 */
import assert from 'node:assert';
import { parseDiseaseReport } from '../../lib/services/disease/analysis';

const KNOWN_IDS = ['src-fao-05', 'src-icar-03', 'src-fao-06'];

function run(): void {
  // Valid fenced JSON report
  const fenced = `\`\`\`json
{
  "plant_identified": "Tomato",
  "plant_match_confirmed": true,
  "plant_details": "A warm-season fruiting vegetable grown widely in kitchens and smallholdings.",
  "growing_conditions": "Prefers warm days, cool nights, and well-drained loamy soil with steady moisture.",
  "disease_name": "Early blight (suspected)",
  "disease_why": "Warm humid weather and splashing water spread the fungal spores on lower leaves first.",
  "severity": "moderate",
  "recovery_steps": ["Remove and bin affected lower leaves", "Water at the roots in the morning"],
  "prevention_steps": ["Space plants for airflow", "Mulch to stop soil splash"],
  "source_ids": ["src-fao-05", "src-icar-03"]
}
\`\`\``;
  const report = parseDiseaseReport(fenced, KNOWN_IDS);
  assert(report, 'valid report parses');
  assertEqual(report!.plantIdentified, 'Tomato', 'plant identified');
  assertEqual(report!.plantMatchConfirmed, true, 'match confirmed');
  assertEqual(report!.severity, 'moderate', 'severity enum');
  assertEqual(report!.recoverySteps.length, 2, 'recovery steps');
  assertEqual(report!.preventionSteps.length, 2, 'prevention steps');
  assertEqual(report!.sourceIds.length, 2, 'both known source ids kept');
  console.log('✔ Valid fenced disease report parses');

  // Invented source ids must be dropped (model can never introduce sources)
  const invented = JSON.stringify({
    plant_identified: 'Wheat',
    plant_details: 'Cereal grain crop.',
    growing_conditions: 'Cool season crop.',
    disease_name: 'Rust',
    disease_why: 'Wind-borne spores.',
    severity: 'early',
    recovery_steps: [],
    prevention_steps: [],
    source_ids: ['https://evil.example.com/fake', 'src-unknown', 'src-icar-03']
  });
  const inventedParsed = parseDiseaseReport(invented, KNOWN_IDS);
  assert(inventedParsed, 'parses with mixed source ids');
  assertEqual(inventedParsed!.sourceIds.length, 1, 'only known source id survives');
  assertEqual(inventedParsed!.sourceIds[0], 'src-icar-03', 'registry id preserved');
  console.log('✔ Invented source ids/urls are dropped');

  // Invalid severity falls back to uncertain
  const badSeverity = JSON.stringify({
    plant_identified: 'Maize',
    plant_details: 'details',
    growing_conditions: 'conditions',
    disease_name: 'Leaf spot',
    disease_why: 'why',
    severity: 'catastrophic',
    recovery_steps: ['a'.repeat(400)],
    prevention_steps: ['ok'],
    source_ids: []
  });
  const badParsed = parseDiseaseReport(badSeverity, KNOWN_IDS);
  assert(badParsed, 'parses with invalid severity');
  assertEqual(badParsed!.severity, 'uncertain', 'invalid severity → uncertain');
  assert(badParsed!.recoverySteps[0].length <= 220, 'step length capped');
  console.log('✔ Severity enum and string caps enforced');

  // Garbage → null (never invent a report)
  assertEqual(parseDiseaseReport('', KNOWN_IDS), null, 'empty text → null');
  assertEqual(parseDiseaseReport('I could not see any plant.', KNOWN_IDS), null, 'non-JSON → null');
  assertEqual(parseDiseaseReport('{"plant_details": "only one field"}', KNOWN_IDS), null, 'missing required fields → null');
  console.log('✔ Garbage model output yields null instead of an invented report');
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  assert.strictEqual(actual, expected, `${message} (expected ${String(expected)}, got ${String(actual)})`);
}

run();
console.log('All disease analysis parser tests passed successfully!');
