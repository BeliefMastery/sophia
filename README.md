# Sophia

The working copy of this project is this GitHub repository: https://github.com/BeliefMastery/sophia

Download it from another computer with the green Code button, or with:

```bash
git clone https://github.com/BeliefMastery/sophia.git
cd sophia
git checkout cursor/sophia-learning-plan-88e9
npm ci
```

`cursor/sophia-learning-plan-88e9` is the branch that has the current site. A zip of that same copy is at https://github.com/BeliefMastery/sophia/archive/refs/heads/cursor/sophia-learning-plan-88e9.zip

The live site links to both of those from the footer, so the files can be fetched without hunting for the repository.

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
