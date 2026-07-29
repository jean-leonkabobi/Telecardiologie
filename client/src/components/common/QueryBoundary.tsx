import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { ReactNode } from 'react';

import { ApiError } from '@/lib/apiClient';
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
      <Stack sx={{ alignItems: 'center', py: 6 }} spacing={2}>
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
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}

export default QueryBoundary;
