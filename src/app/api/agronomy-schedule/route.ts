import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * Contract:
 * POST /api/agronomy-schedule
 * body: { namaTanaman: string; tanggalTanam: string; tanggalPanen: string }
 * returns: { ok: true; tasks: AgronomyTask[]; meta: {...} }
 */

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

function parseTasksJsonStrict(content: string): unknown {
  // Models sometimes wrap JSON in text. We try strict JSON parse first.
  try {
    return JSON.parse(content);
  } catch {
    // Fallback: extract first JSON array occurrence.
    const start = content.indexOf("[");
    const end = content.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const slice = content.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error("LLM output is not valid JSON array");
  }
}

function validateTasks(raw: unknown): AgronomyTask[] {
  if (!Array.isArray(raw)) throw new Error("LLM output must be a JSON array");

  const tasks: AgronomyTask[] = raw.map((t, idx) => {
    if (typeof t !== "object" || t === null) {
      throw new Error(`Task[${idx}] must be an object`);
    }

    const obj = t as Record<string, unknown>;

    const id = typeof obj.id === "string" && obj.id.trim() ? obj.id : `task-${idx}`;
    const title = typeof obj.title === "string" ? obj.title : "";
    const dateISO = obj.dateISO;

    const category = obj.category as AgronomyTask["category"];
    const priority = obj.priority as AgronomyTask["priority"];

    if (!title.trim()) throw new Error(`Task[${idx}].title is required`);
    if (!isISODate(dateISO)) throw new Error(`Task[${idx}].dateISO must be YYYY-MM-DD`);

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

    return {
      id,
      title,
      dateISO,
      category: validCategory.includes(category) ? category : "other",
      priority: validPriority.includes(priority) ? priority : "medium",
      description: typeof obj.description === "string" ? obj.description : undefined,
      dosage: typeof obj.dosage === "string" ? obj.dosage : undefined,
      notes: typeof obj.notes === "string" ? obj.notes : undefined,
    };
  });

  // Ensure tasks are within range and sorted.
  tasks.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  return tasks;
}

export async function POST(request: NextRequest) {
  try {
    const { namaTanaman, tanggalTanam, tanggalPanen } = (await request.json()) as {
      namaTanaman?: string;
      tanggalTanam?: string;
      tanggalPanen?: string;
    };

    if (!namaTanaman || typeof namaTanaman !== "string") {
      return NextResponse.json({ ok: false, error: "namaTanaman wajib diisi" }, { status: 400 });
    }
    if (!isISODate(tanggalTanam)) {
      return NextResponse.json({ ok: false, error: "tanggalTanam harus format YYYY-MM-DD" }, { status: 400 });
    }
    if (!isISODate(tanggalPanen)) {
      return NextResponse.json({ ok: false, error: "tanggalPanen harus format YYYY-MM-DD" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "GROQ_API_KEY belum diset",
          hint: "Tambahkan GROQ_API_KEY di .env.local (bukan GROK_API_KEY).",
        },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const systemPrompt =
      "Kamu adalah Agronomist Expert (SOP budidaya). " +
      "Kamu HARUS mengembalikan output MURNI berupa JSON Array valid. " +
      "TANPA markdown, TANPA teks pembuka/penutup, TANPA code-fence. " +
      "Setiap item harus sesuai schema: " +
      "{id: string, title: string, dateISO: 'YYYY-MM-DD', category: string, priority: 'low'|'medium'|'high', description?: string, dosage?: string, notes?: string}. " +
      "dateISO harus berada di antara tanggalTanam dan tanggalPanen (inklusif). " +
      "Buat jadwal komprehensif dari fase vegetatif sampai panen. " +
      "Jika ada ketidakpastian, tulis asumsi di field notes (bukan di luar JSON).";

    const userPrompt = JSON.stringify({
      namaTanaman,
      tanggalTanam,
      tanggalPanen,
      locale: "id-ID",
      timezone: "Asia/Jakarta",
      guidance:
        "Minimal sertakan: persiapan lahan, persemaian (jika relevan), tanam, irigasi, pemupukan berjenjang, pengendalian gulma, monitoring hama/penyakit, pemangkasan/pengikatan (jika relevan), pra-panen, panen, pascapanen. Berikan tanggal spesifik (dateISO) untuk tiap task.",
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Kembalikan JSON dengan format {\"tasks\": [...]} saja. Input: " + userPrompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const raw = parseTasksJsonStrict(content);

    // We asked for json_object wrapper {tasks:[...]}
    const rawTasks =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>).tasks
        : raw;

    const tasks = validateTasks(rawTasks);

    return NextResponse.json({
      ok: true,
      tasks,
      meta: {
        model: completion.model,
        generatedAt: new Date().toISOString(),
        total: tasks.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Gagal generate agronomy schedule",
        details: message,
      },
      { status: 500 }
    );
  }
}
