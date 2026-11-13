'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { SAMPLE_WEATHER_DATA } from '@/lib/data/weatherData';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Sun,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function WeatherPage() {
  const [data] = useState(SAMPLE_WEATHER_DATA);

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Agro-Meteorological Weather Intelligence</h2>
              <FreshnessBadge status="sample-historical" label="Station Model (FIQ-063)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Field-level weather forecasting tailored for evapotranspiration (ET0), soil workability, and foliar spray drift.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#3D4A3B] bg-[#EDF6ED] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold">
            <Clock className="w-3.5 h-3.5 text-[#153D2B]" />
            <span>Retrieved: {new Date(data.retrievedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Current Field-Level Snapshot (Top 6 Bento Cards with tabular figures) */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-9 shadow-bento space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5DC] pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                Active Station Reading
              </span>
              <h3 className="text-lg font-extrabold text-[#1C2922] mt-1.5">{data.locationName}</h3>
            </div>
            <span className="text-xs text-[#3D4A3B] font-mono font-semibold tabular-nums">
              Coords: {data.coordinates.lat}° N, {data.coordinates.lng}° W
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            
            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Air Temp</span>
                <Thermometer className="w-4 h-4 text-[#FD9D1A]" />
              </div>
              <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.tempC}°C</p>
              <p className="text-[11px] text-[#3D4A3B] font-medium">Feels like {data.current.feelsLikeC}°C</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Canopy RH</span>
                <Droplets className="w-4 h-4 text-[#33B3FC]" />
              </div>
              <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.humidityPercent}%</p>
              <p className="text-[11px] text-[#3D4A3B] font-medium">Dew Point: {data.current.dewPointC}°C</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Wind Speed</span>
                <Wind className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.windSpeedKmh} <span className="text-xs font-normal">km/h</span></p>
              <p className="text-[11px] text-[#153D2B] font-bold">Low drift risk</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Soil Temp</span>
                <Layers className="w-4 h-4 text-[#153D2B]" />
              </div>
              <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.soilTempC}°C</p>
              <p className="text-[11px] text-[#3D4A3B] font-medium">10 cm root zone</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Soil Moisture</span>
                <Droplets className="w-4 h-4 text-[#1BC447]" />
              </div>
              <p className="text-2xl font-black text-[#153D2B] tabular-nums">{data.current.soilMoisturePercent}%</p>
              <p className="text-[11px] text-[#3D4A3B] font-medium">Available water</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
              <div className="flex items-center justify-between text-[#3D4A3B]">
                <span className="font-bold">Solar Rad.</span>
                <Sun className="w-4 h-4 text-[#FD9D1A]" />
              </div>
              <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.solarRadiationWm2} <span className="text-xs font-normal">W/m²</span></p>
              <p className="text-[11px] text-[#3D4A3B] font-medium">UV Index: {data.current.uvIndex}</p>
            </div>

          </div>
        </div>

        {/* Agro Alerts Bento Cards */}
        <div className="space-y-3.5">
          <h3 className="text-base font-extrabold text-[#1C2922]">Active Agro-Meteorological Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-3xl border space-y-3.5 shadow-bento ${
                  alert.severity === 'high'
                    ? 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100]'
                    : 'bg-[#EDF6ED] border-[#DCE5DC] text-[#153D2B]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alert.severity === 'high' ? 'text-[#FD9D1A]' : 'text-[#1BC447]'}`} />
                    <span className="font-extrabold text-sm">{alert.title}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full ${
                    alert.severity === 'high' ? 'bg-[#FD9D1A] text-white' : 'bg-[#153D2B] text-white'
                  }`}>
                    {alert.alertType}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">{alert.description}</p>
                <div className="p-3 bg-white/90 rounded-2xl border border-current/20 text-xs font-medium">
                  <strong className="text-[#1C2922]">Recommended Field Action:</strong> {alert.agronomicAction}
                </div>
                <div className="text-[10px] text-[#3D4A3B] flex items-center justify-between pt-1 font-semibold">
                  <span>Source: {alert.sourceProvider}</span>
                  <span>Valid until: {new Date(alert.validUntil).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Agricultural Forecast Bento Container */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-8 shadow-bento space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1C2922]">7-Day Agro-Meteorological Forecast</h3>
            <span className="text-xs text-[#3D4A3B] font-bold bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC]">
              Spray Windows & Soil Workability
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#DCE5DC] text-[#3D4A3B] uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-3">Day</th>
                  <th className="py-3 px-3">Conditions</th>
                  <th className="py-3 px-3">Temp (Max/Min)</th>
                  <th className="py-3 px-3">Rain (mm / %)</th>
                  <th className="py-3 px-3">ET0 Evap.</th>
                  <th className="py-3 px-3">Spraying Window</th>
                  <th className="py-3 px-3">Soil Workability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5DC]">
                {data.forecast.map((day) => (
                  <tr key={day.date} className="hover:bg-[#F3FCF3] transition-colors">
                    <td className="py-4 px-3 font-extrabold text-[#1C2922]">
                      {day.dayName}
                      <span className="block text-[10px] font-normal text-[#3D4A3B]">{day.date}</span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-semibold text-[#1C2922]">{day.condition}</span>
                    </td>
                    <td className="py-4 px-3 font-mono font-extrabold text-[#1C2922] tabular-nums">
                      {day.tempMaxC}°C / <span className="text-[#3D4A3B] font-normal">{day.tempMinC}°C</span>
                      {day.frostRisk && (
                        <span className="ml-2 text-[10px] text-[#BA1A1A] bg-[#FDF2F2] px-2 py-0.5 rounded-full font-bold border border-[#FCDAD7]">
                          Frost Hazard
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 font-mono tabular-nums">
                      <span className="font-bold text-[#1C2922]">{day.precipitationMm} mm</span>
                      <span className="text-[10px] text-[#3D4A3B] block">({day.precipitationChance}% chance)</span>
                    </td>
                    <td className="py-4 px-3 font-mono font-extrabold text-[#153D2B] tabular-nums">
                      {day.evapotranspirationMm} mm/day
                    </td>
                    <td className="py-4 px-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold ${
                        day.sprayingWindowRating === 'Excellent' ? 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]' :
                        day.sprayingWindowRating === 'Moderate' ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]' :
                        'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {day.sprayingWindowRating}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-bold text-[#1C2922]">{day.fieldWorkability}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
