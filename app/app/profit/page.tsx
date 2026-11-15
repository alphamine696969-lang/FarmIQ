'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  calculateFarmProfit,
  ProfitCalculationInput,
  ProfitCalculationResult
} from '@/lib/calculations/profit';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  UserProfile,
  SavedProfitScenario
} from '@/lib/data/userState';
import {
  Calculator,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Layers,
  FileCheck,
  CheckCircle2,
  Trash2,
  ArrowRight,
  PieChart
} from 'lucide-react';

export default function ProfitPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form input state
  const [cropName, setCropName] = useState('');
  const [areaValue, setAreaValue] = useState(0);
  const [areaUnit, setAreaUnit] = useState<'acre' | 'hectare' | 'bigha'>('acre');
  const [expectedYield, setExpectedYield] = useState(0);
  const [yieldUnit, setYieldUnit] = useState('tonnes');
  const [expectedPrice, setExpectedPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');

  // Costs
  const [seedsCost, setSeedsCost] = useState(0);
  const [fertCost, setFertCost] = useState(0);
  const [protectCost, setProtectCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [irrigCost, setIrrigCost] = useState(0);
  const [machineryCost, setMachineryCost] = useState(0);
  const [rentCost, setRentCost] = useState(0);
  const [miscCost, setMiscCost] = useState(0);

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  useEffect(() => {
    const user = getStoredUserProfile();
    setProfile(user);
    if (user?.preferences.preferredCurrency) {
      setCurrency(user.preferences.preferredCurrency);
    }
  }, []);

  // Compute live deterministic results
  const inputPayload: ProfitCalculationInput = {
    cropName,
    areaValue,
    areaUnit,
    expectedYieldPerUnitArea: expectedYield,
    yieldUnit,
    expectedPricePerYieldUnit: expectedPrice,
    currency,
    costs: {
      seeds: seedsCost,
      fertilizers: fertCost,
      cropProtection: protectCost,
      labor: laborCost,
      irrigation: irrigCost,
      machineryFuel: machineryCost,
      landRent: rentCost,
      miscellaneous: miscCost,
    },
  };

  const results: ProfitCalculationResult = calculateFarmProfit(inputPayload);

  const handleSaveScenario = () => {
    if (!profile) return;
    const newScenario: SavedProfitScenario = {
      id: `scen-${Date.now()}`,
      name: `${cropName} — ${areaValue} ${areaUnit}s (${new Date().toLocaleDateString()})`,
      createdAt: new Date().toISOString().split('T')[0],
      input: inputPayload,
      result: results,
    };

    const updatedProfile: UserProfile = {
      ...profile,
      savedScenarios: [newScenario, ...profile.savedScenarios],
    };

    setProfile(updatedProfile);
    saveStoredUserProfile(updatedProfile);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 2500);
  };

  const handleLoadScenario = (scen: SavedProfitScenario) => {
    setCropName(scen.input.cropName);
    setAreaValue(scen.input.areaValue);
    setAreaUnit(scen.input.areaUnit);
    setExpectedYield(scen.input.expectedYieldPerUnitArea);
    setYieldUnit(scen.input.yieldUnit);
    setExpectedPrice(scen.input.expectedPricePerYieldUnit);
    setCurrency(scen.input.currency);
    setSeedsCost(scen.input.costs.seeds);
    setFertCost(scen.input.costs.fertilizers);
    setProtectCost(scen.input.costs.cropProtection);
    setLaborCost(scen.input.costs.labor);
    setIrrigCost(scen.input.costs.irrigation);
    setMachineryCost(scen.input.costs.machineryFuel);
    setRentCost(scen.input.costs.landRent);
    setMiscCost(scen.input.costs.miscellaneous);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    const updated = {
      ...profile,
      savedScenarios: profile.savedScenarios.filter((s) => s.id !== id),
    };
    setProfile(updated);
    saveStoredUserProfile(updated);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Farm Profit & Break-Even Calculator</h2>
              <FreshnessBadge status="supported" label="Deterministic Math (FIQ-040)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Calculate total production, break-even yields, operating margins, and compare crop scenarios with mathematical precision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveScenario}
              className="px-6 py-2.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#1C2922]" />
              <span>{savedSuccessMsg ? 'Scenario Saved!' : 'Save Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Inputs (6 cols) & Outputs (6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Section (6 cols Bento Card) */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
            <h3 className="text-base font-extrabold text-[#1C2922] border-b border-[#DCE5DC] pb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <Calculator className="w-4 h-4 text-[#1BC447]" />
              </div>
              <span>Production & Revenue Parameters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#3D4A3B] mb-1.5">Crop Name</label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3D4A3B] mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60 cursor-pointer font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#3D4A3B] mb-1.5">Cultivated Area</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={areaValue}
                    onChange={(e) => setAreaValue(Number(e.target.value))}
                    className="w-2/3 px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60 tabular-nums"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as 'acre' | 'hectare')}
                    className="w-1/3 px-2 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]/60 cursor-pointer font-bold text-xs"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#3D4A3B] mb-1.5">Expected Yield per {areaUnit}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={expectedYield}
                    onChange={(e) => setExpectedYield(Number(e.target.value))}
                    className="w-2/3 px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60 tabular-nums"
                  />
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-1/3 px-2 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]/60 cursor-pointer font-bold text-xs"
                  >
                    <option value="tonnes">Tonnes (MT)</option>
                    <option value="quintals">Quintals</option>
                    <option value="bushels">Bushels</option>
                    <option value="kg">Kilograms</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-[#3D4A3B] mb-1.5">
                  Expected Selling Price per {yieldUnit} ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60 font-mono font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Detailed Operating Costs Breakdown */}
            <div className="space-y-4 pt-4 border-t border-[#DCE5DC]">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-extrabold text-[#1C2922]">Operating Costs Breakdown ({currency})</h4>
                <span className="text-xs text-[#153D2B] font-mono font-extrabold tabular-nums bg-[#EDF6ED] px-3 py-1 rounded-full border border-[#DCE5DC]">
                  Total: {currency} {results.totalCost.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Certified Seeds</label>
                  <input
                    type="number"
                    value={seedsCost}
                    onChange={(e) => setSeedsCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Fertilizers & Nutrients</label>
                  <input
                    type="number"
                    value={fertCost}
                    onChange={(e) => setFertCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Crop Protection / IPM</label>
                  <input
                    type="number"
                    value={protectCost}
                    onChange={(e) => setProtectCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Hired Labor</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Irrigation Energy & Water</label>
                  <input
                    type="number"
                    value={irrigCost}
                    onChange={(e) => setIrrigCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Machinery & Diesel Fuel</label>
                  <input
                    type="number"
                    value={machineryCost}
                    onChange={(e) => setMachineryCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Land Lease / Rent</label>
                  <input
                    type="number"
                    value={rentCost}
                    onChange={(e) => setRentCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
                <div>
                  <label className="block text-[#3D4A3B] font-semibold mb-1">Miscellaneous / Contingency</label>
                  <input
                    type="number"
                    value={miscCost}
                    onChange={(e) => setMiscCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-[#1C2922] font-mono tabular-nums bg-[#F3FCF3]/60"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Results & Economic Indicators (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Primary Net Profit Bento Card (Deep Forest Anchor #153D2B) */}
            <div className={`p-7 rounded-3xl border shadow-floating space-y-4 ${
              results.isProfitable ? 'bg-[#153D2B] text-white border-[#1C4D37]' : 'bg-[#BA1A1A] text-white border-rose-900'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#1BC447] font-extrabold">
                    Projected Net Farm Profit
                  </span>
                  <p className="text-4xl font-black font-mono mt-1 text-[#1BC447] tabular-nums">
                    {currency} {results.netProfit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-[#0E281C] text-[#1BC447] px-3 py-1 rounded-full font-extrabold border border-[#1C4D37] tabular-nums">
                    {results.marginPercentage}% Margin
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/60">Gross Revenue:</span>
                  <p className="font-bold text-white text-sm font-mono tabular-nums">{currency} {results.grossRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-white/60">Total Cost:</span>
                  <p className="font-bold text-white text-sm font-mono tabular-nums">{currency} {results.totalCost.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-white/60">Return on Investment:</span>
                  <p className="font-bold text-[#1BC447] text-sm font-mono tabular-nums">{results.roiPercentage}%</p>
                </div>
              </div>
            </div>

            {/* Break-Even Analysis Bento Box */}
            <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-4">
              <h4 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1BC447]" />
                <span>Break-Even Sensitivity Benchmarks</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <span className="text-[#3D4A3B] font-bold">Break-Even Yield</span>
                  <p className="text-2xl font-black text-[#1C2922] font-mono tabular-nums">
                    {results.breakEvenYieldPerUnitArea} {yieldUnit}
                  </p>
                  <p className="text-[11px] text-[#3D4A3B]">Minimum required harvest per {areaUnit}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <span className="text-[#3D4A3B] font-bold">Break-Even Selling Price</span>
                  <p className="text-2xl font-black text-[#1C2922] font-mono tabular-nums">
                    {currency} {results.breakEvenPricePerUnit}
                  </p>
                  <p className="text-[11px] text-[#3D4A3B]">Minimum farm-gate price per {yieldUnit}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <span className="text-[#3D4A3B] font-bold">Profit per {areaUnit}</span>
                  <p className="text-xl font-extrabold text-[#153D2B] font-mono tabular-nums">
                    {currency} {results.profitPerUnitArea}
                  </p>
                  <p className="text-[11px] text-[#3D4A3B]">Net gain across {areaValue} {areaUnit}s</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <span className="text-[#3D4A3B] font-bold">Cost per {areaUnit}</span>
                  <p className="text-xl font-extrabold text-[#1C2922] font-mono tabular-nums">
                    {currency} {results.costPerUnitArea}
                  </p>
                  <p className="text-[11px] text-[#3D4A3B]">Total capital invested per {areaUnit}</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Percentages */}
            <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-3">
              <h4 className="text-sm font-extrabold text-[#1C2922] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#1BC447]" />
                <span>Cost Distribution (% of Total Budget)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-[#F3FCF3] p-2.5 rounded-xl border border-[#DCE5DC]">
                  <span className="text-[#3D4A3B] font-medium">Seeds:</span>
                  <p className="font-extrabold text-[#1C2922] font-mono tabular-nums">{results.costBreakdownPercentages.seeds}%</p>
                </div>
                <div className="bg-[#F3FCF3] p-2.5 rounded-xl border border-[#DCE5DC]">
                  <span className="text-[#3D4A3B] font-medium">Fertilizer:</span>
                  <p className="font-extrabold text-[#1C2922] font-mono tabular-nums">{results.costBreakdownPercentages.fertilizers}%</p>
                </div>
                <div className="bg-[#F3FCF3] p-2.5 rounded-xl border border-[#DCE5DC]">
                  <span className="text-[#3D4A3B] font-medium">Labor:</span>
                  <p className="font-extrabold text-[#1C2922] font-mono tabular-nums">{results.costBreakdownPercentages.labor}%</p>
                </div>
                <div className="bg-[#F3FCF3] p-2.5 rounded-xl border border-[#DCE5DC]">
                  <span className="text-[#3D4A3B] font-medium">Machinery:</span>
                  <p className="font-extrabold text-[#1C2922] font-mono tabular-nums">{results.costBreakdownPercentages.machineryFuel}%</p>
                </div>
              </div>
            </div>

            {/* Saved Scenarios Comparison List */}
            {profile?.savedScenarios && profile.savedScenarios.length > 0 ? (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-4">
                <h4 className="text-sm font-extrabold text-[#1C2922]">Saved Scenarios in Workspace</h4>
                <div className="space-y-2">
                  {profile.savedScenarios.map((scen) => (
                    <div
                      key={scen.id}
                      onClick={() => handleLoadScenario(scen)}
                      className="p-3.5 rounded-2xl border border-[#DCE5DC] hover:border-[#1BC447]/60 bg-[#F3FCF3] hover:bg-white cursor-pointer transition-smooth flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-[#1C2922]">{scen.name}</p>
                        <p className="text-[11px] text-[#3D4A3B]">
                          Net Profit: <strong className="text-[#153D2B] font-mono tabular-nums">{scen.input.currency} {scen.result.netProfit.toLocaleString()}</strong> ({scen.result.marginPercentage}% margin)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#3D4A3B]">{scen.createdAt}</span>
                        <button
                          onClick={(e) => handleDeleteScenario(scen.id, e)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-[#3D4A3B] hover:text-[#BA1A1A] transition-colors"
                          title="Delete scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento text-center space-y-2">
                <h4 className="text-sm font-extrabold text-[#1C2922]">No Saved Scenarios</h4>
                <p className="text-xs text-[#3D4A3B]">
                  Fill in your crop parameters and costs above, then click &quot;Save Scenario&quot; to keep track of your seasonal models.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </AppShell>
  );
}
