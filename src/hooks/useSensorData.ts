"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/firebase/config";

// Type definition for sensor data
export interface SensorData {
  temperature: number;
  humidity: number;
  status: string;
}

// Default values when no data is available
const defaultSensorData: SensorData = {
  temperature: 0,
  humidity: 0,
  status: "inactive",
};

/**
 * Custom hook to subscribe to real-time sensor data from Firebase Realtime Database
 * @param path - The Firebase path to listen to (default: "sensorData/latest")
 * @returns Object containing sensor data, loading state, and error state
 */
export function useSensorData(path: string = "sensorData/latest") {
  const [data, setData] = useState<SensorData>(defaultSensorData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a reference to the Firebase path
    const sensorRef = ref(database, path);

    // Set up real-time listener
    onValue(
      sensorRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const sensorData = snapshot.val() as SensorData;
          setData(sensorData);
          setError(null);
        } else {
          // No data exists at this path - but don't show error, just use defaults
          setData(defaultSensorData);
          setError(null); // Changed from showing error to null
        }
        setLoading(false);
      },
      (err) => {
        // Handle errors
        console.error("Firebase read error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      off(sensorRef);
    };
  }, [path]);

  return { data, loading, error };
}
