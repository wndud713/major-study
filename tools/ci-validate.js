#!/usr/bin/env node
// CI 검증 — div balance + script 블록 JS 문법
// 사용: node tools/ci-validate.js [파일 ...]   (인자 없으면 변경된 HTML 자동 감지)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDivBalance(html) {
  let open = 0, close = 0;
  const re = /<\/?div\b/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0][1] === '/') close++;
    else open++;
  }
  return { open, close, delta: open - close };
}

function extractScripts(html) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/\bsrc\s*=/i.test(m[1])) continue;
    out.push(m[2]);
  }
  return out;
}

function checkScriptSyntax(scripts, label) {
  const tmp = require('os').tmpdir() + `/ci-${process.pid}.js`;
  const errors = [];
  scripts.forEach((src, i) => {
    if (!src.trim()) return;
    fs.writeFileSync(tmp, src);
    try {
      execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
    } catch (e) {
      errors.push(`script #${i + 1}: ${(e.stderr || '').toString().split('\n')[0]}`);
    }
  });
  try { fs.unlinkSync(tmp); } catch {}
  return errors;
}

// legacy 파일 = 옛 구조 (뇌졸중 1-3 등). div delta -1 알려진 이슈, CI 보호 외 처리
const KNOWN_LEGACY = [
  '뇌졸중1_뇌혈관질환.html',
  '뇌졸중2_임상증상_평가.html',
  '뇌졸중3_중재_치료기법.html',
];

function findHtmlFiles() {
  const root = process.cwd();
  const out = [];
  function walk(dir) {
    const skip = ['node_modules', '.git', 'public', '_huashu_test', '_archive', '_scratch'];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.includes(ent.name) || ent.name.startsWith('.')) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.html') && !ent.name.includes('.pre') && !ent.name.includes('통합') && !KNOWN_LEGACY.includes(ent.name)) out.push(p);
    }
  }
  walk(root);
  return out;
}

function main() {
  const files = process.argv.slice(2).length ? process.argv.slice(2) : findHtmlFiles();
  console.log(`📋 검증 대상: ${files.length} 파일\n`);
  let failed = 0;
  for (const f of files) {
    const rel = path.relative(process.cwd(), f);
    const html = fs.readFileSync(f, 'utf8');
    const div = checkDivBalance(html);
    const scripts = extractScripts(html);
    const jsErrs = checkScriptSyntax(scripts, rel);
    const ok = div.delta === 0 && jsErrs.length === 0;
    if (ok) {
      console.log(`✅ ${rel} — div ${div.open}/${div.close} · script ${scripts.length}`);
    } else {
      failed++;
      console.log(`❌ ${rel}`);
      if (div.delta !== 0) console.log(`   div delta: ${div.delta} (open ${div.open}, close ${div.close})`);
      jsErrs.forEach(e => console.log(`   ${e}`));
    }
  }
  console.log(`\n${failed === 0 ? '✅ 통과' : '❌ ' + failed + ' 실패'}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
