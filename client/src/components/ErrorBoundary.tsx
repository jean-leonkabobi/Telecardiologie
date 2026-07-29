import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Component, type ReactNode } from 'react';

import { InfoPanel } from '@/components/common/InfoPanel';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={3} sx={{ width: '100%', maxWidth: 720 }}>
            {/*
              Écran de repli après un plantage de rendu : c'est la page
              entière, pas une notification. Une popup SweetAlert2 par-dessus
              un écran vide n'apporterait rien et masquerait la trace.
            */}
            <InfoPanel tone="error" title="Une erreur inattendue est survenue">
              {this.state.error?.message}
            </InfoPanel>

            {this.state.error?.stack && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'surfaceMuted', maxHeight: 320, overflow: 'auto' }}>
                <Typography
                  component="pre"
                  variant="caption"
                  sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', m: 0 }}
                >
                  {this.state.error.stack}
                </Typography>
              </Paper>
            )}

            <Box>
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
                Recharger la page
              </Button>
            </Box>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
