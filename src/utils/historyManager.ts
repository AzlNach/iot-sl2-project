"use client";

import { ref, push, set, get } from "firebase/database";
import { database } from "@/firebase/config";

/**
 * Saves current sensor data to history for AI analysis
 */
export async function saveToHistory(data: {
  moisture: number;
  rawADC: number;
  pumpStatus: string;
  timestamp: number;
}) {
  try {
    // Save to soilMoisture path (for AI analysis)
    const historyRef = ref(database, "soilMoisture");
    const newHistoryRef = push(historyRef);
    await set(newHistoryRef, data);
    
    console.log("Data saved to history for AI analysis");
    return true;
  } catch (error) {
    console.error("Error saving to history:", error);
    return false;
  }
}

/**
 * Initializes historical data from latest reading if no history exists
 */
export async function initializeHistoryIfNeeded() {
  try {
    // Check if history already exists
    const historyRef = ref(database, "soilMoisture");
    const historySnapshot = await get(historyRef);
    
    if (historySnapshot.exists()) {
      console.log("History data already exists");
      return true;
    }

    // Get latest data
    const latestRef = ref(database, "sensorData/latest");
    const latestSnapshot = await get(latestRef);
    
    if (!latestSnapshot.exists()) {
      console.log("No latest data available to initialize history");
      return false;
    }

    const latestData = latestSnapshot.val();
    const baseTime = latestData.timestamp || Date.now();
    
    // Create 24 hours of historical data (hourly)
    console.log("Initializing historical data...");
    const promises = [];
    
    for (let i = 0; i < 24; i++) {
      const timeOffset = i * 60 * 60 * 1000; // 1 hour
      const moistureVariation = Math.random() * 20 - 10; // ±10%
      const moisture = Math.max(0, Math.min(100, (latestData.moisture || 45) + moistureVariation));
      
      const historicalData = {
        moisture: Math.round(moisture),
        rawADC: (latestData.rawADC || 2048) + Math.round((moistureVariation / 100) * 2048),
        pumpStatus: moisture < 30 ? "ON" : "OFF",
        timestamp: baseTime - timeOffset
      };
      
      const newRef = push(historyRef);
      promises.push(set(newRef, historicalData));
    }
    
    await Promise.all(promises);
    console.log("Historical data initialized successfully");
    return true;
    
  } catch (error) {
    console.error("Error initializing history:", error);
    return false;
  }
}

/**
 * Cleans up old historical data (keeps last 1000 entries)
 */
export async function cleanupOldHistory() {
  try {
    const historyRef = ref(database, "soilMoisture");
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) return;
    
    const allData: Array<{ key: string; timestamp: number }> = [];
    
    snapshot.forEach((child) => {
      const data = child.val();
      if (data && data.timestamp) {
        allData.push({
          key: child.key!,
          timestamp: data.timestamp
        });
      }
    });
    
    // If more than 1000 entries, remove oldest ones
    if (allData.length > 1000) {
      allData.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = allData.slice(0, allData.length - 1000);
      
      const deletePromises = toDelete.map(item => {
        const itemRef = ref(database, `soilMoisture/${item.key}`);
        return set(itemRef, null); // Delete by setting to null
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${toDelete.length} old history entries`);
    }
    
  } catch (error) {
    console.error("Error cleaning up history:", error);
  }
}
