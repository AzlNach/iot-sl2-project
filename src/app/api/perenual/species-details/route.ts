import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://perenual.com/api/v2/species/details";

type PerenualSpeciesDetailsResponse = {
  id?: number;
  common_name?: string | null;
  scientific_name?: string | string[] | null;
  watering_general_benchmark?: {
    value?: string | null;
    unit?: string | null;
  } | null;
  harvest_season?: string | null;
  default_image?: {
    regular_url?: string | null;
  } | null;
  // Perenual responses can include many extra fields; we keep this open
  [key: string]: unknown;
};

export type PlantDetailsDTO = {
  id: number;
  common_name: string;
  scientific_name: string;
  watering_general_benchmark?: string;
  harvest_season?: string;
  image_url?: string;
};

function normalizeScientificName(value: PerenualSpeciesDetailsResponse["scientific_name"]) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}

function normalizeWateringBenchmark(
  value: PerenualSpeciesDetailsResponse["watering_general_benchmark"]
) {
  const v = value?.value ? String(value.value) : "";
  const u = value?.unit ? String(value.unit) : "";
  const s = `${v} ${u}`.trim();
  return s || undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("id");

  const id = rawId ? Number(rawId) : NaN;
  if (!rawId || Number.isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  const apiKey =
    process.env.PERENUAL_API_KEY || process.env.NEXT_PUBLIC_PERENUAL_API_KEY || "";

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Perenual API key tidak ditemukan. Tambahkan PERENUAL_API_KEY (recommended) di .env.local lalu restart dev server.",
      },
      { status: 500 }
    );
  }

  try {
    const url = `${API_BASE_URL}/${encodeURIComponent(String(id))}?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Perenual request failed (${res.status})`, details: text },
        { status: res.status }
      );
    }

    const raw = JSON.parse(text) as PerenualSpeciesDetailsResponse;

    const dto: PlantDetailsDTO = {
      id,
      common_name: String(raw.common_name ?? "").trim(),
      scientific_name: normalizeScientificName(raw.scientific_name).trim(),
      watering_general_benchmark: normalizeWateringBenchmark(raw.watering_general_benchmark),
      harvest_season: raw.harvest_season ? String(raw.harvest_season) : undefined,
      image_url: raw.default_image?.regular_url ? String(raw.default_image.regular_url) : undefined,
    };

    return NextResponse.json(dto);
  } catch (err) {
    console.error("Error proxying Perenual species details:", err);
    return NextResponse.json(
      { error: "Failed to fetch Perenual details" },
      { status: 500 }
    );
  }
}
