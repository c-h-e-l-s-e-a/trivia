# Trivia Night Practice

A practice game for high-school trivia nights, plus a Facts section of study tables.
Everything is plain HTML, CSS, JavaScript and JSON. There is no build step:
change a file, publish it, and the page uses it.

## Where things are

```
index.html                 The page shell. Loads the styles and scripts below.
README.md                  This file.

css/
  style.css                All the styling.

js/                        Loaded in this order (see index.html):
  config.js                Topics (names, colours), levels, file locations, storage keys.
  core.js                  Shared state, small helpers, the topic wheel.
  game.js                  Playing a game: drawing questions, scoring, home/question/results screens.
  facts.js                 The Facts section: tables, your own tabs and rows, syncing, backups.
  main.js                  Draws the current screen, handles clicks and keys, loads the data.

data/
  questions/<topic>.json   One file per topic, 100 questions each (20 easy, 40 medium, 40 hard).
  facts.json               The built-in Facts tables.
  images.json              Each picture's id, file and alt text.

images/
  flags/                   Country, province and territory flags (PNG).
  flowers/                 Provincial and territorial floral emblems (SVG).
  zodiac/                  Western zodiac symbols (SVG).
  chinese-zodiac/          Chinese zodiac animals (SVG).

tools/                     Run these with Node.js (version 18 or later).
  check.mjs                Checks the data files for mistakes. Run before publishing.
  build-offline.mjs        Makes a single offline HTML file with everything inside it.
```

## Common updates

### Fix or replace a question

Open `data/questions/<topic>.json`. Each line is one question:

```json
{"level": "m", "question": "…?", "answer": "…", "wrong": ["…", "…", "…"], "explanation": "…"}
```

- `level` is `"e"` (easy), `"m"` (medium) or `"h"` (hard).
- `wrong` always has exactly three wrong answers.
- Use curly quotes (“ ” ’) inside the text, not straight double quotes.
- A question's wording is its identity. Changing the wording makes it count as unseen again.

Then publish that one file.

### Add a topic

1. Add a line to `TOPICS` in `js/config.js`: an `id`, a `name`, a `color`, an `ink` colour for text on it, and `guide`.
2. Add `data/questions/<id>.json` with the same `id`.
3. Publish both files.

The home screen, wheel, trial night and Mix all pick up the new topic on their own.

### Update a Facts table

Open `data/facts.json` and find the tab by its `id`. Each row is one line, with cells in column order.
Pictures are listed under `pics` by column number, matched to the row's name in the key column
(for example `"Ontario": "flag-CA-ON"`). So you can reorder, add or change rows without
breaking the pictures, as long as the row's name stays the same.

### Add a picture

Put the file in the right `images/` folder, add its id, path and alt text to `data/images.json`,
and refer to the id from `pics` in `data/facts.json`.

## Before publishing

```
node tools/check.mjs
```

It checks each question file for: valid JSON, the right fields, three different wrong answers,
no straight double quotes, no repeated questions anywhere in the bank, and the 20/40/40 level split.
It also checks that every picture file exists and every picture named in the Facts tables is listed.

## The offline copy

```
node tools/build-offline.mjs trivia-night-practice.html
```

This makes one HTML file with the styles, scripts, questions, Facts and pictures all inside it,
for use without internet. Don't publish it: it duplicates everything above and goes stale
the next time a file changes.

## Saved data

- Progress, flags and settings are kept in the browser under `twelve-topic-trivia:v1`.
- Your own Facts tabs and rows are kept under `twelve-topic-trivia:facts:v1` and, on the published page,
  in your private space in your Claude account (the page declares the `db` and `user` capabilities).
- Backups are saved through the `downloads` capability.

Keep the storage key names as they are, or saved progress will seem to disappear.
