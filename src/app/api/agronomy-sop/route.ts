import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

type DailyWeather = {
  dt: number;
  temp?: { min?: number; max?: number; day?: number };
  humidity?: number;
  pop?: number;
  rain?: number;
  weather?: Array<{ main: string; description: string }>;
};

type AgronomyTask = {
  id: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  category:
    | "planting"
    | "nursery"
    | "irrigation"
    | "fertilization"
    | "weed_control"
    | "pest_disease"
    | "pruning"
    | "thinning"
    | "training"
    | "mulching"
    | "soil_amendment"
    | "monitoring"
    | "harvest"
    | "post_harvest"
    | "other";
  priority: "low" | "medium" | "high";
  description?: string;
  dosage?: string;
  notes?: string;
};

function isISODate(d: unknown): d is string {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error("LLM output is not valid JSON");
  }
}

function validateTasks(raw: unknown): AgronomyTask[] {
  if (!Array.isArray(raw)) throw new Error("tasks must be an array");

  const validCategory: AgronomyTask["category"][] = [
    "planting",
    "nursery",
    "irrigation",
    "fertilization",
    "weed_control",
    "pest_disease",
    "pruning",
    "thinning",
    "training",
    "mulching",
    "soil_amendment",
    "monitoring",
    "harvest",
    "post_harvest",
    "other",
  ];
  const validPriority: AgronomyTask["priority"][] = ["low", "medium", "high"];

  const tasks: AgronomyTask[] = raw.map((t, idx) => {
    if (typeof t !== "object" || t === null) throw new Error(`Task[${idx}] must be object`);
    const o = t as Record<string, unknown>;

    const id = typeof o.id === "string" && o.id.trim() ? o.id : `task-${idx}`;
    const title = typeof o.title === "string" ? o.title : "";
    const dateISO = o.dateISO;
    const category = o.category as AgronomyTask["category"];
    const priority = o.priority as AgronomyTask["priority"];

    if (!title.trim()) throw new Error(`Task[${idx}].title is required`);
    if (!isISODate(dateISO)) throw new Error(`Task[${idx}].dateISO must be YYYY-MM-DD`);

    return {
      id,
      title,
      dateISO,
      category: validCategory.includes(category) ? category : "other",
      priority: validPriority.includes(priority) ? priority : "medium",
      description: typeof o.description === "string" ? o.description : undefined,
      dosage: typeof o.dosage === "string" ? o.dosage : undefined,
      notes: typeof o.notes === "string" ? o.notes : undefined,
    };
  });

  tasks.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return tasks;
}

function clampTasksToRange(params: {
  tasks: AgronomyTask[];
  startISO: string;
  endISO: string;
}): AgronomyTask[] {
  const { tasks, startISO, endISO } = params;

  return tasks
    .map((t) => {
      if (t.dateISO < startISO) {
        return {
          ...t,
          dateISO: startISO,
          notes: [t.notes, `Auto-adjust: tanggal dimundurkan ke tanggal tanam (${startISO}).`]
            .filter(Boolean)
            .join(" "),
        };
      }
      if (t.dateISO > endISO) {
        return {
          ...t,
          dateISO: endISO,
          notes: [t.notes, `Auto-adjust: tanggal dimajukan ke tanggal panen (${endISO}).`]
            .filter(Boolean)
            .join(" "),
        };
      }
      return t;
    })
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

function ensureMilestones(params: {
  tasks: AgronomyTask[];
  cropName: string;
  startISO: string;
  endISO: string;
}): AgronomyTask[] {
  const { tasks, cropName, startISO, endISO } = params;
  const hasPlanting = tasks.some((t) => t.category === "planting" || /tanam/i.test(t.title));
  const hasHarvest = tasks.some((t) => t.category === "harvest" || /panen/i.test(t.title));
  const hasPostHarvest = tasks.some((t) => t.category === "post_harvest" || /pascapanen|pasca panen/i.test(t.title));

  const extra: AgronomyTask[] = [];
  if (!hasPlanting) {
    extra.push({
      id: "milestone-planting",
      title: `🌱 Tanam ${cropName}`,
      dateISO: startISO,
      category: "planting",
      priority: "high",
      description: "Mulai penanaman sesuai SOP dan kondisi lahan.",
      notes: "Milestone otomatis ditambahkan agar timeline tidak mulai sebelum tanggal tanam.",
    });
  }
  if (!hasHarvest) {
    extra.push({
      id: "milestone-harvest",
      title: `🌾 Panen ${cropName}`,
      dateISO: endISO,
      category: "harvest",
      priority: "high",
      description: "Panen pada kematangan optimal. Sesuaikan dengan kondisi lapangan.",
      notes: "Milestone otomatis ditambahkan agar timeline sampai tanggal panen yang ditentukan.",
    });
  }
  if (!hasPostHarvest) {
    extra.push({
      id: "milestone-post-harvest",
      title: `📦 Pascapanen ${cropName} (sortir & simpan)` ,
      dateISO: endISO,
      category: "post_harvest",
      priority: "medium",
      description: "Sortir, bersihkan, kemas, dan simpan sesuai standar komoditas.",
      notes: "Milestone otomatis ditambahkan agar SOP mencakup pascapanen.",
    });
  }

  const merged = [...tasks, ...extra];
  // Dedup by id
  const byId = new Map<string, AgronomyTask>();
  for (const t of merged) byId.set(t.id, t);
  return Array.from(byId.values()).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      namaTanaman?: string;
      tanggalTanam?: string;
      tanggalPanen?: string;
      weather?: { city?: string; list?: DailyWeather[] };
      // Optional additional context
      locale?: string;
      timezone?: string;
    };

    const namaTanaman = body.namaTanaman;
    const tanggalTanam = body.tanggalTanam;
    const tanggalPanen = body.tanggalPanen;

    if (!namaTanaman || typeof namaTanaman !== "string") {
      return NextResponse.json({ ok: false, error: "namaTanaman wajib diisi" }, { status: 400 });
    }
    if (!isISODate(tanggalTanam)) {
      return NextResponse.json({ ok: false, error: "tanggalTanam harus YYYY-MM-DD" }, { status: 400 });
    }
    if (!isISODate(tanggalPanen)) {
      return NextResponse.json({ ok: false, error: "tanggalPanen harus YYYY-MM-DD" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "GROQ_API_KEY belum diset",
          hint: "Tambahkan GROQ_API_KEY di .env.local, lalu restart dev server.",
        },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const system =
      "Kamu adalah AI Agronomic Expert untuk smart farming. " +
      "Output HARUS JSON valid saja (tanpa markdown, tanpa teks pembuka/penutup, tanpa code fence). " +
      "Kembalikan JSON object dengan schema: { tasks: AgronomyTask[] }. " +
      "AgronomyTask schema: {id,title,dateISO,category,priority,description?,dosage?,notes?}. " +
      "dateISO format YYYY-MM-DD. " +
      "Task harus komprehensif dari persiapan hingga pascapanen (vegetatif->generatif->panen). " +
      "Jika ada ketidakpastian, taruh asumsi di notes setiap task yang relevan. " +
      "Jika konteks cuaca tersedia (forecast 5 hari), gunakan untuk menambah catatan risiko (mis: hujan tinggi -> pest risk, penjadwalan penyemprotan/penyiangan).";

    // Keep weather context small to avoid token bloat
    const compactWeather = body.weather?.list?.slice(0, 5)?.map((d) => ({
      dt: d.dt,
      temp: d.temp,
      humidity: d.humidity,
      pop: d.pop,
      rain: d.rain,
      weather: d.weather?.slice(0, 1),
    }));

    const user = {
      namaTanaman,
      tanggalTanam,
      tanggalPanen,
      locale: body.locale ?? "id-ID",
      timezone: body.timezone ?? "Asia/Jakarta",
      weatherCity: body.weather?.city,
      weatherDaily: compactWeather ?? [],
      requirements:
        "Minimal include: persiapan lahan, persemaian (jika relevan), tanam, irigasi, pemupukan berjenjang, pengendalian gulma, monitoring hama/penyakit, tindakan preventif berbasis cuaca, pra-panen, panen, pascapanen. Berikan tanggal spesifik (dateISO) untuk tiap task.",
      output: "Return ONLY {\"tasks\":[...]} as valid JSON.",
    };

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 2600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const parsed = parseJson(content);
    const tasksRaw =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>).tasks
        : null;

    const tasks = validateTasks(tasksRaw);

    // Safety: keep the schedule within the requested range
    // (models sometimes output dates outside the window).
    const clamped = clampTasksToRange({
      tasks,
      startISO: tanggalTanam,
      endISO: tanggalPanen,
    });
    const withMilestones = ensureMilestones({
      tasks: clamped,
      cropName: namaTanaman,
      startISO: tanggalTanam,
      endISO: tanggalPanen,
    });

    return NextResponse.json({
      ok: true,
      tasks: withMilestones,
      meta: {
        model: completion.model,
        generatedAt: new Date().toISOString(),
        weatherIncluded: Boolean(compactWeather?.length),
        total: withMilestones.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "Gagal generate SOP agronomi",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
