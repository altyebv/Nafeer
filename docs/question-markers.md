# Question markers

Marker questions: a picture with pins that the student labels or finds.
They reuse the marker system that lesson images already have
(`components/media/MarkerPin.jsx`, `lib/markerUtils.js`) and stay hidden
behind the `hotspotEnabled` switch until the Android app can grade them.

Status: M1–M3 built on the web, 22 October 2026 (see §6). M4, the
Android app, is next. Decisions taken with the owner:

- Both kinds in the first version: **label the pins** and **find it**.
- Label the pins scores **partial credit**, split evenly across pins.
- The **Android app** lives in another repository and comes later. This repo
  writes the data shape and a reference grading function with tests, and the
  app implements the same rules.

## 1. The two kinds

### Label the pins (`mode: 'label'`)

The picture shows numbered pins. For each pin, the student chooses its name
from one shared word bank. The bank holds every pin's answer plus a few
distractors, shuffled.

- Example: a cell diagram with 4 pins. The bank is النواة، الميتوكوندريا،
  الريبوسوم، الشبكة الإندوبلازمية، الجدار الخلوي.
- Score: `points × (right pins / all pins)`. Each wrong pin then shows its
  right name.
- A word can be used once. Two pins can't share one answer.

### Find it (`mode: 'locate'`)

The picture has no visible pins. The question names something ("حدّد موقع
النواة") and the student taps once. The tap is right when it lands within the
target's radius.

- One target per question. A diagram with several things to find becomes
  several questions, which keeps grading and feedback simple.
- Score: all or nothing.
- After answering, the target and its ring are shown along with the student's
  tap.

### Reference pins on written questions (`FIGURE`)

A `FIGURE` question (written answer about a picture) can carry pins with no
answers, purely as labels the question text refers to ("ما وظيفة الجزء ٢؟").
They are drawn with the same read-only `MarkedImage`. They aren't graded.

## 2. Data shape

A new question type, `IMAGE_MARKER`, added to `QUESTION_TYPES`
(`lib/models/Question.js`) and to the app's enum.

```js
{
  type: 'IMAGE_MARKER',
  textAr: 'طابق كل رقم في الرسم بالعضية الصحيحة.',
  imageUrl: 'https://…/cell.png',
  image: { mediaId: 'MEDIA_…', width: 1200, height: 900 },   // new
  markerMode: 'label',                                        // 'label' | 'locate'
  markers: [
    { id: 'mk_…', x: 0.50, y: 0.45, label: '1', answer: 'النواة' },
    { id: 'mk_…', x: 0.72, y: 0.35, label: '2', answer: 'الميتوكوندريا' },
  ],
  options: ['الجدار الخلوي'],        // label: distractors only; the bank = answers + these
  correctAnswer: 'MARKER_LABELS',    // sentinel, like MATCH_PAIRS: the truth is in markers
  explanation: '…',
}
```

Find it:

```js
{
  markerMode: 'locate',
  markers: [{ id: 'mk_…', x: 0.52, y: 0.44, label: 'النواة', radius: 0.06 }],
  options: null,
  correctAnswer: 'MARKER_LOCATE',
}
```

Rules:

- **Position:** `x`, `y` are fractions of the image's width and height from
  its top-left. They mark the centre of the pin's dot. This is the anchor
  every renderer uses, web and app.
- **Radius:** `radius` is a fraction of the image's **width**. Hit test:
  `dx = (tapX − x)`, `dy = (tapY − y) × height / width`, right when
  `√(dx² + dy²) ≤ radius`. That is why `image.width` and `image.height` are
  stored: on a non-square image a fraction of the height is a different
  length. Default 0.06, allowed range 0.02–0.2.
- **Image size** comes from the media library item when picked, or from the
  image itself when it loads in the editor. Questions saved without it fall
  back to the image's own size at render time.
- **Unknown fields are kept** (`sanitiseMarkers`), so the shape can grow.
- **Publishing** sends `markers`, `markerMode` and `image` as they are, in the
  question export (`lib/publishSubject.js`, `app/api/export/route.js`).

Validation, on save (server) and in the form (client):

| Mode   | Rule |
|--------|------|
| label  | at least 2 pins; every pin has a non-empty `answer`; answers unique; distractors don't repeat an answer |
| locate | exactly 1 pin with a `label` (the thing to find) and a `radius` in range |
| both   | an image is set; every pin inside 0–1 |

## 3. Grading (reference)

`lib/markerQuestion.js`, pure functions, with the cases in
`tests/markerQuestion.test.js`. The app ports both: the tests are the
contract.

```js
markerIssues(question)              // what stops it being valid → string[] (Arabic); [] when ready
gradeLabels(question, picks)        // picks: { [markerId]: word } → { score, right, total, perPin: { [id]: boolean } }
gradeLocate(question, tap, size?)   // tap: { x, y } normalised    → { correct, distance }
markerBank(question, seed)          // answers + distractors, shuffled the same way for one seed
```

## 4. Phases

Each phase ends at a review gate with the owner before the next starts.

**M1 — model and grading**
- `IMAGE_MARKER` type, `markerMode`, `image`, marker `answer` and `radius`.
- Validation in the question route, and the export and publish fields.
- `lib/markerGrading.js` and its tests.
- Done when: a marker question can be saved over the API, is refused when
  invalid, and appears in the export.

**M2 — authoring**
- In `QuestionForm`, an image picker from the media library replaces the bare
  URL field (for `FIGURE` too), and records the image size.
- `ImageMarkerEditor` gets a `mode` prop:
  - label: an answer field per pin
  - locate: a single target with a draggable radius ring
  - reference: label only
- A distractor list for label mode.
- A checklist under the form that lists what is still missing, using the
  same rules as the server.
- Done when: both kinds and reference pins can be written and edited in the
  quiz bank.

**M3 — student view on the web**
- `MarkerQuestion` built on `MarkedImage`:
  - label: tap a pin, then pick its name from the bank
  - locate: tap once, then see the result ring
- Used in the quiz bank's question preview, replacing the demo's
  `ImageMarkerQuestion`.
- Done when: a written question can be answered in the preview and grades
  the same as the tests.

**M4 — app handoff** (other repository)
- This document plus the grading tests, as the contract.
- The `hotspotEnabled` label in the dashboard renamed to "أسئلة الصور
  التفاعلية". It stays off until the app ships the type.
- While the switch is off, publishing leaves `IMAGE_MARKER` questions out of
  the export. An app build that doesn't know the type may fail on it rather
  than skip it, so this can't be left to the app.

## 5. Not in this version

- More than one target in a find-it question, and freeform regions
  (polygons) instead of circles.
- Pins in a lesson's demonstration that ask something. Lessons keep their
  explain-only interactive images; a question about the picture is a
  checkpoint question.
- Drag-the-label-onto-the-picture interactions.

## 6. As built (web, M1–M3)

What the Android session needs to know, and where the build differs from
the plan above.

**Where things are**
- Rules, word bank and grading: `src/lib/markerQuestion.js`, with its cases
  in `tests/markerQuestion.test.js`.
- Pin drawing and the anchor: `src/components/media/MarkerPin.jsx`
  (`MarkerPin`, `MarkedImage`).
- Student view: `src/components/media/MarkerQuestion.jsx`.
- Authoring:
  - `src/components/editor/quizbank/MarkerFields.jsx` and `MarkerTryout.jsx`
  - the `mode` prop of `src/components/editor/media/ImageMarkerEditor.jsx`

**Export shape** (`lib/publishSubject.js`)
- Each question carries `markers` (an array, not a string), `markerMode` and
  `image`.
- Lesson blocks differ: their `metadata`, `markers` included, is a JSON
  string.

**Label pins**
- `label` stays empty, and the app shows the pin's number (index + 1).
- The student never sees `answer` before checking.
- `description` on a label pin is an optional note shown after checking.

**Pin anchor**
- The dot's centre is the point.
- The label bubble sits above the dot. It moves below the dot when `y < 0.15`,
  and lines up with the dot's side when `x < 0.15` or `x > 0.85`.

**Answering on the web**
- Find it: the student taps, can tap again to move it, then checks. After
  checking, the target's ring shows in green, and the tap in green or red.
- Label the pins: tap a pin (or its row), then a word. Each word is used
  once, so picking it again moves it. After each pick, the selection moves to
  the next empty pin.

**Image size**
- The editor reads the picture's natural size when it loads. Media library
  items have no dimensions, so a picked image gets its size on first load.
- `gradeLocate` treats the image as square when there is no size.

**Radius**
- Set with a slider in the target's panel (2–20% of the width), not by
  dragging the ring.

**Publishing**
- `IMAGE_MARKER` questions are left out of the publish while
  `featureFlags.hotspotEnabled` is off.
- In the dashboard, that switch is labelled "أسئلة الصور التفاعلية".

**Not done on the web**
- The demo's `ImageMarkerQuestion` (`components/demo/screens/QuizBankScreen.jsx`)
  is unchanged: it draws an SVG placeholder, not a real image.
- The quiz bank's question list shows no marker thumbnail yet.
