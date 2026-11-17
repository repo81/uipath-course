# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Practice exam data

The exam uses `public/uipath.pdf`: 377 questions with the PDF's answer keys and explanations. It includes 355 single-answer questions, 4 multiple-answer questions, and 18 hotspot/ordering review questions. Review questions use an answer reveal and do not affect the score. Source-page links and cropped PDF exhibits preserve visual context.

To regenerate the question bank and exhibit assets after replacing the PDF:

```bash
npm run import:exam
npm run build
npm run lint
```

The importer validates this PDF's 377 sequential question numbers before writing `src/data/uiadav1Quiz.js`. Update that validation when intentionally switching to a different source edition. Generated exhibits are stored in `public/exam-exhibits/`. The importer requires the installed development dependencies, including PDF.js and the canvas renderer; these are not shipped in the browser bundle.

Saved-question storage is versioned for this question bank so bookmarks from the previous PDF cannot silently point to different questions.
