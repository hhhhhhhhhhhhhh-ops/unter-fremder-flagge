const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const ROOT = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(ROOT,'game.js'),'utf8');
function load() {
  const store = new Map();
  class Color {
    constructor(value){this.value=value;this.r=0;this.g=0;this.b=0}
    set(x){this.value=x;return this}
    clone(){return new Color(this.value)}
    copy(x){this.value=x.value;return this}
    lerp(){return this}
    setRGB(){return this}
    multiplyScalar(){return this}
    add(){return this}
    addScalar(){return this}
  }
  const THREE = {Color};
  const context = {
    window:{THREE,addEventListener(){}},
    document:{readyState:'loading',addEventListener(){},getElementById(){return null}},
    localStorage:{getItem:(k)=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:(k)=>store.delete(k)},
    addEventListener(){},console,Math,Date,Uint8Array,Float32Array,requestAnimationFrame(){return 0},cancelAnimationFrame(){},
    setTimeout(){},setInterval(){},clearInterval(){},performance:{now(){return 0}},navigator:{getGamepads(){return []}}
  };
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'game.js'});
  return {F:context.window.F,store,ctx:context};
}
test('Projektmodule und Kampagnendaten sind vorhanden',()=>{
  const {F}=load();
  assert.equal(F.CHAPTERS.length,6);assert.equal(F.NOTES.length,18);
  assert.equal(F.open.REG.length,6);assert.equal(F.NATIONS.de.boat,'Typ VII');
  for(const c of F.CHAPTERS) {
    assert(c.title && c.intro.length && c.goals.length);
    for(const goal of c.goals) {
      assert.equal(typeof goal.type,'string');
      if(goal.port) assert(c.map && c.map[goal.port],`Ungültige Hafenreferenz: ${goal.port}`);
      if(goal.type==='fort') assert(c.fortMap && c.fortMap[goal.fort],`Ungültige Festung: ${goal.fort}`);
    }
  }
});
test('Neues Spiel entfernt vorherigen Kartenfortschritt und erzeugt gültigen Spielstand',()=>{
  const {F}=load();
  F.open.fogArr[0]=1;F.open.fogArr[120]=1;
  F.story.newGame();
  assert.equal(F.open.fogArr[0],0);assert.equal(F.open.fogArr[120],0);
  assert.equal(F.open.coverage(),0);
  assert(F.story.hasSave());
  assert.equal(F.prog.w.fog.length,F.open.N*F.open.N);
  assert.equal(F.prog.credits,150);assert.equal(F.prog.steel,40);
});
test('Fortschritt bleibt nach Speichern und Laden erhalten',()=>{
  const {F}=load();F.story.newGame();
  F.prog.chapter=3;F.prog.mission=2;F.prog.credits=430;F.prog.steel=120;
  F.prog.ledger.push(2);F.prog.up.hull=2;F.prog.w.known={'atl_home':1};
  assert.equal(F.save(),true);
  F.prog.credits=0;F.prog.ledger=[];F.prog.up.hull=0;
  assert(F.load());assert.equal(F.prog.credits,430);
  assert.equal(F.prog.up.hull,2);assert.equal(F.prog.ledger[0],2);
  assert.equal(F.prog.w.known.atl_home,1);
});
test('Export und Import erhalten den Spielstand',()=>{
  const {F}=load();F.story.newGame();F.prog.credits=711;F.prog.chapter=2;
  const exportContent=F.exportSave();assert.match(exportContent,/uff-backup-v2/);
  F.reset();assert.equal(F.peekSave(),false);
  assert(F.importSave(exportContent));assert(F.load());
  assert.equal(F.prog.credits,711);assert.equal(F.prog.chapter,2);
});
test('Beschädigte und gefährliche Spielstände werden abgewiesen oder bereinigt',()=>{
  const {F,store}=load();
  assert.equal(F.importSave('{not json'),false);
  assert.equal(F.importSave(JSON.stringify({format:'uff-backup-v2',progress:{hello:true}})),false);
  assert.equal(F.parseSave('x'.repeat(1024*1024+1)),null);
  const hostile='{"chapter":0,"mission":0,"up":{"hull":999,"__proto__":{"isAdmin":true}},"pos":{"x":9e90,"z":0,"h":0},"__proto__":{"injected":true},"credits":-900}';
  assert(F.importSave(hostile));
  assert.equal(F.prog.up.hull,4);assert.equal(F.prog.credits,0);
  assert.equal(F.prog.pos,undefined);assert.equal({}.injected,undefined);
  store.set('unterFremderFlagge.v1','totally invalid');
  assert.equal(F.peekSave(),false);assert.equal(F.load(),false);
});
test('Rang, Fähigkeitskauf und Schiffsstatistiken sind konsistent',()=>{
  const {F}=load();F.story.newGame();
  F.G.p={nat:'de',hull:220,steelCd:0};
  const baseline=F.G.stats();assert.equal(baseline.hullMax,220);
  F.prog.xp=350;const before=F.progress.info();
  assert(before.rank>=2);
  const skill='repair'; const points=F.progress.points();
  if(points>=1){assert.match(F.progress.buy(skill),/erworben/);assert(F.perk(skill));}
  F.prog.up.hull=1;assert(F.G.stats().hullMax>baseline.hullMax);
});
test('Website und PWA-Dateien referenzieren existierende Assets',()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  assert.match(html,/id="gl"/);assert.match(html,/id="loader"/);
  assert.match(html,/\.\/game\.js/);assert.match(html,/https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(html,/navigator\.serviceWorker\.register/);
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.display,'standalone');
  for(const file of ['game.js','index.html','sw.js','icon.svg','manifest.webmanifest']) assert(fs.statSync(path.join(ROOT,file)).isFile());
  const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');assert.match(sw,/PREFETCH_THREE/);
});
