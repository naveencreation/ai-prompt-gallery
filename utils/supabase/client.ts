import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

const supabaseUrl = config.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = config.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
