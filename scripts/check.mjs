import { readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const roots = ['public', 'server', 'scripts', 'test'];
let bytes = 0, checked = 0;
async function inspect(dir) {
  for (const item of await readdir(dir, { withFileTypes:true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await inspect(path);
    else {
      bytes += (await stat(path)).size;
      if (/\.m?js$/.test(path)) {
        const result = spawnSync(process.execPath, ['--check', path], { encoding:'utf8' });
        if(result.status) { console.error(result.stderr); process.exitCode=1; }
        checked++;
      }
    }
  }
}
for (const root of roots) await inspect(root);
console.log(`Checked ${checked} JavaScript files. Source assets: ${(bytes/1024).toFixed(1)} KB.`);
if(bytes >= 10_000_000) { console.error('Source exceeds the challenge size limit.'); process.exitCode=1; }
