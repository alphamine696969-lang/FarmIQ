'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  UserProfile,
  Farm,
  FarmPlot
} from '@/lib/data/userState';
import {
  Home,
  Plus,
  Layers,
  MapPin,
  CheckCircle2,
  Trash2,
  Droplets,
  Calendar,
  Save,
  Globe2
} from 'lucide-react';

export default function FarmsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Modal / Form state for adding new farm
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmCountry, setNewFarmCountry] = useState('United States');
  const [newFarmRegion, setNewFarmRegion] = useState('');
  const [newFarmArea, setNewFarmArea] = useState(50);
  const [newFarmUnit, setNewFarmUnit] = useState<'acre' | 'hectare'>('acre');

  // Form state for adding plot
  const [showAddPlotModal, setShowAddPlotModal] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotArea, setNewPlotArea] = useState(20);
  const [newPlotSoil, setNewPlotSoil] = useState('Loam');
  const [newPlotPh, setNewPlotPh] = useState(6.5);
  const [newPlotIrrigation, setNewPlotIrrigation] = useState<'Drip' | 'Sprinkler' | 'Rainfed' | 'Flood / Furrow'>('Drip');
  const [newPlotCrop, setNewPlotCrop] = useState('');

  useEffect(() => {
    const user = getStoredUserProfile();
    setProfile(user);
    if (user?.farms.length > 0) {
      setSelectedFarmId(user.activeFarmId || user.farms[0].id);
    }
  }, []);

  const activeFarm = profile?.farms.find((f) => f.id === selectedFarmId) || profile?.farms[0];

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newFarmName.trim()) return;

    const newFarm: Farm = {
      id: `farm-${Date.now()}`,
      name: newFarmName,
      country: newFarmCountry,
      region: newFarmRegion || 'Central Agricultural Zone',
      areaTotal: Number(newFarmArea),
      areaUnit: newFarmUnit,
      createdAt: new Date().toISOString().split('T')[0],
      plots: [],
    };

    const updatedProfile: UserProfile = {
      ...profile,
      farms: [...profile.farms, newFarm],
      activeFarmId: newFarm.id,
    };

    setProfile(updatedProfile);
    saveStoredUserProfile(updatedProfile);
    setSelectedFarmId(newFarm.id);
    setShowAddFarmModal(false);
    setNewFarmName('');
    setNewFarmRegion('');
  };

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeFarm || !newPlotName.trim()) return;

    const newPlot: FarmPlot = {
      id: `plot-${Date.now()}`,
      name: newPlotName,
      areaValue: Number(newPlotArea),
      areaUnit: activeFarm.areaUnit,
      soilType: newPlotSoil,
      soilPh: Number(newPlotPh),
      irrigationType: newPlotIrrigation,
      currentCrop: newPlotCrop || 'Planned Seeding',
      status: 'Planted',
    };

    const updatedFarms = profile.farms.map((f) => {
      if (f.id === activeFarm.id) {
        return {
          ...f,
          plots: [...f.plots, newPlot],
        };
      }
      return f;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      farms: updatedFarms,
    };

    setProfile(updatedProfile);
    saveStoredUserProfile(updatedProfile);
    setShowAddPlotModal(false);
    setNewPlotName('');
    setNewPlotCrop('');
  };

  const handleDeletePlot = (plotId: string) => {
    if (!profile || !activeFarm) return;
    const updatedFarms = profile.farms.map((f) => {
      if (f.id === activeFarm.id) {
        return {
          ...f,
          plots: f.plots.filter((p) => p.id !== plotId),
        };
      }
      return f;
    });
    const updatedProfile = { ...profile, farms: updatedFarms };
    setProfile(updatedProfile);
    saveStoredUserProfile(updatedProfile);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">My Farms & Field Plot Governance</h2>
              <FreshnessBadge status="supported" label="Private Tenant RLS (FIQ-030)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Manage multiple landholdings, plot soil test records, and seasonal crop cycles.
            </p>
          </div>

          <button
            onClick={() => setShowAddFarmModal(true)}
            className="px-6 py-2.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4 text-[#1C2922]" />
            <span>Add New Farm</span>
          </button>
        </div>

        {/* Farm Cards Bento Grid */}
        {(!profile?.farms || profile.farms.length === 0) ? (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-10 text-center space-y-4 shadow-bento">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center mx-auto border border-[#DCE5DC]">
              <Layers className="w-7 h-7 text-[#1BC447]" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-extrabold text-[#1C2922]">No agricultural holdings registered yet</h3>
              <p className="text-xs text-[#3D4A3B]">
                Register your farm or land holding to manage field plots, soil records, irrigation setups, and active crop stages.
              </p>
            </div>
            <button
              onClick={() => setShowAddFarmModal(true)}
              className="px-6 py-3 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#1C2922]" />
              <span>Add Your First Farm</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.farms.map((farm) => {
              const isSelected = farm.id === activeFarm?.id;
              return (
                <div
                  key={farm.id}
                  onClick={() => setSelectedFarmId(farm.id)}
                  className={`p-7 rounded-3xl border cursor-pointer transition-smooth space-y-3.5 ${
                    isSelected
                      ? 'border-[#1BC447] bg-white ring-2 ring-[#1BC447]/30 shadow-bento-hover'
                      : 'border-[#DCE5DC] bg-[#F3FCF3]/60 hover:bg-white hover:border-[#DCE5DC] shadow-bento'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                        {farm.country}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#1C2922] mt-1">{farm.name}</h3>
                      <p className="text-xs text-[#3D4A3B] flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#153D2B]" />
                        <span>{farm.region}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]">
                        <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
                      </span>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-[#DCE5DC] flex items-center justify-between text-xs font-bold">
                    <span className="text-[#153D2B] font-extrabold tabular-nums">{farm.areaTotal} {farm.areaUnit}s Total</span>
                    <span className="text-[#3D4A3B] font-semibold">{farm.plots.length} field plots</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Farm Detail & Plot Roster Bento Container */}
        {activeFarm && (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-9 shadow-bento space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE5DC] pb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3D4A3B]">Plot Management</span>
                <h3 className="text-2xl font-black text-[#153D2B] mt-0.5">{activeFarm.name}</h3>
                <p className="text-xs text-[#3D4A3B] font-medium">
                  {activeFarm.region}, {activeFarm.country} • Total acreage: <span className="tabular-nums font-bold">{activeFarm.areaTotal}</span> {activeFarm.areaUnit}s
                </p>
              </div>

              <button
                onClick={() => setShowAddPlotModal(true)}
                className="px-5 py-2.5 rounded-full bg-[#EDF6ED] hover:bg-[#1BC447] text-[#153D2B] hover:text-[#1C2922] font-extrabold text-xs transition-smooth flex items-center gap-1.5 self-start sm:self-center border border-[#DCE5DC] shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Plot to Farm</span>
              </button>
            </div>

            {/* Plot List */}
            {activeFarm.plots.length === 0 ? (
              <div className="p-8 text-center text-[#3D4A3B] space-y-2 border border-dashed border-[#DCE5DC] rounded-3xl bg-[#F3FCF3]">
                <p className="text-sm font-bold text-[#1C2922]">No plots created for this farm yet.</p>
                <p className="text-xs">Add your first plot to track soil pH, irrigation systems, and active crop cycles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeFarm.plots.map((plot) => (
                  <div
                    key={plot.id}
                    className="p-5 rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3] space-y-3 relative group hover:bg-white transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#1C2922]">{plot.name}</h4>
                        <p className="text-xs text-[#3D4A3B] font-medium">
                          <span className="tabular-nums font-bold">{plot.areaValue}</span> {plot.areaUnit}s • {plot.currentCrop || 'Fallow'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePlot(plot.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-rose-50 text-[#3D4A3B] hover:text-[#BA1A1A] transition-opacity"
                        title="Delete plot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#3D4A3B] pt-2 border-t border-[#DCE5DC]">
                      <div className="flex justify-between">
                        <span>Soil Texture:</span>
                        <strong className="text-[#1C2922]">{plot.soilType}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Soil pH:</span>
                        <strong className="text-[#153D2B] font-mono tabular-nums font-extrabold">{plot.soilPh}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Irrigation Method:</span>
                        <strong className="text-[#1C2922]">{plot.irrigationType}</strong>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Crop Cycle Status:</span>
                        <span className="text-[10px] bg-[#EDF6ED] text-[#153D2B] font-bold px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                          {plot.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Farm */}
        {showAddFarmModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-7 space-y-5 border border-[#DCE5DC] shadow-floating">
              <h3 className="text-lg font-extrabold text-[#1C2922]">Register New Farm Holding</h3>
              <form onSubmit={handleCreateFarm} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#3D4A3B] mb-1.5">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={newFarmName}
                    onChange={(e) => setNewFarmName(e.target.value)}
                    placeholder="e.g. Maple Grove Grain Estate"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3D4A3B] mb-1.5">Country / Jurisdiction</label>
                  <input
                    type="text"
                    required
                    value={newFarmCountry}
                    onChange={(e) => setNewFarmCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#3D4A3B] mb-1.5">State / Province / Region</label>
                  <input
                    type="text"
                    value={newFarmRegion}
                    onChange={(e) => setNewFarmRegion(e.target.value)}
                    placeholder="e.g. Iowa Upper Midwest"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="w-2/3">
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Total Cultivated Area</label>
                    <input
                      type="number"
                      min="1"
                      value={newFarmArea}
                      onChange={(e) => setNewFarmArea(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] tabular-nums"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Unit</label>
                    <select
                      value={newFarmUnit}
                      onChange={(e) => setNewFarmUnit(e.target.value as 'acre' | 'hectare')}
                      className="w-full px-3 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-bold"
                    >
                      <option value="acre">Acres</option>
                      <option value="hectare">Hectares</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddFarmModal(false)}
                    className="px-5 py-2.5 rounded-full border border-[#DCE5DC] text-[#3D4A3B] font-bold hover:bg-[#EDF6ED]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#1BC447] text-[#1C2922] font-extrabold shadow-glow-lime hover:bg-[#16a73c]"
                  >
                    Save Farm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Plot */}
        {showAddPlotModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-7 space-y-5 border border-[#DCE5DC] shadow-floating">
              <h3 className="text-lg font-extrabold text-[#1C2922]">Add Plot to {activeFarm?.name}</h3>
              <form onSubmit={handleCreatePlot} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#3D4A3B] mb-1.5">Plot Name</label>
                  <input
                    type="text"
                    required
                    value={newPlotName}
                    onChange={(e) => setNewPlotName(e.target.value)}
                    placeholder="e.g. West Meadow (Plot D)"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Area ({activeFarm?.areaUnit}s)</label>
                    <input
                      type="number"
                      min="1"
                      value={newPlotArea}
                      onChange={(e) => setNewPlotArea(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Soil pH</label>
                    <input
                      type="number"
                      step="0.1"
                      min="4.5"
                      max="8.5"
                      value={newPlotPh}
                      onChange={(e) => setNewPlotPh(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Soil Texture</label>
                    <select
                      value={newPlotSoil}
                      onChange={(e) => setNewPlotSoil(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                    >
                      <option value="Loam">Loam</option>
                      <option value="Clay Loam">Clay Loam</option>
                      <option value="Sandy Loam">Sandy Loam</option>
                      <option value="Silt Loam">Silt Loam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Irrigation System</label>
                    <select
                      value={newPlotIrrigation}
                      onChange={(e) => setNewPlotIrrigation(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                    >
                      <option value="Drip">Drip Irrigation</option>
                      <option value="Sprinkler">Sprinkler</option>
                      <option value="Rainfed">Rainfed</option>
                      <option value="Flood / Furrow">Flood / Furrow</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#3D4A3B] mb-1.5">Current / Planned Crop</label>
                  <input
                    type="text"
                    value={newPlotCrop}
                    onChange={(e) => setNewPlotCrop(e.target.value)}
                    placeholder="e.g. Winter Wheat or Soybeans"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddPlotModal(false)}
                    className="px-5 py-2.5 rounded-full border border-[#DCE5DC] text-[#3D4A3B] font-bold hover:bg-[#EDF6ED]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#1BC447] text-[#1C2922] font-extrabold shadow-glow-lime hover:bg-[#16a73c]"
                  >
                    Save Plot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
