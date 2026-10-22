import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = "https://khsklfanpzheiubjtxyk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2tsZmFucHpoZWl1Ymp0eHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDcxMTcsImV4cCI6MjA4NzI4MzExN30.cgII0k1n5xlhiWrGUB_L5ehtutYpvz5RbiIP7nzsmvE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
