const test = require('node:test');
const assert = require('node:assert');
const { parseDu, parseDevices, parseAnalysis } = require('../src/adb');

test('parseDu sorts by size and skips the directory itself', () => {
  const out = '10\t/sdcard/a\n300\t/sdcard/b c\n310\t/sdcard\n';
  const r = parseDu(out, '/sdcard');
  assert.deepStrictEqual(r.map((e) => [e.name, e.size]), [['b c', 307200], ['a', 10240]]);
});

test('parseDevices parses adb output', () => {
  const r = parseDevices('List of devices attached\nABC123\tdevice\nXYZ\tunauthorized\n\n');
  assert.deepStrictEqual(r, [{ serial: 'ABC123', state: 'device' }, { serial: 'XYZ', state: 'unauthorized' }]);
});

test('parseDu handles CRLF, trailing slash and root', () => {
  const r = parseDu('5\t/sdcard//x\r\n9\t/sdcard/\r\n', '/sdcard/');
  assert.deepStrictEqual(r.map((e) => [e.path, e.size]), [['/sdcard/x', 5120]]);
  const root = parseDu('4\t/a\n8\t/\n', '/');
  assert.deepStrictEqual(root.map((e) => e.path), ['/a']);
});

test('parseAnalysis marks files vs directories', () => {
  const out = '100\t/sdcard/DCIM/v.mp4\n50\t/sdcard/DCIM/sub\n150\t/sdcard/DCIM\n@@DIRS@@\nsub/\nv.mp4\n';
  const r = parseAnalysis(out, '/sdcard/DCIM');
  assert.deepStrictEqual(r.map((e) => [e.name, e.isDir]), [['v.mp4', false], ['sub', true]]);
});

test('parseAnalysis rejects truncated output', () => {
  assert.throws(() => parseAnalysis('100\t/sdcard/a\n', '/sdcard'));
});
