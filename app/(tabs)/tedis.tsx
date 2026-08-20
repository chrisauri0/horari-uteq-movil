// screens/TDIScreen.tsx
import { subirEvidenciaDrive } from "@/services/driveUpload";
import { tdiApi } from "@/services/tdiApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type NivelImpacto = "1" | "2" | "3" | "4";
type EjeCategoria =
  | "Identidad Personal"
  | "Entorno Social"
  | "Entorno Físico"
  | "Trascendencia";
type EstadoSolicitud = "Pendiente" | "Aprobada" | "Rechazada";
type EstadoInscripcion = "inscrito" | "evidencia_subida";

interface TDI {
  id: string;
  eje: EjeCategoria;
  nombre: string;
  personaEncargada: string;
  puesto: string;
  correo: string;
  telefono: string;
  tipo: "interna" | "externa";
  horasRequeridas: number;
  nivelDeImpacto: NivelImpacto;
  tdisporGanar: number;
  competencias: string;
  evidencias: string;
  observaciones: string;
  cupoMaximo: number | null;
  cupoActual: number;
  fecha: string | null;
  lugar: string | null;
  emoji: string | null;
}

interface SolicitudPropia {
  id: string;
  nombre_solicitud: string;
  matricula: string;
  eje: EjeCategoria;
  horas_requeridas: number;
  persona_encargada: string;
  puesto: string;
  telefono: string;
  correo: string;
  competencias: string;
  evidencias: string;
  observaciones: string;
  estado: EstadoSolicitud;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const NIVEL_LABELS: Record<NivelImpacto, string> = {
  "1": "Sensibilizador",
  "2": "Formador",
  "3": "Aplicador",
  "4": "Implementador",
};

const EJE_COLORS: Record<EjeCategoria, string> = {
  "Identidad Personal": "#6C63FF",
  "Entorno Social": "#F59E0B",
  "Entorno Físico": "#10B981",
  Trascendencia: "#EF4444",
};

const EJES: EjeCategoria[] = [
  "Identidad Personal",
  "Entorno Social",
  "Entorno Físico",
  "Trascendencia",
];

const ESTADO_CONFIG: Record<
  EstadoSolicitud,
  { color: string; bg: string; emoji: string }
> = {
  Pendiente: { color: "#F59E0B", bg: "#FEF3C7", emoji: "⏳" },
  Aprobada: { color: "#10B981", bg: "#D1FAE5", emoji: "✅" },
  Rechazada: { color: "#EF4444", bg: "#FEE2E2", emoji: "❌" },
};

// 👇 Formulario actualizado: agregamos matricula + contacto externo,
// quitamos organizacion/correoContacto sueltos, descripcion se funde en observaciones
const FORM_INICIAL = {
  matricula: "",
  nombreSolicitud: "",
  eje: "" as EjeCategoria | "",
  horasRealizadas: "",
  personaEncargada: "",
  puesto: "",
  telefono: "",
  extension: "",
  correo: "", // correo del contacto/supervisor externo, no del alumno
  descripcion: "", // se envía dentro de observaciones
  competencias: "",
  evidencias: "",
  observaciones: "",
};

// ─── Subcomponentes ─────────────────────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: color + "22", borderColor: color },
    ]}
  >
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const CupoBar = ({
  actual,
  maximo,
}: {
  actual: number;
  maximo: number | null;
}) => {
  // cupo_maximo es nullable en el backend -> null significa cupo ilimitado
  if (maximo === null) {
    return (
      <View style={styles.cupoContainer}>
        <Text style={styles.cupoText}>{actual} inscritos · Cupo abierto</Text>
      </View>
    );
  }

  const pct = Math.min(actual / maximo, 1);
  const lleno = actual >= maximo;
  return (
    <View style={styles.cupoContainer}>
      <View style={styles.cupoBarBg}>
        <View
          style={[
            styles.cupoBarFill,
            {
              width: `${pct * 100}%` as any,
              backgroundColor: lleno ? "#EF4444" : "#6C63FF",
            },
          ]}
        />
      </View>
      <Text style={[styles.cupoText, lleno && { color: "#EF4444" }]}>
        {lleno ? "Cupo lleno" : `${actual}/${maximo} inscritos`}
      </Text>
    </View>
  );
};

// ─── Pantalla principal ──────────────────────────────────────────────────────

export default function TDIScreen() {
  const [tabActivo, setTabActivo] = useState<"catalogo" | "mis-solicitudes">(
    "catalogo",
  );
  const [busqueda, setBusqueda] = useState("");
  const [ejeActivo, setEjeActivo] = useState<EjeCategoria | "Todos">("Todos");

  // ── Data desde backend ────────────────────────────────────────────────────
  const [tdis, setTdis] = useState<TDI[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  const [solicitudes, setSolicitudes] = useState<SolicitudPropia[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);

  // ── Inscripciones: { tdiId: { inscripcionId, estado } } ───────────────────
  const [inscripciones, setInscripciones] = useState<
    Record<string, { inscripcionId: string; estado: EstadoInscripcion }>
  >({});

  const [tdiSeleccionado, setTdiSeleccionado] = useState<TDI | null>(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEvidencia, setModalEvidencia] = useState(false);
  const [notaEvidencia, setNotaEvidencia] = useState("");
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalDetalleSolicitud, setModalDetalleSolicitud] = useState(false);
  const [solicitudVista, setSolicitudVista] = useState<SolicitudPropia | null>(
    null,
  );
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<
    Partial<Record<keyof typeof FORM_INICIAL, string>>
  >({});

  // ── Carga inicial ──────────────────────────────────────────────────────────

  const cargarCatalogo = useCallback(async () => {
    setCargandoCatalogo(true);
    try {
      const [tdisRes, inscripcionesRes] = await Promise.all([
        tdiApi.getCatalogo(),
        tdiApi.getMisInscripciones(),
      ]);
      setTdis(tdisRes.data);

      const mapaInscripciones: Record<
        string,
        { inscripcionId: string; estado: EstadoInscripcion }
      > = {};
      (inscripcionesRes.data ?? []).forEach((insc: any) => {
        mapaInscripciones[insc.tdi_id] = {
          inscripcionId: insc.id,
          estado:
            insc.estado === "aprobado" || insc.estado === "en_revision"
              ? "evidencia_subida"
              : "inscrito",
        };
      });
      setInscripciones(mapaInscripciones);
    } catch (err) {
      console.log("Error cargando catálogo TDI:", err);
      Alert.alert("Error", "No se pudo cargar el catálogo de actividades.");
    } finally {
      setCargandoCatalogo(false);
    }
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    setCargandoSolicitudes(true);
    try {
      const res = await tdiApi.getMisSolicitudes();
      setSolicitudes(res.data);
    } catch (err) {
      console.log("Error cargando solicitudes:", err);
    } finally {
      setCargandoSolicitudes(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
    cargarSolicitudes();
  }, [cargarCatalogo, cargarSolicitudes]);

  // ── Helpers formulario ─────────────────────────────────────────────────────

  const setField = (key: keyof typeof FORM_INICIAL, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errores[key]) setErrores((prev) => ({ ...prev, [key]: "" }));
  };

  const validarForm = () => {
    const e: Partial<Record<keyof typeof FORM_INICIAL, string>> = {};
    if (!form.matricula.trim()) e.matricula = "Requerido";
    if (!form.nombreSolicitud.trim()) e.nombreSolicitud = "Requerido";
    if (!form.eje) e.eje = "Selecciona un eje";
    if (!form.horasRealizadas || isNaN(Number(form.horasRealizadas)))
      e.horasRealizadas = "Ingresa un número válido";
    if (!form.personaEncargada.trim()) e.personaEncargada = "Requerido";
    if (!form.puesto.trim()) e.puesto = "Requerido";
    if (!form.telefono.trim()) e.telefono = "Requerido";
    if (!form.correo.trim() || !form.correo.includes("@"))
      e.correo = "Correo de contacto inválido";
    if (!form.descripcion.trim()) e.descripcion = "Requerido";
    if (!form.competencias.trim()) e.competencias = "Requerido";
    if (!form.evidencias.trim()) e.evidencias = "Requerido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Enviar solicitud ───────────────────────────────────────────────────────

  const handleEnviarSolicitud = async () => {
    if (!validarForm()) return;
    setEnviando(true);
    try {
      // 👇 descripcion se funde con observaciones porque el backend no tiene
      // un campo separado para ella (ver nota en el chat)
      const observacionesCombinadas = form.observaciones.trim()
        ? `Descripción: ${form.descripcion}\n\nObservaciones: ${form.observaciones}`
        : `Descripción: ${form.descripcion}`;

      await tdiApi.crearSolicitud({
        matricula: form.matricula,
        nombreSolicitud: form.nombreSolicitud,
        eje: form.eje,
        horasRequeridas: Number(form.horasRealizadas),
        personaEncargada: form.personaEncargada,
        puesto: form.puesto,
        telefono: form.telefono,
        extension: form.extension || undefined,
        correo: form.correo,
        competencias: form.competencias,
        evidencias: form.evidencias,
        observaciones: observacionesCombinadas,
      });

      await cargarSolicitudes();
      setForm(FORM_INICIAL);
      setModalFormulario(false);
      setTabActivo("mis-solicitudes");
      Alert.alert(
        "¡Solicitud enviada! 🎉",
        "El equipo TDI revisará tu propuesta. Te notificaremos por correo.",
      );
    } catch (err: any) {
      console.log("Error enviando solicitud:", err);
      const msg =
        err?.response?.data?.message ||
        "No se pudo enviar tu solicitud. Intenta de nuevo.";
      Alert.alert("Error", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setEnviando(false);
    }
  };

  // ── Inscripción ────────────────────────────────────────────────────────────

  const handleInscribir = (tdi: TDI) => {
    Alert.alert(
      "Confirmar inscripción",
      `¿Deseas inscribirte en "${tdi.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Inscribirme",
          onPress: async () => {
            try {
              const res = await tdiApi.inscribirse(tdi.id);
              setInscripciones((prev) => ({
                ...prev,
                [tdi.id]: { inscripcionId: res.data.id, estado: "inscrito" },
              }));
              setModalDetalle(false);
              Alert.alert(
                "¡Listo! 🎉",
                "Te inscribiste correctamente. Recibirás un correo de confirmación.",
              );
            } catch (err: any) {
              console.log("Error al inscribirse:", err);
              if (err?.response?.status === 409) {
                Alert.alert(
                  "Ya estás inscrito",
                  "Ya tienes una inscripción en esta actividad.",
                );
              } else if (err?.response?.status === 400) {
                Alert.alert(
                  "Sin cupo",
                  err?.response?.data?.message ??
                    "No hay cupo disponible para esta actividad.",
                );
              } else {
                Alert.alert("Error", "No se pudo completar la inscripción.");
              }
            }
          },
        },
      ],
    );
  };

  // ── Evidencia ──────────────────────────────────────────────────────────────

  const abrirModalEvidencia = (tdi: TDI) => {
    setTdiSeleccionado(tdi);
    setNotaEvidencia("");
    setModalDetalle(false);
    setModalEvidencia(true);
  };

  const handleSubirEvidencia = async () => {
    if (!notaEvidencia.trim()) {
      Alert.alert("Campo requerido", "Agrega una descripción de tu evidencia.");
      return;
    }
    if (!tdiSeleccionado) return;

    const inscripcion = inscripciones[tdiSeleccionado.id];
    if (!inscripcion) {
      Alert.alert(
        "Error",
        "No se encontró tu inscripción para esta actividad.",
      );
      return;
    }

    setSubiendoEvidencia(true);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      // 👇 Fix: si el usuario cancela el picker, no se envía la evidencia.
      // Antes esto seguía adelante con evidenciaUrl = "" y marcaba como enviada.
      if (resultado.canceled) {
        setSubiendoEvidencia(false);
        return;
      }

      const accessToken = await AsyncStorage.getItem("googleAccessToken");
      if (!accessToken) {
        Alert.alert(
          "Sesión expirada",
          "Vuelve a iniciar sesión con Google para subir tu evidencia.",
        );
        setSubiendoEvidencia(false);
        return;
      }

      const archivo = resultado.assets[0];
      if (!archivo?.uri) {
        Alert.alert(
          "Archivo no disponible",
          "No se pudo leer el archivo seleccionado.",
        );
        setSubiendoEvidencia(false);
        return;
      }

      const evidenciaUrl = await subirEvidenciaDrive(
        archivo.uri,
        archivo.name ?? "evidencia",
      );

      await tdiApi.subirEvidencia(
        inscripcion.inscripcionId,
        evidenciaUrl,
        notaEvidencia,
      );

      setInscripciones((prev) => ({
        ...prev,
        [tdiSeleccionado.id]: {
          ...prev[tdiSeleccionado.id],
          estado: "evidencia_subida",
        },
      }));
      setModalEvidencia(false);
      setNotaEvidencia("");
      setTdiSeleccionado(null);
      Alert.alert("Enviado ✅", "Tu evidencia fue enviada para revisión.");
    } catch (err) {
      console.log("Error subiendo evidencia:", err);
      Alert.alert("Error", "No se pudo subir tu evidencia. Intenta de nuevo.");
    } finally {
      setSubiendoEvidencia(false);
    }
  };

  // ── Filtrado catálogo ──────────────────────────────────────────────────────

  const tdisFiltrados = tdis.filter((t) => {
    const matchEje = ejeActivo === "Todos" || t.eje === ejeActivo;
    const q = busqueda.toLowerCase();
    return (
      matchEje &&
      (!q ||
        t.nombre.toLowerCase().includes(q) ||
        t.eje.toLowerCase().includes(q))
    );
  });

  // ─── Campo reutilizable del formulario ───────────────────────────────────

  const Campo = ({
    label,
    campo,
    placeholder,
    multiline = false,
    keyboardType = "default",
  }: {
    label: string;
    campo: keyof typeof FORM_INICIAL;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: any;
  }) => (
    <View style={styles.campoGroup}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={[
          styles.campoInput,
          multiline && styles.campoTextarea,
          errores[campo] && styles.campoError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        value={form[campo]}
        onChangeText={(v) => setField(campo, v)}
      />
      {errores[campo] ? (
        <Text style={styles.errorText}>⚠ {errores[campo]}</Text>
      ) : null}
    </View>
  );

  // ─── Render card catálogo ────────────────────────────────────────────────

  const renderCardCatalogo = ({ item: tdi }: { item: TDI }) => {
    const color = EJE_COLORS[tdi.eje];
    const inscripcion = inscripciones[tdi.id];
    const estado = inscripcion?.estado;
    const lleno =
      tdi.cupoMaximo !== null && tdi.cupoActual >= tdi.cupoMaximo && !estado;

    return (
      <TouchableOpacity
        style={[styles.card, lleno && { opacity: 0.6 }]}
        onPress={() => {
          setTdiSeleccionado(tdi);
          setModalDetalle(true);
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{tdi.emoji ?? "🎯"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNombre} numberOfLines={2}>
                {tdi.nombre}
              </Text>
              <Text style={styles.cardEje}>{tdi.eje}</Text>
            </View>
            {estado === "inscrito" && (
              <View
                style={[styles.miniEstado, { backgroundColor: "#6C63FF22" }]}
              >
                <Text style={[styles.miniEstadoText, { color: "#6C63FF" }]}>
                  Inscrito
                </Text>
              </View>
            )}
            {estado === "evidencia_subida" && (
              <View
                style={[styles.miniEstado, { backgroundColor: "#10B98122" }]}
              >
                <Text style={[styles.miniEstadoText, { color: "#10B981" }]}>
                  ✅ Enviado
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: 2, marginBottom: 8 }}>
            <Text style={styles.metaItem}>📅 {tdi.fecha ?? "Por definir"}</Text>
            <Text style={styles.metaItem}>📍 {tdi.lugar ?? "Por definir"}</Text>
            <Text style={styles.metaItem}>
              ⏱ {tdi.horasRequeridas}h · 🏅 {tdi.tdisporGanar} TDI's
            </Text>
          </View>

          <CupoBar actual={tdi.cupoActual} maximo={tdi.cupoMaximo} />

          <View style={styles.cardFooter}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Badge label={NIVEL_LABELS[tdi.nivelDeImpacto]} color={color} />
              <Badge
                label={tdi.tipo === "interna" ? "Interna" : "Externa"}
                color={tdi.tipo === "interna" ? "#6C63FF" : "#F59E0B"}
              />
            </View>

            {estado === "evidencia_subida" ? (
              <View
                style={[styles.btnAccion, { backgroundColor: "#10B98122" }]}
              >
                <Text style={[styles.btnAccionText, { color: "#10B981" }]}>
                  En revisión
                </Text>
              </View>
            ) : estado === "inscrito" ? (
              <TouchableOpacity
                style={[styles.btnAccion, { backgroundColor: "#F59E0B" }]}
                onPress={() => abrirModalEvidencia(tdi)}
              >
                <Text style={styles.btnAccionText}>📤 Evidencia</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.btnAccion,
                  lleno && { backgroundColor: "#D1D5DB" },
                ]}
              >
                <Text style={styles.btnAccionText}>
                  {lleno ? "Sin cupo" : "Ver más"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render card solicitud propia ────────────────────────────────────────

  const renderCardSolicitud = ({ item: sol }: { item: SolicitudPropia }) => {
    const cfg = ESTADO_CONFIG[sol.estado];
    const ejeColor = EJE_COLORS[sol.eje] ?? "#6C63FF";
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSolicitudVista(sol);
          setModalDetalleSolicitud(true);
        }}
        activeOpacity={0.85}
      >
        <View style={[styles.cardAccent, { backgroundColor: ejeColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNombre} numberOfLines={2}>
                {sol.nombre_solicitud}
              </Text>
              <Text style={styles.cardEje}>{sol.eje}</Text>
            </View>
            <View style={[styles.miniEstado, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.miniEstadoText, { color: cfg.color }]}>
                {cfg.emoji} {sol.estado}
              </Text>
            </View>
          </View>

          <Text style={styles.metaItem}>🏢 {sol.persona_encargada}</Text>
          <Text style={styles.metaItem}>
            ⏱ {sol.horas_requeridas} horas · 📅 Enviada{" "}
            {new Date(sol.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── RENDER PRINCIPAL ────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Actividades TDI</Text>
          <Text style={styles.headerSub}>Desarrollo Integral · UTEQ</Text>
        </View>
        <TouchableOpacity
          style={styles.btnNuevaSolicitud}
          onPress={() => setModalFormulario(true)}
        >
          <Text style={styles.btnNuevaSolicitudText}>+ Proponer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ["catalogo", "🗂 Catálogo"],
            ["mis-solicitudes", "📋 Mis solicitudes"],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tabActivo === key && styles.tabActivo]}
            onPress={() => setTabActivo(key)}
          >
            <Text
              style={[
                styles.tabText,
                tabActivo === key && styles.tabTextActivo,
              ]}
            >
              {label}
            </Text>
            {key === "mis-solicitudes" &&
              solicitudes.filter((s) => s.estado === "Pendiente").length >
                0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {solicitudes.filter((s) => s.estado === "Pendiente").length}
                  </Text>
                </View>
              )}
          </TouchableOpacity>
        ))}
      </View>

      {tabActivo === "catalogo" && (
        <>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar actividades..."
              placeholderTextColor="#9CA3AF"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtrosScroll}
          >
            {(["Todos", ...EJES] as const).map((eje) => {
              const activo = ejeActivo === eje;
              const color =
                eje === "Todos" ? "#6C63FF" : EJE_COLORS[eje as EjeCategoria];
              return (
                <TouchableOpacity
                  key={eje}
                  style={[
                    styles.filtroChip,
                    activo && { backgroundColor: color },
                  ]}
                  onPress={() => setEjeActivo(eje as EjeCategoria | "Todos")}
                >
                  <Text
                    style={[styles.filtroText, activo && { color: "#fff" }]}
                  >
                    {eje}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FlatList
            data={tdisFiltrados}
            keyExtractor={(t) => t.id}
            renderItem={renderCardCatalogo}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            refreshing={cargandoCatalogo}
            onRefresh={cargarCatalogo}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔎</Text>
                <Text style={styles.emptyText}>
                  {cargandoCatalogo ? "Cargando..." : "Sin resultados"}
                </Text>
              </View>
            }
          />
        </>
      )}

      {tabActivo === "mis-solicitudes" && (
        <FlatList
          data={solicitudes}
          keyExtractor={(s) => s.id}
          renderItem={renderCardSolicitud}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshing={cargandoSolicitudes}
          onRefresh={cargarSolicitudes}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.btnProponerLarge}
              onPress={() => setModalFormulario(true)}
            >
              <Text style={styles.btnProponerLargeText}>
                + Proponer nueva actividad externa
              </Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>
                {cargandoSolicitudes
                  ? "Cargando..."
                  : "Aún no has enviado solicitudes"}
              </Text>
              <TouchableOpacity
                style={[styles.btnAccion, { marginTop: 16 }]}
                onPress={() => setModalFormulario(true)}
              >
                <Text style={styles.btnAccionText}>Proponer actividad</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* MODAL — Detalle TDI catálogo */}
      <Modal
        visible={modalDetalle}
        animationType="slide"
        transparent
        onRequestClose={() => setModalDetalle(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {tdiSeleccionado &&
              (() => {
                const color = EJE_COLORS[tdiSeleccionado.eje];
                const inscripcion = inscripciones[tdiSeleccionado.id];
                const estado = inscripcion?.estado;
                const lleno =
                  tdiSeleccionado.cupoMaximo !== null &&
                  tdiSeleccionado.cupoActual >= tdiSeleccionado.cupoMaximo &&
                  !estado;
                return (
                  <>
                    <View
                      style={[
                        styles.modalHeaderColor,
                        { backgroundColor: color },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setModalDetalle(false)}
                        style={styles.modalClose}
                      >
                        <Text style={styles.modalCloseText}>✕</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalEmoji}>
                        {tdiSeleccionado.emoji ?? "🎯"}
                      </Text>
                      <Text style={styles.modalTitulo}>
                        {tdiSeleccionado.nombre}
                      </Text>
                      <Text style={styles.modalEje}>{tdiSeleccionado.eje}</Text>
                    </View>

                    <ScrollView
                      style={styles.modalBody}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.statsRow}>
                        {[
                          {
                            num: `${tdiSeleccionado.horasRequeridas}h`,
                            lbl: "Duración",
                          },
                          {
                            num: `${tdiSeleccionado.tdisporGanar}`,
                            lbl: "TDI's",
                          },
                          {
                            num:
                              tdiSeleccionado.cupoMaximo !== null
                                ? `${tdiSeleccionado.cupoMaximo - tdiSeleccionado.cupoActual}`
                                : "∞",
                            lbl: "Cupos libres",
                          },
                        ].map((s) => (
                          <View key={s.lbl} style={styles.statBox}>
                            <Text style={styles.statNum}>{s.num}</Text>
                            <Text style={styles.statLbl}>{s.lbl}</Text>
                          </View>
                        ))}
                      </View>

                      {[
                        {
                          icono: "📅",
                          titulo: "Fecha y lugar",
                          texto: `${tdiSeleccionado.fecha ?? "Por definir"}\n${tdiSeleccionado.lugar ?? "Por definir"}`,
                        },
                        {
                          icono: "🎯",
                          titulo: "Competencias",
                          texto: tdiSeleccionado.competencias,
                        },
                        {
                          icono: "📎",
                          titulo: "Evidencias requeridas",
                          texto: tdiSeleccionado.evidencias,
                        },
                        {
                          icono: "💬",
                          titulo: "Observaciones",
                          texto: tdiSeleccionado.observaciones,
                        },
                      ].map((sec) => (
                        <View key={sec.titulo} style={styles.seccion}>
                          <Text style={styles.seccionTitulo}>
                            {sec.icono} {sec.titulo}
                          </Text>
                          <Text style={styles.seccionTexto}>{sec.texto}</Text>
                        </View>
                      ))}

                      <View style={styles.seccion}>
                        <Text style={styles.seccionTitulo}>👤 Encargado</Text>
                        <Text style={styles.seccionTexto}>
                          {tdiSeleccionado.personaEncargada}
                        </Text>
                        <Text style={styles.seccionSub}>
                          {tdiSeleccionado.puesto}
                        </Text>
                        <Text style={styles.seccionSub}>
                          ✉️ {tdiSeleccionado.correo}
                        </Text>
                        <Text style={styles.seccionSub}>
                          📞 {tdiSeleccionado.telefono}
                        </Text>
                      </View>

                      <CupoBar
                        actual={tdiSeleccionado.cupoActual}
                        maximo={tdiSeleccionado.cupoMaximo}
                      />

                      <View
                        style={{ paddingBottom: 30, paddingTop: 12, gap: 10 }}
                      >
                        {estado === "inscrito" ? (
                          <>
                            <View
                              style={[
                                styles.btnPrimario,
                                { backgroundColor: "#10B981" },
                              ]}
                            >
                              <Text style={styles.btnPrimarioText}>
                                ✅ Ya estás inscrito
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.btnPrimario,
                                { backgroundColor: "#F59E0B" },
                              ]}
                              onPress={() =>
                                abrirModalEvidencia(tdiSeleccionado)
                              }
                            >
                              <Text style={styles.btnPrimarioText}>
                                📤 Subir evidencia
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : estado === "evidencia_subida" ? (
                          <View
                            style={[
                              styles.btnPrimario,
                              { backgroundColor: "#10B981" },
                            ]}
                          >
                            <Text style={styles.btnPrimarioText}>
                              ✅ Evidencia en revisión
                            </Text>
                          </View>
                        ) : lleno ? (
                          <View
                            style={[
                              styles.btnPrimario,
                              { backgroundColor: "#D1D5DB" },
                            ]}
                          >
                            <Text style={styles.btnPrimarioText}>
                              Sin cupo disponible
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.btnPrimario}
                            onPress={() => handleInscribir(tdiSeleccionado)}
                          >
                            <Text style={styles.btnPrimarioText}>
                              🎯 Inscribirme
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </ScrollView>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>

      {/* MODAL — Subir evidencia */}
      <Modal
        visible={modalEvidencia}
        animationType="slide"
        transparent
        onRequestClose={() => setModalEvidencia(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: "80%" }]}>
              <View
                style={[
                  styles.modalHeaderColor,
                  { backgroundColor: "#F59E0B" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setModalEvidencia(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalEmoji}>📤</Text>
                <Text style={styles.modalTitulo}>Subir evidencia</Text>
                <Text style={styles.modalEje}>{tdiSeleccionado?.nombre}</Text>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.seccion}>
                  <Text style={styles.seccionTitulo}>
                    📎 Evidencias requeridas
                  </Text>
                  <Text style={styles.seccionTexto}>
                    {tdiSeleccionado?.evidencias}
                  </Text>
                </View>

                <View style={styles.uploadZone}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>
                    Se te pedirá el archivo al enviar
                  </Text>
                  <Text style={styles.uploadSub}>PDF o imagen</Text>
                </View>

                <View style={styles.campoGroup}>
                  <Text style={styles.campoLabel}>
                    📝 Descripción de tu evidencia
                  </Text>
                  <TextInput
                    style={[styles.campoInput, styles.campoTextarea]}
                    placeholder="Describe brevemente tu participación en la actividad..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={notaEvidencia}
                    onChangeText={setNotaEvidencia}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.btnPrimario,
                    { backgroundColor: "#F59E0B" },
                    subiendoEvidencia && { opacity: 0.7 },
                  ]}
                  onPress={handleSubirEvidencia}
                  disabled={subiendoEvidencia}
                >
                  <Text style={styles.btnPrimarioText}>
                    {subiendoEvidencia ? "Subiendo..." : "Enviar evidencia"}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL — Detalle solicitud propia */}
      <Modal
        visible={modalDetalleSolicitud}
        animationType="slide"
        transparent
        onRequestClose={() => setModalDetalleSolicitud(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {solicitudVista &&
              (() => {
                const cfg = ESTADO_CONFIG[solicitudVista.estado];
                const ejeColor = EJE_COLORS[solicitudVista.eje] ?? "#6C63FF";
                return (
                  <>
                    <View
                      style={[
                        styles.modalHeaderColor,
                        { backgroundColor: ejeColor },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setModalDetalleSolicitud(false)}
                        style={styles.modalClose}
                      >
                        <Text style={styles.modalCloseText}>✕</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalEmoji}>📋</Text>
                      <Text style={styles.modalTitulo}>
                        {solicitudVista.nombre_solicitud}
                      </Text>
                      <View
                        style={[styles.estadoPill, { backgroundColor: cfg.bg }]}
                      >
                        <Text
                          style={[styles.estadoPillText, { color: cfg.color }]}
                        >
                          {cfg.emoji} {solicitudVista.estado}
                        </Text>
                      </View>
                    </View>

                    <ScrollView
                      style={styles.modalBody}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.statsRow}>
                        {[
                          {
                            num: `${solicitudVista.horas_requeridas}h`,
                            lbl: "Horas",
                          },
                          { num: solicitudVista.eje.split(" ")[0], lbl: "Eje" },
                          {
                            num: new Date(
                              solicitudVista.created_at,
                            ).toLocaleDateString(),
                            lbl: "Enviada",
                          },
                        ].map((s) => (
                          <View key={s.lbl} style={styles.statBox}>
                            <Text style={[styles.statNum, { fontSize: 14 }]}>
                              {s.num}
                            </Text>
                            <Text style={styles.statLbl}>{s.lbl}</Text>
                          </View>
                        ))}
                      </View>

                      {[
                        {
                          icono: "👤",
                          titulo: "Contacto en la organización",
                          texto: `${solicitudVista.persona_encargada} · ${solicitudVista.puesto}\n✉️ ${solicitudVista.correo} · 📞 ${solicitudVista.telefono}`,
                        },
                        {
                          icono: "🎯",
                          titulo: "Competencias",
                          texto: solicitudVista.competencias,
                        },
                        {
                          icono: "📎",
                          titulo: "Evidencias mencionadas",
                          texto: solicitudVista.evidencias,
                        },
                        {
                          icono: "💬",
                          titulo: "Observaciones",
                          texto: solicitudVista.observaciones,
                        },
                      ]
                        .filter((s) => s.texto)
                        .map((sec) => (
                          <View key={sec.titulo} style={styles.seccion}>
                            <Text style={styles.seccionTitulo}>
                              {sec.icono} {sec.titulo}
                            </Text>
                            <Text style={styles.seccionTexto}>{sec.texto}</Text>
                          </View>
                        ))}

                      <View
                        style={[
                          styles.infoEstado,
                          { borderColor: cfg.color, backgroundColor: cfg.bg },
                        ]}
                      >
                        {solicitudVista.estado === "Pendiente" && (
                          <Text
                            style={[
                              styles.infoEstadoText,
                              { color: cfg.color },
                            ]}
                          >
                            ⏳ Tu solicitud está siendo revisada. Te avisaremos
                            por correo cuando haya respuesta.
                          </Text>
                        )}
                        {solicitudVista.estado === "Aprobada" && (
                          <Text
                            style={[
                              styles.infoEstadoText,
                              { color: cfg.color },
                            ]}
                          >
                            🎉 ¡Aprobada! Ya aparece en el catálogo como
                            actividad externa. Búscala e inscríbete para subir
                            tu evidencia.
                          </Text>
                        )}
                        {solicitudVista.estado === "Rechazada" && (
                          <Text
                            style={[
                              styles.infoEstadoText,
                              { color: cfg.color },
                            ]}
                          >
                            ❌ No fue aprobada. Considera volver a intentarlo
                            con los ajustes sugeridos.
                          </Text>
                        )}
                      </View>

                      <View style={{ height: 30 }} />
                    </ScrollView>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>

      {/* MODAL — Formulario nueva solicitud */}
      <Modal
        visible={modalFormulario}
        animationType="slide"
        transparent
        onRequestClose={() => setModalFormulario(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: "95%" }]}>
              <View
                style={[
                  styles.modalHeaderColor,
                  { backgroundColor: "#6C63FF" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setModalFormulario(false)}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalEmoji}>📝</Text>
                <Text style={styles.modalTitulo}>
                  Proponer actividad externa
                </Text>
                <Text style={styles.modalEje}>
                  El equipo TDI revisará tu propuesta
                </Text>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.avisoBox}>
                  <Text style={styles.avisoText}>
                    💡 Una vez aprobada, tu actividad aparecerá en el catálogo
                    como <Text style={{ fontWeight: "700" }}>externa</Text> y
                    otros compañeros podrán inscribirse formalmente.
                  </Text>
                </View>

                <Campo
                  campo="matricula"
                  label="Tu matrícula *"
                  placeholder="Ej. 21040123"
                />
                <Campo
                  campo="nombreSolicitud"
                  label="Nombre de la actividad *"
                  placeholder="Ej. Voluntariado en banco de alimentos"
                />

                <View style={styles.campoGroup}>
                  <Text style={styles.campoLabel}>Eje TDI *</Text>
                  <View style={styles.ejeSelector}>
                    {EJES.map((eje) => {
                      const sel = form.eje === eje;
                      const color = EJE_COLORS[eje];
                      return (
                        <TouchableOpacity
                          key={eje}
                          style={[
                            styles.ejeOpcion,
                            sel && {
                              backgroundColor: color,
                              borderColor: color,
                            },
                          ]}
                          onPress={() => setField("eje", eje)}
                        >
                          <Text
                            style={[
                              styles.ejeOpcionText,
                              sel && { color: "#fff" },
                            ]}
                            numberOfLines={2}
                          >
                            {eje}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errores.eje ? (
                    <Text style={styles.errorText}>⚠ {errores.eje}</Text>
                  ) : null}
                </View>

                <Campo
                  campo="horasRealizadas"
                  label="Horas realizadas *"
                  placeholder="Ej. 8"
                  keyboardType="numeric"
                />
                <Campo
                  campo="descripcion"
                  label="Descripción de la actividad *"
                  placeholder="¿En qué consistió? ¿Qué hiciste?"
                  multiline
                />

                <View style={styles.avisoBox}>
                  <Text style={styles.avisoText}>
                    📇 Datos de la persona que puede confirmar tu participación
                    (supervisor, coordinador, etc.)
                  </Text>
                </View>

                <Campo
                  campo="personaEncargada"
                  label="Nombre del encargado/a *"
                  placeholder="Ej. María López"
                />
                <Campo
                  campo="puesto"
                  label="Puesto *"
                  placeholder="Ej. Coordinadora de voluntariado"
                />
                <Campo
                  campo="telefono"
                  label="Teléfono de contacto *"
                  placeholder="Ej. 4421234567"
                  keyboardType="phone-pad"
                />
                <Campo
                  campo="extension"
                  label="Extensión (opcional)"
                  placeholder="Ej. 102"
                  keyboardType="numeric"
                />
                <Campo
                  campo="correo"
                  label="Correo de contacto *"
                  placeholder="contacto@organizacion.mx"
                  keyboardType="email-address"
                />

                <Campo
                  campo="competencias"
                  label="Competencias desarrolladas *"
                  placeholder="Trabajo en equipo, liderazgo..."
                  multiline
                />
                <Campo
                  campo="evidencias"
                  label="Evidencias que puedes presentar *"
                  placeholder="Fotos, carta, certificado..."
                  multiline
                />
                <Campo
                  campo="observaciones"
                  label="Observaciones adicionales"
                  placeholder="Cualquier dato relevante..."
                  multiline
                />

                <TouchableOpacity
                  style={[styles.btnPrimario, enviando && { opacity: 0.7 }]}
                  onPress={handleEnviarSolicitud}
                  disabled={enviando}
                >
                  <Text style={styles.btnPrimarioText}>
                    {enviando ? "Enviando..." : "📤 Enviar solicitud"}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1E1B4B" },
  headerSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  btnNuevaSolicitud: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  btnNuevaSolicitudText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabActivo: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActivo: { color: "#1E1B4B" },
  tabBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: "#1F2937" },
  filtrosScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  filtroChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  filtroText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  lista: { paddingHorizontal: 20, paddingBottom: 30 },
  btnProponerLarge: {
    borderWidth: 2,
    borderColor: "#6C63FF",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F5F3FF",
  },
  btnProponerLargeText: { color: "#6C63FF", fontWeight: "700", fontSize: 15 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardAccent: { width: 6 },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardEmoji: { fontSize: 28, marginRight: 10, marginTop: 2 },
  cardNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E1B4B",
    lineHeight: 21,
    flex: 1,
  },
  cardEje: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  miniEstado: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  miniEstadoText: { fontSize: 11, fontWeight: "700" },
  metaItem: { fontSize: 12, color: "#4B5563", marginBottom: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  btnAccion: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnAccionText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cupoContainer: { marginVertical: 6 },
  cupoBarBg: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  cupoBarFill: { height: "100%", borderRadius: 3 },
  cupoText: { fontSize: 11, color: "#6B7280" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    overflow: "hidden",
  },
  modalHeaderColor: { padding: 24, paddingTop: 20, alignItems: "center" },
  modalClose: { position: "absolute", top: 16, right: 20 },
  modalCloseText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalEmoji: { fontSize: 44, marginBottom: 8 },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  modalEje: {
    fontSize: 13,
    color: "#ffffffcc",
    marginTop: 4,
    textAlign: "center",
  },
  modalBody: { padding: 20 },
  estadoPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoPillText: { fontSize: 14, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F9FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statBox: { alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#1E1B4B" },
  statLbl: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  seccion: { marginBottom: 16 },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E1B4B",
    marginBottom: 6,
  },
  seccionTexto: { fontSize: 14, color: "#4B5563", lineHeight: 21 },
  seccionSub: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  infoEstado: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  infoEstadoText: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  btnPrimario: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  btnPrimarioText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  uploadZone: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F8F9FF",
  },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  uploadSub: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  avisoBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#6C63FF",
  },
  avisoText: { fontSize: 13, color: "#4338CA", lineHeight: 19 },
  campoGroup: { marginBottom: 16 },
  campoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  campoInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  campoTextarea: { minHeight: 80, textAlignVertical: "top" },
  campoError: { borderColor: "#EF4444", backgroundColor: "#FFF1F2" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  ejeSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ejeOpcion: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    width: "47%",
  },
  ejeOpcionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
  },
});
