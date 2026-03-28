"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useMemo, useState } from "react";

export type SmartCalendarPointEvent = {
  id: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  color?: string;
  textColor?: string;
  extendedProps?: Record<string, unknown>;
};

type AgronomyTask = {
  id: string;
  title: string;
  dateISO: string;
  category: string;
  priority: "low" | "medium" | "high";
  description?: string;
  dosage?: string;
  notes?: string;
};

export type SmartCalendarBackgroundStage = {
  id: string;
  title: string;
  startISO: string; // inclusive
  endISO: string; // exclusive
  color: string;
};

function getSeasonByMonthIndex(monthIndex: number) {
  // monthIndex: 0=Jan ... 11=Dec
  if (monthIndex >= 8 && monthIndex <= 10) return "Fall"; // Sep-Oct-Nov
  if (monthIndex === 11 || monthIndex <= 1) return "Winter"; // Dec-Jan-Feb
  if (monthIndex >= 2 && monthIndex <= 4) return "Spring"; // Mar-Apr-May
  return "Summer"; // Jun-Jul-Aug
}

function getSeasonLabel(monthIndex: number) {
  const season = getSeasonByMonthIndex(monthIndex);
  const emoji =
    season === "Fall"
      ? "🍂"
      : season === "Winter"
        ? "❄️"
        : season === "Spring"
          ? "🌸"
          : "☀️";
  return `${emoji} ${season}`;
}

export default function SmartCalendar({
  pointEvents,
  backgroundStages,
  initialDateISO,
  sopTasks,
  onDateClick,
  height,
}: {
  /** Dot / point events like planting, flowering, harvest, pruning, alerts */
  pointEvents: SmartCalendarPointEvent[];
  /** Background blocks that color phenological stages */
  backgroundStages?: SmartCalendarBackgroundStage[];
  /** Optional initial date (YYYY-MM-DD). Useful to focus on planting month. */
  initialDateISO?: string;
  /** Optional crop name to prefill SOP generator */
  defaultCropName?: string;
  /** Optional harvest date (YYYY-MM-DD) to prefill SOP generator */
  defaultHarvestDateISO?: string;
  /** Optional externally-controlled SOP tasks (e.g. generated right after saving Plant Profile) */
  sopTasks?: AgronomyTask[];
  /** Optional callback when SOP tasks change (for parent state sync) */
  onSopTasksChange?: (tasks: AgronomyTask[]) => void;
  /** Optional: date click handler */
  onDateClick?: (dateISO: string) => void;
  /** Optional calendar height */
  height?: number | "auto";
}) {
  const [showEvents, setShowEvents] = useState(true);
  const [showStages, setShowStages] = useState(true);
  const [showSop, setShowSop] = useState(true);

  const fcEvents = useMemo(() => {
    const effectiveSopTasks = sopTasks ?? [];
    const stages = showStages
      ? (backgroundStages ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          start: s.startISO,
          end: s.endISO,
          display: "background" as const,
          backgroundColor: s.color,
          overlap: false,
        }))
      : [];

    const points = showEvents
      ? pointEvents.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.dateISO,
          allDay: true,
          color: e.color,
          textColor: e.textColor,
          extendedProps: e.extendedProps,
        }))
      : [];

    const aiPoints = showSop
      ? effectiveSopTasks.map((t) => ({
          id: `ai-${t.id}`,
          title: `🤖 ${t.title}`,
          start: t.dateISO,
          allDay: true,
          color:
            t.priority === "high"
              ? "#73825C" // darker olive
              : t.priority === "medium"
                ? "#9CAB84" // mid olive
                : "#C5D89D", // light olive
          textColor: "#0f172a",
          extendedProps: {
            source: "groq",
            category: t.category,
            priority: t.priority,
            description: t.description,
            dosage: t.dosage,
            notes: t.notes,
          },
        }))
      : [];

    return [...stages, ...points, ...aiPoints];
  }, [backgroundStages, pointEvents, sopTasks, showEvents, showStages, showSop]);

  return (
    <div className="rounded-2xl shadow-xl border-2 border-[#C5D89D] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">🗓️ Smart Calendar</h3>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#89986D] inline-block" /> Event
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#DCFCE7] inline-block" /> Fase
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#C5D89D] inline-block" /> SOP AI
          </span>
        </div>
      </div>

      <div className="fc-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDateISO}
          height={height ?? "auto"}
          events={fcEvents}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          titleFormat={(arg) => {
            const d = arg.date.marker;
            const monthIndex = d.getMonth();
            const seasonText = getSeasonLabel(monthIndex);
            // Must return plain text (not HTML)
            const monthYear = new Intl.DateTimeFormat("id-ID", {
              month: "long",
              year: "numeric",
            }).format(d);
            return `${monthYear} • ${seasonText}`;
          }}
          locale="id"
          firstDay={1}
          dayMaxEventRows={3}
          displayEventTime={false}
          dateClick={(info) => onDateClick?.(info.dateStr)}
        />
      </div>
      <div className="mb-3 mt-4 flex justify-center md:justify-end">
        <div className="flex items-center gap-3 rounded-full border border-[#C5D89D] bg-white/95 px-4 py-2 text-xs text-gray-700 shadow-sm">
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#89986D]"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
            Event
          </label>
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#C5D89D]"
              checked={showStages}
              onChange={(e) => setShowStages(e.target.checked)}
            />
            Fase
          </label>
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#73825C]"
              checked={showSop}
              onChange={(e) => setShowSop(e.target.checked)}
            />
            SOP AI
          </label>
        </div>
      </div>
    </div>
  );
}
