# Leonida Evidence File — GTA 6 Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/aleep1990/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/aleep1990/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

A dense, fully cited trophy guide and tracker for **Grand Theft Auto VI** (PlayStation 5) — built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01): *Build the best GTA 6 trophy guide*.

## What it is

All 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online — with the official name, description and grade shown exactly as PlayStation publishes them, and a guide in our own words for every one of them.

The point of this entry is the **evidence**. Every guide step and every claim cites its sources by number:

- **438 cited claims** across the 55 trophies, **217 backed by 2+ sources**
- **155 cited steps** (every step cites at least one source)
- **23 disputes shown both ways** — where the sources disagree, both versions are printed with our call
- **25 claims flagged unconfirmed** — five trophies have no confirmed method in any source as of 21 Nov 2026, and we say so instead of inventing one
- **10 sources read**: PowerPyx, KeenGamer, Push Square, gamemapa, Insider Gaming, GTABase, Exophase, PSNProfiles, games.gg, GamesFuze
- A live citation audit strip on the app counts these from the data itself — nothing is hard-coded

## Features

- **Checklist** — tick trophies earned; progress is saved in localStorage and can be exported/imported as JSON
- **Cited guide detail** — steps, cited facts with per-claim source chips, disputes box, sources list, per-trophy notes, and a progress counter for counted trophies
- **Next up planner** — the next 5 unearned trophies in roadmap order
- **Platinum roadmap** — three stages (story → 100% completion → Strangers & Freaks cleanup) with the full 100% checklist
- **Sources & disputes view** — every source with the claims it backs, every dispute, every unconfirmed claim
- **Filters** — search, grade, earned state, and kind (story / missable / collectibles / activities / robberies / side quests / hidden / unconfirmed)
- **Spoiler setting** — hidden and story trophies stay hidden until earned (off by default in screenshot seeds)
- **Missables flagged** — Positive Mental Attitude is the one potentially missable trophy (first meditation, Chapter 1 only)
- **Fully offline** — system fonts only, no webfonts, no network requests at runtime; the app fetches only its own `data/trophies.json`

## Run it

```bash
node serve.ts            # serves app/ on http://localhost:8080
node serve.ts --port 8081
```

Then open `http://localhost:8080` in a browser. Screenshot seeds are URL parameters: `?seed=13` earns the first 13 trophies in roadmap order, `?view=roadmap|sources` opens a view, `?trophy=28` opens a trophy, `?spoilers=off` reveals hidden trophies.

## Build the submission

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

PowerPyx · KeenGamer · Push Square · gamemapa · Insider Gaming · GTABase · Exophase · PSNProfiles · games.gg · GamesFuze. Guides are written in our own words; sources are cited, never copied. The official trophy names, descriptions and grades are the exception — they are shown exactly as PlayStation publishes them. No Rockstar logo or artwork is used.

## License

MIT — see [LICENSE](LICENSE).
