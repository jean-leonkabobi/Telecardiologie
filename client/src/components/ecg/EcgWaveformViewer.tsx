import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";

import type { EcgWaveform } from "@/api/types";

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

/**
 * Hauteur d'une piste et gouttière, en millimètres.
 *
 * Répliquées depuis `ECG_TRACK_HEIGHT_MM` et `ECG_GUTTER_MM` du domaine serveur
 * (src/domain/value-objects/EcgWaveform.ts) : une constante ne se partage pas
 * entre deux dépôts. Les faire diverger produirait un tracé à l'écran qui ne se
 * superpose plus à l'impression.
 */
const HAUTEUR_PISTE_MM = 30;

const GOUTTIERE_MM = 14;

const RHYTHM_LEAD = "II";

interface Mesure {
  /** Position en secondes depuis le début de la piste, et amplitude en mV. */
  t0: number;
  v0: number;
  t1: number;
  v1: number;
  enCours: boolean;
}

interface EcgWaveformViewerProps {
  waveform: EcgWaveform;
}

/**
 * Restitue un tracé ECG sur grille millimétrée, aux conventions de l'appareil.
 *
 * **Canvas plutôt que SVG.** Un tracé de dix secondes à 500 Hz représente 5 000
 * points par dérivation, soit 60 000 nœuds pour les douze : autant d'éléments
 * dans le DOM rendrait le défilement saccadé. Le canvas dessine en une passe.
 *
 * **L'échelle ne se négocie pas.** 25 mm/s et 10 mm/mV définissent ce que vaut un
 * carreau ; les respecter est ce qui permet de mesurer un intervalle à l'écran
 * comme à la règle sur le papier. Le tracé occupe donc la largeur que l'échéance
 * exige et défile horizontalement si la place manque, au lieu d'être comprimé.
 */
export function EcgWaveformViewer({ waveform }: EcgWaveformViewerProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [speed, setSpeed] = useState<number>(25);
  const [gain, setGain] = useState<number>(10);
  const [curseur, setCurseur] = useState<{ x: number; t: number } | null>(null);
  const [mesure, setMesure] = useState<Mesure | null>(null);

  const parNom = useMemo(
    () => new Map(waveform.leads.map(l => [l.name, l.samples])),
    [waveform.leads]
  );

  /**
   * La grille vient du serveur, avec le signal.
   *
   * La règle — 3×4 pour douze dérivations, 3×2 pour six, une ligne par piste
   * au-delà — est écrite une seule fois, dans le domaine, et sert aussi au
   * compte rendu PDF. La recopier ici aurait garanti la divergence.
   */
  const lignes = useMemo(
    () =>
      waveform.layout.length > 0
        ? waveform.layout
        : waveform.leads.map(l => [l.name]),
    [waveform.layout, waveform.leads]
  );

  const colonnes = Math.max(...lignes.map(l => l.length));
  const secondesParPiste = waveform.durationSeconds / colonnes;

  const pxParSeconde = speed * PX_PER_MM;
  const pxParMv = gain * PX_PER_MM;
  const gouttiere = GOUTTIERE_MM * PX_PER_MM;
  const hauteurPiste = HAUTEUR_PISTE_MM * PX_PER_MM;

  // La bande de rythme n'est ajoutée que si elle apporte quelque chose : sur une
  // disposition d'une seule colonne, chaque piste couvre déjà toute la durée.
  const avecBandeRythme = colonnes > 1 && parNom.has(RHYTHM_LEAD);

  const largeur = Math.ceil(
    gouttiere + secondesParPiste * colonnes * pxParSeconde
  );
  const hauteur = hauteurPiste * (lignes.length + (avecBandeRythme ? 1 : 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const contexte = canvas.getContext("2d");
    if (!contexte) return;

    // Rendu à la densité réelle de l'écran : sans cela le tracé paraît flou sur
    // un affichage à haute résolution.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = largeur * ratio;
    canvas.height = hauteur * ratio;
    contexte.setTransform(ratio, 0, 0, ratio, 0, 0);

    const couleurs = {
      // Fond blanc dans les deux modes : un tracé se lit sur papier clair, et
      // c'est ainsi qu'il sera imprimé. L'inverser changerait la perception des
      // amplitudes.
      fond: "#ffffff",
      grilleFine: "rgba(181,30,38,0.14)",
      grilleForte: "rgba(181,30,38,0.32)",
      trace: "#1b1414",
      libelle: "#6c6060",
      curseur: theme.palette.primary.main,
      mesure: theme.palette.info.main,
    };

    contexte.fillStyle = couleurs.fond;
    contexte.fillRect(0, 0, largeur, hauteur);
    dessinerGrille(contexte, largeur, hauteur, couleurs);

    lignes.forEach((ligne, indexLigne) => {
      const hautPiste = hauteurPiste * indexLigne;
      const baseY = hautPiste + hauteurPiste / 2;

      etalonner(contexte, { x: 4, baseY, pxParMv, couleur: couleurs.trace });

      ligne.forEach((nom, indexColonne) => {
        const samples = parNom.get(nom);
        const decalageX =
          gouttiere + indexColonne * secondesParPiste * pxParSeconde;

        contexte.fillStyle = couleurs.libelle;
        contexte.font = "600 11px ui-monospace, monospace";
        contexte.fillText(nom, decalageX + 4, hautPiste + 14);

        if (!samples) return;

        const debut = Math.round(
          indexColonne * secondesParPiste * waveform.samplingHz
        );
        const fin = Math.min(
          samples.length,
          debut + Math.round(secondesParPiste * waveform.samplingHz)
        );

        /**
         * Chaque piste est détourée.
         *
         * Sans découpe, un QRS de 2 mV au gain de 20 mm/mV dépassait de sa piste
         * et se dessinait par-dessus la ligne voisine — on croyait à une anomalie
         * de la dérivation du dessus.
         */
        contexte.save();
        contexte.beginPath();
        contexte.rect(0, hautPiste, largeur, hauteurPiste);
        contexte.clip();

        tracerSegment(contexte, samples, debut, fin, {
          decalageX,
          baseY,
          pxParSeconde,
          pxParMv,
          samplingHz: waveform.samplingHz,
          couleur: couleurs.trace,
        });

        contexte.restore();
      });
    });

    if (avecBandeRythme) {
      const rythme = parNom.get(RHYTHM_LEAD)!;
      const hautPiste = hauteurPiste * lignes.length;
      const baseRythme = hautPiste + hauteurPiste / 2;

      etalonner(contexte, {
        x: 4,
        baseY: baseRythme,
        pxParMv,
        couleur: couleurs.trace,
      });

      contexte.fillStyle = couleurs.libelle;
      contexte.font = "600 11px ui-monospace, monospace";
      contexte.fillText(
        `${RHYTHM_LEAD} — bande de rythme`,
        gouttiere + 4,
        hautPiste + 14
      );

      contexte.save();
      contexte.beginPath();
      contexte.rect(0, hautPiste, largeur, hauteurPiste);
      contexte.clip();
      tracerSegment(contexte, rythme, 0, rythme.length, {
        decalageX: gouttiere,
        baseY: baseRythme,
        pxParSeconde,
        pxParMv,
        samplingHz: waveform.samplingHz,
        couleur: couleurs.trace,
      });
      contexte.restore();
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

    if (mesure) {
      const x0 = gouttiere + mesure.t0 * pxParSeconde;
      const x1 = gouttiere + mesure.t1 * pxParSeconde;

      contexte.fillStyle = "rgba(39,124,153,0.12)";
      contexte.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), hauteur);

      contexte.strokeStyle = couleurs.mesure;
      contexte.lineWidth = 1.5;
      contexte.beginPath();
      for (const x of [x0, x1]) {
        contexte.moveTo(x, 0);
        contexte.lineTo(x, hauteur);
      }
      contexte.stroke();
    }
  }, [
    waveform,
    parNom,
    lignes,
    colonnes,
    secondesParPiste,
    speed,
    gain,
    largeur,
    hauteur,
    hauteurPiste,
    gouttiere,
    pxParSeconde,
    pxParMv,
    avecBandeRythme,
    curseur,
    mesure,
    theme,
  ]);

  /** Coordonnées d'un événement souris, en secondes et millivolts. */
  const versSignal = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dansLaPiste = ((y % hauteurPiste) - hauteurPiste / 2) / pxParMv;
    return {
      x,
      t: Math.max(0, (x - gouttiere) / pxParSeconde),
      v: -dansLaPiste,
    };
  };

  const deltaT = mesure ? Math.abs(mesure.t1 - mesure.t0) : 0;
  const deltaV = mesure ? Math.abs(mesure.v1 - mesure.v0) : 0;

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "flex-end", flexWrap: "wrap", gap: 1 }}
      >
        <Stack spacing={0.25}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Vitesse
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={speed}
            onChange={(_e, valeur) =>
              valeur !== null && setSpeed(valeur as number)
            }
          >
            {SPEEDS.map(v => (
              <ToggleButton key={v} value={v} sx={{ px: 1.25 }}>
                {v} mm/s
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.25}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Gain
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={gain}
            onChange={(_e, valeur) =>
              valeur !== null && setGain(valeur as number)
            }
          >
            {GAINS.map(g => (
              <ToggleButton key={g} value={g} sx={{ px: 1.25 }}>
                {g} mm/mV
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Chip label={waveform.sourceFormat} size="small" variant="outlined" />
          <Chip
            label={`${waveform.samplingHz} Hz`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${waveform.durationSeconds} s`}
            size="small"
            variant="outlined"
          />
          <Tooltip title={`${waveform.leads.length} dérivation(s) décodée(s)`}>
            <Chip
              label={`${waveform.leads.length} dériv.`}
              size="small"
              variant="outlined"
              color={waveform.leads.length >= 12 ? "default" : "warning"}
            />
          </Tooltip>
          {waveform.estimatedHeartRateBpm !== null && (
            <Chip
              label={`${waveform.estimatedHeartRateBpm} bpm mesurés`}
              size="small"
              color="primary"
            />
          )}
        </Stack>
      </Stack>

      {/**
       * Défilement horizontal, jamais de compression.
       *
       * `width: max-content` sur le canvas le laisse occuper la largeur exacte
       * que l'échelle impose. Un `width: 100%` — ce qui était fait — étirait ou
       * écrasait l'image : les carreaux ne valaient plus 0,2 s, et toute mesure
       * prise à l'écran devenait fausse sans que rien ne l'indique.
       */}
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1.5,
          overflowX: "auto",
          overflowY: "hidden",
          lineHeight: 0,
          bgcolor: "#ffffff",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: largeur,
            height: hauteur,
            maxWidth: "none",
            display: "block",
            cursor: "crosshair",
          }}
          onMouseDown={e => {
            const { t, v } = versSignal(e);
            setMesure({ t0: t, v0: v, t1: t, v1: v, enCours: true });
          }}
          onMouseMove={e => {
            const { x, t, v } = versSignal(e);
            setCurseur({ x, t });
            setMesure(m => (m?.enCours ? { ...m, t1: t, v1: v } : m));
          }}
          onMouseUp={() =>
            setMesure(m => {
              if (!m) return null;
              // Un simple clic, sans glissement : c'est une demande d'effacement,
              // pas une mesure de zéro seconde.
              if (Math.abs(m.t1 - m.t0) < 0.01) return null;
              return { ...m, enCours: false };
            })
          }
          onMouseLeave={() => {
            setCurseur(null);
            setMesure(m => (m?.enCours ? null : m));
          }}
        />
      </Box>

      <Stack
        direction="row"
        spacing={2}
        sx={{ flexWrap: "wrap", alignItems: "center" }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Un grand carreau ={" "}
          <strong>{(5 / speed).toFixed(2).replace(".", ",")} s</strong> ·{" "}
          <strong>{(5 / gain).toFixed(2).replace(".", ",")} mV</strong>
        </Typography>

        {mesure && !mesure.enCours ? (
          <Typography
            variant="caption"
            sx={{ color: "info.main", fontWeight: 600 }}
          >
            Compas : {Math.round(deltaT * 1000)} ms ·{" "}
            {deltaV.toFixed(2).replace(".", ",")} mV
            {deltaT > 0.2 &&
              ` · ${Math.round(60 / deltaT)} bpm si intervalle R-R`}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Glissez sur le tracé pour mesurer un intervalle
          </Typography>
        )}

        {curseur && !mesure && (
          <Typography variant="caption" sx={{ color: "primary.main" }}>
            {curseur.t.toFixed(2).replace(".", ",")} s
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

/**
 * Impulsion d'étalonnage : 1 mV sur 5 mm, en tête de chaque piste.
 *
 * C'est le premier repère que cherche un cardiologue sur un tracé papier : sa
 * hauteur donne le gain réellement appliqué. Sans elle, rien ne permet de
 * vérifier qu'un complexe de petite amplitude n'est pas simplement un tracé
 * enregistré à demi-gain.
 */
function etalonner(
  contexte: CanvasRenderingContext2D,
  options: { x: number; baseY: number; pxParMv: number; couleur: string }
): void {
  const { x, baseY, pxParMv, couleur } = options;
  const hauteur1mV = pxParMv;
  const largeurPalier = 5 * PX_PER_MM;

  contexte.strokeStyle = couleur;
  contexte.lineWidth = 1.4;
  contexte.lineJoin = "miter";
  contexte.beginPath();
  contexte.moveTo(x, baseY);
  contexte.lineTo(x + 2, baseY);
  contexte.lineTo(x + 2, baseY - hauteur1mV);
  contexte.lineTo(x + 2 + largeurPalier, baseY - hauteur1mV);
  contexte.lineTo(x + 2 + largeurPalier, baseY);
  contexte.lineTo(x + 4 + largeurPalier, baseY);
  contexte.stroke();
}

/** Grille millimétrée : trait fin au millimètre, trait fort tous les 5 mm. */
function dessinerGrille(
  contexte: CanvasRenderingContext2D,
  largeur: number,
  hauteur: number,
  couleurs: { grilleFine: string; grilleForte: string }
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
  }
): void {
  const { decalageX, baseY, pxParSeconde, pxParMv, samplingHz, couleur } =
    options;
  const parPixel = Math.max(1, Math.floor(samplingHz / pxParSeconde));

  contexte.strokeStyle = couleur;
  contexte.lineWidth = 1.4;
  contexte.lineJoin = "round";
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
