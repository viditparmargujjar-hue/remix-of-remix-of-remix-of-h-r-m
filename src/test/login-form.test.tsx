import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/app/LoginCard";

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => auth.navigate }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth, rpc: auth.rpc, from: auth.from } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function submit(kind: "admin" | "intern", email = "member@example.test") {
  render(<LoginForm kind={kind} />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-input-only" } });
  fireEvent.submit(screen.getByLabelText("Email address").closest("form") as HTMLFormElement);
}

describe("Login account-role enforcement", () => {
  it("registers an intern as pending without requiring an email-confirmed session", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "registered-intern" }, session: null }, error: null });
    render(<LoginForm kind="intern" />);
    fireEvent.click(screen.getByRole("button", { name: "Create Intern Account" }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New Intern" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "intern@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-input-only" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "test-input-only" } });
    fireEvent.submit(screen.getByLabelText("Email address").closest("form") as HTMLFormElement);
    await waitFor(() => expect(auth.signUp).toHaveBeenCalledWith({ email: "intern@example.test", password: "test-input-only", options: { data: { full_name: "New Intern", registration_type: "intern" } } }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(auth.rpc).not.toHaveBeenCalled();
    expect(auth.navigate).not.toHaveBeenCalled();
  });

  it.each(["pending", "rejected"])("blocks an intern with a %s request after sign-in", async (status) => {
    auth.rpc.mockResolvedValueOnce({ data: "none", error: null });
    auth.from.mockReturnValue({ select: () => ({ maybeSingle: async () => ({ data: { kind: "intern", status }, error: null }) }) });
    submit("intern");
    await waitFor(() => expect(auth.navigate).toHaveBeenCalledWith({ to: "/pending" }));
    expect(auth.navigate).not.toHaveBeenCalledWith({ to: "/intern/dashboard" });
    expect(auth.rpc).not.toHaveBeenCalledWith("request_access");
  });

  it("saves a missing intern request after verified login without granting access", async () => {
    auth.rpc.mockResolvedValueOnce({ data: "none", error: null }).mockResolvedValueOnce({ data: "pending", error: null });
    auth.from.mockReturnValue({ select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) });
    auth.getUser.mockResolvedValue({ data: { user: { user_metadata: { full_name: "Vidit Parmar" } } }, error: null });
    submit("intern");
    await waitFor(() => expect(auth.navigate).toHaveBeenCalledWith({ to: "/pending" }));
    expect(auth.rpc).toHaveBeenCalledWith("request_intern_access", { _name: "Vidit Parmar" });
    expect(auth.rpc).not.toHaveBeenCalledWith("request_access");
    expect(auth.navigate).not.toHaveBeenCalledWith({ to: "/intern/dashboard" });
  });

  it("does not navigate when saving the intern request fails", async () => {
    auth.rpc.mockResolvedValueOnce({ data: "none", error: null }).mockResolvedValueOnce({ error: { message: "Save failed" } });
    auth.from.mockReturnValue({ select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) });
    auth.getUser.mockResolvedValue({ data: { user: { user_metadata: { full_name: "Vidit" } } }, error: null });
    submit("intern");
    await screen.findByRole("alert");
    expect(auth.navigate).not.toHaveBeenCalled();
  });

  it("routes an authenticated intern to the intern portal", async () => {
    auth.rpc.mockResolvedValue({ data: "intern", error: null });
    submit("intern");
    await waitFor(() => expect(auth.navigate).toHaveBeenCalledWith({ to: "/intern/dashboard" }));
    expect(auth.rpc).toHaveBeenCalledWith("my_role");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "member@example.test", password: "test-input-only" });
  });

  it("signs out an intern selecting Admin Login instead of granting admin access", async () => {
    auth.rpc.mockResolvedValue({ data: "intern", error: null });
    submit("admin");
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledOnce());
    expect(auth.navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when sign-in fails", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    submit("intern");
    await screen.findByRole("alert");
    expect(auth.rpc).not.toHaveBeenCalled();
    expect(auth.navigate).not.toHaveBeenCalled();
  });

  it("routes a matching authenticated admin through the existing flow", async () => {
    auth.rpc.mockResolvedValue({ data: "admin", error: null });
    submit("admin", " member@example.test ");
    await waitFor(() => expect(auth.navigate).toHaveBeenCalledWith({ to: "/dashboard" }));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "member@example.test", password: "test-input-only" });
    expect(auth.rpc).toHaveBeenCalledWith("my_role");
  });

  it.each([
    { status: 0, message: "Failed to fetch" },
    { status: 503, message: "Service unavailable" },
    { status: 429, message: "Too many requests" },
    { status: 400, code: "email_not_confirmed", message: "Email not confirmed" },
  ])("does not perform role lookup or navigate after service rejection: $status $message", async (error) => {
    auth.signInWithPassword.mockResolvedValue({ error });
    submit("admin");
    await screen.findByRole("alert");
    expect(auth.rpc).not.toHaveBeenCalled();
    expect(auth.navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when the network throws", async () => {
    auth.signInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
    submit("admin");
    await screen.findByRole("alert");
    expect(auth.rpc).not.toHaveBeenCalled();
    expect(auth.navigate).not.toHaveBeenCalled();
  });
});