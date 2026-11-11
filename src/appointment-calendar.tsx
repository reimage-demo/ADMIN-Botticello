import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarAppointment = {
  _id: string;
  name: string;
  vehicle: string;
  service: string;
  status: string;
  preferredDate?: string;
  preferredTime?: string;
};

export function shopToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((first.getUTCDay() + count) / 7) * 7 }, (_, i) =>
    new Date(Date.UTC(year, number - 1, 1 - first.getUTCDay() + i)).toISOString().slice(0, 10),
  );
}

export function validDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function label(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function AppointmentCalendar<T extends CalendarAppointment>({ rows, onOpen }: {
  rows: T[];
  onOpen: (row: T) => void;
}) {
  const today = shopToday();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const days = calendarDays(month);
  const grouped = new Map<string, T[]>();
  const undated: T[] = [];
  for (const row of rows) {
    if (!validDate(row.preferredDate)) { undated.push(row); continue; }
    const group = grouped.get(row.preferredDate) ?? [];
    group.push(row);
    grouped.set(row.preferredDate, group);
  }
  for (const group of grouped.values()) {
    group.sort((a, b) => {
      const order = (time?: string) => time === "morning" ? "0" : time === "afternoon" ? "1" : `2${time ?? ""}`;
      return order(a.preferredTime).localeCompare(order(b.preferredTime)) || a.name.localeCompare(b.name);
    });
  }
  function moveMonth(offset: number) {
    const [year, number] = month.split("-").map(Number);
    setMonth(new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7));
    setExpandedDay(null);
  }
  function card(row: T) {
    return <button key={row._id} className={`calendar-appointment ${row.status}`} onClick={() => onOpen(row)}
      title={`${row.name} · ${row.vehicle} · ${row.service} · ${row.status.replaceAll("_", " ")}`}
      aria-label={`Open ${row.name}'s appointment, ${row.preferredTime || "time not specified"}, ${row.status.replaceAll("_", " ")}`}>
      <span className="calendar-card-meta"><span className="calendar-time">{row.preferredTime || "Time not specified"}</span><span className="calendar-status">{row.status.replaceAll("_", " ")}</span></span>
      <strong>{row.name}</strong>
      <span>{row.service}</span>
    </button>;
  }
  const monthCount = rows.filter(row => validDate(row.preferredDate) && row.preferredDate.startsWith(month)).length;
  return <div className="appointment-calendar">
    <div className="calendar-toolbar">
      <div><h3 aria-live="polite">{label(`${month}-01`, { month: "long", year: "numeric" })}</h3>
        <p>{monthCount} matching appointment{monthCount === 1 ? "" : "s"} this month</p></div>
      <div className="calendar-controls">
        <button className="icon-button" onClick={() => { setMonth(today.slice(0, 7)); setExpandedDay(null); }}>Today</button>
        <button className="icon-button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button>
        <button className="icon-button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button>
      </div>
    </div>
    <p className="calendar-hint">Shown by requested date and time. Confirm appointments with customers. Scroll sideways on smaller screens.</p>
    <div className="calendar-scroll" role="region" aria-label="Monthly appointment calendar" tabIndex={0}>
      <div className="calendar-grid">
        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day =>
          <div key={day} className="calendar-weekday">{day}</div>)}
        {days.map(day => {
          const appointments = grouped.get(day) ?? [];
          const expanded = expandedDay === day;
          return <section key={day} className={`calendar-day${day.startsWith(month) ? "" : " outside-month"}${day === today ? " is-today" : ""}`}
            aria-label={label(day, { dateStyle: "full" })}>
            <div className="calendar-day-heading"><time dateTime={day} aria-current={day === today ? "date" : undefined}>{Number(day.slice(-2))}</time>
              {appointments.length > 0 && <span>{appointments.length} appt{appointments.length === 1 ? "" : "s"}</span>}</div>
            {appointments.slice(0, expanded ? undefined : 6).map(card)}
            {appointments.length > 6 && <button className="calendar-more" aria-expanded={expanded}
              aria-label={`${expanded ? "Show fewer appointments" : `Show all ${appointments.length} appointments`} for ${label(day, { dateStyle: "long" })}`}
              onClick={() => setExpandedDay(expanded ? null : day)}>
              {expanded ? "Show fewer" : `+${appointments.length - 6} more`}</button>}
          </section>;
        })}
      </div>
    </div>
    {undated.length > 0 && <section className="calendar-undated"><h3>Date not specified ({undated.length})</h3>
      <div>{undated.map(card)}</div></section>}
  </div>;
}
