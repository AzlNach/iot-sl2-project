import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

// Inisialisasi OpenRouter with Llama 3.3 70B (FREE!)
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || ""
});

interface SoilDataPoint {
  moisture: number;
  rawADC: number;
  pumpStatus: string;
  timestamp: number;
}

// Cache untuk menyimpan hasil analisis (in-memory cache)
interface CacheEntry {
  analysis: string;
  timestamp: number;
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
}

const analysisCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 menit cache

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 15 * 1000; // Minimal 15 detik antar request

type AnalysisInput = {
  totalReadings: number;
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
};

// Fungsi fallback untuk analisis otomatis ketika quota exceeded
function generateFallbackAnalysis(dataForAI: AnalysisInput): string {
  const stats = dataForAI.statistics;
  const pump = dataForAI.pumpUsage;
  const avgMoisture = parseFloat(stats.rata_rata);
  
  let analysis = "# 📊 ANALISIS OTOMATIS SISTEM IRIGASI\n\n";
  analysis += "_Analisis ini dihasilkan secara otomatis karena quota API tercapai._\n\n";
  
  // Status Kesehatan Tanah
  analysis += "## 1. 🌱 Status Kesehatan Tanah\n\n";
  if (avgMoisture >= 70) {
    analysis += `**Status: SANGAT BAIK** ✅\n\nKelembaban rata-rata ${stats.rata_rata}% menunjukkan kondisi tanah yang sangat optimal. Tanah memiliki kadar air yang cukup untuk mendukung pertumbuhan tanaman.\n\n`;
  } else if (avgMoisture >= 50) {
    analysis += `**Status: BAIK** ✅\n\nKelembaban rata-rata ${stats.rata_rata}% dalam kondisi baik. Tanah memiliki kelembaban yang cukup namun perlu monitoring berkala.\n\n`;
  } else if (avgMoisture >= 30) {
    analysis += `**Status: CUKUP** ⚠️\n\nKelembaban rata-rata ${stats.rata_rata}% masih dalam batas wajar, namun perlu perhatian. Pertimbangkan untuk meningkatkan frekuensi penyiraman.\n\n`;
  } else {
    analysis += `**Status: PERLU PERHATIAN** ⚠️\n\nKelembaban rata-rata ${stats.rata_rata}% relatif rendah. Sistem perlu segera ditingkatkan untuk mencegah kekeringan tanah.\n\n`;
  }
  
  // Analisis Pola & Tren
  analysis += "## 2. 📈 Analisis Pola & Tren\n\n";
  analysis += `- **Tren Kelembaban**: ${stats.tren}\n`;
  analysis += `- **Range Kelembaban**: ${stats.minimum}% - ${stats.maksimum}%\n`;
  analysis += `- **Variasi**: ${(stats.maksimum - stats.minimum).toFixed(1)}%\n\n`;
  
  if (stats.tren === "meningkat") {
    analysis += "Tren menunjukkan peningkatan kelembaban, mengindikasikan sistem irigasi bekerja efektif atau ada peningkatan curah hujan.\n\n";
  } else if (stats.tren === "menurun") {
    analysis += "Tren menunjukkan penurunan kelembaban. Perhatikan apakah sistem pompa bekerja optimal atau ada peningkatan suhu lingkungan.\n\n";
  } else {
    analysis += "Kelembaban stabil, menunjukkan keseimbangan baik antara penyiraman dan penguapan.\n\n";
  }
  
  // Efisiensi Pompa
  analysis += "## 3. 💧 Efisiensi Pompa\n\n";
  const pumpPercentage = parseFloat(pump.persentase);
  analysis += `- **Aktivasi Pompa**: ${pump.aktivasi} kali (${pump.persentase}%)\n`;
  
  if (pumpPercentage > 50) {
    analysis += `- **Evaluasi**: Pompa terlalu sering aktif (>50%). Pertimbangkan untuk:\n`;
    analysis += `  - Meningkatkan threshold minimum kelembaban\n`;
    analysis += `  - Memeriksa kebocoran sistem\n`;
    analysis += `  - Evaluasi kapasitas pompa\n\n`;
  } else if (pumpPercentage > 30) {
    analysis += `- **Evaluasi**: Frekuensi aktivasi pompa optimal (30-50%).\n\n`;
  } else if (pumpPercentage > 10) {
    analysis += `- **Evaluasi**: Frekuensi aktivasi pompa cukup baik (10-30%).\n\n`;
  } else {
    analysis += `- **Evaluasi**: Pompa jarang aktif (<10%). Periksa apakah:\n`;
    analysis += `  - Kelembaban alami sudah cukup\n`;
    analysis += `  - Sistem sensor bekerja dengan baik\n`;
    analysis += `  - Threshold tidak terlalu rendah\n\n`;
  }
  
  // Rekomendasi
  analysis += "## 4. 💡 Rekomendasi Tindakan\n\n";
  analysis += "### Jangka Pendek (1-7 hari):\n";
  if (avgMoisture < 40) {
    analysis += "- ⚠️ **PRIORITAS**: Tingkatkan frekuensi penyiraman\n";
    analysis += "- Monitoring intensif setiap 6 jam\n";
    analysis += "- Pertimbangkan penyiraman manual tambahan\n\n";
  } else {
    analysis += "- ✅ Pertahankan jadwal monitoring rutin\n";
    analysis += "- Observasi tren kelembaban harian\n";
    analysis += "- Catat perubahan cuaca eksternal\n\n";
  }
  
  analysis += "### Jangka Panjang:\n";
  analysis += "- Implementasi sistem prediktif berbasis AI (upgrade API quota)\n";
  analysis += "- Integrasi sensor cuaca untuk optimasi otomatis\n";
  analysis += "- Backup sistem pompa untuk redundansi\n";
  analysis += "- Analisis data bulanan untuk pola musiman\n\n";
  
  // Peringatan
  analysis += "## 5. ℹ️ Informasi Sistem\n\n";
  analysis += "ℹ️ **Mode Analisis**: Algoritma lokal digunakan untuk analisis ini.\n";
  analysis += "- Analisis berbasis statistik dan rule-based logic\n";
  analysis += "- Tidak memerlukan koneksi ke AI cloud service\n";
  analysis += "- Hasil tetap akurat untuk evaluasi dasar sistem irigasi\n\n";
  
  analysis += "---\n\n";
  analysis += `_Analisis otomatis dihasilkan pada ${new Date().toLocaleString("id-ID")}_\n`;
  analysis += `_Total ${dataForAI.totalReadings} data points dianalisis_`;
  
  return analysis;
}

export async function POST(request: NextRequest) {
  try {
    const { soilData, timeRange } = await request.json();

    // Cek cache terlebih dahulu
    const cacheKey = `${timeRange}_${soilData.length}`;
    const cachedData = analysisCache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log("✅ Menggunakan hasil analisis dari cache");
      return NextResponse.json({
        success: true,
        timestamp: new Date(cachedData.timestamp).toISOString(),
        timeRange,
        statistics: cachedData.statistics,
        pumpUsage: cachedData.pumpUsage,
        analysis: cachedData.analysis,
        metadata: {
          dataPoints: soilData.length,
          analyzedAt: new Date(cachedData.timestamp).toLocaleString("id-ID"),
          fromCache: true,
          cacheExpiresIn: Math.round((CACHE_DURATION - (Date.now() - cachedData.timestamp)) / 1000 / 60) + " menit"
        }
      });
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
      return NextResponse.json(
        { 
          error: "Terlalu banyak request", 
          message: `Mohon tunggu ${waitTime} detik sebelum analisis berikutnya untuk menghindari quota limit.`,
          retryAfter: waitTime
        },
        { status: 429 }
      );
    }
    lastRequestTime = now;

    if (!soilData || soilData.length === 0) {
      return NextResponse.json(
        { error: "Data kelembaban tanah tidak tersedia" },
        { status: 400 }
      );
    }

    // Hitung statistik dari data
    const moistureValues = soilData.map((d: SoilDataPoint) => d.moisture);
    const avgMoisture = moistureValues.reduce((a: number, b: number) => a + b, 0) / moistureValues.length;
    const minMoisture = Math.min(...moistureValues);
    const maxMoisture = Math.max(...moistureValues);
    
    const pumpActivations = soilData.filter((d: SoilDataPoint) => d.pumpStatus === "ON").length;
    const totalReadings = soilData.length;
    const pumpUsagePercentage = ((pumpActivations / totalReadings) * 100).toFixed(1);

    // Hitung tren
    const recentData = soilData.slice(-10);
    const olderData = soilData.slice(0, 10);
    const recentAvg = recentData.reduce((a: number, d: SoilDataPoint) => a + d.moisture, 0) / recentData.length;
    const olderAvg = olderData.reduce((a: number, d: SoilDataPoint) => a + d.moisture, 0) / olderData.length;
    const trend = recentAvg > olderAvg ? "meningkat" : recentAvg < olderAvg ? "menurun" : "stabil";

    // Format data untuk AI
    const dataForAI = {
      timeRange,
      totalReadings,
      statistics: {
        rata_rata: avgMoisture.toFixed(1),
        minimum: minMoisture,
        maksimum: maxMoisture,
        tren: trend
      },
      pumpUsage: {
        aktivasi: pumpActivations,
        persentase: pumpUsagePercentage
      },
      sampleData: soilData.slice(-20).map((d: SoilDataPoint) => ({
        moisture: d.moisture,
        rawADC: d.rawADC,
        pumpStatus: d.pumpStatus,
        timestamp: new Date(d.timestamp).toLocaleString("id-ID")
      }))
    };

    // Prompt untuk Gemini AI
    const prompt = `
Kamu adalah ahli agrikultur dan sistem irigasi pintar. Analisis data kelembaban tanah berikut dan berikan rekomendasi yang detail dan praktis.

DATA ANALISIS (${timeRange}):
- Total pembacaan: ${totalReadings}
- Kelembaban rata-rata: ${avgMoisture.toFixed(1)}%
- Kelembaban minimum: ${minMoisture}%
- Kelembaban maksimum: ${maxMoisture}%
- Tren kelembaban: ${trend}
- Aktivasi pompa: ${pumpActivations} kali (${pumpUsagePercentage}% dari total pembacaan)

SAMPLE DATA TERBARU:
${dataForAI.sampleData.map((d: { moisture: number; rawADC: number; pumpStatus: string; timestamp: string }, i: number) => 
  `${i + 1}. Moisture: ${d.moisture}%, ADC: ${d.rawADC}, Pompa: ${d.pumpStatus}, Waktu: ${d.timestamp}`
).join('\n')}

TUGAS ANALISIS:
1. **Status Kesehatan Tanah**: Evaluasi kondisi kelembaban tanah secara keseluruhan (sangat baik/baik/cukup/buruk/sangat buruk)

2. **Analisis Pola & Tren**: 
   - Identifikasi pola kelembaban (stabil, fluktuatif, atau tidak menentu)
   - Analisis tren (meningkat/menurun/stabil) dan kemungkinan penyebabnya
   - Evaluasi efektivitas sistem irigasi otomatis

3. **Efisiensi Pompa**:
   - Evaluasi frekuensi aktivasi pompa (terlalu sering/optimal/jarang)
   - Analisis apakah pompa bekerja efisien
   - Identifikasi potensi pemborosan air atau kekurangan penyiraman

4. **Rekomendasi Tindakan Jangka Pendek** (1-7 hari ke depan):
   - Tindakan konkret yang perlu dilakukan segera
   - Penyesuaian threshold pompa jika diperlukan
   - Jadwal monitoring yang disarankan

5. **Rekomendasi Berkelanjutan** (jangka panjang):
   - Strategi optimalisasi sistem irigasi
   - Tips penghematan air
   - Saran maintenance sistem
   - Rekomendasi perubahan setting otomatis
   - Pertimbangan faktor musim/cuaca

6. **Peringatan & Perhatian Khusus**:
   - Identifikasi masalah potensial
   - Warning jika ada anomali data
   - Saran preventif

Berikan analisis dalam format yang jelas, terstruktur dengan poin-poin, dan mudah dipahami oleh petani atau pengguna sistem IoT. Gunakan bahasa Indonesia yang profesional namun mudah dimengerti.
`;

    // Panggil OpenRouter Llama 3.3 70B (FREE & UNLIMITED!)
    console.log(`🤖 Memanggil OpenRouter Llama 3.3 70B untuk analisis ${totalReadings} data points...`);
    
    let analysis: string;
    try {
      const completion = await openrouter.chat.send({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: 2048,
      });
      
      const content = completion.choices[0]?.message?.content;
      analysis = typeof content === 'string' ? content : JSON.stringify(content);
      
      if (!analysis) {
        throw new Error("No response from AI");
      }
      
      console.log("✅ Analisis AI berhasil dengan Llama 3.3 70B");
    } catch (aiError) {
      // Handle any API errors with fallback
      console.error("❌ OpenRouter API Error:", aiError);
      
      // Gunakan fallback analysis untuk semua error
      return NextResponse.json(
        { 
          error: "API Error", 
          message: "Terjadi error saat memanggil AI. Sistem menggunakan analisis otomatis.",
          fallbackAnalysis: generateFallbackAnalysis(dataForAI),
          statistics: dataForAI.statistics,
          pumpUsage: dataForAI.pumpUsage,
          isApiError: true
        },
        { status: 200 } // Return 200 karena ada fallback
      );
    }

    // Simpan ke cache
    const cacheEntry: CacheEntry = {
      analysis,
      timestamp: Date.now(),
      statistics: dataForAI.statistics,
      pumpUsage: dataForAI.pumpUsage
    };
    analysisCache.set(cacheKey, cacheEntry);
    console.log(`💾 Hasil analisis disimpan ke cache untuk ${CACHE_DURATION / 1000 / 60} menit`);

    // Return hasil analisis
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeRange,
      statistics: dataForAI.statistics,
      pumpUsage: dataForAI.pumpUsage,
      analysis,
      metadata: {
        dataPoints: totalReadings,
        analyzedAt: new Date().toLocaleString("id-ID"),
        fromCache: false
      }
    });

  } catch (error) {
    console.error("Error analyzing soil data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Gagal menganalisis data", 
        details: errorMessage,
        hint: "Pastikan OPENROUTER_API_KEY sudah diset di .env.local. Dapatkan gratis di https://openrouter.ai/keys"
      },
      { status: 500 }
    );
  }
}
