const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Error: Missing Supabase credentials');
  console.log('URL configured:', !!supabaseUrl);
  console.log('Service Key configured:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  console.log('Creating bucket "media"...');

  const { data, error } = await supabase.storage.createBucket('media', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'],
    fileSizeLimit: 52428800 // 50MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Bucket "media" ja existeix!');
    } else {
      console.log('✗ Error:', error.message);
    }
  } else {
    console.log('✓ Bucket "media" creat correctament!');
  }
}

createBucket();
