import api from "@/services/api"; // el mismo axios instance que ya usas

export const tdiApi = {
  getCatalogo: () => api.get("/tdis"),

  getMisInscripciones: () => api.get("/inscripciones-tdi/mias"),

  inscribirse: (tdiId: string) => api.post("/inscripciones-tdi", { tdiId }),

  subirEvidencia: (inscripcionId: string, evidenciaUrl: string, nota: string) =>
    api.patch(`/inscripciones-tdi/${inscripcionId}/evidencia`, {
      evidenciaUrl,
      nota,
    }),

  getMisSolicitudes: () => api.get("/solicitudes-validacion/mias"),

  crearSolicitud: (data: any) => api.post("/solicitudes-validacion", data),
};
