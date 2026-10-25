import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/interns/$id")({
  beforeLoad: ({ params }) => { throw redirect({ to: "/team/$id", params: { id: params.id }, replace: true }); },
});
