import { supabase } from './supabaseClient';

// Single shared channel for the "someone is waiting for a call" indicator.
// App.jsx listens on it, VoiceChatModal publishes on it. Never create another
// channel with this topic: supabase-js reuses/conflicts on duplicate topics.
let listeners = new Set();
let channel = null;

export function getVoiceStatusChannel() {
  if (!channel) {
    channel = supabase.channel('voice-status');
    channel.on('broadcast', { event: 'ping' }, () => {
      listeners.forEach((cb) => cb());
    });
    channel.subscribe();
  }
  return channel;
}

export function onVoiceWaiting(cb) {
  listeners.add(cb);
  getVoiceStatusChannel();
  return () => listeners.delete(cb);
}

export function sendVoiceWaitingPing() {
  getVoiceStatusChannel().send({ type: 'broadcast', event: 'ping', payload: {} });
}
