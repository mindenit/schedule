ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /src

FROM base AS build

RUN npm i -g pnpm

COPY --link package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY --link . .

RUN pnpm build

FROM base

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /src/.output /src/.output

EXPOSE 3000

CMD [ "node", ".output/server/index.mjs" ]