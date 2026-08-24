import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
