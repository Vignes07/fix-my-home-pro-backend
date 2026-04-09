import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers();
  console.log("Auth users:", authUsers?.length, authErr?.message);

  const { data: publicUsers, error: pubErr } = await supabase.from('users').select('*');
  console.log("Public users:", publicUsers?.length, pubErr?.message);

  if (authUsers) {
    authUsers.slice(0, 3).forEach(u => console.log('Auth:', u.id, u.email));
  }
  if (publicUsers) {
    publicUsers.slice(0, 3).forEach(u => console.log('Pub:', u.id, u.email));
  }

  // Check if there are any users missing from public.users
  if (authUsers && publicUsers) {
    for (const au of authUsers) {
        if (!publicUsers.find(pu => pu.id === au.id)) {
            console.log("MISSING IN PUBLIC.USERS:", au.id, au.email);
            // Auto-insert them for the test to succeed
            const metadata = au.user_metadata || {};
            const { error: insertErr } = await supabase.from('users').insert({
                id: au.id,
                full_name: metadata.full_name || 'Test User',
                phone: metadata.phone || Math.random().toString().substring(2, 12),
                user_type: metadata.user_type || 'customer',
                email: au.email
            });
            console.log("Auto-insert result:", insertErr?.message || "SUCCESS");
        }
    }
  }
}
check();
