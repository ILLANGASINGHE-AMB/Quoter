export function relativeTime(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return "දැන්";
  if (mins < 60)  return `මිනිත්තු ${mins}කට පෙර`;
  if (hours < 24) return `පැය ${hours}කට පෙර`;
  if (days === 1) return "ඊයේ";
  return `දින ${days}කට පෙර`;
}
