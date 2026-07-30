import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect, useMemo, useState } from 'react';

import { useEcgDocument } from '@/api/hooks';
import { ApiError } from '@/lib/apiClient';

/**
 * Au-delà, l'affichage attend un geste explicite.
 *
 * Un tracé de plusieurs mégaoctets sur une connexion d'hôpital fait patienter
 * sans prévenir. En deçà, l'affichage immédiat est le bon comportement : le
 * soignant vient sur cet écran précisément pour regarder le tracé.
 */
const CHARGEMENT_AUTOMATIQUE_MAX = 4 * 1024 * 1024;

/** Ce que le navigateur sait afficher, et par quel moyen. */
type Rendu = 'pdf' | 'image' | 'texte' | 'aucun';

function renduPour(mimeType: string): Rendu {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png' || mimeType === 'image/jpeg') return 'image';
  /**
   * XML, texte et CSV sont affichés **comme du texte**, jamais dans un cadre.
   *
   * Un document chargé dans un `<iframe>` s'exécute dans notre origine, même
   * depuis une URL `blob:`. Un fichier XML déposé par un tiers pourrait alors
   * atteindre la session du soignant. Le décoder et l'afficher dans un `<pre>`
   * — que React échappe — supprime la question au lieu de la contenir.
   */
  if (
    mimeType === 'application/xml' ||
    mimeType === 'text/xml' ||
    mimeType === 'text/plain' ||
    mimeType === 'text/csv'
  ) {
    return 'texte';
  }
  return 'aucun';
}

interface EcgDocumentViewerProps {
  requestId: string;
  file: { name: string; mimeType: string; sizeBytes: number };
  /** Hauteur du cadre en affichage réduit. Le plein écran s'adapte à la fenêtre. */
  hauteur?: number;
}

/**
 * Affiche le document d'origine dans l'application.
 *
 * **Pourquoi c'est indispensable et non un confort.** Neuf tracés sur dix
 * arrivent en PDF, et un PDF ne porte pas d'échantillons : le visualiseur 12
 * dérivations ne peut rien en tirer. Le tracé existe pourtant — il est dessiné
 * *dans* le document. Sans cette visionneuse, le seul moyen de le voir était de
 * télécharger le fichier et de l'ouvrir ailleurs, ce qui fait sortir le soignant
 * de son écran d'analyse au moment précis où il doit décider.
 *
 * Les octets sont relayés par l'API plutôt que lus depuis une URL signée : le
 * document arrive sur notre origine, l'affichage ne dépend plus des en-têtes du
 * stockage, et aucune signature valide ne traîne dans le DOM.
 */
export function EcgDocumentViewer({ requestId, file, hauteur = 460 }: EcgDocumentViewerProps) {
  const rendu = renduPour(file.mimeType);
  const lourd = file.sizeBytes > CHARGEMENT_AUTOMATIQUE_MAX;

  const [demande, setDemande] = useState(!lourd && rendu !== 'aucun');
  const [pleinEcran, setPleinEcran] = useState(false);
  const [texte, setTexte] = useState<string | null>(null);

  /**
   * Nommé `fichier` et non `document` : ce dernier est l'objet global du
   * navigateur. Le masquer dans ce composant marcherait tant qu'on n'y touche
   * pas, puis casserait silencieusement le jour où quelqu'un y ajoute un
   * `document.createElement`.
   */
  const fichier = useEcgDocument(requestId, demande && rendu !== 'aucun');

  /**
   * L'objet URL est créé ici et libéré au démontage.
   *
   * Créé dans le hook, il aurait survécu dans le cache de react-query sans que
   * personne ne sache quand le révoquer : le blob serait resté en mémoire jusqu'au
   * rechargement de la page. Lié au composant, son cycle de vie est explicite.
   */
  const objectUrl = useMemo(() => {
    if (!fichier.data || rendu === 'texte' || rendu === 'aucun') return null;
    return URL.createObjectURL(fichier.data.body);
  }, [fichier.data, rendu]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  // Le texte est décodé une fois, à l'arrivée du blob.
  useEffect(() => {
    if (rendu !== 'texte' || !fichier.data) return;
    let vivant = true;
    void fichier.data.body.text().then((contenu) => {
      if (vivant) setTexte(contenu);
    });
    return () => {
      vivant = false;
    };
  }, [fichier.data, rendu]);

  if (rendu === 'aucun') {
    return (
      <Alert severity="info" variant="outlined">
        Ce format ({file.mimeType}) ne s'affiche pas dans le navigateur. Téléchargez le
        fichier source pour l'ouvrir avec votre outil habituel.
      </Alert>
    );
  }

  if (!demande) {
    return (
      <Stack spacing={1.5} sx={{ alignItems: 'center', py: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Document de {(file.sizeBytes / 1024 / 1024).toFixed(1)} Mo — chargé sur demande pour
          ne pas retarder l'affichage de l'analyse.
        </Typography>
        <Button variant="contained" startIcon={<VisibilityIcon />} onClick={() => setDemande(true)}>
          Visualiser le document
        </Button>
      </Stack>
    );
  }

  if (fichier.isPending) {
    return (
      <Stack spacing={1}>
        <LinearProgress />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Chargement du document…
        </Typography>
      </Stack>
    );
  }

  if (fichier.isError) {
    return (
      <Alert
        severity="error"
        variant="outlined"
        action={
          <Button size="small" color="inherit" onClick={() => void fichier.refetch()}>
            Réessayer
          </Button>
        }
      >
        {fichier.error instanceof ApiError
          ? fichier.error.message
          : "Le document n'a pas pu être chargé."}
      </Alert>
    );
  }

  const corps = (plein: boolean) => {
    const h = plein ? '100%' : hauteur;

    if (rendu === 'pdf') {
      return (
        <Box
          component="iframe"
          src={objectUrl ?? undefined}
          title={`Tracé ECG — ${file.name}`}
          sx={{
            width: '100%',
            height: h,
            border: 'none',
            borderRadius: plein ? 0 : 1,
            bgcolor: '#ffffff',
          }}
        />
      );
    }

    if (rendu === 'image') {
      return (
        <Box
          sx={{
            height: h,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Fond blanc : un tracé est imprimé sur papier clair, l'afficher sur
            // un fond sombre en inverserait la lecture.
            bgcolor: '#ffffff',
            borderRadius: plein ? 0 : 1,
            overflow: 'auto',
          }}
        >
          <Box
            component="img"
            src={objectUrl ?? undefined}
            alt={`Tracé ECG — ${file.name}`}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </Box>
      );
    }

    return (
      <Box
        component="pre"
        sx={{
          height: h,
          m: 0,
          p: 1.5,
          overflow: 'auto',
          borderRadius: plein ? 0 : 1,
          bgcolor: 'action.hover',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12,
          lineHeight: 1.5,
          // Un export d'électrocardiographe tient sur une seule ligne de plusieurs
          // milliers de caractères : sans retour à la ligne, rien n'est lisible.
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {texte ?? 'Décodage…'}
      </Box>
    );
  };

  return (
    <Stack spacing={1}>
      {corps(false)}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInFullIcon />}
          onClick={() => setPleinEcran(true)}
        >
          Plein écran
        </Button>
      </Stack>

      <Dialog open={pleinEcran} onClose={() => setPleinEcran(false)} fullScreen>
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          <Stack>
            <Typography variant="h6" component="span">
              {file.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {file.mimeType} · {(file.sizeBytes / 1024).toFixed(0)} Ko
            </Typography>
          </Stack>
          <IconButton onClick={() => setPleinEcran(false)} aria-label="Fermer">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {/* `p: 0` et hauteur pleine : le document occupe tout l'espace disponible,
            ce qui est le seul intérêt du plein écran pour un tracé. */}
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {corps(true)}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
