"use client";

import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import { useEffect, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { database } from "@/firebase/config";
import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Interface for historical data
interface HistoricalDataPoint {
  timestamp: number;
  airTemp: number;
  airHumidity: number;
}

// Get temperature status
const getTemperatureStatus = (temp: number) => {
  if (temp >= 35) return { label: "Sangat Panas", color: "text-red-600", bg: "bg-red-100" };
  if (temp >= 30) return { label: "Panas", color: "text-orange-600", bg: "bg-orange-100" };
  if (temp >= 25) return { label: "Hangat", color: "text-yellow-600", bg: "bg-yellow-100" };
  if (temp >= 20) return { label: "Sejuk", color: "text-green-600", bg: "bg-green-100" };
  return { label: "Dingin", color: "text-blue-600", bg: "bg-blue-100" };
};

// Get humidity status
const getHumidityStatus = (humidity: number) => {
  if (humidity >= 80) return { label: "Sangat Lembap", color: "text-blue-600", bg: "bg-blue-100" };
  if (humidity >= 70) return { label: "Lembap", color: "text-cyan-600", bg: "bg-cyan-100" };
  if (humidity >= 50) return { label: "Normal", color: "text-green-600", bg: "bg-green-100" };
  if (humidity >= 30) return { label: "Kering", color: "text-orange-600", bg: "bg-orange-100" };
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

export default function AirQualityPage() {
  const { data, loading, error } = useSoilMoistureData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Fetch historical data
  useEffect(() => {
    const historyRef = ref(database, "sensorData/history");
    const historyQuery = query(historyRef, orderByChild("timestamp"), limitToLast(20));

    const unsubscribe = onValue(historyQuery, (snapshot) => {
      if (snapshot.exists()) {
        const dataPoints: HistoricalDataPoint[] = [];
        snapshot.forEach((child) => {
          const point = child.val();
          dataPoints.push({
            timestamp: point.timestamp || Date.now(),
            airTemp: point.airTemp || 0,
            airHumidity: point.airHumidity || 0,
          });
        });
        dataPoints.sort((a, b) => a.timestamp - b.timestamp);
        setHistoricalData(dataPoints);
      }
    });

    return () => unsubscribe();
  }, []);

  // Format data for charts
  const chartData = historicalData.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    }),
    airTemp: point.airTemp,
    airHumidity: point.airHumidity,
  }));

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
          <p className="mt-4 text-gray-600 text-lg">Memuat data sensor udara...</p>
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

  const tempStatus = getTemperatureStatus(data.airTemp);
  const humidityStatus = getHumidityStatus(data.airHumidity);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <h1>💨 Kualitas Udara</h1>
          <p>Monitoring Suhu & Kelembapan Udara Real-time</p>
        </div>
        <div className="header-right">
          <div className="header-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
          <div className="header-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{currentTime.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
          </div>
          <div className={`status-indicator ${data.timestamp > 0 ? "active" : "inactive"}`}>
            <div className="status-dot"></div>
            <span>{data.timestamp > 0 ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Temperature Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#9CAB84] hover:shadow-2xl transition transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🌡️</div>
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${tempStatus.bg} ${tempStatus.color}`}>
              {tempStatus.label}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-2">Suhu Udara</h3>
          <div className="flex items-end space-x-2">
            <span className="text-4xl md:text-5xl font-bold text-gray-800">
              {data.airTemp.toFixed(1)}
            </span>
            <span className="text-xl md:text-2xl text-gray-600 pb-2">°C</span>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Sensor DHT11
          </p>
        </div>

        {/* Humidity Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#C5D89D] hover:shadow-2xl transition transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💧</div>
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${humidityStatus.bg} ${humidityStatus.color}`}>
              {humidityStatus.label}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-2">Kelembapan Udara</h3>
          <div className="flex items-end space-x-2">
            <span className="text-4xl md:text-5xl font-bold text-gray-800">{data.airHumidity}</span>
            <span className="text-xl md:text-2xl text-gray-600 pb-2">%</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#C5D89D] to-[#9CAB84] h-full transition-all duration-500 rounded-full"
              style={{ width: `${data.airHumidity}%` }}
            ></div>
          </div>
        </div>

        {/* Last Update Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-[#89986D] hover:shadow-2xl transition transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">⏱️</div>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-[#F6F0D7] text-[#89986D]">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Temperature Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🌡️</span>
            Grafik Suhu Udara
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Suhu (°C)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #C5D89D',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="airTemp" 
                  stroke="#9CAB84" 
                  strokeWidth={3}
                  dot={{ fill: '#9CAB84', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Suhu (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Memuat data...</p>
            </div>
          )}
        </div>

        {/* Humidity Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">💧</span>
            Grafik Kelembapan Udara
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
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
                  label={{ value: 'Kelembapan (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #C5D89D',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="airHumidity" 
                  stroke="#C5D89D" 
                  strokeWidth={2}
                  fill="url(#colorHumidity)" 
                  name="Kelembapan (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Memuat data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-2xl mr-3">ℹ️</span>
          Informasi Detail
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
              <span className="text-gray-700 font-medium">Suhu Saat Ini</span>
              <span className="text-2xl font-bold text-red-600">{data.airTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
              <span className="text-gray-700 font-medium">Kelembapan Saat Ini</span>
              <span className="text-2xl font-bold text-blue-600">{data.airHumidity}%</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-2">Status Kualitas Udara</h3>
              <p className="text-sm text-gray-600">
                {data.airHumidity >= 70 && data.airTemp < 30 
                  ? "✅ Kondisi udara sejuk dan lembap, nyaman untuk aktivitas"
                  : data.airHumidity < 50 && data.airTemp >= 30
                  ? "⚠️ Udara panas dan kering, disarankan minum air lebih banyak"
                  : data.airTemp >= 35
                  ? "🔴 Suhu sangat tinggi, batasi aktivitas outdoor"
                  : "✅ Kondisi udara dalam batas normal"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-2">Rekomendasi</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {data.airTemp >= 30 && <li>• Aktifkan AC atau kipas angin</li>}
                {data.airHumidity < 40 && <li>• Gunakan humidifier</li>}
                {data.airHumidity >= 80 && <li>• Tingkatkan ventilasi</li>}
                {data.airTemp < 25 && data.airHumidity >= 60 && <li>• Kondisi optimal untuk tanaman</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>💨 IoT Air Quality Monitoring System © 2025</p>
        <p className="text-xs mt-1">Powered by DHT11 Sensor + Firebase + Next.js</p>
      </div>
    </DashboardLayout>
  );
}
