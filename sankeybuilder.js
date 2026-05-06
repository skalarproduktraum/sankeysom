const PALETTE = [
  '#22C4F8', // cyan
  '#F20CEF', // magenta
  '#7B3FF6', // electric purple
  '#00D9C0', // turquoise
  '#FF48B8', // flamingo
  '#3D7AFF', // electric blue
  '#C028E8', // violet
  '#30F0B0', // mint
];

const FONT = "'Graphik','Inter',system-ui,-apple-system,sans-serif";
const C1 = '#22C4F8', C2 = '#9030F4', C3 = '#F20CEF';

let nid = 4;
let logScale = true;
let axisMode = 'none'; // 'none' | 'labels' | 'inline'
let whiteLabels = false;
let markets = [
  {id:1, name:'Life Sciences',  tam:2000, sam:380, som:38,  color:'#22C4F8'},
  {id:2, name:'Hardware OEM',   tam:760,  sam:140, som:18,  color:'#F20CEF'},
  {id:3, name:'Clinical',       tam:1400, sam:90,  som:7,   color:'#7B3FF6'},
];
const DEF = JSON.parse(JSON.stringify(markets));

const fmt  = n => { const v=Number(n)||0; return v>=1000?'€'+(v/1000).toFixed(1).replace('.0','')+'B':'€'+Math.round(v)+'M'; };
const escXml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const wrap = (s, n=22) => {
  const words = String(s).split(/\s+/).filter(Boolean);
  if(!words.length) return [''];
  const lines = [];
  let cur = '';
  for(const w of words){
    if(!cur){ cur = w; continue; }
    if(cur.length + 1 + w.length <= n) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if(cur) lines.push(cur);
  return lines;
};
const num  = v => Math.max(0, parseFloat(v)||0);

function svgPath(sx,sy1,sy2,dx,dy1,dy2){
  const mx=(sx+dx)/2;
  return `M${sx},${sy1} C${mx},${sy1} ${mx},${dy1} ${dx},${dy1} L${dx},${dy2} C${mx},${dy2} ${mx},${sy2} ${sx},${sy2} Z`;
}

function renderSankey(){
  const ms = markets.filter(m => m.enabled!==false && num(m.tam)>0);
  if(!ms.length) return `<svg width="100%" viewBox="0 0 680 200" role="img" aria-label="Empty chart" font-family="${FONT}">
    <text x="340" y="100" text-anchor="middle" font-size="13" fill="${whiteLabels?'#FFFFFF':'var(--color-text-secondary,#5F688A)'}">Enter TAM values to see the funnel</text>
  </svg>`;

  const BASE=292, MAXH=222;
  const AXW = axisMode==='labels' ? 44 : 0;
  const TX=20+AXW, TW=108, SX=222+AXW, SW=92, OX=402+AXW, OW=72, LX=484+AXW;
  const totTAM=ms.reduce((s,m)=>s+num(m.tam),0);
  const totSAM=ms.reduce((s,m)=>s+num(m.sam),0);
  const totSOM=ms.reduce((s,m)=>s+num(m.som),0);

  const scaleH = v => {
    if(totTAM<=0 || v<=0) return 0;
    return logScale
      ? MAXH*Math.log10(Math.max(v,1))/Math.log10(Math.max(totTAM,2))
      : MAXH*(v/totTAM);
  };
  const hT=MAXH, hS=Math.max(scaleH(totSAM),totSAM>0?8:0), hO=Math.max(scaleH(totSOM),totSOM>0?4:0);

  const segs=(total,colH,getV)=>{
    let y=BASE;
    return ms.map(m=>{
      const v=Math.max(num(getV(m)),0);
      const h=total>0&&v>0?Math.max(colH*(v/total),1):0;
      const s={y1:y-h,y2:y,h}; y-=h; return s;
    });
  };
  const tS=segs(totTAM,hT,m=>m.tam);
  const sS=segs(totSAM,hS,m=>m.sam);
  const oS=segs(totSOM,hO,m=>m.som);

  const W = '#FFFFFF';
  const TSEC = whiteLabels ? W : `var(--color-text-secondary,#5F688A)`;
  const BSEC = whiteLabels ? 'rgba(255,255,255,0.4)' : `var(--color-border-secondary,rgba(13,15,23,0.17))`;
  const TAM_COL = whiteLabels ? W : C1;
  const SAM_COL = whiteLabels ? W : C2;
  const SOM_COL = whiteLabels ? W : C3;
  const CONV_FILL = whiteLabels ? W : 'url(#convLine)';
  const labelColor = m => whiteLabels ? W : m.color;
  const hy  = h => BASE-h-17;
  const hvy = h => BASE-h-4;

  const VBW = 680 + AXW;
  let o = `<svg width="100%" viewBox="0 0 ${VBW} 332" role="img" font-family="${FONT}">
  <title>TAM SAM SOM flow funnel</title>
  <defs>
    <linearGradient id="convLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C1}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${C3}" stop-opacity="0.5"/>
    </linearGradient>
  </defs>`;

  /* Y axes — ticks track linear fractions of each column's total */
  const drawAxis = (colX, colH, total) => {
    if(total<=0 || colH<=0) return;
    const axX = colX - 8;
    o+=`<line x1="${axX}" y1="${BASE-colH}" x2="${axX}" y2="${BASE}" stroke="${BSEC}" stroke-width="0.5"/>`;
    const N = 5;
    for(let i=0;i<=N;i++){
      const v = total*i/N;
      const y = BASE - colH*(i/N);
      o+=`<line x1="${axX-3}" y1="${y}" x2="${axX}" y2="${y}" stroke="${BSEC}" stroke-width="0.5"/>`;
      o+=`<text x="${axX-5}" y="${y+3}" text-anchor="end" font-size="9" fill="${TSEC}">${fmt(v)}</text>`;
    }
  };
  if(axisMode==='labels'){
    drawAxis(TX, hT, totTAM);
    drawAxis(SX, hS, totSAM);
    drawAxis(OX, hO, totSOM);
  }

  /* Segments */
  ms.forEach((m,i)=>{
    if(tS[i].h>0) o+=`<rect x="${TX}" y="${tS[i].y1}" width="${TW}" height="${tS[i].h}" fill="${m.color}" opacity="0.85" rx="1"/>`;
    if(sS[i].h>0) o+=`<rect x="${SX}" y="${sS[i].y1}" width="${SW}" height="${sS[i].h}" fill="${m.color}" opacity="0.85" rx="1"/>`;
    if(oS[i].h>0) o+=`<rect x="${OX}" y="${oS[i].y1}" width="${OW}" height="${oS[i].h}" fill="${m.color}" opacity="0.85" rx="1"/>`;
  });

  /* Connectors TAM→SAM */
  ms.forEach((m,i)=>{
    if(tS[i].h>0.5&&sS[i].h>0.5)
      o+=`<path d="${svgPath(TX+TW,tS[i].y1,tS[i].y2,SX,sS[i].y1,sS[i].y2)}" fill="${m.color}" opacity="0.18"/>`;
  });
  /* Connectors SAM→SOM */
  ms.forEach((m,i)=>{
    if(sS[i].h>0.5&&oS[i].h>0.5)
      o+=`<path d="${svgPath(SX+SW,sS[i].y1,sS[i].y2,OX,oS[i].y1,oS[i].y2)}" fill="${m.color}" opacity="0.18"/>`;
  });

  /* Column outlines */
  o+=`<rect x="${TX}" y="${BASE-hT}" width="${TW}" height="${hT}" fill="none" stroke="${BSEC}" stroke-width="0.5"/>`;
  if(hS>0) o+=`<rect x="${SX}" y="${BASE-hS}" width="${SW}" height="${hS}" fill="none" stroke="${BSEC}" stroke-width="0.5"/>`;
  if(hO>0) o+=`<rect x="${OX}" y="${BASE-hO}" width="${OW}" height="${hO}" fill="none" stroke="${BSEC}" stroke-width="0.5"/>`;

  /* Inline values inside segments */
  if(axisMode==='inline'){
    const drawInline = (seg, cx, val) => {
      if(seg.h < 12) return;
      const cy = (seg.y1 + seg.y2)/2 + 3;
      o+=`<text x="${cx}" y="${cy}" text-anchor="middle" font-size="10" font-weight="500" fill="#FFFFFF">${fmt(val)}</text>`;
    };
    ms.forEach((m,i)=>{
      drawInline(tS[i], TX+TW/2, num(m.tam));
      drawInline(sS[i], SX+SW/2, num(m.sam));
      drawInline(oS[i], OX+OW/2, num(m.som));
    });
  }

  /* Column headers with brand colours */
  o+=`<text x="${TX+TW/2}" y="${hy(hT)}" text-anchor="middle" font-size="14" font-weight="500" fill="${TAM_COL}">TAM</text>`;
  o+=`<text x="${TX+TW/2}" y="${hvy(hT)}" text-anchor="middle" font-size="11" fill="${TSEC}">${fmt(totTAM)}</text>`;
  if(totSAM>0){
    o+=`<text x="${SX+SW/2}" y="${hy(hS)}" text-anchor="middle" font-size="14" font-weight="500" fill="${SAM_COL}">SAM</text>`;
    o+=`<text x="${SX+SW/2}" y="${hvy(hS)}" text-anchor="middle" font-size="11" fill="${TSEC}">${fmt(totSAM)}</text>`;
  }
  if(totSOM>0){
    o+=`<text x="${OX+OW/2}" y="${hy(hO)}" text-anchor="middle" font-size="14" font-weight="500" fill="${SOM_COL}">SOM</text>`;
    o+=`<text x="${OX+OW/2}" y="${hvy(hO)}" text-anchor="middle" font-size="11" fill="${TSEC}">${fmt(totSOM)}</text>`;
  }

  /* Conversion rates */
  if(totSAM>0&&totTAM>0){
    const p=Math.round(totSAM/totTAM*100);
    o+=`<text x="${(TX+TW+SX)/2}" y="${BASE+18}" text-anchor="middle" font-size="10" fill="${CONV_FILL}">${p}% conv.</text>`;
  }
  if(totSOM>0&&totSAM>0){
    const p=Math.round(totSOM/totSAM*100);
    o+=`<text x="${(SX+SW+OX)/2}" y="${BASE+18}" text-anchor="middle" font-size="10" fill="${CONV_FILL}">${p}% conv.</text>`;
  }

  /* Market labels */
  const LINE_H = 14;
  ms.forEach((m,i)=>{
    const ref=oS[i].h>5?oS[i]:sS[i].h>5?sS[i]:tS[i];
    const my=(ref.y1+ref.y2)/2;
    const lines = wrap(m.name);
    const startY = my + 4 - ((lines.length-1) * LINE_H)/2;
    const tspans = lines.map((ln,k)=>`<tspan x="${LX}" y="${startY + k*LINE_H}">${escXml(ln)}</tspan>`).join('');
    o+=`<text font-size="12" fill="${labelColor(m)}">${tspans}</text>`;
  });

  o+=`<text x="${VBW/2}" y="${BASE+32}" text-anchor="middle" font-size="10" fill="${TSEC}">Column heights on ${logScale?'log':'linear'} scale · Values in €M</text>`;
  o+=`</svg>`;
  return o;
}

function renderRows(){
  return markets.map(m=>{
    const samWarn = num(m.sam)>num(m.tam);
    const somWarn = num(m.som)>num(m.sam);
    const anyWarn = samWarn||somWarn;
    const samBdr  = samWarn ? '#D85A30' : 'var(--color-border-secondary,rgba(13,15,23,0.17))';
    const somBdr  = somWarn ? '#D85A30' : 'var(--color-border-secondary,rgba(13,15,23,0.17))';
    const defBdr  = 'var(--color-border-secondary,rgba(13,15,23,0.17))';
    const idx = markets.indexOf(m);
    const isFirst = idx===0, isLast = idx===markets.length-1;
    const enabled = m.enabled!==false;
    const rowStyle = enabled ? '' : 'opacity:0.45;';
    return `<div data-row="${m.id}" style="display:grid;grid-template-columns:34px 18px 1fr 70px 70px 70px 26px;gap:5px;margin-bottom:6px;align-items:center">
      <div style="display:flex;flex-direction:column;gap:2px">
        <button class="ord-btn" onclick="move(${m.id},-1)" ${isFirst?'disabled':''} title="Move up">▲</button>
        <button class="ord-btn" onclick="move(${m.id},1)" ${isLast?'disabled':''} title="Move down">▼</button>
      </div>
      <input type="checkbox" ${enabled?'checked':''} onchange="toggleEnabled(${m.id},this.checked)" title="Show in chart" style="cursor:pointer;margin:0"/>
      <div data-name-cell style="display:flex;align-items:center;gap:7px;min-width:0;${rowStyle}">
        <label class="color-swatch" style="background:${m.color}" title="Change colour">
          <input type="color" value="${m.color}" oninput="upd(${m.id},'color',this.value)"/>
        </label>
        <input type="text" value="${m.name.replace(/"/g,'&quot;')}" oninput="upd(${m.id},'name',this.value)"
          style="border:0.5px solid ${defBdr}"/>
        ${anyWarn?`<span class="warn-badge" title="SAM ≤ TAM and SOM ≤ SAM">⚠</span>`:''}
      </div>
      <input data-f="tam" type="number" min="0" step="1" value="${m.tam||''}" oninput="upd(${m.id},'tam',this.value)"
        style="border:0.5px solid ${defBdr}"/>
      <input data-f="sam" type="number" min="0" step="1" value="${m.sam||''}" oninput="upd(${m.id},'sam',this.value)"
        style="border:0.5px solid ${samBdr}"/>
      <input data-f="som" type="number" min="0" step="1" value="${m.som||''}" oninput="upd(${m.id},'som',this.value)"
        style="border:0.5px solid ${somBdr}"/>
      <button class="del-btn" onclick="del(${m.id})" ${markets.length<=1?'disabled':''}>×</button>
    </div>`;
  }).join('');
}

function render(){
  document.getElementById('app').innerHTML = `
    <div class="brand-rule"></div>
    <div class="tbl-hdr">
      <span></span>
      <span></span>
      <span>Market</span>
      <span style="text-align:center">TAM (€M)</span>
      <span style="text-align:center">SAM (€M)</span>
      <span style="text-align:center">SOM (€M)</span>
      <span></span>
    </div>
    ${renderRows()}
    <div style="display:flex;gap:8px;margin-top:4px;margin-bottom:10px;flex-wrap:wrap;align-items:center">
      <button class="add-btn" onclick="add()" ${markets.length>=8?'disabled':''}>+ Add market</button>
      <button class="reset-btn" onclick="reset()">Reset</button>
      <button class="reset-btn" onclick="downloadPDF()">Download PDF</button>
      <button class="reset-btn" onclick="downloadPNG()">Download PNG</button>
      <button class="reset-btn" onclick="copyPNG()">Copy PNG</button>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);margin-left:auto;cursor:pointer">
        <input type="checkbox" ${logScale?'checked':''} onchange="toggleLog(this.checked)"/>
        Log scale
      </label>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary)">
        Values:
        <select onchange="setAxisMode(this.value)" style="font-family:var(--font-sans);font-size:12px;padding:3px 6px;border-radius:6px;border:0.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-primary);cursor:pointer">
          <option value="none" ${axisMode==='none'?'selected':''}>No axis</option>
          <option value="labels" ${axisMode==='labels'?'selected':''}>Axis labels</option>
          <option value="inline" ${axisMode==='inline'?'selected':''}>Inline values</option>
        </select>
      </label>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);cursor:pointer">
        <input type="checkbox" ${whiteLabels?'checked':''} onchange="toggleWhiteLabels(this.checked)"/>
        White labels
      </label>
    </div>
    <div id="sankey-wrap" class="${whiteLabels?'dark-preview':''}">${renderSankey()}</div>`;
}

async function downloadPDF(){
  const svg = document.querySelector('#sankey-wrap svg');
  if(!svg) return;
  const vb = svg.viewBox.baseVal;
  const w = vb && vb.width  ? vb.width  : 680;
  const h = vb && vb.height ? vb.height : 332;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: w>h?'landscape':'portrait', unit:'pt', format:[w,h] });
  await pdf.svg(svg, { x:0, y:0, width:w, height:h });
  pdf.save('sankey.pdf');
}

const PNG_SCALE = 3;

function resolvedSvg(){
  const live = document.querySelector('#sankey-wrap svg');
  if(!live) return null;
  const styles = getComputedStyle(document.documentElement);
  const tsec = styles.getPropertyValue('--color-text-secondary').trim() || '#5F688A';
  const bsec = styles.getPropertyValue('--color-border-secondary').trim() || 'rgba(13,15,23,0.17)';
  const clone = live.cloneNode(true);
  const sub = (s, find, repl) => s.split(find).join(repl);
  let xml = new XMLSerializer().serializeToString(clone);
  xml = sub(xml, 'var(--color-text-secondary,#5F688A)', tsec);
  xml = sub(xml, 'var(--color-border-secondary,rgba(13,15,23,0.17))', bsec);
  if(!/^<svg[^>]+xmlns=/.test(xml)) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const vb = live.viewBox.baseVal;
  return { xml, w: (vb&&vb.width)||680, h: (vb&&vb.height)||332 };
}

function svgToPngBlob(){
  const r = resolvedSvg();
  if(!r) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.xml);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(r.w * PNG_SCALE);
      canvas.height = Math.round(r.h * PNG_SCALE);
      const ctx = canvas.getContext('2d');
      ctx.scale(PNG_SCALE, PNG_SCALE);
      ctx.drawImage(img, 0, 0, r.w, r.h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG image load failed'));
    img.src = url;
  });
}

async function downloadPNG(){
  const blob = await svgToPngBlob();
  if(!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sankey.png';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function copyPNG(){
  try {
    if(window.ClipboardItem && navigator.clipboard?.write){
      const item = new ClipboardItem({ 'image/png': svgToPngBlob() });
      await navigator.clipboard.write([item]);
    } else {
      const blob = await svgToPngBlob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }
  } catch(e){
    alert('Copy failed: ' + e.message);
  }
}

function upd(id,f,v){
  const isStr = f==='name' || f==='color';
  markets=markets.map(m=>m.id===id?{...m,[f]:isStr?v:v===''?0:Math.max(0,parseFloat(v)||0)}:m);
  document.getElementById('sankey-wrap').innerHTML = renderSankey();
  if(f==='color'){
    const sw = document.querySelector(`[data-row="${id}"] .color-swatch`);
    if(sw) sw.style.background = v;
  }
  updateWarnings();
  save();
}

function updateWarnings(){
  const defBdr = 'var(--color-border-secondary,rgba(13,15,23,0.17))';
  markets.forEach(m=>{
    const row = document.querySelector(`[data-row="${m.id}"]`);
    if(!row) return;
    const samWarn = num(m.sam)>num(m.tam);
    const somWarn = num(m.som)>num(m.sam);
    row.querySelector('[data-f="sam"]').style.borderColor = samWarn ? '#D85A30' : 'rgba(13,15,23,0.17)';
    row.querySelector('[data-f="som"]').style.borderColor = somWarn ? '#D85A30' : 'rgba(13,15,23,0.17)';
    const badge = row.querySelector('.warn-badge');
    const anyWarn = samWarn||somWarn;
    if(anyWarn && !badge){
      const span = document.createElement('span');
      span.className = 'warn-badge';
      span.title = 'SAM ≤ TAM and SOM ≤ SAM';
      span.textContent = '⚠';
      row.querySelector('[data-name-cell]').appendChild(span);
    } else if(!anyWarn && badge){
      badge.remove();
    }
  });
}
function del(id){ if(markets.length>1){markets=markets.filter(m=>m.id!==id); render(); save();} }
function toggleEnabled(id, on){
  markets = markets.map(m => m.id===id ? {...m, enabled: !!on} : m);
  render();
  save();
}
function move(id, dir){
  const i = markets.findIndex(m=>m.id===id);
  const j = i + dir;
  if(i<0 || j<0 || j>=markets.length) return;
  const next = markets.slice();
  [next[i], next[j]] = [next[j], next[i]];
  markets = next;
  render(); save();
}
function add(){
  if(markets.length>=8) return;
  const used=markets.map(m=>m.color);
  const c=PALETTE.find(p=>!used.includes(p))||PALETTE[markets.length%PALETTE.length];
  markets=[...markets,{id:nid++,name:'New market',tam:500,sam:80,som:10,color:c}];
  render(); save();
}
function reset(){
  markets=JSON.parse(JSON.stringify(DEF));
  nid=4;
  logScale=true;
  axisMode='none';
  whiteLabels=false;
  render();
  save();
}
function toggleLog(on){
  logScale = !!on;
  document.getElementById('sankey-wrap').innerHTML = renderSankey();
  save();
}
function setAxisMode(mode){
  axisMode = (mode==='labels'||mode==='inline') ? mode : 'none';
  document.getElementById('sankey-wrap').innerHTML = renderSankey();
  save();
}
function toggleWhiteLabels(on){
  whiteLabels = !!on;
  const wrap = document.getElementById('sankey-wrap');
  wrap.classList.toggle('dark-preview', whiteLabels);
  wrap.innerHTML = renderSankey();
  save();
}

const STORAGE_KEY = 'snk-v2';

async function save(){
  const payload = JSON.stringify({m:markets,n:nid,log:logScale,axisMode,white:whiteLabels});
  try{ localStorage.setItem(STORAGE_KEY, payload); }catch(e){}
  try{ await window.storage?.set(STORAGE_KEY, payload); }catch(e){}
}

async function load(){
  try{
    const local = localStorage.getItem(STORAGE_KEY);
    if(local) return JSON.parse(local);
  }catch(e){}
  try{
    const r = await window.storage?.get(STORAGE_KEY);
    if(r?.value) return JSON.parse(r.value);
  }catch(e){}
  return null;
}

(async()=>{
  try{
    const d = await load();
    if(d){
      if(d.m?.length){ markets=d.m; if(d.n)nid=d.n; }
      if(typeof d.log==='boolean') logScale=d.log;
      if(typeof d.axisMode==='string') axisMode=d.axisMode;
      else if(d.axis===true) axisMode='labels';
      if(typeof d.white==='boolean') whiteLabels=d.white;
    }
  }catch(e){}
  render();
})();
