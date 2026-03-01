import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'placeholder_key';


if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.warn('⚠️ WARNING: Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env!');
    console.warn('⚠️ The backend is running, but database calls will fail until you provide these keys.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
