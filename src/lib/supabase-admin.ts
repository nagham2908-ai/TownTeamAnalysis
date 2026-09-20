import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only client using the service-role key. Never import this from
// client components — it bypasses Row Level Security entirely.
let client: SupabaseClient<Database> | null = null;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables. See .env.local.example."
    );
  }
  client = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return client;
}

export const EXPORTS_BUCKET = "wfc-exports";
