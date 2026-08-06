# OffshorePlus

React + Vite + TypeScript-versjonen av OffshorePlus.

## Starte lokalt

```bash
npm install
npm run dev
```

## Kontrollere og bygge

```bash
npm run typecheck
npm run build
```

## Publisering på GitHub Pages

Prosjektet inneholder `.github/workflows/deploy.yml`, som bygger og publiserer automatisk ved push til `main`.

I GitHub:

1. Gå til **Settings → Pages**.
2. Velg **GitHub Actions** som Source.
3. Push alle prosjektfilene til `main`.
4. Følg kjøringen under fanen **Actions**.

Mens siden ligger på `stephen644.github.io/offshoreplus/`, skal `base` i `vite.config.ts` være `/offshoreplus/`.

Når `offshoreplus.no` kobles til, endres `base` til `/`.
