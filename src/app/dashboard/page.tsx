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
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

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

        {/* Sections Grid - Tanah, Udara, Cuaca */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Section 1: Tanah (Soil) */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-green-800 flex items-center">
                <span className="text-3xl mr-3">🌱</span>
                {t('dashboard.section.soil')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">{t('stats.soilMoisture')}</span>
                  <span className="text-2xl font-bold text-green-700">{stats.moisture}%</span>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${stats.moisture}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">{t('stats.pumpStatus')}</span>
                  <span className={`text-xl font-bold ${stats.pumpStatus === "ON" ? "text-orange-600" : "text-gray-600"}`}>
                    {stats.pumpStatus}
                  </span>
                </div>
              </div>
              <Link 
                href="/soil-moisture"
                className="block w-full mt-4 px-4 py-3 bg-green-600 text-white text-center rounded-xl hover:bg-green-700 transition font-semibold"
              >
                {t('dashboard.viewDetail')} →
              </Link>
            </div>
          </div>

          {/* Section 2: Udara (Air) */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blue-800 flex items-center">
                <span className="text-3xl mr-3">💨</span>
                {t('dashboard.section.air')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">{t('stats.airTemp')}</span>
                  <span className="text-2xl font-bold text-red-600">{stats.temperature.toFixed(1)}°C</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stats.temperature >= 30 ? "bg-red-100 text-red-700" :
                    stats.temperature >= 25 ? "bg-orange-100 text-orange-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {stats.temperature >= 30 ? t('dashboard.temp.hot') : stats.temperature >= 25 ? t('dashboard.temp.warm') : t('dashboard.temp.cool')}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm font-medium">{t('stats.airHumidity')}</span>
                  <span className="text-2xl font-bold text-blue-700">{stats.humidity}%</span>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${stats.humidity}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">{t('dashboard.airQuality')}</div>
                  <div className="text-lg font-bold text-blue-800">
                    {stats.humidity >= 70 ? t('dashboard.status.humid') : stats.humidity >= 50 ? t('dashboard.status.normal') : t('dashboard.status.dry')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cuaca (Weather) */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-yellow-800 flex items-center">
                <span className="text-3xl mr-3">{stats.weather === "Hujan" ? "🌧️" : "☀️"}</span>
                {t('dashboard.section.weather')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow text-center">
                <div className="text-6xl mb-4">
                  {stats.weather === "Hujan" ? "🌧️" : "☀️"}
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {stats.weather === "Hujan" ? t('dashboard.weather.rainy') : t('dashboard.weather.sunny')}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  stats.weather === "Hujan" 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {stats.weather === "Hujan" ? t('dashboard.weather.rainDetected') : t('dashboard.weather.noRain')}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow">
                <div className="text-sm text-gray-600 mb-2">{t('dashboard.recommendation')}:</div>
                <div className="text-sm text-gray-800">
                  {stats.weather === "Hujan" 
                    ? `⚠️ ${t('dashboard.weather.rainRecommendation')}` 
                    : `✅ ${t('dashboard.weather.sunnyRecommendation')}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Old Charts Row - Keep for visual gauges */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>{t('dashboard.monitor.airTemp')}</h3>
                <p>{t('dashboard.monitor.airTempDesc')}</p>
              </div>
              <span className="chart-badge">{t('dashboard.status.live')}</span>
            </div>
            <div className="chart-body">
              <div className="gauge-container">
                <div className="gauge">
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      "--percentage": `${Math.min(100, (stats.temperature / 50) * 100)}%`,
                      "--color": stats.temperature >= 35 ? "#89986D" : stats.temperature >= 28 ? "#9CAB84" : "#C5D89D"
                    } as React.CSSProperties}
                  ></div>
                  <div className="gauge-center">
                    <span className="gauge-value">{stats.temperature.toFixed(1)}</span>
                    <span className="gauge-unit">°C</span>
                  </div>
                </div>
                <div className="gauge-labels">
                  <span>0°C</span>
                  <span>25°C</span>
                  <span>50°C</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>{t('dashboard.monitor.soilMoisture')}</h3>
                <p>{t('dashboard.monitor.soilMoistureDesc')}</p>
              </div>
              <span className="chart-badge">{t('dashboard.status.live')}</span>
            </div>
            <div className="chart-body">
              <div className="gauge-container">
                <div className="gauge">
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      "--percentage": `${stats.moisture}%`,
                      "--color": stats.moisture >= 70 ? "#9CAB84" : stats.moisture >= 40 ? "#9CAB84" : stats.moisture >= 20 ? "#C5D89D" : "#89986D"
                    } as React.CSSProperties}
                  ></div>
                  <div className="gauge-center">
                    <span className="gauge-value">{stats.moisture}</span>
                    <span className="gauge-unit">%</span>
                  </div>
                </div>
                <div className="gauge-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <Link 
                href="/soil-moisture"
                className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition"
              >
                <span>{t('dashboard.viewDetail')}</span>
                <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
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