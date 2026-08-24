import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadBusinessAsset(opts: {
  businessId: string;
  path: string;
  body: Buffer;
  contentType: string;
}) {
  const admin = getSupabaseAdmin();
  const objectPath = `${opts.businessId}/${opts.path}`;
  if (!admin) {
    return { url: `/api/assets/local/${objectPath}`, mocked: true as const };
  }
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "business-assets";
  const { error } = await admin.storage.from(bucket).upload(objectPath, opts.body, {
    contentType: opts.contentType,
    upsert: true,
  });
  if (error) {
    return { url: `/api/assets/local/${objectPath}`, mocked: true as const, error: error.message };
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
  return { url: data.publicUrl, mocked: false as const };
}
