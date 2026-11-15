/**
 * FarmIQ local knowledge index for the assistant pipeline.
 *
 * Preloaded static resources (hard-coded scheme/market/feature chunks) were
 * removed in ADR-018: the assistant now grounds fresh questions with the
 * web-search tool and the Supabase pgvector store when configured.
 *
 * What remains is only the crop and disease profile material derived from the
 * repository's approved datasets (lib/data/mockDatabase.ts, cropCatalog.ts) —
 * used as an offline fallback so the pipeline still degrades honestly when no
 * search or database provider is available (ADR-005/ADR-008). No content is
 * invented here; every chunk carries its source label and, where applicable,
 * the approved source id it is grounded in.
 */

import {
  APPROVED_SOURCES,
  DISEASE_KNOWLEDGE_BASE
} from '../../data/mockDatabase';
import { CROP_ADVISORY_CATALOG } from '../../data/cropCatalog';
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

/** Crop profile chunks generated from the full advisory catalog (all crops). */
function cropChunks(): KnowledgeChunkDefinition[] {
  return CROP_ADVISORY_CATALOG.map((crop) => ({
    chunkId: `kb_crops-${crop.cropName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    kbName: 'kb_crops' as KnowledgeBase,
    content:
      `${crop.cropName} (${crop.category}). Accepted temperature range: ${crop.minTempC}-${crop.maxTempC}°C. ` +
      `Accepted soil pH: ${crop.minPh}-${crop.maxPh}. Seasonal rainfall requirement: ${crop.minRainfallMm}-${crop.maxRainfallMm} mm. ` +
      `Suitable soils: ${crop.suitableSoilTypes.join(', ')}. Growth cycle: ${crop.cycleLabel || `about ${crop.growthCycleDays} days`}. ` +
      `Resilience score: ${crop.resilienceScore}/10. Agronomic note: ${crop.keyAgronomicAdvice}`,
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

let cachedIndex: RetrievedChunk[] | null = null;

/** Offline fallback index: approved crop + disease profiles only (no preloaded statics). */
export function getLocalKnowledgeIndex(): RetrievedChunk[] {
  if (cachedIndex) return cachedIndex;
  const definitions = [...cropChunks(), ...diseaseChunks()];
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
