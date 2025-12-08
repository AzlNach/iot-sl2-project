import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

interface SensorDataPoint {
  moisture: number;
  rawADC: number;
  pumpStatus: string;
  timestamp: number;
}

interface SensorDataResponse {
  success: boolean;
  data: SensorDataPoint[];
  total: number;
  limited: number;
  source: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("📂 Reading sensor data from local JSON file...");

    // Read file dari public/data
    const filePath = join(process.cwd(), "public", "data", "sensor-data.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    // Extract data dari struktur Firebase
    let allData: SensorDataPoint[] = [];

    // Cek berbagai path yang mungkin ada
    if (jsonData.sensorData?.history) {
      const historyData = jsonData.sensorData.history;
      Object.keys(historyData).forEach((key) => {
        const item = historyData[key];
        allData.push({
          moisture: item.moisture || 0,
          rawADC: item.rawADC || 0,
          pumpStatus: item.pumpStatus || "OFF",
          timestamp: item.timestamp || Date.now(),
        });
      });
    }

    // Jika ada path soilMoisture, tambahkan juga
    if (jsonData.soilMoisture) {
      Object.keys(jsonData.soilMoisture).forEach((key) => {
        const item = jsonData.soilMoisture[key];
        allData.push({
          moisture: item.moisture || 0,
          rawADC: item.rawADC || 0,
          pumpStatus: item.pumpStatus || "OFF",
          timestamp: item.timestamp || Date.now(),
        });
      });
    }

    console.log(`📊 Total data found: ${allData.length}`);

    // Sort by timestamp descending (terbaru dulu)
    allData.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to 500 most recent data points
    const limitedData = allData.slice(0, 1);

    console.log(`✅ Returning ${limitedData.length} most recent data points`);

    return NextResponse.json({
      success: true,
      data: limitedData,
      total: allData.length,
      limited: limitedData.length,
      source: "local-json",
      message: `Successfully loaded ${limitedData.length} data points from ${allData.length} total records`,
    });

  } catch (error) {
    console.error("❌ Error reading sensor data:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read sensor data from file",
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Make sure sensor-data.json exists in public/data folder"
      },
      { status: 500 }
    );
  }
}
