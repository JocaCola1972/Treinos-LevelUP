
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// URL do projeto Supabase
const supabaseUrl = 'https://oqmujpgjmeanpveubusz.supabase.co';

// Chave ANON fornecida pelo utilizador
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbXVqcGdqbWVhbnB2ZXVidXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzkyMzEsImV4cCI6MjA4MzA1NTIzMX0.u8uQv7MNv0Pk1pycUs9WGUUfOrWnxq5iba8qXk4lq-c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
