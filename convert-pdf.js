#!/usr/bin/env node
/**
 * convert-pdf.js — PDF → 인터랙티브 HTML 스터디 변환 도구
 *
 * 사용법:
 *   node convert-pdf.js "파일.pdf" [옵션]
 *
 * 옵션:
 *   --subject "과목명"          과목 이름 (기본: PDF 상위 폴더명)
 *   --chapter "챕터명"          챕터 제목 (기본: PDF 파일명에서 추출)
 *   --chnum "01"               챕터 번호 (기본: '01')
 *   --accent "#38bdf8"         accent 색상 (기본: #38bdf8)
 *   --outdir "출력폴더"        출력 디렉토리 (기본: PDF와 같은 폴더)
 *   --template "경로"          shell_template_v2.html 경로 (기본: 프로젝트 루트)
 *   --content "응답.json"      Claude 응답 JSON 파일 (있으면 Phase 2: 최종 HTML 생성)
 *   --min-width 150            최소 이미지 너비 (기본: 150)
 *   --min-height 150           최소 이미지 높이 (기본: 150)
 *   --help                     도움말
 *
 * 2단계 워크플로우:
 *   Phase 1: node convert-pdf.js "파일.pdf"
 *     → 파일명_scaffold.html  (이미지 포함 스캐폴딩)
 *     → 파일명_prompt.txt     (Claude에게 넘길 프롬프트)
 *     → 파일명_extracted.json (중간 데이터)
 *
 *   Phase 2: node convert-pdf.js "파일.pdf" --content "claude_response.json"
 *     → 파일명.html           (최종 완성 HTML)
 */

const fs = require('fs');
const path = require('path');
const { extractAll } = require('./lib/extractor');
const {
  readTemplate,
  buildSlidesData,
  buildChapterSection,
  buildDetailDataScaffold,
  buildPrompt,
  assembleHTML,
  buildChapterNav
} = require('./lib/builder');

// ── CLI 인자 파싱 ──
function parseArgs(argv) {
  const args = { _: [] };
  let i = 2;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
    i++;
  }
  return args;
}

function showHelp() {
  console.log(`
PDF → 인터랙티브 HTML 스터디 변환 도구

사용법:
  node convert-pdf.js "파일.pdf" [옵션]

옵션:
  --subject "과목명"      과목 이름 (기본: PDF 상위 폴더명)
  --chapter "챕터명"      챕터 제목 (기본: PDF 파일명)
  --chnum "01"           챕터 번호 (기본: 01)
  --accent "#38bdf8"     accent 색상
  --outdir "출력폴더"    출력 디렉토리 (기본: PDF와 같은 폴더)
  --template "경로"      shell_template_v2.html 경로
  --content "file.json"  Claude 응답 JSON (Phase 2)
  --min-width 150        최소 이미지 너비
  --min-height 150       최소 이미지 높이

워크플로우:
  1. node convert-pdf.js "강의.pdf"
     → _scaffold.html, _prompt.txt, _extracted.json 생성

  2. _prompt.txt 내용을 Claude에 붙여넣기
     → Claude가 JSON 응답 반환

  3. Claude 응답을 파일로 저장 후:
     node convert-pdf.js "강의.pdf" --content "response.json"
     → 최종 .html 생성
`);
}

// ── 파일명에서 메타 추출 ──
function extractMeta(pdfPath) {
  const basename = path.basename(pdfPath, '.pdf');
  const parentDir = path.basename(path.dirname(pdfPath));

  // "Ch 1. 상해선수의 재활프로그램 수립 DK" 같은 패턴에서 챕터명 추출
  let chapter = basename;
  let chNum = '01';

  const chMatch = basename.match(/Ch\.?\s*(\d+)\.?\s*(.*)/i);
  if (chMatch) {
    chNum = chMatch[1].padStart(2, '0');
    chapter = chMatch[2].replace(/\s*DK\s*(\(\d+\))?\s*$/i, '').trim() || basename;
  }

  return {
    subject: parentDir,
    chapter: chapter,
    chNum: chNum,
    baseName: basename.replace(/[^a-zA-Z0-9가-힣_.-]/g, '_')
  };
}

// ── Phase 1: 추출 + 스캐폴딩 ──
function phase1(pdfPath, opts) {
  const meta = extractMeta(pdfPath);
  const subject = opts.subject || meta.subject;
  const chapter = opts.chapter || meta.chapter;
  const chNum = opts.chnum || meta.chNum;
  const chid = 'ch1';
  const accent = opts.accent || '#38bdf8';
  const outDir = opts.outdir || path.dirname(pdfPath);

  // 템플릿 읽기
  const templatePath = opts.template || path.join(__dirname, 'shell_template_v2.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[ERROR] 템플릿 파일을 찾을 수 없습니다: ${templatePath}`);
    process.exit(1);
  }
  const template = readTemplate(templatePath);

  // PDF 추출
  console.log('\n═══════════════════════════════════════');
  console.log(`  PDF → HTML 변환 (Phase 1: 추출 + 스캐폴딩)`);
  console.log('═══════════════════════════════════════\n');

  const extracted = extractAll(pdfPath, {
    minWidth: parseInt(opts.minWidth) || 150,
    minHeight: parseInt(opts.minHeight) || 150
  });

  // SLIDES_DATA 생성
  const slidesData = buildSlidesData(extracted.images, chid);

  // 기본 스캐폴딩 탭 (placeholder)
  const defaultTabs = [{
    id: 'main',
    icon: '📖',
    label: '전체 내용',
    groupLabel: '콘텐츠',
    sectionTitle: `${chapter}`,
    cards: [{ key: 'placeholder', title: '내용 준비 중', sub: 'Claude 프롬프트로 콘텐츠를 생성한 뒤 --content 옵션으로 Phase 2를 실행하세요' }]
  }];

  // 챕터 HTML 생성
  const chapterNav = buildChapterNav(subject, [{
    chid, chNum, shortTitle: chapter, accent
  }]);

  const chapterSection = buildChapterSection({
    chid, chNum, title: chapter, subject, accent, tabs: defaultTabs
  });

  const detailData = buildDetailDataScaffold(chid, defaultTabs);

  // HTML 조립
  const scaffoldHtml = assembleHTML({
    css: template.css,
    jsEngine: template.jsEngine,
    chapterNav,
    chapterSection,
    slidesData,
    detailData,
    title: `${subject} - ${chapter}`
  });

  // 프롬프트 생성
  const prompt = buildPrompt(extracted.text, extracted.imageCount, {
    subject, chapter, chid
  });

  // 출력 디렉토리 생성
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 파일 출력
  const safeName = meta.baseName;
  const scaffoldPath = path.join(outDir, `${safeName}_scaffold.html`);
  const promptPath = path.join(outDir, `${safeName}_prompt.txt`);
  const jsonPath = path.join(outDir, `${safeName}_extracted.json`);

  fs.writeFileSync(scaffoldPath, scaffoldHtml, 'utf-8');
  console.log(`\n[출력] 스캐폴딩 HTML: ${scaffoldPath}`);

  fs.writeFileSync(promptPath, prompt, 'utf-8');
  console.log(`[출력] Claude 프롬프트: ${promptPath}`);

  // extracted.json (이미지 base64는 크므로 제외, 이미지 수만 기록)
  const jsonData = {
    pdfPath: extracted.pdfPath,
    subject,
    chapter,
    chNum,
    chid,
    accent,
    imageCount: extracted.imageCount,
    textLength: extracted.text.length,
    textPreview: extracted.text.substring(0, 500) + '...'
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`[출력] 추출 데이터: ${jsonPath}`);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Phase 1 완료!`);
  console.log(`═══════════════════════════════════════`);
  console.log(`\n다음 단계:`);
  console.log(`  1. ${path.basename(promptPath)} 내용을 Claude에 붙여넣기`);
  console.log(`  2. Claude의 JSON 응답을 파일로 저장 (예: response.json)`);
  console.log(`  3. node convert-pdf.js "${path.basename(pdfPath)}" --content "response.json"\n`);
}

// ── Phase 2: Claude 응답 → 최종 HTML ──
function phase2(pdfPath, contentPath, opts) {
  const meta = extractMeta(pdfPath);
  const subject = opts.subject || meta.subject;
  const chapter = opts.chapter || meta.chapter;
  const chNum = opts.chnum || meta.chNum;
  const chid = 'ch1';
  const accent = opts.accent || '#38bdf8';
  const outDir = opts.outdir || path.dirname(pdfPath);

  // 템플릿 읽기
  const templatePath = opts.template || path.join(__dirname, 'shell_template_v2.html');
  const template = readTemplate(templatePath);

  console.log('\n═══════════════════════════════════════');
  console.log(`  PDF → HTML 변환 (Phase 2: 최종 조립)`);
  console.log('═══════════════════════════════════════\n');

  // Claude 응답 JSON 읽기
  let contentData;
  const rawContent = fs.readFileSync(contentPath, 'utf-8');

  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const jsonBlockMatch = rawContent.match(/```json\s*([\s\S]*?)```/);
  const jsonStr = jsonBlockMatch ? jsonBlockMatch[1].trim() : rawContent.trim();

  try {
    contentData = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`[ERROR] JSON 파싱 실패: ${e.message}`);
    console.error('파일 내용이 유효한 JSON인지 확인하세요.');
    process.exit(1);
  }

  const tabs = contentData.tabs || [];
  const detailData = contentData.detailData || {};

  console.log(`[Phase 2] 탭 ${tabs.length}개, 디테일 키 ${Object.keys(detailData).length}개 로드`);

  // 이미지 재추출 (SLIDES_DATA용)
  console.log(`[Phase 2] 이미지 재추출 중...`);
  const extracted = extractAll(pdfPath, {
    minWidth: parseInt(opts.minWidth) || 150,
    minHeight: parseInt(opts.minHeight) || 150
  });

  const slidesData = buildSlidesData(extracted.images, chid);

  // 챕터 HTML 생성 (Claude가 제공한 탭/카드 구조 사용)
  const chapterNav = buildChapterNav(subject, [{
    chid, chNum, shortTitle: chapter, accent
  }]);

  const chapterSection = buildChapterSection({
    chid, chNum, title: chapter, subject, accent, tabs
  });

  // allDetailData 생성 (Claude가 제공한 실제 콘텐츠)
  let detailDataJs = `const allDetailData = {};\n\nallDetailData['${chid}'] = {\n\n`;
  const entries = Object.entries(detailData).map(([key, html]) => {
    // 백틱 이스케이프
    const safeHtml = html.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    return `  ${key}: \`${safeHtml}\``;
  });
  detailDataJs += entries.join(',\n\n');
  detailDataJs += `\n\n};`;

  // 최종 HTML 조립
  const finalHtml = assembleHTML({
    css: template.css,
    jsEngine: template.jsEngine,
    chapterNav,
    chapterSection,
    slidesData,
    detailData: detailDataJs,
    title: `${subject} - ${chapter}`
  });

  // 출력 디렉토리 생성
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 출력
  const safeName = meta.baseName;
  const outputPath = path.join(outDir, `${safeName}.html`);
  fs.writeFileSync(outputPath, finalHtml, 'utf-8');
  console.log(`\n[출력] 최종 HTML: ${outputPath}`);

  // 문법 검사
  try {
    // script 태그 내의 JS만 추출하여 검사
    const scriptMatch = finalHtml.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      new Function(scriptMatch[1]);
      console.log('[검증] JavaScript 문법: OK');
    }
  } catch (e) {
    console.warn(`[경고] JavaScript 문법 오류 감지: ${e.message}`);
    console.warn('브라우저에서 열어 콘솔을 확인하세요.');
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Phase 2 완료! 최종 HTML 생성됨`);
  console.log('═══════════════════════════════════════\n');
}

// ── 메인 ──
function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args._.length === 0) {
    console.error('[ERROR] PDF 파일 경로를 지정하세요.');
    console.error('사용법: node convert-pdf.js "파일.pdf" [옵션]');
    console.error('도움말: node convert-pdf.js --help');
    process.exit(1);
  }

  const pdfPath = path.resolve(args._[0]);
  if (!fs.existsSync(pdfPath)) {
    console.error(`[ERROR] 파일을 찾을 수 없습니다: ${pdfPath}`);
    process.exit(1);
  }

  if (args.content) {
    // Phase 2: Claude 응답으로 최종 HTML 생성
    const contentPath = path.resolve(args.content);
    if (!fs.existsSync(contentPath)) {
      console.error(`[ERROR] 콘텐츠 파일을 찾을 수 없습니다: ${contentPath}`);
      process.exit(1);
    }
    phase2(pdfPath, contentPath, args);
  } else {
    // Phase 1: 추출 + 스캐폴딩
    phase1(pdfPath, args);
  }
}

main();
