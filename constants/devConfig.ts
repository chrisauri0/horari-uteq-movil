/**
 * Configuración para desarrollo local
 * Cambia estos valores para activar/desactivar funcionalidades en Expo Go
 */

export const DEV_CONFIG = {
  // Desactiva las notificaciones de fondo (útil para Expo Go)
  SKIP_BACKGROUND_NOTIFICATIONS: true,

  // Desactiva Google Sign-In (si no tienes credenciales setup en local)
  SKIP_GOOGLE_AUTH: false,

  // Loguea datos de clases en consola en lugar de notificar
  LOG_CLASSES_TO_CONSOLE: true,

  // Bypass de autenticación para testing rápido (¡NO USAR EN PRODUCCIÓN!)
  BYPASS_AUTH: false,
  BYPASS_AUTH_USER: {
    id: "test-user-123",
    email: "test@example.com",
    full_name: "Usuario Test",
    fullName: "Usuario Test",
  },
};

export const isDev = __DEV__;
