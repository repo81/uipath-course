import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/import-uiadav1-quiz.mjs <extracted.txt> <output.js>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const questionPattern = /Question:\s*(\d+)\b[\s\S]*?(?=Question:\s*\d+\b|$)/g;

const clean = (value) => value
  .replace(/--\s*\d+\s+of\s+99\s*--/gi, " ")
  .replace(/Ui-ADAv1:\s*Actual Exam Q&A\s*\|\s*CLEARCATNET/gi, " ")
  .replace(/^Options:\s*$/gim, " ")
  .replace(/[\t\r\n]+/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

const questions = [];
const skipped = [];
const duplicateQuestions = [];
const seenQuestions = new Set();

for (const match of raw.matchAll(questionPattern)) {
  const sourceNumber = Number(match[1]);
  const block = match[0].replace(/^Question:\s*\d+\b[^\r\n]*[\r\n]*/i, "");
  const answerMatch = block.match(/^(?:Correct Answer|Answer(?:\(s\))?)\s*[:\-]\s*([A-H])/mi);

  if (!answerMatch) {
    skipped.push(sourceNumber);
    continue;
  }

  const questionAndOptions = block.slice(0, answerMatch.index);
  const optionPattern = /^(?:•\s*)?([A-H])(?:\.|-)\s*/gm;
  const optionMatches = [...questionAndOptions.matchAll(optionPattern)];

  if (optionMatches.length < 2) {
    skipped.push(sourceNumber);
    continue;
  }

  const question = clean(questionAndOptions.slice(0, optionMatches[0].index));
  const options = optionMatches.map((optionMatch, index) => {
    const start = optionMatch.index + optionMatch[0].length;
    const end = optionMatches[index + 1]?.index ?? questionAndOptions.length;
    return clean(questionAndOptions.slice(start, end));
  });
  const answerLetter = answerMatch[1].toUpperCase();
  const answer = optionMatches.findIndex((optionMatch) => optionMatch[1].toUpperCase() === answerLetter);

  if (!question || options.some((option) => !option) || answer < 0) {
    skipped.push(sourceNumber);
    continue;
  }

  if (seenQuestions.has(question)) {
    duplicateQuestions.push(sourceNumber);
    continue;
  }
  seenQuestions.add(question);

  const afterAnswer = block.slice(answerMatch.index + answerMatch[0].length);
  const explanationMatch = afterAnswer.match(/Explanation:\s*([\s\S]*)/i);
  let explanation = explanationMatch ? explanationMatch[1] : "";
  explanation = explanation
    .split(/\bReferences?:/i)[0]
    .replace(/\bReference:\s*[\s\S]*$/i, "");
  explanation = clean(explanation);

  questions.push({
    sourceNumber,
    q: question,
    options,
    answer,
    explanation: explanation || `The answer key supplied with the practice exam identifies option ${answerLetter} as correct.`,
  });
}

const contents = `// Generated from the user-provided UI-ADAv1 practice exam PDF.\n` +
  `// ${questions.length} complete multiple-choice questions imported; source-only visual and duplicate questions were omitted.\n` +
  `export const uiadav1Quiz = ${JSON.stringify(questions, null, 2)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, contents, "utf8");

console.log(`Imported ${questions.length} questions.`);
console.log(`Skipped duplicate questions: ${duplicateQuestions.join(", ") || "none"}`);
const importedNumbers = new Set(questions.map(({ sourceNumber }) => sourceNumber));
const omittedNumbers = Array.from({ length: 166 }, (_, index) => index + 1)
  .filter((sourceNumber) => !importedNumbers.has(sourceNumber));
console.log(`Skipped source questions: ${[...new Set([...skipped, ...omittedNumbers])].sort((a, b) => a - b).join(", ") || "none"}`);
