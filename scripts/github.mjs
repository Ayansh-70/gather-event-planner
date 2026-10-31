// Uses the existing Git credential manager; credentials never reach logs or disk.
import { spawnSync } from 'node:child_process';
const result = spawnSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }
});
const fields = Object.fromEntries((result.stdout || '').trim().split('\n').map(line => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).trim()];
}));
if (!fields.password) { console.error('No existing GitHub credential is available.'); process.exit(1); }
const headers = { Authorization: `Bearer ${fields.password}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${data.message}`);
  return data;
}
try {
  const user = await api('/user');
  if (user.login.toLowerCase() !== 'ayansh-70') throw new Error(`Authenticated account is ${user.login}; expected Ayansh-70.`);
  console.log(`Authenticated GitHub account: ${user.login}`);
  if (process.argv[2] === 'create') {
    const repo = await api('/user/repos', { method: 'POST', body: JSON.stringify({ name: 'gather-event-planner', description: 'GenAI-powered wedding, birthday and community event planner | Virtual Prompt Wars', private: false, auto_init: false }) });
    console.log(JSON.stringify({ url: repo.html_url, clone: repo.clone_url, private: repo.private }));
  } else if (process.argv[2] === 'verify') {
    const repo = await api('/repos/Ayansh-70/gather-event-planner');
    const branches = await api('/repos/Ayansh-70/gather-event-planner/branches');
    console.log(JSON.stringify({ url: repo.html_url, private: repo.private, sizeKB: repo.size, branches: branches.map(b => b.name) }));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
