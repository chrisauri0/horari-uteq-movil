import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  user_reaction?: 'up' | 'down' | null;
}

interface PostCardProps {
  post: Post;
  onUpvote: (postId: string) => void;
  onDownvote: (postId: string) => void;
}

export function PostCard({ post, onUpvote, onDownvote }: PostCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `hace ${diffMins}m`;
    } else if (diffHours < 24) {
      return `hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  return (
    <Card style={{ marginBottom: Spacing.md, backgroundColor: colors.card }}>
      <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>
        {post.titulo}
      </ThemedText>

      {post.imagen_url && (
        <Image
          source={{ uri: post.imagen_url }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: BorderRadius.md,
            marginBottom: Spacing.md,
          }}
          resizeMode="cover"
        />
      )}

      <ThemedText style={{ marginBottom: Spacing.md, color: colors.text }}>
        {post.descripcion}
      </ThemedText>

      <ThemedText style={{ fontSize: FontSizes.sm, color: colors.tabIconDefault, marginBottom: Spacing.md }}>
        Por {post.creator.full_name || post.creator.email} · {formatDate(post.created_at)}
      </ThemedText>

      {/* Sección de reacciones */}
      <View style={styles.reactionsContainer}>
        <TouchableOpacity
          style={[
            styles.reactionButton,
            post.user_reaction === 'up' && {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={() => onUpvote(post.id)}
        >
          <IconSymbol
            size={18}
            name="arrow.up"
            color={post.user_reaction === 'up' ? '#fff' : colors.text}
          />
          <ThemedText
            style={{
              fontSize: FontSizes.sm,
              marginLeft: Spacing.xs,
              color: post.user_reaction === 'up' ? '#fff' : colors.text,
            }}
          >
            {post.score > 0 ? post.score : ''}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reactionButton,
            post.user_reaction === 'down' && {
              backgroundColor: '#FF6B6B',
            },
          ]}
          onPress={() => onDownvote(post.id)}
        >
          <IconSymbol
            size={18}
            name="arrow.down"
            color={post.user_reaction === 'down' ? '#fff' : colors.text}
          />
          <ThemedText
            style={{
              fontSize: FontSizes.sm,
              marginLeft: Spacing.xs,
              color: post.user_reaction === 'down' ? '#fff' : colors.text,
            }}
          >
            {post.score < 0 ? Math.abs(post.score) : ''}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.viewsContainer}>
          <IconSymbol size={16} name="eye" color={colors.tabIconDefault} />
          <ThemedText style={{ fontSize: FontSizes.sm, marginLeft: Spacing.xs }}>
            {post.view_count}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  reactionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f0f0f0',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});
