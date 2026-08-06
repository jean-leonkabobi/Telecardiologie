/**
 * Client HTTP de l'API.
 *
 * Deux responsabilités que les écrans n'ont plus à porter :
 * - le renouvellement transparent de l'access token sur 401, avec une seule
 *   requête de rafraîchissement même si plusieurs appels échouent en même temps ;
 * - la conversion des réponses d'erreur en `ApiError`, qui expose le code et
 *   l'éventuel champ fautif pour un affichage au bon endroit du formulaire.
 *
 * L'access token vit en mémoire seulement : le stocker dans `localStorage`
 * l'exposerait à toute faille XSS. Le refresh token, lui, est un cookie
 * httpOnly géré par le serveur.
 */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, string>;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: string,
    readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Vrai quand l'appel a échoué faute de réseau, pas à cause du serveur. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/**
 * Racine de l'API.
 *
 * Vide par défaut : les appels sont relatifs (`/api/…`), donc servis par la même
 * origine — en développement via le proxy Vite, en production par Express qui
 * sert aussi le frontend. C'est ce qui garantit que le cookie de session est
 * transmis sans configuration CORS particulière.
 *
 * `VITE_API_BASE_URL` permet de viser une API sur une autre origine (backend
 * distant, environnement de recette). Cette origine doit alors figurer dans
 * `CORS_ORIGINS` côté serveur.
 */
const API_BASE = `${(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")}/api`;

let accessToken: string | null = null;
/** Rafraîchissement en cours, partagé par tous les appels concurrents. */
let refreshPromise: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Prévient l'application que la session est définitivement perdue. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> = {};
  let isJson = false;

  try {
    body = (await response.json()) as ApiErrorBody;
    isJson = true;
  } catch {
    // Réponse non-JSON : proxy mal configuré, page d'erreur HTML, autre serveur.
  }

  // Une route de l'API qui répond 404 sans notre format d'erreur signifie que
  // la requête n'a pas atteint cette API : proxy absent, ou un autre service
  // écoute sur le port visé. Le message générique masquerait la vraie cause.
  if (response.status === 404 && !body.error) {
    return new ApiError(
      404,
      "API_UNREACHABLE",
      import.meta.env.DEV
        ? "L'API n'a pas répondu sur cette adresse. Vérifiez que le serveur est démarré " +
            "(`npm run dev:server`) et qu’aucun autre service n’occupe son port."
        : "Service momentanément indisponible. Veuillez réessayer."
    );
  }

  return new ApiError(
    response.status,
    body.error?.code ?? (isJson ? "UNKNOWN" : "UNEXPECTED_RESPONSE"),
    body.error?.message ?? "Une erreur est survenue. Veuillez réessayer.",
    body.error?.field,
    body.error?.details
  );
}

async function refreshSession(): Promise<boolean> {
  // Un seul appel de rafraîchissement, quel que soit le nombre de 401 simultanés.
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) return false;

      const data = (await response.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Corps `multipart/form-data`, exclusif de `body`. */
  formData?: FormData;
  /** Empêche la tentative de rafraîchissement (utilisé par /auth/refresh lui-même). */
  skipRefresh?: boolean;
  /** Lit le corps comme un blob au lieu de le décoder en JSON. */
  binary?: boolean;
}

/** Réponse binaire : le corps est le document, pas une enveloppe JSON. */
export interface BinaryResponse {
  body: Blob;
  fileName: string;
}

/**
 * Nom de fichier tiré de l'en-tête `Content-Disposition`.
 *
 * La forme `filename*` en UTF-8 primait la forme ASCII quand les deux sont
 * présentes — c'est ce que le serveur envoie pour les noms accentués.
 */
function fileNameFromDisposition(
  header: string | null,
  defaut: string
): string {
  if (!header) return defaut;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      // En-tête mal formé : on retombe sur la forme ASCII plutôt que d'échouer.
    }
  }

  return /filename="?([^\";]+)"?/i.exec(header)?.[1]?.trim() ?? defaut;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {};

    // Avec `FormData`, on **ne pose pas** `Content-Type` : seul le navigateur
    // connaît la frontière (`boundary`) qu'il vient de générer. La renseigner à
    // la main produit un corps que le serveur ne sait pas découper.
    if (options.formData === undefined && options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    return fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body:
        options.formData ??
        (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
  };

  let response: Response;
  try {
    response = await send();
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Impossible de joindre le serveur. Vérifiez votre connexion."
    );
  }

  // Jeton expiré : on tente un renouvellement puis on rejoue une seule fois.
  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      try {
        response = await send();
      } catch {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Impossible de joindre le serveur."
        );
      }
    } else if (accessToken) {
      // On n'avertit que si une session existait : un 401 sur la page de
      // connexion est normal et ne doit pas déclencher de message.
      accessToken = null;
      onSessionExpired?.();
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (options.binary) {
    return {
      body: await response.blob(),
      fileName: fileNameFromDisposition(
        response.headers.get("Content-Disposition"),
        "document.pdf"
      ),
    } as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(
    path: string,
    body?: unknown,
    options?: { skipRefresh?: boolean }
  ) =>
    request<T>(path, {
      method: "POST",
      body,
      skipRefresh: options?.skipRefresh,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /** Envoi de fichier. Le rafraîchissement de jeton s'applique aussi ici. */
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", formData }),
  /**
   * Téléchargement d'un document généré par l'API.
   *
   * Passe par la même mécanique que les autres appels — jeton porté, 401
   * rejoué après rafraîchissement — ce qu'un `window.open` sur l'URL ne
   * permettrait pas : le navigateur n'y joindrait aucun en-tête d'autorisation.
   */
  download: (path: string) => request<BinaryResponse>(path, { binary: true }),
};
