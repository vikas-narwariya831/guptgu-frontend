/**
 * Generate a clean Google-Meet style room code like "kqz-mnpw-xvt"
 */
export function generateRoomCode(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyz';
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

/**
 * Format elapsed seconds as HH:MM:SS or MM:SS
 */
export function formatElapsed(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
