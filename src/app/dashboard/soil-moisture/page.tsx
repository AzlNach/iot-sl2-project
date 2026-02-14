"use client";

import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { saveToHistory, initializeHistoryIfNeeded } from "@/utils/historyManager";

// Get moisture status and color
const getMoistureStatus = (moisture: number, t: (key: string) => string) => {
  if (moisture >= 70) return { label: t('soil.status.wet'), color: "text-[#89986D]", bg: "bg-[#C5D89D]/20" };
  if (moisture >= 40) return { label: t('dashboard.status.normal'), color: "text-[#89986D]", bg: "bg-[#C5D89D]/20" };
  if (moisture >= 20) return { label: t('soil.status.dry'), color: "text-[#89986D]", bg: "bg-[#F6F0D7]" };
  return { label: t('soil.status.veryDry'), color: "text-[#89986D]", bg: "bg-[#9CAB84]/30" };
};

export default function SoilMoisturePage() {
  const { data, loading, error } = useSoilMoistureData();
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [historyInitialized, setHistoryInitialized] = useState(false);

  // Initialize history data if needed (one-time)
  useEffect(() => {
    if (!historyInitialized) {
      initializeHistoryIfNeeded().then(() => {
        setHistoryInitialized(true);
      });
    }
  }, [historyInitialized]);

  // Save current data to history every 5 minutes
  useEffect(() => {
    if (data.moisture > 0 && data.timestamp > 0) {
      const saveInterval = setInterval(() => {
        saveToHistory({
          moisture: data.moisture,
          soilADC: data.soilADC,
          rainADC: data.rainADC,
          airTemp: data.airTemp,
          airHumidity: data.airHumidity,
          pumpStatus: data.pumpStatus,
          weather: data.weather,
          timestamp: Date.now()
        });
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(saveInterval);
    }
  }, [data]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#89986D]"></div>
          <p className="mt-4 text-[#666666] text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-[#F6F0D7]">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#2c2c2c] mb-2">Error</h2>
            <p className="text-[#666666] mb-4">{error}</p>
            <p className="text-sm text-[#89986D] mb-6">
              {t('soil.errorMessage')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#9CAB84] text-white rounded-lg hover:bg-[#89986D] transition"
            >
              {t('common.reload')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moistureStatus = getMoistureStatus(data.moisture, t);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <h1>🌱 {t('sidebar.soilMoisture')}</h1>
          <p>{t('soil.subtitle')}</p>
        </div>
        <div className="header-right">
          <LanguageSwitcher />
          <div className="header-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{currentTime.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
          <div className="header-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{currentTime.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
          <div className={`status-indicator ${data.timestamp > 0 ? "active" : "inactive"}`}>
            <div className="status-dot"></div>
            <span>{data.timestamp > 0 ? t('dashboard.status.live') : t('dashboard.status.offline')}</span>
          </div>
        </div>
      </div>
        {/* Status Cards - Only Soil Related */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Moisture Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#9CAB84] hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💧</div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${moistureStatus.bg} ${moistureStatus.color}`}>
                {moistureStatus.label}
              </span>
            </div>
            <h3 className="text-[#666666] text-sm font-medium mb-2">{t('soil.moisture')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl md:text-5xl font-bold text-[#2c2c2c]">{data.moisture}</span>
              <span className="text-xl md:text-2xl text-[#666666] pb-2">%</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 bg-[#F6F0D7] rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#9CAB84] to-[#89986D] h-full transition-all duration-500 rounded-full"
                style={{ width: `${data.moisture}%` }}
              ></div>
            </div>
          </div>

          {/* Soil Sensor ADC Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#C5D89D] hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📊</div>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-[#C5D89D]/20 text-[#89986D]">
                {t('soil.adcValue')}
              </span>
            </div>
            <h3 className="text-[#666666] text-sm font-medium mb-2">{t('soil.sensor')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl md:text-5xl font-bold text-[#2c2c2c]">{data.soilADC}</span>
            </div>
            <p className="mt-4 text-xs text-[#89986D]">
              {t('soil.adcRange')}
            </p>
          </div>

          {/* Pump Status Card */}
          <div className={`bg-white rounded-2xl shadow-xl p-6 border-t-4 ${
            data.pumpStatus === "ON" ? "border-[#89986D]" : "border-[#C5D89D]"
          } hover:shadow-2xl transition transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{data.pumpStatus === "ON" ? "⚙️" : "⏸️"}</div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                data.pumpStatus === "ON"
                  ? "bg-[#F6F0D7] text-[#89986D]"
                  : "bg-[#C5D89D]/20 text-[#89986D]"
              }`}>
                {data.pumpStatus === "ON" ? t('soil.active') : t('soil.inactive')}
              </span>
            </div>
            <h3 className="text-[#666666] text-sm font-medium mb-2">{t('soil.pumpStatus')}</h3>
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                data.pumpStatus === "ON" ? "bg-[#89986D] animate-pulse" : "bg-[#C5D89D]"
              }`}></div>
              <span className="text-2xl md:text-3xl font-bold text-[#2c2c2c]">
                {data.pumpStatus}
              </span>
            </div>
            <p className="mt-4 text-xs text-[#89986D]">
              {data.pumpStatus === "ON" 
                ? t('soil.pumpActive')
                : t('soil.pumpStandby')}
            </p>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Moisture Gauge */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-2xl md:text-3xl mr-3">🎯</span>
              Status Kelembapan Real-time
            </h2>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                {/* Circular Progress */}
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="#F6F0D7"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke={
                      data.moisture >= 70 ? "#9CAB84" :
                      data.moisture >= 40 ? "#9CAB84" :
                      data.moisture >= 20 ? "#C5D89D" : "#89986D"
                    }
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${data.moisture * 5.5} 550`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-6xl font-bold text-gray-800">{data.moisture}</span>
                  <span className="text-2xl md:text-3xl text-gray-600">%</span>
                  <span className={`mt-2 text-base md:text-lg font-semibold ${moistureStatus.color}`}>
                    {moistureStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-2xl md:text-3xl mr-3">ℹ️</span>
              Informasi Sensor Tanah
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Kelembapan Tanah</span>
                <span className="text-xl md:text-2xl font-bold text-gray-800">{data.moisture}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Sensor ADC</span>
                <span className="text-xl md:text-2xl font-bold text-gray-800">{data.soilADC}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Status Pompa</span>
                <span className={`text-xl md:text-2xl font-bold ${
                  data.pumpStatus === "ON" ? "text-orange-600" : "text-gray-600"
                }`}>
                  {data.pumpStatus}
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Status Sistem</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-700">Sensor Aktif</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-700">Firebase Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>🌱 IoT Soil Moisture Monitoring System © 2025</p>
        <p className="text-xs mt-1">Powered by ESP32 + Firebase + Next.js</p>
      </div>
    </DashboardLayout>
  );
}
