import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type {
  AppNotification,
  AuditEntry,
  AuditIntegrity,
  Availability,
  EcgRequestDetail,
  EcgRequestFullDetail,
  EcgRequestSummary,
  EcgWaveformResponse,
  ManagedUser,
  QueueItem,
  ReviewAction,
  Statistics,
} from './types';

/**
 * Accès aux données de l'API.
 *
 * Les clés de cache suivent une hiérarchie stable : invalider `['ecg-requests']`
 * rafraîchit d'un coup les listes, la file et les détails, ce qui évite d'avoir
 * à énumérer les écrans concernés après chaque mutation.
 */
export const queryKeys = {
  ecgRequests: ['ecg-requests'] as const,
  ecgRequestList: (status?: string, limit?: number) =>
    ['ecg-requests', 'list', status ?? 'all', limit ?? 'illimite'] as const,
  ecgRequest: (id: string) => ['ecg-requests', 'detail', id] as const,
  ecgWaveform: (id: string) => ['ecg-requests', 'waveform', id] as const,
  ecgDocument: (id: string) => ['ecg-requests', 'document', id] as const,
  queue: ['ecg-requests', 'queue'] as const,
  history: ['ecg-requests', 'history'] as const,
  notifications: ['notifications'] as const,
  availability: ['availability'] as const,
  statistics: ['statistics'] as const,
  users: ['users'] as const,
  audit: ['audit'] as const,
  auditIntegrity: ['audit', 'integrity'] as const,
};

// --- Demandes ECG ------------------------------------------------------------

export function useEcgRequests(options: { status?: string; limit?: number } = {}) {
  const { status, limit } = options;

  return useQuery({
    queryKey: queryKeys.ecgRequestList(status, limit),
    queryFn: () => {
      // `URLSearchParams` plutôt qu'une interpolation : une valeur contenant un
      // `&` casserait silencieusement la requête.
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (limit) params.set('limit', String(limit));
      const suffix = params.size > 0 ? `?${params.toString()}` : '';

      return api
        .get<{ requests: EcgRequestSummary[] }>(`/ecg-requests${suffix}`)
        .then((r) => r.requests);
    },
  });
}

export function useEcgRequest(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ecgRequest(id ?? ''),
    queryFn: () => api.get<{ request: EcgRequestFullDetail }>(`/ecg-requests/${id}`).then((r) => r.request),
    enabled: Boolean(id),
    /**
     * Une demande en cours d'analyse change d'état toute seule : on interroge
     * régulièrement tant qu'elle n'est pas stabilisée, puis on arrête.
     */
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING_ANALYSIS' || status === 'ANALYZING' ? 3000 : false;
    },
  });
}

/**
 * Signal décodé du tracé.
 *
 * Requête distincte du détail : la charge est bien plus lourde (dizaines de
 * milliers d'échantillons) et le résultat ne change jamais — le fichier d'origine
 * est immuable. D'où un cache sans péremption.
 */
export function useEcgWaveform(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ecgWaveform(id ?? ''),
    queryFn: () => api.get<EcgWaveformResponse>(`/ecg-requests/${id}/waveform`),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: queryKeys.queue,
    queryFn: () => api.get<{ requests: QueueItem[] }>('/ecg-requests/queue').then((r) => r.requests),
    // La file bouge sous l'effet des autres cardiologues.
    refetchInterval: 15_000,
  });
}

export function useCardiologistHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: () =>
      api.get<{ requests: EcgRequestSummary[] }>('/ecg-requests/history').then((r) => r.requests),
  });
}

export interface SubmitEcgRequestPayload {
  /**
   * Facultatif : le serveur dérive l'identifiant de l'identité du patient.
   *
   * Le formulaire ne le demande plus. Le champ reste dans le contrat pour qu'une
   * intégration avec un dossier patient existant puisse transmettre son IPP, qui
   * fait alors foi.
   */
  patientRef?: string;
  patientFirstName: string;
  patientLastName: string;
  /** Format ISO `YYYY-MM-DD`. */
  patientBirthDate: string;
  patientGender: 'M' | 'F';
  symptoms: string;
  clinicalContext?: string;
  medicalHistory?: string;
  additionalComments?: string;
  priority: 'normal' | 'urgent';
  file: File;
}

export function useSubmitEcgRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitEcgRequestPayload) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (key === 'file' || value === undefined || value === '') continue;
        form.append(key, String(value));
      }
      form.append('file', payload.file);

      return api
        .upload<{ request: EcgRequestDetail }>('/ecg-requests', form)
        .then((r) => r.request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useClaimEcgRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ request: EcgRequestDetail }>(`/ecg-requests/${id}/claim`).then((r) => r.request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
    },
  });
}

export function useReleaseEcgRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/ecg-requests/${id}/release`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
    },
  });
}

export interface ReviewPayload {
  id: string;
  decision: ReviewAction;
  comment?: string;
  finalDiagnosis?: string;
}

export function useReviewEcgRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: ReviewPayload) =>
      api
        .post<{ request: EcgRequestDetail }>(`/ecg-requests/${id}/review`, body)
        .then((r) => r.request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
    },
  });
}

/**
 * Relance une analyse en échec. Réservé à l'administrateur.
 *
 * Sans cet appel, une demande en `ANALYSIS_FAILED` restait examinable mais son
 * analyse ne pouvait plus jamais être retentée depuis l'interface.
 */
export function useRetryEcgAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/ecg-requests/${id}/retry-analysis`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
    },
  });
}

export interface RequestExternalReviewPayload {
  id: string;
  /** Obligatoire : une ouverture hors structure doit se justifier. */
  reason: string;
}

/**
 * Ouvre une demande aux cardiologues hors de la structure.
 *
 * Irréversible côté serveur : on ne peut pas désapprendre ce qui a été lu.
 */
export function useRequestExternalReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: RequestExternalReviewPayload) =>
      api
        .post<{ request: EcgRequestDetail }>(`/ecg-requests/${id}/request-external-review`, {
          reason,
        })
        .then((r) => r.request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ecgRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/**
 * Compte rendu PDF de l'examen.
 *
 * Passe par `fetch` et non par `apiClient` : la réponse est binaire, pas du JSON.
 * L'objet URL local est révoqué par l'appelant après le déclenchement du
 * téléchargement, sinon le blob resterait en mémoire jusqu'au rechargement.
 */
export function useEcgReport() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await api.download(`/ecg-requests/${id}/report`);
      return { url: URL.createObjectURL(blob.body), fileName: blob.fileName };
    },
  });
}

/**
 * Document d'origine, relayé par l'API pour être affiché dans l'application.
 *
 * Le corps traverse l'API au lieu d'être chargé depuis une URL signée : le
 * document arrive ainsi sur notre propre origine, ce qui évite de dépendre des
 * en-têtes du stockage et de laisser une signature valide dans le DOM.
 *
 * `enabled` diffère la requête : un tracé peut peser plusieurs mégaoctets, on ne
 * le télécharge que lorsque le soignant demande à le voir.
 *
 * Le blob est renvoyé tel quel, sans objet URL. Une URL créée ici serait mise en
 * cache par react-query et ne pourrait plus être révoquée au bon moment — c'est
 * au composant qui l'affiche de la créer et de la libérer.
 */
export function useEcgDocument(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.ecgDocument(id ?? ''),
    queryFn: () => api.download(`/ecg-requests/${id}/file/content`),
    enabled: Boolean(id) && enabled,
    // Le fichier d'origine est immuable : rien ne justifie de le retélécharger.
    staleTime: Infinity,
    // Mais on ne garde pas des mégaoctets en mémoire indéfiniment après la
    // fermeture de l'écran.
    gcTime: 5 * 60_000,
  });
}

/** URL temporaire du tracé. Non mise en cache : elle expire. */
export function useEcgFileUrl() {
  return useMutation({
    mutationFn: (id: string) =>
      api.get<{ url: string; fileName: string; expiresAt: string }>(`/ecg-requests/${id}/file`),
  });
}

// --- Notifications -----------------------------------------------------------

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () =>
      api.get<{ notifications: AppNotification[]; unreadCount: number }>('/notifications'),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<unknown>(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ updated: number }>('/notifications/read-all'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/notifications/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

// --- Disponibilité -----------------------------------------------------------

export function useAvailability() {
  return useQuery({
    queryKey: queryKeys.availability,
    queryFn: () => api.get<Availability>('/availability'),
  });
}

export function useSaveAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      status: string;
      slots: { dayOfWeek: number; startMinute: number; endMinute: number; enabled: boolean }[];
    }) => api.post<Availability>('/availability', body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.availability }),
  });
}

// --- Administration ----------------------------------------------------------

export function useStatistics() {
  return useQuery({ queryKey: queryKeys.statistics, queryFn: () => api.get<Statistics>('/statistics') });
}

export function useAuditLog() {
  return useQuery({
    queryKey: queryKeys.audit,
    queryFn: () => api.get<{ entries: AuditEntry[] }>('/audit').then((r) => r.entries),
  });
}

/** Vérifie la chaîne de scellement du journal d'audit. */
export function useAuditIntegrity() {
  return useQuery({
    queryKey: queryKeys.auditIntegrity,
    queryFn: () => api.get<AuditIntegrity>('/audit/integrity'),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api.get<{ users: ManagedUser[] }>('/users').then((r) => r.users),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; firstName: string; lastName: string; role: string }) =>
      api.post<{ user: ManagedUser }>('/users', body).then((r) => r.user),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export interface UpdateUserPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserPayload) =>
      api.patch<{ user: ManagedUser }>(`/users/${id}`, body).then((r) => r.user),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/users/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
