import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, PostCard } from '@/components/ui';
import api from '@/services/api';
import { Spacing, FontSizes, UTEQColors } from '@/constants/theme';
import type { Post } from '@/types/post';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserId(parsed.id ?? null);
        } catch (error) {
          console.error('Error parsing user from storage:', error);
        }
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/posts/${id}`, {
          params: userId ? { userId } : undefined,
        });
        setPost(response.data);
        await api.post(`/posts/${id}/view`, undefined, {
          params: userId ? { userId } : undefined,
        });
      } catch (error) {
        console.error('Error fetching post:', error);
        Alert.alert('Error', 'No se pudo cargar el post.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, userId]);

  const handleReaction = async (reactionType: 'up' | 'down') => {
    if (!post || !userId) {
      return;
    }

    try {
      const response = await api.post(`/posts/${post.id}/react`, {
        tipo: reactionType,
        userId,
      });

      setPost({
        ...response.data,
        user_reaction: response.data.user_reaction,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={UTEQColors.bluePrimary} />
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ textAlign: 'center' }}>Post no encontrado.</ThemedText>
        <Button title="Volver" onPress={() => router.back()} variant="ghost" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button title="Volver" onPress={() => router.back()} variant="ghost" size="small" />
          <ThemedText style={styles.headerTitle}>Detalle del post</ThemedText>
        </View>

        <PostCard
          post={post}
          onUpvote={() => handleReaction('up')}
          onDownvote={() => handleReaction('down')}
        />

        <Card style={styles.statsCard}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>
            Resumen del post
          </ThemedText>
          <View style={styles.statsRow}>
            <View>
              <ThemedText style={styles.statValue}>{post.score}</ThemedText>
              <ThemedText style={styles.statLabel}>Score</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.statValue}>{post.comment_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Comentarios</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.statValue}>{post.view_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Vistas</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.metaText}>
            Creado el {new Date(post.created_at).toLocaleDateString('es-ES')}
          </ThemedText>
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
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: UTEQColors.white,
  },
  statsCard: {
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: UTEQColors.textSecondary,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: UTEQColors.textSecondary,
  },
});
