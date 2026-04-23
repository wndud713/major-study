const fs = require('fs');
const fp = '신경계질환별물리치료(이제혁)/파킨슨병.html';
let html = fs.readFileSync(fp, 'utf-8');

// Card pattern matches:
//   <div class="card" onclick="openDetail('ch1','KEY')">
//     <div class="card-body">
//       <div class="card-title">...</div>
//       <div class="card-sub">...</div>
//     </div>
//     <button class="expand-btn">↗</button>
//   </div>
const cardRe = /(<div class="card" onclick=)"openDetail\('ch1','([^']+)'\)"(>[\s\S]*?<button class="expand-btn">↗<\/button>\s*<\/div>)/g;

let count = 0;
const newHtml = html.replace(cardRe, (m, pre, key, rest) => {
  count++;
  // Replace the ↗ button to use moveToSidebar with stopPropagation
  const newRest = rest.replace(
    '<button class="expand-btn">↗</button>',
    `<button class="expand-btn" onclick="event.stopPropagation();moveToSidebar(this.parentElement,'ch1','${key}')">↗</button>`
  );
  return `${pre}"toggleCardExpand(this,'ch1','${key}')"${newRest}\n          <div class="card-expand-wrap" data-key="${key}"></div>`;
});

console.log('Cards replaced:', count);
fs.writeFileSync(fp, newHtml);
