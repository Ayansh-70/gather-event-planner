import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('organizer can create, update and navigate a complete event in the DOM', async (t) => {
  const dom = new JSDOM('<div id="app"></div><dialog id="modal"></dialog><div id="toast"></div>', {
    url: 'http://localhost:3000',
  });
  const { window } = dom;
  for (const key of ['window', 'document', 'localStorage', 'FormData', 'Blob'])
    globalThis[key] = key === 'window' ? window : window[key];
  globalThis.fetch = async () => ({
    json: async () => ({ aiConfigured: false, accessCodeRequired: false }),
  });
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  await import('../public/app.js');
  const query = (selector) => {
    const el = document.querySelector(selector);
    assert.ok(el, `Missing ${selector}`);
    return el;
  };
  const click = (selector) => query(selector).click();
  const value = (name, value) => {
    query(`[name="${name}"]`).value = value;
  };
  const submit = (id) =>
    query(`#${id}`).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const change = (el) => el.dispatchEvent(new window.Event('change', { bubbles: true }));
  const saved = () => JSON.parse(localStorage.getItem('gather.events.v1')).events;

  await t.test('sample dashboard exposes budget and every workspace', () => {
    assert.match(query('main').textContent, /Meera & Arjun/);
    assert.equal(document.querySelectorAll('.nav-item').length, 6);
    assert.equal(query('progress').getAttribute('aria-label'), 'Completed tasks');
  });
  await t.test('create a birthday from the event form', () => {
    click('[data-action="new"]');
    value('name', 'A birthday to remember');
    value('type', 'birthday');
    value('location', 'Delhi');
    value('budget', '30000');
    value('guests', '30');
    submit('event-form');
    assert.equal(query('#modal').open, false);
    assert.match(query('.event-hero').textContent, /A birthday to remember/);
    assert.equal(saved().length, 2);
    assert.ok(saved()[1].budget.some((b) => b.name === 'Cake & treats'));
  });
  await t.test('edit actual spending and show an over-budget state', () => {
    click('[data-page="budget"]');
    const input = query('[data-field="actual"]');
    input.value = '31000';
    change(input);
    assert.match(query('main').textContent, /-₹1,000/);
    assert.equal(saved()[1].budget[0].actual, 31000);
  });
  await t.test('custom task can be completed and filtered', () => {
    click('[data-page="timeline"]');
    click('[data-action="add-task"]');
    value('title', 'Arrange accessible transport');
    value('category', 'Logistics');
    submit('task-form');
    assert.equal(saved()[1].tasks.length, 8);
    const checkbox = query('[data-task]');
    checkbox.focus();
    checkbox.checked = true;
    change(checkbox);
    assert.equal(
      document.activeElement.getAttribute('data-task'),
      checkbox.getAttribute('data-task'),
    );
    click('[data-filter="done"]');
    assert.equal(document.querySelectorAll('.task-row').length, 1);
  });
  await t.test('vendor booking and review checks do not alter actual payments', () => {
    click('[data-page="vendors"]');
    click('[data-action="add-vendor"]');
    value('name', 'Local venue candidate');
    value('quote', '5000');
    value('status', 'Booked');
    submit('vendor-form');
    const checkbox = query('[data-check="terms"]');
    checkbox.checked = true;
    change(checkbox);
    assert.equal(saved()[1].vendors[0].status, 'Booked');
    assert.equal(saved()[1].vendors[0].checks.terms, true);
    assert.equal(saved()[1].budget[0].actual, 31000);
  });
  await t.test('ideas can be saved and removed', () => {
    click('[data-page="ideas"]');
    click('[data-action="save-idea"]');
    assert.equal(saved()[1].savedIdeas.length, 1);
    click('[data-action="remove-idea"]');
    assert.equal(saved()[1].savedIdeas.length, 0);
  });
  await t.test('local assistant returns contextual guidance and escapes hostile text', async () => {
    click('[data-page="assistant"]');
    query('#question').value = '<img src=x onerror=alert(1)> Help me reduce costs';
    submit('chat-form');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.match(query('.chat-log').textContent, /30 guests/);
    assert.equal(document.querySelectorAll('.chat-log img').length, 0);
    assert.match(query('.chat-log').textContent, /<img/);
    assert.deepEqual(saved()[1].messages, []);
  });
  await t.test('new event persists alongside sample and every navigation target renders', () => {
    for (const page of ['overview', 'budget', 'timeline', 'vendors', 'ideas', 'assistant']) {
      click(`[data-page="${page}"]`);
      assert.ok(query('main').textContent.length > 100);
    }
    assert.equal(saved().length, 2);
    const selected = query('#event-select');
    selected.value = '0';
    change(selected);
    click('[data-page="overview"]');
    assert.match(query('.event-hero').textContent, /Meera & Arjun/);
  });
  window.close();
});
