import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { ReactNode } from 'react';

export type StatColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary';

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Variation affichée sous la valeur, ex. « +12% ». */
  change?: string;
  /** Sens de la variation. `neutral` par défaut. */
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  color?: StatColor;
}

const trendIcon = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
  neutral: TrendingFlatIcon,
} as const;

/** Tuile d'indicateur : libellé, valeur, variation et icône. */
export function StatCard({ label, value, change, trend = 'neutral', icon, color = 'primary' }: StatCardProps) {
  const TrendIcon = trendIcon[trend];
  const trendColor = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              {label}
            </Typography>
            <Typography variant="h2" sx={{ color: `${color}.main` }}>
              {value}
            </Typography>
            {change && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: trendColor }}>
                <TrendIcon fontSize="inherit" />
                <Typography variant="caption">{change}</Typography>
              </Stack>
            )}
          </Stack>
          {icon && (
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: `${color}.main`,
                color: `${color}.contrastText`,
                width: 44,
                height: 44,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default StatCard;
