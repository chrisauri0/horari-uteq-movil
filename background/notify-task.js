import { parseStartToDate } from "@/utils/parseHorario";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

export const NOTIFY_CLASSES_TASK = "NOTIFY_CLASSES_TASK";

TaskManager.defineTask(NOTIFY_CLASSES_TASK, async () => {
  try {
    const horariosStr = await AsyncStorage.getItem("horarios");
    const horarios = horariosStr ? JSON.parse(horariosStr) : [];

    const now = new Date();

    for (const grupo of horarios) {
      for (const clase of grupo.data) {
        const classDate = parseStartToDate(clase.start);
        if (!classDate) continue;

        const diff = classDate.getTime() - now.getTime();
        const fiveMin = 5 * 60 * 1000;

        if (diff > 0 && diff < fiveMin) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Clase en 5 minutos ⏰",
              body: `${clase.subj} a las ${classDate.getHours()}:00`,
            },
            trigger: null,
          });
        }
      }
    }
  } catch (err) {
    console.log("Background task error:", err);
  }
});
