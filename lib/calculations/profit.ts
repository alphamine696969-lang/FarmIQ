/**
 * FarmIQ Profit and Break-Even Calculation Engine
 * 
 * Deterministic financial calculations for crop production economics.
 * Complies with FIQ-040 acceptance criteria and FarmIQ Product Principles.
 */

export interface ProfitCalculationInput {
  cropName: string;
  areaValue: number;
  areaUnit: 'acre' | 'hectare' | 'bigha';
  expectedYieldPerUnitArea: number; // e.g. metric tonnes or quintals per acre/ha
  yieldUnit: string; // e.g., 'tonnes', 'quintals', 'kg', 'bushels'
  expectedPricePerYieldUnit: number;
  currency: string; // e.g., 'USD', 'EUR', 'INR', 'KES'
  
  // Cost breakdown
  costs: {
    seeds: number;
    fertilizers: number;
    cropProtection: number;
    labor: number;
    irrigation: number;
    machineryFuel: number;
    landRent: number;
    miscellaneous: number;
  };
}

export interface ProfitCalculationResult {
  totalProduction: number;
  grossRevenue: number;
  totalCost: number;
  netProfit: number;
  profitPerUnitArea: number;
  costPerUnitArea: number;
  revenuePerUnitArea: number;
  breakEvenYieldPerUnitArea: number;
  breakEvenPricePerUnit: number;
  roiPercentage: number;
  marginPercentage: number;
  isProfitable: boolean;
  costBreakdownPercentages: {
    seeds: number;
    fertilizers: number;
    cropProtection: number;
    labor: number;
    irrigation: number;
    machineryFuel: number;
    landRent: number;
    miscellaneous: number;
  };
  assumptions: {
    areaValue: number;
    areaUnit: string;
    currency: string;
    yieldUnit: string;
  };
}

export function calculateFarmProfit(input: ProfitCalculationInput): ProfitCalculationResult {
  const { areaValue, areaUnit, expectedYieldPerUnitArea, yieldUnit, expectedPricePerYieldUnit, currency, costs } = input;

  // Safe defaults and bounds
  const safeArea = Math.max(0.001, areaValue);
  const safeYield = Math.max(0, expectedYieldPerUnitArea);
  const safePrice = Math.max(0, expectedPricePerYieldUnit);

  const totalCost = Math.max(
    0,
    (costs.seeds || 0) +
    (costs.fertilizers || 0) +
    (costs.cropProtection || 0) +
    (costs.labor || 0) +
    (costs.irrigation || 0) +
    (costs.machineryFuel || 0) +
    (costs.landRent || 0) +
    (costs.miscellaneous || 0)
  );

  const totalProduction = safeArea * safeYield;
  const grossRevenue = totalProduction * safePrice;
  const netProfit = grossRevenue - totalCost;

  const profitPerUnitArea = safeArea > 0 ? netProfit / safeArea : 0;
  const costPerUnitArea = safeArea > 0 ? totalCost / safeArea : 0;
  const revenuePerUnitArea = safeArea > 0 ? grossRevenue / safeArea : 0;

  // Break-even yield per unit area = totalCost / (safeArea * safePrice)
  const breakEvenYieldPerUnitArea = safePrice > 0 ? totalCost / (safeArea * safePrice) : 0;

  // Break-even price per unit yield = totalCost / totalProduction
  const breakEvenPricePerUnit = totalProduction > 0 ? totalCost / totalProduction : 0;

  // ROI (%) = (Net Profit / Total Cost) * 100
  const roiPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : (grossRevenue > 0 ? 100 : 0);

  // Profit Margin (%) = (Net Profit / Gross Revenue) * 100
  const marginPercentage = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  // Cost breakdown percentages
  const costBreakdownPercentages = {
    seeds: totalCost > 0 ? Number(((costs.seeds / totalCost) * 100).toFixed(1)) : 0,
    fertilizers: totalCost > 0 ? Number(((costs.fertilizers / totalCost) * 100).toFixed(1)) : 0,
    cropProtection: totalCost > 0 ? Number(((costs.cropProtection / totalCost) * 100).toFixed(1)) : 0,
    labor: totalCost > 0 ? Number(((costs.labor / totalCost) * 100).toFixed(1)) : 0,
    irrigation: totalCost > 0 ? Number(((costs.irrigation / totalCost) * 100).toFixed(1)) : 0,
    machineryFuel: totalCost > 0 ? Number(((costs.machineryFuel / totalCost) * 100).toFixed(1)) : 0,
    landRent: totalCost > 0 ? Number(((costs.landRent / totalCost) * 100).toFixed(1)) : 0,
    miscellaneous: totalCost > 0 ? Number(((costs.miscellaneous / totalCost) * 100).toFixed(1)) : 0,
  };

  return {
    totalProduction: Number(totalProduction.toFixed(2)),
    grossRevenue: Number(grossRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    profitPerUnitArea: Number(profitPerUnitArea.toFixed(2)),
    costPerUnitArea: Number(costPerUnitArea.toFixed(2)),
    revenuePerUnitArea: Number(revenuePerUnitArea.toFixed(2)),
    breakEvenYieldPerUnitArea: Number(breakEvenYieldPerUnitArea.toFixed(2)),
    breakEvenPricePerUnit: Number(breakEvenPricePerUnit.toFixed(2)),
    roiPercentage: Number(roiPercentage.toFixed(1)),
    marginPercentage: Number(marginPercentage.toFixed(1)),
    isProfitable: netProfit >= 0,
    costBreakdownPercentages,
    assumptions: {
      areaValue: safeArea,
      areaUnit,
      currency,
      yieldUnit,
    },
  };
}
