import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

export async function subirEvidenciaDrive(
  localUri: string, // URI local del archivo (de expo-image-picker)
  nombreArchivo: string,
): Promise<string> {
  const accessToken = await AsyncStorage.getItem("googleAccessToken");
  if (!accessToken) throw new Error("No hay sesión de Google activa.");

  // 1. Leer el archivo como base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Subir a Drive con multipart upload
  const metadata = {
    name: nombreArchivo,
    mimeType: "image/jpeg",
    parents: ["root"], // o un folder ID específico si quieres organizar
  };

  const boundary = "TDI_EVIDENCIA_BOUNDARY";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: image/jpeg\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${base64}\r\n` +
    `--${boundary}--`;

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.error?.message ?? "Error subiendo a Drive");
  }

  const { id, webViewLink } = await uploadRes.json();

  // 3. Hacer el archivo público (para que tu admin lo pueda ver)
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  // 4. Devolver solo la URL 👇 esto es lo que va a tu backend
  return webViewLink;
}
