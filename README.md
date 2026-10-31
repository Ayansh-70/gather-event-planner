# Gather

**A little planning. A lot of joy.**

Gather is a GenAI-powered planning workspace for weddings, birthdays and community events. It brings budgets, timelines, vendor checklists and personalized ideas together in a quiet, practical interface.

**Virtual Prompt Wars vertical:** Event planning and celebration management.  
**Primary persona:** A first-time organizer who needs to coordinate a meaningful event without professional planning experience.  
**Repository:** https://github.com/Ayansh-70/gather-event-planner

## Run locally

Requires **Node.js 24+** and Git. There are no production dependencies, compilation steps or external fonts.

```sh
git clone https://github.com/Ayansh-70/gather-event-planner.git
cd gather-event-planner
npm start
```

Open **http://localhost:3000**. The app works immediately in explicitly labeled **local planning guide** mode. The sample wedding contains demonstration details, not real bookings or user data. Use **New event** to start your own plan.

For development:

```sh
npm ci
npm run dev
npm test
npm run check
```

`npm ci` is needed only for development tools and DOM tests. The deployed app runs with Node alone.

## Optional genuine generative AI

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env` in this project folder (PowerShell: `Copy-Item .env.example .env`).
3. Set `GEMINI_API_KEY` to your key. Leave it server-side; never put it in frontend code or commit `.env`.
4. Restart `npm start`. Ideas and Planning assistant will show Gemini availability.

```dotenv
PORT=3000
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
APP_ORIGIN=
AI_ACCESS_CODE=
```

The model is configurable because account availability and provider model lifetimes vary. Gemini uses the [GenerateContent API](https://ai.google.dev/api/generate-content) and [structured output](https://ai.google.dev/gemini-api/docs/structured-output) for validated idea cards. Real provider calls require a working key, supported model, quota and network access. Automated tests mock the provider; a live model call has not been verified without a supplied key.

**Honest fallback:** Without a key, the app does not pretend templates are AI. A deterministic local guide uses the event context for budget, vendor and timeline guidance. Provider failures are shown as failures; users can explicitly switch to the local guide. Generated suggestions never change budgets or book vendors automatically.

## What you can do

| Workspace | Working behavior |
| --- | --- |
| Overview | Date countdown, total budget, remaining spending, task completion, booked-vendor counts and contextual nudges |
| Event brief | Create up to 20 separate events; choose persona, date, place, budget, guests, currency, style and personal requirements |
| Budget | Persona-specific allocations, protected starting contingency, editable planned and actual amounts, custom categories, overspending warnings |
| Timeline | Persona-specific checklist, realistic short-lead-time dates, custom tasks, completion filters, editable dates and overdue warnings |
| Vendors | Add/edit candidates, quotes, contacts, notes and booking status; check inclusions, terms and access/dietary arrangements |
| Ideas | Curated context-aware starting points; generate three personalized Gemini ideas when configured; save a collection |
| Assistant | Ask practical questions using the current event brief and budget; explicit local/Gemini mode and error feedback |
| Portability | Browser persistence, validated JSON export/import and a printable event summary suitable for Save as PDF |

## Approach and decision logic

The design separates **reliable calculations** from **generative suggestions**. Budget arithmetic and deadlines belong in deterministic code; language models are used for open-ended advice and creative ideas.

1. Validate the event brief: supported type/currency, genuine calendar date, bounded text, positive whole-number budget and guest count.
2. Allocate the budget according to the persona. Wedding plans prioritize venue and food; birthdays include cake and activities; community events include permits, safety and accessibility. Category rounding leaves the final remainder in contingency, so the initial total always equals the budget exactly.
3. Generate a task sequence relative to the event date. Deadlines that have already passed at creation are moved to today, preserving essentials for short-notice events.
4. Recompute progress and warnings from current state. Warn about overspending, over-allocation, overdue tasks and imminent events. Outdoor events receive weather-backup guidance, not invented forecasts.
5. Send only a bounded event brief, current budget and current question to Gemini on an explicit request. Structured ideas are validated before display. Display all external text as escaped text, never executable markup.
6. Keep the organizer in control. Vendor quotes remain separate from payments; suggestions require manual adoption. Editing the event date shifts incomplete task deadlines by the same number of days; completed tasks retain their dates. Existing allocations are retained when the total budget changes, exposing an allocation gap rather than silently overwriting work.

### Architecture

```text
public/
  app.js             Application state, views and user interactions
  styles.css         Responsive design, keyboard focus, reduced motion, print
  lib/planner.js     Pure planning logic, date/money utilities, import validation
  lib/storage.js     Versioned browser storage and JSON portability
  lib/ui.js          HTML escaping, reusable icons and original SVG illustration
server/
  index.js           Static hosting, API boundary, security controls, rate limits
  ai.js              Gemini adapter, context validation and structured output
test/
  planner.test.js    Domain invariants and malformed backup cases
  server.test.js     HTTP and mocked provider integration
  ui.test.js         DOM-level interaction workflows
scripts/
  check.mjs          Syntax and source-size checks
```

Native ES modules and Node's built-in HTTP server keep the runtime small. No client framework, UI library, production npm package, analytics SDK, third-party image or font is required. The ivory, forest-green and muted terracotta interface uses system sans-serif with Georgia headlines and original vector artwork.

## Security and privacy

- API keys are read from server environment variables. `.env` is ignored by Git and excluded from the Docker image.
- Same-origin requests and JSON content types are enforced for the AI endpoint. A strict CSP disallows inline scripts, external scripts and framing. Static serving is limited to the `public` directory and approved asset types.
- Requests are limited to 16 KB; profiles, arrays and responses are bounded. The provider call has a 25-second timeout.
- AI requests are limited to eight per minute per socket IP, four concurrent requests and 200 provider requests per UTC day per running process. These are application safeguards, not a distributed billing guarantee. Counts reset when the server restarts; multiple instances have independent limits. Configure provider billing/quota controls for public use.
- `AI_ACCESS_CODE` optionally requires a shared code for AI calls. The browser holds it only in memory. This is a cost-control gate, not user authentication. Set a strong code on public deployments with a paid API key.
- No prompt, key or event data is written to server logs. Vendor contact details and previous chat messages are excluded from AI requests. Users should avoid sensitive information in the brief or current question.
- Event data lives in this browser profile. There is no cloud synchronization, login or server-side event database. Anyone with access to the same browser profile can see local plans. JSON exports also contain event/vendor details; protect your backups.
- User/model text is escaped before HTML rendering. Imported files are validated and rebuilt from allowlisted fields. Invalid saved data is not silently overwritten.

## Deploy

Deploy a **Node web service**, not GitHub Pages: the optional AI integration needs a server to protect its key. No build step is required.

### Render (configuration included)

Create a web service connected to this public repository, or use its `render.yaml` blueprint:

- Runtime: Node 24
- Build command: `node --version`
- Start command: `npm start`
- Health check: `/api/health`
- Set `APP_ORIGIN` to the exact public HTTPS origin, for example `https://your-service.onrender.com` (no trailing slash).
- Optionally set `GEMINI_API_KEY`, `GEMINI_MODEL` and `AI_ACCESS_CODE` in the host's environment settings.

Leave `GEMINI_API_KEY` blank for the fully usable local planning guide. The host supplies `PORT`. Follow the host's current account and plan requirements; this repository has not been deployed to a hosting account yet.

### Docker

```sh
docker build -t gather .
docker run --rm -p 3000:3000 --env-file .env gather
```

The container runs as the non-root `node` user and includes a health check. Put an HTTPS reverse proxy in front of production traffic and set `APP_ORIGIN` accordingly.

## Validation and accessibility

```sh
npm ci
npm test
npm run check
```

Tests cover exact allocation totals, all three personas, compressed timelines, leap dates, invalid profiles/backups, overspending, escaped content, API origin checks, access codes, payload limits, rate limits, provider errors and structured model responses. DOM tests exercise form and navigation flows without a real browser. GitHub Actions runs checks and tests on `main`.

Semantic navigation, native form labels, keyboard focus indicators, a skip link, native modal dialogs, screen-reader status announcements, progress labels, reduced-motion support and responsive layouts are included. No color is the sole indicator of task status. Automated checks do not establish WCAG compliance; complete the [manual verification checklist](docs/VERIFICATION.md) in a real browser before a public presentation.

## Assumptions and limitations

- Budgets and spending are whole currency units; INR, USD, EUR and GBP are supported. Currency labels are not exchange-rate conversions.
- Events represent one primary calendar date. Multi-day ceremonies can be modeled as separate events or custom tasks.
- Allocation percentages are illustrative starting frameworks, not location-specific vendor quotes. Actual needs vary.
- No external vendor marketplace, payments, RSVP delivery, weather feed, legal permit verification or automated booking is claimed.
- Local guide suggestions are templates adapted to selected context. Gemini mode handles free-form preferences and novel questions; AI advice should be reviewed.
- Conversation history is session-only: it is discarded on reload/import. Saved plans, vendors, tasks and ideas persist on the same browser/device. Export before clearing browser storage.
- Storage failures show an explicit export reminder. Browser privacy settings and private browsing may prevent persistence.
- This is a single-process contest application. Shared-device privacy, multi-user synchronization and distributed abuse prevention would need additional infrastructure for a broader commercial service.

## Challenge compliance

- One public repository: **Ayansh-70/gather-event-planner**.
- One branch: **main**. No deployment branch is required.
- Source, lockfile, documentation and original SVG artwork are far below **10 MB**; dependencies, caches, secrets and local artifacts are excluded.
- Meaningful development commits are pushed to `main`.
- This work creates one project/repository. It does not submit a contest attempt. Submission and the three-attempt limit remain under the participant's control.

See [the submission guide](docs/SUBMISSION.md) for a short demonstration script and evaluation mapping.
