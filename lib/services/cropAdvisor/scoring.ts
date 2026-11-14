/**
 * Crop Advisor suitability scoring (FIQ-099).
 * Deterministic scoring of the full crop catalog against plot parameters —
 * moved out of the page so it is testable. Penalties are transparent:
 * pH out of range −35 (in range +5), temperature out of range −30,
 * rainfall out of range −20, unsuitable soil texture −15; final score clamped
 * to 20–98. Inputs come from live location context (climate + SoilGrids) or
 * manual override — never invented by the model.
 */
import { CropAdvisoryProfile, CROP_ADVISORY_CATALOG } from '../../data/cropCatalog';
import { APPROVED_SOURCES, SourceCitation } from '../../data/mockDatabase';

export interface AdvisorInputs {
  soilType: string;
  soilPh: number;
  rainfallMm: number;
  avgTempC: number;
}

export interface ScoredCrop extends CropAdvisoryProfile {
  calculatedMatchScore: number;
  citation: SourceCitation | undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreCrop(crop: CropAdvisoryProfile, inputs: AdvisorInputs): ScoredCrop {
  let score = 100;

  if (inputs.soilPh < crop.minPh || inputs.soilPh > crop.maxPh) {
    score -= 35;
  } else {
    score += 5;
  }

  if (inputs.avgTempC < crop.minTempC || inputs.avgTempC > crop.maxTempC) {
    score -= 30;
  }

  if (inputs.rainfallMm < crop.minRainfallMm || inputs.rainfallMm > crop.maxRainfallMm) {
    score -= 20;
  }

  const soilType = inputs.soilType.toLowerCase();
  const soilMatch = crop.suitableSoilTypes.some(
    (st) => st.toLowerCase().includes(soilType) || soilType.includes(st.toLowerCase())
  );
  if (!soilMatch) {
    score -= 15;
  }

  return {
    ...crop,
    calculatedMatchScore: clamp(Math.round(score), 20, 98),
    citation: APPROVED_SOURCES.find((s) => s.id === crop.scientificReferenceId)
  };
}

/** Score the entire catalog, best match first. */
export function scoreCrops(
  inputs: AdvisorInputs,
  catalog: CropAdvisoryProfile[] = CROP_ADVISORY_CATALOG
): ScoredCrop[] {
  return catalog.map((crop) => scoreCrop(crop, inputs)).sort((a, b) => b.calculatedMatchScore - a.calculatedMatchScore);
}
