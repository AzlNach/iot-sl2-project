"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/firebase/config";

export interface SoilMoistureData {
  moisture: number;
  rawADC: number;
  pumpStatus: "ON" | "OFF";
  timestamp: number;
}

export function useSoilMoistureData() {
  const [latestData, setLatestData] = useState<SoilMoistureData>({
    moisture: 0,
    rawADC: 0,
    pumpStatus: "OFF",
    timestamp: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataRef = ref(database, "sensorData/latest");

    // Subscribe to real-time updates
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLatestData({
            moisture: data.moisture || 0,
            rawADC: data.rawADC || 0,
            pumpStatus: data.pumpStatus || "OFF",
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
