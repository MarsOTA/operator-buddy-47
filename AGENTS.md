# AGENTS.md
## Stack
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Node: 18.x

## Comandi utili
- Install: npm ci
- Dev: npm run dev
- Build: npm run build
- Test: npm test
- Lint: npm run lint

## Linee guida
- Crea SEMPRE una branch feature e apri una PR con descrizione in italiano semplice.
- Mantieni compatibilità PWA (Service Worker, offline queue con Background Sync).
- Per notifiche, usa Web Push API; non rompere il flusso esistente.
- Scrivi commit chiari: breve titolo + elenco puntato dei cambi.

## Cartelle
- frontend/: app React/Vite
- server/: Express API
- public/: manifest.json, sw.js

## Verifiche prima della PR
- build e test passano
- aggiorna README se aggiungi variabili d’ambiente
