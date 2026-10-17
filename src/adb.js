const { execFile } = require('child_process');

function run(args, timeout = 300000) {
  return new Promise((resolve, reject) => {
    execFile('adb', args, { timeout, maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err && err.code === 'ENOENT') {
        return reject(new Error('adb not found. Install Android platform-tools and add adb to your PATH.'));
      }
      // du exits non-zero on unreadable files but still prints useful output
      if (err && !stdout) return reject(err);
      resolve(stdout);
    });
  });
}

function parseDevices(output) {
  return output
    .split('\n')
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter((p) => p.length >= 2)
    .map(([serial, state]) => ({ serial, state }));
}

// Parses `du -k` output ("<kb>\t<path>") into entries sorted by size (bytes).
function parseDu(output, dir) {
  const base = dir.replace(/\/+$/, '') || '/';
  const entries = [];
  for (const line of output.split('\n')) {
    const m = line.replace(/\r$/, '').match(/^(\d+)\s+(.+)$/);
    if (!m) continue;
    const path = m[2];
    if (path === base || path === dir) continue;
    entries.push({ path, name: path.slice(path.lastIndexOf('/') + 1), size: Number(m[1]) * 1024 });
  }
  return entries.sort((a, b) => b.size - a.size);
}

function shellQuote(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

async function listDevices() {
  return parseDevices(await run(['devices']));
}

async function analyze(serial, dir) {
  const out = await run(['-s', serial, 'shell', `du -k -d 1 ${shellQuote(dir)} 2>/dev/null`]);
  return parseDu(out, dir);
}

module.exports = { parseDevices, parseDu, listDevices, analyze };
