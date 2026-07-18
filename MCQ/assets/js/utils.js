const Utils = {
  randomize(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  safeText(text) {
    return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },
  download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },
  normalizeTopic(topic) {
    const lower = topic.toLowerCase();
    if (lower.includes('basic')) return 'Basic Knowledge';
    if (lower.includes('biometric')) return 'Biometric';
    if (lower.includes('demographic')) return 'Demographic';
    if (lower.includes('update') || lower.includes('ucl') || lower.includes('uc')) return 'Update';
    if (lower.includes('operator')) return 'Operator';
    if (lower.includes('supervisor')) return 'Supervisor';
    if (lower.includes('authentication')) return 'Authentication';
    return topic;
  },
  getDifficulty(question) {
    const optionCount = question.options.length;
    if (optionCount <= 2) return 'Easy';
    if (optionCount === 3) return 'Medium';
    return 'Hard';
  }
};
