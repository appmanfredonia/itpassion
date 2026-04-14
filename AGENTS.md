# AGENTS.md — ItPassion

## Contesto progetto
ItPassion è un social network basato sulle passioni.

Il MVP deve restare essenziale ma forte.
Non aggiungere feature fuori scope.
Non introdurre complessità architetturale non necessaria.

## Stack obbligatoria
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Vercel

## Obiettivo MVP
Il MVP deve permettere a un utente di:
1. registrarsi o fare login
2. scegliere passioni iniziali
3. entrare nel feed
4. pubblicare foto, video o testo
5. mettere like
6. commentare
7. seguire utenti
8. salvare contenuti
9. esplorare passioni e profili
10. cercare utenti, passioni e contenuti
11. inviare messaggi privati
12. gestire privacy base

## Funzioni che NON devono entrare ora
- creator tools
- analytics
- premium features
- collaborazioni brand/creator
- raccolte tematiche
- profili suggeriti avanzati
- notifiche avanzate
- moderazione avanzata interna
- algoritmi ML reali

## Regole di sviluppo
- Mantieni il codice semplice, leggibile e coerente.
- Usa componenti riutilizzabili.
- Evita over-engineering.
- Non creare microservizi.
- Non introdurre librerie non necessarie.
- Non creare backend custom complesso se Supabase basta.
- Rispetta la struttura cartelle definita.
- Ogni nuova funzione deve funzionare sia desktop sia mobile.
- Ogni pagina deve avere stato loading, empty e error quando serve.

## Regole UI
- Design premium, pulito, scuro e coerente con ItPassion.
- Linguaggio in italiano.
- Tipografia leggibile.
- Componenti consistenti tra feed, profilo, esplora e messaggi.
- Nessuna interfaccia sovraccarica.

## Struttura cartelle da rispettare
- `src/app/(public)` per landing
- `src/app/(auth)` per login/register
- `src/app/(app)` per area autenticata
- `src/components` per componenti UI e feature
- `src/lib/supabase` per client/server helpers
- `supabase/migrations` per schema database

## Database minimo da usare
- users
- passions
- user_passions
- posts
- post_media
- likes
- comments
- follows
- saved_posts
- conversations
- conversation_participants
- messages
- privacy_settings
- blocked_users

## Definition of done
Una feature è finita solo se:
- il codice compila
- non rompe il resto del progetto
- è tipizzato correttamente
- è responsive
- ha loading/error/empty state se necessario
- è coerente con il design del progetto
- usa dati reali o mock chiari
- è pronta per essere testata manualmente

## Priorità di sviluppo
Ordine obbligatorio:
1. auth
2. onboarding passioni
3. feed
4. creazione contenuto
5. profilo utente
6. like/commenti/follow/salvataggi
7. esplora
8. ricerca
9. messaggi privati
10. privacy base

## Regola finale
Prima fai funzionare bene il nucleo sociale.

Tutto il resto viene dopo.
