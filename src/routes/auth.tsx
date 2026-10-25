import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckSquare, ShieldCheck } from "lucide-react";
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

function AuthPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const role = search.role ?? "intern";
  const intern = role === "intern";
  return (
    <div className={`flex min-h-svh flex-col bg-background ${intern ? "intern-theme" : ""}`}>
      <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-10 sm:py-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><CheckSquare className="size-5" /></div>
          <span className="text-base font-extrabold sm:text-lg">PeoplePlace<span className="text-primary">.</span></span>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={() => navigate({ search: { role: intern ? "admin" : "intern" }, replace: true })}>
          {intern ? <ShieldCheck /> : <ArrowLeft />}{intern ? "Admin Login" : "Intern Login"}
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:py-12">
        <section aria-label={intern ? "Intern sign in" : "Admin sign in"} className="w-full max-w-[460px] rounded-lg border border-border bg-card px-6 py-8 text-card-foreground shadow-lift sm:px-10 sm:py-10">
          <LoginForm key={role} kind={role} allowSignup={!intern} />
        </section>
      </main>
      <footer className="px-5 pb-6 pt-3 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} PeoplePlace <span aria-hidden="true" className="px-2">·</span> Task Manager &amp; Intern Portal</footer>
    </div>
  );
}
