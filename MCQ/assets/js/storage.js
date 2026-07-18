const Storage = {
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Unable to save data', error);
    }
  },
  load(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  getSettings() {
    const saved = this.load('ucbt_settings', {});
    return Object.assign({
      theme: 'dark',
      timerEnabled: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      soundEnabled: true,
      fontSize: '16',
      lastTopic: 'Mixed Test',
      lastCount: '20'
    }, saved);
  },
  saveSettings(settings) {
    this.save('ucbt_settings', settings);
  },
  getActiveTest() {
    return this.load('ucbt_active_test', null);
  },
  saveActiveTest(testState) {
    this.save('ucbt_active_test', testState);
  },
  clearActiveTest() {
    localStorage.removeItem('ucbt_active_test');
  },
  getHistory() {
    return this.load('ucbt_history', []);
  },
  saveHistory(history) {
    this.save('ucbt_history', history);
  },
  addHistoryEntry(entry) {
    const history = this.getHistory();
    history.unshift(entry);
    this.saveHistory(history.slice(0, 50));
  },
  getBookmarks() {
    return this.load('ucbt_bookmarks', []);
  },
  toggleBookmark(questionId) {
    const bookmarks = this.getBookmarks();
    const index = bookmarks.indexOf(questionId);
    if (index === -1) {
      bookmarks.push(questionId);
    } else {
      bookmarks.splice(index, 1);
    }
    this.save('ucbt_bookmarks', bookmarks);
    return bookmarks;
  }
};
