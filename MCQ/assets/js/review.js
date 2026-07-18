const Review = {
  state: {
    questions: [],
    result: null,
    filter: {
      topic: 'All',
      difficulty: 'All',
      correctness: 'All',
      bookmarked: false,
      keyword: ''
    }
  },
  init() {
    console.log('Review.init() called');
    this.cacheElements();
    
    // Load data immediately
    const loadAndRender = () => {
      console.log('Loading and rendering review data');
      this.loadData();
      this.attachListeners();
      this.renderFilters();
      this.renderReview();
    };
    
    // If data is already ready, load immediately
    if (App.questions && App.questions.length > 0) {
      console.log('App.questions already available:', App.questions.length);
      loadAndRender();
    }
    
    // Also listen for event
    document.addEventListener('ucbt-data-ready', () => {
      console.log('ucbt-data-ready event fired');
      loadAndRender();
    });
    
    // Fallback timer to ensure data loads
    setTimeout(() => {
      if (this.state.questions.length === 0) {
        console.log('Fallback timer: Loading data manually');
        loadAndRender();
      }
    }, 500);
  },
  cacheElements() {
    this.elements = {
      searchInput: document.getElementById('searchInput'),
      topicSelect: document.getElementById('topicFilter'),
      difficultySelect: document.getElementById('difficultyFilter'),
      correctnessSelect: document.getElementById('correctnessFilter'),
      bookmarkToggle: document.getElementById('bookmarkFilter'),
      questionList: document.getElementById('reviewList'),
      summaryTitle: document.getElementById('reviewSummary')
    };
    console.log('Cached elements:', {
      searchInput: !!this.elements.searchInput,
      topicSelect: !!this.elements.topicSelect,
      difficultySelect: !!this.elements.difficultySelect,
      correctnessSelect: !!this.elements.correctnessSelect,
      bookmarkToggle: !!this.elements.bookmarkToggle,
      questionList: !!this.elements.questionList,
      summaryTitle: !!this.elements.summaryTitle
    });
  },
  attachListeners() {
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', e => { 
        this.state.filter.keyword = e.target.value.trim(); 
        this.renderReview(); 
      });
    }
    if (this.elements.topicSelect) {
      this.elements.topicSelect.addEventListener('change', e => { 
        this.state.filter.topic = e.target.value; 
        this.renderReview(); 
      });
    }
    if (this.elements.difficultySelect) {
      this.elements.difficultySelect.addEventListener('change', e => { 
        this.state.filter.difficulty = e.target.value; 
        this.renderReview(); 
      });
    }
    if (this.elements.correctnessSelect) {
      this.elements.correctnessSelect.addEventListener('change', e => { 
        this.state.filter.correctness = e.target.value; 
        this.renderReview(); 
      });
    }
    if (this.elements.bookmarkToggle) {
      this.elements.bookmarkToggle.addEventListener('change', e => { 
        this.state.filter.bookmarked = e.target.checked; 
        this.renderReview(); 
      });
    }
    console.log('Attached event listeners');
  },
  loadData() {
    const last = Storage.load('ucbt_last_result', null);
    this.state.result = last;
    const bookmarkedIds = Storage.getBookmarks() || [];
    
    // Try to get questions from last test result
    let source = null;
    if (last && last.resultState && Array.isArray(last.resultState.questions) && last.resultState.questions.length > 0) {
      source = last.resultState.questions;
      console.log('Loaded questions from test result:', source.length);
    } else if (App.questions && Array.isArray(App.questions) && App.questions.length > 0) {
      // Fallback: show all questions if no test completed
      source = App.questions;
      console.log('Loaded questions from app data:', source.length);
    }
    
    if (!source || source.length === 0) {
      console.warn('No questions available for review');
      return;
    }
    
    // Preserve all question properties
    this.state.questions = source.map((question, idx) => {
      if (!question) return null;
      
      // Ensure question has all required properties
      const prepared = {
        id: question.id || idx + 1,
        question: question.question || question.que || '',
        topic: question.topic || 'Unknown',
        options: Array.isArray(question.options) ? question.options : [],
        correct: question.correct || question.answer || 1,
        answer: question.answer || question.correct || 1,
        userAnswer: (last && last.resultState && last.resultState.answers) ? last.resultState.answers[question.id || idx + 1] : null,
        correctAnswer: question.correct || question.answer || 1,
        bookmarked: Array.isArray(bookmarkedIds) ? bookmarkedIds.includes(question.id || idx + 1) : false
      };
      
      prepared.status = this.getStatus(prepared, prepared.userAnswer, prepared.correctAnswer);
      return prepared;
    }).filter(q => q !== null && q.question && q.options && q.options.length > 0);
    
    console.log('Prepared questions:', this.state.questions.length);
  },
  getStatus(question, answered, correct) {
    if (!answered) return 'Unanswered';
    return answered === correct ? 'Correct' : 'Wrong';
  },
  renderFilters() {
    if (!this.state.questions || this.state.questions.length === 0) {
      console.warn('No questions to render filters');
      return;
    }
    const topics = ['All Topics', ...[...new Set(this.state.questions.map(q => q.topic || 'Unknown'))].sort()];
    if (this.elements.topicSelect) {
      this.elements.topicSelect.innerHTML = topics.map(topic => {
        const value = topic === 'All Topics' ? 'All' : topic;
        const label = topic;
        return `<option value="${value}">${label}</option>`;
      }).join('');
      // Set filter to 'All' by default
      this.state.filter.topic = 'All';
      console.log('Rendered', topics.length, 'topics in filter');
    } else {
      console.warn('topicSelect element not found!');
    }
  },
  renderReview() {
    const questions = Array.isArray(this.state.questions) ? this.state.questions : [];
    
    if (questions.length === 0) {
      console.warn('No questions in state');
      if (this.elements.questionList) {
        this.elements.questionList.innerHTML = '<li class="review-empty">No questions available. Complete a test first or wait for data to load.</li>';
      }
      if (this.elements.summaryTitle) {
        this.elements.summaryTitle.textContent = 'Review Questions (0)';
      }
      return;
    }
    
    console.log('Rendering review with', questions.length, 'questions');
    
    const filtered = questions.filter(question => {
      if (!question) return false;
      const keyword = (this.state.filter.keyword || '').toLowerCase();
      const questionText = (question.question || '').toLowerCase();
      const topicText = (question.topic || '').toLowerCase();
      const matchesText = keyword ? questionText.includes(keyword) || topicText.includes(keyword) : true;
      const filterTopic = this.state.filter.topic || 'All';
      const matchesTopic = filterTopic === 'All' ? true : question.topic === filterTopic;
      const difficulty = Utils.getDifficulty(question);
      const filterDiff = this.state.filter.difficulty || 'All';
      const matchesDiff = filterDiff === 'All' ? true : difficulty === filterDiff;
      const filterCorrect = this.state.filter.correctness || 'All';
      const matchesCorrect = filterCorrect === 'All' ? true : question.status === filterCorrect;
      const matchesBookmark = !this.state.filter.bookmarked || question.bookmarked;
      return matchesText && matchesTopic && matchesDiff && matchesCorrect && matchesBookmark;
    });
    
    console.log('After filtering:', filtered.length, 'questions');
    console.log('First question sample:', filtered[0]);
    
    if (!this.elements.questionList) {
      console.error('reviewList element not found!');
      return;
    }
    
    const cardHtmls = filtered.map((question, index) => {
      const html = this.renderQuestionCard(question, index);
      console.log('Card index', index, 'html length:', html.length);
      return html;
    });
    
    const finalHtml = cardHtmls.filter(h => h && h.length > 0).join('');
    console.log('Final HTML length:', finalHtml.length, 'Number of cards:', cardHtmls.filter(h => h).length);
    
    this.elements.questionList.innerHTML = finalHtml || '<li class="review-empty">No questions match the selected filters. Try broadening the search.</li>';
    
    if (this.elements.summaryTitle) {
      this.elements.summaryTitle.textContent = `Review ${filtered.length} question(s)`;
    }
  },
  renderQuestionCard(question, displayIndex) {
    if (!question) {
      console.warn('renderQuestionCard: Question is null/undefined');
      return '';
    }
    
    try {
      console.log('renderQuestionCard index:', displayIndex, 'question id:', question.id);
      
      // Build simple fallback if data is incomplete
      const questionNum = displayIndex + 1;
      const questionText = question.question || 'No question text';
      const topicText = question.topic || 'Unknown';
      const userAns = question.userAnswer || null;
      const correctAns = question.correctAnswer || 1;
      
      // Render options
      let optionHtml = '';
      if (Array.isArray(question.options) && question.options.length > 0) {
        optionHtml = question.options.map((option, idx) => {
          const answerClass = idx + 1 === correctAns ? 'correct-answer' : '';
          const userClass = idx + 1 === userAns ? 'user-answer' : '';
          const label = ['A', 'B', 'C', 'D'][idx] || '?';
          const optText = typeof option === 'string' ? option : String(option || '');
          return `<li class="review-option ${answerClass} ${userClass}"><span>${label}</span><strong>${Utils.safeText(optText)}</strong></li>`;
        }).join('');
      }
      
      console.log('renderQuestionCard index:', displayIndex, 'optionHtml length:', optionHtml.length);
      
      const noteLine = question.bookmarked ? '<span class="badge bookmark-badge">Bookmarked</span>' : '';
      const correctLabel = ['A', 'B', 'C', 'D'][correctAns - 1] || '?';
      const userLabel = userAns && userAns !== 'Not answered' ? ['A', 'B', 'C', 'D'][userAns - 1] || '?' : 'Not answered';
      
      const html = `<li class="review-card">
        <header>
          <h3>${questionNum}. ${Utils.safeText(questionText)}</h3>
          <div class="review-meta">${Utils.safeText(topicText)} ${noteLine}</div>
        </header>
        <ul class="review-options">${optionHtml || '<li>No options available</li>'}</ul>
        <div class="review-feedback">
          <span>Status: ${question.status || 'Unknown'}</span>
          <span>Correct answer: ${correctLabel}</span>
          <span>Your answer: ${userLabel}</span>
        </div>
        <p class="review-explanation">Explanation will be added here after the test. Use this as your private review note.</p>
      </li>`;
      
      console.log('renderQuestionCard index:', displayIndex, 'returned html length:', html.length);
      return html;
    } catch (error) {
      console.error('renderQuestionCard error:', error);
      return '';
    }
  }
};
