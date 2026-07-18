const Dashboard = {
  cacheElements() {
    this.elements = {
      bestScore: document.getElementById('bestScore'),
      averageScore: document.getElementById('averageScore'),
      totalTests: document.getElementById('totalTests'),
      totalQuestions: document.getElementById('totalQuestions'),
      bestTopic: document.getElementById('bestTopic'),
      weakTopic: document.getElementById('weakTopic'),
      streak: document.getElementById('bestStreak'),
      recentList: document.getElementById('recentTests'),
      weeklyCanvas: document.getElementById('weeklyChart'),
      topicCanvas: document.getElementById('topicChart'),
      ringCanvas: document.getElementById('ringChart'),
      importInput: document.getElementById('importJsonInput'),
      importButton: document.getElementById('importJsonButton'),
      exportButton: document.getElementById('exportAnalyticsButton'),
      printButton: document.getElementById('printDashboardButton'),
      messageBox: document.getElementById('dashboardMessage')
    };
  },
  init() {
    document.addEventListener('ucbt-data-ready', () => {
      this.cacheElements();
      this.attachListeners();
      this.renderDashboard();
    });
  },
  attachListeners() {
    this.elements.importButton?.addEventListener('click', () => this.elements.importInput?.click());
    this.elements.importInput?.addEventListener('change', event => this.importFile(event.target.files[0]));
    this.elements.exportButton?.addEventListener('click', () => this.exportAnalytics());
    this.elements.printButton?.addEventListener('click', () => window.print());
  },
  renderDashboard() {
    const summary = Analytics.getSummary();
    const history = Storage.getHistory();
    this.elements.bestScore.textContent = `${Analytics.getHighScoreValue()}%`;
    this.elements.averageScore.textContent = `${summary.averageScore}%`;
    this.elements.totalTests.textContent = String(summary.tests);
    this.elements.totalQuestions.textContent = String(summary.totalQuestions);
    this.elements.bestTopic.textContent = summary.bestTopic;
    this.elements.weakTopic.textContent = summary.weakTopic;
    this.elements.streak.textContent = String(summary.streak);
    this.renderRecentTests(history);
    this.renderCharts(history);
    this.renderDashboardMessage(history);
  },
  renderRecentTests(history) {
    if (!this.elements.recentList) return;
    this.elements.recentList.innerHTML = '';
    history.slice(0, 5).forEach(item => {
      const row = document.createElement('li');
      row.className = 'recent-test-card';
      row.innerHTML = `
        <strong>${item.topicMode || 'Mixed Test'}</strong>
        <span>${new Date(item.timestamp).toLocaleDateString()}</span>
        <div class="recent-items"><span>${item.percentage}%</span><span>${item.correct}/${item.total}</span></div>
      `;
      this.elements.recentList.appendChild(row);
    });
    if (!history.length) {
      this.elements.recentList.innerHTML = '<li class="recent-test-card">No tests completed yet. Start a quiz to track progress.</li>';
    }
  },
  renderCharts(history) {
    const topicData = {};
    history.forEach(entry => {
      Object.entries(entry.topicAccuracy || {}).forEach(([topic, value]) => {
        if (!topicData[topic]) topicData[topic] = { sum: 0, count: 0 };
        topicData[topic].sum += value;
        topicData[topic].count += 1;
      });
    });
    const topicLabels = Object.keys(topicData).slice(0, 6);
    const topicValues = topicLabels.map(topic => Math.round(topicData[topic].sum / topicData[topic].count));
    if (topicLabels.length) {
      Charts.drawBar(this.elements.topicCanvas, topicValues, topicLabels);
    }
    const lastSeven = history.slice(0, 7).reverse();
    const lineLabels = lastSeven.map((entry, index) => `T${lastSeven.length - index}`);
    const lineData = lastSeven.map(entry => entry.percentage);
    if (lineData.length) {
      Charts.drawLine(this.elements.weeklyCanvas, lineData, lineLabels);
    }
    const last = history[0] || { percentage: 0, correct: 0, total: 0 };
    Charts.drawPie(this.elements.ringCanvas, [last.percentage, 100 - last.percentage], ['Score', 'Remaining'], ['#6dd1a4', '#2d335a']);
  },
  renderDashboardMessage(history) {
    if (!this.elements.messageBox) return;
    if (!history.length) {
      this.elements.messageBox.textContent = 'Start your first test to populate the dashboard analytics.';
      return;
    }
    const last = history[0];
    this.elements.messageBox.textContent = `Last test: ${last.topicMode || 'Mixed Test'} — ${last.percentage}% score.`;
  },
  importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (payload?.questions && Array.isArray(payload.questions) && payload.questions.length) {
          Storage.save('ucbt_imported_questions', payload);
          this.showToast('Imported new question database. Reload to apply.');
        } else {
          this.showToast('The selected JSON file does not contain a questions array.');
        }
      } catch (err) {
        this.showToast('Invalid JSON file. Please choose a valid import file.');
      }
    };
    reader.readAsText(file);
  },
  exportAnalytics() {
    const history = Storage.getHistory();
    Utils.download('uidai-cbt-analytics.json', JSON.stringify({ history, generatedAt: new Date().toISOString() }, null, 2));
  },
  showToast(message) {
    if (!this.elements.messageBox) return;
    this.elements.messageBox.textContent = message;
    this.elements.messageBox.classList.add('toast-visible');
    window.setTimeout(() => {
      this.elements.messageBox.classList.remove('toast-visible');
    }, 4000);
  }
};
