const test = require('node:test');
const assert = require('node:assert');
const { parseDu, parseDevices } = require('../src/adb');

test('parseDu sorts by size and skips the directory itself', () => {
  const out = '10\t/sdcard/a\n300\t/sdcard/b c\n310\t/sdcard\n';
  const r = parseDu(out, '/sdcard');
  assert.deepStrictEqual(r.map((e) => [e.name, e.size]), [['b c', 307200], ['a', 10240]]);
});

test('parseDevices parses adb output', () => {
  const r = parseDevices('List of devices attached\nABC123\tdevice\nXYZ\tunauthorized\n\n');
  assert.deepStrictEqual(r, [{ serial: 'ABC123', state: 'device' }, { serial: 'XYZ', state: 'unauthorized' }]);
});
