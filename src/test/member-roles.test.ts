import { describe, expect, it } from "vitest";
import { loginRoleError, memberAccountRole } from "@/lib/member-roles";
import type { Member } from "@/lib/data";

describe("Unified login role rules", () => {
  it("rejects an Intern account selecting Admin Login", () => {
    expect(loginRoleError("admin", "intern")).toContain("Select Intern Login");
  });
  it("rejects an Admin account selecting Intern Login", () => {
    expect(loginRoleError("intern", "admin")).toContain("Select Admin Login");
  });
  it("accepts only matching approved account roles", () => {
    expect(loginRoleError("intern", "intern")).toBeNull();
    expect(loginRoleError("admin", "admin")).toBeNull();
    expect(loginRoleError("admin", null)).not.toBeNull();
  });
  it("does not derive permissions from a member job title", () => {
    const member = { user_id: "intern-user", role: "Admin" } as Member;
    expect(memberAccountRole(member, [{ user_id: "intern-user", role: "intern" }])).toBe("intern");
    expect(memberAccountRole(member, [])).toBeNull();
  });
});