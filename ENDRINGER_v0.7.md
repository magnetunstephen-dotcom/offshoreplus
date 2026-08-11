# OffshorePlus v0.7 – Turnus + CV

## Nytt
- CV-generator under Profil & CV.
- CV-data lagres lokalt i nettleseren.
- Forhåndsvisning i profesjonell, tradisjonell CV-stil.
- «Lagre som PDF / skriv ut» bruker nettleserens PDF-utskrift.
- Flere turnuser: 2/4 (14/28), 14/21, 15/21, 14/14, 7/7, 12/16, 21/21 og egendefinert.
- Kalenderen bruker den valgte rotasjonen automatisk.
- Ny Profil-knapp i bunnmeny og hurtigvalg på dashboardet.

## Produksjon
- `vite.config.ts` er kontrollert og står fortsatt med `base: "/"` for offshoreplus.no.

## Test
- TypeScript typecheck: OK.
- Full Vite-build kunne ikke kjøres i ChatGPT Linux-miljø fordi den opplastede Windows `node_modules` mangler Linux-binding for Rolldown. Kjør `npm run build` eller `npm run dev` på Windows før publisering.
