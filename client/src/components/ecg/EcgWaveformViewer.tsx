import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { EcgWaveform } from '@/api/types';

/**
 * Vitesses et gains normalisés d'un électrocardiographe.
 *
 * 25 mm/s et 10 mm/mV sont les réglages de référence : c'est sur eux que
 * reposent tous les repères visuels appris par un cardiologue — un grand carreau
 * vaut 0,2 s et 0,5 mV. Les autres valeurs servent aux cas particuliers : 50 mm/s
 * pour étaler un rythme rapide, 5 mm/mV pour faire tenir un QRS très ample.
 */
const SPEEDS = [25, 50] as const;
const GAINS = [5, 10, 20] as const;

/** Millimètres par pixel logique. Un carreau fin de 1 mm fait 4 px. */
const PX_PER_MM = 4;

/** Disposition 3×4 conventionnelle, plus la bande de rythme. */
const LAYOUT: string[][] = [
  ['I', 'aVR', 'V1', 'V4'],
  ['II', 'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6'],
];
const RHYTHM_LEAD = 'II';

interface EcgWaveformViewerProps {
  waveform: EcgWaveform;
}

/**
 * Restitue un tracé ECG 12 dérivations sur grille millimétrée.
 *
 * **Canvas plutôt que SVG.** Un tracé de dix secondes à 500 Hz représente 5 000
 * points par dérivation, soit 60 000 nœuds pour les douze : autant d'éléments
 * dans le DOM rendrait le défilement saccadé. Le canvas dessine en une passe.
 *
 * Le rendu suit les conventions de l'électrocardiographe — disposition 3×4,
 * bande de rythme en dérivation II, grille 1 mm / 5 mm — parce qu'un cardiologue
 * lit par reconnaissance de formes : déplacer les repères l'obligerait à
 * recalculer ce qu'il sait mesurer d'un coup d'œil.
 */
export function EcgWaveformViewer({ waveform }: EcgWaveformViewerProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  const [speed, setSpeed] = useState<number>(25);
  const [gain, setGain] = useState<number>(10);
  const [curseur, setCurseur] = useState<{ x: number; secondes: number } | null>(null);
  const [largeur, setLargeur] = useState(900);

  const parNom = useMemo(
    () => new Map(waveform.leads.map((l) => [l.name, l.samples])),
    [waveform.leads],
  );

  // La largeur du canvas suit celle du conteneur : un tracé tronqué à droite
  // ferait manquer les derniers battements.
  useEffect(() => {
    const element = conteneurRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setLargeur(Math.max(360, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const secondesParPiste = 2.5;
  const hauteurPisteMm = 20;
  const hauteurPiste = hauteurPisteMm * PX_PER_MM;
  const hauteur = hauteurPiste * (LAYOUT.length + 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const contexte = canvas.getContext('2d');
    if (!contexte) return;

    // Rendu à la densité réelle de l'écran : sans cela le tracé paraît flou sur
    // un affichage à haute résolution.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = largeur * ratio;
    canvas.height = hauteur * ratio;
    contexte.setTransform(ratio, 0, 0, ratio, 0, 0);

    const couleurs = {
      fond: theme.palette.background.paper,
      grilleFine: theme.palette.mode === 'dark' ? 'rgba(232,108,104,0.13)' : 'rgba(181,30,38,0.11)',
      grilleForte: theme.palette.mode === 'dark' ? 'rgba(232,108,104,0.28)' : 'rgba(181,30,38,0.26)',
      trace: theme.palette.mode === 'dark' ? '#f0d7d5' : '#1b1414',
      libelle: theme.palette.text.secondary,
      curseur: theme.palette.primary.main,
    };

    contexte.fillStyle = couleurs.fond;
    contexte.fillRect(0, 0, largeur, hauteur);

    dessinerGrille(contexte, largeur, hauteur, couleurs);

    const pxParSeconde = speed * PX_PER_MM;
    const pxParMv = gain * PX_PER_MM;
    const largeurColonne = secondesParPiste * pxParSeconde;
    const colonnes = Math.max(1, Math.floor(largeur / largeurColonne));

    contexte.lineWidth = 1.4;
    contexte.strokeStyle = couleurs.trace;
    contexte.lineJoin = 'round';

    LAYOUT.forEach((ligne, indexLigne) => {
      const baseY = hauteurPiste * indexLigne + hauteurPiste / 2;

      ligne.slice(0, colonnes).forEach((nom, indexColonne) => {
        const samples = parNom.get(nom);
        const decalageX = indexColonne * largeurColonne;

        // Le libellé est posé même sans signal : son absence est une information.
        contexte.fillStyle = couleurs.libelle;
        contexte.font = '600 11px ui-monospace, monospace';
        contexte.fillText(nom, decalageX + 6, baseY - hauteurPiste / 2 + 14);

        if (!samples) return;

        const debut = Math.round(indexColonne * secondesParPiste * waveform.samplingHz);
        const fin = Math.min(
          samples.length,
          debut + Math.round(secondesParPiste * waveform.samplingHz),
        );

        tracerSegment(contexte, samples, debut, fin, {
          decalageX,
          baseY,
          pxParSeconde,
          pxParMv,
          samplingHz: waveform.samplingHz,
          couleur: couleurs.trace,
        });
      });
    });

    // Bande de rythme : la dérivation II sur toute la largeur, pour juger la
    // régularité — ce qu'une piste de 2,5 s ne permet pas.
    const rythme = parNom.get(RHYTHM_LEAD);
    const baseRythme = hauteurPiste * LAYOUT.length + hauteurPiste / 2;

    contexte.fillStyle = couleurs.libelle;
    contexte.font = '600 11px ui-monospace, monospace';
    contexte.fillText(`${RHYTHM_LEAD} — bande de rythme`, 6, baseRythme - hauteurPiste / 2 + 14);

    if (rythme) {
      const secondesVisibles = largeur / pxParSeconde;
      tracerSegment(contexte, rythme, 0, Math.min(rythme.length, Math.round(secondesVisibles * waveform.samplingHz)), {
        decalageX: 0,
        baseY: baseRythme,
        pxParSeconde,
        pxParMv,
        samplingHz: waveform.samplingHz,
        couleur: couleurs.trace,
      });
    }

    if (curseur) {
      contexte.strokeStyle = couleurs.curseur;
      contexte.lineWidth = 1;
      contexte.setLineDash([4, 3]);
      contexte.beginPath();
      contexte.moveTo(curseur.x, 0);
      contexte.lineTo(curseur.x, hauteur);
      contexte.stroke();
      contexte.setLineDash([]);
    }
  }, [waveform, parNom, speed, gain, largeur, hauteur, hauteurPiste, secondesParPiste, curseur, theme]);

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Vitesse
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={speed}
            onChange={(_e, valeur) => valeur !== null && setSpeed(valeur as number)}
          >
            {SPEEDS.map((v) => (
              <ToggleButton key={v} value={v} sx={{ px: 1.25 }}>
                {v} mm/s
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.25}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Gain
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={gain}
            onChange={(_e, valeur) => valeur !== null && setGain(valeur as number)}
          >
            {GAINS.map((g) => (
              <ToggleButton key={g} value={g} sx={{ px: 1.25 }}>
                {g} mm/mV
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={waveform.sourceFormat} size="small" variant="outlined" />
          <Chip label={`${waveform.samplingHz} Hz`} size="small" variant="outlined" />
          <Chip label={`${waveform.durationSeconds} s`} size="small" variant="outlined" />
          {waveform.estimatedHeartRateBpm !== null && (
            <Chip
              label={`${waveform.estimatedHeartRateBpm} bpm mesurés`}
              size="small"
              color="primary"
            />
          )}
        </Stack>
      </Stack>

      <Box
        ref={conteneurRef}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: hauteur, display: 'block', cursor: 'crosshair' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setCurseur({ x, secondes: x / (speed * PX_PER_MM) });
          }}
          onMouseLeave={() => setCurseur(null)}
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Un grand carreau ={' '}
          <strong>{(5 / speed).toFixed(2).replace('.', ',')} s</strong> ·{' '}
          <strong>{(5 / gain).toFixed(2).replace('.', ',')} mV</strong>
        </Typography>
        {curseur && (
          <Typography variant="caption" sx={{ color: 'primary.main' }}>
            Curseur à {curseur.secondes.toFixed(2).replace('.', ',')} s
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

/** Grille millimétrée : trait fin au millimètre, trait fort tous les 5 mm. */
function dessinerGrille(
  contexte: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  couleurs: { grilleFine: string; grilleForte: string },
): void {
  const pas = PX_PER_MM;

  for (const [espacement, couleur] of [
    [pas, couleurs.grilleFine],
    [pas * 5, couleurs.grilleForte],
  ] as const) {
    contexte.strokeStyle = couleur;
    contexte.lineWidth = 1;
    contexte.beginPath();

    for (let x = 0; x <= largeur; x += espacement) {
      contexte.moveTo(Math.round(x) + 0.5, 0);
      contexte.lineTo(Math.round(x) + 0.5, hauteur);
    }
    for (let y = 0; y <= hauteur; y += espacement) {
      contexte.moveTo(0, Math.round(y) + 0.5);
      contexte.lineTo(largeur, Math.round(y) + 0.5);
    }
    contexte.stroke();
  }
}

/**
 * Trace un segment de signal.
 *
 * Sous-échantillonne quand plusieurs points tombent sur le même pixel : à 25 mm/s
 * et 500 Hz, cinq échantillons par pixel. Les dessiner tous coûterait cinq fois
 * plus pour un résultat identique — mais on garde le **minimum et le maximum** de
 * chaque colonne, sans quoi un pic R étroit disparaîtrait de l'écran.
 */
function tracerSegment(
  contexte: CanvasRenderingContext2D,
  samples: number[],
  debut: number,
  fin: number,
  options: {
    decalageX: number;
    baseY: number;
    pxParSeconde: number;
    pxParMv: number;
    samplingHz: number;
    couleur: string;
  },
): void {
  const { decalageX, baseY, pxParSeconde, pxParMv, samplingHz, couleur } = options;
  const parPixel = Math.max(1, Math.floor(samplingHz / pxParSeconde));

  contexte.strokeStyle = couleur;
  contexte.lineWidth = 1.4;
  contexte.beginPath();

  let premier = true;
  for (let i = debut; i < fin; i += parPixel) {
    const tranche = samples.slice(i, Math.min(fin, i + parPixel));
    if (tranche.length === 0) continue;

    const x = decalageX + ((i - debut) / samplingHz) * pxParSeconde;
    const min = Math.min(...tranche);
    const max = Math.max(...tranche);

    if (premier) {
      contexte.moveTo(x, baseY - min * pxParMv);
      premier = false;
    }
    // Un trait vertical entre les extrêmes de la colonne : c'est ce qui préserve
    // l'amplitude des pics rapides.
    contexte.lineTo(x, baseY - min * pxParMv);
    contexte.lineTo(x, baseY - max * pxParMv);
  }

  contexte.stroke();
}

export default EcgWaveformViewer;
