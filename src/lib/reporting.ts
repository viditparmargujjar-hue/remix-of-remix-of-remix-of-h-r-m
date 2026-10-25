import type { Task, WorkLog } from "./data";

export function dateBefore(end: string, days: number) {
  const d = new Date(`${end}T12:00:00`);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function validPeriod(from: string, to: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;
}

// Reports use the creation-date cohort; completion events use their actual date.
export function tasksInPeriod(tasks: Task[], from: string, to: string) {
  return validPeriod(from, to) ? tasks.filter((t) => t.created_at.slice(0, 10) >= from && t.created_at.slice(0, 10) <= to) : [];
}

export function weeklyHours(logs: WorkLog[], from: string, to: string) {
  const weeks = new Map<string, number>();
  if (!validPeriod(from, to)) return [];
  for (const log of logs.filter((l) => l.date >= from && l.date <= to)) {
    const d = new Date(`${log.date}T12:00:00`);
    const monday = dateBefore(log.date, (d.getDay() + 6) % 7);
    weeks.set(monday, (weeks.get(monday) ?? 0) + log.hours_worked);
  }
  return [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, hours]) => ({ date, name: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), hours: Math.round(hours * 10) / 10 }));
}