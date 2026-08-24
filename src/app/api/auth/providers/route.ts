import { json } from "@/lib/http";
import { googleOAuthEnabled } from "@/lib/auth/google";

export async function GET() {
  return json({ google: googleOAuthEnabled() });
}
