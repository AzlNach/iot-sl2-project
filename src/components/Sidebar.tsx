"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [sensorMenuOpen, setSensorMenuOpen] = useState(
    pathname.includes("/dashboard/soil-moisture") || 
    pathname.includes("/dashboard/air-quality") || 
    pathname.includes("/dashboard/weather")
  );
  const sidebarRef = useRef<HTMLElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  const isSensorActive = pathname === "/dashboard/soil-moisture" || 
                         pathname === "/dashboard/air-quality" || 
                         pathname === "/dashboard/weather";

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sensorMenuOpen &&
        sidebarRef.current &&
        submenuRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !submenuRef.current.contains(event.target as Node)
      ) {
        setSensorMenuOpen(false);
      }
    };

    // Add event listener when submenu is open
    if (sensorMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sensorMenuOpen]);

  return (
    <aside className="pill-sidebar" ref={sidebarRef}>
      {/* Logo Circle */}
      <div className="logo-circle">
        <span>IoT</span>
      </div>

      {/* Navigation */}
      <nav className="pill-nav">
        <Link
          href="/"
          className="pill-nav-btn"
          data-tooltip={t('sidebar.home')}
          title={t('sidebar.home')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        <Link
          href="/dashboard"
          className={`pill-nav-btn ${pathname === "/dashboard" ? "active" : ""}`}
          data-tooltip={t('sidebar.overview')}
          title={t('sidebar.overview')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </Link>
        
        {/* Data Sensor Menu with Submenu */}
        <div className="pill-nav-group">
          <button
            onClick={() => setSensorMenuOpen(!sensorMenuOpen)}
            className={`pill-nav-btn has-submenu ${isSensorActive ? "active" : ""} ${sensorMenuOpen ? "menu-open" : ""}`}
            data-tooltip="Sensors"
            title="Sensors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </button>
          
          {/* Submenu */}
          {sensorMenuOpen && (
            <div className="pill-submenu" ref={submenuRef}>
              <Link
                href="/dashboard/soil-moisture"
                className={`pill-submenu-item ${pathname === "/dashboard/soil-moisture" ? "active" : ""}`}
              >
                <span className="submenu-icon">🌱</span>
                <span className="submenu-text">{t('sidebar.soilMoisture')}</span>
              </Link>
              <Link
                href="/dashboard/air-quality"
                className={`pill-submenu-item ${pathname === "/dashboard/air-quality" ? "active" : ""}`}
              >
                <span className="submenu-icon">💨</span>
                <span className="submenu-text">{t('sidebar.airQuality')}</span>
              </Link>
              <Link
                href="/dashboard/weather"
                className={`pill-submenu-item ${pathname === "/dashboard/weather" ? "active" : ""}`}
              >
                <span className="submenu-icon">☀️</span>
                <span className="submenu-text">{t('sidebar.weather')}</span>
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/analytics"
          className={`pill-nav-btn ${pathname === "/dashboard/analytics" ? "active" : ""}`}
          data-tooltip={t('sidebar.analytics')}
          title={t('sidebar.analytics')}
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
          data-tooltip={t('sidebar.settings')}
          title={t('sidebar.settings')}
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
