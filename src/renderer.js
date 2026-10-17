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

async function browse(dir) {
  const serial = $('device').value;
  if (!serial) return;
  current = dir;
  $('path').textContent = dir;
  $('status').textContent = 'Analyzing…';
  $('list').textContent = '';
  try {
    const entries = await window.api.analyze(serial, dir);
    const max = entries.length ? entries[0].size || 1 : 1;
    for (const e of entries) {
      const li = document.createElement('li');
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.width = `${(e.size / max) * 100}%`;
      const name = document.createElement('span');
      name.textContent = e.name;
      const size = document.createElement('span');
      size.textContent = fmt(e.size);
      li.append(bar, name, size);
      li.onclick = () => browse(e.path);
      $('list').appendChild(li);
    }
    $('status').textContent = entries.length ? '' : 'Empty or not a directory.';
  } catch (e) {
    $('status').textContent = e.message;
  }
}

$('refresh').onclick = loadDevices;
$('device').onchange = () => browse(ROOT);
$('up').onclick = () => {
  const parent = current.slice(0, current.lastIndexOf('/')) || '/';
  if (current !== '/') browse(parent);
};
loadDevices();
