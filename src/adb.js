const { execFile } = require('child_process');

function run(args, timeout = 300000) {
  return new Promise((resolve, reject) => {
    execFile('adb', args, { timeout, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && err.code === 'ENOENT') {
        return reject(new Error('adb not found. Install Android platform-tools and add adb to your PATH.'));
      }
      if (err && (err.killed || err.signal)) {
        return reject(new Error('The scan timed out or was interrupted.'));
      }
      if (err && /^(adb: |error: )/m.test(stderr || '')) {
        return reject(new Error(stderr.trim()));
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

const DIRS_MARKER = '@@DIRS@@';

function normalize(p) {
  return p.replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
}

// Parses `du -a -k` output ("<kb>\t<path>") into entries sorted by size (bytes).
// dirNames is a Set of child names that are directories.
function parseDu(output, dir, dirNames = new Set()) {
  const base = normalize(dir);
  const prefix = base === '/' ? '/' : base + '/';
  const entries = [];
  for (const line of output.split('\n')) {
    const m = line.replace(/\r$/, '').match(/^(\d+)\s+(.+)$/);
    if (!m) continue;
    const path = normalize(m[2]);
    if (path === base || !path.startsWith(prefix)) continue;
    const name = path.slice(prefix.length);
    if (!name || name.includes('/')) continue;
    entries.push({ path, name, size: Number(m[1]) * 1024, isDir: dirNames.has(name) });
  }
  return entries.sort((a, b) => b.size - a.size);
}

// Parses the combined du + `ls -1Ap` output produced by analyze().
function parseAnalysis(output, dir) {
  const text = output.replace(/\r/g, '');
  const idx = text.indexOf(DIRS_MARKER);
  if (idx === -1) throw new Error('Incomplete output from device; the scan did not finish.');
  const dirNames = new Set(
    text
      .slice(idx + DIRS_MARKER.length)
      .split('\n')
      .filter((l) => l.length > 1 && l.endsWith('/'))
      .map((l) => l.slice(0, -1))
  );
  return parseDu(text.slice(0, idx), dir, dirNames);
}

function shellQuote(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

async function listDevices() {
  return parseDevices(await run(['devices']));
}

async function analyze(serial, dir) {
  const q = shellQuote(dir);
  const base = dir.endsWith('/') ? dir : dir + '/';
  const script = `du -a -k -H -d 1 ${q} 2>/dev/null; echo ${DIRS_MARKER}; ls -1Ap ${shellQuote(base)} 2>/dev/null`;
  return parseAnalysis(await run(['-s', serial, 'shell', script]), dir);
}

module.exports = { parseDevices, parseDu, parseAnalysis, listDevices, analyze };
