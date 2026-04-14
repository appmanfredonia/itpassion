# ItPassion MVP

MVP social network basato sulle passioni, costruito con:

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel

## Requisiti

- Node.js 20+
- npm 10+

## Setup locale

1. Installa dipendenze:

```bash
npm install
```

2. Primo setup ambiente (una volta per macchina/progetto):

```bash
npm run env:bootstrap
```

3. Avvia in sviluppo:

```bash
npm run dev
```

## Script ambiente

- `npm run env:check`: verifica le variabili obbligatorie da `.env.example`
- `npm run env:pull`: sincronizza `.env.local` da Vercel
- `npm run vercel:link`: collega la cartella al progetto Vercel
- `npm run env:bootstrap`: link + pull + check (setup completo)

`env:check` gira automaticamente prima di `dev` e `build` per evitare preview/deploy con configurazione incompleta.

## Configurazione stabile Preview su Vercel

Per evitare di passare env a mano ad ogni preview:

1. collega il repository GitHub al progetto Vercel;
2. imposta in Vercel le env richieste per **Development, Preview, Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ogni push su branch genera preview con le stesse env gia configurate.

## Troubleshooting rapido

Se compare `Internal Server Error` subito dopo deploy:

1. controlla che le env richieste siano presenti in Vercel su tutti gli ambienti;
2. riesegui `npm run env:pull` in locale;
3. verifica con `npm run env:check`.
