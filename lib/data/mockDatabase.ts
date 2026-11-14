/**
 * FarmIQ Verified Agricultural Datasets & Local Storage Mock Store
 * Grounded in real agronomic parameters according to FarmIQ Product Principles.
 */

export interface SourceCitation {
  id: string;
  sourceName: string;
  organization: string;
  canonicalUrl: string;
  jurisdiction: string;
  license: string;
  publicationDate: string;
  section: string;
  excerpt: string;
}

export const APPROVED_SOURCES: SourceCitation[] = [
  {
    id: "src-fao-01",
    sourceName: "FAO Irrigation Paper 56 — Crop Evapotranspiration",
    organization: "Food and Agriculture Organization of the United Nations (FAO)",
    canonicalUrl: "https://www.fao.org/3/x0490e/x0490e00.htm",
    jurisdiction: "Global",
    license: "Open Access",
    publicationDate: "1998-01-01",
    section: "Crop coefficients and water requirements",
    excerpt: "FAO Irrigation Paper 56 defines crop evapotranspiration and crop-coefficient (Kc) methodology used worldwide for irrigation scheduling."
  },
  {
    id: "src-usda-02",
    sourceName: "USDA Agricultural Marketing Service (AMS) Market News",
    organization: "United States Department of Agriculture",
    canonicalUrl: "https://www.ams.usda.gov/market-news",
    jurisdiction: "North America & Global Benchmarks",
    license: "Public Domain / US Gov",
    publicationDate: "2026-01-01",
    section: "Daily grain and commodity market reports",
    excerpt: "USDA AMS Market News publishes official daily cash bids, movement, and grading information for grains and commodities."
  },
  {
    id: "src-icar-03",
    sourceName: "Directorate of Plant Protection, Quarantine & Storage (India)",
    organization: "Department of Agriculture & Farmers' Welfare, Government of India",
    canonicalUrl: "https://ppqs.gov.in/",
    jurisdiction: "India",
    license: "Official Government Publication",
    publicationDate: "2026-01-01",
    section: "Plant protection advisories, IPM guidelines, quarantine protocols",
    excerpt: "PPQS publishes official plant protection advisories, integrated pest management guidelines, and quarantine protocols for Indian agriculture."
  },
  {
    id: "src-cgiar-04",
    sourceName: "CGIAR Research on Climate-Smart Agriculture",
    organization: "Consultative Group on International Agricultural Research",
    canonicalUrl: "https://www.cgiar.org/research/",
    jurisdiction: "Global Drylands & Smallholder Regions",
    license: "Creative Commons Attribution 4.0",
    publicationDate: "2026-01-01",
    section: "Climate-smart agriculture and drought-tolerant crops",
    excerpt: "CGIAR research programs publish evidence on climate-smart agriculture, drought-tolerant cereals, and soil moisture retention for smallholders."
  },
  {
    id: "src-fao-05",
    sourceName: "FAO Plant Production & Protection",
    organization: "Food and Agriculture Organization of the United Nations (FAO)",
    canonicalUrl: "https://www.fao.org/plant-production-protection/en/",
    jurisdiction: "Global",
    license: "Open Access",
    publicationDate: "2026-01-01",
    section: "Integrated pest management and plant health guidance",
    excerpt: "FAO's plant production and protection program publishes integrated pest management guidance and plant health standards for sustainable crop production."
  },
  {
    id: "src-fao-06",
    sourceName: "FAO Global Information and Early Warning System (GIEWS)",
    organization: "Food and Agriculture Organization of the United Nations (FAO)",
    canonicalUrl: "https://www.fao.org/giews/en/",
    jurisdiction: "Global",
    license: "Open Access",
    publicationDate: "2026-01-01",
    section: "Food supply, demand, and price monitoring",
    excerpt: "FAO GIEWS monitors global food supply, demand, and commodity price developments with official country and market analyses."
  }
];

export interface CropSuitabilityProfile {
  cropName: string;
  category: string;
  minTempC: number;
  maxTempC: number;
  optimalTempC: string;
  minPh: number;
  maxPh: number;
  optimalPh: string;
  minRainfallMm: number;
  maxRainfallMm: number;
  suitableSoilTypes: string[];
  growthCycleDays: number;
  potentialYieldPerAcre: string;
  resilienceScore: number; // 1-10
  keyAgronomicAdvice: string;
  scientificReferenceId: string;
}

export const CROP_SUITABILITY_DB: CropSuitabilityProfile[] = [
  {
    cropName: "Wheat",
    category: "Cereal / Grain",
    minTempC: 10,
    maxTempC: 25,
    optimalTempC: "15°C - 20°C",
    minPh: 6.0,
    maxPh: 7.5,
    optimalPh: "6.2 - 7.0",
    minRainfallMm: 350,
    maxRainfallMm: 750,
    suitableSoilTypes: ["Loam", "Clay Loam", "Silt Loam"],
    growthCycleDays: 120,
    potentialYieldPerAcre: "1.8 - 2.5 Metric Tonnes",
    resilienceScore: 8,
    keyAgronomicAdvice: "Requires cool vegetative period followed by dry, sunny ripening conditions. Sensitive to waterlogging during tillering.",
    scientificReferenceId: "src-fao-01"
  },
  {
    cropName: "Maize (Corn)",
    category: "Cereal / Grain",
    minTempC: 18,
    maxTempC: 34,
    optimalTempC: "22°C - 28°C",
    minPh: 5.8,
    maxPh: 7.2,
    optimalPh: "6.0 - 6.8",
    minRainfallMm: 500,
    maxRainfallMm: 900,
    suitableSoilTypes: ["Well-drained Loam", "Sandy Loam", "Silt"],
    growthCycleDays: 110,
    potentialYieldPerAcre: "3.5 - 5.0 Metric Tonnes",
    resilienceScore: 7,
    keyAgronomicAdvice: "High nitrogen requirement. Critical water requirement during tasseling and silking stages; drought stress at pollination causes significant yield loss.",
    scientificReferenceId: "src-fao-01"
  },
  {
    cropName: "Soybeans",
    category: "Legume / Oilseed",
    minTempC: 18,
    maxTempC: 32,
    optimalTempC: "20°C - 26°C",
    minPh: 6.0,
    maxPh: 7.0,
    optimalPh: "6.3 - 6.8",
    minRainfallMm: 450,
    maxRainfallMm: 800,
    suitableSoilTypes: ["Fertile Loam", "Clay Loam"],
    growthCycleDays: 105,
    potentialYieldPerAcre: "1.2 - 1.8 Metric Tonnes",
    resilienceScore: 8,
    keyAgronomicAdvice: "Fixes atmospheric nitrogen via Rhizobium symbiosis. Excellent rotational crop before grains to restore soil nitrogen reserves.",
    scientificReferenceId: "src-cgiar-04"
  },
  {
    cropName: "Tomatoes",
    category: "Horticulture",
    minTempC: 16,
    maxTempC: 30,
    optimalTempC: "21°C - 24°C",
    minPh: 5.8,
    maxPh: 6.8,
    optimalPh: "6.2 - 6.5",
    minRainfallMm: 600,
    maxRainfallMm: 1200,
    suitableSoilTypes: ["Rich Sandy Loam", "Loam with organic matter"],
    growthCycleDays: 85,
    potentialYieldPerAcre: "12 - 20 Metric Tonnes",
    resilienceScore: 5,
    keyAgronomicAdvice: "Highly vulnerable to foliar fungal pathogens in high humidity. Drip irrigation and trellising significantly suppress blight incidence.",
    scientificReferenceId: "src-icar-03"
  },
  {
    cropName: "Chickpeas (Garbanzo)",
    category: "Pulses / Legume",
    minTempC: 12,
    maxTempC: 28,
    optimalTempC: "18°C - 24°C",
    minPh: 6.2,
    maxPh: 8.0,
    optimalPh: "6.5 - 7.5",
    minRainfallMm: 300,
    maxRainfallMm: 550,
    suitableSoilTypes: ["Well-drained Black Soil", "Sandy Loam"],
    growthCycleDays: 100,
    potentialYieldPerAcre: "0.8 - 1.4 Metric Tonnes",
    resilienceScore: 9,
    keyAgronomicAdvice: "High drought tolerance. Deep taproot system accesses subsoil moisture. Excessive vegetative moisture induces Ascochyta blight.",
    scientificReferenceId: "src-cgiar-04"
  }
];

export interface DiseaseAssessmentCase {
  id: string;
  crop: string;
  conditionName: string;
  pathogenType: 'Fungus' | 'Bacterium' | 'Virus' | 'Abiotic Stress';
  symptoms: string[];
  visualIndicators: string;
  preventativeCulturalPractices: string[];
  biologicalAndOrganicOptions: string[];
  officialRegulationNotice: string;
  sourceCitationId: string;
}

export const DISEASE_KNOWLEDGE_BASE: DiseaseAssessmentCase[] = [
  {
    id: "dis-01",
    crop: "Tomato & Potato",
    conditionName: "Early Blight (Alternaria solani)",
    pathogenType: "Fungus",
    symptoms: [
      "Target-board concentric rings on older lower leaves",
      "Yellow halo surrounding brown necrotic lesions",
      "Stem collar rot in younger transplants",
      "Premature leaf drop starting from bottom canopy"
    ],
    visualIndicators: "Dark brown to black lesions with concentric ridges; lesions do not cross large leaf veins initially.",
    preventativeCulturalPractices: [
      "Rotate with non-solanaceous crops for 2-3 years",
      "Prune lower foliage 12 inches above soil to prevent soil splash",
      "Apply drip or furrow irrigation instead of overhead sprinklers",
      "Ensure minimum 60cm row spacing for canopy aeration"
    ],
    biologicalAndOrganicOptions: [
      "Bacillus subtilis bio-fungicide preventative sprays",
      "Copper hydroxide or Bordeaux mixture strictly according to certified regional organic schedules"
    ],
    officialRegulationNotice: "SAFETY COMPLIANCE (ADR-006): FarmIQ strictly prohibits generic synthetic chemical dosages. Consult your regional certified agricultural extension officer or authorized pesticide label for local legal clearance.",
    sourceCitationId: "src-icar-03"
  },
  {
    id: "dis-02",
    crop: "Wheat & Barley",
    conditionName: "Leaf Rust (Puccinia triticina)",
    pathogenType: "Fungus",
    symptoms: [
      "Small, round to oval orange-brown pustules on leaf blades",
      "Powdery orange spores rubbing off on fingers",
      "Disrupted photosynthesis causing shriveled grains"
    ],
    visualIndicators: "Randomly scattered bright orange pustules on upper leaf surface, later turning dark brown/black near maturity.",
    preventativeCulturalPractices: [
      "Plant certified rust-resistant cultivar varieties with multi-gene resistance",
      "Eliminate volunteer wheat seedlings that act as a green bridge",
      "Calibrate planting date to avoid peak regional spore flights"
    ],
    biologicalAndOrganicOptions: [
      "Preventative Trichoderma viride seed treatments",
      "Monitoring spore traps and regional rust forecasting networks"
    ],
    officialRegulationNotice: "SAFETY COMPLIANCE: Fungicide interventions must follow local university extension thresholds and verified harvest clearance intervals.",
    sourceCitationId: "src-fao-01"
  },
  {
    id: "dis-03",
    crop: "Corn (Maize)",
    conditionName: "Northern Corn Leaf Blight (Exserohilum turcicum)",
    pathogenType: "Fungus",
    symptoms: [
      "Long elliptical cigar-shaped grayish-green lesions (2.5 to 15 cm)",
      "Dark fungal spores visible inside lesions during damp weather",
      "Complete leaf necrosis leading to premature plant death"
    ],
    visualIndicators: "Cigar-shaped grayish-tan lesions extending along leaf veins with distinct borders.",
    preventativeCulturalPractices: [
      "Crop rotation with soybeans or legumes to interrupt fungal residue cycle",
      "Deep tillage of crop residue where appropriate to accelerate decomposition",
      "Select resistant maize hybrids with Ht-gene resistance"
    ],
    biologicalAndOrganicOptions: [
      "Bio-inoculant seed coatings",
      "Balanced potassium fertilization to strengthen stalk and leaf cell walls"
    ],
    officialRegulationNotice: "SAFETY COMPLIANCE: Economic threshold evaluation required before any treatment. Verify with official extension guides.",
    sourceCitationId: "src-usda-02"
  }
];
