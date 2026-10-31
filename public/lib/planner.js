export const TYPES = ['wedding', 'birthday', 'community'];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
export const uid = () => globalThis.crypto.randomUUID();
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysUntil(date, from = today()) {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
}
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function money(amount, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
const allocations = {
  wedding: [
    ['Venue', 25],
    ['Food & drinks', 30],
    ['Decor & flowers', 12],
    ['Photography', 10],
    ['Entertainment', 6],
    ['Invitations & favors', 4],
    ['Transport & logistics', 3],
    ['Contingency', 10],
  ],
  birthday: [
    ['Venue', 15],
    ['Food & drinks', 30],
    ['Decor & flowers', 15],
    ['Cake & treats', 10],
    ['Entertainment', 12],
    ['Invitations & favors', 8],
    ['Contingency', 10],
  ],
  community: [
    ['Venue', 15],
    ['Food & drinks', 20],
    ['Equipment & sound', 20],
    ['Activities', 12],
    ['Permits & safety', 10],
    ['Outreach', 8],
    ['Accessibility', 5],
    ['Contingency', 10],
  ],
};
const taskTemplates = {
  wedding: [
    ['Agree the guest list and priorities', 90, 'People'],
    ['Shortlist venues and check accessibility', 75, 'Venue'],
    ['Compare catering quotes and dietary options', 60, 'Vendors'],
    ['Book photography and essential vendors', 45, 'Vendors'],
    ['Send invitations and collect RSVPs', 30, 'People'],
    ['Confirm seating, transport and rain backup', 14, 'Logistics'],
    ['Share the run of show with every vendor', 7, 'Logistics'],
    ['Confirm headcount and outstanding payments', 2, 'Budget'],
  ],
  birthday: [
    ['Choose a theme and guest list', 30, 'People'],
    ['Reserve a venue or prepare your space', 25, 'Venue'],
    ['Arrange food, cake and allergy alternatives', 21, 'Vendors'],
    ['Send invitations and request RSVPs', 14, 'People'],
    ['Plan age-appropriate games and activities', 10, 'Activities'],
    ['Confirm decor and a weather backup', 7, 'Logistics'],
    ['Confirm numbers and prepare party supplies', 2, 'Logistics'],
  ],
  community: [
    ['Define the purpose and organizing team', 60, 'People'],
    ['Check venue permission, permits and insurance needs', 45, 'Venue'],
    ['Agree accessibility and safeguarding arrangements', 30, 'Logistics'],
    ['Recruit volunteers and assign responsibilities', 25, 'People'],
    ['Announce the event and open registration', 21, 'People'],
    ['Confirm equipment, food and waste collection', 14, 'Vendors'],
    ['Brief volunteers on safety and contingency plans', 7, 'Logistics'],
    ['Check weather, attendance and venue readiness', 2, 'Logistics'],
  ],
};
function boundedText(value, name, max = 120, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    throw new Error(
      `${name} must be ${required ? 'non-empty and ' : ''}at most ${max} characters.`,
    );
  return value.trim();
}
export function validateProfile(input) {
  if (!input || typeof input !== 'object') throw new Error('An event profile is required.');
  const name = boundedText(input.name, 'Event name');
  const location = boundedText(input.location, 'Location');
  if (!TYPES.includes(input.type)) throw new Error('Choose wedding, birthday or community.');
  if (!CURRENCIES.includes(input.currency)) throw new Error('Choose a supported currency.');
  if (!validDate(input.date)) throw new Error('Choose a valid event date.');
  const budget = Number(input.budget),
    guests = Number(input.guests);
  if (!Number.isInteger(budget) || budget < 100 || budget > 100000000)
    throw new Error('Budget must be a whole number between 100 and 100,000,000.');
  if (!Number.isInteger(guests) || guests < 1 || guests > 100000)
    throw new Error('Guest count must be between 1 and 100,000.');
  const preferences = boundedText(input.preferences ?? '', 'Preferences', 1500, false);
  const style = [
    'Intimate & relaxed',
    'Classic & elegant',
    'Playful & colorful',
    'Simple & sustainable',
  ].includes(input.style)
    ? input.style
    : 'Intimate & relaxed';
  return {
    name,
    location,
    type: input.type,
    currency: input.currency,
    date: input.date,
    budget,
    guests,
    preferences,
    style,
    outdoor: Boolean(input.outdoor),
  };
}
export function allocateBudget(profile) {
  let remaining = profile.budget;
  return allocations[profile.type].map(([name, weight], i, all) => {
    const planned = i === all.length - 1 ? remaining : Math.floor((profile.budget * weight) / 100);
    remaining -= planned;
    return { id: uid(), name, planned, actual: 0 };
  });
}
export function createEvent(input, from = today()) {
  const profile = validateProfile(input);
  return {
    id: uid(),
    profile,
    createdAt: new Date().toISOString(),
    budget: allocateBudget(profile),
    tasks: taskTemplates[profile.type].map(([title, before, category]) => ({
      id: uid(),
      title,
      date: addDays(profile.date, -before) < from ? from : addDays(profile.date, -before),
      category,
      done: false,
    })),
    vendors: [],
    savedIdeas: [],
    messages: [],
  };
}
export function totals(event) {
  const planned = event.budget.reduce((sum, b) => sum + b.planned, 0);
  const actual = event.budget.reduce((sum, b) => sum + b.actual, 0);
  return {
    planned,
    actual,
    remaining: event.profile.budget - actual,
    unallocated: event.profile.budget - planned,
    perGuest: event.profile.budget / event.profile.guests,
  };
}
export function insights(event, from = today()) {
  const { profile: p } = event,
    sum = totals(event),
    days = daysUntil(p.date, from),
    result = [];
  if (sum.remaining < 0)
    result.push({
      level: 'warn',
      title: 'Spending is above your budget',
      text: `${money(-sum.remaining, p.currency)} over the limit. Review food, venue and optional extras before making new commitments.`,
    });
  else if (sum.unallocated < 0)
    result.push({
      level: 'warn',
      title: 'Your allocations exceed the budget',
      text: `Reduce planned categories by ${money(-sum.unallocated, p.currency)} to bring the plan back within your limit.`,
    });
  const overdue = event.tasks.filter((t) => !t.done && t.date < from).length;
  if (overdue)
    result.push({
      level: 'warn',
      title: `${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'}`,
      text: 'Review the timeline and move unfinished tasks to realistic dates.',
    });
  if (days >= 0 && days <= 14)
    result.push({
      level: 'warn',
      title: 'The final stretch',
      text: 'Prioritize headcount, essential bookings, dietary needs and the day-of schedule. Skip optional extras until these are settled.',
    });
  if (days < 0)
    result.push({
      level: 'info',
      title: 'Time to wrap things up',
      text: 'Reconcile final payments, thank your helpers and export the plan for your records.',
    });
  if (p.outdoor)
    result.push({
      level: 'info',
      title: 'Make room for a weather backup',
      text: 'Confirm covered space, safe access and a clear decision time with your venue. No live weather forecast is connected.',
    });
  if (!event.vendors.some((v) => v.status === 'Booked'))
    result.push({
      level: 'info',
      title: 'Start with the essentials',
      text: 'Compare venue and food quotes first. Ask about taxes, cancellation terms, access and what is included.',
    });
  return result.slice(0, 4);
}
export function localIdeas(profile) {
  const p = profile,
    budget = money(Math.round(p.budget * 0.02), p.currency);
  const themes = {
    wedding: [
      [
        'A table full of stories',
        'Use handwritten memories as table cards and invite guests to add one of their own.',
        'Connection',
      ],
      [
        'A shared family menu',
        'Ask each family for a favorite dish. Discuss a small seasonal menu with your caterer.',
        'Food',
      ],
      [
        'A golden-hour gathering',
        'Keep the ceremony intimate, then make room for conversation and a shared playlist.',
        'Atmosphere',
      ],
    ],
    birthday: [
      [
        'The year in little moments',
        'Create a photo and memory trail, ending with notes from friends and family.',
        'Connection',
      ],
      [
        'Make something together',
        'Set up a supervised craft or cupcake station with reusable tools and allergy labels.',
        'Activities',
      ],
      [
        'A favorite-things party',
        'Build the playlist, snacks and small games around the guest of honor’s interests.',
        'Personal touches',
      ],
    ],
    community: [
      [
        'A neighborhood story wall',
        'Let people share a local memory, a photo or a hope for the neighborhood.',
        'Connection',
      ],
      [
        'A skill-swap corner',
        'Invite volunteers to run short, accessible demonstrations with a printed schedule.',
        'Activities',
      ],
      [
        'Bring a cup, share a table',
        'Arrange refill water points and reusable tableware with an accessible serving station.',
        'Sustainability',
      ],
    ],
  };
  return themes[p.type].map(([title, description, category], i) => ({
    id: `local-${p.type}-${i}`,
    title,
    description: `${description} Adapt it for ${p.guests} guests in ${p.location}. ${p.style === 'Simple & sustainable' ? 'Borrow or reuse materials where possible.' : 'Keep participation optional and include a quiet seating area.'}`,
    category,
    cost: `Suggested cap: ${budget}`,
    source: 'Planning guide',
  }));
}
export function localAdvice(event, question) {
  const p = event.profile,
    sum = totals(event),
    q = question.toLowerCase();
  if (/budget|save|cost|cheap|spend|money/.test(q))
    return `Your ${p.type} budget is ${money(p.budget, p.currency)} for ${p.guests} guests (${money(sum.perGuest, p.currency)} per guest). Recorded spending is ${money(sum.actual, p.currency)}. ${sum.remaining < 0 ? `You are ${money(-sum.remaining, p.currency)} over budget.` : `${money(sum.remaining, p.currency)} remains.`}\n\nCompare food and venue quotes first, reduce optional decor, and protect a 10% contingency. These allocations are planning estimates, not local market quotes. Edit the Budget tab to test a smaller guest list or new category amounts.`;
  if (/vendor|cater|venue|photograph/.test(q))
    return `For your ${p.type} in ${p.location}, request at least two comparable quotes for each essential service. Include the date (${dateLabel(p.date)}), ${p.guests} guests and your preferences.\n\nCheck taxes, overtime, deposit terms, cancellation, accessibility and dietary arrangements. Track candidates in Vendors; “Booked” should mean you have independently confirmed the agreement. Vendor quotes are separate from actual spending, so record payments in Budget.`;
  if (/idea|theme|personal|decor|activity/.test(q))
    return localIdeas(p)
      .map((i) => `${i.title}\n${i.description}`)
      .join('\n\n');
  const next = event.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  return `For ${p.name}, you have ${daysUntil(p.date)} days until ${dateLabel(p.date)}. ${next.length ? `Your next priorities:\n${next.map((t, i) => `${i + 1}. ${t.title} — ${dateLabel(t.date)}`).join('\n')}` : 'Your checklist is complete. Confirm the final schedule with your helpers.'}\n\n${p.outdoor ? 'Arrange a covered weather backup and communicate the decision time. ' : ''}Use the timeline to assign realistic deadlines. ${p.preferences ? `Keep these requirements in every brief: ${p.preferences}` : 'Add dietary, accessibility and cultural preferences to your event brief for a more personal plan.'}\n\nThis is rule-based planning guidance. Connect Gemini for an open-ended response to your exact question.`;
}

/** Strict import boundary: only known, bounded fields are copied into application state. */
export function validateEvent(raw) {
  const profile = validateProfile(raw?.profile);
  const list = (value, max, label) => {
    if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${label}.`);
    return value;
  };
  const text = (v, max = 200) => boundedText(v, 'Imported text', max, false);
  const amount = (v) => {
    if (!Number.isInteger(v) || v < 0 || v > 100000000)
      throw new Error('Invalid amount in backup.');
    return v;
  };
  const date = (v) => {
    if (!validDate(v)) throw new Error('Invalid date in backup.');
    return v;
  };
  return {
    id: uid(),
    profile,
    createdAt: new Date().toISOString(),
    budget: list(raw.budget, 30, 'budget').map((b) => ({
      id: uid(),
      name: text(b.name, 80),
      planned: amount(b.planned),
      actual: amount(b.actual),
    })),
    tasks: list(raw.tasks, 200, 'tasks').map((t) => ({
      id: uid(),
      title: text(t.title),
      date: date(t.date),
      category: text(t.category, 40),
      done: t.done === true,
    })),
    vendors: list(raw.vendors, 100, 'vendors').map((v) => ({
      id: uid(),
      name: text(v.name, 100),
      category: text(v.category, 80),
      quote: amount(v.quote),
      contact: text(v.contact, 150),
      notes: text(v.notes, 800),
      status: ['Shortlisted', 'Contacted', 'Booked'].includes(v.status) ? v.status : 'Shortlisted',
      checks: {
        terms: v.checks?.terms === true,
        access: v.checks?.access === true,
        inclusions: v.checks?.inclusions === true,
      },
    })),
    savedIdeas: list(raw.savedIdeas, 50, 'ideas').map((i) => ({
      id: uid(),
      title: text(i.title, 120),
      description: text(i.description, 1000),
      category: text(i.category, 60),
      cost: text(i.cost, 120),
      source: text(i.source, 60),
    })),
    messages: [],
  };
}
