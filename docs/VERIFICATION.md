# Verification record

## Automated

Run `npm ci`, `npm run check` and `npm test` with Node 24. Tests use Node's runner and jsdom for DOM behavior. Provider tests use injected mock HTTP responses; they do not incur API charges.

The local HTTP server was started and its root/health endpoints verified. A browser automation connection was unavailable in the build environment, so **visual layout, screen-reader behavior and real-browser interactions have not been verified**. A live Gemini request has not been verified because no API key was provided.

## Manual browser checklist

1. Open `http://localhost:3000` in a current Chrome, Edge, Firefox or Safari. Confirm the sample dashboard loads without console errors.
2. Create one event of each type. Confirm category allocations sum to the entered budget and checklists differ by persona.
3. Create an event for tomorrow. Confirm no initial task is due before today.
4. Change planned and actual budget values. Confirm totals update immediately and over-budget amounts are clearly marked.
5. Add, edit, complete, filter and delete a task. Edit the event date and confirm incomplete task deadlines shift while completed dates stay fixed.
6. Add a vendor, change its quote and booking status, and check all three review boxes. Confirm actual spending is unchanged.
7. Save/remove ideas. With a configured key, generate fresh ideas and inspect their relevance to preferences.
8. Ask the guide about budget and vendors. With Gemini enabled, test a novel question and a provider failure. Check mode/error labeling.
9. Export, then import the JSON. Confirm the import creates an additional event. Try malformed JSON and an invalid amount.
10. Reload the page. Confirm plan data persists and conversation history does not.
11. Print a summary and use Save as PDF. Confirm the budget, timeline, vendor list and saved ideas appear.
12. Delete an event, cancel once, then confirm. Export first if the data is valuable.
13. Repeat main flows at 390 px mobile, 768 px tablet and 1440 px desktop widths, at 200% zoom, and with reduced motion enabled.
14. Use only the keyboard: skip link, navigation, dialogs, forms and checkboxes. Confirm focus is visible and Escape closes a dialog.
15. Use a screen reader to check field names, task completion, navigation and assistant status. Check contrast with an accessibility inspector.

## Production smoke check

- Confirm HTTPS and `APP_ORIGIN` match the deployed origin exactly.
- Confirm `/api/health` returns configuration flags, never a key.
- Check `/.env`, `/server/index.js` and `/package.json` return 404.
- Set a strong `AI_ACCESS_CODE` and provider quotas for a public deployment.
- Verify one live Gemini question and one structured idea response with the chosen model.
- Inspect GitHub: public visibility, only `main`, CI green and repository below 10 MB.
