import { createFileRoute } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { fmtTime, hoursBetween, useAttendance, useCheckIn, useCheckOut } from "@/lib/hr";

export const Route = createFileRoute("/_intern/intern/attendance")({
  head: () => ({ meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    { title: "Attendance – Intern Portal" }, { name: "description", content: "Check in and out and view your attendance history." },
    { property: "og:title", content: "Attendance – Intern Portal" }, { property: "og:description", content: "Check in and out and view your attendance history." },
  ] }),
  component: Page,
});

function Page() {
  const { data = [], isLoading } = useAttendance();
  const cin = useCheckIn(); const cout = useCheckOut();
  const today = new Date().toLocaleDateString("en-CA");
  const t = data.find((a) => a.date === today);
  const state = !t ? "Not checked in" : t.check_out ? "Day complete" : "Checked in";
  return (
    <div>
      <PageHeader title="Attendance" subtitle="Check in when you start and check out when you finish." />
      <div className="card-soft mb-6 flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1"><p className="text-sm text-muted-foreground">Today</p><p className="text-lg font-bold">{state}</p>
          <p className="text-sm text-muted-foreground">In {fmtTime(t?.check_in ?? null)} · Out {fmtTime(t?.check_out ?? null)}{t && ` · ${hoursBetween(t.check_in, t.check_out)}`}</p></div>
        <Button onClick={() => cin.mutate()} disabled={!!t || cin.isPending}><LogIn className="size-4" /> Check in</Button>
        <Button variant="outline" onClick={() => cout.mutate()} disabled={!t || !!t.check_out || cout.isPending}><LogOut className="size-4" /> Check out</Button>
      </div>
      <div className="card-soft overflow-x-auto">
        {isLoading ? <div className="p-4"><Skeleton className="h-24" /></div> : data.length === 0 ? <EmptyState title="No attendance yet" hint="Check in to start your record." /> :
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Date</th><th className="p-3">Check in</th><th className="p-3">Check out</th><th className="p-3">Total</th></tr></thead>
          <tbody>{data.map((a) => <tr key={a.id} className="border-b last:border-0"><td className="p-3 font-medium">{a.date}</td><td className="p-3">{fmtTime(a.check_in)}</td><td className="p-3">{fmtTime(a.check_out)}</td><td className="p-3">{hoursBetween(a.check_in, a.check_out)}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
