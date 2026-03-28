"use client";

import type { WeatherForecast } from "@/hooks/useWeatherForecast";

export default function WeatherEcoAlert({
  forecast,
}: {
  forecast: WeatherForecast | null;
}) {
  const tomorrow = forecast?.list?.[1];
  const rainChance = tomorrow ? Math.round((tomorrow.pop ?? 0) * 100) : 0;
  const main = tomorrow?.weather?.[0]?.main;

  const shouldEcoMode = Boolean(tomorrow) && (main === "Rain" || rainChance >= 60);

  if (!tomorrow) return null;

  return (
    <div
      className={
        shouldEcoMode
          ? "rounded-2xl border-2 border-[#C5D89D] bg-[#F6F0D7] p-4 shadow-lg"
          : "rounded-2xl border border-gray-200 bg-white p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{shouldEcoMode ? "🌧️" : "ℹ️"}</div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">
            {shouldEcoMode
              ? "Eco-Mode: Penyiraman otomatis ditunda"
              : "Eco-Mode: Tidak aktif"}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {shouldEcoMode
              ? "Besok diprediksi hujan, jadi penyiraman otomatis ditunda untuk hemat air."
              : "Tidak ada indikasi hujan signifikan besok."}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Prediksi besok: {main || "-"} • Peluang hujan: {rainChance}%
          </div>
        </div>
        {shouldEcoMode && (
          <span className="badge badge-medium whitespace-nowrap">Eco-Mode</span>
        )}
      </div>
    </div>
  );
}
