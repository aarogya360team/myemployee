import { getSessionUser } from "@/lib/auth";
import { PublicLanding } from "@/components/PublicLanding";
import { getMembershipForUser } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) return <PublicLanding />;
  const membership = await getMembershipForUser(user.id);
  if (!membership) redirect("/onboard");
  redirect("/app");
}
