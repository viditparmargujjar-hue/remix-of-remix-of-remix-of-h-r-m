import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useMarkRead, useNotifications } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ErrorState } from "./bits";

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function NotificationList({ compact = false }: { compact?: boolean }) {
  const { data = [], isLoading, error, refetch } = useNotifications();
  const mark = useMarkRead();
  const unread = data.filter((n) => !n.is_read).length;
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-4 py-3">
        <p className="font-semibold">Notifications {unread > 0 && <span className="text-xs text-muted-foreground">({unread} unread)</span>}</p>
        <Button variant="ghost" size="sm" disabled={!unread || mark.isPending} onClick={() => mark.mutate("all")}><CheckCheck className="size-4" /> Mark all read</Button>
      </div>
      <div className={cn("overflow-y-auto", compact ? "max-h-96" : "")}>
        {error ? <div className="space-y-2 p-4"><ErrorState message="Notifications could not be loaded." /><Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button></div> : isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          : data.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          : data.map((n) => (
            <Button variant="ghost" key={n.id} disabled={mark.isPending} onClick={() => !n.is_read && mark.mutate(n.id)}
              className={cn("h-auto w-full justify-start gap-3 whitespace-normal rounded-none border-b px-4 py-3 text-left last:border-0", !n.is_read && "bg-accent/50")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-primary")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{n.title}</span>
                {n.message && <span className="block text-sm text-muted-foreground">{n.message}</span>}
                <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
              </span>
            </Button>
          ))}
      </div>
      {mark.isError && <div className="p-3"><ErrorState message="Could not mark notifications as read. Please try again." /></div>}
    </div>
  );
}

export function NotificationBell() {
  const { data = [] } = useNotifications();
  const unread = data.filter((n) => !n.is_read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 99 ? "99+" : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0"><NotificationList compact /></PopoverContent>
    </Popover>
  );
}
