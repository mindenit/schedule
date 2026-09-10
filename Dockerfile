ARG NODE_VERSION=22.23.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /src

FROM base AS build

# pnpm's standalone binary (@pnpm/exe) needs libatomic.so.1 on arm64 —
# not present by default on node:*-slim. Pin it explicitly so the build
# doesn't depend on it being present by luck/caching.
RUN apt-get update && \
	apt-get install -y --no-install-recommends libatomic1 && \
	rm -rf /var/lib/apt/lists/*

RUN npm i -g pnpm

COPY --link package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY --link . .

RUN pnpm build

FROM base

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /src/.output /src/.output

EXPOSE 3000

CMD [ "node", ".output/server/index.mjs" ]
