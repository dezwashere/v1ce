// Offline regression checks. Uses the already-installed TypeScript compiler.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
};
const model = require('../lib/coinDesign.ts');
const { NUMBER_STYLES, normalizeNumberStyle } = require('../constants/coin.ts');
assert.equal(Object.keys(NUMBER_STYLES).length, 6);
assert.equal(normalizeNumberStyle('serif'), 'im_fell_english_sc');
assert.equal(normalizeNumberStyle('bodoni'), 'im_fell_english_sc');
assert.equal(normalizeNumberStyle('fraunces'), 'im_fell_english_sc');
assert.equal(model.normalizeShape('cross'), 'circle');
assert.deepEqual(model.coinTime(365 * 12), { value: '12', unit: 'YEARS' });
assert.deepEqual(model.coinTime(364), { value: '12', unit: 'MONTHS' });
assert.deepEqual(model.coinTime(365), { value: '1', unit: 'YEAR' });
assert.deepEqual(model.coinTime(NaN), { value: '0', unit: 'DAYS' });
assert.deepEqual(model.shapePolygon('drawn', '0,0 Infinity,0 100,100'), model.shapePolygon('circle'));
const saved = { version: 1, front: { motto: { x: 66, y: 73, scale: 1.2 } }, back: { value: { x: 43, y: 41, scale: .9 } } };
const original = JSON.stringify(saved);
let designs = 0, smallestBox = 100;
for (const shape of model.COIN_SHAPES.filter(s => s !== 'drawn')) for (const font of Object.keys(NUMBER_STYLES)) {
  const design = model.buildCoinDesign({ shape, numberStyle: font, days: 4380, motto: 'EAT MY SHORTS', displayName: 'RECOVERY', textLayout: saved });
  assert.equal(design.version, 2);
  assert.equal(design.rim.length, 12);
  assert.equal(design.nativeFont.length > 0, true);
  assert.equal(design.fontKey, font);
  for (const face of ['front', 'back']) for (const box of design[face]) {
    assert.ok(box.width > 0 && box.height > 0, `${shape} ${font} ${face} ${box.id} disappeared`);
    smallestBox = Math.min(smallestBox, box.fontSize);
    for (let x = 0; x <= 8; x++) for (let y = 0; y <= 6; y++) {
      assert.ok(model.inside({ x: box.x + (x / 8 - .5) * box.width, y: box.y + (y / 6 - .5) * box.height }, design.polygon), `${shape} box outside face`);
    }
  }
  assert.equal(JSON.stringify(saved), original, 'Rendering overwrote saved layout');
  assert.ok(JSON.stringify(design).length < 150000);
  designs++;
}
const baseline = model.buildCoinDesign({ color: '#405878', borderColor: '#213345' });
for (const shape of model.COIN_SHAPES) {
  const design = model.buildCoinDesign({ shape, displayName: 'RECOVERY', motto: 'EAT MY SHORTS' });
  for (const face of ['front', 'back']) {
    const boxes = design[face];
    for (let i=0; i<boxes.length; i++) for (let j=i+1; j<boxes.length; j++) {
      const a=boxes[i], b=boxes[j];
      assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2 || Math.abs(a.y-b.y)>=(a.height+b.height)/2, `Default overlap: ${shape}/${face}/${a.id}/${b.id}`);
    }
  }
}
for (const background of ['zebra','leopard','space','lightning','slime','flames','hotpink']) for (const backIcon of ['mountain','palm','smiley','clover','butterfly','wave']) {
  const design = model.buildCoinDesign({ background, backIcon });
  assert.ok(design.backgroundArt.length && design.backArt.length);
  assert.ok(JSON.stringify(design).length < 150000);
  for (const item of [...design.backgroundArt,...design.backArt]) assert.ok(item.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
}
assert.notEqual(baseline.rimSecondary, '#FFFFFF');
const words = require('../constants/app.ts').ROTATING_WORDS;
assert.equal(words.length, 20); assert.ok(!words.some(word => word.toLowerCase() === 'gay'));
const swift = fs.readFileSync(path.join(__dirname, '../targets/v1ce-widget/V1CEWidget.swift'), 'utf8');
assert.ok(swift.includes('for offset in 0..<48'));
assert.ok(swift.includes('SharedCoinView(design: design'));
assert.ok(swift.includes('v1ce_widget_coin_design_v2'));
console.log(JSON.stringify({ designs, faces: designs * 2, smallestRequestedFontSize: smallestBox, checks: 'passed', note: 'Geometry/model checks only; not a native rendering or Swift compilation test.' }));
