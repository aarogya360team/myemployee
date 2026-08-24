import { SignupForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <SignupForm />;
}
