export function isOutOfHours(
  hours: Record<string, { open: string | null; close: string | null } | undefined>,
  now: Date = new Date()
): boolean {
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const dayName = dayNames[now.getDay()];
  const today = hours[dayName];

  if (!today || !today.open || !today.close) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes < openMinutes || currentMinutes > closeMinutes;
}
