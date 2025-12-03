# Horari-UTEQ

Aplicación móvil para consultar y agendar horarios de clases y asesorías en la UTEQ.

## Requisitos

- Node.js >= 18
- pnpm (o npm/yarn)
- Expo CLI (`npm install -g expo-cli`)
- Android Studio o dispositivo físico (para pruebas)
- Acceso a la API backend (configura la URL en `.env`)

## Instalación

1. Clona el repositorio:

   ```sh
   git clone https://github.com/chrisauri0/horari-uteq-movil.git
   cd horari-uteq-movil/Horari-UTEQ
   ```

2. Instala dependencias:

   ```sh
   pnpm install
   # o
   npm install
   # o
   yarn install
   ```

3. Configura variables de entorno:

   - Crea un archivo `.env` en la raíz con:
     ```env
     API_BASE_URL=https://tu-api.com
     ```
   - Cambia la URL por la de tu backend.

4. Inicia el proyecto en modo desarrollo:
   ```sh
   expo start
   ```
   - Escanea el QR con Expo Go o abre en emulador Android/iOS.

## Compilación para producción

- Requiere cuenta en Expo y EAS CLI:
  ```sh
  npm install -g eas-cli
  eas build -p android --profile preview
  eas build -p ios --profile preview
  ```

## Google Auth

- Configura los clientId en Google Cloud Console para Android/iOS/Web.
- Agrega el scheme en `app.json`:
  ```json
  "scheme": "com.chrisauri0.horariuteq"
  ```
- Revisa la documentación de Expo AuthSession si tienes problemas de login.

## Estructura principal

- `app/` — Pantallas y rutas Expo Router
- `components/` — Componentes reutilizables
- `constants/` — Temas y configuración
- `hooks/` — Custom hooks
- `services/` — API y utilidades

## Notas

- El backend debe estar disponible y configurado en `.env`.
- Si tienes problemas de dependencias, revisa las versiones sugeridas por Expo en la consola.
- Para Google Auth, revisa los redirect URI y el scheme.

## Contribuir

1. Haz un fork y crea una rama:
   ```sh
   git checkout -b feature/nueva-funcionalidad
   ```
2. Haz tus cambios y abre un Pull Request.

---

¿Dudas o problemas? Abre un issue en GitHub o contacta al owner del repo.
