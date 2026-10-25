import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { useMembers } from "@/lib/data";
import { fmtTime, hoursBetween, useAttendance } from "@/lib/hr";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Attendance – Task Manager" }, { name: "description", content: "Review intern check-in and check-out records." },
    { property: "og:title", content: "Attendance – Task Manager" }, { property: "og:description", content: "Review intern check-in and check-out records." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [] } = useAttendance();
  const { data: members = [] } = useMembers();
  const [date, setDate] = useState("");
  const name = (u: string) => members.find((m) => m.user_id === u)?.name ?? "Unknown";
  const list = date ? data.filter((a) => a.date === date) : data;
  return (
    <div>
      <PageHeader title="Attendance" subtitle="Intern check-ins and check-outs." action={<Input type="date" aria-label="Filter by date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />} />
      <div className="card-soft overflow-x-auto">
        {list.length === 0 ? <EmptyState title="No attendance records" hint="Records appear once interns check in." /> :
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Intern</th><th className="p-3">Date</th><th className="p-3">In</th><th className="p-3">Out</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody>{list.map((a) => <tr key={a.id} className="border-b last:border-0"><td className="p-3 font-medium">{name(a.user_id)}</td><td className="p-3">{a.date}</td><td className="p-3">{fmtTime(a.check_in)}</td><td className="p-3">{fmtTime(a.check_out)}</td><td className="p-3">{hoursBetween(a.check_in, a.check_out)}</td><td className="p-3">{a.check_out ? "Complete" : "Checked in"}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
