# Plateforme de Télécardiologie

Application d'analyse ECG assistée par IA : un professionnel de santé soumet un
tracé, un cardiologue valide l'interprétation, un administrateur gère les
comptes et l'audit.

- **Frontend** — React 19, Vite 7, MUI 9 (Material UI), MUI X (DataGrid, Charts,
  Date Pickers), SweetAlert2, wouter, react-hook-form + zod, TanStack Query.
- **Backend** — NestJS, architecture clean, PostgreSQL via Prisma 7,
  authentification JWT par rôle, emails Resend. Dossier `telecardiologie-backend/`.

---

## Démarrage

Le projet est scindé en deux : ce dépôt porte le **frontend**, l'API vit dans le
dossier voisin `telecardiologie-backend/`.

```bash
npm install
npm run dev        # http://localhost:3000
```

Démarrez aussi l'API, sans quoi toute requête `/api` échouera :

```bash
cd ../telecardiologie-backend && npm run start:dev   # http://localhost:8000
```

Vite relaie `/api` vers le port 8000. Passer par ce proxy plutôt que d'appeler
`http://localhost:8000` directement n'est pas un détail : le navigateur ne voit
qu'une seule origine, et le cookie de session (`SameSite=Strict`) est donc bien
transmis.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `VITE_API_TARGET` | `http://localhost:8000` | Cible du proxy Vite en développement |
| `VITE_API_BASE_URL` | *(vide)* | Origine de l'API. Vide = appels relatifs via le proxy. À renseigner seulement pour viser une autre origine, qui devra alors figurer dans le `CORS_ORIGINS` de l'API. |

### Production

```bash
npm run build   # produit dist/public
```

Déposez le contenu de `dist/public` dans `telecardiologie-backend/public` : l'API
le sert alors elle-même, sur une origine unique.

---

## Backend

L'API vit dans le dossier voisin **`telecardiologie-backend/`** (NestJS,
architecture clean, PostgreSQL via Prisma, authentification JWT par rôle,
emails Resend). Voir son README pour l'architecture, les points d'entrée et les
tests.

Ce dépôt-ci ne contient plus que le frontend.

---

## Données

**Aucun écran n'affiche plus de donnée codée en dur.** Les quinze pages métier
lisent l'API via TanStack Query (`client/src/api/hooks.ts`), et les contrats sont
décrits dans `client/src/api/types.ts`.

Trois conventions structurent ce branchement :

- **Le serveur fournit les libellés.** Chaque énumération arrive sous trois
  formes : `status` (technique, `PENDING_REVIEW`), `statusApi` (`pending_review`)
  et `statusLabel` (« En attente de validation »). Le frontend filtre sur la
  valeur technique et affiche le libellé — il ne traduit rien lui-même et ne
  compare jamais de chaîne accentuée.
- **`<QueryBoundary>` porte les trois états** d'une requête — chargement, erreur
  avec bouton « Réessayer », vide. Sans lui, chaque écran réinventerait son
  `if (isLoading)` et finirait par avaler une erreur quelque part.
- **Les mutations invalident, elles ne devinent pas.** Après une prise en charge
  ou une conclusion, les clés `['ecg-requests']` sont invalidées : listes, file
  et détails se rafraîchissent ensemble.

Deux écrans se rafraîchissent tout seuls : le détail d'une demande interroge
l'API toutes les 3 s tant que l'analyse tourne (`PENDING_ANALYSIS`, `ANALYZING`),
et la file du cardiologue toutes les 15 s — elle bouge sous l'effet des confrères.

### Les trois parcours

| Parcours | Écran | Ce qui est écrit en base |
| --- | --- | --- |
| **Soumission** | `NewECGRequest` | Envoi `multipart` du tracé, création de la demande, notification au demandeur, analyse déclenchée en arrière-plan |
| **Lancement de l'analyse** | automatique, visible depuis `RequestDetail` | Statut `ANALYZING` réel puis `PENDING_REVIEW`, ligne dans `ecg_analyses` |
| | | *L'analyse est produite par GroqCloud à partir des mesures extraites du fichier ; quand elles manquent, l'écran affiche « Tracé non lu par l'analyseur » et les champs rythme/fréquence restent vides.* |
| **Validation** | `CardiolQueue` → `ECGAnalysis` | Prise en charge exclusive, décision (`VALIDATED` / `CORRECTED` / `REJECTED`), diagnostic, commentaire, notification et audit |

**Supervision côté administrateur.** L'écran `/admin/requests` débloque les deux
situations que le balayage automatique ne résout pas dans les délais utiles :
relancer une analyse en échec définitif, et libérer une prise en charge oubliée.
Ces deux routes existaient côté serveur sans aucun appelant — les demandes en
`ANALYSIS_FAILED` étaient donc figées du point de vue de l'interface.

La prise en charge est **exclusive** : si deux cardiologues cliquent en même
temps, l'un obtient la demande, l'autre reçoit un 409 et voit passer
« Trop tard » — la file se rafraîchit d'elle-même, sans rechargement.

---

## Design

**Palette** — rouge médical et blanc. Le rouge de marque (`#b51e26`) porte les
actions principales ; les erreurs utilisent un rouge nettement plus sombre
(`#841521`) et les avertissements de l'ambre, toujours accompagnés d'une icône.
Sans cet écart, un bouton principal et un message d'erreur seraient
indiscernables.

**Thème** — `client/src/theme/index.ts`, en variables CSS MUI avec deux schémas
de couleurs. Le mode sombre se bascule depuis la barre supérieure et persiste ;
un script en tête de `index.html` applique le mode enregistré avant le premier
rendu pour éviter un flash clair.

**Alertes** — **toutes** les alertes passent par SweetAlert2, encapsulé dans
`client/src/lib/alerts.ts` :

| Fonction | Usage |
| --- | --- |
| `notify.success / warning / error / info` | Notification en coin d'écran, s'efface seule |
| `confirm({ tone: 'danger' })` | Action irréversible ; l'annulation est le choix par défaut |
| `alertDialog(...)` | Message bloquant à acquitter |
| `showLoading` / `closeLoading` | Opération de durée inconnue |

Les couleurs sont lues sur les variables CSS du thème, donc le mode sombre est
suivi sans configuration supplémentaire.

> **Le composant `<Alert>` de MUI n'est plus utilisé nulle part.** En réservant
> l'aspect « alerte » aux notifications SweetAlert2, on évite qu'un bloc de
> contenu soit pris pour un message à acquitter.
>
> Le contenu contextuel permanent — interprétation de l'IA, conseils d'usage,
> résultat d'un examen — s'affiche via `<InfoPanel>`
> (`client/src/components/common/InfoPanel.tsx`), visuellement distinct d'une
> notification. Le transformer en popup ferait surgir une fenêtre à chaque
> ouverture de page.

---

## Limites connues

- **L'IA ne voit pas le tracé.** L'analyseur lit les mesures que
  l'électrocardiographe a écrites dans le fichier ; face à une image ou un PDF
  scanné, il n'a que le dossier clinique. L'écran d'analyse l'annonce alors
  explicitement et laisse rythme et fréquence vides — voir le README du backend.
- **Pas de rendu ECG réel.** Le tracé affiché est un SVG décoratif statique ; le
  fichier d'origine reste téléchargeable via une URL signée. Un rendu de signal
  (12 dérivations, grille 25 mm/s · 10 mm/mV, calipers) reste à construire.
- **Resend en bac à sable.** Avec l'expéditeur `onboarding@resend.dev`, seuls
  les envois vers l'adresse propriétaire du compte aboutissent. Vérifiez un
  domaine dans Resend pour écrire à de vrais destinataires.
- **Internationalisation.** Le français est codé en dur dans le JSX ; la
  localisation MUI ne couvre que les libellés des composants.
