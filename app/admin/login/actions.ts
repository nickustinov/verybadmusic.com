"use server";

import { redirect } from "next/navigation";

import { checkCredentials, createAdminSession } from "@/lib/auth/admin";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!checkCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  await createAdminSession();
  redirect(from.startsWith("/admin") ? from : "/admin");
}
