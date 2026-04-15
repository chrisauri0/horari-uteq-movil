// NOTA: En Expo Go (desarrollo local), las notificaciones remotas no están soportadas en SDK 53+
// Este archivo exporta un ID de tarea vacío en Expo Go

import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFY_CLASSES_TASK = "NOTIFY_CLASSES_TASK";

// En producción (development build), estos módulos funcionarán
// En Expo Go, están el stub y simplemente retornan sin hacer nada
console.log("[INIT] Background notifications module loaded");

// Solo intenta registrar la tarea si estamos en un environment que lo soporta
try {
  const TaskManager = require("expo-task-manager");
  const Notifications = require("expo-notifications");

  TaskManager.defineTask(NOTIFY_CLASSES_TASK, async () => {
    try {
      const horariosStr = await AsyncStorage.getItem("horarios");
      const horarios = horariosStr ? JSON.parse(horariosStr) : [];
      console.log("[BG Task] Checking for classes...", horarios.length);
    } catch (err) {
      console.log("[BG Task] Error:", err);
    }
  });
  console.log("[INIT] Background task registered successfully");
} catch (err) {
  // En Expo Go o sin soporte, simplemente log y continúa
  console.log(
    "[DEV] Background notifications not supported in this environment - that's OK!",
  );
}
