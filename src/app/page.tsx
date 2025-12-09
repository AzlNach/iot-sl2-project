"use client";

import { useMemo } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import { useSoilMoistureData } from "@/hooks/useSoilMoistureData";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

// Get current time greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

// Get temperature status
const getTemperatureStatus = (temp: number) => {
  if (temp >= 35) return { label: "Tinggi", className: "badge-high" };
  if (temp >= 28) return { label: "Sedang", className: "badge-medium" };
  return { label: "Normal", className: "badge-low" };
};

// Get humidity status
const getHumidityStatus = (humidity: number) => {
  if (humidity >= 80) return { label: "Tinggi", className: "badge-high" };
  if (humidity >= 60) return { label: "Sedang", className: "badge-medium" };
  return { label: "Normal", className: "badge-low" };
};

// Get moisture status for soil
const getMoistureStatus = (moisture: number) => {
  if (moisture >= 70) return { label: "Lembab", className: "badge-low" };
  if (moisture >= 40) return { label: "Normal", className: "badge-medium" };
  if (moisture >= 20) return { label: "Kering", className: "badge-medium" };
  return { label: "Sangat Kering", className: "badge-high" };
};

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { data, loading, error } = useSensorData("sensors");
  const { data: soilData } = useSoilMoistureData();

  // Calculate stats
  const stats = useMemo(() => {
    const tempStatus = getTemperatureStatus(data.temperature);
    const humidityStatus = getHumidityStatus(data.humidity);
    const moistureStatus = getMoistureStatus(soilData.moisture);
    const isActive = data.status === "active";
    
    return {
      temperature: data.temperature,
      humidity: data.humidity,
      moisture: soilData.moisture,
      pumpStatus: soilData.pumpStatus,
      status: data.status,
      tempStatus,
      humidityStatus,
      moistureStatus,
      isActive
    };
  }, [data, soilData]);

  if (loading) {
    return <LoadingScreen />;
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
            <h1>{getGreeting()}! 👋</h1>
            <p>Pantau sensor IoT Anda secara real-time</p>
          </div>
          <div className="header-right">
            <div className="header-date">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
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
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.temperature}°C</span>
              <span className="stat-label">Suhu</span>
            </div>
            <span className={`badge ${stats.tempStatus.className}`}>{stats.tempStatus.label}</span>
          </div>

          <Link href="/soil-moisture" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-icon cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.moisture}%</span>
              <span className="stat-label">Kelembapan Tanah</span>
            </div>
            <span className={`badge ${stats.moistureStatus.className}`}>{stats.moistureStatus.label}</span>
          </Link>

          <div className="stat-card">
            <div className={`stat-icon ${stats.isActive ? "green" : "red"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value capitalize">{stats.status}</span>
              <span className="stat-label">Status Sistem</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">Update Terakhir</span>
            </div>
            <span className="badge badge-live">
              <span className="live-dot"></span>
              Live
            </span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3>Monitor Suhu</h3>
                <p>Visualisasi suhu real-time</p>
              </div>
              <span className="chart-badge">Live</span>
            </div>
            <div className="chart-body">
              <div className="gauge-container">
                <div className="gauge">
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      "--percentage": `${Math.min(100, (stats.temperature / 50) * 100)}%`,
                      "--color": stats.temperature >= 35 ? "#ef4444" : stats.temperature >= 28 ? "#f59e0b" : "#22c55e"
                    } as React.CSSProperties}
                  ></div>
                  <div className="gauge-center">
                    <span className="gauge-value">{stats.temperature}</span>
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
                <h3>Monitor Kelembapan Tanah</h3>
                <p>Data dari sensor soil moisture</p>
              </div>
              <span className="chart-badge">Live</span>
            </div>
            <div className="chart-body">
              <div className="gauge-container">
                <div className="gauge">
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      "--percentage": `${stats.moisture}%`,
                      "--color": stats.moisture >= 70 ? "#22c55e" : stats.moisture >= 40 ? "#3b82f6" : stats.moisture >= 20 ? "#f59e0b" : "#ef4444"
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
                <span>Lihat Detail</span>
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
              <h4>⚠️ Peringatan Suhu Tinggi!</h4>
              <p>Suhu melebihi 35°C. Segera periksa sistem Anda.</p>
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
              <h4>💧 Kelembaban Tinggi</h4>
              <p>Kelembaban melebihi 80%. Pertimbangkan untuk menyalakan ventilasi.</p>
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
              <h4>🌱 Kelembapan Tanah Sangat Rendah!</h4>
              <p>Kelembapan tanah di bawah 20%. Pompa {stats.pumpStatus === "ON" ? "sedang aktif" : "akan segera aktif"}. <Link href="/soil-moisture" className="underline font-semibold">Lihat detail →</Link></p>
            </div>
          </div>
        )}



        {/* Footer */}
        <footer className="dashboard-footer">
          <p>Built with Next.js, Tailwind CSS & Firebase</p>
        </footer>
      </main>
    </div>
  );
}