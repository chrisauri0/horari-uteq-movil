// Legacy function for old format
export function parseStartToDate(code) {
  if (!code || typeof code !== "string") {
    console.warn("[parseHorario] Invalid code:", code);
    return null;
  }

  const dayStr = code.slice(0, 3);
  const hourStr = code.slice(3);

  const daysMap = {
    Lun: 1,
    Mar: 2,
    Mie: 3,
    Jue: 4,
    Vie: 5,
    Sab: 6,
    Dom: 0,
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

// New function for backend format {dia: string, hora: string}
export function parseClaseToDate(clase) {
  if (!clase.dia || !clase.hora) return null;

  const daysMap = {
    Lunes: 1,
    Martes: 2,
    Miercoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sabado: 6,
    Domingo: 0,
  };

  // Extract start hour from "HH:MM-HH:MM"
  const hourMatch = clase.hora.match(/^(\d{1,2}):(\d{2})/);
  if (!hourMatch) return null;

  const hour = parseInt(hourMatch[1], 10);
  const minute = parseInt(hourMatch[2], 10);
  const dayIndex = daysMap[clase.dia];

  if (dayIndex === undefined) return null;

  const now = new Date();
  const result = new Date();

  // Set hour and minute
  result.setHours(hour);
  result.setMinutes(minute);
  result.setSeconds(0);
  result.setMilliseconds(0);

  // Set day of week to the NEXT occurrence
  const currentDay = now.getDay(); // 0=Dom, 1=Lun, 2=Mar...
  let diff = dayIndex - currentDay;

  if (diff < 0) diff += 7; // next week
  if (diff === 0) {
    // If same day, check if time has passed
    if (result <= now) diff = 7; // schedule for next week
  }

  result.setDate(now.getDate() + diff);

  return result;
}
