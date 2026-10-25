import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Only admins can do this");
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** An admin decision, not email verification, authorizes intern access. */
export const decideInternRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; approve: boolean }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.userId) || typeof input.approve !== "boolean") throw new Error("Invalid decision");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: request, error: lookupError } = await context.supabase.from("access_requests").select("kind").eq("user_id", data.userId).maybeSingle();
    if (lookupError || request?.kind !== "intern" || data.userId === context.userId) throw new Error("Invalid intern request");
    if (data.approve) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email_confirm: true });
      if (error) throw new Error("Could not enable this account for sign-in. Please try again.");
    }
    const { error } = await context.supabase.rpc("decide_intern_access", { _user_id: data.userId, _approve: data.approve });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Create a login for an intern. Creates the team member when memberId is not given. */
export const createInternAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    memberId?: string | undefined; name: string; email: string; password: string; phone?: string;
    department?: string; joining_date?: string; avatar?: string; role?: string;
  }) => {
    const email = str(input.email, 255).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email");
    if (typeof input.password !== "string" || input.password.length < 8) throw new Error("Password must be at least 8 characters");
    if (!str(input.name)) throw new Error("Name is required");
    return {
      memberId: input.memberId ? str(input.memberId, 64) : undefined,
      name: str(input.name), email, password: input.password.slice(0, 72),
      phone: str(input.phone, 40) || null, department: str(input.department, 80) || null,
      joining_date: str(input.joining_date, 10) || null, avatar: str(input.avatar, 500) || null,
      role: str(input.role, 80) || "Intern",
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true, user_metadata: { name: data.name },
    });
    if (error) throw new Error(error.message.includes("already") ? "An account with this email already exists" : error.message);
    const uid = created.user.id as string;

    const fields = {
      name: data.name, email: data.email, phone: data.phone, department: data.department,
      joining_date: data.joining_date, avatar: data.avatar, role: data.role, user_id: uid, is_active: true,
    };
    const res = data.memberId
      ? await admin.from("team_members").update(fields).eq("id", data.memberId)
      : await admin.from("team_members").insert(fields);
    if (res.error) {
      await admin.auth.admin.deleteUser(uid);
      throw new Error(res.error.message);
    }
    await admin.from("user_roles").insert({ user_id: uid, role: "intern" });
    return { ok: true };
  });

export const resetInternPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; password: string }) => {
    if (typeof input.password !== "string" || input.password.length < 8) throw new Error("Password must be at least 8 characters");
    return { memberId: str(input.memberId, 64), password: input.password.slice(0, 72) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: m } = await admin.from("team_members").select("user_id").eq("id", data.memberId).maybeSingle();
    if (!m?.user_id) throw new Error("This member has no login yet");
    const { error } = await admin.auth.admin.updateUserById(m.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setInternActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; active: boolean }) => ({ memberId: str(input.memberId, 64), active: !!input.active }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: m, error } = await admin.from("team_members").update({ is_active: data.active }).eq("id", data.memberId).select("user_id").maybeSingle();
    if (error) throw new Error(error.message);
    if (m?.user_id) await admin.auth.admin.updateUserById(m.user_id, { ban_duration: data.active ? "none" : "876000h" });
    return { ok: true };
  });

export const deleteIntern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string }) => ({ memberId: str(input.memberId, 64) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: m } = await admin.from("team_members").select("user_id").eq("id", data.memberId).maybeSingle();
    await admin.from("team_members").delete().eq("id", data.memberId);
    if (m?.user_id) {
      await admin.from("user_roles").delete().eq("user_id", m.user_id);
      await admin.auth.admin.deleteUser(m.user_id);
    }
    return { ok: true };
  });
