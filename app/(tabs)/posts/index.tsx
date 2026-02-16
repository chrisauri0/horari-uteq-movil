import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, PostCard } from '@/components/ui';
import api from '@/services/api';
import { Spacing, UTEQColors } from '@/constants/theme';
import type { Post } from '@/types/post';

const FILTERS = ['active', 'trending'] as const;

type FilterType = (typeof FILTERS)[number];

export default function PostsScreen() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('active');
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
    fetchPosts();
  }, [filter, userId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'active' ? '/posts/active' : '/posts/trending';
      const response = await api.get(endpoint, {
        params: userId ? { userId } : undefined,
      });

      const filtered = (response.data as Post[]).filter((post) => {
        if (post.deleted || post.status !== 'active') {
          return false;
        }
        if (!post.expires_at) {
          return true;
        }
        return new Date(post.expires_at).getTime() > Date.now();
      });

      setPosts(filtered);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleReaction = async (postId: string, reactionType: 'up' | 'down') => {
    if (!userId) {
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/react`, {
        tipo: reactionType,
        userId,
      });

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...response.data,
                user_reaction: response.data.user_reaction,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Comunidad</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Comparte anuncios y novedades del campus
          </ThemedText>
        </View>
        <Button
          title="Nuevo"
          onPress={() => router.push('/posts/create')}
          variant="secondary"
          size="small"
        />
      </View>
    ),
    [router]
  );

  const filterRow = (
    <View style={styles.filterRow}>
      <Button
        title="Activos"
        onPress={() => setFilter('active')}
        variant={filter === 'active' ? 'primary' : 'outline'}
        size="small"
      />
      <Button
        title="Tendencias"
        onPress={() => setFilter('trending')}
        variant={filter === 'trending' ? 'primary' : 'outline'}
        size="small"
      />
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onUpvote={() => handleReaction(item.id, 'up')}
      onDownvote={() => handleReaction(item.id, 'down')}
      onPress={() => router.push(`/posts/${item.id}`)}
    />
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={UTEQColors.bluePrimary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {header}
            {filterRow}
          </View>
        }
        ListEmptyComponent={
          <ThemedText style={{ textAlign: 'center', marginTop: Spacing.lg }}>
            No hay posts activos por el momento
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UTEQColors.gray50,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 32,
  },
  headerContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    backgroundColor: UTEQColors.bluePrimary,
    paddingTop: Spacing.xl + 24,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: UTEQColors.white,
  },
  headerSubtitle: {
    marginTop: Spacing.xs,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
