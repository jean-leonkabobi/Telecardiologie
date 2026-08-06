import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import { useLocation } from "wouter";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Écran d'adresse inconnue — **et** d'écran interdit à un rôle.
 *
 * Les routes de `App.tsx` rendent ce composant quand le rôle ne correspond pas :
 * un professionnel qui ouvre `/queue` arrive ici. La version précédente occupait
 * alors tout l'écran, hors de la coquille : l'utilisateur perdait le menu, la
 * cloche et son compte, avec un seul bouton pour s'en sortir. Et le message
 * affirmait que la page n'existait pas, alors qu'elle existe — elle n'est
 * simplement pas la sienne.
 *
 * `DashboardLayout` rend ses enfants tels quels lorsqu'aucune session n'est
 * ouverte : l'envelopper sans condition couvre donc les deux cas, y compris une
 * adresse inconnue saisie avant toute connexion.
 */
export default function NotFound() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Box
        sx={{
          // Hors session, l'écran est seul et se centre sur la fenêtre. Dans la
          // coquille, la barre et le menu occupent déjà leur place : garder
          // `100vh` ferait déborder la page de la hauteur de la barre.
          minHeight: user ? "60vh" : "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card sx={{ width: "100%", maxWidth: 520 }}>
          <CardContent sx={{ py: 5 }}>
            <Stack
              spacing={2}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main" }} />

              <Typography
                variant="h1"
                component="p"
                sx={{ fontSize: "2.5rem" }}
              >
                404
              </Typography>

              <Typography variant="h2" component="h1">
                Page introuvable
              </Typography>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {user ? (
                  <>
                    Cette adresse n'existe pas, ou n'est pas accessible avec
                    votre profil.
                    <br />
                    Les écrans qui vous sont destinés figurent dans le menu.
                  </>
                ) : (
                  <>
                    La page que vous recherchez n'existe pas.
                    <br />
                    Elle a peut-être été déplacée ou supprimée.
                  </>
                )}
              </Typography>

              <Box sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<HomeIcon />}
                  onClick={() => setLocation("/")}
                >
                  {user ? "Retour au tableau de bord" : "Retour à l'accueil"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
