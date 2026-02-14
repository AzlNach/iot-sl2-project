"use client";

import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { useEffect, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { database } from "@/firebase/config";
import DashboardLayout from "@/components/DashboardLayout";
import WeatherForecastCard from "@/components/WeatherForecastCard";
import LocationSearch from "@/components/LocationSearch";

// Interface for historical data
interface WeatherHistoryPoint {
  timestamp: number;
  weather: string;
  rainADC: number;
  airTemp: number;
  airHumidity: number;
}

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

export default function WeatherPage() {
  const { data, loading, error } = useSoilMoistureData();
  const { 
    forecast, 
    loading: forecastLoading, 
    error: forecastError, 
    refreshForecast, 
    currentLocation 
  } = useWeatherForecast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherHistory, setWeatherHistory] = useState<WeatherHistoryPoint[]>([]);

  const handleLocationChange = (lat: number, lon: number) => {
    refreshForecast(lat, lon);
  };

  // Fetch weather history
  useEffect(() => {
    const historyRef = ref(database, "sensorData/history");
    const historyQuery = query(historyRef, orderByChild("timestamp"), limitToLast(10));

    const unsubscribe = onValue(historyQuery, (snapshot) => {
      if (snapshot.exists()) {
        const dataPoints: WeatherHistoryPoint[] = [];
        snapshot.forEach((child) => {
          const point = child.val();
          dataPoints.push({
            timestamp: point.timestamp || Date.now(),
            weather: point.weather || "Unknown",
            rainADC: point.rainADC || 0,
            airTemp: point.airTemp || 0,
            airHumidity: point.airHumidity || 0,
          });
        });
        dataPoints.sort((a, b) => b.timestamp - a.timestamp); // Latest first
        setWeatherHistory(dataPoints);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Memuat data cuaca...</p>
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

  const isRaining = data.weather === "Hujan";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="content-header">
        <div className="header-left">
          <h1>{isRaining ? "🌧️" : "☀️"} Kondisi Cuaca</h1>
          <p>Monitoring Cuaca & Sensor Hujan Real-time</p>
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

      {/* Main Weather Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Weather Card */}
        <div className={`rounded-2xl shadow-2xl p-8 border-4 ${
          isRaining 
            ? "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400" 
            : "bg-gradient-to-br from-yellow-100 to-orange-200 border-yellow-400"
        }`}>
          <div className="text-center">
            <div className="text-9xl mb-6 animate-pulse">
              {isRaining ? "🌧️" : "☀️"}
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{data.weather}</h2>
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
              isRaining 
                ? "bg-blue-500 text-white" 
                : "bg-yellow-500 text-white"
            }`}>
              {isRaining ? "Hujan Terdeteksi" : "Tidak Ada Hujan"}
            </div>
            
            <div className="mt-8 pt-8 border-t-2 border-gray-300">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-white bg-opacity-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Suhu</div>
                  <div className="text-2xl font-bold text-gray-800">{data.airTemp.toFixed(1)}°C</div>
                </div>
                <div className="bg-white bg-opacity-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Kelembapan</div>
                  <div className="text-2xl font-bold text-gray-800">{data.airHumidity}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Info & Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-3">📊</span>
            Informasi Detail
          </h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">Status Cuaca</span>
              <span className="text-xl font-bold text-gray-800">{data.weather}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">Nilai Sensor Hujan (ADC)</span>
              <span className="text-xl font-bold text-gray-800">{data.rainADC}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">Update Terakhir</span>
              <span className="text-sm font-semibold text-gray-800">{getTimeAgo(data.timestamp)}</span>
            </div>
          </div>

          {/* Weather Impact */}
          <div className={`p-6 rounded-xl ${
            isRaining ? "bg-blue-50 border-2 border-blue-200" : "bg-yellow-50 border-2 border-yellow-200"
          }`}>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="text-xl mr-2">💡</span>
              Dampak & Rekomendasi
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {isRaining ? (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Pompa penyiraman otomatis dinonaktifkan untuk menghemat air</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Tanah akan mendapat air dari hujan alami</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>Monitor kelembapan tanah untuk menghindari kelebihan air</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📌</span>
                    <span>Pastikan sistem drainase berfungsi dengan baik</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Sistem penyiraman otomatis dapat beroperasi normal</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Kondisi ideal untuk aktivitas outdoor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💧</span>
                    <span>Monitor kelembapan tanah secara berkala</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🌡️</span>
                    <span>Perhatikan suhu udara untuk optimasi penyiraman</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Weather Forecast Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="text-3xl mr-3">📅</span>
            Prakiraan Cuaca 5 Hari
          </h2>
          <LocationSearch 
            onSearch={handleLocationChange} 
            currentLocation={currentLocation || forecast?.city.name || "Loading..."}
          />
        </div>

        {forecastLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        ) : forecastError ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{forecastError}</p>
            <button
              onClick={() => refreshForecast()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : forecast && forecast.list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {forecast.list.map((day, index) => (
              <WeatherForecastCard key={index} day={day} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Tidak ada data prakiraan cuaca tersedia
          </div>
        )}

        {/* Forecast Info */}
        {forecast && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-gray-700">
              📍 <strong>Lokasi:</strong> {forecast.city.name}, {forecast.city.country}
              <span className="ml-4 text-gray-500">
                ({forecast.city.coord.lat.toFixed(2)}, {forecast.city.coord.lon.toFixed(2)})
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Weather History */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="text-3xl mr-3">📜</span>
          Riwayat Cuaca (10 Terakhir)
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Waktu</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Kondisi</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Suhu</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Kelembapan</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sensor ADC</th>
              </tr>
            </thead>
            <tbody>
              {weatherHistory.length > 0 ? (
                weatherHistory.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        item.weather === "Hujan" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.weather === "Hujan" ? "🌧️" : "☀️"} {item.weather}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {item.airTemp.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {item.airHumidity}%
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-mono text-gray-600">
                      {item.rainADC}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data riwayat tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensor Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 mb-8 border-2 border-purple-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-3">🔬</span>
          Tentang Sensor Hujan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Cara Kerja</h3>
            <p className="text-sm text-gray-600">
              Sensor hujan menggunakan prinsip resistansi. Ketika tetesan air jatuh pada permukaan sensor, 
              resistansi menurun dan nilai ADC berubah. Sistem mendeteksi perubahan ini untuk menentukan 
              kondisi cuaca.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Nilai ADC</h3>
            <p className="text-sm text-gray-600 mb-2">
              • <strong>4095</strong>: Tidak ada hujan (sensor kering)
            </p>
            <p className="text-sm text-gray-600 mb-2">
              • <strong>2000-4000</strong>: Gerimis atau awal hujan
            </p>
            <p className="text-sm text-gray-600">
              • <strong>&lt;2000</strong>: Hujan deras
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>🌧️ IoT Weather Monitoring System © 2025</p>
        <p className="text-xs mt-1">Powered by Rain Sensor + Firebase + Next.js</p>
      </div>
    </DashboardLayout>
  );
}
