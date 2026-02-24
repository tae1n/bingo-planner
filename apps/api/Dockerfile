FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @bingo-planner/shared build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @bingo-planner/api build
RUN pnpm deploy --filter @bingo-planner/api --prod --legacy /prod/api
RUN cp -rL /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma /prod/api/node_modules/.prisma

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /prod/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/main"]
