import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEvent,
  allocateBudget,
  validateProfile,
  validateEvent,
  totals,
  insights,
  localAdvice,
  localIdeas,
  addDays,
  daysUntil,
  validDate,
} from '../public/lib/planner.js';
import { escapeHTML } from '../public/lib/ui.js';
const profile = {
  name: 'Test celebration',
  type: 'wedding',
  location: 'Jaipur',
  date: '2027-03-10',
  budget: 100001,
  guests: 80,
  currency: 'INR',
  style: 'Simple & sustainable',
  preferences: 'Vegetarian, step-free access',
  outdoor: true,
};
test('every persona allocates the exact whole-number budget, including awkward remainders', () => {
  for (const type of ['wedding', 'birthday', 'community'])
    for (const budget of [100, 101, 999, 100001, 100000000]) {
      const rows = allocateBudget({ ...profile, type, budget });
      assert.equal(
        rows.reduce((sum, row) => sum + row.planned, 0),
        budget,
      );
      assert.ok(rows.every((row) => Number.isInteger(row.planned) && row.planned >= 0));
      assert.equal(rows.at(-1).name, 'Contingency');
    }
});
test('short lead times bring tasks forward to today without dropping essentials', () => {
  const e = createEvent({ ...profile, date: '2027-03-12' }, '2027-03-10');
  assert.ok(e.tasks.every((t) => t.date >= '2027-03-10' && t.date <= '2027-03-12'));
  assert.equal(e.tasks.length, 8);
});
test('each persona has a distinct and useful checklist', () => {
  assert.match(
    createEvent({ ...profile, type: 'community' })
      .tasks.map((t) => t.title)
      .join(' '),
    /permits/,
  );
  assert.match(
    createEvent({ ...profile, type: 'birthday' })
      .tasks.map((t) => t.title)
      .join(' '),
    /cake/,
  );
});
test('date calculations handle leap years and year boundaries', () => {
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2027-12-31', 1), '2028-01-01');
  assert.equal(daysUntil('2027-03-01', '2027-02-28'), 1);
  assert.equal(validDate('2027-02-30'), false);
  assert.equal(validDate('not-a-date'), false);
});
test('profile validation rejects invalid enums, negative budgets and noninteger guest counts', () => {
  for (const invalid of [
    { budget: -1 },
    { guests: 1.5 },
    { currency: 'FAKE' },
    { type: 'other' },
    { date: '2027-02-30' },
    { name: ' ' },
    { preferences: 'x'.repeat(1501) },
  ])
    assert.throws(() => validateProfile({ ...profile, ...invalid }));
});
test('totals are independent of vendor quotes and expose overspending', () => {
  const e = createEvent(profile);
  e.budget[0].actual = 110000;
  e.vendors.push({ quote: 500000 });
  assert.equal(totals(e).actual, 110000);
  assert.equal(totals(e).remaining, -9999);
  assert.equal(insights(e)[0].level, 'warn');
});
test('alerts respond to overdue tasks, short lead time and outdoor plans', () => {
  const e = createEvent({ ...profile, date: '2027-03-12' }, '2027-03-01');
  const titles = insights(e, '2027-03-10')
    .map((i) => i.title)
    .join(' ');
  assert.match(titles, /overdue/);
  assert.match(titles, /final stretch/);
  assert.match(titles, /weather backup/);
});
test('local advice uses event context and does not claim to be generative AI', () => {
  const e = createEvent(profile);
  assert.match(localAdvice(e, 'cost'), /80 guests/);
  assert.match(localAdvice(e, 'vendors'), /Jaipur/);
  assert.match(localAdvice(e, 'help'), /rule-based/);
  assert.equal(localIdeas(profile).length, 3);
});
test('backup validation rebuilds IDs, strips unknown properties and drops conversation history', () => {
  const e = createEvent(profile);
  e.secret = 'not allowed';
  e.messages = [{ role: 'user', text: 'private' }];
  const restored = validateEvent(JSON.parse(JSON.stringify(e)));
  assert.notEqual(restored.id, e.id);
  assert.equal(restored.secret, undefined);
  assert.deepEqual(restored.messages, []);
  assert.deepEqual(restored.profile, e.profile);
});
test('backup validation rejects oversized arrays and malicious amounts', () => {
  const e = createEvent(profile);
  e.tasks = Array(201).fill(e.tasks[0]);
  assert.throws(() => validateEvent(e));
  const other = createEvent(profile);
  other.budget[0].actual = -10;
  assert.throws(() => validateEvent(other));
});
test('all interpolated user and AI text can be escaped as inert HTML', () => {
  assert.equal(
    escapeHTML('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
  assert.equal(escapeHTML("A&B's"), 'A&amp;B&#39;s');
});
