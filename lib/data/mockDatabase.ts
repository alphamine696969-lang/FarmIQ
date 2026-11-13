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
    sourceName: "FAO Crop Water Requirements & Irrigation Guidelines (FAO 56)",
    organization: "Food and Agriculture Organization of the United Nations (FAO)",
    canonicalUrl: "https://www.fao.org/land-water/databases-and-software/crop-information",
    jurisdiction: "Global",
    license: "Open Access (CC BY-NC-SA 3.0 IGO)",
    publicationDate: "2023-08-15",
    section: "Chapter 3: Atmospheric Parameters and Evapotranspiration",
    excerpt: "Crop coefficients (Kc) for staple grains range from 0.3 during initial vegetative stages to 1.15 at mid-season peak flowering."
  },
  {
    id: "src-usda-02",
    sourceName: "USDA Agricultural Marketing Service (AMS) Grain Reports",
    organization: "United States Department of Agriculture",
    canonicalUrl: "https://www.ams.usda.gov/market-news/grain-transportation-report",
    jurisdiction: "North America & Global Benchmarks",
    license: "Public Domain / US Gov",
    publicationDate: "2024-10-01",
    section: "Weekly National Grain Prices & Export Basis",
    excerpt: "Historical FOB gulf basis and regional cash bids reflecting seasonal post-harvest harvest pressure."
  },
  {
    id: "src-icar-03",
    sourceName: "ICAR Crop Protection Advisory: Integrated Pest Management Handbook",
    organization: "Indian Council of Agricultural Research (ICAR)",
    canonicalUrl: "https://icar.org.in/crop-science-handbook",
    jurisdiction: "South Asia / Tropical Agro-climates",
    license: "Official Extension Publications",
    publicationDate: "2023-11-20",
    section: "Solanaceous Crops: Early Blight Management",
    excerpt: "Initial symptoms of Alternaria solani manifest as concentric dark brown rings (target board pattern) on lower foliage. Cultural management includes wide spacing and drip irrigation."
  },
  {
    id: "src-cgiar-04",
    sourceName: "CGIAR Climate-Smart Agriculture Compendium",
    organization: "Consultative Group on International Agricultural Research",
    canonicalUrl: "https://www.cgiar.org/research/climate-change/",
    jurisdiction: "Global Drylands & Smallholder Regions",
    license: "Creative Commons Attribution 4.0",
    publicationDate: "2024-02-10",
    section: "Drought Tolerant Cereals and Soil Moisture Retention",
    excerpt: "Sorghum and pearl millet demonstrate superior water-use efficiency at soil temperatures exceeding 32°C compared to conventional maize."
  }
];

export interface MarketObservation {
  id: string;
  cropName: string;
  variety: string;
  marketName: string;
  location: string;
  country: string;
  price: number;
  currency: string;
  unit: string;
  priceChangePercent24h: number;
  observationDate: string;
  isSampleData: boolean;
  status: 'live' | 'cached' | 'sample-historical';
  sourceName: string;
}

export const INITIAL_MARKET_OBSERVATIONS: MarketObservation[] = [
  {
    id: "mkt-01",
    cropName: "Wheat",
    variety: "Hard Red Winter",
    marketName: "Chicago Board & Regional Terminal",
    location: "Illinois / Midwest",
    country: "USA",
    price: 245.50,
    currency: "USD",
    unit: "MT",
    priceChangePercent24h: +1.8,
    observationDate: "2026-10-10",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "USDA AMS & Market Data Adapter"
  },
  {
    id: "mkt-02",
    cropName: "Wheat",
    variety: "Sharbati Grade A",
    marketName: "Indore APMC Mandi",
    location: "Madhya Pradesh",
    country: "India",
    price: 2850,
    currency: "INR",
    unit: "Quintal",
    priceChangePercent24h: -0.5,
    observationDate: "2026-10-10",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "Agmarknet Historical Feed"
  },
  {
    id: "mkt-03",
    cropName: "Soybeans",
    variety: "Non-GMO Feed Grade",
    marketName: "Santos Port Terminal",
    location: "São Paulo",
    country: "Brazil",
    price: 395.00,
    currency: "USD",
    unit: "MT",
    priceChangePercent24h: +2.4,
    observationDate: "2026-10-09",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "CEPEA / ESALQ Benchmark"
  },
  {
    id: "mkt-04",
    cropName: "Maize (Corn)",
    variety: "Yellow Dent #2",
    marketName: "Nairobi Wholesale Market",
    location: "Nairobi",
    country: "Kenya",
    price: 4200,
    currency: "KES",
    unit: "90kg Bag",
    priceChangePercent24h: +0.0,
    observationDate: "2026-10-08",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "East Africa Grain Council RATIN"
  },
  {
    id: "mkt-05",
    cropName: "Rice",
    variety: "Basmati 1121 Pusa",
    marketName: "Karnal Grain Market",
    location: "Haryana",
    country: "India",
    price: 3650,
    currency: "INR",
    unit: "Quintal",
    priceChangePercent24h: +1.2,
    observationDate: "2026-10-10",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "Agmarknet Historical Feed"
  },
  {
    id: "mkt-06",
    cropName: "Tomatoes",
    variety: "Hybrid Roma",
    marketName: "Central Produce Terminal",
    location: "Rotterdam",
    country: "Netherlands / EU",
    price: 1.45,
    currency: "EUR",
    unit: "kg",
    priceChangePercent24h: -3.2,
    observationDate: "2026-10-10",
    isSampleData: true,
    status: "sample-historical",
    sourceName: "EU Agrimonitor Price Watch"
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
