import { LoginForm } from "@/components/admin/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = from && from.startsWith("/admin") ? from : "/admin";

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <LoginForm from={safeFrom} />
    </main>
  );
}
