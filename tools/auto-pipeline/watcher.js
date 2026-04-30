#!/usr/bin/env node
/**
 * Drive Desktop 동기화 폴더 watcher → PDF 자동 변환 파이프라인
 *
 * 파일명 규칙: {subject-id}_{챕터명}.pdf
 *   예: clinical_제3장_DMD.pptx.pdf, neuro-motor_보바스.pdf
 *
 * 흐름:
 *   1. chokidar 감지 → stability 대기 (Drive sync 완료 확인)
 *   2. prefix 파싱 → subject 매핑
 *   3. claude CLI 헤드리스 호출 → 변환 + merge-config 등록 + 빌드 + 배포 + 커밋
 *   4. 처리완료 → done 폴더 이동 / 실패 → fail 폴더 이동
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

const SCRIPT_DIR = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(SCRIPT_DIR, 'config.json'), 'utf8'));
const STATE_PATH = path.join(CONFIG.projectRoot, CONFIG.stateFile);
const LOG_PATH = path.join(CONFIG.projectRoot, CONFIG.logFile);

// ───── 상태 (처리된 파일 해시 추적, 중복 방지) ─────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
  catch { return { processed: {}, inFlight: {} }; }
}
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

// ───── 로깅 ─────
function log(level, ...msgs) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] [${level}] ${msgs.join(' ')}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, line + '\n');
}

// ───── 파일 안정성 (Drive sync 완료 대기) ─────
async function waitForStability(filePath) {
  log('INFO', `안정성 대기: ${path.basename(filePath)}`);
  const startMs = Date.now();
  let lastSize = -1, stableCount = 0;
  const requiredStable = Math.ceil(CONFIG.stabilityCheckMs / CONFIG.stabilityPollMs);

  while (Date.now() - startMs < 10 * 60 * 1000) {  // 최대 10분
    if (!fs.existsSync(filePath)) {
      log('WARN', `파일 사라짐: ${filePath}`);
      return false;
    }
    const size = fs.statSync(filePath).size;
    if (size === lastSize && size > 0) {
      stableCount++;
      if (stableCount >= requiredStable) {
        log('INFO', `안정 확인 (${size} bytes, ${(Date.now() - startMs) / 1000}s)`);
        return true;
      }
    } else {
      stableCount = 0;
      lastSize = size;
    }
    await sleep(CONFIG.stabilityPollMs);
  }
  log('ERROR', `안정성 timeout: ${filePath}`);
  return false;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ───── 파일명 → subject 매핑 ─────
function parseSubject(filename) {
  const base = path.basename(filename, path.extname(filename));
  const dotIdx = base.indexOf('.pptx');
  const cleanBase = dotIdx > -1 ? base.slice(0, dotIdx) : base;

  for (const key of Object.keys(CONFIG.subjectMap)) {
    if (cleanBase.startsWith(key + '_')) {
      const chapterName = cleanBase.slice(key.length + 1).replace(/[^\w가-힣]+/g, '_');
      return { subject: CONFIG.subjectMap[key], chapterName };
    }
  }
  return null;
}

// ───── claude CLI 헤드리스 호출 ─────
function runClaudeCLI(prompt, jobId) {
  return new Promise((resolve, reject) => {
    const args = [...CONFIG.claudeArgs, prompt];
    log('INFO', `[${jobId}] claude CLI 호출 (args: ${CONFIG.claudeArgs.join(' ')})`);
    const proc = spawn('claude', args, {
      cwd: CONFIG.projectRoot,
      shell: true,
      env: process.env,
    });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d; process.stdout.write(d); });
    proc.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
    proc.on('error', err => reject(err));
    proc.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`claude exited code=${code}\nstderr=${stderr.slice(-2000)}`));
    });
  });
}

// ───── 단일 PDF 처리 ─────
async function processPdf(pdfPath) {
  const filename = path.basename(pdfPath);
  const fileHash = crypto.createHash('md5').update(filename + fs.statSync(pdfPath).size).digest('hex').slice(0, 8);
  const jobId = `${Date.now()}-${fileHash}`;

  const state = loadState();
  if (state.processed[filename] || state.inFlight[filename]) {
    log('INFO', `이미 처리/진행중: ${filename} — skip`);
    return;
  }

  // 안정성 대기
  const stable = await waitForStability(pdfPath);
  if (!stable) return moveToFail(pdfPath, 'unstable');

  // subject 매핑
  const mapping = parseSubject(filename);
  if (!mapping) {
    log('ERROR', `[${jobId}] 파일명 prefix 매핑 실패: ${filename}`);
    log('ERROR', `  유효 prefix: ${Object.keys(CONFIG.subjectMap).join(', ')}`);
    return moveToFail(pdfPath, 'no-mapping');
  }

  const { subject, chapterName } = mapping;
  const outputHtmlName = `${chapterName}.html`;
  const outputHtmlPath = path.join(CONFIG.projectRoot, subject.outputDir, outputHtmlName).replace(/\\/g, '/');

  // inFlight mark
  state.inFlight[filename] = { jobId, startedAt: new Date().toISOString(), subject: subject.id };
  saveState(state);

  log('INFO', `[${jobId}] 변환 시작: ${filename}`);
  log('INFO', `[${jobId}]   subject=${subject.id}, chapter=${chapterName}`);
  log('INFO', `[${jobId}]   output=${outputHtmlPath}`);

  // claude CLI 프롬프트 — html-lead 활용
  const prompt = buildClaudePrompt(pdfPath, subject, chapterName, outputHtmlPath, jobId);

  try {
    await runClaudeCLI(prompt, jobId);
    log('INFO', `[${jobId}] 변환 + 배포 + 커밋 완료`);

    // 처리완료 mark
    delete state.inFlight[filename];
    state.processed[filename] = {
      jobId,
      completedAt: new Date().toISOString(),
      subject: subject.id,
      chapterName,
      outputHtml: outputHtmlPath,
    };
    saveState(state);

    moveToDone(pdfPath);
  } catch (err) {
    log('ERROR', `[${jobId}] 실패: ${err.message}`);
    delete state.inFlight[filename];
    saveState(state);
    moveToFail(pdfPath, err.message);
  }
}

function buildClaudePrompt(pdfPath, subject, chapterName, outputHtmlPath, jobId) {
  const driveAbsPath = pdfPath.replace(/\\/g, '/');
  return `자동 파이프라인 작업 [${jobId}]

새 PDF 가 Google Drive 입력대기 폴더에 추가됨. html-lead 표준 절차로 처리.

## 입력
- PDF: \`${driveAbsPath}\`
- 과목: ${subject.name} (id: ${subject.id})
- 챕터명: ${chapterName}
- 출력 HTML: \`${outputHtmlPath}\`
- accent 색상: ${subject.accent}

## 작업
1. **pdf-converter agent 호출** — PDF → 인터랙티브 HTML 변환.
   - shell_template_v3.html 기반
   - 표준 4 계층 (종합표 마스터 + 부모 아코디언 + 자식 카드 + 단독 카드)
   - 3-state cycle (toggleCardExpand)
   - pdfimages ≥150 우선, 텍스트 다이어그램 혼재 시 pdftoppm 페이지 래스터
   - 국시문제 있으면 details.q-reveal + 색상 수평선
   - chapter ID = ch1, accent = ${subject.accent}
   - 출력 파일명: ${chapterName}.html

2. **검증** — div nesting balance + JS syntax (\`node --check\`) + 카드:wrap:detail 1:1 매칭
   - allDetailData 이중 선언 (placeholder block 잔존) 절대 금지 (commit a1b5ae5 사례 학습)

3. **merge-config.json 자동 등록** — \`${subject.id}\` 과목 chapters 배열에 추가:
   \`\`\`json
   {
     "file": "${subject.outputDir}/${chapterName}.html",
     "shortTitle": "${chapterName.replace(/_/g, ' ').slice(0, 12)}"
   }
   \`\`\`

4. **build-vercel.js 단독 실행** (merge-html.js 통합본 재생성 절대 금지)

5. **Vercel 배포** — \`major-study\` 프로젝트 분할 배포
   - public/.vercel/ 매 빌드 삭제됨 → \`npx vercel link --yes --project major-study\` 필수
   - \`cd public && npx vercel --prod\`
   - curl 검증 (HTTP 200 + Last-Modified)

6. **Git 커밋 + push** — 자동 메시지:
   \`\`\`
   feat(auto): ${subject.name} - ${chapterName} 자동 변환 + 배포

   - 입력: ${path.basename(pdfPath)}
   - JobID: ${jobId}
   - Drive 자동 파이프라인
   \`\`\`

## 필수 준수
- shell_template_v2.html 수정 X
- 캐러셀 엔진 함수 수정 X
- 분할 배포 전용 (\`feedback_split_deploy_only.md\`)
- Vercel \`major-study\` (\`reference_vercel_main_project.md\`)
- 허위 "배포 완료" 금지 — curl 검증 필수
- allDetailData placeholder block 잔존 금지

## 출력 형식
완료 보고: 파일 경로 / 카드 수 / 국시 수 / 배포 URL / curl 결과 / git 커밋 SHA.

진행 시작.
`;
}

// ───── 파일 이동 (처리완료/실패) ─────
function moveTo(srcPath, destFolder, suffix = '') {
  fs.mkdirSync(destFolder, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = path.basename(srcPath, path.extname(srcPath));
  const ext = path.extname(srcPath);
  const newName = `${ts}_${base}${suffix}${ext}`;
  const dest = path.join(destFolder, newName);
  fs.renameSync(srcPath, dest);
  log('INFO', `이동: ${srcPath} → ${dest}`);
}
function moveToDone(p) { moveTo(p, CONFIG.doneFolder); }
function moveToFail(p, reason) { moveTo(p, CONFIG.failFolder, `_FAIL-${reason.slice(0, 20).replace(/[^\w]/g, '_')}`); }

// ───── 메인 ─────
async function main() {
  log('INFO', '═══════════════════════════════════════════');
  log('INFO', '🚀 PDF → HTML 자동 변환 watcher 시작');
  log('INFO', `   감시 폴더: ${CONFIG.watchFolder}`);
  log('INFO', `   프로젝트: ${CONFIG.projectRoot}`);
  log('INFO', `   stability: ${CONFIG.stabilityCheckMs}ms`);
  log('INFO', '═══════════════════════════════════════════');

  if (!fs.existsSync(CONFIG.watchFolder)) {
    log('ERROR', `감시 폴더 없음: ${CONFIG.watchFolder}`);
    process.exit(1);
  }

  // 부팅 시 기존 PDF 스캔 (놓친 파일 catchup)
  log('INFO', '기존 PDF 스캔 (catchup)');
  const existing = fs.readdirSync(CONFIG.watchFolder).filter(f => f.toLowerCase().endsWith('.pdf'));
  for (const f of existing) {
    const fullPath = path.join(CONFIG.watchFolder, f);
    log('INFO', `  catchup: ${f}`);
    processPdf(fullPath).catch(err => log('ERROR', 'catchup 실패:', err.message));
  }

  // chokidar 실시간 감시
  const watcher = chokidar.watch(CONFIG.watchFolder, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: false,  // 자체 stabilityCheck 사용
    depth: 0,
  });

  watcher.on('add', filePath => {
    if (!filePath.toLowerCase().endsWith('.pdf')) return;
    log('INFO', `🆕 신규 감지: ${path.basename(filePath)}`);
    processPdf(filePath).catch(err => log('ERROR', '처리 실패:', err.message));
  });

  watcher.on('error', err => log('ERROR', 'chokidar 에러:', err.message));
  watcher.on('ready', () => log('INFO', '✅ watcher 준비 완료. 새 PDF 대기 중...'));

  // graceful shutdown
  process.on('SIGINT', async () => {
    log('INFO', '종료 신호 수신 — watcher 정리');
    await watcher.close();
    process.exit(0);
  });
}

main().catch(err => {
  log('ERROR', '치명적 에러:', err.stack);
  process.exit(1);
});
