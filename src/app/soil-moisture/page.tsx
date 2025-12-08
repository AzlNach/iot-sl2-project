"use client";

import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import AnalysisSchedulePanel from "@/components/AnalysisSchedulePanel";
import AnalysisHistoryPanel from "@/components/AnalysisHistoryPanel";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { saveToHistory, initializeHistoryIfNeeded } from "@/utils/historyManager";

// Get moisture status and color
const getMoistureStatus = (moisture: number) => {
  if (moisture >= 70) return { label: "Lembab", color: "text-green-600", bg: "bg-green-100" };
  if (moisture >= 40) return { label: "Normal", color: "text-blue-600", bg: "bg-blue-100" };
  if (moisture >= 20) return { label: "Kering", color: "text-orange-600", bg: "bg-orange-100" };
  return { label: "Sangat Kering", color: "text-red-600", bg: "bg-red-100" };
};

// Format timestamp
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Calculate time ago
const getTimeAgo = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari yang lalu`;
  if (hours > 0) return `${hours} jam yang lalu`;
  if (minutes > 0) return `${minutes} menit yang lalu`;
  return `${seconds} detik yang lalu`;
};

export default function SoilMoisturePage() {
  const { data, loading, error } = useSoilMoistureData();
  const { analysisHistory, isLoadingHistory, loadAnalysisHistory } = useAIAnalysis();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [historyInitialized, setHistoryInitialized] = useState(false);

  // Debug: Log history data
  useEffect(() => {
    console.log("📊 Analysis History State:", {
      count: analysisHistory.length,
      isLoading: isLoadingHistory,
      items: analysisHistory
    });
  }, [analysisHistory, isLoadingHistory]);

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
          rawADC: data.rawADC,
          pumpStatus: data.pumpStatus,
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Memuat data sensor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Pastikan Firebase sudah terkonfigurasi dengan benar dan data sudah tersedia.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moistureStatus = getMoistureStatus(data.moisture);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <h1>🌱 Soil Moisture Monitor</h1>
          <p>Sistem Monitoring Kelembapan Tanah Real-time</p>
        </div>
        <div className="header-right">
          <div className="header-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{currentTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
          <div className={`status-indicator ${data.moisture > 0 ? "active" : "inactive"}`}>
            <div className="status-dot"></div>
            <span>{data.moisture > 0 ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Moisture Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-600 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💧</div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${moistureStatus.bg} ${moistureStatus.color}`}>
                {moistureStatus.label}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Kelembapan Tanah</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl md:text-5xl font-bold text-gray-800">{data.moisture}</span>
              <span className="text-xl md:text-2xl text-gray-600 pb-2">%</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${data.moisture}%` }}
              ></div>
            </div>
          </div>

          {/* Raw ADC Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-600 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📊</div>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 text-blue-600">
                ADC Value
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Nilai ADC Sensor</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl md:text-5xl font-bold text-gray-800">{data.rawADC}</span>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Range: 0 - 4095 (12-bit ADC)
            </p>
          </div>

          {/* Pump Status Card */}
          <div className={`bg-white rounded-2xl shadow-xl p-6 border-t-4 ${
            data.pumpStatus === "ON" ? "border-orange-600" : "border-gray-600"
          } hover:shadow-2xl transition transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{data.pumpStatus === "ON" ? "⚙️" : "⏸️"}</div>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                data.pumpStatus === "ON"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {data.pumpStatus === "ON" ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Status Pompa</h3>
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                data.pumpStatus === "ON" ? "bg-orange-500 animate-pulse" : "bg-gray-400"
              }`}></div>
              <span className="text-2xl md:text-3xl font-bold text-gray-800">
                {data.pumpStatus}
              </span>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {data.pumpStatus === "ON" 
                ? "Pompa sedang menyiram tanaman" 
                : "Pompa dalam mode standby"}
            </p>
          </div>

          {/* Last Update Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-600 hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">⏱️</div>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-purple-100 text-purple-600">
                Live
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Update Terakhir</h3>
            <div className="text-sm text-gray-800 font-semibold mb-2">
              {getTimeAgo(data.timestamp)}
            </div>
            <p className="text-xs text-gray-500">
              {formatTimestamp(data.timestamp)}
            </p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">Connected</span>
            </div>
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
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke={
                      data.moisture >= 70 ? "#10b981" :
                      data.moisture >= 40 ? "#3b82f6" :
                      data.moisture >= 20 ? "#f59e0b" : "#ef4444"
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
              Informasi Sistem
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Nilai ADC</span>
                <span className="text-xl md:text-2xl font-bold text-gray-800">{data.rawADC}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Kelembapan</span>
                <span className="text-xl md:text-2xl font-bold text-gray-800">{data.moisture}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Status Pompa</span>
                <span className={`text-xl md:text-2xl font-bold ${
                  data.pumpStatus === "ON" ? "text-orange-600" : "text-gray-600"
                }`}>
                  {data.pumpStatus}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium text-sm md:text-base">Timestamp</span>
                <span className="text-base md:text-lg font-mono text-gray-800">{data.timestamp}</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Status Indikator</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-700">Sensor Aktif</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs md:text-sm text-gray-700">Firebase Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Controls & History - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Analysis Schedule (1 column) */}
          <div className="lg:col-span-1">
            <AnalysisSchedulePanel />
          </div>

          {/* Right: Analysis History (2 columns - wider) */}
          <div className="lg:col-span-2">
            <AnalysisHistoryPanel 
              history={analysisHistory} 
              isLoading={isLoadingHistory} 
              onRefresh={loadAnalysisHistory}
            />
          </div>
        </div>

        {/* AI Analysis Results Panel */}
        <AIAnalysisPanel />

      {/* Footer */}
      <div className="dashboard-footer">
        <p>🌱 IoT Soil Moisture Monitoring System © 2025</p>
        <p className="text-xs mt-1">Powered by ESP32 + Firebase + Next.js</p>
      </div>
    </DashboardLayout>
  );
}
