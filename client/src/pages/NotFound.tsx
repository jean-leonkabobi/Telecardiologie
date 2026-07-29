import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ py: 5 }}>
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />

            <Typography variant="h1" component="p" sx={{ fontSize: '2.5rem' }}>
              404
            </Typography>

            <Typography variant="h2" component="h1">
              Page introuvable
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              La page que vous recherchez n'existe pas.
              <br />
              Elle a peut-être été déplacée ou supprimée.
            </Typography>

            <Box sx={{ pt: 2 }}>
              <Button variant="contained" startIcon={<HomeIcon />} onClick={() => setLocation('/')}>
                Retour à l'accueil
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
