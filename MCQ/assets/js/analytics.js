const Analytics = {
  calculateResult(testState) {
    if (!testState || !testState.questions) {
      return { total: 0, correct: 0, skipped: 0, answered: 0, wrong: 0, topics: {}, elapsed: 0, percentage: 0, accuracy: 0, approxTimePerQuestion: 0, pass: false };
    }
    const details = {
      total: testState.questions.length || 0,
      correct: 0,
      skipped: 0,
      answered: 0,
      wrong: 0,
      topics: {},
      elapsed: testState.duration || 0
    };
    if (!Array.isArray(testState.questions) || details.total === 0) {
      details.percentage = 0;
      details.accuracy = 0;
      details.approxTimePerQuestion = 0;
      details.pass = false;
      return details;
    }
    testState.questions.forEach((q, index) => {
      if (!q) return;
      const selected = testState.answers ? testState.answers[q.id] : null;
      const isSkip = Array.isArray(testState.skipped) && testState.skipped.includes(q.id);
      const correctAnswer = q.correct || q.answer || 1;
      const topic = q.topic || 'Mixed Test';
      if (!details.topics[topic]) {
        details.topics[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      details.topics[topic].total += 1;
      if (selected) {
        details.answered += 1;
        if (selected === correctAnswer) {
          details.correct += 1;
          details.topics[topic].correct += 1;
        } else {
          details.wrong += 1;
          details.topics[topic].wrong += 1;
        }
      } else if (isSkip) {
        details.skipped += 1;
        details.topics[topic].skipped += 1;
      } else {
        details.wrong += 1;
        details.topics[topic].wrong += 1;
      }
    });
    details.percentage = details.total ? Math.round((details.correct / details.total) * 100) : 0;
    details.accuracy = details.answered > 0 ? Math.round((details.correct / details.answered) * 100) : 0;
    details.approxTimePerQuestion = details.answered > 0 ? Math.round(details.elapsed / details.answered) : 0;
    details.pass = details.percentage >= 70;
    return details;
  },
  getHighScoreValue() {
    const history = Storage.getHistory();
    if (!history.length) return '0';
    return history.reduce((best, entry) => Math.max(best, entry.percentage), 0);
  },
  getSummary() {
    const history = Storage.getHistory();
    if (!history || !Array.isArray(history) || history.length === 0) {
      return {
        tests: 0,
        averageScore: 0,
        totalQuestions: 0,
        bestTopic: 'N/A',
        weakTopic: 'N/A',
        streak: 0
      };
    }
    const totalQuestions = history.reduce((sum, item) => sum + (item.total || 0), 0);
    const avgScoreSum = history.reduce((sum, item) => sum + (item.percentage || 0), 0);
    const averageScore = history.length > 0 ? Math.round(avgScoreSum / history.length) : 0;
    const topicStats = {};
    history.forEach(item => {
      if (!item) return;
      const topicAccuracy = item.topicAccuracy || item.topics || {};
      if (typeof topicAccuracy === 'object') {
        Object.entries(topicAccuracy).forEach(([topic, value]) => {
          if (topic && typeof value === 'number') {
            if (!topicStats[topic]) topicStats[topic] = { total: 0, average: 0, count: 0 };
            topicStats[topic].total += value;
            topicStats[topic].count += 1;
          }
        });
      }
    });
    const topicList = Object.entries(topicStats).map(([topic, data]) => ({ 
      topic, 
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0 
    }));
    const sorted = topicList.sort((a, b) => (b.avg || 0) - (a.avg || 0));
    const bestTopic = sorted.length ? sorted[0].topic : 'N/A';
    const weakTopic = sorted.length ? sorted[sorted.length - 1].topic : 'N/A';
    const streak = history.reduce((streak, item) => item && item.pass ? streak + 1 : 0, 0);
    return { tests: history.length, averageScore, totalQuestions, bestTopic, weakTopic, streak };
  }
};
