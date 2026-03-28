"use client";

import { useEffect, useState } from "react";
import { usePerenualAPI } from "@/hooks/usePerenualAPI";

export default function PlantDetailPanel({
  plantId,
  visible,
  onReset,
}: {
  plantId: number | null;
  visible: boolean;
  onReset?: () => void;
}) {
  const { data, loading, error, fetchById, reset } = usePerenualAPI();
  const [lastFetchedId, setLastFetchedId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (!plantId) return;
    if (plantId === lastFetchedId) return;
    setLastFetchedId(plantId);
    fetchById(plantId);
  }, [visible, plantId, lastFetchedId, fetchById]);

  const handleReset = () => {
    reset();
    setLastFetchedId(null);
    onReset?.();
  };

  if (!visible) return <div className="rounded-2xl" />;

  return (
    <div className="rounded-2xl border-2 border-[#C5D89D] bg-white shadow-xl p-5 transition-all duration-300 animate-in fade-in slide-in-from-right-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-500">Detail Tanaman</div>
          <div className="text-lg font-bold text-gray-800">{data?.common_name || "Memuat..."}</div>
          {!!data?.scientific_name && (
            <div className="text-sm text-gray-600 italic">{data.scientific_name}</div>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Reset
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Mengambil data tanaman...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 w-full lg:w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image_url || "/mizugami-logo.png"}
              alt={data.common_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Watering benchmark</div>
              <div className="font-semibold text-gray-800">
                {data.watering_general_benchmark || "-"}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Harvest season (API)</div>
              <div className="font-semibold text-gray-800">{data.harvest_season || "-"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
