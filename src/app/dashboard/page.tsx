"use client";

import { useMemo, useEffect, useState } from "react";
import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import { useLanguage } from "@/contexts/LanguageContext";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { database } from "@/firebase/config";
import Sidebar from "@/components/Sidebar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Link from "next/link";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PlantProfileForm from "@/components/PlantProfileForm";
import SmartCalendar, { SmartCalendarPointEvent, SmartCalendarBackgroundStage } from "@/components/SmartCalendar";
import WeatherEcoAlert from "@/components/WeatherEcoAlert";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import PlantDetailPanel from "@/components/PlantDetailPanel";
import { buildPestRiskAlert, calculateAgronomyData } from "@/utils/agronomyCalculator";

// Interface for historical data
interface HistoricalDataPoint {
  timestamp: number;
  moisture: number;
  airTemp: number;
  airHumidity: number;
  soilADC: number;
  rainADC: number;
  weather: string;
}

type PlantProfile = {
  api_plant_id: number;
  jenis_tanaman: string;
  tanggal_tanam: string;
  luas_lahan_hektar: number;
  estimasi_hasil_ton: number;
  kebutuhan_air_harian_unit: string;
  gambar_tanaman: string;
  predicted_harvest_date?: string;
  predicted_harvest_label?: string;
};

// Get current time greeting
const getGreeting = (t: (key: string) => string) => {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.greeting.morning');
  if (hour < 15) return t('dashboard.greeting.afternoon');
  if (hour < 18) return t('dashboard.greeting.evening');
  return t('dashboard.greeting.night');
};

// Get temperature status
const getTemperatureStatus = (temp: number, t: (key: string) => string) => {
  if (temp >= 35) return { label: t('dashboard.status.high'), className: "badge-high" };
  if (temp >= 28) return { label: t('dashboard.status.medium'), className: "badge-medium" };
  return { label: t('dashboard.status.normal'), className: "badge-low" };
};

// Get humidity status
const getHumidityStatus = (humidity: number, t: (key: string) => string) => {
  if (humidity >= 80) return { label: t('dashboard.status.high'), className: "badge-high" };
  if (humidity >= 60) return { label: t('dashboard.status.medium'), className: "badge-medium" };
  return { label: t('dashboard.status.normal'), className: "badge-low" };
};

// Get moisture status for soil
const getMoistureStatus = (moisture: number, t: (key: string) => string) => {
  if (moisture >= 70) return { label: t('dashboard.status.wet'), className: "badge-low" };
  if (moisture >= 40) return { label: t('dashboard.status.normal'), className: "badge-medium" };
  if (moisture >= 20) return { label: t('dashboard.status.dry'), className: "badge-medium" };
  return { label: t('dashboard.status.veryDry'), className: "badge-high" };
};

// Loading Screen Component
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { data: soilData, loading, error } = useSoilMoistureData();
  const { t } = useLanguage();
  const { forecast } = useWeatherForecast();
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [plantProfile, setPlantProfile] = useState<PlantProfile | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [sopTasks, setSopTasks] = useState<
    Array<{
      id: string;
      title: string;
      dateISO: string;
      category: string;
      priority: "low" | "medium" | "high";
      description?: string;
      dosage?: string;
      notes?: string;
    }>
  >([]);

  const [sopGenerating, setSopGenerating] = useState(false);
  const [sopError, setSopError] = useState<string | null>(null);

  async function generateSopForProfile(input: {
    namaTanaman: string;
    tanggalTanam: string;
    tanggalPanen?: string;
  }) {
    setSopError(null);

    const tanggalPanen = input.tanggalPanen;
    if (!tanggalPanen) {
      setSopError(
        "Prediksi tanggal panen belum tersedia. Jalankan AI Analysis / pastikan estimasi panen muncul di Plant Profile dulu."
      );
      return;
    }

    try {
      setSopGenerating(true);

      const res = await fetch("/api/agronomy-sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTanaman: input.namaTanaman,
          tanggalTanam: input.tanggalTanam,
          tanggalPanen,
          weather: forecast
            ? {
                city: forecast.city?.name,
                list: forecast.list,
              }
            : undefined,
        }),
      });

      const data = (await res.json()) as
        | { ok: true; tasks: typeof sopTasks }
        | { ok: false; error?: string; details?: string };

      if (!res.ok || !data.ok) {
        const msg = "error" in data && data.error ? data.error : "Gagal generate SOP";
        const details = "details" in data && data.details ? `: ${data.details}` : "";
        throw new Error(`${msg}${details}`);
      }

      setSopTasks(data.tasks);
    } catch (e) {
      setSopError(e instanceof Error ? e.message : "Gagal generate SOP");
    } finally {
      setSopGenerating(false);
    }
  }

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch historical data from Firebase
  useEffect(() => {
    const historyRef = ref(database, "sensorData/history");
    const historyQuery = query(historyRef, orderByChild("timestamp"), limitToLast(20));

    const unsubscribe = onValue(historyQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data: HistoricalDataPoint[] = [];
        snapshot.forEach((child) => {
          const point = child.val();
          data.push({
            timestamp: point.timestamp || Date.now(),
            moisture: point.moisture || 0,
            airTemp: point.airTemp || 0,
            airHumidity: point.airHumidity || 0,
            soilADC: point.soilADC || 0,
            rainADC: point.rainADC || 0,
            weather: point.weather || "Unknown"
          });
        });
        // Sort by timestamp
        data.sort((a, b) => a.timestamp - b.timestamp);
        setHistoricalData(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load plant profile from Firebase
  useEffect(() => {
    const profileRef = ref(database, "devices/dummy_device/plant_profile");
    const unsubscribe = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlantProfile(snapshot.val() as PlantProfile);
      } else {
        setPlantProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Format data for charts
  const chartData = useMemo(() => {
    return historicalData.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString("id-ID", { 
        hour: "2-digit", 
        minute: "2-digit",
        second: "2-digit"
      }),
      moisture: point.moisture,
      airTemp: point.airTemp,
      airHumidity: point.airHumidity,
      timestamp: point.timestamp
    }));
  }, [historicalData]);

  // Calculate stats
  const stats = useMemo(() => {
    const tempStatus = getTemperatureStatus(soilData.airTemp, t);
    const humidityStatus = getHumidityStatus(soilData.airHumidity, t);
    const moistureStatus = getMoistureStatus(soilData.moisture, t);
    // Check if data is recent (within last 5 minutes)
    const isActive = soilData.timestamp > 0 && (Date.now() - soilData.timestamp) < 300000;
    
    return {
      temperature: soilData.airTemp,
      humidity: soilData.airHumidity,
      moisture: soilData.moisture,
      pumpStatus: soilData.pumpStatus,
      weather: soilData.weather,
      tempStatus,
      humidityStatus,
      moistureStatus,
      isActive
    };
  }, [soilData, t]);

  if (loading) {
    return <LoadingScreen t={t} />;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="content-header">
          <div className="header-left">
            <h1>{getGreeting(t)}! 👋</h1>
            <p>{t('dashboard.subtitle')}</p>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="header-date">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>
                {currentTime.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className="header-date">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className={`status-indicator ${stats.isActive ? "active" : "inactive"}`}>
              <span className="status-dot"></span>
              <span>{stats.isActive ? "Online" : "Offline"}</span>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Air Temperature */}
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.temperature.toFixed(1)}°C</span>
              <span className="stat-label">{t('stats.airTemp')}</span>
            </div>
            <span className={`badge ${stats.tempStatus.className}`}>{stats.tempStatus.label}</span>
          </div>

          {/* Air Humidity */}
          <div className="stat-card">
            <div className="stat-icon cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.humidity}%</span>
              <span className="stat-label">{t('stats.airHumidity')}</span>
            </div>
            <span className={`badge ${stats.humidityStatus.className}`}>{stats.humidityStatus.label}</span>
          </div>

          {/* Soil Moisture */}
          <Link href="/soil-moisture" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.moisture}%</span>
              <span className="stat-label">{t('stats.soilMoisture')}</span>
            </div>
            <span className={`badge ${stats.moistureStatus.className}`}>{stats.moistureStatus.label}</span>
          </Link>

          {/* Weather Status */}
          <div className="stat-card">
            <div className={`stat-icon ${stats.weather === "Hujan" ? "blue" : "yellow"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {stats.weather === "Hujan" ? (
                  <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.8M8 19v2m0-8v2m8 6v2m0-8v2m-4 6v2m0-8v2" />
                ) : (
                  <circle cx="12" cy="12" r="5" />
                )}
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.weather === "Hujan" ? t('dashboard.weather.rainy') : t('dashboard.weather.sunny')}</span>
              <span className="stat-label">{t('stats.weather')}</span>
            </div>
            <span className={`badge ${stats.weather === "Hujan" ? "badge-medium" : "badge-low"}`}>
              {stats.weather === "Hujan" ? "🌧️" : "☀️"}
            </span>
          </div>

          {/* System Status */}
          <div className="stat-card">
            <div className={`stat-icon ${stats.isActive ? "green" : "red"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value capitalize">{stats.isActive ? t('dashboard.status.online') : t('dashboard.status.offline')}</span>
              <span className="stat-label">{t('stats.systemStatus')}</span>
            </div>
          </div>

          {/* Pump Status */}
          <div className="stat-card">
            <div className={`stat-icon ${stats.pumpStatus === "ON" ? "orange" : "gray"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pumpStatus}</span>
              <span className="stat-label">{t('stats.pumpStatus')}</span>
            </div>
            <span className={`badge ${stats.pumpStatus === "ON" ? "badge-high" : "badge-low"}`}>
              {stats.pumpStatus === "ON" ? t('dashboard.status.active') : t('dashboard.status.standby')}
            </span>
          </div>

          {/* Last Update */}
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">{t('stats.lastUpdate')}</span>
            </div>
            <span className="badge badge-live">
              <span className="live-dot"></span>
              {t('dashboard.status.live')}
            </span>
          </div>
        </div>


        {/* Smart Farm Setup & Planning */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: setup form */}
            <div className="space-y-6">
              <PlantProfileForm
                onSelectedPlantIdChange={setSelectedPlantId}
                onSaved={(p) => {
                  // Trigger SOP generation immediately after saving profile
                  void generateSopForProfile({
                    namaTanaman: p.jenis_tanaman,
                    tanggalTanam: p.tanggal_tanam,
                    tanggalPanen: p.predicted_harvest_date,
                  });
                }}
              />
              <WeatherEcoAlert forecast={forecast} />
            </div>

            {/* Right: detail panel (appears after selection) + calendar below it */}
            <div className="space-y-6">
              {sopError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {sopError}
                </div>
              ) : null}

              {sopGenerating ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Generating SOP AI...
                </div>
              ) : null}

              <PlantDetailPanel
                plantId={selectedPlantId}
                visible={Boolean(selectedPlantId)}
              />
              <SmartCalendar
                initialDateISO={plantProfile?.tanggal_tanam}
                defaultCropName={plantProfile?.jenis_tanaman}
                defaultHarvestDateISO={plantProfile?.predicted_harvest_date}
                sopTasks={sopTasks}
                onSopTasksChange={setSopTasks}
                backgroundStages={((): SmartCalendarBackgroundStage[] => {
                  if (!plantProfile?.tanggal_tanam) return [];

                  // We only have harvest season label from Perenual here;
                  // for full phenotype blocks we use a default umurPanenHari.
                  const agr = calculateAgronomyData({
                    tanggalTanamISO: plantProfile.tanggal_tanam,
                    // These three numbers are required for ubinan estimation.
                    // If your profile uses different field names, adjust here.
                    luasTotal: Number((plantProfile as unknown as { luas_lahan_hektar?: number }).luas_lahan_hektar ?? 0),
                    luasPetakUbinan: Number((plantProfile as unknown as { luas_petak_ubinan?: number }).luas_petak_ubinan ?? 0),
                    hasilUbinan: Number((plantProfile as unknown as { hasil_panen_petak_ubinan?: number }).hasil_panen_petak_ubinan ?? 0),
                    umurPanenHari: 90,
                  });

                  return agr.stages.map((s) => ({
                    id: `stage-${s.stage}`,
                    title:
                      s.stage === "vegetative"
                        ? "Fase Vegetatif"
                        : s.stage === "generative"
                          ? "Fase Generatif"
                          : "Fase Pematangan",
                    startISO: s.startISO,
                    endISO: s.endISO,
                    color: s.color,
                  }));
                })()}
                pointEvents={((): SmartCalendarPointEvent[] => {
                  if (!plantProfile?.tanggal_tanam) return [];

                  const agr = calculateAgronomyData({
                    tanggalTanamISO: plantProfile.tanggal_tanam,
                    luasTotal: Number((plantProfile as unknown as { luas_lahan_hektar?: number }).luas_lahan_hektar ?? 0),
                    luasPetakUbinan: Number((plantProfile as unknown as { luas_petak_ubinan?: number }).luas_petak_ubinan ?? 0),
                    hasilUbinan: Number((plantProfile as unknown as { hasil_panen_petak_ubinan?: number }).hasil_panen_petak_ubinan ?? 0),
                    umurPanenHari: 90,
                  });

                  const pointEvents: SmartCalendarPointEvent[] = agr.tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    dateISO: t.dateISO,
                    color: t.color,
                    textColor: t.textColor,
                    extendedProps: t.extendedProps,
                  }));

                  // Weather-based pest risk on tomorrow (simple MVP)
                  const tomorrow = forecast?.list?.[1];
                  if (tomorrow) {
                    const dateISO = new Date(tomorrow.dt * 1000).toISOString().slice(0, 10);
                    const alert = buildPestRiskAlert({
                      dateISO,
                      pop: tomorrow.pop,
                      main: tomorrow.weather?.[0]?.main,
                      pestSusceptibility: "medium",
                    });
                    if (alert) {
                      pointEvents.push({
                        id: alert.id,
                        title: alert.title,
                        dateISO: alert.dateISO,
                        color: alert.color,
                        textColor: alert.textColor,
                        extendedProps: alert.extendedProps,
                      });
                    }
                  }

                  return pointEvents;
                })()}
              />
            </div>
          </div>
        </div>

{/* Charts Row - Time Series */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">📊 {t('chart.title')}</h2>
                <p className="text-gray-600 mt-1">{t('chart.description')}</p>
              </div>
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                {t('dashboard.status.liveUpdate')}
              </span>
            </div>
            
            {chartData.length > 0 ? (
              <div className="space-y-8">
                {/* Soil Moisture Chart */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🌱</span>
                    {t('chart.soilMoisture')}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9CAB84" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9CAB84" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F6F0D7" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                        label={{ value: t('chart.moistureLabel'), angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #C5D89D',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(137, 152, 109, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="moisture" 
                        stroke="#9CAB84" 
                        strokeWidth={2}
                        fill="url(#colorMoisture)" 
                        name={t('chart.soilMoistureUnit')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Air Temperature Chart */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🌡️</span>
                    {t('chart.airTemp')}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F6F0D7" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                        label={{ value: t('chart.tempLabel'), angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #C5D89D',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(137, 152, 109, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="airTemp" 
                        stroke="#9CAB84" 
                        strokeWidth={3}
                        dot={{ fill: '#9CAB84', r: 4 }}
                        activeDot={{ r: 6 }}
                        name={t('chart.airTempUnit')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Air Humidity Chart */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <span className="text-2xl mr-2">💨</span>
                    {t('chart.airHumidity')}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5D89D" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#C5D89D" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F6F0D7" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#89986D"
                        style={{ fontSize: '12px' }}
                        label={{ value: t('chart.humidityLabel'), angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #C5D89D',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(137, 152, 109, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="airHumidity" 
                        stroke="#C5D89D" 
                        strokeWidth={2}
                        fill="url(#colorHumidity)" 
                        name={t('chart.airHumidityUnit')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600">{t('common.loadingHistory')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Alert Section */}
        {stats.temperature >= 35 && (
          <div className="alert-card alert-danger">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>⚠️ {t('dashboard.alert.highTemp')}</h4>
              <p>{t('dashboard.alert.highTempDesc').replace('{temp}', stats.temperature.toFixed(1))}</p>
            </div>
          </div>
        )}

        {stats.humidity >= 80 && (
          <div className="alert-card alert-warning">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>💧 {t('dashboard.alert.highHumidity')}</h4>
              <p>{t('dashboard.alert.highHumidityDesc').replace('{humidity}', String(stats.humidity))}</p>
            </div>
          </div>
        )}

        {stats.moisture < 20 && (
          <div className="alert-card alert-danger">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>🌱 {t('dashboard.alert.lowMoisture')}</h4>
              <p>
                {t('dashboard.alert.lowMoistureDesc')
                  .replace('{moisture}', String(stats.moisture))
                  .replace('{pumpStatus}', stats.pumpStatus === "ON" ? t('dashboard.alert.pumpActive') : t('dashboard.alert.pumpWillActivate'))}
                {' '}
                <Link href="/soil-moisture" className="underline font-semibold">{t('dashboard.viewDetailLink')} →</Link>
              </p>
            </div>
          </div>
        )}

        {stats.weather === "Hujan" && stats.pumpStatus === "ON" && (
          <div className="alert-card alert-warning">
            <div className="alert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.8M8 19v2m0-8v2m8 6v2m0-8v2m-4 6v2m0-8v2" />
              </svg>
            </div>
            <div className="alert-content">
              <h4>🌧️ {t('dashboard.alert.rainDetected')}</h4>
              <p>{t('dashboard.alert.rainDetectedDesc')}</p>
            </div>
          </div>
        )}



        {/* Footer */}
        <footer className="dashboard-footer">
          <p>{t('dashboard.footer')}</p>
        </footer>
      </main>
    </div>
  );
}