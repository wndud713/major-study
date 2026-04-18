#!/usr/bin/env node
'use strict';

/**
 * merge-html.js — HTML 스터디 파일 병합 CLI
 *
 * Usage:
 *   node merge-html.js                      # 전체 통합 (전공공부_통합.html)
 *   node merge-html.js --subject sports     # 단일 과목 (id 기준)
 *   node merge-html.js --subject neuro-motor
 *   node merge-html.js --subject neuro-disease
 *   node merge-html.js --all-subjects       # 3과목 각각 따로 출력
 *   node merge-html.js --all                # 전체 통합만
 */

const path = require('path');
const fs = require('fs');
const { parseHtmlFile } = require('./lib/html-parser');
const { mergeSubject, mergeAll } = require('./lib/merge-engine');

const CONFIG_PATH = path.join(__dirname, 'merge-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const args = process.argv.slice(2);
const subjectFlag = args.indexOf('--subject');
const allSubjectsFlag = args.includes('--all-subjects');
const allFlag = args.includes('--all') || args.length === 0;

function resolvePath(relOrAbs) {
  if (path.isAbsolute(relOrAbs)) return relOrAbs;
  return path.join(__dirname, relOrAbs);
}

function loadSubject(subjectConfig) {
  console.log(`\n--- ${subjectConfig.name} 파싱 중 (${subjectConfig.chapters.length}개) ---`);
  return subjectConfig.chapters.map(ch => ({
    parsed: parseHtmlFile(resolvePath(ch.file)),
    shortTitle: ch.shortTitle
  }));
}

function runSubject(subjectConfig) {
  const chapters = loadSubject(subjectConfig);
  const outputPath = resolvePath(
    path.isAbsolute(subjectConfig.outputFile)
      ? subjectConfig.outputFile
      : path.join(config.outputDir, subjectConfig.outputFile)
  );
  return mergeSubject({
    subject: subjectConfig.name,
    templatePath: resolvePath(config.templatePath),
    chapters,
    outputPath,
    title: subjectConfig.name + ' 통합'
  });
}

function runAll() {
  const subjects = config.subjects.map(sc => ({
    subject: sc.name,
    chapters: loadSubject(sc)
  }));
  const outputPath = resolvePath(path.join(config.outputDir, '전공공부_통합.html'));
  return mergeAll({
    templatePath: resolvePath(config.templatePath),
    subjects,
    outputPath,
    title: '전공공부 통합'
  });
}

// ── 실행 ────────────────────────────────────────────────────────────────────

if (subjectFlag !== -1) {
  const subjectId = args[subjectFlag + 1];
  if (!subjectId) {
    console.error('ERROR: --subject 다음에 과목 id를 입력하세요.');
    console.error('  사용 가능: ' + config.subjects.map(s => s.id).join(', '));
    process.exit(1);
  }
  const sc = config.subjects.find(s => s.id === subjectId);
  if (!sc) {
    console.error(`ERROR: 과목 "${subjectId}" 없음.`);
    console.error('  사용 가능: ' + config.subjects.map(s => s.id).join(', '));
    process.exit(1);
  }
  runSubject(sc);

} else if (allSubjectsFlag) {
  for (const sc of config.subjects) {
    runSubject(sc);
  }
  console.log('\n모든 과목별 통합 완료.');

} else if (allFlag) {
  runAll();
  console.log('\n전체 통합 완료.');
}
