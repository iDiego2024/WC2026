import fs from 'fs';

async function deploy() {
  const schemaPath = './supabase/premium_layer_schema.sql';
  const query = fs.readFileSync(schemaPath, 'utf8');

  console.log('Deploying Premium Layer Schema to Supabase...');
  const res = await fetch('https://api.supabase.com/v1/projects/xvtofbktqqfsukxzylkt/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || ''}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Deployment Failed:', data);
    process.exit(1);
  }

  console.log('Deployment Succeeded!', data);
}

deploy().catch(console.error);
