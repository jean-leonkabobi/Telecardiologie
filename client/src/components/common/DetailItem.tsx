import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  value: ReactNode;
}

/** Couple libellé / valeur, motif répété dans les pages de détail. */
export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default DetailItem;
