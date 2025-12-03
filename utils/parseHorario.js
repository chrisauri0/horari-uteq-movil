export function parseStartToDate(code) {
  const dayStr = code.slice(0, 3);
  const hourStr = code.slice(3);

  const daysMap = {
    Lun: 1,
    Mar: 2,
    Mie: 3,
    Jue: 4,
    Vie: 5,
    Sab: 6,
    Dom: 0
  };

  const hour = parseInt(hourStr, 10);
  const dayIndex = daysMap[dayStr];

  if (dayIndex === undefined) return null;

  const now = new Date();
  const result = new Date();

  // Set hour
  result.setHours(hour);
  result.setMinutes(0);
  result.setSeconds(0);
  result.setMilliseconds(0);

  // Set day of week to the NEXT occurrence
  const currentDay = now.getDay(); // 0=Dom, 1=Lun, 2=Mar...
  let diff = dayIndex - currentDay;

  if (diff < 0) diff += 7; // next week

  result.setDate(now.getDate() + diff);

  return result;
}
