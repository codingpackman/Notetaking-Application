# PDF Study Tool

A Next.js application that allows you to upload PDFs, highlight text/areas, add bookmarks, and study interactively using AI (Google Gemini).

## Features

- **Upload PDFs**: Load multiple PDF files into your study workspace.
- **Interactive Highlighting**: Highlight text or select areas (e.g. for images/diagrams) in your PDFs.
- **Bookmarks**: Bookmark specific parts of the document for quick access.
- **AI Assistant**:
  - Get simplified, detailed summaries of highlighted text.
  - Generate practice questions (hard, review, tricky) based on the content.
  - Create flashcards from selected text to test your knowledge.
- **Persistent Storage**: Your files and highlights are stored locally (using Zustand).

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Set up Environment Variables**:
   Create a `.env` or `.env.local` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser to view the application.

## Usage Guide

### 1. Uploading a PDF
- In the **My Files** sidebar on the left, click the **Upload (↑)** button.
- Select one or more PDF files from your computer.
- Click on a PDF in the file tree to open it in the viewer.

### 2. Highlighting Text & Images
- **Text Highlight**: Click and drag over any text in the PDF to highlight it.
- **Area/Image Highlight**: Hold the `Alt` (or `Option`) key, then click and drag to select an area, such as a diagram or image.
- A popup menu will appear once you finish selecting.

### 3. Multi-Box Selection (Batch Mode)
- Select text or an area and click **Add to Batch** in the popup menu.
- The selection will be saved temporarily and a floating action bar will appear at the bottom of the PDF viewer.
- You can continue selecting additional text/areas and adding them to the batch.
- Once you are ready, use the floating action bar to generate a **Summary** or **Flashcards** for all the combined selections at once!

### 4. Using the AI Assistant
From the highlight popup menu, you can select one of the following AI actions:
- **Summarize**: Generates a detailed, beginner-friendly explanation of the selected content.
- **Practice Q**: Hover over this to choose between generating a **Hard**, **Review**, or **Tricky** question based on the selection.
- **Flashcards**: Creates front/back flashcards for the selected material.
- The AI's response will appear in the **AI Assistant** sidebar on the right.
- You can clear your AI history using the trash icon at the top of the AI panel.

### 4. Bookmarks
- Select text or an area, and click **Bookmark** in the popup menu.
- The bookmark will be saved under the current PDF in the file tree.
- Clicking the bookmark in the sidebar will instantly scroll the PDF viewer to that exact location.

## Learn More

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font). It relies on [react-pdf-highlighter](https://github.com/agentcooper/react-pdf-highlighter) for rendering PDFs and managing highlights, and Google's [Gemini API](https://ai.google.dev/) for generating AI responses.
