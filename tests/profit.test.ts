import { calculateFarmProfit } from '../lib/calculations/profit';

function runTests() {
  console.log("Running FarmIQ Deterministic Calculation Test Suite...");

  // Test Case 1: Standard Wheat Scenario
  const wheatInput = {
    cropName: "Hard Red Winter Wheat",
    areaValue: 45,
    areaUnit: "acre" as const,
    expectedYieldPerUnitArea: 2.4,
    yieldUnit: "tonnes",
    expectedPricePerYieldUnit: 250,
    currency: "USD",
    costs: {
      seeds: 3200,
      fertilizers: 4500,
      cropProtection: 1800,
      labor: 3500,
      irrigation: 1200,
      machineryFuel: 2900,
      landRent: 4000,
      miscellaneous: 900
    }
  };

  const wheatResult = calculateFarmProfit(wheatInput);
  
  // Total production = 45 * 2.4 = 108 MT
  if (wheatResult.totalProduction !== 108) {
    throw new Error(`Expected production 108, got ${wheatResult.totalProduction}`);
  }
  
  // Gross revenue = 108 * 250 = 27000
  if (wheatResult.grossRevenue !== 27000) {
    throw new Error(`Expected gross revenue 27000, got ${wheatResult.grossRevenue}`);
  }
  
  // Total cost = 22000
  if (wheatResult.totalCost !== 22000) {
    throw new Error(`Expected total cost 22000, got ${wheatResult.totalCost}`);
  }
  
  // Net profit = 27000 - 22000 = 5000
  if (wheatResult.netProfit !== 5000) {
    throw new Error(`Expected net profit 5000, got ${wheatResult.netProfit}`);
  }
  
  if (!wheatResult.isProfitable) {
    throw new Error(`Expected isProfitable to be true`);
  }

  // Break-even yield = 22000 / (45 * 250) = 1.9555... -> 1.96
  if (wheatResult.breakEvenYieldPerUnitArea !== 1.96) {
    throw new Error(`Expected break even yield 1.96, got ${wheatResult.breakEvenYieldPerUnitArea}`);
  }

  console.log("✔ Test Case 1 passed: Standard Wheat Profitability & Break-Even calculation verified");

  // Test Case 2: Zero Revenue / Crop Failure Scenario
  const failureInput = {
    cropName: "Soybeans",
    areaValue: 10,
    areaUnit: "acre" as const,
    expectedYieldPerUnitArea: 0,
    yieldUnit: "tonnes",
    expectedPricePerYieldUnit: 400,
    currency: "USD",
    costs: {
      seeds: 1000,
      fertilizers: 1000,
      cropProtection: 0,
      labor: 500,
      irrigation: 0,
      machineryFuel: 500,
      landRent: 1000,
      miscellaneous: 0
    }
  };

  const failureResult = calculateFarmProfit(failureInput);
  if (failureResult.netProfit !== -4000) {
    throw new Error(`Expected net loss -4000, got ${failureResult.netProfit}`);
  }
  if (failureResult.isProfitable) {
    throw new Error(`Expected isProfitable to be false`);
  }

  console.log("✔ Test Case 2 passed: Crop failure & negative margin edge case verified");

  console.log("All unit tests passed successfully!");
}

runTests();
