/**
 * FarmIQ Crop Advisory Catalog (FIQ-099).
 * Comprehensive agronomic reference covering major world crops across cereals,
 * pulses, oilseeds, tubers, fiber, sugar, vegetables, fruits, spices,
 * beverages, and industrial crops. Ranges are widely accepted agronomic
 * envelopes (FAO/CGIAR-class references via APPROVED_SOURCES) — they are
 * accepted-condition ranges, not guarantees, and no yield figures are claimed.
 */

export interface CropAdvisoryProfile {
  cropName: string;
  category: string;
  minTempC: number;
  maxTempC: number;
  minPh: number;
  maxPh: number;
  minRainfallMm: number;
  maxRainfallMm: number;
  /** USDA-style texture classes (matches SoilGrids classifyTexture output). */
  suitableSoilTypes: string[];
  /** Days to harvest;0 when the crop is perennial (see cycleLabel). */
  growthCycleDays: number;
  /** Display label when growthCycleDays is 0 (perennials / multi-season). */
  cycleLabel?: string;
  /**1–10 tolerance to drought/heat/marginal conditions. */
  resilienceScore: number;
  keyAgronomicAdvice: string;
  scientificReferenceId: string;
}

const LOAMY = ['Loam', 'Silt loam', 'Sandy loam', 'Clay loam'];
const WELL_DRAINED = ['Loam', 'Sandy loam', 'Silt loam'];
const LIGHT = ['Sand', 'Sandy loam', 'Loam'];
const HEAVY = ['Clay', 'Clay loam', 'Black Soil', 'Silty clay loam'];

function c(
  cropName: string,
  category: string,
  temp: [number, number],
  ph: [number, number],
  rain: [number, number],
  suitableSoilTypes: string[],
  cycle: number | string,
  resilienceScore: number,
  keyAgronomicAdvice: string,
  scientificReferenceId = 'src-fao-01'
): CropAdvisoryProfile {
  const perennial = typeof cycle === 'string';
  return {
    cropName,
    category,
    minTempC: temp[0],
    maxTempC: temp[1],
    minPh: ph[0],
    maxPh: ph[1],
    minRainfallMm: rain[0],
    maxRainfallMm: rain[1],
    suitableSoilTypes,
    growthCycleDays: perennial ? 0 : cycle,
    ...(perennial ? { cycleLabel: cycle } : {}),
    resilienceScore,
    keyAgronomicAdvice,
    scientificReferenceId
  };
}

export const CROP_ADVISORY_CATALOG: CropAdvisoryProfile[] = [
  /* ------------------------------ Cereals ------------------------------ */
  c('Wheat', 'Cereal / Grain', [10, 25], [5.5, 7.5], [400, 800], LOAMY, 130, 6, 'Cool-season cereal; sow in the cool part of the season and rotate to break cereal disease cycles.'),
  c('Rice (paddy)', 'Cereal / Grain', [20, 35], [5.5, 7.0], [1000, 2000], ['Clay', 'Clay loam', 'Silty clay loam', 'Loam'], 140, 5, 'Puddled, water-retentive soil; transplant seedlings and keep the field moist to shallow standing water as required.'),
  c('Maize (Corn)', 'Cereal / Grain', [18, 33], [5.5, 7.5], [400, 700], [...WELL_DRAINED, 'Clay loam'], 105, 6, 'Warm-season cereal; needs good drainage and steady nitrogen — irrigate through tasseling.'),
  c('Barley', 'Cereal / Grain', [12, 22], [6.0, 7.5], [400, 650], LOAMY, 105, 7, 'Short-season cereal that tolerates poorer soils and mild salinity better than wheat.'),
  c('Sorghum', 'Cereal / Grain', [20, 34], [5.5, 7.5], [300, 700], [...LIGHT, 'Clay loam'], 105, 8, 'Deep-rooted dryland cereal; drought tolerant once established — suited to warm semi-arid areas.', 'src-cgiar-04'),
  c('Pearl millet', 'Cereal / Grain', [25, 35], [5.0, 7.5], [250, 600], LIGHT, 90, 9, 'Very short, drought-tolerant cereal for poor sandy soils and late monsoon sowing.', 'src-cgiar-04'),
  c('Oats', 'Cereal / Grain', [10, 22], [5.5, 7.0], [450, 800], LOAMY, 115, 5, 'Cool-season cereal for grain or fodder; prefers reliable moisture.'),
  c('Finger millet', 'Cereal / Grain', [20, 30], [5.0, 7.5], [400, 1000], [...LOAMY, 'Sand'], 95, 8, 'Hardy short-duration millet that tolerates drought and low-fertility soils.', 'src-cgiar-04'),

  /* ------------------------------ Pulses ------------------------------ */
  c('Chickpea (Garbanzo)', 'Pulse', [15, 30], [6.0, 8.0], [300, 600], WELL_DRAINED, 105, 6, 'Cool-season pulse on well-drained soil; avoid waterlogging and follow a cereal rotation.'),
  c('Lentil', 'Pulse', [15, 25], [6.0, 8.0], [300, 550], WELL_DRAINED, 110, 5, 'Cool-season pulse; needs light, well-drained soils and a dry ripening period.'),
  c('Pigeon pea', 'Pulse', [20, 35], [5.0, 7.5], [500, 1000], LOAMY, 180, 7, 'Long-duration nitrogen-fixing pulse; deep roots improve soil structure for following crops.'),
  c('Mung bean', 'Pulse', [25, 35], [6.0, 7.5], [400, 700], WELL_DRAINED, 75, 6, 'Short-duration pulse for quick rotation; sow after the coldest period.'),
  c('Black gram', 'Pulse', [25, 35], [6.0, 8.0], [600, 1000], LOAMY, 85, 6, 'Warm-season pulse; needs reliable moisture during flowering.'),
  c('Cowpea', 'Pulse', [20, 35], [5.0, 8.0], [400, 800], [...LIGHT, 'Clay loam'], 80, 8, 'Heat- and drought-tolerant pulse; good for poor soils and intercropping.', 'src-cgiar-04'),
  c('Common bean', 'Pulse', [15, 28], [6.0, 7.5], [500, 800], WELL_DRAINED, 100, 5, 'Needs steady moisture; avoid heavy clay crusts at sowing for uniform emergence.'),
  c('Faba bean (Broad bean)', 'Pulse', [8, 20], [6.0, 8.0], [300, 650], LOAMY, 120, 5, 'Cool-season pulse; fixes nitrogen and tolerates wetter winter soils better than most pulses.'),
  c('Garden pea', 'Pulse', [10, 20], [6.0, 7.5], [450, 750], WELL_DRAINED, 105, 4, 'Cool-season vegetable pulse; needs trellising in warm spells and even moisture.'),

  /* ------------------------------ Oilseeds ------------------------------ */
  c('Soybean', 'Oilseed', [20, 30], [6.0, 7.5], [450, 850], [...LOAMY, 'Sandy loam'], 105, 6, 'Nitrogen-fixing oilseed; needs warm germination and even moisture at pod fill.'),
  c('Groundnut (Peanut)', 'Oilseed', [20, 30], [6.0, 8.0], [500, 1000], ['Sandy loam', 'Loam', 'Sand'], 115, 6, 'Pods develop in the soil — needs loose, well-drained sandy loam for good pod set.'),
  c('Rapeseed (Canola)', 'Oilseed', [10, 24], [6.0, 7.5], [450, 800], LOAMY, 120, 5, 'Cool-season oilseed; sensitive to waterlogging at establishment.'),
  c('Sunflower', 'Oilseed', [20, 30], [6.0, 7.5], [400, 750], [...WELL_DRAINED, 'Clay loam'], 110, 6, 'Deep-rooted oilseed; tolerant of moderate drought once rooted.'),
  c('Sesame', 'Oilseed', [25, 35], [5.5, 7.5], [400, 700], [...LIGHT, 'Clay loam'], 100, 7, 'Drought-tolerant oilseed for light soils; harvest before capsules shatter.'),
  c('Mustard', 'Oilseed', [10, 25], [6.0, 7.5], [400, 700], LOAMY, 115, 5, 'Cool-season oilseed; quick to mature and often grown as a rotation after rice.'),
  c('Safflower', 'Oilseed', [15, 30], [6.0, 8.0], [450, 750], [...LIGHT, 'Clay loam'], 115, 7, 'Drought-tolerant oilseed with a deep taproot; suits marginal rainfall areas.', 'src-cgiar-04'),

  /* ------------------------------ Tubers / Roots ------------------------------ */
  c('Potato', 'Tuber / Root', [10, 22], [4.5, 6.5], [500, 800], ['Sandy loam', 'Loam', 'Silt loam'], 105, 4, 'Needs cool, loose, well-drained soil; hill up tubers and avoid waterlogging.'),
  c('Sweet potato', 'Tuber / Root', [20, 30], [5.5, 6.5], [500, 900], ['Sandy loam', 'Loam', 'Sand'], 120, 7, 'Heat-tolerant tuber for light soils; thrives with less water than potato.'),
  c('Cassava', 'Tuber / Root', [22, 35], [5.5, 7.0], [600, 1500], [...LOAMY, 'Sand'], '8–12 months', 8, 'Very drought-tolerant root crop for poor soils; tolerates marginal rainfall.', 'src-cgiar-04'),
  c('Taro', 'Tuber / Root', [20, 30], [5.5, 7.0], [1000, 2000], HEAVY, '8–12 months', 5, 'Likes wet, heavy soils — ideal for low-lying fields with reliable moisture.'),
  c('Yam', 'Tuber / Root', [20, 30], [5.5, 7.0], [700, 1200], [...LOAMY, 'Sandy loam'], '9–12 months', 6, 'Needs mounded, loose soil for tuber shape; requires a long warm season.'),

  /* ------------------------------ Fiber / Sugar ------------------------------ */
  c('Cotton', 'Fiber Crop', [21, 35], [5.8, 7.5], [700, 1300], [...HEAVY, 'Loam'], 165, 6, 'Warm-season fiber crop; black cotton soil suits it — needs a long frost-free season.'),
  c('Jute', 'Fiber Crop', [20, 35], [6.0, 7.5], [1000, 1500], ['Loam', 'Silt loam', 'Clay loam'], 140, 5, 'Fast-growing fiber crop for humid alluvial soils; needs steady moisture.'),
  c('Sugarcane', 'Sugar Crop', [20, 35], [6.0, 7.5], [1500, 2500], ['Loam', 'Clay loam', 'Silt loam', 'Black Soil'], '12–16 months', 5, 'Long-duration ratoon crop; heavy water demand — needs deep fertile soil and irrigation.'),

  /* ------------------------------ Vegetables ------------------------------ */
  c('Tomato', 'Vegetable', [18, 29], [5.5, 7.0], [400, 800], ['Loam', 'Sandy loam', 'Clay loam'], 110, 5, 'Warm-season vegetable; consistent moisture prevents fruit disorders — stake indeterminate types.'),
  c('Onion', 'Vegetable', [10, 25], [5.5, 7.5], [400, 750], WELL_DRAINED, 120, 5, 'Bulbing depends on day length — choose short- or long-day types for your latitude.'),
  c('Cabbage', 'Vegetable', [12, 24], [6.0, 7.5], [500, 800], ['Loam', 'Silt loam', 'Clay loam'], 110, 5, 'Cool-season brassica; even moisture and nitrogen keep heads tight.'),
  c('Cauliflower', 'Vegetable', [15, 23], [6.0, 7.5], [550, 800], ['Loam', 'Silt loam'], 115, 4, 'Sensitive to heat — time sowing so heads form in cool weather.'),
  c('Brinjal (Eggplant)', 'Vegetable', [21, 32], [5.5, 7.5], [600, 900], ['Loam', 'Clay loam', 'Sandy loam'], 140, 6, 'Long fruiting season in the tropics; needs staking and steady moisture.'),
  c('Okra (Lady finger)', 'Vegetable', [22, 35], [6.0, 7.5], [600, 900], ['Loam', 'Sandy loam'], 80, 7, 'Heat-loving pod vegetable; harvest pods young and pick frequently.'),
  c('Chili pepper', 'Vegetable', [18, 32], [5.5, 7.0], [600, 1000], ['Loam', 'Sandy loam'], 120, 6, 'Warm-season spice-vegetable; avoid water stress at fruit set.'),
  c('Cucumber', 'Vegetable', [18, 30], [5.5, 7.5], [600, 900], ['Loam', 'Sandy loam'], 75, 5, 'Trailing vine; needs steady moisture and a trellis for straight fruit.'),
  c('Carrot', 'Vegetable', [10, 25], [6.0, 7.0], [500, 750], ['Sand', 'Sandy loam', 'Loam'], 95, 5, 'Loose stone-free soil for straight roots; thin seedlings early.'),
  c('Radish', 'Vegetable', [10, 25], [5.5, 7.0], [400, 700], ['Sandy loam', 'Loam', 'Sand'], 45, 5, 'Very quick crop — sow small batches every few weeks for continuous harvest.'),
  c('Spinach', 'Vegetable', [5, 25], [6.0, 7.5], [500, 750], ['Loam', 'Silt loam', 'Clay loam'], 45, 5, 'Cool-season leafy green; bolts in heat — sow in autumn or late winter.'),
  c('Lettuce', 'Vegetable', [8, 24], [6.0, 7.0], [500, 750], ['Loam', 'Silt loam'], 65, 4, 'Shallow roots — needs frequent light watering and cool weather.'),
  c('Pumpkin', 'Vegetable', [18, 32], [5.5, 7.0], [600, 1000], ['Loam', 'Clay loam', 'Sandy loam'], 120, 6, 'Trailing vine; needs space, warm soil and consistent moisture at fruiting.'),
  c('Bitter gourd', 'Vegetable', [24, 35], [5.5, 6.5], [700, 1200], ['Loam', 'Sandy loam'], 110, 6, 'Tropical vine for trellising; prefers warm nights and steady irrigation.'),
  c('Bottle gourd', 'Vegetable', [20, 32], [6.0, 7.0], [600, 1000], ['Loam', 'Sandy loam'], 115, 6, 'Hardy gourd vine; keep soil evenly moist for tender fruit.'),
  c('Garlic', 'Vegetable', [10, 24], [5.5, 7.5], [400, 700], WELL_DRAINED, 110, 5, 'Plant cloves in cool weather; moderate moisture while bulbs swell.'),

  /* ------------------------------ Fruits ------------------------------ */
  c('Banana', 'Fruit', [22, 32], [5.5, 7.0], [1200, 2200], ['Loam', 'Clay loam', 'Silty clay loam'], 'Perennial — harvest from 10–15 months', 4, 'Evergreen mat crop; needs deep fertile soil, wind shelter and constant moisture.'),
  c('Mango', 'Fruit', [21, 35], [5.0, 8.0], [800, 1500], ['Loam', 'Clay loam', 'Sandy loam'], 'Perennial — bearing from 3–5 years', 6, 'Needs a dry period to flower; deep soil and windbreaks for orchards.'),
  c('Papaya', 'Fruit', [20, 33], [5.5, 7.0], [1000, 1500], ['Loam', 'Sandy loam'], 'Fruiting in 10–12 months', 4, 'Fast soft-fruit tree; needs wind protection and regular feeding.'),
  c('Pineapple', 'Fruit', [18, 32], [4.5, 5.5], [1000, 1600], ['Sand', 'Sandy loam', 'Loam'], '18–20 months', 5, 'Prefers acidic, well-drained soils and a marked dry season for fruiting.'),
  c('Guava', 'Fruit', [20, 35], [4.5, 7.5], [800, 1300], ['Loam', 'Sandy loam', 'Clay loam'], 'Perennial — bearing from 2–4 years', 6, 'Extremely adaptable; tolerates poor soils and drought once established.'),
  c('Pomegranate', 'Fruit', [15, 35], [6.0, 7.5], [500, 800], ['Loam', 'Sandy loam', 'Clay loam'], 'Perennial — bearing from 3–4 years', 7, 'Drought-tolerant orchard crop; dry harvest weather avoids fruit split.'),
  c('Sweet orange (Citrus)', 'Fruit', [13, 33], [6.0, 7.5], [800, 1200], ['Loam', 'Sandy loam', 'Clay loam'], 'Perennial — bearing from 3–5 years', 5, 'Needs even moisture and frost-free winters; avoid waterlogged soils.'),
  c('Grape', 'Fruit', [15, 30], [5.5, 7.0], [500, 800], WELL_DRAINED, 'Perennial — bearing from 2–3 years', 5, 'Requires a dry ripening season — prune and train for canopy airflow.'),
  c('Apple', 'Fruit', [8, 21], [5.5, 6.8], [800, 1000], ['Loam', 'Silt loam', 'Clay loam'], 'Perennial — bearing from 3–5 years', 5, 'Temperate orchard crop needing winter chill hours and well-drained slopes.'),
  c('Watermelon', 'Fruit', [22, 32], [6.0, 7.0], [400, 700], ['Sand', 'Sandy loam', 'Loam'], 105, 5, 'Warm-season melon on light soil; needs full sun and a dry ripening period.'),
  c('Strawberry', 'Fruit', [10, 24], [5.5, 7.0], [500, 750], WELL_DRAINED, 'Perennial — bearing from first year', 4, 'Shallow-rooted berry; mulch to keep fruit clean and water evenly.'),
  c('Coconut', 'Fruit', [25, 33], [5.5, 7.5], [1500, 2500], ['Sand', 'Sandy loam', 'Loam'], 'Perennial — bearing from 6–8 years', 6, 'Coastal palm for humid tropics; needs groundwater access and full sun.'),

  /* ------------------------------ Spices / Beverages / Industrial ------------------------------ */
  c('Turmeric', 'Spice', [20, 30], [5.0, 7.5], [1000, 1800], ['Loam', 'Clay loam', 'Silty clay loam'], '8–10 months', 6, 'Shade-tolerant rhizome crop for humid zones; likes rich, moisture-retentive soil.'),
  c('Ginger', 'Spice', [20, 30], [5.5, 7.0], [1000, 1800], ['Loam', 'Clay loam'], '8–10 months', 5, 'Rhizome spice needing filtered light and steady moisture.'),
  c('Black pepper', 'Spice', [20, 32], [5.5, 6.5], [1500, 2500], ['Loam', 'Clay loam'], 'Perennial — vines bearing from 2–3 years', 5, 'Climbing vine needing a support tree and humid, shaded conditions.'),
  c('Tea', 'Beverage Crop', [18, 30], [4.5, 6.0], [1200, 2000], ['Loam', 'Silt loam', 'Clay loam'], 'Perennial — plucking from 3 years', 4, 'Acidic, well-drained hill soils with regular plucking; needs good drainage.'),
  c('Coffee (Arabica)', 'Beverage Crop', [15, 24], [5.0, 6.0], [1500, 2200], ['Loam', 'Silt loam'], 'Perennial — bearing from 3–4 years', 4, 'Shade-grown on deep, acidic soils with even rainfall.'),
  c('Rubber', 'Industrial Crop', [25, 34], [4.5, 7.0], [1200, 2500], ['Loam', 'Clay loam', 'Silty clay loam'], 'Perennial — tapping from 6–8 years', 6, 'Equatorial tree crop; needs high humidity, rainfall and wind protection.')
];

/** Distinct categories, stable order for filter UI. */
export const CROP_ADVISORY_CATEGORIES: string[] = Array.from(
  new Set(CROP_ADVISORY_CATALOG.map((crop) => crop.category))
);
