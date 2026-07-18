# UIDAI CBT Mock Test

A complete offline CBT exam portal built with pure HTML5, CSS3 and vanilla JavaScript.

## Features
- Offline-ready exam experience using `index.html`
- Topic selection, question count selection, and shuffle options
- Timer, save-and-resume, auto-save with LocalStorage
- High score tracking, history and analytics
- Review mode with correct answers, user answers, and bookmarks
- Import new JSON question banks
- Keyboard shortcuts: A/B/C/D, Arrow keys, Enter
- Responsive UI for desktop, laptop, tablet, and mobile

## Folder Structure
```
UIDAI-CBT/
  index.html
  quiz.html
  dashboard.html
  review.html
  result.html
  about.html
  assets/
    css/
      style.css
      dashboard.css
      quiz.css
      result.css
      responsive.css
    js/
      app.js
      quiz.js
      timer.js
      storage.js
      analytics.js
      review.js
      dashboard.js
      charts.js
      utils.js
  data/
    questions.json
  README.md
```

## How to Run
1. Open `index.html` in your browser.
2. Choose a test mode on the quiz screen.
3. Answer questions, save progress, and submit to view results.

> If your browser blocks local JSON loading, open the folder in a simple local server or use Firefox/Edge for direct file access.

## How to Update Questions
1. Replace `data/questions.json` with a new JSON structure containing:
   - `id`
   - `topic`
   - `question`
   - `options`
   - `answer`
2. Or use the dashboard `Import JSON` button to load a new question database.

## Notes
- The app stores quiz state, user settings, bookmarks, history, and theme in `localStorage`.
- The built-in result and review pages depend on the last test and the saved history.
- The UI is optimized for a professional CBT exam feel with glassmorphism and animated sections.
