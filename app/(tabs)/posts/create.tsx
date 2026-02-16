import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, Input } from '@/components/ui';
import api from '@/services/api';
import { Spacing, UTEQColors } from '@/constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim()) {
      Alert.alert('Faltan datos', 'Agrega un titulo y descripcion.');
      return;
    }

    const storedUser = await AsyncStorage.getItem('user');
    if (!storedUser) {
      Alert.alert('Necesitas iniciar sesion', 'Inicia sesion para publicar.');
      return;
    }

    let userId: string | null = null;
    try {
      const parsed = JSON.parse(storedUser);
      userId = parsed.id ?? null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
    }

    if (!userId) {
      Alert.alert('Usuario invalido', 'Vuelve a iniciar sesion.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ...(imagenUrl.trim() ? { imagen_url: imagenUrl.trim() } : {}),
        creator: {
          connect: { id: userId },
        },
      };

      const response = await api.post('/posts', payload);
      router.replace(`/posts/${response.data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('No se pudo publicar', 'Intenta de nuevo en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Nuevo post</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Comparte anuncios o dudas con la comunidad.
          </ThemedText>
        </View>

        <Card style={styles.card}>
          <Input
            label="Titulo"
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Cambio de horario o aviso"
          />
          <Input
            label="Descripcion"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Cuenta los detalles aqui"
            multiline
            inputStyle={styles.textArea}
          />
          <Input
            label="Imagen (opcional)"
            value={imagenUrl}
            onChangeText={setImagenUrl}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <Button
            title={loading ? 'Publicando...' : 'Publicar'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
          />

          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
            size="small"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UTEQColors.gray50,
  },
  scrollContent: {
    paddingBottom: Spacing.xl + 32,
  },
  header: {
    backgroundColor: UTEQColors.bluePrimary,
    paddingTop: Spacing.xl + 24,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: UTEQColors.white,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  card: {
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
