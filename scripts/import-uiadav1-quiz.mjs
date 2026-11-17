import fs from "node:fs";
import path from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

const inputPath = process.argv[2] || "public/uipath.pdf";
const outputPath = process.argv[3] || "src/data/uiadav1Quiz.js";
const assetDir = "public/exam-exhibits";
const document = await getDocument({ data: new Uint8Array(fs.readFileSync(inputPath)), useSystemFonts: true }).promise;
const clean = value => value.replace(/\s+/g, " ").trim();
let raw = "";
let currentNumber = null;
let answered = true;
const sourcePages = new Map();
const exhibits = new Map();
fs.mkdirSync(assetDir, { recursive: true });

for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();
  // Exclude rotated background watermarks, branding, and transaction footers.
  const items = content.items.filter(item => item.str && Math.abs(item.transform[1]) < 0.1
    && !/CertEmpire|Get Simulator Access|\{"userId"/i.test(item.str));
  let text = "";
  let previousY = null;
  for (const item of items) {
    if (previousY !== null && Math.abs(item.transform[5] - previousY) > 3) text += "\n";
    text += item.str + (item.hasEOL ? "\n" : " ");
    previousY = item.transform[5];
  }
  raw += text + "\n";
  const question = text.match(/Question:\s*(\d+)/);
  if (question) {
    currentNumber = Number(question[1]);
    sourcePages.set(currentNumber, pageNumber);
    answered = false;
  }
  const answerItem = items.find(item => /^Answer:\s*$/.test(item.str.trim()));
  if (currentNumber && !answered) {
    const operators = await page.getOperatorList();
    const hasImage = operators.fnArray.some(op => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(op));
    if (hasImage) {
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      const questionItem = items.find(item => /^Question:/.test(item.str.trim()));
      const top = questionItem ? Math.max(0, viewport.height - (questionItem.transform[5] + 22) * 1.5) : 55;
      const bottom = answerItem ? viewport.height - (answerItem.transform[5] + 12) * 1.5 : viewport.height - 65;
      if (bottom > top) {
        const cropped = createCanvas(canvas.width - 80, Math.ceil(bottom - top));
        cropped.getContext("2d").drawImage(canvas, 40, top, canvas.width - 80, bottom - top, 0, 0, cropped.width, cropped.height);
        const name = `question-${currentNumber}-page-${pageNumber}.webp`;
        fs.writeFileSync(path.join(assetDir, name), cropped.toBuffer("image/webp"));
        exhibits.set(currentNumber, [...(exhibits.get(currentNumber) || []), `exam-exhibits/${name}`]);
      }
    }
  }
  if (answerItem) answered = true;
}

const questions = [];
for (const match of raw.matchAll(/Question:\s*(\d+)\b([\s\S]*?)(?=Question:\s*\d+\b|$)/g)) {
  const sourceNumber = Number(match[1]);
  const block = match[2];
  const answerMatch = block.match(/\bAnswer:\s*([\s\S]*?)(?=Explanation:|$)/);
  if (!answerMatch) throw new Error(`Missing answer for question ${sourceNumber}`);
  const beforeAnswer = block.slice(0, answerMatch.index);
  const optionMatches = [...beforeAnswer.matchAll(/^\s*([A-H])\.\s+/gm)];
  const answerText = answerMatch[1].trim();
  const multipleChoice = /^[A-H](?:\s*,\s*[A-H])*$/.test(answerText) && optionMatches.length >= 2;
  const options = multipleChoice ? optionMatches.map((option, i) => clean(beforeAnswer.slice(option.index + option[0].length, optionMatches[i + 1]?.index ?? beforeAnswer.length))) : [];
  const answers = multipleChoice ? answerText.split(/\s*,\s*/).map(letter => optionMatches.findIndex(option => option[1] === letter)) : [];
  if (answers.some(index => index < 0) || options.some(option => !option)) throw new Error(`Invalid options for question ${sourceNumber}`);
  const explanation = clean((block.split(/Explanation:\s*/)[1] || "").split(/\bReferences?:/i)[0]);
  questions.push({ sourceNumber, sourcePage: sourcePages.get(sourceNumber),
    q: clean(multipleChoice ? beforeAnswer.slice(0, optionMatches[0].index) : beforeAnswer),
    options, answer: answers[0] ?? null, answers, answerText,
    type: multipleChoice ? (answers.length > 1 ? "multiple" : "single") : "review",
    explanation, exhibits: exhibits.get(sourceNumber) || [] });
}
if (questions.length !== 377 || questions.some((q, i) => q.sourceNumber !== i + 1)) throw new Error("Expected all 377 source questions in order");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `// Generated from public/uipath.pdf by scripts/import-uiadav1-quiz.mjs.\nexport const uiadav1Quiz = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Imported ${questions.length} questions: ${questions.filter(q => q.type === "single").length} single-answer, ${questions.filter(q => q.type === "multiple").length} multiple-answer, ${questions.filter(q => q.type === "review").length} review. Preserved exhibits for ${exhibits.size} questions.`);
