import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { estimateYieldUbinan } from "@/utils/agronomi";

/**
 * Inputs for agronomic forecasting.
 * NOTE: this is pure logic (no UI). Units must be consistent.
 */
export type AgronomyCalculatorInput = {
  /** YYYY-MM-DD */
  tanggalTanamISO: string;
  /** Total area (e.g. m²). Must match luasPetakUbinan unit. */
  luasTotal: number;
  /** Sampling plot area (e.g. m²). Must match luasTotal unit. */
  luasPetakUbinan: number;
  /** Plot yield (e.g. kg for the sampled plot). */
  hasilUbinan: number;
  /**
   * Harvest age in days (e.g. from Perenual / crop reference). If not provided, defaults to 90.
   */
  umurPanenHari?: number | null;
  /**
   * Optional: flowering age in days. If not provided, defaults to 0.5 * umurPanenHari.
   */
  umurBerbungaHari?: number | null;
  /**
   * Optional: pruning month offsets from planting (in months). Example: [1, 3].
   * We keep it as offsets because Perenual field shapes vary between plants.
   */
  pruningMonthOffsets?: number[] | null;
  /**
   * Optional: pest susceptibility (low/medium/high). Used only to decide if we show risk windows.
   */
  pestSusceptibility?: "low" | "medium" | "high" | null;
};

export type PhenologyStage = "vegetative" | "generative" | "maturation";

export type CalendarBackgroundStage = {
  stage: PhenologyStage;
  startISO: string; // inclusive
  endISO: string; // exclusive (FullCalendar recommended)
  color: string;
};

export type CalendarPointEvent = {
  id: string;
  title: string;
  dateISO: string;
  color?: string;
  textColor?: string;
  extendedProps?: Record<string, unknown>;
};

export type AgronomyCalendarData = {
  estimasiPanenTotal: number;
  tanggalPanenISO: string;
  tanggalBerbungaISO: string;
  stages: CalendarBackgroundStage[];
  tasks: CalendarPointEvent[];
  alerts: CalendarPointEvent[];
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function safeParseISO(dateISO: string): Date | null {
  const d = parseISO(dateISO);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Build phenology stages as background events.
 * We split [planting, harvest] into:
 * - Vegetative: 0% -> 50%
 * - Generative: 50% -> 80%
 * - Maturation: 80% -> 100%
 */
function buildStages(tan: Date, panen: Date): CalendarBackgroundStage[] {
  const totalDays = Math.max(1, differenceInCalendarDays(panen, tan));
  const vegEnd = addDays(tan, Math.round(totalDays * 0.5));
  const genEnd = addDays(tan, Math.round(totalDays * 0.8));

  return [
    {
      stage: "vegetative",
      startISO: toISODate(tan),
      endISO: toISODate(vegEnd),
      color: "#DCFCE7", // green-100
    },
    {
      stage: "generative",
      startISO: toISODate(vegEnd),
      endISO: toISODate(genEnd),
      color: "#FEF9C3", // yellow-100
    },
    {
      stage: "maturation",
      startISO: toISODate(genEnd),
      endISO: toISODate(addDays(panen, 1)),
      color: "#FFEDD5", // orange-100
    },
  ];
}

/**
 * Pure logic function.
 * - Calculates ubinan yield estimate
 * - Forecasts flowering + harvest dates
 * - Builds background stages + task events
 */
export function calculateAgronomyData(input: AgronomyCalculatorInput): AgronomyCalendarData {
  const tan = safeParseISO(input.tanggalTanamISO);
  if (!tan) {
    return {
      estimasiPanenTotal: 0,
      tanggalPanenISO: "",
      tanggalBerbungaISO: "",
      stages: [],
      tasks: [],
      alerts: [],
    };
  }

  const umurPanen = Math.max(1, Number(input.umurPanenHari ?? 90));
  const umurBerbunga = Math.max(1, Number(input.umurBerbungaHari ?? Math.round(umurPanen * 0.5)));

  const panenDate = addDays(tan, umurPanen);
  const berbungaDate = addDays(tan, umurBerbunga);

  const estimasiPanenTotal = estimateYieldUbinan({
    luasLahanTotal: input.luasTotal,
    luasPetakUbinan: input.luasPetakUbinan,
    hasilPanenPetakUbinan: input.hasilUbinan,
  });

  const stages = buildStages(tan, panenDate);

  const tasks: CalendarPointEvent[] = [
    {
      id: "planting",
      title: "🌱 Tanam",
      dateISO: toISODate(tan),
      color: "#89986D",
      textColor: "#0f172a",
    },
    {
      id: "flowering",
      title: "🌼 Prediksi Berbunga",
      dateISO: toISODate(berbungaDate),
      color: "#F59E0B",
      textColor: "#0f172a",
    },
    {
      id: "harvest",
      title: `🌾 Prediksi Panen (≈ ${estimasiPanenTotal})`,
      dateISO: toISODate(panenDate),
      color: "#C5D89D",
      textColor: "#0f172a",
      extendedProps: { estimasiPanenTotal },
    },
  ];

  // Optional pruning tasks (month offsets from planting)
  const offsets = input.pruningMonthOffsets ?? [];
  for (let idx = 0; idx < offsets.length; idx++) {
    const off = offsets[idx];
    if (!Number.isFinite(off)) continue;
    // Approx month as 30 days (pure heuristic)
    const d = addDays(tan, Math.round(off * 30));
    tasks.push({
      id: `prune-${idx}`,
      title: "✂️ Waktunya Pemangkasan",
      dateISO: toISODate(d),
      color: "#60A5FA",
      textColor: "#0f172a",
    });
  }

  return {
    estimasiPanenTotal,
    tanggalPanenISO: toISODate(panenDate),
    tanggalBerbungaISO: toISODate(berbungaDate),
    stages,
    tasks,
    alerts: [],
  };
}

/**
 * Build pest/disease risk alert from weather for a specific day.
 * We keep it small and deterministic so it stays "pure".
 */
export function buildPestRiskAlert(params: {
  /** YYYY-MM-DD */
  dateISO: string;
  /** 0..1 */
  pop?: number | null;
  main?: string | null;
  pestSusceptibility?: "low" | "medium" | "high" | null;
}): CalendarPointEvent | null {
  const pop = Number(params.pop ?? 0);
  const main = params.main ?? "";
  const sus = params.pestSusceptibility ?? "medium";

  // Only warn for medium/high crops.
  if (sus === "low") return null;

  const heavyRain = main.toLowerCase() === "rain" || pop >= 0.7;
  if (!heavyRain) return null;

  return {
    id: `pest-risk-${params.dateISO}`,
    title: "🚨 Risiko Hama/Penyakit (Hujan)",
    dateISO: params.dateISO,
    color: "#EF4444",
    textColor: "#ffffff",
    extendedProps: { pop, main, pestSusceptibility: sus },
  };
}
