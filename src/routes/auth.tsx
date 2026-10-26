import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, CheckSquare, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { LoginForm } from "@/components/app/LoginCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { role?: "admin" | "intern" } => search['role'] === "intern" ? { role: "intern" } : search['role'] === "admin" ? { role: "admin" } : {},
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign In – PeoplePlace Intern Portal" },
      { name: "description", content: "Sign in to your PeoplePlace workspace. Your work. Your growth. Your workspace." },
      { property: "og:title", content: "Sign In – PeoplePlace Intern Portal" },
      { property: "og:description", content: "Sign in to your PeoplePlace workspace. Your work. Your growth. Your workspace." },
    ],
  }),
  component: AuthPage,
});

const features = {
  admin: [
    { icon: Users, title: "Manage your team", text: "Approve interns, assign work and track every member." },
    { icon: BarChart3, title: "Insightful reports", text: "Weekly progress, attendance and goals at a glance." },
    { icon: ShieldCheck, title: "Secure by design", text: "Role-based access keeps every workspace protected." },
  ],
  intern: [
    { icon: CheckSquare, title: "Your tasks, organised", text: "See what's assigned and update your own progress." },
    { icon: Target, title: "Grow with goals", text: "Track milestones and celebrate what you achieve." },
    { icon: Sparkles, title: "Everything in one place", text: "Attendance, leave and work logs, beautifully simple." },
  ],
};

function AuthPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const role = search.role ?? "intern";
  const intern = role === "intern";
  return (
    <div className={`grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr] ${intern ? "intern-theme" : ""}`}>
      <aside className={`relative hidden overflow-hidden p-12 text-primary-foreground lg:flex lg:flex-col ${intern ? "bg-intern-gradient" : "bg-brand-gradient"}`}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur"><CheckSquare className="size-5" /></div>
          <span className="text-lg font-extrabold">PeoplePlace.</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold ring-1 ring-primary-foreground/25">
            {intern ? <Sparkles className="size-3.5" /> : <ShieldCheck className="size-3.5" />}{intern ? "Intern Portal" : "Admin Console"}
          </span>
          <h2 className="mt-5 text-4xl font-extrabold leading-tight">{intern ? "Your work. Your growth. Your workspace." : "Lead your team with clarity."}</h2>
          <ul className="mt-10 space-y-5">
            {features[role].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/20"><Icon className="size-5" /></div>
                <div><p className="font-semibold">{title}</p><p className="text-sm text-primary-foreground/80">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-auto pt-10 text-xs text-primary-foreground/70">© {new Date().getFullYear()} PeoplePlace · Task Manager &amp; Intern Portal</p>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-10 sm:py-7">
          <div className="flex min-w-0 items-center gap-2.5 lg:invisible">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><CheckSquare className="size-5" /></div>
            <span className="text-base font-extrabold sm:text-lg">PeoplePlace<span className="text-primary">.</span></span>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => navigate({ search: { role: intern ? "admin" : "intern" }, replace: true })}>
            {intern ? <ShieldCheck /> : <ArrowLeft />}{intern ? "Admin Login" : "Intern Login"}
          </Button>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
          <section aria-label={intern ? "Intern sign in" : "Admin sign in"} className="w-full max-w-[460px] rounded-2xl border border-border bg-card px-6 py-8 text-card-foreground shadow-lift sm:px-10 sm:py-10">
            <LoginForm key={role} kind={role} allowSignup={!intern} />
          </section>
        </main>
        <footer className="px-5 pb-6 pt-3 text-center text-xs text-muted-foreground lg:hidden">© {new Date().getFullYear()} PeoplePlace <span aria-hidden="true" className="px-2">·</span> Task Manager &amp; Intern Portal</footer>
      </div>
    </div>
  );
}
