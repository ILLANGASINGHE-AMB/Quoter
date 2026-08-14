let cachedIp = null;

export async function getUserIp() {
  if (cachedIp) return cachedIp;

  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedIp = data.ip;
        return data.ip;
      }
    }
  } catch (err) {
    console.warn('Could not fetch IP from ipify, using fallback identifier', err);
  }

  // Fallback to localStorage anonymous client ID
  let fallbackId = localStorage.getItem('anonymous_client_id');
  if (!fallbackId) {
    fallbackId = 'anon-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    localStorage.setItem('anonymous_client_id', fallbackId);
  }
  cachedIp = fallbackId;
  return fallbackId;
}
