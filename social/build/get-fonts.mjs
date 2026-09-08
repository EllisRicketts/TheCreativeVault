import fs from 'node:fs/promises';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const sets = [
  ['archivo','https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap'],
  ['bricolage','https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap'],
];
let out = '';
for (const [name, url] of sets) {
  const css = await (await fetch(url, {headers:{'User-Agent':UA}})).text();
  const blocks = css.split('@font-face').slice(1);
  let i = 0;
  for (const b of blocks) {
    const range = (b.match(/unicode-range:\s*([^;]+);/)||[])[1] || '';
    // keep latin + latin-ext only
    if (!/U\+0000-00FF|U\+0100-02(AF|BA)/.test(range)) continue;
    const src = (b.match(/url\((https:[^)]+\.woff2)\)/)||[])[1];
    const wt  = (b.match(/font-weight:\s*([^;]+);/)||[])[1].trim();
    const sty = (b.match(/font-style:\s*([^;]+);/)||[])[1].trim();
    if (!src) continue;
    const file = `${name}-${i++}.woff2`;
    const buf = Buffer.from(await (await fetch(src,{headers:{'User-Agent':UA}})).arrayBuffer());
    await fs.writeFile(`build/fonts/${file}`, buf);
    const fam = name === 'archivo' ? 'Archivo' : 'Bricolage Grotesque';
    out += `@font-face{font-family:'${fam}';font-style:${sty};font-weight:${wt};font-display:block;src:url('fonts/${file}') format('woff2');unicode-range:${range};}\n`;
  }
}
await fs.writeFile('build/fonts.css', out);
console.log('wrote build/fonts.css\n'+out.replace(/unicode-range:[^;]+;/g,'').slice(0,900));
