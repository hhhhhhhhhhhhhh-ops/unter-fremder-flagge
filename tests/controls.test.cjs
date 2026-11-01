const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const gameCode = fs.readFileSync(path.resolve(__dirname, '../game.js'), 'utf8');

class Emitter {
  constructor() { this.listeners = {}; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type, attrs = {}) {
    const e = { type, pointerId: 1, button: 0, clientX: 100, clientY: 100,
      preventDefault() { this.prevented = true; }, ...attrs };
    for (const fn of this.listeners[type] || []) fn(e);
    return e;
  }
}
class Element extends Emitter {
  constructor(id) {
    super(); this.id = id; this.hidden = false; this.dataset = {};
    this.style = {}; this.firstElementChild = { style: {} };
    const classes = new Set();
    this.classList = { add(v) { classes.add(v); }, remove(v) { classes.delete(v); }, contains(v) { return classes.has(v); }, toggle(v, force) { if (force) classes.add(v); else classes.delete(v); } };
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 132, height: 132 }; }
  setPointerCapture(id) { this.capture = id; }
}
function rig(withGamepad = false) {
  const window = new Emitter();
  const document = new Emitter();
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  const touchGun = new Element('gun'); touchGun.dataset.a = 'gun';
  const touchUse = new Element('use'); touchUse.dataset.a = 'use';
  const touchSilent = new Element('silent'); touchSilent.dataset.a = 'silent';
  document.getElementById = el;
  document.querySelectorAll = sel => sel === '#touch button' ? [touchGun, touchUse, touchSilent] : [];
  document.readyState = 'loading'; document.hidden = false;
  let frame;
  let gamepad = withGamepad ? { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({length: 17}, () => ({pressed:false, value:0})) } : null;
  Object.assign(window, { THREE: { Color: class {}, Vector3: class { set() { return this; } project() { return this; } } },
    innerWidth: 1024, addEventListener: window.addEventListener.bind(window) });
  const ctx = {
    window, document, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { getGamepads: () => gamepad ? [gamepad] : [] },
    addEventListener: window.addEventListener.bind(window),
    matchMedia: () => ({matches:false}), innerWidth: 1024, innerHeight: 768,
    requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() {},
    setTimeout() {}, setInterval() {}, clearInterval() {}, performance: { now: () => 0 },
    console, Math, Date, Uint8Array, Float32Array
  };
  vm.createContext(ctx);
  vm.runInContext(gameCode, ctx, {filename:'game.js'});
  const F = window.F;
  F.audio.init = () => {};
  F.G.running = true; F.G.paused = false;
  F.G.p = {thr:0, silent:false, y:0};
  F.ui.initHud();
  return { F, window, document, el, touchGun, touchUse, touchSilent, getGamepad: () => gamepad,
    setGamepad: p => { gamepad = p; }, frame: () => { if (!frame) throw Error('No gamepad poll frame'); const cb = frame; cb(16); } };
}

test('Tastatur steuert Gas und Ruder; Loslassen beendet die Eingabe', () => {
  const t = rig();
  t.window.dispatch('keydown', {code:'KeyW'});
  t.window.dispatch('keydown', {code:'KeyD'});
  assert.equal(t.F.G.input.thr, 1);
  assert.equal(t.F.G.input.steer, 1);
  t.window.dispatch('keyup', {code:'KeyW'});
  t.window.dispatch('keyup', {code:'KeyD'});
  assert.equal(t.F.G.input.thr, 0);
  assert.equal(t.F.G.input.steer, 0);
});

test('Fokusverlust beendet Touch-Ruder, Geschütz und gehaltene Aktion', () => {
  const t = rig();
  t.el('stick').dispatch('pointerdown', {pointerId:9, clientX:130, clientY:66});
  t.touchGun.dispatch('pointerdown', {pointerId:10});
  t.touchUse.dispatch('pointerdown', {pointerId:11});
  assert(t.F.G.input.axisSteer > 0.8);
  assert.equal(t.F.G.input.fire, true);
  assert.equal(t.F.G.input.keys.KeyF, true);
  t.window.dispatch('blur');
  assert.equal(t.F.G.input.axisSteer, 0);
  assert.equal(t.F.G.input.axisThr, 0);
  assert.equal(t.F.G.input.touchActive, false);
  assert.equal(t.F.G.input.fire, false);
  assert.equal(t.F.G.input.keys.KeyF, false);
});

test('Abgebrochener Sehrohr-Klick feuert keinen Torpedo', () => {
  const t = rig(); let shots = 0;
  t.F.G.fireTorp = () => { shots++; };
  t.F.G.cam.scope = true;
  const gl = t.el('gl');
  gl.dispatch('pointerdown', {pointerId:2, button:0, clientX:100, clientY:100});
  gl.dispatch('pointercancel', {pointerId:2, button:0});
  assert.equal(shots, 0);
});

test('Fremder Pointer kann aktiven Sehrohr-Klick nicht abschließen', () => {
  const t = rig(); let shots = 0;
  t.F.G.fireTorp = () => { shots++; };
  t.F.G.cam.scope = true;
  const gl = t.el('gl');
  gl.dispatch('pointerdown', {pointerId:2, button:0});
  gl.dispatch('pointerup', {pointerId:5, button:0});
  assert.equal(shots, 0);
  gl.dispatch('pointerup', {pointerId:2, button:0});
  assert.equal(shots, 1);
});

test('Gamepad-Abfrage überschreibt keine aktive Touch-Joystick-Eingabe', () => {
  const t = rig(true);
  t.el('stick').dispatch('pointerdown', {pointerId:7, clientX:125, clientY:66});
  assert(t.F.G.input.axisSteer > 0.8);
  t.frame();
  assert(t.F.G.input.axisSteer > 0.8);
  assert.equal(t.F.G.input.touchActive, true);
  t.el('stick').dispatch('pointerup', {pointerId:7});
  assert.equal(t.F.G.input.axisSteer, 0);
  assert.equal(t.F.G.input.touchActive, false);
});

test('Verlust der Touch-Button-Pointer-Capture stoppt Dauerfeuer', () => {
  const t = rig();
  t.touchGun.dispatch('pointerdown', {pointerId:4});
  assert.equal(t.F.G.input.fire, true);
  t.touchGun.dispatch('lostpointercapture', {pointerId:4});
  assert.equal(t.F.G.input.fire, false);
});

test('Gamepad-Disconnect beendet Geschütz- und Aktionstaste', () => {
  const t = rig(true);
  t.getGamepad().buttons[0].pressed = true;
  t.getGamepad().buttons[7].value = 1;
  t.frame();
  assert.equal(t.F.G.input.hold, true);
  assert.equal(t.F.G.input.padFire, true);
  t.setGamepad(null);
  t.frame();
  assert.equal(t.F.G.input.hold, false);
  assert.equal(t.F.G.input.padFire, false);
});
