"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="pill-sidebar">
      {/* Logo Circle */}
      <div className="logo-circle">
        <span>IoT</span>
      </div>

      {/* Navigation */}
      <nav className="pill-nav">
        <Link
          href="/"
          className={`pill-nav-btn ${pathname === "/" ? "active" : ""}`}
          data-tooltip="Dashboard Utama"
          title="Dashboard Utama"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </Link>
        
        <Link
          href="/soil-moisture"
          className={`pill-nav-btn ${pathname === "/soil-moisture" ? "active" : ""}`}
          data-tooltip="Kelembaban Tanah"
          title="Kelembaban Tanah"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </Link>

        <Link
          href="/sensors"
          className={`pill-nav-btn ${pathname === "/sensors" ? "active" : ""}`}
          data-tooltip="Data Sensor"
          title="Data Sensor"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </Link>

        <Link
          href="/analytics"
          className={`pill-nav-btn ${pathname === "/analytics" ? "active" : ""}`}
          data-tooltip="Analisis Data"
          title="Analisis Data"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </Link>
      </nav>

      {/* Bottom Actions */}
      <div className="pill-bottom">
        <button 
          className="pill-nav-btn" 
          data-tooltip="Pengaturan"
          title="Pengaturan"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
