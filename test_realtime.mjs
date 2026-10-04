import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseFile = fs.readFileSync(path.join(process.cwd(), 'src/supabaseClient.js'), 'utf-8');
const urlMatch = supabaseFile.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = supabaseFile.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  const channel1 = supabase.channel('test-room');
  const channel2 = supabase.channel('test-room');

  channel1.on('broadcast', { event: 'test' }, (payload) => {
    console.log('Channel 1 received:', payload);
  });

  channel2.on('broadcast', { event: 'test' }, (payload) => {
    console.log('Channel 2 received:', payload);
  });

  await channel1.subscribe();
  await channel2.subscribe();

  setTimeout(async () => {
    await channel1.send({ type: 'broadcast', event: 'test', payload: { hello: 'world' } });
    console.log('Sent from Channel 1');
  }, 1000);

  setTimeout(() => process.exit(0), 3000);
}
