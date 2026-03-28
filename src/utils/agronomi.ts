import { addMonths, parseISO } from "date-fns";

export type HarvestSeason = "Spring" | "Summer" | "Autumn" | "Winter";

export type AgronomyEstimation = {
  /** YYYY-MM-DD */
  predictedHarvestDate: string;
  /** Human readable Indonesian label */
  predictedHarvestLabel: string;
  estimasiHasilTon: number;
};

// Very simple baseline constant (can be tuned later per crop)
export const DEFAULT_YIELD_TON_PER_HA = 50;

/**
 * BPS Ubinan method (simplified):
 * Estimasi Panen Total = (Luas Lahan Total / Luas Petak Ubinan) × Hasil Panen Petak Ubinan
 *
 * Notes:
 * - Units must be consistent between total area and plot area (e.g. both in m²).
 * - Plot yield should be total weight for that plot (e.g. kg).
 */
export function estimateYieldUbinan(params: {
  luasLahanTotal: number;
  luasPetakUbinan: number;
  hasilPanenPetakUbinan: number;
}): number {
  const total = Number(params.luasLahanTotal);
  const plotArea = Number(params.luasPetakUbinan);
  const plotYield = Number(params.hasilPanenPetakUbinan);

  if (
    Number.isNaN(total) ||
    Number.isNaN(plotArea) ||
    Number.isNaN(plotYield) ||
    total <= 0 ||
    plotArea <= 0 ||
    plotYield <= 0
  ) {
    return 0;
  }

  // total / plotArea = how many plots fill the total area
  const estimate = (total / plotArea) * plotYield;
  return Math.round(estimate * 100) / 100;
}

const seasonToMonthOffset: Record<HarvestSeason, number> = {
  Spring: 3,
  Summer: 6,
  Autumn: 9,
  Winter: 12,
};

function normalizeSeason(season?: string | null): HarvestSeason | null {
  if (!season) return null;
  const s = season.trim().toLowerCase();
  if (s === "spring") return "Spring";
  if (s === "summer") return "Summer";
  if (s === "autumn" || s === "fall") return "Autumn";
  if (s === "winter") return "Winter";
  return null;
}

export function estimateHarvestDate(
  tanggalTanamISO: string,
  harvestSeason?: string | null
): { dateISO: string; label: string } {
  const base = parseISO(tanggalTanamISO);
  if (Number.isNaN(base.getTime())) {
    return { dateISO: "", label: "Tanggal tanam tidak valid" };
  }

  const season = normalizeSeason(harvestSeason);
  // If API provides season, map to month offset.
  // Otherwise default to +4 months as a generic growth cycle.
  const offsetMonths = season ? seasonToMonthOffset[season] : 4;
  const predicted = addMonths(base, offsetMonths);

  const dateISO = predicted.toISOString().slice(0, 10);
  const label = predicted.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return { dateISO, label };
}

export function estimateYieldTon(
  luasLahanHektar: number,
  tonPerHa = DEFAULT_YIELD_TON_PER_HA
): number {
  const area = Number(luasLahanHektar);
  if (Number.isNaN(area) || area <= 0) return 0;
  return Math.round(area * tonPerHa * 100) / 100;
}

export function buildAgronomyEstimation(params: {
  tanggalTanamISO: string;
  luasLahanHektar: number;
  harvestSeason?: string | null;
  tonPerHa?: number;
}): AgronomyEstimation {
  const { dateISO, label } = estimateHarvestDate(
    params.tanggalTanamISO,
    params.harvestSeason
  );
  const estimasiHasilTon = estimateYieldTon(
    params.luasLahanHektar,
    params.tonPerHa
  );

  return {
    predictedHarvestDate: dateISO,
    predictedHarvestLabel: label,
    estimasiHasilTon,
  };
}
