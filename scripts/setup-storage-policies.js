const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPolicies() {
  console.log('Configurant polítiques RLS per al bucket "media"...\n');

  // Utilitzem SQL directe per crear les polítiques
  const policies = [
    {
      name: 'Permetre lectura pública',
      sql: `
        CREATE POLICY "Public Read" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'media');
      `
    },
    {
      name: 'Permetre upload públic',
      sql: `
        CREATE POLICY "Public Upload" ON storage.objects
        FOR INSERT
        WITH CHECK (bucket_id = 'media');
      `
    },
    {
      name: 'Permetre update públic',
      sql: `
        CREATE POLICY "Public Update" ON storage.objects
        FOR UPDATE
        USING (bucket_id = 'media');
      `
    },
    {
      name: 'Permetre delete públic',
      sql: `
        CREATE POLICY "Public Delete" ON storage.objects
        FOR DELETE
        USING (bucket_id = 'media');
      `
    }
  ];

  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`✓ ${policy.name} - ja existeix`);
      } else {
        console.log(`⚠ ${policy.name} - ${error.message}`);
      }
    } else {
      console.log(`✓ ${policy.name} - creada`);
    }
  }

  console.log('\n--- ALTERNATIVA: Executa això manualment a Supabase SQL Editor ---\n');
  console.log(`
-- Políticas RLS para el bucket "media"
-- Ejecuta esto en: Supabase Dashboard > SQL Editor

-- 1. Permitir lectura pública
CREATE POLICY "Public Read" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- 2. Permitir upload público
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');

-- 3. Permitir update público
CREATE POLICY "Public Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'media');

-- 4. Permitir delete público
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'media');
  `);
}

setupPolicies();
