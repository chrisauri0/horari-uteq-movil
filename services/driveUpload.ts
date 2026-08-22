import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy"; // 👈 antes era "expo-file-system"
export async function subirEvidenciaDrive(
  localUri: string,
  nombreArchivo: string,
  mimeType: string = "application/octet-stream",
): Promise<string> {
  const accessToken = await AsyncStorage.getItem("googleAccessToken");
  if (!accessToken) throw new Error("No hay sesión de Google activa.");

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });

  const metadata = {
    name: nombreArchivo,
    mimeType,
    // 👈 quitamos "parents": ["root"] — se sube a la raíz por default, igual que justificantes
  };

  const boundary = "TDI_EVIDENCIA_BOUNDARY";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
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

  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return webViewLink;
}
