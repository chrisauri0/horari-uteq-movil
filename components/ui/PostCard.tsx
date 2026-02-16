import { View, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { UTEQColors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  onUpvote: (postId: string) => void;
  onDownvote: (postId: string) => void;
  onPress?: (postId: string) => void;
}

export function PostCard({ post, onUpvote, onDownvote, onPress }: PostCardProps) {
  const expiresAt = post.expires_at ? new Date(post.expires_at) : null;
  const isExpired = !!expiresAt && expiresAt.getTime() <= Date.now();
  const isInactive = post.deleted || post.status !== 'active' || isExpired;

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

  const formatExpiresAt = (date: Date | null) => {
    if (!date) {
      return 'sin fecha';
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins <= 0) {
      return 'expirado';
    }

    if (diffMins < 60) {
      return `en ${diffMins}m`;
    }

    if (diffHours < 24) {
      return `en ${diffHours}h`;
    }

    if (diffDays < 7) {
      return `en ${diffDays}d`;
    }

    return date.toLocaleDateString('es-ES');
  };

  return (
    <Card style={{ marginBottom: Spacing.md, backgroundColor: UTEQColors.white }}>
      <Pressable onPress={() => onPress?.(post.id)}>
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

        <ThemedText style={{ marginBottom: Spacing.md, color: UTEQColors.textPrimary }}>
          {post.descripcion}
        </ThemedText>

        <ThemedText style={{ fontSize: FontSizes.sm, color: UTEQColors.textSecondary, marginBottom: Spacing.xs }}>
          Por {post.creator?.full_name || post.creator?.email || 'Anonimo'} · {formatDate(post.created_at)}
        </ThemedText>

        <ThemedText style={{ fontSize: FontSizes.xs, color: UTEQColors.textSecondary, marginBottom: Spacing.md }}>
          {post.status === 'active' && !isExpired
            ? `Activo · expira ${formatExpiresAt(expiresAt)}`
            : 'Expirado o inactivo'}
        </ThemedText>
      </Pressable>

      {/* Sección de reacciones */}
      <View style={styles.reactionsContainer}>
        <TouchableOpacity
          style={[
            styles.reactionButton,
            post.user_reaction === 'up' && {
              backgroundColor: UTEQColors.bluePrimary,
            },
            isInactive && { opacity: 0.5 },
          ]}
          onPress={() => onUpvote(post.id)}
          disabled={isInactive}
        >
          <IconSymbol
            size={18}
            name="arrow.up"
            color={post.user_reaction === 'up' ? '#fff' : UTEQColors.textPrimary}
          />
          <ThemedText
            style={{
              fontSize: FontSizes.sm,
              marginLeft: Spacing.xs,
              color: post.user_reaction === 'up' ? '#fff' : UTEQColors.textPrimary,
            }}
          >
            {post.upvotes ?? 0}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reactionButton,
            post.user_reaction === 'down' && {
              backgroundColor: '#FF6B6B',
            },
            isInactive && { opacity: 0.5 },
          ]}
          onPress={() => onDownvote(post.id)}
          disabled={isInactive}
        >
          <IconSymbol
            size={18}
            name="arrow.down"
            color={post.user_reaction === 'down' ? '#fff' : UTEQColors.textPrimary}
          />
          <ThemedText
            style={{
              fontSize: FontSizes.sm,
              marginLeft: Spacing.xs,
              color: post.user_reaction === 'down' ? '#fff' : UTEQColors.textPrimary,
            }}
          >
            {post.downvotes ?? 0}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.viewsContainer}>
          <IconSymbol size={16} name="eye" color={UTEQColors.textSecondary} />
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
    backgroundColor: UTEQColors.gray100,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});
