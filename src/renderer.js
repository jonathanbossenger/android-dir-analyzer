const ROOT = '/sdcard';
let current = ROOT;

const $ = (id) => document.getElementById(id);

function fmt(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(i ? 1 : 0)} ${units[i]}`;
}

async function loadDevices() {
  const sel = $('device');
  sel.textContent = '';
  try {
    const devices = (await window.api.devices()).filter((d) => d.state === 'device');
    for (const d of devices) sel.add(new Option(d.serial, d.serial));
    $('status').textContent = devices.length ? '' : 'No authorized Android device found. Enable USB debugging and connect a device.';
    if (devices.length) await browse(ROOT);
  } catch (e) {
    $('status').textContent = e.message;
  }
}

let token = 0;

async function browse(dir) {
  const serial = $('device').value;
  if (!serial) return;
  const mine = ++token;
  $('status').textContent = `Analyzing ${dir}…`;
  try {
    const entries = await window.api.analyze(serial, dir);
    if (mine !== token) return;
    current = dir;
    $('path').textContent = dir;
    $('list').textContent = '';
    const max = entries.length ? entries[0].size || 1 : 1;
    for (const e of entries) {
      const li = document.createElement('li');
      const row = document.createElement(e.isDir ? 'button' : 'div');
      row.className = 'row';
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.width = `${(e.size / max) * 100}%`;
      const name = document.createElement('span');
      name.textContent = e.isDir ? `${e.name}/` : e.name;
      const size = document.createElement('span');
      size.textContent = fmt(e.size);
      row.append(bar, name, size);
      if (e.isDir) row.onclick = () => browse(e.path);
      li.appendChild(row);
      $('list').appendChild(li);
    }
    $('status').textContent = entries.length
      ? 'Sizes may be too small where folders are unreadable (e.g. Android/data).'
      : 'Empty folder.';
  } catch (e) {
    if (mine !== token) return;
    $('status').textContent = e.message;
  }
}

$('refresh').onclick = loadDevices;
$('device').onchange = () => browse(ROOT);
$('up').onclick = () => {
  if (current !== ROOT) browse(current.slice(0, current.lastIndexOf('/')) || ROOT);
};
loadDevices();
