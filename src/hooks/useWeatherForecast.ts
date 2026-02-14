"use client";

import { useState, useEffect } from "react";

// Interface for forecast data
export interface ForecastDay {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  speed: number;
  deg: number;
  gust: number;
  clouds: number;
  pop: number;
  rain?: number;
}

export interface WeatherForecast {
  city: {
    id: number;
    name: string;
    coord: {
      lon: number;
      lat: number;
    };
    country: string;
    population: number;
    timezone: number;
  };
  list: ForecastDay[];
}

interface UseWeatherForecastResult {
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
  refreshForecast: (lat?: number, lon?: number) => void;
  currentLocation: string | null;
}

// OpenWeather API configuration
// IMPORTANT: On the client, env vars are substituted at build-time.
// To avoid stale values during HMR / dev edits, read the key at call-time (inside fetchForecast).

export function useWeatherForecast(): UseWeatherForecastResult {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);

  // Fetch forecast data from OpenWeather API
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      // Get API key from server-side env via internal API route.
      // This avoids client-side env substitution issues in dev/HMR on Windows.
      const keyRes = await fetch("/api/validate-api-key", { cache: "no-store" });
      const keyJson = (await keyRes.json()) as {
        keys?: { openWeather?: boolean };
      };

      if (!keyRes.ok || !keyJson?.keys?.openWeather) {
        throw new Error(
          "OpenWeather API key tidak ditemukan. Pastikan ada NEXT_PUBLIC_OPENWEATHER_API_KEY di .env.local lalu restart dev server."
        );
      }

      // Call OpenWeather through our server proxy so the key never needs to exist in client JS.
      const url = `/api/weather-forecast?lat=${lat}&lon=${lon}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: WeatherForecast = await response.json();
      setForecast(data);
      setCurrentLocation(data.city.name); // Set city name as current location
      setError(null);
    } catch (err) {
      console.error("Error fetching weather forecast:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data forecast");
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  // Get user's geolocation
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchForecast(latitude, longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          // Default location (Jakarta, Indonesia) if geolocation fails
          const defaultLat = -6.2088;
          const defaultLon = 106.8456;
          fetchForecast(defaultLat, defaultLon);
          setError("Tidak dapat mengakses lokasi. Menggunakan Jakarta sebagai default.");
        }
      );
    } else {
      // Geolocation not supported, use default location
      const defaultLat = -6.2088;
      const defaultLon = 106.8456;
      fetchForecast(defaultLat, defaultLon);
      setError("Geolocation tidak didukung. Menggunakan Jakarta sebagai default.");
    }
  };

  // Refresh forecast with optional custom coordinates
  const refreshForecast = (lat?: number, lon?: number) => {
    if (lat !== undefined && lon !== undefined) {
      fetchForecast(lat, lon);
    } else {
      getUserLocation();
    }
  };

  // Initial load
  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    forecast,
    loading,
    error,
    refreshForecast,
    currentLocation,
  };
}
