import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import type { ReactNode } from 'react';

export type PanelTone = 'info' | 'success' | 'warning' | 'error';

const TONE_ICON = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
} as const;

interface InfoPanelProps {
  tone?: PanelTone;
  title?: ReactNode;
  children: ReactNode;
  /** Retire l'icône lorsque le panneau porte surtout du contenu structuré. */
  hideIcon?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Panneau contextuel intégré à la page.
 *
 * À ne pas confondre avec une alerte : les retours d'action — succès,
 * avertissement, erreur — passent tous par SweetAlert2 (`@/lib/alerts`). Ce
 * composant sert au contenu **permanent** de la page : interprétation de l'IA,
 * conseils d'usage, résultat d'un examen, rappel de format.
 *
 * Il ne réutilise volontairement pas `<Alert>` de MUI : en réservant l'aspect
 * « alerte » aux notifications SweetAlert2, on évite qu'un bloc de contenu soit
 * pris pour un message à acquitter.
 */
export function InfoPanel({ tone = 'info', title, children, hideIcon = false, sx }: InfoPanelProps) {
  const Icon = TONE_ICON[tone];

  return (
    <Paper
      variant="outlined"
      sx={[
        (theme) => ({
          p: 2,
          borderColor: alpha(theme.palette[tone].main, 0.35),
          backgroundColor: alpha(theme.palette[tone].main, theme.palette.mode === 'dark' ? 0.12 : 0.05),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        {!hideIcon && (
          <Box sx={{ color: `${tone}.main`, display: 'flex', mt: '1px' }}>
            <Icon fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          {title && (
            <Typography variant="subtitle2" sx={{ fontWeight: 650, mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {typeof children === 'string' ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {children}
            </Typography>
          ) : (
            children
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default InfoPanel;
