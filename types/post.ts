export type PostReaction = 'up' | 'down' | null;

export interface PostCreator {
  id: string;
  email: string;
  full_name?: string | null;
}

export interface Post {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string | null;
  creator?: PostCreator | null;
  score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  view_count: number;
  status: string;
  expires_at?: string | null;
  deleted?: boolean;
  created_at: string;
  updated_at: string;
  user_reaction?: PostReaction;
}
