const Quiz = {
  state: null,
  elements: {},
  init() {
    this.cacheElements();
    this.attachListeners();
    document.addEventListener('ucbt-data-ready', () => {
      this.loadDefaults();
      this.restoreState();
      this.renderSetup();
    });
  },
  cacheElements() {
    this.elements = {
      setupPanel: document.getElementById('setupPanel'),
      quizPanel: document.getElementById('quizPanel'),
      questionText: document.getElementById('questionText'),
      optionList: document.getElementById('optionList'),
      timerValue: document.getElementById('timerValue'),
      progressBar: document.getElementById('progressBar'),
      questionNumber: document.getElementById('questionNumber'),
      currentTopic: document.getElementById('currentTopic'),
      startButton: document.getElementById('startTestButton'),
      countSelect: document.getElementById('questionCount'),
      topicSelect: document.getElementById('topicMode'),
      shuffleQuestions: document.getElementById('shuffleQuestions'),
      shuffleOptions: document.getElementById('shuffleOptions'),
      timerToggle: document.getElementById('timerEnabled'),
      soundToggle: document.getElementById('soundEnabled'),
      fontSizeInput: document.getElementById('fontSize'),
      questionPalette: document.getElementById('questionPalette'),
      saveNextButton: document.getElementById('saveNextButton'),
      prevButton: document.getElementById('prevButton'),
      markButton: document.getElementById('markButton'),
      skipButton: document.getElementById('skipButton'),
      submitButton: document.getElementById('submitButton'),
      bookmarkButton: document.getElementById('bookmarkButton'),
      noteField: document.getElementById('questionNote'),
      fullscreenButton: document.getElementById('fullscreenButton'),
      activeMessage: document.getElementById('activeTestMessage')
    };
  },
  loadDefaults() {
    const settings = Storage.getSettings();
    this.elements.shuffleQuestions.checked = settings.shuffleQuestions;
    this.elements.shuffleOptions.checked = settings.shuffleOptions;
    this.elements.timerToggle.checked = settings.timerEnabled;
    this.elements.soundToggle.checked = settings.soundEnabled;
    this.elements.fontSize.value = settings.fontSize;
    this.elements.countSelect.value = settings.lastCount || '20';
    this.elements.topicSelect.value = settings.lastTopic || 'Mixed Test';
  },
  attachListeners() {
    this.elements.startButton?.addEventListener('click', () => this.startTest());
    this.elements.saveNextButton?.addEventListener('click', () => this.saveAnswer(true));
    this.elements.prevButton?.addEventListener('click', () => this.navigateQuestion(-1));
    this.elements.markButton?.addEventListener('click', () => this.toggleReviewFlag());
    this.elements.skipButton?.addEventListener('click', () => this.skipQuestion());
    this.elements.submitButton?.addEventListener('click', () => this.confirmSubmit());
    this.elements.bookmarkButton?.addEventListener('click', () => this.toggleBookmark());
    this.elements.fullscreenButton?.addEventListener('click', () => this.toggleFullscreen());
    this.elements.noteField?.addEventListener('input', e => this.saveNote(e.target.value));
    document.addEventListener('keydown', e => this.keyboardHandler(e));
    [this.elements.shuffleQuestions, this.elements.shuffleOptions, this.elements.timerToggle, this.elements.soundToggle]?.forEach(el => {
      el?.addEventListener('change', () => this.commitSettings());
    });
    this.elements.fontSize?.addEventListener('change', e => {
      App.settings.fontSize = e.target.value;
      Storage.saveSettings(App.settings);
      App.applyFontSize();
    });
  },
  commitSettings() {
    App.settings.shuffleQuestions = this.elements.shuffleQuestions.checked;
    App.settings.shuffleOptions = this.elements.shuffleOptions.checked;
    App.settings.timerEnabled = this.elements.timerToggle.checked;
    App.settings.soundEnabled = this.elements.soundToggle.checked;
    Storage.saveSettings(App.settings);
  },
  restoreState() {
    const saved = Storage.getActiveTest();
    if (!saved) {
      this.showSetup();
      return;
    }
    if (!saved.questions || !saved.questions.length) {
      Storage.clearActiveTest();
      this.showSetup();
      return;
    }
    this.state = saved;
    this.showQuiz();
    this.renderQuestion();
    if (this.state.timerEnabled) {
      this.startTimer(this.state.remainingSeconds || this.state.totalSeconds);
    }
    this.renderPalette();
    this.updateActionState();
    this.showResumeMessage();
  },
  showResumeMessage() {
    if (this.elements.activeMessage) {
      this.elements.activeMessage.innerText = 'A saved quiz session is restored. Continue where you left off.';
      this.elements.activeMessage.classList.remove('hidden');
    }
  },
  renderSetup() {
    this.showSetup();
    const total = App.questions.length;
    document.querySelectorAll('[data-total-questions]')?.forEach(el => el.textContent = String(total));
  },
  showSetup() {
    this.elements.setupPanel?.classList.remove('hidden');
    this.elements.quizPanel?.classList.add('hidden');
  },
  showQuiz() {
    this.elements.setupPanel?.classList.add('hidden');
    this.elements.quizPanel?.classList.remove('hidden');
  },
  startTest() {
    if (!App.questions.length) return;
    this.commitSettings();
    const count = parseInt(this.elements.countSelect.value, 10) || 20;
    const topicMode = this.elements.topicSelect.value || 'Mixed Test';
    App.settings.lastCount = String(count);
    App.settings.lastTopic = topicMode;
    Storage.saveSettings(App.settings);
    const pool = this.buildQuestionPool(topicMode);
    const chosen = App.settings.shuffleQuestions ? Utils.randomize(pool) : pool.slice();
    const questions = chosen.slice(0, count).map(q => this.prepareQuestion(q));
    const totalSeconds = App.settings.timerEnabled ? count * 60 : count * 60;
    this.state = {
      active: true,
      questions,
      answers: {},
      marked: {},
      skipped: [],
      notes: {},
      currentIndex: 0,
      visited: {},
      timerEnabled: App.settings.timerEnabled,
      totalSeconds,
      remainingSeconds: totalSeconds,
      startedAt: Date.now(),
      settings: { ...App.settings, topicMode, questionCount: count }
    };
    this.saveState();
    this.showQuiz();
    this.renderQuestion();
    this.startTimer(this.state.remainingSeconds);
    this.renderPalette();
    this.updateActionState();
  },
  buildQuestionPool(topic) {
    const retryMode = localStorage.getItem('ucbt_retry_mode');
    if (retryMode) {
      const last = Storage.load('ucbt_last_result', null);
      localStorage.removeItem('ucbt_retry_mode');
      if (last?.resultState?.questions) {
        const ids = last.resultState.questions.filter(q => {
          if (retryMode === 'wrong') {
            return last.resultState.answers?.[q.id] && last.resultState.answers[q.id] !== q.correct;
          }
          if (retryMode === 'skipped') {
            return last.resultState.skipped?.includes(q.id) || !last.resultState.answers?.[q.id];
          }
          return true;
        }).map(q => q.id);
        return App.questions.filter(q => ids.includes(q.id));
      }
    }
    const normalized = topic.toLowerCase();
    if (normalized === 'mixed test') {
      return App.questions.slice();
    }
    const keyword = normalized;
    const filtered = App.questions.filter(q => {
      const t = q.topic.toLowerCase();
      const qtext = q.question.toLowerCase();
      return t.includes(keyword) || qtext.includes(keyword) || q.topic.toLowerCase().includes(keyword);
    });
    return filtered.length ? filtered : App.questions.slice();
  },
  prepareQuestion(question) {
    const base = {
      id: question.id,
      topic: question.topic || 'General',
      question: question.question,
      options: question.options.slice()
    };
    const correctText = question.options[question.answer - 1] || '';
    if (App.settings.shuffleOptions) {
      const shuffled = Utils.randomize(base.options);
      const correctIndex = shuffled.findIndex(opt => opt === correctText) + 1;
      return { ...base, options: shuffled, correct: Math.max(correctIndex, 1) };
    }
    return { ...base, correct: question.answer };
  },
  startTimer(seconds) {
    if (!this.state.timerEnabled) return;
    Timer.start(seconds, remaining => {
      this.state.remainingSeconds = remaining;
      this.elements.timerValue.textContent = Utils.formatTime(remaining);
      if (remaining <= 300) {
        this.elements.timerValue.classList.add('timer-warning');
      }
      if (remaining <= 60) {
        this.elements.timerValue.classList.add('timer-critical');
      }
      this.saveState();
    }, () => this.finalizeTest('Time is up. Your quiz has been submitted.'));
  },
  renderQuestion() {
    if (!this.state) return;
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    this.elements.questionText.innerHTML = question.question.replace(/\r?\n/g, '<br>');
    this.elements.currentTopic.textContent = question.topic;
    this.elements.questionNumber.textContent = `Question ${this.state.currentIndex + 1} of ${this.state.questions.length}`;
    this.elements.progressBar.style.width = `${((this.state.currentIndex + 1) / this.state.questions.length) * 100}%`;
    this.renderOptions(question);
    this.elements.noteField.value = this.state.notes[question.id] || '';
    this.renderBookmarkButton(question.id);
    this.state.visited[question.id] = true;
    this.saveState();
    this.renderPalette();
    this.updateActionState();
  },
  renderOptions(question) {
    this.elements.optionList.innerHTML = '';
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-item';
      button.innerHTML = `<span class="option-key">${['A','B','C','D'][index] || ''}</span><span>${Utils.safeText(option)}</span>`;
      const selected = this.state.answers[question.id] === index + 1;
      if (selected) button.classList.add('selected');
      button.addEventListener('click', () => this.selectAnswer(index + 1));
      this.elements.optionList.appendChild(button);
    });
  },
  selectAnswer(value) {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    this.state.answers[question.id] = value;
    const skipIndex = this.state.skipped.indexOf(question.id);
    if (skipIndex !== -1) {
      this.state.skipped.splice(skipIndex, 1);
    }
    this.saveState();
    this.renderQuestion();
    if (App.settings.soundEnabled) {
      this.playSound();
    }
  },
  saveAnswer(moveNext = false) {
    if (moveNext) {
      this.navigateQuestion(1);
    }
  },
  navigateQuestion(direction) {
    if (!this.state) return;
    const nextIndex = Utils.clamp(this.state.currentIndex + direction, 0, this.state.questions.length - 1);
    this.state.currentIndex = nextIndex;
    this.saveState();
    this.renderQuestion();
  },
  toggleReviewFlag() {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    this.state.marked[question.id] = !this.state.marked[question.id];
    this.saveState();
    this.renderPalette();
    this.updateMarkButton();
  },
  skipQuestion() {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    if (!this.state.skipped.includes(question.id)) {
      this.state.skipped.push(question.id);
    }
    this.saveState();
    this.navigateQuestion(1);
  },
  toggleBookmark() {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    const bookmarks = Storage.toggleBookmark(question.id);
    const active = bookmarks.includes(question.id);
    this.elements.bookmarkButton.classList.toggle('bookmarked', active);
    this.updateBookmarkLabel(active);
  },
  renderBookmarkButton(questionId) {
    const bookmarks = Storage.getBookmarks();
    const active = bookmarks.includes(questionId);
    this.elements.bookmarkButton.classList.toggle('bookmarked', active);
    this.updateBookmarkLabel(active);
  },
  updateBookmarkLabel(active) {
    this.elements.bookmarkButton.innerText = active ? 'Bookmarked' : 'Bookmark';
  },
  saveNote(text) {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    this.state.notes[question.id] = text;
    this.saveState();
  },
  renderPalette() {
    this.elements.questionPalette.innerHTML = '';
    this.state.questions.forEach((question, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'palette-item';
      const status = this.getQuestionStatus(question.id);
      item.classList.add(status);
      item.textContent = String(index + 1);
      item.addEventListener('click', () => {
        this.state.currentIndex = index;
        this.saveState();
        this.renderQuestion();
      });
      this.elements.questionPalette.appendChild(item);
    });
  },
  getQuestionStatus(id) {
    if (this.state.marked[id]) return 'status-review';
    if (this.state.answers[id]) return 'status-answered';
    if (this.state.skipped.includes(id)) return 'status-skipped';
    return 'status-unvisited';
  },
  updateActionState() {
    if (!this.state) return;
    this.elements.prevButton.disabled = this.state.currentIndex === 0;
    this.elements.saveNextButton.disabled = !this.state.questions.length;
    this.elements.submitButton.disabled = !this.state.questions.length;
    this.updateMarkButton();
  },
  updateMarkButton() {
    const question = this.state.questions[this.state.currentIndex];
    if (!question) return;
    const marked = !!this.state.marked[question.id];
    this.elements.markButton.textContent = marked ? 'Unmark Review' : 'Mark for Review';
  },
  confirmSubmit() {
    if (confirm('Submit the test now?')) {
      this.finalizeTest('You submitted the test successfully.');
    }
  },
  finalizeTest(message) {
    if (!this.state) return;
    try {
      // Safe timer stop
      if (typeof Timer !== 'undefined' && Timer && Timer.stop) {
        Timer.stop();
      }
      console.log('Finalizing test...');
      
      const duration = Math.round((this.state.totalSeconds - (this.state.remainingSeconds || 0)));
      const resultState = {
        questions: Array.isArray(this.state.questions) ? this.state.questions : [],
        answers: (this.state.answers && typeof this.state.answers === 'object') ? this.state.answers : {},
        startedAt: this.state.startedAt || 0,
        endedAt: Date.now(),
        duration: duration || 0,
        settings: (this.state.settings && typeof this.state.settings === 'object') ? this.state.settings : {},
        skipped: Array.isArray(this.state.skipped) ? this.state.skipped : [],
        marked: (this.state.marked && typeof this.state.marked === 'object') ? this.state.marked : {},
        notes: (this.state.notes && typeof this.state.notes === 'object') ? this.state.notes : {}
      };
      
      // Check Analytics module exists
      if (typeof Analytics === 'undefined' || !Analytics || !Analytics.calculateResult) {
        throw new Error('Analytics module not initialized');
      }
      
      console.log('Calculating result...');
      const summary = Analytics.calculateResult(resultState);
      const topicAccuracy = {};
      if (summary.topics && typeof summary.topics === 'object') {
        Object.entries(summary.topics).forEach(([topic, value]) => {
          if (value && typeof value === 'object' && value.total) {
            topicAccuracy[topic] = Math.round((value.correct / value.total) * 100) || 0;
          }
        });
      }
      const historyEntry = {
        timestamp: new Date().toISOString(),
        total: summary.total || 0,
        correct: summary.correct || 0,
        wrong: summary.wrong || 0,
        skipped: summary.skipped || 0,
        percentage: summary.percentage || 0,
        accuracy: summary.accuracy || 0,
        pass: summary.pass || false,
        duration: duration || 0,
        topicMode: (this.state.settings && this.state.settings.topicMode) || 'Mixed Test',
        topicAccuracy: topicAccuracy
      };
      Storage.addHistoryEntry(historyEntry);
      Storage.save('ucbt_last_result', { summary: summary, resultState: resultState });
      Storage.clearActiveTest();
      this.state = null;
      setTimeout(() => {
        window.location.href = 'result.html';
      }, 100);
    } catch (error) {
      console.error('Error finalizing test:', error);
      console.error('Error details:', error.message, error.stack);
      alert('Error: ' + (error.message || 'An error occurred while processing results. Please refresh and try again.'));
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 100);
    }
  },
  saveState() {
    if (!this.state) return;
    Storage.saveActiveTest(this.state);
  },
  keyboardHandler(event) {
    if (!this.state || this.elements.quizPanel.classList.contains('hidden')) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowright') { this.navigateQuestion(1); event.preventDefault(); }
    if (key === 'arrowleft') { this.navigateQuestion(-1); event.preventDefault(); }
    if (key === 'enter') { this.saveAnswer(true); event.preventDefault(); }
    const choiceKeys = ['a','b','c','d'];
    const index = choiceKeys.indexOf(key);
    if (index !== -1) { this.selectAnswer(index + 1); event.preventDefault(); }
  },
  playSound() {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 480;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.04);
    } catch (error) {
      console.warn('Sound not available', error);
    }
  },
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
};
