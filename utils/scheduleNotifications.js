import { DEV_CONFIG } from "@/constants/devConfig";
import { parseClaseToDate } from "./parseHorario";

// Carga condicional de Notifications (no disponible en Expo Go SDK 53+)
let Notifications = null;
if (!DEV_CONFIG.SKIP_BACKGROUND_NOTIFICATIONS) {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.log("[DEV] Notifications not available - running in Expo Go");
  }
}

export async function scheduleClassNotifications(horarios) {
  const safeHorarios = Array.isArray(horarios) ? horarios : [];

  // Si está deshabilitado por DEV_CONFIG, solo loguea
  if (DEV_CONFIG.SKIP_BACKGROUND_NOTIFICATIONS || !Notifications) {
    if (DEV_CONFIG.LOG_CLASSES_TO_CONSOLE) {
      console.log("📋 Classes loaded (notifications disabled):");
      for (const grupo of safeHorarios) {
        for (const clase of grupo?.data || []) {
          const classDate = parseClaseToDate(clase);
          if (classDate) {
            const hours = String(classDate.getHours()).padStart(2, "0");
            const minutes = String(classDate.getMinutes()).padStart(2, "0");
            console.log(
              `  • ${clase.materia} - ${clase.dia} ${hours}:${minutes} en ${clase.salon}`,
            );
          }
        }
      }
    }
    return;
  }

  // Si Notifications está disponible, programa las notificaciones
  try {
    for (const grupo of safeHorarios) {
      for (const clase of grupo?.data || []) {
        const classDate = parseClaseToDate(clase);
        if (!classDate) continue;

        const notifyAt = new Date(classDate.getTime() - 5 * 60 * 1000);

        if (notifyAt > new Date()) {
          const hours = String(classDate.getHours()).padStart(2, "0");
          const minutes = String(classDate.getMinutes()).padStart(2, "0");

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Tu clase va a comenzar ⏰",
              body: `${clase.materia} en ${clase.salon} inicia a las ${hours}:${minutes}`,
            },
            trigger: {
              type: "date",
              timestamp: notifyAt.getTime(),
            },
          });
        }
      }
    }
  } catch (err) {
    console.log("[Error scheduling notifications]", err);
  }
}
