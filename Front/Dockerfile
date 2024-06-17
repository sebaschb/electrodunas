FROM node:20-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm

RUN pnpm install

RUN pnpm add sharp --save-dev

COPY . .

RUN pnpm build

EXPOSE 3000

CMD sh -c 'sleep 2 && pnpm run start'
