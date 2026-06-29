FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache tzdata
ENV TZ=America/Bogota
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
# tenant-config for import:tenant CLI tool
COPY --from=builder /app/src/db/tenant-config ./dist/db/tenant-config
# Service images (Santa María cards)
COPY --from=builder /app/src/flows/santa-maria/images ./dist/flows/santa-maria/images
RUN chmod +x entrypoint.sh
EXPOSE 8787
ENTRYPOINT ["./entrypoint.sh"]
