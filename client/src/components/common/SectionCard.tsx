import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: ReactNode;
  subheader?: ReactNode;
  /** Bouton ou menu affiché dans l'en-tête de la carte. */
  action?: ReactNode;
  children: ReactNode;
  /** Retire le padding du contenu (utile pour un tableau pleine largeur). */
  disableContentPadding?: boolean;
  sx?: SxProps<Theme>;
}

/** Carte de section : en-tête optionnel + contenu. */
export function SectionCard({
  title,
  subheader,
  action,
  children,
  disableContentPadding = false,
  sx,
}: SectionCardProps) {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
      {(title || action) && <CardHeader title={title} subheader={subheader} action={action} />}
      <CardContent
        sx={{
          flexGrow: 1,
          ...(disableContentPadding && { p: 0, '&:last-child': { pb: 0 } }),
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export default SectionCard;
