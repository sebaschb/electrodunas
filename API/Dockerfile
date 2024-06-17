FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./

COPY /prisma ./prisma

# esperar 10 segundos para que el contenedor de la base de datos esté listo

ENV DATABASE_URL postgresql://root:root@pg_container:5432/test_db?schema=public

RUN npm install

COPY src ./src


CMD sh -c 'sleep 2 && npx prisma generate && npx prisma db pull && npm run dev'


EXPOSE 3000
