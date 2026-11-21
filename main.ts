// Leonida Evidence File — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
// The guide is plain static files under app/ (index.html, ES modules, CSS, data/trophies.json)
// that run offline in a browser. This program copies app/ and screenshots/ from beside
// this file into the output directory and writes /output/dossier.json with the vendored
// make.fun library, exactly as the scorer rebuilds it. Leave vendor/makefun-frontend.ts
// untouched: the gate compares the dossier byte for byte against its own copy.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app:  node serve.ts  (then open http://localhost:8080)
//
// Pre-flight: the scorer needs at least one screenshot (the first is the cover), so this
// program refuses to write a dossier when screenshots/ is empty instead of failing
// inside the vendored library with a bare error.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(jpe?g|png|webp)$/i.test(name) && statSync(join(shotsDir, name)).isFile())
  : [];
if (shots.length === 0) {
  throw new Error('screenshots/ holds no image: take the four renders first (see README.md), the first is the cover');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the other limits refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app
// files, which count beside /output's own 1000-entry cap with screenshots/ and dossier.json).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`wrote ${dossierPath} (${statSync(dossierPath).size} bytes) with ${shots.length} screenshots`);
