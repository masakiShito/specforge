FROM node:20-bookworm

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/document-schema/package.json ./packages/document-schema/package.json

RUN pnpm install --filter @specforge/web... --frozen-lockfile=false

WORKDIR /workspace/apps/web

CMD ["pnpm", "dev"]
