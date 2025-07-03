// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eymjqphyzdxpbnaotwdn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bWpxcGh5emR4cGJuYW90d2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcyOTEsImV4cCI6MjA2NzAyMzI5MX0.aO4lzlFKybisPq4pR0EaO4GMfr3ho1GRPlkd0jKZVuA";
export const supabase = createClient(supabaseUrl, supabaseKey);
