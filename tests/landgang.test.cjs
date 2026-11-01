const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = fs.readFileSync(require('node:path').resolve(__dirname,'../game.js'),'utf8');
test('Landgang: Touch-Joystick setzt nur den eigenen Pointer zurück', () => {
  assert.match(source, /activeStickPointer = e\.pointerId/);
  assert.match(source, /activeStickPointer === e\.pointerId && S/);
  assert.match(source, /if \(activeStickPointer === null \|\| \(e && e\.pointerId !== activeStickPointer\)\) return/);
});
test('Landgang: Abbruch und Capture-Verlust lösen das Bewegungsfeld und Aktionen', () => {
  assert.match(source, /\['pointerup', 'pointercancel', 'lostpointercapture'\]\) stick\.addEventListener\(name, resetStick\)/);
  assert.match(source, /\['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'\]\) b\.addEventListener\(name, releaseAction\)/);
});
