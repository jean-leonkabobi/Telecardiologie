import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { ReactNode } from 'react';

import { ApiError } from '@/lib/apiClient';
import { EmptyState } from './EmptyState';
import { InfoPanel } from './InfoPanel';

interface QueryBoundaryProps {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  /** Message affiché quand la requête réussit mais ne renvoie rien. */
  emptyMessage?: string;
  isEmpty?: boolean;
  children: ReactNode;
}

/**
 * Enveloppe les trois états d'une requête : chargement, erreur, vide.
 *
 * Sans ce composant, chaque écran réinventerait son propre `if (isLoading)` —
 * et l'erreur finirait par être ignorée quelque part.
 */
export function QueryBoundary({
  isLoading,
  error,
  onRetry,
  emptyMessage,
  isEmpty = false,
  children,
}: QueryBoundaryProps) {
  if (isLoading) {
    return (
      <Stack
        spacing={2}
        // `minHeight` réserve la place du contenu à venir. Sans elle, la page se
        // contractait autour du seul indicateur puis se dépliait d'un coup : les
        // boutons de l'en-tête sautaient sous le curseur au moment du clic.
        sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 320 }}
        // Annonce l'arrivée du contenu aux lecteurs d'écran, sans interrompre.
        aria-busy="true"
        aria-live="polite"
      >
        <CircularProgress aria-label="Chargement des données" />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Chargement…
        </Typography>
      </Stack>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Une erreur est survenue lors du chargement des données.';

    return (
      <InfoPanel tone="error" title="Chargement impossible">
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2">{message}</Typography>
          {onRetry && (
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry}>
              Réessayer
            </Button>
          )}
        </Stack>
      </InfoPanel>
    );
  }

  if (isEmpty && emptyMessage) {
    // Le même bloc que partout ailleurs dans l'application. Cet écran affichait
    // une simple ligne de texte grise, là où les autres écrans vides présentent
    // une icône et un titre : deux réponses différentes à la même situation.
    return <EmptyState title="Aucune donnée" description={emptyMessage} />;
  }

  return <>{children}</>;
}

export default QueryBoundary;
