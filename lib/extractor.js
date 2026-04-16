/**
 * lib/extractor.js — PDF 추출 파이프라인
 *
 * Poppler 기반으로 PDF에서 텍스트와 이미지를 추출하고,
 * 이미지를 base64로 인코딩하여 SLIDES_DATA에 사용할 수 있는 형태로 반환한다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Poppler 경로 결정
function getPopplerPath() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const popplerDir = path.join(
    localAppData,
    'Microsoft', 'WinGet', 'Packages',
    'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe',
    'poppler-25.07.0', 'Library', 'bin'
  );

  if (fs.existsSync(path.join(popplerDir, 'pdftotext.exe'))) {
    return popplerDir;
  }

  // fallback: PATH에서 찾기
  try {
    execSync('pdftotext -v', { stdio: 'pipe' });
    return ''; // PATH에 있으면 빈 경로
  } catch (e) {
    throw new Error(
      'Poppler를 찾을 수 없습니다.\n' +
      '설치: winget install oschwartz10612.Poppler\n' +
      '또는 https://github.com/oschwartz10612/poppler-windows/releases'
    );
  }
}

let _popplerPath = null;
function poppler() {
  if (_popplerPath === null) _popplerPath = getPopplerPath();
  return _popplerPath;
}

function popplerExe(name) {
  const p = poppler();
  return p ? path.join(p, name) : name;
}

/**
 * PDF에서 텍스트 추출
 * @param {string} pdfPath - PDF 파일 경로
 * @returns {string} 추출된 텍스트
 */
function extractText(pdfPath) {
  const exe = popplerExe('pdftotext.exe');
  const cmd = `"${exe}" -layout "${pdfPath}" -`;
  try {
    const result = execSync(cmd, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result;
  } catch (e) {
    console.error('[extractor] pdftotext 실패:', e.message);
    return '';
  }
}

/**
 * PDF 내 이미지 목록 조회
 * @param {string} pdfPath - PDF 파일 경로
 * @returns {Array<{page:number, num:number, type:string, width:number, height:number, color:string}>}
 */
function listImages(pdfPath) {
  const exe = popplerExe('pdfimages.exe');
  const cmd = `"${exe}" -list "${pdfPath}"`;
  try {
    const result = execSync(cmd, {
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const lines = result.split('\n');
    const images = [];

    // 첫 2줄은 헤더 + 구분선
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 공백으로 분리: page num type width height color comp bpc enc interp object ID x-ppi y-ppi size ratio
      const parts = line.split(/\s+/);
      if (parts.length < 6) continue;

      const page = parseInt(parts[0], 10);
      const num = parseInt(parts[1], 10);
      const type = parts[2];
      const width = parseInt(parts[3], 10);
      const height = parseInt(parts[4], 10);
      const color = parts[5];

      if (isNaN(page) || isNaN(num)) continue;

      images.push({ page, num, type, width, height, color });
    }

    return images;
  } catch (e) {
    console.error('[extractor] pdfimages -list 실패:', e.message);
    return [];
  }
}

/**
 * 이미지 목록 필터링 (작은 장식 아이콘 제외)
 * @param {Array} imageList - listImages() 결과
 * @param {number} minW - 최소 너비 (기본 150)
 * @param {number} minH - 최소 높이 (기본 150)
 * @returns {Array} 필터링된 이미지 목록
 */
function filterImages(imageList, minW = 150, minH = 150) {
  return imageList.filter(img =>
    img.width >= minW &&
    img.height >= minH &&
    img.type !== 'smask'  // 알파 마스크 제외
  );
}

/**
 * PDF에서 이미지 파일 추출
 * @param {string} pdfPath - PDF 파일 경로
 * @param {string} outDir - 출력 디렉토리 (기본: 임시)
 * @returns {string} 출력 디렉토리 경로
 */
function extractImageFiles(pdfPath, outDir) {
  if (!outDir) {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-img-'));
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exe = popplerExe('pdfimages.exe');
  const prefix = path.join(outDir, 'img');
  const cmd = `"${exe}" -png -p "${pdfPath}" "${prefix}"`;

  try {
    execSync(cmd, {
      maxBuffer: 100 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    console.error('[extractor] pdfimages -png 실패:', e.message);
  }

  return outDir;
}

/**
 * 필터된 이미지를 base64로 인코딩
 * @param {string} pdfPath - PDF 파일 경로
 * @param {Array} filteredList - filterImages() 결과 (page, num 정보 필요)
 * @param {string} outDir - extractImageFiles()의 출력 디렉토리
 * @returns {Array<{base64:string, label:string, page:number}>}
 */
function imagesToBase64(pdfPath, filteredList, outDir) {
  // 먼저 이미지 추출
  if (!outDir) {
    outDir = extractImageFiles(pdfPath);
  }

  const results = [];
  const seenPages = new Set();

  // pdfimages -png -p 출력 형식: img-{page:03d}-{num:03d}.png
  for (const img of filteredList) {
    const pageStr = String(img.page).padStart(3, '0');
    const numStr = String(img.num).padStart(3, '0');
    const filename = `img-${pageStr}-${numStr}.png`;
    const filePath = path.join(outDir, filename);

    if (!fs.existsSync(filePath)) {
      // 다른 이름 패턴 시도
      continue;
    }

    try {
      const buf = fs.readFileSync(filePath);
      const b64 = buf.toString('base64');
      const base64Str = `data:image/png;base64,${b64}`;

      // 같은 페이지의 여러 이미지 구분
      let label;
      if (seenPages.has(img.page)) {
        label = `p.${img.page} (${img.num})`;
      } else {
        label = `p.${img.page}`;
        seenPages.add(img.page);
      }

      results.push({
        base64: base64Str,
        label: label,
        page: img.page,
        width: img.width,
        height: img.height
      });
    } catch (e) {
      console.error(`[extractor] base64 인코딩 실패: ${filePath}`, e.message);
    }
  }

  return results;
}

/**
 * 전체 추출 파이프라인 (한번에 실행)
 * @param {string} pdfPath - PDF 파일 경로
 * @param {object} opts - 옵션
 * @param {number} opts.minWidth - 최소 이미지 너비 (기본 150)
 * @param {number} opts.minHeight - 최소 이미지 높이 (기본 150)
 * @returns {{text:string, images:Array, imageCount:number, pdfPath:string}}
 */
function extractAll(pdfPath, opts = {}) {
  const minW = opts.minWidth || 150;
  const minH = opts.minHeight || 150;

  console.log(`[extractor] 텍스트 추출 중: ${path.basename(pdfPath)}`);
  const text = extractText(pdfPath);

  console.log(`[extractor] 이미지 목록 조회 중...`);
  const allImages = listImages(pdfPath);
  const filtered = filterImages(allImages, minW, minH);

  console.log(`[extractor] 이미지 ${allImages.length}개 중 ${filtered.length}개 필터 통과 (>=${minW}x${minH})`);

  let images = [];
  if (filtered.length > 0) {
    console.log(`[extractor] 이미지 추출 + base64 인코딩 중...`);
    const outDir = extractImageFiles(pdfPath);
    images = imagesToBase64(pdfPath, filtered, outDir);

    // 임시 디렉토리 정리
    try {
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
      // 정리 실패는 무시
    }

    console.log(`[extractor] ${images.length}개 이미지 base64 인코딩 완료`);
  }

  return {
    pdfPath: path.resolve(pdfPath),
    text,
    images,
    imageCount: images.length
  };
}

module.exports = {
  extractText,
  listImages,
  filterImages,
  extractImageFiles,
  imagesToBase64,
  extractAll
};
