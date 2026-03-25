import { Button } from "@/components/ui";
import {
    BorderRadius,
    FontSizes,
    Spacing,
    UTEQColors,
} from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type FeedFilter = "TODOS" | "OFICIALES" | "ALUMNOS";

type FeedPost = {
  id: string;
  title: string;
  body: string;
  author: string;
  source: string;
  role: "OFICIAL" | "ALUMNO";
  createdAt: string;
  tag: string;
  likes: number;
  comments: number;
  pinned?: boolean;
};

const FEED_THEME = {
  bg: "#F8FAFC",
  hero: "#0B3C5D",
  heroSoft: "#145374",
  accent: "#F97316",
  accentSoft: "#FDBA74",
  official: "#0E7490",
  officialSoft: "#ECFEFF",
  student: "#7C2D12",
  studentSoft: "#FFF7ED",
  border: "#E2E8F0",
};

const OFFICIAL_POSTS: FeedPost[] = [
  {
    id: "off-1",
    title: "Ajuste de horario por mantenimiento electrico",
    body: "Direccion Academica informa que manana las clases inician a las 9:00 en edificio B.",
    author: "Direccion Academica",
    source: "Direccion",
    role: "OFICIAL",
    createdAt: "Hace 1 h",
    tag: "Aviso",
    likes: 34,
    comments: 8,
    pinned: true,
  },
  {
    id: "off-2",
    title: "Menu semanal disponible",
    body: "Cafeteria publica el menu saludable de la semana con combos para estudiantes.",
    author: "Cafeteria UTEQ",
    source: "Cafeteria",
    role: "OFICIAL",
    createdAt: "Hace 3 h",
    tag: "Servicios",
    likes: 21,
    comments: 5,
  },
  {
    id: "off-3",
    title: "Convocatoria de becas abierta",
    body: "Bienestar Estudiantil abre registro de becas de transporte hasta el viernes.",
    author: "Bienestar Estudiantil",
    source: "Becas",
    role: "OFICIAL",
    createdAt: "Hace 5 h",
    tag: "Becas",
    likes: 42,
    comments: 12,
  },
];

const STUDENT_SEED_POSTS: FeedPost[] = [
  {
    id: "std-1",
    title: "Vendo calculadora cientifica",
    body: "Casio fx-991LA Plus en excelente estado. Entrego en biblioteca.",
    author: "Ana Gomez",
    source: "Alumnos",
    role: "ALUMNO",
    createdAt: "Hace 40 min",
    tag: "Venta",
    likes: 9,
    comments: 2,
  },
  {
    id: "std-2",
    title: "Busco equipo para Hackathon",
    body: "Me interesa backend en Node y algo de React. Si te interesa escribeme.",
    author: "Carlos Rios",
    source: "Alumnos",
    role: "ALUMNO",
    createdAt: "Hace 2 h",
    tag: "Equipo",
    likes: 15,
    comments: 7,
  },
];

const FILTERS: FeedFilter[] = ["TODOS", "OFICIALES", "ALUMNOS"];

export default function BlogScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("TODOS");
  const [studentPosts, setStudentPosts] =
    useState<FeedPost[]>(STUDENT_SEED_POSTS);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTag, setDraftTag] = useState("General");

  const mergedFeed = useMemo(
    () => [...OFFICIAL_POSTS, ...studentPosts],
    [studentPosts],
  );

  const filteredFeed = useMemo(() => {
    if (activeFilter === "OFICIALES") {
      return mergedFeed.filter((post) => post.role === "OFICIAL");
    }
    if (activeFilter === "ALUMNOS") {
      return mergedFeed.filter((post) => post.role === "ALUMNO");
    }
    return mergedFeed;
  }, [activeFilter, mergedFeed]);

  const pinnedOfficialPosts = OFFICIAL_POSTS.filter((post) => post.pinned);

  const createPost = async () => {
    if (!draftTitle.trim() || !draftBody.trim()) {
      return;
    }

    const userString = await AsyncStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const authorName = user?.name ?? "Alumno UTEQ";

    const newPost: FeedPost = {
      id: `student-${Date.now()}`,
      title: draftTitle.trim(),
      body: draftBody.trim(),
      author: authorName,
      source: "Alumnos",
      role: "ALUMNO",
      createdAt: "Ahora",
      tag: draftTag,
      likes: 0,
      comments: 0,
    };

    setStudentPosts((prev) => [newPost, ...prev]);
    setDraftTitle("");
    setDraftBody("");
    setDraftTag("General");
    setActiveFilter("TODOS");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Muro UTEQ</Text>
          <Text style={styles.heroSubtitle}>
            Publica anuncios entre alumnos y consulta comunicados oficiales.
          </Text>
          <View style={styles.heroChipsRow}>
            <View style={styles.heroChipOfficial}>
              <Text style={styles.heroChipText}>Oficiales</Text>
            </View>
            <View style={styles.heroChipStudent}>
              <Text style={styles.heroChipTextAlt}>Comunidad</Text>
            </View>
          </View>
        </View>

        <View style={styles.composerCard}>
          <Text style={styles.cardTitle}>Crear anuncio de alumno</Text>
          <TextInput
            placeholder="Titulo del anuncio"
            placeholderTextColor={UTEQColors.gray400}
            value={draftTitle}
            onChangeText={setDraftTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Describe tu anuncio..."
            placeholderTextColor={UTEQColors.gray400}
            value={draftBody}
            onChangeText={setDraftBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.bodyInput]}
          />

          <View style={styles.tagsRow}>
            {["General", "Venta", "Equipo", "Evento"].map((tag) => {
              const selected = draftTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setDraftTag(tag)}
                  style={[
                    styles.tagButton,
                    selected && styles.tagButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      selected && styles.tagButtonTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title="Publicar anuncio"
            onPress={createPost}
            variant="primary"
            fullWidth
            style={styles.publishButton}
            textStyle={styles.publishButtonText}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anuncios oficiales destacados</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.officialRow}
        >
          {pinnedOfficialPosts.map((post) => (
            <View key={post.id} style={styles.officialCard}>
              <View style={styles.postHeaderRow}>
                <Text style={styles.officialBadge}>OFICIAL</Text>
                <Text style={styles.postDate}>{post.createdAt}</Text>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postBody}>{post.body}</Text>
              <Text style={styles.postSource}>{post.author}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Feed de anuncios</Text>
          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const selected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterButton,
                    selected && styles.filterButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selected && styles.filterButtonTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {filteredFeed.map((post) => {
          const isOfficial = post.role === "OFICIAL";
          return (
            <View
              key={post.id}
              style={[
                styles.feedCard,
                isOfficial ? styles.feedCardOfficial : styles.feedCardStudent,
              ]}
            >
              <View style={styles.postHeaderRow}>
                <Text
                  style={[
                    styles.postRoleBadge,
                    isOfficial
                      ? styles.postRoleOfficial
                      : styles.postRoleStudent,
                  ]}
                >
                  {isOfficial ? post.source : "ALUMNOS"}
                </Text>
                <Text style={styles.postDate}>{post.createdAt}</Text>
              </View>

              <Text style={styles.feedCardTitle}>{post.title}</Text>
              <Text style={styles.feedCardBody}>{post.body}</Text>

              <View style={styles.feedMetaRow}>
                <Text style={styles.authorText}>{post.author}</Text>
                <Text style={styles.tagText}>{post.tag}</Text>
              </View>

              <View style={styles.reactionRow}>
                <Text style={styles.reactionText}>{post.likes} me gusta</Text>
                <Text style={styles.reactionText}>
                  {post.comments} comentarios
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FEED_THEME.bg,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  hero: {
    backgroundColor: FEED_THEME.hero,
    paddingTop: Spacing.xl + 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    color: UTEQColors.white,
    fontSize: FontSizes["2xl"],
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    marginTop: Spacing.xs,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  heroChipsRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  heroChipOfficial: {
    backgroundColor: FEED_THEME.official,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroChipStudent: {
    backgroundColor: FEED_THEME.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroChipText: {
    color: UTEQColors.white,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  heroChipTextAlt: {
    color: FEED_THEME.student,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  composerCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: UTEQColors.white,
    borderWidth: 1,
    borderColor: FEED_THEME.border,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: "700",
    color: FEED_THEME.hero,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: FEED_THEME.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: UTEQColors.textPrimary,
    marginBottom: Spacing.sm,
    backgroundColor: UTEQColors.gray50,
  },
  bodyInput: {
    minHeight: 96,
  },
  tagsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  tagButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: UTEQColors.gray100,
    borderWidth: 1,
    borderColor: UTEQColors.gray200,
  },
  tagButtonSelected: {
    backgroundColor: FEED_THEME.accent,
    borderColor: FEED_THEME.accent,
  },
  tagButtonText: {
    color: UTEQColors.gray700,
    fontSize: FontSizes.xs,
    fontWeight: "600",
  },
  tagButtonTextSelected: {
    color: UTEQColors.white,
  },
  publishButton: {
    backgroundColor: FEED_THEME.heroSoft,
  },
  publishButtonText: {
    color: UTEQColors.white,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: FEED_THEME.hero,
    marginBottom: Spacing.sm,
  },
  officialRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  officialCard: {
    width: 280,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: FEED_THEME.officialSoft,
    borderWidth: 1,
    borderColor: "#A5F3FC",
  },
  postHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  officialBadge: {
    backgroundColor: FEED_THEME.official,
    color: UTEQColors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  postDate: {
    color: UTEQColors.gray500,
    fontSize: FontSizes.xs,
  },
  postTitle: {
    fontSize: FontSizes.base,
    fontWeight: "700",
    color: FEED_THEME.hero,
    marginBottom: Spacing.xs,
  },
  postBody: {
    color: UTEQColors.gray700,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  postSource: {
    marginTop: Spacing.sm,
    color: FEED_THEME.official,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: UTEQColors.gray300,
    backgroundColor: UTEQColors.white,
  },
  filterButtonSelected: {
    backgroundColor: FEED_THEME.hero,
    borderColor: FEED_THEME.hero,
  },
  filterButtonText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.gray600,
    fontWeight: "700",
  },
  filterButtonTextSelected: {
    color: UTEQColors.white,
  },
  feedCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  feedCardOfficial: {
    backgroundColor: FEED_THEME.officialSoft,
    borderColor: "#A5F3FC",
  },
  feedCardStudent: {
    backgroundColor: FEED_THEME.studentSoft,
    borderColor: "#FED7AA",
  },
  postRoleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  postRoleOfficial: {
    backgroundColor: FEED_THEME.official,
    color: UTEQColors.white,
  },
  postRoleStudent: {
    backgroundColor: FEED_THEME.accent,
    color: UTEQColors.white,
  },
  feedCardTitle: {
    fontSize: FontSizes.base,
    fontWeight: "700",
    color: UTEQColors.textPrimary,
    marginTop: Spacing.xs,
  },
  feedCardBody: {
    marginTop: Spacing.xs,
    color: UTEQColors.gray700,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  feedMetaRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  authorText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.gray600,
    fontWeight: "700",
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: FEED_THEME.hero,
    fontWeight: "700",
  },
  reactionRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: UTEQColors.gray200,
    paddingTop: Spacing.sm,
  },
  reactionText: {
    fontSize: FontSizes.xs,
    color: UTEQColors.gray600,
  },
});
