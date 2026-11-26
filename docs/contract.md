# Nafeer → Basheer content contract

What the Basheer app reads from a Nafeer export, block by block. Basheer's code
is the source of truth; this file follows it. When the two disagree, Basheer
wins and this file is out of date.

Sources in the Basheer repo (`D:/Repos/Basheer`):

| What | File |
|---|---|
| Export JSON Basheer imports | `app/src/main/java/com/zeros/basheer/core/data/seed/ExportModels.kt` |
| Block types | `app/src/main/java/com/zeros/basheer/feature/lesson/data/entity/BlockEntity.kt` (`BlockType`) |
| Block metadata parsing | `feature/lesson/data/mapper/LessonMapper.kt`, `VerseMetadata.kt`, `WidgetMetadata.kt`, `ImagePins.kt` |
| Verses and memorization pieces | `docs/features/memorization.md` |
| Widgets | `docs/features/widgets.md` |
| Basheer's own content generator | `scripts/content/kit.mjs` |

Last checked against Basheer on 2026-11-27.

---

## 1. The block in the export

Nafeer's `/api/export` and the publish bundles (`src/lib/publishSubject.js`)
write each block as:

```json
{ "id": "geo_u1_l1_s1_b1", "type": "VERSE", "content": "…", "order": 1,
  "conceptRef": null, "caption": null, "metadata": "{\"variant\":\"quran\"}",
  "mediaPath": null }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Nafeer's `contentId`. |
| `type` | string | yes | One of the types in §2, exactly as written there. |
| `content` | string | yes | Never null; `""` when empty. Meaning depends on the type. |
| `order` | int | yes | Position in the section, 1-based. |
| `conceptRef` | string? | no | A concept id of the same subject. |
| `caption` | string? | no | Shown under images, verses, examples. |
| `metadata` | **string**? | no | A JSON object **serialised to a string**. Basheer's `BlockJson.metadata` is `String?`: a raw object here fails the import. Nafeer stores it as an object and turns it into a string on export (`coerceMixedToString`). |
| `mediaPath` | string? | no | Supabase path of an IMAGE/GIF. Informational; not used to name the saved file. |
| `sectionId` | string? | delta only | Present in flat delta patches; ignored in full exports. |

Extra keys (`status`, …) are ignored (`ignoreUnknownKeys`).

**An unknown `type` fails the whole import.** `BlockJson.toEntity` calls
`BlockType.valueOf(type)`, which throws. In a full seed the whole subject is
rolled back; in a delta patch the exception is rethrown. Two consequences:

- Nafeer must never export a type Basheer does not have. `QUESTION` blocks are
  Nafeer-only (checkpoint placeholders) and are dropped from every export.
- A subject that contains `VERSE` or `WIDGET` blocks only imports on Basheer
  builds that know those types. Older installs fail on it. Publish such blocks
  only once every supported Basheer build has them.

The export envelope's `version` is `"1.0"`, matching
`ContentSeeder.SUPPORTED_EXPORT_VERSION`. Any other value is refused.

## 2. Block types

`BlockType` in Basheer, and where Nafeer stands on each:

| Type | Nafeer can author it | `content` | `metadata` |
|---|---|---|---|
| `TEXT` | yes | the paragraph | none |
| `HEADING` | yes | the heading | `{ level }` |
| `IMAGE` | yes | picture URL or asset path | `{ aspectRatio? }` |
| `GIF` | yes | as IMAGE | as IMAGE |
| `FORMULA` | yes | LaTeX | not read |
| `HIGHLIGHT_BOX` | yes | the text | `{ style }` |
| `EXAMPLE` | yes | the text (plain example) | `{ interactive, steps }` |
| `TIP` | yes | the text | none |
| `LIST` | yes | one item per line, or a JSON array | `{ style, hasConceptLinks? }` |
| `TABLE` | yes | `{"headers": […], "rows": […]}` as a string | not read |
| `QUOTE` | yes | the quotation | none |
| `DIVIDER` | yes | `""` | none |
| `INTERACTIVE_IMAGE` | yes | picture URL | `{ markers, aspectRatio? }` |
| `VERSE` | **yes** (since 2026-11-27) | the lines | see §3 |
| `WIDGET` | **no**: not yet editable in Nafeer | the invitation line | see §4 |

Metadata of every type is read leniently. Bad JSON never breaks a lesson; what
each type falls back to is listed below.

### HEADING
`{ "level": 2 }`. `level` defaults to 2. No metadata, or bad JSON: level 2.

### HIGHLIGHT_BOX
`{ "style": "definition" | "warning" | "tip" | "note" }`, **lower case**.
Anything else, no metadata or bad JSON: `note`. See gap G1.

### LIST
`{ "style": "numbered" | "bullet", "hasConceptLinks": false }`, **lower case**.
Anything but `"numbered"` is a bullet list. `content` is one item per line, or,
when `hasConceptLinks` is true or the content starts with `[`, a JSON array of
`{ text, conceptRef?, children? }`. An array that cannot be read falls back to
one item per line. See gap G1.

### IMAGE / GIF
`{ "aspectRatio": 1.5 }`. A ratio of 0 or less, or none, means "measure the
picture". Nafeer also stores `mediaId` and `alt`; Basheer ignores them.

### INTERACTIVE_IMAGE
`{ "markers": [{ "id", "x", "y", "label", "description" }], "aspectRatio"? }`.
Basheer's own generator writes the list as `pins`; both keys are read, the first
non-empty wins. `x` and `y` are 0–1 from the top-left corner and are clamped to
that range. A pin with no `id`, `x` or `y` is dropped. `label` and
`description` default to `""`. Without metadata it is still drawn as a picture.

### EXAMPLE
`{ "interactive": true, "steps": [ "…", { "text": "…", "predict": { "choices": ["right", "wrong", …], "answer": 0 } } ] }`.
A step is a string, or an object when the student predicts it first. A
prediction is used only with at least two non-blank choices and an `answer`
pointing at one of them; otherwise the step is shown plainly.

### TABLE
Its data is in `content`, not `metadata`: `{"headers": [...], "rows": [[...], ...]}`.
A row may also be `{ "cells": [...] }`. Content that cannot be read: an empty table.

## 3. VERSE

A Quran passage, or poetry (a بيت or several, a whole poem, or a slice of a
poem to learn by heart).

### content

The text itself, one line per آية or بيت. Blank lines are skipped and each line
is trimmed.

- **Poetry:** a بيت per line, its صدر and عجز split by `|` (written ` | `).
  A line with no `|` is one half.
- **Quran:** one آية per line, exactly as in the book. Basheer adds the ﴿ ﴾
  around the passage and the ۝ sign and number after each آية, so they are
  **not** written in `content`. No markup of any kind goes into Quran text:
  word meanings live in metadata and are found in the text by matching.

### caption

- **Poetry:** the poet and the occasion ("من قصيدة … لجمّاع"). Shown under the verse.
- **Quran:** usually empty. When set, it replaces the reference line
  ("سورة النور، الآيات ٣٩–٤٠") under the passage.

### metadata

```json
{ "variant": "quran", "surah": "النور", "ayah": "39–40",
  "pieceId": "qr_nur", "pieceLines": [3, 4],
  "words":    [{ "line": 1, "word": "بِقِيعَةٍ", "meaning": "أرض منبسطة" }],
  "meanings": [{ "line": 1, "text": "…" }] }
```

Parsed by `parseVerseMetadata` (`VerseMetadata.kt`).

| Key | Type | Required | Default | Rule |
|---|---|---|---|---|
| `variant` | `"quran"` \| `"poetry"` | effectively | `poetry` | `quran` in any case means Quran; anything else, missing, or no metadata at all means poetry. |
| `surah` | string | no | none | Quran only. The surah's name without "سورة". |
| `ayah` | string or number | no | none | Quran only. One آية (`"39"`, `39`) or a range (`"39–40"`, en dash or hyphen). The first number in it numbers the first line; later lines count up from it. |
| `pieceId` | string | no | none | The memorization piece this block shows. A verse without it is not tracked. |
| `pieceLines` | `[from, to]` | no | whole piece | 1-based lines of the piece that this block shows. |
| `words` | array | no | `[]` | Glossed words, see below. |
| `meanings` | array | no | `{}` | Per-line meanings, see below. |

`words[]`: `{ "line": int, "word": string, "meaning": string }`.
- `line` is the **block's own** line, 1-based (not the piece's line).
- `word` is written exactly as it stands on that line, with the same
  diacritics. Basheer finds the first occurrence at or after the start of that
  line. A word that is not found is left undotted; it still appears in the
  "معاني المفردات" table.

`meanings[]`: `{ "line": int, "text": string }`. The overall meaning of one
line of the block. One per line; a second entry for the same line replaces the
first.

**What Basheer does with a bad value** (it never fails the lesson):

| Bad value | Result |
|---|---|
| No metadata, or metadata that is not a JSON object | A poetry verse with nothing else. |
| A key set to JSON `null` | Same as the key being absent, never the text `"null"`. |
| Strings | Trimmed; an empty string counts as absent. |
| `pieceLines` not exactly two integers, `from < 1`, or `to < from` | Ignored: the whole piece. |
| A `words` entry with no integer `line ≥ 1`, or an empty `word` or `meaning` | That entry is dropped, the rest kept. |
| A `meanings` entry with no integer `line ≥ 1`, or an empty `text` | That entry is dropped. |
| A `line` beyond the block's lines | Kept, but there is no line to show it on. |
| Non-object entries in `words` / `meanings` | Dropped. |

Authoring rules Basheer's own generator enforces, which Nafeer's editor
warns about:

- each glossed word is written so on its line;
- each meaning names a line the block has;
- `pieceLines` spans as many lines as the block has (`to − from + 1`).

### What Nafeer stores

The editor (`src/components/editor/blocks/VerseEditor.jsx`, helpers in
`src/lib/verse.js`) keeps the metadata in exactly the shape above, as an object
in Mongo, and publish/export pass it through untouched (stringified). Entries
that are still half-typed (a word with no meaning yet) are kept as typed;
Basheer drops them as described. VERSE needs no section-level field.

## 4. WIDGET (not yet editable in Nafeer)

Shape only. Nafeer can store and pass through a WIDGET block (for example one
restored from a published file), shows it read-only, and edits only its
`content` line. It cannot create one.

- `content`: the line inviting the student to try it.
- `caption`: optional.
- `metadata`:

```json
{ "widget": "gravity-height", "title": "عجلة الجاذبية والارتفاع",
  "still": "file:///android_asset/widgets/gravity-height/still.svg",
  "params": { "startKm": 1200, "goalRatio": 0.5 },
  "task": { "text": "…", "done": "…" } }
```

| Key | Required | Default | Rule |
|---|---|---|---|
| `widget` | yes | none | `^[a-z0-9][a-z0-9-]{0,47}$`, the name of a folder under the app's `assets/widgets/`. Missing or not matching: **the block is not shown**. |
| `title` | no | `"تجربة"` | Title of the full-screen view. |
| `still` | no | none | Picture shown on the block; normally the widget's own `still.svg`. |
| `params` | no | `{}` | Passed to the widget as is. Each widget lists its params in its `widget.json` / the top of its `index.html`. A non-object is replaced by `{}`. |
| `task.text`, `task.done` | no | none | Optional challenge and what is shown once it is reached. |

What Nafeer would need to make it editable: a picker from the app's widget
list, a settings form per widget read from its `widget.json`, the challenge
texts, and the still. See `docs/features/widgets.md` in Basheer.

## 5. Gaps

Found while writing this file. None is fixed by the VERSE work.

- **G1. Style values are upper case in Nafeer, lower case in Basheer.** Nafeer
  writes `HIGHLIGHT_BOX` `style` as `DEFINITION` / `WARNING` / `NOTE` / `TIP` and
  `LIST` `style` as `BULLET` / `NUMBERED` (`src/shared/constants.js`,
  `BlockEditor.jsx`). Basheer compares against lower case only, so every
  highlight box authored in Nafeer shows as a plain note and every numbered
  list as bullets. The reverse holds too: content restored from Basheer's
  generator (lower case) shows in Nafeer's editor as a note / bullet list.
  Fix on one side: lower-case on export, or match case-insensitively in Basheer.
- **G2. No memorization pieces in Nafeer.** `pieceId` and `pieceLines` can be
  typed on a VERSE block, but Nafeer has no pieces collection, no piece picker,
  and no top-level `pieces` array in the export (`PieceJson`: `id`, `kind`
  POETRY/QURAN, `title`, `lines`, `poet?`, `surah?`, `ayahFrom?`, `ayahTo?`,
  `lessonId?`, `order`). Delta sync would also need entity type `PIECE`. Until
  then a `pieceId` from Nafeer names no piece on the device, and no recital is
  scheduled for it. See "What Nafeer must add" in Basheer's
  `docs/features/memorization.md`.
- **G3. WIDGET is not authorable** (§4).
- **G4. Old app builds.** Any VERSE or WIDGET block in a published subject
  makes that subject fail to import on Basheer builds from before those types
  (§1). Nafeer has no check for it.
- **G5. Restored metadata is a string.** `lib/restoreSubject.js` stores block
  `metadata` as the string it finds in the published file, while the editor
  expects an object. The VERSE editor reads either; the other block editors
  spread a string into characters when edited. The restore should parse it.
- **G6. INTERACTIVE_IMAGE** is authorable through the image block's
  "صورة تفاعلية" toggle, but it is not in the add-block menu, and Nafeer never
  writes `aspectRatio`, so Basheer measures each picture itself.
- **G7. Marker questions** (`QuestionJson.markers`) are exported by Nafeer; see
  `docs/question-markers.md`. Nafeer also exports `markerMode` and `image`,
  which Basheer ignores.
