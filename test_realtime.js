import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read supabase url and key from source
const supabaseFile = fs.readFileSync(path.join(process.cwd(), 'src/supabaseClient.js'), 'utf-8');
const urlMatch = supabaseFile.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = supabaseFile.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  const channel1 = supabase.channel('test-room', { config: { presence: { key: 'client1' } } });
  const channel2 = supabase.channel('test-room', { config: { presence: { key: 'client2' } } });

  let c1Seen = false;
  let c2Seen = false;

  channel1.on('presence', { event: 'sync' }, () => {
    const state = channel1.presenceState();
    console.log('Client 1 sync:', Object.keys(state));
    if (Object.keys(state).includes('client2')) c1Seen = true;
  });

  channel2.on('presence', { event: 'sync' }, () => {
    const state = channel2.presenceState();
    console.log('Client 2 sync:', Object.keys(state));
    if (Object.keys(state).includes('client1')) c2Seen = true;
  });

  await channel1.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel1.track({ ready: true });
    }
  });

  await channel2.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel2.track({ ready: true });
    }
  });

  setTimeout(() => {
    console.log(`Success: ${c1Seen && c2Seen}`);
    process.exit(0);
  }, 3000);
}
