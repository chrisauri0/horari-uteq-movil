import * as Notifications from "expo-notifications";
import { parseStartToDate } from "./parseHorario";

export async function scheduleClassNotifications(horarios) {
  for (const grupo of horarios) {
    for (const clase of grupo.data) {
      const classDate = parseStartToDate(clase.start);
      if (!classDate) continue;

      const notifyAt = new Date(classDate.getTime() - 5 * 60 * 1000);

      if (notifyAt > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Tu clase va a comenzar ⏰",
            body: `${clase.subj} inicia a las ${classDate.getHours()}:00`,
          },
          trigger: notifyAt,
        });
      }
    }
  }
}
