export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  leaf: '<path d="M12 21V9m0 6C4 16 2 10 4 5c6 0 9 4 8 10Zm0-4c0-7 4-10 9-9 1 6-3 9-9 9Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  wallet: '<path d="M20 8V5H5a2 2 0 0 0 0 4h16v11H5a2 2 0 0 1-2-2V7m18 6h-6v3h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/>',
  idea: '<path d="M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 2H9Z"/>',
  sparkle: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  down: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 8 15 8 15S25 10 20 5Z"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  print: '<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Z"/>',
  trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'
};
export function icon(name, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`; }
export const illustration = `<svg class="gather-art" viewBox="0 0 360 250" fill="none" aria-hidden="true"><path d="M74 242V118a106 106 0 0 1 212 0v124" fill="#e4e8d6"/><path d="M92 242V122a88 88 0 0 1 176 0v120" stroke="#a6b69a"/><path d="M35 49q140 99 285-12" stroke="#59745b"/><g fill="#c59a50"><path d="m68 70 7 17 9-10ZM118 89l8 18 10-16ZM169 94l11 18 9-18ZM223 82l14 14 5-19ZM270 61l17 9-1-19Z"/></g><ellipse cx="184" cy="233" rx="126" ry="9" fill="#d6ddc7"/><path d="M101 175v56m160-56v56" stroke="#5d694f" stroke-width="5"/><path d="M87 169h187v19H87Z" fill="#fdf9ed"/><path d="m87 184 8 24 14-9 14 13 16-10 17 12 16-10 15 10 17-11 15 10 16-13 17 9 12-23" fill="#fdf9ed"/><ellipse cx="180" cy="168" rx="94" ry="9" fill="#fffdf5"/><path d="M177 165v-38m0 13c-18-2-25-14-19-20 15-2 20 10 19 20Zm0 8c19-2 26-13 21-19-13-2-20 10-21 19Z" stroke="#537350" stroke-width="2" fill="#94ab7e"/><path d="M165 150h25l-4 17h-17Z" fill="#bf7856"/><path d="M123 164v-24m-5 24h10m-5-25c-10-7-9-15 0-15s9 8 0 15Zm115 25v-24m-5 24h10m-5-25c-10-7-9-15 0-15s9 8 0 15Z" stroke="#9a936b" stroke-width="1.5"/><path d="M47 232v-60m0 29c-24 0-28-22-20-31 19 4 22 17 20 31Zm0 15c24 0 32-21 23-32-19 4-25 18-23 32Z" fill="#839b6d" stroke="#57714c" stroke-width="2"/><path d="M32 220h32l-5 20H37Z" fill="#bd795b"/><circle cx="291" cy="110" r="6" fill="#c6974e"/><path d="m310 154 4 7 7 4-7 4-4 7-4-7-7-4 7-4Z" fill="#c6974e"/></svg>`;
