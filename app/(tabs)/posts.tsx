import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PostCard } from '@/components/ui';
import api from '@/services/api';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Post {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  creator: {
    id: string;
    email: string;
    full_name: string;
  };
  score: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  user_reaction?: 'up' | 'down' | null;
}

export default function PostsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts');
      setPosts(response.data);
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
    try {
      const response = await api.post(`/posts/${postId}/react`, {
        tipo: reactionType,
      });

      // Actualizar el post local
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

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onUpvote={() => handleReaction(item.id, 'up')}
      onDownvote={() => handleReaction(item.id, 'down')}
    />
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
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
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <ThemedText style={{ textAlign: 'center', marginTop: Spacing.lg }}>
            No hay anuncios por el momento
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
