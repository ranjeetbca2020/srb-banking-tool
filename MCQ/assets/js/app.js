const App = {
  dataPath: 'data/questions.json',
  questions: [],
  settings: {
    theme: 'dark',
    timerEnabled: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    soundEnabled: true,
    fontSize: '16',
    lastTopic: 'Mixed Test',
    lastCount: '20'
  },
  initCommon() {
    this.settings = Storage.getSettings();
    this.applyTheme();
    this.applyFontSize();
    this.attachThemeToggle();
    this.updateGlobalStats();
    this.loadQuestionData(() => {
      this.updateGlobalStats();
      const initEvent = new Event('ucbt-data-ready');
      document.dispatchEvent(initEvent);
    });
  },
  updateGlobalStats() {
    const scoreLabels = document.querySelectorAll('[data-highscore-value]');
    scoreLabels.forEach(el => { el.textContent = typeof Analytics !== 'undefined' ? Analytics.getHighScoreValue() : '0'; });
    const countLabels = document.querySelectorAll('[data-total-questions]');
    countLabels.forEach(el => { el.textContent = String(this.questions.length); });
  },
  loadQuestionData(callback) {
    const imported = Storage.load('ucbt_imported_questions', null);
    if (imported && Array.isArray(imported.questions) && imported.questions.length) {
      this.questions = imported.questions;
      callback();
      return;
    }
    const request = new XMLHttpRequest();
    request.overrideMimeType('application/json');
    request.open('GET', this.dataPath, true);
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return;
      if (request.status === 200 || request.status === 0) {
        try {
          const payload = JSON.parse(request.responseText);
          App.questions = payload.questions || [];
          callback();
          return;
        } catch (err) {
          console.error('JSON parse failed', err);
        }
      }
      document.body.classList.add('error-state');
      document.getElementById('appErrorMessage')?.classList.remove('hidden');
    };
    request.send();
  },
  applyTheme() {
    const root = document.documentElement;
    if (this.settings.theme === 'light') {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
    }
    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.textContent = this.settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      toggle.setAttribute('aria-pressed', this.settings.theme === 'light');
    }
  },
  applyFontSize() {
    document.documentElement.style.setProperty('--base-font-size', `${this.settings.fontSize}px`);
  },
  attachThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
      Storage.saveSettings(this.settings);
      this.applyTheme();
    });
  },
  attachGlobalListeners() {
    window.addEventListener('DOMContentLoaded', () => {
      const badge = document.querySelector('[data-highscore-value]');
      if (badge) {
        badge.textContent = Analytics.getHighScoreValue();
      }
      const countLabel = document.querySelector('[data-total-questions]');
      if (countLabel) {
        countLabel.textContent = this.questions.length;
      }
    });
  }
};
