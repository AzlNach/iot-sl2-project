"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "@/firebase/config";
import { usePerenualAPI } from "@/hooks/usePerenualAPI";
import { buildAgronomyEstimation, estimateYieldUbinan } from "@/utils/agronomi";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";

type PlantDictionaryItem = {
  label: string;
  id?: number;
};

// Kamus tanaman (Nama Lokal -> Perenual ID)
// Item tanpa ID dibiarkan tetap muncul di list, tapi akan menampilkan pesan bahwa ID belum tersedia.
const PLANT_DICTIONARY: PlantDictionaryItem[] = [
  { label: "Bayam" },
  { label: "Kangkung", id: 4301 },
  { label: "Sawi Hijau / Caisim", id: 1329 },
  { label: "Pakcoy / Sawi Sendok", id: 1330 },
  { label: "Selada", id: 4626 },
  { label: "Seledri", id: 862 },
  { label: "Daun Bawang", id: 671 },
  { label: "Kemangi", id: 5497 },
  { label: "Kubis / Kol", id: 1322 },
  { label: "Tomat", id: 8758 },
  { label: "Cabai Rawit" },
  { label: "Cabai Merah", id: 1595 },
  { label: "Terong", id: 7405 },
  { label: "Mentimun / Timun", id: 2251 },
  { label: "Pare / Paria", id: 5228 },
  { label: "Kacang Panjang" },
  { label: "Buncis", id: 5842 },
  { label: "Oyong / Gambas" },
  { label: "Labu Siam" },
  { label: "Brokoli", id: 1327 },
  { label: "Kembang Kol", id: 1321 },
  { label: "Asparagus", id: 1026 },
  { label: "Wortel", id: 8546 },
  { label: "Kentang", id: 7409 },
  { label: "Bawang Merah" },
  { label: "Bawang Putih", id: 683 },
  { label: "Bawang Bombai", id: 667 },
  { label: "Lobak", id: 6539 },
];

type PlantProfile = {
  api_plant_id: number;
  jenis_tanaman: string;
  tanggal_tanam: string; // YYYY-MM-DD
  luas_lahan_hektar: number;
  estimasi_hasil_ton: number;
  kebutuhan_air_harian_unit: string;
  gambar_tanaman: string;
  predicted_harvest_date?: string;
  predicted_harvest_label?: string;
  scientific_name?: string;
  harvest_season?: string;
  // Ubinan method inputs
  luas_petak_ubinan?: number;
  hasil_panen_petak_ubinan?: number;
};

const RTDB_PATH = "devices/dummy_device/plant_profile";

export default function PlantProfileForm({
  onSelectedPlantIdChange,
  onSaved,
}: {
  onSelectedPlantIdChange?: (id: number | null) => void;
  onSaved?: (profile: {
    jenis_tanaman: string;
    tanggal_tanam: string;
    predicted_harvest_date?: string;
  }) => void;
}) {
  const { data, error: perenualError, fetchById, reset } = usePerenualAPI();
  const { lastAnalysis } = useAIAnalysis();

  const [selectedPlantKey, setSelectedPlantKey] = useState<string>("");
  const [plantId, setPlantId] = useState<string>("");
  const [tanggalTanam, setTanggalTanam] = useState<string>("");
  const [luasLahan, setLuasLahan] = useState<string>("");
  const [luasPetakUbinan, setLuasPetakUbinan] = useState<string>("");
  const [hasilPanenPetakUbinan, setHasilPanenPetakUbinan] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<PlantProfile | null>(null);

  // Load existing profile (if any) just for UX
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await get(ref(database, RTDB_PATH));
        if (snap.exists()) {
          setExistingProfile(snap.val() as PlantProfile);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // Prefill form if existing profile exists
  useEffect(() => {
    if (!existingProfile) return;
    if (existingProfile.api_plant_id) setPlantId(String(existingProfile.api_plant_id));
    if (existingProfile.tanggal_tanam) setTanggalTanam(existingProfile.tanggal_tanam);
    if (existingProfile.luas_lahan_hektar) setLuasLahan(String(existingProfile.luas_lahan_hektar));
    if (existingProfile.luas_petak_ubinan)
      setLuasPetakUbinan(String(existingProfile.luas_petak_ubinan));
    if (existingProfile.hasil_panen_petak_ubinan)
      setHasilPanenPetakUbinan(String(existingProfile.hasil_panen_petak_ubinan));
  }, [existingProfile]);

  // Auto-fetch when plantId changes (debounced-lite via guard)
  useEffect(() => {
    const id = Number(plantId);
    if (!plantId) return;
    if (Number.isNaN(id) || id <= 0) return;
    // fetch silently when changing selection
    fetchById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  const computed = useMemo(() => {
    const luas = Number(luasLahan);
    if (!tanggalTanam || Number.isNaN(luas) || luas <= 0) return null;
    return buildAgronomyEstimation({
      tanggalTanamISO: tanggalTanam,
      luasLahanHektar: luas,
      harvestSeason: data?.harvest_season,
    });
  }, [tanggalTanam, luasLahan, data?.harvest_season]);

  const aiAgronomy = lastAnalysis?.structured?.agronomy;

  const predictedHarvestDate = aiAgronomy?.predictedHarvestDate || computed?.predictedHarvestDate;
  const predictedHarvestLabel = aiAgronomy?.predictedHarvestLabel || computed?.predictedHarvestLabel;

  const estimasiPanenUbinan = useMemo(() => {
    const fromAI = aiAgronomy?.estimasiPanenTotalUbinan;
    if (typeof fromAI === "number" && Number.isFinite(fromAI)) return fromAI;

    const luas = Number(luasLahan);
    const plotArea = Number(luasPetakUbinan);
    const plotYield = Number(hasilPanenPetakUbinan);
    if (Number.isNaN(luas) || Number.isNaN(plotArea) || Number.isNaN(plotYield)) return 0;
    if (luas <= 0 || plotArea <= 0 || plotYield <= 0) return 0;
    return estimateYieldUbinan({
      luasLahanTotal: luas,
      luasPetakUbinan: plotArea,
      hasilPanenPetakUbinan: plotYield,
    });
  }, [aiAgronomy?.estimasiPanenTotalUbinan, luasLahan, luasPetakUbinan, hasilPanenPetakUbinan]);

  const handlePickPlant = (key: string) => {
    setSaveSuccess(null);
    setSaveError(null);
    setSelectedPlantKey(key);

    const item = PLANT_DICTIONARY.find((x) => x.label === key);
    if (!item?.id) {
      setPlantId("");
      onSelectedPlantIdChange?.(null);
      reset();
      setSaveError("ID Perenual untuk tanaman ini belum tersedia. Silakan lengkapi kamus ID.");
      return;
    }

    setPlantId(String(item.id));
    onSelectedPlantIdChange?.(item.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    const id = Number(plantId);
    const luas = Number(luasLahan);
    const plotArea = Number(luasPetakUbinan);
    const plotYield = Number(hasilPanenPetakUbinan);
    if (!data) {
      setSaveError("Silakan ambil data tanaman dulu dari Perenual.");
      return;
    }

    if (!plantId || Number.isNaN(id) || id <= 0) {
      setSaveError("Silakan pilih tanaman dari daftar terlebih dahulu.");
      return;
    }
    if (!tanggalTanam) {
      setSaveError("Tanggal tanam wajib diisi.");
      return;
    }
    if (Number.isNaN(luas) || luas <= 0) {
      setSaveError("Luas lahan total wajib diisi dan harus > 0.");
      return;
    }

    if (Number.isNaN(plotArea) || plotArea <= 0) {
      setSaveError("Luas petak ubinan wajib diisi dan harus > 0.");
      return;
    }

    if (Number.isNaN(plotYield) || plotYield <= 0) {
      setSaveError("Hasil panen petak ubinan wajib diisi dan harus > 0.");
      return;
    }

    const estimation = buildAgronomyEstimation({
      tanggalTanamISO: tanggalTanam,
      luasLahanHektar: luas,
      harvestSeason: data.harvest_season,
    });

    const ubinanTotal = estimateYieldUbinan({
      luasLahanTotal: luas,
      luasPetakUbinan: plotArea,
      hasilPanenPetakUbinan: plotYield,
    });

    const payload: PlantProfile = {
      api_plant_id: id,
      jenis_tanaman: data.common_name,
      scientific_name: data.scientific_name,
      harvest_season: data.harvest_season,
      tanggal_tanam: tanggalTanam,
      luas_lahan_hektar: luas,
      // IMPORTANT: keep the same field name for compatibility, but the value now uses ubinan method
      estimasi_hasil_ton: ubinanTotal,
      predicted_harvest_date: estimation.predictedHarvestDate,
      predicted_harvest_label: estimation.predictedHarvestLabel,
      kebutuhan_air_harian_unit: data.watering_general_benchmark || "-",
      gambar_tanaman: data.image_url || "",
      luas_petak_ubinan: plotArea,
      hasil_panen_petak_ubinan: plotYield,
    };

    try {
      setSaving(true);
      await set(ref(database, RTDB_PATH), payload);
      setExistingProfile(payload);
      setSaveSuccess("Plant profile tersimpan ke Firebase Realtime Database.");
      onSaved?.({
        jenis_tanaman: payload.jenis_tanaman,
        tanggal_tanam: payload.tanggal_tanam,
        predicted_harvest_date: payload.predicted_harvest_date,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-[#C5D89D]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🌿 Plant Profile Setup</h2>
          <p className="text-gray-600 mt-1">
            Cari tanaman via Perenual (pakai ID), preview nama & gambar, lalu simpan ke Firebase.
          </p>
        </div>
        {existingProfile?.jenis_tanaman && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Tersimpan</div>
            <div className="font-bold text-gray-800">{existingProfile.jenis_tanaman}</div>
            <div className="text-xs text-gray-500">ID: {existingProfile.api_plant_id}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plant picker (Listbox/Dropdown) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Tanaman (List)</label>
            <select
              value={selectedPlantKey}
              onChange={(e) => handlePickPlant(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
            >
              <option value="" disabled>
                -- Pilih salah satu --
              </option>
              {PLANT_DICTIONARY.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}{p.id ? "" : " (ID belum ada)"}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-500">
              ID Perenual terpilih: <span className="font-mono">{plantId || "-"}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {perenualError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {perenualError}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Tanam</label>
            <input
              type="date"
              value={tanggalTanam}
              onChange={(e) => setTanggalTanam(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Luas Lahan Total</label>
            <input
              value={luasLahan}
              onChange={(e) => setLuasLahan(e.target.value)}
              placeholder="contoh: 1000 (m²) atau 0.8 (ha) — konsisten dengan ubinan"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
              inputMode="decimal"
            />
            <div className="text-xs text-gray-500 mt-1">
              Penting: satuan luas total harus sama dengan satuan luas ubinan (mis. sama-sama m²).
            </div>
          </div>
        </div>

        {/* Ubinan inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Luas Petak Ubinan</label>
            <input
              value={luasPetakUbinan}
              onChange={(e) => setLuasPetakUbinan(e.target.value)}
              placeholder="contoh: 2.5 (m²)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hasil Panen Petak Ubinan</label>
            <input
              value={hasilPanenPetakUbinan}
              onChange={(e) => setHasilPanenPetakUbinan(e.target.value)}
              placeholder="contoh: 3.2 (kg)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
              inputMode="decimal"
            />
            <div className="text-xs text-gray-500 mt-1">
              Masukkan total berat panen untuk petak ubinan (mis. kg).
            </div>
          </div>
        </div>

        {/* Calculations preview */}
        {predictedHarvestLabel && predictedHarvestDate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Estimasi Panen</div>
              <div className="text-lg font-bold text-gray-800 mt-1">{predictedHarvestLabel}</div>
              <div className="text-xs text-gray-500 mt-1">Tanggal: {predictedHarvestDate}</div>
              {aiAgronomy?.notes && (
                <div className="text-xs text-gray-500 mt-2">Catatan AI: {aiAgronomy.notes}</div>
              )}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Estimasi Panen Total (Ubinan)</div>
              <div className="text-lg font-bold text-gray-800 mt-1">{estimasiPanenUbinan}</div>
              <div className="text-xs text-gray-500 mt-1">
                Rumus: (Luas Total / Luas Ubinan) × Hasil Ubinan
              </div>
            </div>
          </div>
        )}

        {/* Save messages */}
        {saveError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saveSuccess}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 rounded-xl bg-[#9CAB84] text-white font-bold hover:bg-[#89986D] transition disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Plant Profile"}
        </button>

        <div className="text-xs text-gray-500">
          Path database: <span className="font-mono">{RTDB_PATH}</span>
        </div>
      </form>
    </div>
  );
}
