# syntax=docker/dockerfile:1.7
#
# Image du frontend.
#
# Le résultat est un nginx qui sert les fichiers statiques **et relaie `/api`
# vers l'API**. Ce relais n'est pas un raccourci de commodité : le cookie de
# rafraîchissement est posé en `SameSite=Strict` (voir `auth.controller.ts`).
# Servir le frontend sur une origine et l'API sur une autre ferait que le
# navigateur n'enverrait jamais ce cookie — la session tiendrait quinze minutes,
# le temps de vie de l'access token, puis la déconnexion surviendrait sans que
# rien n'indique pourquoi.

ARG NODE_IMAGE=node:22-slim
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.27-alpine

# --- 1. Dépendances ----------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- 2. Compilation ----------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `VITE_API_BASE_URL` est délibérément laissé vide : les appels partent alors en
# relatif vers `/api`, que nginx relaie. Les variables `VITE_*` sont figées à la
# compilation, pas lues à l'exécution — une valeur d'origine gravée ici ne
# pourrait plus être changée sans reconstruire l'image.
ENV VITE_API_BASE_URL=""

RUN npm run build

# --- 3. Service --------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime

# Image non privilégiée : nginx tourne sous l'utilisateur `nginx` et écoute sur
# 8080, un port non réservé. Rien ici ne justifie root.
ENV API_UPSTREAM=http://backend:8000 \
    MAX_UPLOAD_SIZE=25m

# Le gabarit est développé au démarrage par le point d'entrée de l'image
# officielle (`envsubst` sur `/etc/nginx/templates/*.template`) : l'adresse de
# l'API devient un réglage de déploiement et non une valeur compilée.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# `vite.config.ts` écrit dans `dist/public` et non `dist` — voir la clé
# `build.outDir`.
COPY --from=build /app/dist/public /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1
