# Sophia

The working copy of this project is this GitHub repository: https://github.com/BeliefMastery/sophia

Download it from another computer with the green Code button, or with:

```bash
git clone https://github.com/BeliefMastery/sophia.git
cd sophia
npm ci
```

A zip of `main` is at https://github.com/BeliefMastery/sophia/archive/refs/heads/main.zip

The live site is Firebase Hosting: https://sophia-138fe.web.app

When a section is finished, the parent login shows a short student roster, an overall miss summary, and per-student missed questions with a copy-paste prompt for the next module. A wrong answer opens a two-paragraph in-app reading and a follow-up from that text, not an external search. Students pick work from the knowledge tech-tree in `content/knowledge-tree.mjs`. A deeper branch unlocks when a sitting holds (at least five of six first attempts); falling short keeps another module in the same field. Planned branches can be marked as interest only. The rules for adding the next module are in `plan.md` and `database.md`. Modules grow as results arrive. Existing ids stay.

## How the system is split

| Concern | Home | Notes |
| --- | --- | --- |
| App, images, plan docs, curriculum authoring | **This GitHub repo** | Edit here; push updates the site and seeds content |
| Auth logins | **Firebase Authentication** | Project `sophia-138fe` |
| Questions, guides with passages, attempts, interest ticks | **Firebase Realtime Database** | Seeded from `content/`; student progress and interests stay in the DB only |
| Built site | **Firebase Hosting** | Deployed from `dist` by CI |

Git is the source of truth for curriculum. Edit `content/*.mjs`, then let the seed workflow write `strands`, `items`, and `guides` into the live database. Do not hand-edit live questions in the Firebase console except for emergencies. Do not commit student attempts, passwords, or service-account keys.

Push to `main` is the production path:

- Site files under `src/`, `lib/`, and the Vite config → deploy Hosting
- `content/*.mjs` and seed helpers → seed Realtime Database
- `database.rules.json` → deploy database rules

## Run it locally

```bash
npm run dev
```

That opens the placement check on http://127.0.0.1:5173/ against the live Firebase project. The web config in `src/firebase.js` is the public client config.

To work without touching live answers, start the emulators in another terminal and run the local app against them:

```bash
npx firebase emulators:start --only auth,database --project demo-sophia
```

```bash
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 GCLOUD_PROJECT=demo-sophia node scripts/seed-placement-check.js
npm run dev:emulator
```

Local sign-in for that emulator is `student@example.test` / `local-only`, and `parent@example.test` / `local-only` after the parent role is written. Those are emulator accounts only. Do not put a real password, a private key, or a personal email into the repository.

```bash
npm test
```

Photographs for the screens live in `public/images/`. They are part of this repository, so a download includes them.
