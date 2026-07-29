import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type {
  AppNotification,
  AuditEntry,
  Availability,
  EcgRequestDetail,
  EcgRequestFullDetail,
  EcgRequestSummary,
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
  queue: ['ecg-requests', 'queue'] as const,
  history: ['ecg-requests', 'history'] as const,
  notifications: ['notifications'] as const,
  availability: ['availability'] as const,
  statistics: ['statistics'] as const,
  users: ['users'] as const,
  audit: ['audit'] as const,
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
  patientRef: string;
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
