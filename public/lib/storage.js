import { validateEvent } from './planner.js';
const KEY = 'gather.events.v1';
export function loadEvents() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.events) || data.events.length > 20)
    throw new Error('Saved data could not be read.');
  return data.events.map(validateEvent);
}
export function saveEvents(events) {
  // Conversations are intentionally session-only, including at rest.
  const plans = events.map((event) => ({ ...event, messages: [] }));
  localStorage.setItem(KEY, JSON.stringify({ version: 1, events: plans }));
}
export function exportEvent(event) {
  const blob = new Blob(
    [JSON.stringify({ version: 1, event: { ...event, messages: [] } }, null, 2)],
    {
      type: 'application/json',
    },
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `gather-${event.profile.type}-plan.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importEvent(file) {
  if (file.size > 500000) throw new Error('Choose a Gather backup smaller than 500 KB.');
  const data = JSON.parse(await file.text());
  if (data.version !== 1) throw new Error('Unsupported backup version.');
  return validateEvent(data.event);
}
