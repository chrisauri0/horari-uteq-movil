import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirige a la ruta que tú quieras
    router.push("/");
  }, []);

  return (
    <ThemedView>
      <ThemedText>Redirigiendo...</ThemedText>
    </ThemedView>
  );
}