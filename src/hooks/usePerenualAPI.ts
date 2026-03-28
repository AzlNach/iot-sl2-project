"use client";

import axios from "axios";
import { useCallback, useMemo, useState } from "react";

export type PerenualPlantDetails = {
  id: number;
  common_name: string;
  scientific_name: string;
  watering_general_benchmark?: string;
  harvest_season?: string;
  image_url?: string;
};

type UsePerenualAPIResult = {
  data: PerenualPlantDetails | null;
  loading: boolean;
  error: string | null;
  fetchById: (id: number) => Promise<PerenualPlantDetails | null>;
  reset: () => void;
};

export function usePerenualAPI(): UsePerenualAPIResult {
  const [data, setData] = useState<PerenualPlantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchById = useCallback(async (id: number) => {
    if (!id || Number.isNaN(id) || id <= 0) {
      setError("ID tanaman tidak valid");
      setData(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get<PerenualPlantDetails>(
        `/api/perenual/species-details?id=${encodeURIComponent(String(id))}`
      );

      const payload = res.data;
      if (!payload?.common_name) {
        throw new Error("Data tanaman tidak ditemukan atau format tidak valid");
      }

      setData(payload);
      return payload;
    } catch (err) {
      const pickServerError = (payload: unknown): string | null => {
        if (!payload || typeof payload !== "object") return null;
        const maybeError = (payload as { error?: unknown }).error;
        return typeof maybeError === "string" ? maybeError : null;
      };

      const message =
        axios.isAxiosError(err)
          ? pickServerError(err.response?.data) || err.message
          : err instanceof Error
            ? err.message
            : "Gagal mengambil data tanaman";
      setError(message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return useMemo(
    () => ({ data, loading, error, fetchById, reset }),
    [data, loading, error, fetchById, reset]
  );
}
