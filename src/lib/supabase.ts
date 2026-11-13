import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lbifyltqevosgpfmlcav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaWZ5bHRxZXZvc2dwZm1sY2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODczNTYsImV4cCI6MjA5Njc2MzM1Nn0.bTb3CV4d3BVhtEIklfxZJHIX7ZF4oC5c_c21s68aYY4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
