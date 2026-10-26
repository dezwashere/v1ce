// Reuse the original app artwork. Pass an existing sharp module path if needed.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'components/lounge/LofiAvatar.tsx'), 'utf8');
const keys = ['MIA', 'CROSS', 'LEAF', 'JORDAN', 'PINK', 'DOTS', 'TAYLOR', 'CASEY'];
// JSX fragments have no element name; keep parsing restricted to the eight known branches.
const branches = [...source.matchAll(/\{v===(\d)\?<>(.*?)<\/>:null\}/g)];
if (branches.length !== keys.length) throw new Error('Expected eight original avatar branches');
(async () => {
  for (const [, index, markup] of branches) {
    const body = markup.replace(/<(\/?)(Circle|Path|Rect)\b/g, (_, slash, tag) => `<${slash}${tag.toLowerCase()}`).replace(/strokeWidth=/g, 'stroke-width=');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 100 100"><defs><clipPath id="clip"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#clip)">${body}</g></svg>`;
    const dir = path.join(root, 'targets/v1ce-widget/Assets.xcassets', `Avatar-${keys[Number(index)]}.imageset`);
    fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'avatar.png'));
    fs.writeFileSync(path.join(dir, 'Contents.json'), JSON.stringify({ images: [{ filename: 'avatar.png', idiom: 'universal' }], info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
  }
  console.log('Generated eight widget avatars from existing app artwork.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
