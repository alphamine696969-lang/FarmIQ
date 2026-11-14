/**
 * Crop Advisor scoring + catalog tests (FIQ-099).
 * Full catalog (no fixed5–6 presets), transparent deterministic scoring,
 * and citation ids that resolve to the approved source registry.
 */
import assert from 'node:assert';
import { CROP_ADVISORY_CATALOG, CROP_ADVISORY_CATEGORIES } from '../../lib/data/cropCatalog';
import { scoreCrops, scoreCrop } from '../../lib/services/cropAdvisor/scoring';
import { APPROVED_SOURCES } from '../../lib/data/mockDatabase';

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  assert.strictEqual(actual, expected, `${message} (expected ${String(expected)}, got ${String(actual)})`);
}

function run(): void {
  // Full catalog, not a handful of presets
  assert(CROP_ADVISORY_CATALOG.length >= 50, `catalog has ${CROP_ADVISORY_CATALOG.length} crops (need >=50)`);
  const names = CROP_ADVISORY_CATALOG.map((c) => c.cropName);
  assertEqual(new Set(names).size, names.length, 'crop names are unique');
  assert(CROP_ADVISORY_CATEGORIES.length >= 8, 'covers many categories');
  console.log(`✔ Full crop catalog: ${CROP_ADVISORY_CATALOG.length} crops across ${CROP_ADVISORY_CATEGORIES.length} categories`);

  // Every citation id resolves to the approved registry (working URLs)
  const sourceIds = new Set(APPROVED_SOURCES.map((s) => s.id));
  for (const crop of CROP_ADVISORY_CATALOG) {
    assert(sourceIds.has(crop.scientificReferenceId), `${crop.cropName} citation resolves`);
    assert(crop.keyAgronomicAdvice.length > 20, `${crop.cropName} has guidance`);
    assert(crop.minTempC < crop.maxTempC, `${crop.cropName} temp range valid`);
    assert(crop.minPh < crop.maxPh, `${crop.cropName} pH range valid`);
    assert(crop.minRainfallMm < crop.maxRainfallMm, `${crop.cropName} rain range valid`);
    assert(crop.growthCycleDays > 0 || Boolean(crop.cycleLabel), `${crop.cropName} has cycle or label`);
  }
  console.log('✔ Every crop resolves an approved source and has valid ranges');

  // Scoring: full catalog evaluated, sorted, deterministic
  const inputs = { soilType: 'Loam', soilPh: 6.5, rainfallMm: 700, avgTempC: 22 };
  const ranked = scoreCrops(inputs);
  assertEqual(ranked.length, CROP_ADVISORY_CATALOG.length, 'every crop scored');
  for (let i = 1; i < ranked.length; i += 1) {
    assert(ranked[i - 1].calculatedMatchScore >= ranked[i].calculatedMatchScore, 'sorted best-first');
  }
  const rankedAgain = scoreCrops(inputs);
  assertEqual(
    ranked.map((r) => `${r.cropName}:${r.calculatedMatchScore}`).join('|'),
    rankedAgain.map((r) => `${r.cropName}:${r.calculatedMatchScore}`).join('|'),
    'scoring is deterministic'
  );
  console.log(`✔ All ${ranked.length} crops scored deterministically`);

  // Penalties behave transparently
  const wheat = CROP_ADVISORY_CATALOG.find((c) => c.cropName === 'Wheat')!;
  // Rainfall deliberately out of range (−20 for both) so neither score clamps.
  const base = { soilType: 'Loam', rainfallMm: 200, avgTempC: 22 };
  const goodWheat = scoreCrop(wheat, { ...base, soilPh: 6.5 });
  const acidWheat = scoreCrop(wheat, { ...base, soilPh: 4.0 });
  assert(goodWheat.calculatedMatchScore > acidWheat.calculatedMatchScore, 'pH out of range penalized');
  // In-range pH earns +5, out-of-range pays −35 → a40-point swing.
  assertEqual(goodWheat.calculatedMatchScore - acidWheat.calculatedMatchScore, 40, 'pH swing is +5/−35');
  const coldWheat = scoreCrop(wheat, { ...base, soilPh: 6.5, avgTempC: 2 });
  assertEqual(goodWheat.calculatedMatchScore - coldWheat.calculatedMatchScore, 30, 'temperature penalty is -30');
  console.log('✔ Penalties match the documented transparent rules');

  // Clamp bounds under extreme inputs
  const extreme = scoreCrops({ soilType: 'Sand', soilPh: 4.0, rainfallMm: 2600, avgTempC: -5 });
  assert(extreme.every((c) => c.calculatedMatchScore >= 20 && c.calculatedMatchScore <= 98), 'scores clamped20–98');
  console.log('✔ Scores clamp to20–98 under extreme inputs');

  // Soil match works with live SoilGrids texture classes
  const sandy = scoreCrops({ soilType: 'Sandy loam', soilPh: 6.5, rainfallMm: 500, avgTempC: 24 });
  const sandyTop = sandy[0];
  assert(
    sandyTop.suitableSoilTypes.some((st) => st.toLowerCase().includes('sandy loam') || 'sandy loam'.includes(st.toLowerCase())),
    'top match suits the live texture class'
  );
  console.log('✔ Scoring accepts live SoilGrids texture classes');
}

run();
console.log('All crop advisor tests passed successfully!');
