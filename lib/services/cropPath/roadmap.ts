/**
 * FarmIQ CropPath Phase 3 — Growth Roadmap Generator (FIQ-090).
 * Deterministic stage templates scaled to the crop's growth cycle.
 * Stage expectations are descriptive (never fabricated per-crop metrics)
 * and weather alerts remain null until a live weather provider is wired.
 */

import { CropSuitabilityProfile } from '../../data/mockDatabase';
import { CropPathTracker, IrrigationType, RoadmapStage, RoadmapWeek } from './types';

interface StageTemplate {
  key: string;
  label: string;
  weeks: number;
  expected: string;
  actions: string[];
}

const CEREAL_TEMPLATE: StageTemplate[] = [
  { key: 'land_prep', label: 'Land Preparation', weeks: 1, expected: 'Field is cleared, tilled, and leveled; soil moisture is adequate for sowing.', actions: ['Clear residues and plough the field', 'Apply basal nutrients per your soil test', 'Prepare mark-row / seedbed layout'] },
  { key: 'sowing', label: 'Sowing', weeks: 1, expected: 'Seed placed at correct depth and row spacing; soil is moist at seeding depth.', actions: ['Sow seed at the recommended depth and spacing', 'Confirm seed lot germination rate', 'Label the sowing date in your records'] },
  { key: 'germination', label: 'Germination', weeks: 2, expected: 'Seedlings emerge uniformly; watch for gaps, crusting, or bird damage.', actions: ['Check emergence gaps and re-sow patchily if needed', 'Protect seedlings from birds/pests', 'Avoid waterlogging in seedling rows'] },
  { key: 'vegetative', label: 'Vegetative Growth', weeks: 5, expected: 'Rapid canopy development; leaf area expands quickly and the stand should look uniform.', actions: ['Top-dress nitrogen per your soil test schedule', 'Scout weekly for pests and deficiency signs', 'Keep weeds suppressed before canopy closes'] },
  { key: 'flowering', label: 'Flowering / Heading', weeks: 2, expected: 'Reproductive parts appear; the crop is sensitive to moisture and heat stress now.', actions: ['Avoid moisture stress during flowering', 'Scout for disease on flag leaves and heads', 'Do not apply herbicides at this stage'] },
  { key: 'grain_filling', label: 'Grain Filling', weeks: 3, expected: 'Grains fill and gain weight; maintain green leaf area as long as possible.', actions: ['Maintain even soil moisture', 'Monitor for rust/blight on upper leaves', 'Plan harvest logistics and storage'] },
  { key: 'maturity', label: 'Maturity', weeks: 2, expected: 'Grains harden and moisture declines; plants begin to yellow from the base.', actions: ['Stop irrigation as maturity nears', 'Test grain moisture before harvest', 'Arrange threshing/drying capacity'] },
  { key: 'harvest', label: 'Harvest', weeks: 1, expected: 'Crop is ready to cut and thresh; quality depends on timely harvest.', actions: ['Harvest at the right moisture window', 'Dry and clean produce before storage/sale', 'Record actual yield and costs'] }
];

const PULSE_TEMPLATE: StageTemplate[] = [
  { key: 'land_prep', label: 'Land Preparation', weeks: 1, expected: 'A fine, weed-free seedbed with good drainage for taproot development.', actions: ['Prepare a firm, well-drained seedbed', 'Inoculate seed with the approved Rhizobium strain if available', 'Plan rows for aeration'] },
  { key: 'sowing', label: 'Sowing', weeks: 1, expected: 'Seed sown shallow into moist soil; uniform depth supports even emergence.', actions: ['Sow at shallow depth into moisture', 'Calibrate seed rate per variety', 'Record sowing date and variety'] },
  { key: 'germination', label: 'Germination', weeks: 2, expected: 'Seedlings emerge; nodulation begins as roots develop.', actions: ['Check for gaps or crusting', 'Guard against seedling pests', 'Avoid waterlogging'] },
  { key: 'vegetative', label: 'Vegetative Growth', weeks: 4, expected: 'Branching and canopy build; legumes fix nitrogen once nodules form.', actions: ['Keep fields weed-free early', 'Scout for pod borers and sucking pests', 'Avoid unnecessary nitrogen top-ups'] },
  { key: 'flowering', label: 'Flowering', weeks: 2, expected: 'Flowers appear over several weeks; stress here directly cuts pod set.', actions: ['Protect from moisture stress at flowering', 'Scout for pod borer adults and eggs', 'Hold off broad-spectrum sprays'] },
  { key: 'pod_filling', label: 'Pod Filling', weeks: 3, expected: 'Pods set and fill; consistent moisture preserves seed weight.', actions: ['Maintain even soil moisture', 'Scout for pod damage weekly', 'Plan harvest windows'] },
  { key: 'maturity', label: 'Maturity', weeks: 2, expected: 'Pods dry and rattle; leaves drop as the crop matures.', actions: ['Stop irrigation near maturity', 'Check pod moisture', 'Prepare threshing/floor'] },
  { key: 'harvest', label: 'Harvest', weeks: 1, expected: 'Ready to pull/thresh when most pods are dry; avoid shattering losses.', actions: ['Harvest before shattering', 'Dry to safe storage moisture', 'Record actual yield and costs'] }
];

const HORTICULTURE_TEMPLATE: StageTemplate[] = [
  { key: 'land_prep', label: 'Land Preparation', weeks: 1, expected: 'Beds or ridges prepared with organic matter incorporated and drip lines laid if used.', actions: ['Prepare raised beds/ridges', 'Incorporate compost per soil test', 'Install drip lines/trellis if needed'] },
  { key: 'nursery_transplant', label: 'Nursery / Transplant', weeks: 1, expected: 'Healthy seedlings raised or transplanted in the evening to reduce shock.', actions: ['Raise/buy healthy seedlings', 'Transplant at correct spacing', 'Water-in transplants well'] },
  { key: 'establishment', label: 'Establishment', weeks: 2, expected: 'Seedlings settle; watch transplant shock and early wilting.', actions: ['Irrigate lightly but frequently', 'Replace dead seedlings', 'Mulch to conserve moisture'] },
  { key: 'vegetative', label: 'Vegetative Growth', weeks: 4, expected: 'Canopy builds quickly; staking/training and pruning keep the plant open.', actions: ['Train/prune for an open canopy', 'Scout for foliar disease weekly', 'Side-dress nutrients per schedule'] },
  { key: 'flowering', label: 'Flowering', weeks: 2, expected: 'Flowering is moisture- and heat-sensitive; pollination sets your yield ceiling.', actions: ['Avoid moisture stress at flowering', 'Scout for flower pests', 'Do not spray during peak bloom'] },
  { key: 'fruit_set', label: 'Fruit Set', weeks: 2, expected: 'Fruits begin setting; consistent care prevents drop and deformities.', actions: ['Keep irrigation even', 'Support heavy branches', 'Remove malformed fruit early'] },
  { key: 'fruit_development', label: 'Fruit Development', weeks: 3, expected: 'Fruits size up; disease pressure rises with humidity and canopy density.', actions: ['Scout for blight/fruit rot signs', 'Harvest-ready fruits promptly', 'Maintain sanitation in the field'] },
  { key: 'maturity', label: 'Maturity', weeks: 1, expected: 'Fruits reach harvest maturity; plan picking in cool hours.', actions: ['Check market-preferred maturity stage', 'Plan pickings and crates', 'Arrange market links'] },
  { key: 'harvest', label: 'Harvest', weeks: 1, expected: 'Multiple pickings begin; handle fruit gently to protect grade.', actions: ['Pick at preferred maturity', 'Grade and pack promptly', 'Record actual yield and costs'] }
];

function templateFor(category: string): StageTemplate[] {
  if (/pulse|legume/i.test(category)) return PULSE_TEMPLATE;
  if (/horticulture/i.test(category)) return HORTICULTURE_TEMPLATE;
  return CEREAL_TEMPLATE;
}

function wateringReminder(irrigationType: IrrigationType): string {
  switch (irrigationType) {
    case 'Drip': return 'Watering: short drip cycles every 2–3 days (check soil moisture)';
    case 'Borewell': return 'Watering: every 4–5 days (adjust to rainfall)';
    case 'Canal': return 'Watering: follow your canal rotation; supplement if dry';
    case 'Sprinkler': return 'Watering: sprinkler cycles every 3–4 days (adjust to rainfall)';
    case 'Rainfed': return 'Watering: rainfed — monitor soil moisture, no fixed schedule';
  }
}

/** Stage-based tasks. Rates always defer to soil test / official guidance (ADR-006 spirit: no invented amounts). */
function tasksForStage(stageKey: string, irrigationType: IrrigationType): {
  fertilizerTask: string;
  irrigationTask: string;
  scoutingTask: string;
} {
  const irrig = wateringReminder(irrigationType);
  switch (stageKey) {
    case 'land_prep':
      return {
        fertilizerTask: 'Incorporate basal nutrients per your soil-test report before sowing.',
        irrigationTask: 'Pre-irrigate the seedbed if soil is dry at sowing depth.',
        scoutingTask: 'Check weed pressure, residue incorporation, and soil crusting.'
      };
    case 'sowing':
      return {
        fertilizerTask: 'Apply basal dose per soil test at sowing — do not guess rates.',
        irrigationTask: 'Ensure moisture at seed depth at and after sowing.',
        scoutingTask: 'Verify uniform seed placement; note gaps for re-sowing decisions.'
      };
    case 'germination':
    case 'nursery_transplant':
    case 'establishment':
      return {
        fertilizerTask: 'Hold nitrogen until emergence/transplants are established.',
        irrigationTask: 'Light, frequent moisture — avoid crusting and waterlogging.',
        scoutingTask: 'Daily check: emergence gaps, birds, damping-off, transplant shock.'
      };
    case 'vegetative':
      return {
        fertilizerTask: 'Top-dress nitrogen per your soil-test schedule (rate comes from the soil test, never from an app).',
        irrigationTask: irrig,
        scoutingTask: 'Weekly scouting: pests, nutrient deficiency signs, weed escape.'
      };
    case 'flowering':
      return {
        fertilizerTask: 'Avoid late nitrogen at flowering; balance nutrients per soil test.',
        irrigationTask: 'Never allow moisture stress at flowering — it cuts yield potential.',
        scoutingTask: 'Disease scouting on flag leaves/flowers; pollination stress signs.'
      };
    case 'grain_filling':
    case 'pod_filling':
    case 'fruit_set':
    case 'fruit_development':
      return {
        fertilizerTask: 'Maintain nutrition per soil test; stop nitrogen if deficiency signs appear.',
        irrigationTask: 'Keep steady moisture to protect fill weight and fruit size.',
        scoutingTask: 'Upper-canopy disease and pest scouting; log anything unusual for your weekly report.'
      };
    case 'maturity':
      return {
        fertilizerTask: 'No further fertilizer applications.',
        irrigationTask: 'Taper irrigation as maturity approaches.',
        scoutingTask: 'Moisture/content checks; plan harvest logistics and storage.'
      };
    case 'harvest':
      return {
        fertilizerTask: 'None — record nutrient removal alongside your yield.',
        irrigationTask: 'None.',
        scoutingTask: 'Grain/fruit moisture and quality checks at harvest.'
      };
    default:
      return {
        fertilizerTask: 'Per soil test and local extension guidance.',
        irrigationTask: irrig,
        scoutingTask: 'Scout the crop and note anything unusual.'
      };
  }
}

export function buildRoadmap(
  profile: CropSuitabilityProfile,
  irrigationType: IrrigationType
): { stages: RoadmapStage[]; roadmap: RoadmapWeek[]; harvestWeek: number; totalWeeks: number } {
  const template = templateFor(profile.category);
  const totalWeeks = Math.max(8, Math.round(profile.growthCycleDays / 7));
  const templateWeeks = template.reduce((sum, s) => sum + s.weeks, 0);

  let scaled = template.map((s) => Math.max(1, Math.round((s.weeks * totalWeeks) / templateWeeks)));
  let assigned = scaled.reduce((a, b) => a + b, 0);
  // Absorb rounding drift on the longest stage so the plan matches the cycle length.
  while (assigned !== totalWeeks) {
    const longestIdx = scaled.indexOf(Math.max(...scaled));
    if (assigned > totalWeeks && scaled[longestIdx] > 1) {
      scaled[longestIdx] -= 1;
      assigned -= 1;
    } else if (assigned < totalWeeks) {
      scaled[longestIdx] += 1;
      assigned += 1;
    } else {
      break;
    }
  }

  const stages: RoadmapStage[] = [];
  const roadmap: RoadmapWeek[] = [];
  let week = 1;

  template.forEach((stage, i) => {
    const endWeek = week + scaled[i] - 1;
    stages.push({ key: stage.key, label: stage.label, startWeek: week, endWeek });

    for (let w = week; w <= endWeek; w += 1) {
      const actions = [...stage.actions];
      if (stage.key === 'vegetative' && w === week) {
        actions.push(`Agronomy note: ${profile.keyAgronomicAdvice}`);
      }
      const tasks = tasksForStage(stage.key, irrigationType);
      roadmap.push({
        weekNumber: w,
        stageKey: stage.key,
        stageLabel: stage.label,
        expected: stage.expected,
        actions,
        reminders: [wateringReminder(irrigationType), 'Submit your weekly CropPath report (weekly check-in)'],
        ...tasks
      });
    }
    week = endWeek + 1;
  });

  const harvestStage = stages.find((s) => s.key === 'harvest') || stages[stages.length - 1];
  return { stages, roadmap, harvestWeek: harvestStage.startWeek, totalWeeks };
}

/** Current week for a tracker, including any schedule offset from feedback. */
export function currentWeekNumber(
  sowingDate: string,
  weekOffsetDays: number,
  totalWeeks: number,
  now: Date = new Date()
): number {
  const sowing = new Date(sowingDate).getTime();
  if (Number.isNaN(sowing)) return 1;
  const elapsedDays = (now.getTime() - sowing) / 86400000 - weekOffsetDays;
  const week = Math.floor(elapsedDays / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

/** Status transition: past the final week means the crop is ready to harvest. */
export function deriveStatus(
  sowingDate: string,
  weekOffsetDays: number,
  totalWeeks: number,
  status: 'active' | 'harvest_ready' | 'completed',
  now: Date = new Date()
): 'active' | 'harvest_ready' | 'completed' {
  if (status === 'completed') return 'completed';
  const elapsedDays = (now.getTime() - new Date(sowingDate).getTime()) / 86400000 - weekOffsetDays;
  return elapsedDays >= totalWeeks * 7 ? 'harvest_ready' : 'active';
}
