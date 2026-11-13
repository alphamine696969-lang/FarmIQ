/**
 * FarmIQ Grounded AI Agricultural Assistant Service
 * Implements RAG principles, citation validation, and strict agricultural safety gates.
 * Complies with ADR-006, FIQ-051, FIQ-052 and docs/AI_MODELS.md.
 *
 * @deprecated Superseded by the layered chatbot pipeline in
 * lib/services/assistant/pipeline.ts (FIQ-054). Kept for reference until the
 * legacy canned-response path is removed; new code must use the pipeline.
 */

import { APPROVED_SOURCES, SourceCitation } from '../data/mockDatabase';

export interface GroundedAssistantResponse {
  answer: string;
  steps: string[];
  warnings: string[];
  citations: Array<{
    sourceId: string;
    sourceName: string;
    section: string;
    url: string;
    excerpt: string;
  }>;
  evidenceStatus: 'supported' | 'partial' | 'conflicting' | 'insufficient';
  limitations: string;
}

export function generateAssistantResponse(query: string): GroundedAssistantResponse {
  const lower = query.toLowerCase();

  // Safety Gate 1: Check for dangerous chemical dosage or arbitrary pesticide mixing requests
  if (
    (lower.includes('chemical') || lower.includes('spray') || lower.includes('dose') || lower.includes('pesticide') || lower.includes('fungicide')) &&
    (lower.includes('dosage') || lower.includes('how much') || lower.includes('quantity') || lower.includes('mix'))
  ) {
    return {
      answer: "FarmIQ complies with strict agricultural safety principles (ADR-006) and does NOT output synthetic pesticide dosages or unverified chemical mixing rates without verified local official label registration.",
      steps: [
        "1. Consult your authorized local university extension office or department of agriculture agronomist.",
        "2. Review the manufacturer product label legally registered for your specific jurisdiction and target crop.",
        "3. Prioritize non-chemical integrated pest management (IPM) practices such as crop rotation, sanitizing equipment, and canopy aeration."
      ],
      warnings: [
        "Applying unverified chemical rates risks severe crop phytotoxicity, environmental contamination, and illegal chemical residue violations.",
        "Always observe mandatory Pre-Harvest Intervals (PHI) and Re-Entry Intervals (REI) specified on the local container label."
      ],
      citations: [
        {
          sourceId: APPROVED_SOURCES[2].id,
          sourceName: APPROVED_SOURCES[2].sourceName,
          section: APPROVED_SOURCES[2].section,
          url: APPROVED_SOURCES[2].canonicalUrl,
          excerpt: APPROVED_SOURCES[2].excerpt
        }
      ],
      evidenceStatus: "insufficient",
      limitations: "No approved jurisdiction-specific chemical label or authorized local extension registration was provided in the query context."
    };
  }

  // Blight or foliar disease query
  if (lower.includes('blight') || lower.includes('tomato') || lower.includes('leaf spot') || lower.includes('fungus')) {
    return {
      answer: "Early Blight (Alternaria solani) primarily affects solanaceous crops like tomatoes and potatoes. It initiates on older lower foliage following extended leaf wetness and warm temperatures (24°C–29°C).",
      steps: [
        "Prune and remove infected lower foliage (up to 12 inches off the ground) and burn/bury plant debris away from the field.",
        "Switch overhead irrigation to drip or furrow irrigation to minimize canopy moisture hours.",
        "Apply organic mulch around plant bases to prevent soil-splash spore transmission onto lower foliage.",
        "Ensure wide row spacing (minimum 60–90 cm) to encourage rapid wind-drying of morning dew."
      ],
      warnings: [
        "Do not compost blighted solanaceous foliage in home or unmonitored piles; fungal conidia can overwinter.",
        "Practice a strict 2-3 year crop rotation with non-host species (such as corn, beans, or brassicas)."
      ],
      citations: [
        {
          sourceId: APPROVED_SOURCES[2].id,
          sourceName: APPROVED_SOURCES[2].sourceName,
          section: APPROVED_SOURCES[2].section,
          url: APPROVED_SOURCES[2].canonicalUrl,
          excerpt: APPROVED_SOURCES[2].excerpt
        }
      ],
      evidenceStatus: "supported",
      limitations: "Microclimate differences and secondary bacterial co-infections may alter disease severity. Lab tissue culture recommended for persistent field blight."
    };
  }

  // Soil pH or wheat agronomy query
  if (lower.includes('wheat') || lower.includes('soil') || lower.includes('ph') || lower.includes('fertilizer') || lower.includes('nitrogen')) {
    return {
      answer: "Optimal soil pH for high-yield wheat cultivation ranges between 6.0 and 7.5 (optimal target: 6.2 - 6.8). Soil pH below 5.5 causes aluminum and manganese toxicity while reducing phosphorus availability.",
      steps: [
        "Conduct a composite grid soil test at 0-15 cm and 15-30 cm depths before seasonal seeding.",
        "If pH is below 6.0, apply agricultural lime (calcium carbonate or dolomitic lime) 2 to 3 months prior to seeding.",
        "Split nitrogen applications: apply 30% at planting, 50% during tillering/stem elongation, and remainder at flag-leaf emergence for grain protein optimization."
      ],
      warnings: [
        "Over-liming above pH 7.8 may induce zinc and iron micronutrient chlorosis.",
        "Avoid waterlogged clay soils during seed germination to prevent damping-off pathogens."
      ],
      citations: [
        {
          sourceId: APPROVED_SOURCES[0].id,
          sourceName: APPROVED_SOURCES[0].sourceName,
          section: APPROVED_SOURCES[0].section,
          url: APPROVED_SOURCES[0].canonicalUrl,
          excerpt: APPROVED_SOURCES[0].excerpt
        }
      ],
      evidenceStatus: "supported",
      limitations: "Specific nutrient recommendations require lab-verified soil test analysis (Mehlich-3 or Bray-1 P tests)."
    };
  }

  // Irrigation, weather, water requirements
  if (lower.includes('water') || lower.includes('irrigation') || lower.includes('weather') || lower.includes('drought')) {
    return {
      answer: "Crop water requirement depends on reference evapotranspiration (ET0) multiplied by the crop development coefficient (Kc). Most staple grain crops consume 450 to 650 mm of water throughout their lifecycle.",
      steps: [
        "Monitor local weather station ET0 readings and adjust daily irrigation to replenish 80-100% of evapotranspirative loss.",
        "Schedule deep irrigation events during evening or early morning to reduce solar evaporative losses.",
        "Maintain soil organic matter and cover crops to boost the water-holding capacity of sandy soils."
      ],
      warnings: [
        "Critical vulnerability occurs during reproductive flowering/pollination; water stress here causes significant flower abortion.",
        "Excessive late-season irrigation delays crop maturity and promotes fungal lodging."
      ],
      citations: [
        {
          sourceId: APPROVED_SOURCES[0].id,
          sourceName: APPROVED_SOURCES[0].sourceName,
          section: APPROVED_SOURCES[0].section,
          url: APPROVED_SOURCES[0].canonicalUrl,
          excerpt: APPROVED_SOURCES[0].excerpt
        },
        {
          sourceId: APPROVED_SOURCES[3].id,
          sourceName: APPROVED_SOURCES[3].sourceName,
          section: APPROVED_SOURCES[3].section,
          url: APPROVED_SOURCES[3].canonicalUrl,
          excerpt: APPROVED_SOURCES[3].excerpt
        }
      ],
      evidenceStatus: "supported",
      limitations: "Soil texture (clay vs sand) heavily influences effective infiltration rates."
    };
  }

  // Default general grounded agronomy response
  return {
    answer: `Regarding "${query}": In sustainable farming systems, management decisions must combine soil health, climate data, and crop physiology. Sustainable agronomy emphasizes crop rotation, soil organic matter conservation, and pest monitoring.`,
    steps: [
      "1. Record field observation logs, weather conditions, and crop growth stage.",
      "2. Check local agricultural university extension guidelines for regional crop benchmarks.",
      "3. Inspect soil moisture and root zone health before making operational changes."
    ],
    warnings: [
      "Agro-climatic conditions vary widely by altitude and soil series; verify recommendations against local conditions."
    ],
    citations: [
      {
        sourceId: APPROVED_SOURCES[0].id,
        sourceName: APPROVED_SOURCES[0].sourceName,
        section: APPROVED_SOURCES[0].section,
        url: APPROVED_SOURCES[0].canonicalUrl,
        excerpt: APPROVED_SOURCES[0].excerpt
      }
    ],
    evidenceStatus: "partial",
    limitations: "General agronomic guidance. Specific farm advice requires location coordinates, soil test reports, and historical crop logs."
  };
}
