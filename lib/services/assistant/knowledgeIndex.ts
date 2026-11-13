/**
 * FarmIQ local knowledge index for the assistant pipeline.
 *
 * While the Supabase pgvector store is unconfigured (FIQ-020 pending), retrieval runs
 * against this in-memory index. Chunks are derived from the repository's existing
 * approved datasets (lib/data/mockDatabase.ts) and FarmIQ feature documentation.
 * No content is invented here; every chunk carries its source label and, where
 * applicable, the approved source id it is grounded in.
 */

import {
  APPROVED_SOURCES,
  CROP_SUITABILITY_DB,
  DISEASE_KNOWLEDGE_BASE
} from '../../data/mockDatabase';
import { KnowledgeBase, RetrievedChunk } from './types';

export interface KnowledgeChunkDefinition {
  chunkId: string;
  kbName: KnowledgeBase;
  content: string;
  sourceId?: string;
  sourceLabel: string;
  sourceUrl?: string;
}

function sourceById(id: string) {
  return APPROVED_SOURCES.find((source) => source.id === id);
}

/** Crop profile chunks generated from the existing suitability dataset. */
function cropChunks(): KnowledgeChunkDefinition[] {
  return CROP_SUITABILITY_DB.map((crop) => ({
    chunkId: `kb_crops-${crop.cropName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    kbName: 'kb_crops' as KnowledgeBase,
    content:
      `${crop.cropName} (${crop.category}). Optimal temperature: ${crop.optimalTempC}. ` +
      `Optimal soil pH: ${crop.optimalPh} (accepted range ${crop.minPh}-${crop.maxPh}). ` +
      `Seasonal rainfall requirement: ${crop.minRainfallMm}-${crop.maxRainfallMm} mm. ` +
      `Suitable soils: ${crop.suitableSoilTypes.join(', ')}. Growth cycle: about ${crop.growthCycleDays} days. ` +
      `Typical yield potential: ${crop.potentialYieldPerAcre} per acre. Resilience score: ${crop.resilienceScore}/10. ` +
      `Agronomic note: ${crop.keyAgronomicAdvice}`,
    sourceId: crop.scientificReferenceId,
    sourceLabel: sourceById(crop.scientificReferenceId)?.sourceName ?? 'FarmIQ crop dataset',
    sourceUrl: sourceById(crop.scientificReferenceId)?.canonicalUrl
  }));
}

/** Disease profile chunks generated from the existing disease knowledge base. */
function diseaseChunks(): KnowledgeChunkDefinition[] {
  return DISEASE_KNOWLEDGE_BASE.map((entry) => ({
    chunkId: `kb_diseases-${entry.id}`,
    kbName: 'kb_diseases' as KnowledgeBase,
    content:
      `${entry.conditionName} affects ${entry.crop}. Pathogen type: ${entry.pathogenType}. ` +
      `Symptoms: ${entry.symptoms.join('; ')}. Visual indicators: ${entry.visualIndicators}. ` +
      `Preventative cultural practices: ${entry.preventativeCulturalPractices.join('; ')}. ` +
      `Non-chemical options: ${entry.biologicalAndOrganicOptions.join('; ')}. ` +
      `${entry.officialRegulationNotice}`,
    sourceId: entry.sourceCitationId,
    sourceLabel: sourceById(entry.sourceCitationId)?.sourceName ?? 'FarmIQ disease dataset',
    sourceUrl: sourceById(entry.sourceCitationId)?.canonicalUrl
  }));
}

const STATIC_CHUNKS: KnowledgeChunkDefinition[] = [
  {
    chunkId: 'kb_agronomy-001',
    kbName: 'kb_agronomy',
    content:
      'Crop water requirement equals reference evapotranspiration (ET0) multiplied by the crop coefficient (Kc). ' +
      'Kc for staple grains ranges from about 0.3 in early vegetative stages to about 1.15 at mid-season flowering. ' +
      'Most staple grain crops consume 450 to 650 mm of water across a full season. ' +
      'Irrigate to replenish evapotranspiration losses, scheduling deep irrigation in early morning or evening to reduce evaporation.',
    sourceId: 'src-fao-01',
    sourceLabel: APPROVED_SOURCES[0].sourceName,
    sourceUrl: APPROVED_SOURCES[0].canonicalUrl
  },
  {
    chunkId: 'kb_agronomy-002',
    kbName: 'kb_agronomy',
    content:
      'Optimal soil pH for high-yield wheat cultivation ranges between 6.0 and 7.5, targeting 6.2 to 6.8. ' +
      'Below pH 5.5, aluminum and manganese toxicity reduces phosphorus availability. ' +
      'Apply agricultural lime 2 to 3 months before seeding when pH is below 6.0, based on a composite grid soil test at 0-15 cm and 15-30 cm depths. ' +
      'Split nitrogen applications: roughly 30% at planting, 50% during tillering and stem elongation, and the remainder at flag-leaf emergence.',
    sourceLabel: 'FarmIQ agronomy guides (derived from FAO 56 crop profiles)',
    sourceUrl: APPROVED_SOURCES[0].canonicalUrl
  },
  {
    chunkId: 'kb_agronomy-003',
    kbName: 'kb_agronomy',
    content:
      'Drought-tolerant cereals: sorghum and pearl millet demonstrate superior water-use efficiency at soil temperatures above 32°C compared with conventional maize. ' +
      'Maintain soil organic matter and use cover crops to improve water-holding capacity on sandy soils. ' +
      'Water stress during flowering and pollination causes significant flower abortion and yield loss in most grain crops.',
    sourceId: 'src-cgiar-04',
    sourceLabel: APPROVED_SOURCES[3].sourceName,
    sourceUrl: APPROVED_SOURCES[3].canonicalUrl
  },
  {
    chunkId: 'kb_schemes-001',
    kbName: 'kb_schemes',
    content:
      'Government support schemes for farmers commonly include direct income support programs (for example PM-KISAN in India), credit lines such as the Kisan Credit Card (KCC), subsidized crop insurance, and minimum support price (MSP) procurement for notified crops. ' +
      'Eligibility, enrollment windows, and payment schedules vary by country and state. ' +
      'FarmIQ does not store live scheme figures; verify current details with your national agriculture ministry portal or local agriculture office before acting.',
    sourceLabel: 'Government schemes knowledge base (verification guidance)',
    sourceUrl: 'https://www.india.gov.in/topics/agriculture'
  },
  {
    chunkId: 'kb_schemes-002',
    kbName: 'kb_schemes',
    content:
      'Minimum Support Price (MSP) applies only to notified crops in notified markets and is announced per marketing season (Kharif and Rabi). ' +
      'Procurement typically requires enrollment in the relevant state procurement system and, for sales, a valid farmer registration. ' +
      'Always confirm the current season MSP table from the official government release; third-party numbers can be outdated.',
    sourceLabel: 'Government schemes knowledge base (verification guidance)',
    sourceUrl: 'https://agriwelfare.gov.in'
  },
  {
    chunkId: 'kb_markets-001',
    kbName: 'kb_markets',
    content:
      'Mandi and market price observations in FarmIQ are shown with their observation date and status (live, cached, sample-historical, or unavailable). ' +
      'Never treat historical or sample observations as today\u2019s live price. ' +
      'For official Indian market data, refer to Agmarknet or e-NAM portals; FarmIQ\u2019s market module links each observation to its stated provider.',
    sourceLabel: 'Market guides knowledge base',
    sourceUrl: 'https://agmarknet.gov.in'
  },
  {
    chunkId: 'kb_markets-002',
    kbName: 'kb_markets',
    content:
      'Selling tips from extension literature: compare prices across nearby mandis before selling, account for transport cost and grading, and consider storage only if price differences exceed safe storage costs and losses. ' +
      'Record the weight slip, grade, and final price for each sale to build your own price history. ' +
      'FarmIQ\u2019s profit calculator can combine your sale price with production costs to estimate net realization.',
    sourceLabel: 'Market guides knowledge base'
  },
  {
    chunkId: 'kb_farmiq-001',
    kbName: 'kb_farmiq',
    content:
      'FarmIQ features: an AI assistant grounded in approved sources, crop market prices with comparison and history, a farm profit and break-even calculator, crop suitability guidance, image-assisted crop disease assessment, weather forecasts with agriculture-relevant alerts, and multi-farm plot management. ' +
      'Every data-driven screen shows source, date, geography, and whether data is live, cached, sample, or unavailable.',
    sourceLabel: 'FarmIQ feature documentation'
  },
  {
    chunkId: 'kb_farmiq-002',
    kbName: 'kb_farmiq',
    content:
      'The FarmIQ profit calculator estimates gross revenue, total cost, net profit, break-even yield, break-even price, ROI, and margin from your inputs. ' +
      'It is a planning aid with transparent assumptions, not a guarantee of market outcomes. ' +
      'Scenarios you save are private to your account.',
    sourceLabel: 'FarmIQ feature documentation'
  },
  {
    chunkId: 'kb_farmiq-003',
    kbName: 'kb_farmiq',
    content:
      'FarmIQ\u2019s disease scanner supports image-assisted assessment only for supported crops and conditions, returns candidate labels with limitations instead of a guaranteed diagnosis, and never outputs unverified pesticide dosages. ' +
      'Treatment-specific chemical instructions require verification against the official product label registered in your jurisdiction or authorized local extension guidance.',
    sourceLabel: 'FarmIQ feature documentation'
  },
  {
    chunkId: 'kb_farmiq-004',
    kbName: 'kb_farmiq',
    content:
      'FarmIQ is a global smart-farming platform. The assistant answers from an approved knowledge base and clearly states when evidence is insufficient. ' +
      'It does not replace a qualified agronomist, veterinarian, plant pathologist, or local extension officer.',
    sourceLabel: 'FarmIQ feature documentation'
  }
];

let cachedIndex: RetrievedChunk[] | null = null;

/** The full local index as retrieval-ready chunks. */
export function getLocalKnowledgeIndex(): RetrievedChunk[] {
  if (cachedIndex) return cachedIndex;
  const definitions = [...cropChunks(), ...diseaseChunks(), ...STATIC_CHUNKS];
  cachedIndex = definitions.map((definition) => ({
    chunkId: definition.chunkId,
    kbName: definition.kbName,
    content: definition.content,
    sourceId: definition.sourceId,
    sourceLabel: definition.sourceLabel,
    sourceUrl: definition.sourceUrl,
    similarity: 0
  }));
  return cachedIndex;
}

/** Exposed for tests so repeated runs never share mutated similarity state. */
export function resetLocalKnowledgeIndexCache(): void {
  cachedIndex = null;
}
