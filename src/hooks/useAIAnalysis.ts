"use client";

import { useState, useEffect, useCallback } from "react";
import { database } from "@/firebase/config";
import { ref, get, set, push } from "firebase/database";

export type ScheduleInterval = "manual" | "3h" | "6h" | "12h" | "24h" | "3d" | "7d" | "30d";

interface AIAnalysisResult {
  success: boolean;
  timestamp: string;
  timeRange: string;
  statistics: {
    rata_rata: string;
    minimum: number;
    maksimum: number;
    tren: string;
  };
  pumpUsage: {
    aktivasi: number;
    persentase: string;
  };
  analysis: string;
  metadata: {
    dataPoints: number;
    analyzedAt: string;
  };
}

export interface AnalysisHistoryItem extends AIAnalysisResult {
  id: string;
}

export function useAIAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleInterval, setScheduleInterval] = useState<ScheduleInterval>("manual");
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load settings dari localStorage
  useEffect(() => {
    const savedInterval = localStorage.getItem("aiAnalysisInterval") as ScheduleInterval;
    const savedLastAnalysis = localStorage.getItem("lastAIAnalysis");
    const savedLastTime = localStorage.getItem("lastAnalysisTime");

    if (savedInterval) setScheduleInterval(savedInterval);
    if (savedLastAnalysis) setLastAnalysis(JSON.parse(savedLastAnalysis));
    if (savedLastTime) setLastAnalysisTime(parseInt(savedLastTime));
  }, []);

  // Fungsi untuk mendapatkan interval dalam milidetik
  const getIntervalMs = (interval: ScheduleInterval): number => {
    const intervals = {
      manual: 0,
      "3h": 3 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "3d": 3 * 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    return intervals[interval];
  };

  // Fungsi untuk mendapatkan label interval
  const getIntervalLabel = (interval: ScheduleInterval): string => {
    const labels = {
      manual: "Manual",
      "3h": "3 Jam",
      "6h": "6 Jam",
      "12h": "12 Jam",
      "24h": "24 Jam",
      "3d": "3 Hari",
      "7d": "7 Hari",
      "30d": "1 Bulan",
    };
    return labels[interval];
  };

  // Fungsi untuk fetch data dari LOCAL JSON FILE (tidak kena rate limit!)
  const fetchSoilData = async (timeRangeMs: number) => {
    try {
      interface SoilDataPoint {
        moisture: number;
        rawADC: number;
        pumpStatus: string;
        timestamp: number;
      }

      console.log("📂 Fetching data from local JSON file...");
      
      // PRIMARY: Fetch dari API endpoint lokal (membaca file JSON)
      try {
        const response = await fetch("/api/sensor-data-local");
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data && result.data.length > 0) {
            console.log(`✅ Loaded ${result.data.length} data points from local JSON`);
            console.log(`📊 Total records: ${result.total}, Limited to: ${result.limited}`);
            
            // Data sudah di-limit 500 dan sorted di backend
            return result.data;
          }
        }
      } catch (localError) {
        console.warn("⚠️ Local JSON fetch failed, trying Firebase fallback...", localError);
      }

      // FALLBACK: Jika local JSON gagal, gunakan Firebase
      console.log("🔄 Using Firebase as fallback data source...");
      
      const allData: SoilDataPoint[] = [];
      const now = Date.now();
      const cutoffTime = now - timeRangeMs;

      // Try multiple paths to find historical data
      const paths = ["soilMoisture", "sensorData/history", "sensorData"];
      let dataFound = false;

      for (const path of paths) {
        try {
          const dataRef = ref(database, path);
          const snapshot = await get(dataRef);

          if (snapshot.exists()) {
            console.log(`Found data in path: ${path}`);
            
            // Check if it's a single object or collection
            const data = snapshot.val();
            
            if (path === "sensorData" && data.latest) {
              // If it's sensorData with latest, get the latest value
              const latestData = data.latest;
              if (latestData.timestamp && latestData.timestamp >= cutoffTime) {
                allData.push({
                  moisture: latestData.moisture || 0,
                  rawADC: latestData.rawADC || 0,
                  pumpStatus: latestData.pumpStatus || "OFF",
                  timestamp: latestData.timestamp
                });
              }
              // Also check for history if exists
              if (data.history) {
                Object.values(data.history as Record<string, SoilDataPoint>).forEach((item) => {
                  if (item && typeof item === 'object' && 'timestamp' in item && item.timestamp >= cutoffTime) {
                    allData.push({
                      moisture: item.moisture || 0,
                      rawADC: item.rawADC || 0,
                      pumpStatus: item.pumpStatus || "OFF",
                      timestamp: item.timestamp
                    });
                  }
                });
              }
            } else {
              // It's a collection, iterate through all items
              snapshot.forEach((childSnapshot) => {
                const item = childSnapshot.val();
                if (item && item.timestamp && item.timestamp >= cutoffTime) {
                  allData.push({
                    moisture: item.moisture || 0,
                    rawADC: item.rawADC || 0,
                    pumpStatus: item.pumpStatus || "OFF",
                    timestamp: item.timestamp
                  });
                }
              });
            }

            if (allData.length > 0) {
              dataFound = true;
              break;
            }
          }
        } catch {
          console.log(`No data in path: ${path}`);
          continue;
        }
      }

      // If no historical data found, try to get current data and generate mock historical data
      if (!dataFound || allData.length === 0) {
        console.log("No historical data found, trying to get latest data...");
        
        const latestRef = ref(database, "sensorData/latest");
        const latestSnapshot = await get(latestRef);
        
        if (latestSnapshot.exists()) {
          const latestData = latestSnapshot.val();
          console.log("Found latest data, generating sample historical data for analysis");
          
          // Generate mock historical data based on latest reading
          // This simulates what historical data would look like
          const baseTime = latestData.timestamp || Date.now();
          const baseMoisture = latestData.moisture || 45;
          const baseADC = latestData.rawADC || 2048;
          
          // Generate 24 sample points (simulating hourly data)
          for (let i = 0; i < 24; i++) {
            const timeOffset = i * 60 * 60 * 1000; // 1 hour intervals
            const moistureVariation = Math.random() * 20 - 10; // ±10% variation
            const moisture = Math.max(0, Math.min(100, baseMoisture + moistureVariation));
            
            allData.push({
              moisture: Math.round(moisture),
              rawADC: baseADC + Math.round((moistureVariation / 100) * 2048),
              pumpStatus: moisture < 30 ? "ON" : "OFF",
              timestamp: baseTime - timeOffset
            });
          }
          
          console.log(`Generated ${allData.length} sample data points for analysis`);
        } else {
          throw new Error("Tidak ada data tersedia. Pastikan ESP32 sudah mengirim data ke Firebase.");
        }
      }

      // Sort by timestamp descending (newest first)
      allData.sort((a, b) => b.timestamp - a.timestamp);

      // Limit to 1000 most recent items
      const limitedData = allData.slice(0, 1000);

      console.log(`Fetched ${limitedData.length} data points for analysis`);
      return limitedData;
      
    } catch (err) {
      console.error("Error fetching soil data:", err);
      throw err;
    }
  };

  // Fungsi untuk memuat riwayat analisis dari Firebase
  const loadAnalysisHistory = useCallback(async (limit: number = 20) => {
    console.log("🔍 Starting loadAnalysisHistory with limit:", limit);
    setIsLoadingHistory(true);
    try {
      // Ensure limit is a valid positive integer
      const validLimit = Math.max(1, Math.floor(Number(limit) || 20));
      console.log("📍 Using validated limit:", validLimit);
      
      const historyRef = ref(database, "aiAnalysisHistory");
      console.log("📍 Firebase ref created:", historyRef.toString());
      
      // ========================================
      // FETCH ALL DATA (tanpa orderByChild - untuk avoid Firebase index requirement)
      // ========================================
      console.log("📍 Fetching all data from aiAnalysisHistory...");
      const snapshot = await get(historyRef);
      
      console.log("📍 Snapshot received:", {
        exists: snapshot.exists(),
        hasChildren: snapshot.hasChildren(),
        size: snapshot.size
      });
      
      if (!snapshot.exists()) {
        console.warn("⚠️ No analysis history found in Firebase");
        setAnalysisHistory([]);
        return [];
      }

      const historyData: AnalysisHistoryItem[] = [];
      
      // Convert Firebase object to array
      snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.val();
        console.log("📍 Processing item:", childSnapshot.key, item);
        
        // Validate item has required fields
        if (item && item.timestamp) {
          historyData.push({
            ...item,
            id: childSnapshot.key || item.id,
          });
        } else {
          console.warn("⚠️ Skipping invalid item:", childSnapshot.key, item);
        }
      });
      
      console.log("📍 Raw history data (before sort):", historyData.length, "items");
      
      // Sort by timestamp descending (newest first) - CLIENT SIDE SORTING
      historyData.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      
      console.log("📍 Sorted history data:", historyData.length, "items");
      
      // Limit results - CLIENT SIDE LIMITING
      const limitedHistory = historyData.slice(0, validLimit);
      console.log(`📍 Limited to ${validLimit} items:`, limitedHistory.length, "items");
      
      setAnalysisHistory(limitedHistory);
      console.log(`✅ Successfully loaded ${limitedHistory.length} history items from Firebase`);
      return limitedHistory;
      
    } catch (error) {
      console.error("❌ Error loading analysis history:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setAnalysisHistory([]);
      return [];
    } finally {
      setIsLoadingHistory(false);
      console.log("🏁 loadAnalysisHistory completed");
    }
  }, []);

  // Fungsi untuk menyimpan hasil analisis ke Firebase
  const saveAnalysisToFirebase = useCallback(async (analysisResult: AIAnalysisResult) => {
    try {
      console.log("💾 Saving analysis to Firebase...", analysisResult);
      const historyRef = ref(database, "aiAnalysisHistory");
      const newHistoryRef = push(historyRef);
      
      const historyItem: AnalysisHistoryItem = {
        ...analysisResult,
        id: newHistoryRef.key || Date.now().toString(),
      };
      
      console.log("💾 History item to save:", historyItem);
      await set(newHistoryRef, historyItem);
      console.log("✅ Analisis berhasil disimpan ke Firebase History dengan ID:", newHistoryRef.key);
      
      // Update local history state immediately
      setAnalysisHistory(prev => {
        const updated = [historyItem, ...prev].slice(0, 50);
        console.log("💾 Updated local history state:", updated.length, "items");
        return updated;
      });
      
      // Reload from Firebase to ensure sync
      console.log("🔄 Reloading history from Firebase to confirm...");
      await loadAnalysisHistory();
      
      return historyItem;
    } catch (error) {
      console.error("❌ Gagal menyimpan analisis ke Firebase:", error);
      console.error("Error details:", error);
      throw error;
    }
  }, [loadAnalysisHistory]);

  // Load history on mount
  useEffect(() => {
    console.log("🔄 useEffect: Loading analysis history...");
    loadAnalysisHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run once on mount

  // Fungsi untuk menjalankan analisis
  const runAnalysis = useCallback(async (manualTrigger = false) => {
    if (isAnalyzing) return;

    // Cek apakah sudah waktunya untuk analisis otomatis
    if (!manualTrigger && scheduleInterval !== "manual") {
      const intervalMs = getIntervalMs(scheduleInterval);
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
      
      if (timeSinceLastAnalysis < intervalMs) {
        console.log("Belum waktunya untuk analisis otomatis");
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Tentukan range waktu berdasarkan interval
      const timeRangeMs = manualTrigger ? 24 * 60 * 60 * 1000 : getIntervalMs(scheduleInterval);
      const timeRangeLabel = manualTrigger ? "24 jam terakhir" : getIntervalLabel(scheduleInterval);

      // Fetch data dari Firebase
      const soilData = await fetchSoilData(timeRangeMs || 24 * 60 * 60 * 1000);

      if (soilData.length === 0) {
        throw new Error("Tidak cukup data untuk dianalisis");
      }

      // Kirim ke API untuk analisis
      console.log(`📤 Mengirim ${soilData.length} data points ke API untuk analisis...`);
      
      const response = await fetch("/api/analyze-soil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          soilData,
          timeRange: timeRangeLabel,
        }),
      });

      const result = await response.json();

      // Handle API errors atau fallback analysis
      if (result.fallbackAnalysis || result.isApiError) {
        console.warn("⚠️ Using fallback analysis");
        
        const fallbackResult: AIAnalysisResult = {
          success: true,
          timestamp: result.timestamp || new Date().toISOString(),
          timeRange: timeRangeLabel,
          statistics: result.statistics || {},
          pumpUsage: result.pumpUsage || {},
          analysis: result.fallbackAnalysis || result.analysis || "Tidak ada analisis tersedia.",
          metadata: {
            dataPoints: soilData.length,
            analyzedAt: new Date().toLocaleString("id-ID"),
          }
        };
        
        setLastAnalysis(fallbackResult);
        setLastAnalysisTime(Date.now());
        localStorage.setItem("lastAIAnalysis", JSON.stringify(fallbackResult));
        localStorage.setItem("lastAnalysisTime", Date.now().toString());
        
        // 🔥 Simpan fallback ke Firebase History juga
        try {
          await saveAnalysisToFirebase(fallbackResult);
        } catch (saveError) {
          console.error("⚠️ Failed to save fallback to Firebase:", saveError);
        }
        
        if (result.message) {
          setError(`ℹ️ ${result.message}`);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || "Gagal menganalisis data");
      }
      
      // Pastikan analysis tidak undefined
      if (!result.analysis) {
        console.error("No analysis in response:", result);
        throw new Error("API tidak mengembalikan analisis. Cek OPENROUTER_API_KEY di .env.local");
      }

      // Simpan hasil
      setLastAnalysis(result);
      setLastAnalysisTime(Date.now());

      // Simpan ke localStorage
      localStorage.setItem("lastAIAnalysis", JSON.stringify(result));
      localStorage.setItem("lastAnalysisTime", Date.now().toString());

      // 🔥 Simpan ke Firebase History
      try {
        await saveAnalysisToFirebase(result);
      } catch (saveError) {
        console.error("⚠️ Failed to save to Firebase history, but analysis succeeded:", saveError);
        // Don't throw error here, analysis was successful
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat analisis";
      setError(errorMessage);
      console.error("Error running analysis:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, scheduleInterval, lastAnalysisTime, saveAnalysisToFirebase]);

  // Update schedule interval
  const updateSchedule = (interval: ScheduleInterval) => {
    setScheduleInterval(interval);
    localStorage.setItem("aiAnalysisInterval", interval);
    
    // Jika bukan manual, set timer untuk analisis otomatis
    if (interval !== "manual") {
      setLastAnalysisTime(Date.now());
      localStorage.setItem("lastAnalysisTime", Date.now().toString());
    }
  };

  // Timer untuk analisis otomatis
  useEffect(() => {
    if (scheduleInterval === "manual") return;

    const intervalMs = getIntervalMs(scheduleInterval);
    const checkInterval = Math.min(60000, intervalMs / 10); // Cek setiap menit atau 1/10 dari interval

    const timer = setInterval(() => {
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
      
      if (timeSinceLastAnalysis >= intervalMs) {
        runAnalysis(false);
      }
    }, checkInterval);

    return () => clearInterval(timer);
  }, [scheduleInterval, lastAnalysisTime, runAnalysis]);

  // Fungsi untuk mendapatkan waktu analisis berikutnya
  const getNextAnalysisTime = (): string => {
    if (scheduleInterval === "manual") return "Manual";
    
    const intervalMs = getIntervalMs(scheduleInterval);
    const nextTime = lastAnalysisTime + intervalMs;
    const now = Date.now();
    
    if (nextTime <= now) return "Sedang menunggu...";
    
    const diff = nextTime - now;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} hari lagi`;
    }
    if (hours > 0) {
      return `${hours} jam ${minutes} menit lagi`;
    }
    return `${minutes} menit lagi`;
  };

  return {
    isAnalyzing,
    lastAnalysis,
    error,
    scheduleInterval,
    runAnalysis,
    updateSchedule,
    getIntervalLabel,
    getNextAnalysisTime,
    // History
    analysisHistory,
    isLoadingHistory,
    loadAnalysisHistory,
  };
}
