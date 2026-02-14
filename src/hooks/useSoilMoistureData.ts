"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/firebase/config";

export interface SoilMoistureData {
  moisture: number;
  soilADC: number;
  rainADC: number;
  airHumidity: number;
  airTemp: number;
  pumpStatus: "ON" | "OFF";
  weather: string;
  timestamp: number;
}

export function useSoilMoistureData() {
  const [latestData, setLatestData] = useState<SoilMoistureData>({
    moisture: 0,
    soilADC: 0,
    rainADC: 0,
    airHumidity: 0,
    airTemp: 0,
    pumpStatus: "OFF",
    weather: "Unknown",
    timestamp: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataRef = ref(database, "sensorData/latest");

    // Subscribe to real-time updates
    onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLatestData({
            moisture: data.moisture || 0,
            soilADC: data.soilADC || 0,
            rainADC: data.rainADC || 0,
            airHumidity: data.airHumidity || 0,
            airTemp: data.airTemp || 0,
            pumpStatus: data.pumpStatus || "OFF",
            weather: data.weather || "Unknown",
            timestamp: data.timestamp || 0,
          });
          setError(null);
        } else {
          setError("No data available");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      off(dataRef);
    };
  }, []);

  return { data: latestData, loading, error };
}
