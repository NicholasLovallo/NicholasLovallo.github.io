// ==========================================
// 1. GLOBAL STATE & DOM ELEMENTS
// ==========================================
let allQuestions = [];
let sessionQuestions = [];
let currentQuestionIndex = 0;
let sessionScore = 0;
let sessionLog = []; // Tracks right/wrong for the breakdown

// Screens
const dashboardScreen = document.getElementById('dashboard-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Gamification
    const userStreak = checkAndUpdateStreak();
    document.getElementById('streak-display').innerText = `${userStreak} 🔥`;
    updateMasteryDisplay();

    // 2. Fetch Questions
    fetch('./questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
            document.getElementById('start-btn').disabled = false;
        })
        .catch(error => {
            console.error("Error loading questions:", error);
            document.getElementById('start-btn').innerText = "Error loading data";
        });

    // 3. Event Listeners for main navigation
    document.getElementById('start-btn').addEventListener('click', startSession);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('return-home-btn').addEventListener('click', () => {
        showScreen(dashboardScreen);
        updateMasteryDisplay();
    });
});

// ==========================================
// 3. CORE APP LOGIC
// ==========================================
function startSession() {
    // Reset session variables
    currentQuestionIndex = 0;
    sessionScore = 0;
    sessionLog = [];
    
    // Shuffle and pick 5 questions for a quick study session
    const shuffled = shuffleArray([...allQuestions]);
    sessionQuestions = shuffled.slice(0, 5);
    
    showScreen(quizScreen);
    renderQuestion();
}

function renderQuestion() {
    const q = sessionQuestions[currentQuestionIndex];
    
    // Update UI headers and tags
    document.getElementById('question-tracker').innerText = `Question ${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('blueprint-tag').innerText = q.blueprintArea;
    document.getElementById('skill-tag').innerText = q.skillLevel;
    document.getElementById('question-text').innerText = q.questionText;
    
    // Handle Exhibits (for TBS)
    const exhibitsContainer = document.getElementById('exhibits-container');
    if (q.exhibits && q.exhibits.length > 0) {
        exhibitsContainer.classList.remove('hidden');
        exhibitsContainer.innerHTML = q.exhibits.map(ex => 
            `<strong>${ex.title}:</strong> <br> ${ex.body}`
        ).join('<br><br>');
    } else {
        exhibitsContainer.classList.add('hidden');
    }

    // Render Options (MCQ vs TBS)
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Clear previous
    
    if (q.questionType === 'MCQ') {
        q.content.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = option.text;
            btn.onclick = () => handleAnswer(index, btn);
            optionsContainer.appendChild(btn);
        });
    } else if (q.questionType === 'TBS_Calculation') {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'tbs-input';
        input.placeholder = 'Enter numeric answer...';
        input.id = 'tbs-answer-input';
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'primary-btn';
        submitBtn.innerText = 'Submit Answer';
        submitBtn.style.marginTop = '0.5rem';
        submitBtn.onclick = () => handleTBSAnswer(input.value);
        
        optionsContainer.appendChild(input);
        optionsContainer.appendChild(submitBtn);
    }

    // Hide feedback and next button for the new question
    document.getElementById('feedback-container').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

// ==========================================
// 4. ANSWER HANDLING & FEEDBACK
// ==========================================
function handleAnswer(selectedIndex, buttonElement) {
    const q = sessionQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.content.correctAnswer;
    const buttons = document.querySelectorAll('.option-btn');
    
    // Disable all buttons so user can't click twice
    buttons.forEach(btn => btn.disabled = true);

    if (isCorrect) {
        buttonElement.classList.add('selected-correct');
        sessionScore++;
        showFeedback(true, q.content.options[selectedIndex].feedback);
        sessionLog.push(`<li>✅ ${q.id}: ${q.topic}</li>`);
    } else {
        buttonElement.classList.add('selected-wrong', 'shake');
        // Highlight the correct answer
        buttons[q.content.correctAnswer].classList.add('selected-correct');
        showFeedback(false, q.content.options[selectedIndex].feedback);
        sessionLog.push(`<li>❌ ${q.id}: ${q.topic}</li>`);
    }

    document.getElementById('next-btn').classList.remove('hidden');
}

function handleTBSAnswer(inputValue) {
    const q = sessionQuestions[currentQuestionIndex];
    const numericAnswer = parseFloat(inputValue);
    const isCorrect = numericAnswer === q.content.correctAnswer;
    
    // Disable inputs
    document.getElementById('tbs-answer-input').disabled = true;
    document.querySelector('.options-grid .primary-btn').disabled = true;

    if (isCorrect) {
        sessionScore++;
        showFeedback(true, q.explanation);
        sessionLog.push(`<li>✅ ${q.id}: ${q.topic}</li>`);
    } else {
        const tbsInput = document.getElementById('tbs-answer-input');
        tbsInput.classList.add('shake');
        tbsInput.style.borderColor = 'var(--error-red)';
        showFeedback(false, `The correct answer was ${q.content.correctAnswer}. <br><br> ${q.explanation}`);
        sessionLog.push(`<li>❌ ${q.id}: ${q.topic}</li>`);
    }

    document.getElementById('next-btn').classList.remove('hidden');
}

function showFeedback(isCorrect, text) {
    const feedbackBox = document.getElementById('feedback-container');
    const title = document.getElementById('feedback-title');
    const desc = document.getElementById('feedback-text');

    feedbackBox.className = `feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
    title.innerText = isCorrect ? 'Correct!' : 'Incorrect';
    desc.innerHTML = text; // innerHTML used to allow <br> tags in TBS feedback
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < sessionQuestions.length) {
        renderQuestion();
    } else {
        endSession();
    }
}

// ==========================================
// 5. SESSION COMPLETION & GAMIFICATION
// ==========================================
function endSession() {
    showScreen(resultsScreen);
    
    // Display Score
    document.getElementById('final-score').innerText = `${sessionScore}/${sessionQuestions.length}`;
    
    // Display Breakdown
    document.getElementById('breakdown-list').innerHTML = sessionLog.join('');
    
    // Update Mastery in LocalStorage
    let totalCorrect = parseInt(localStorage.getItem('totalCorrect')) || 0;
    let totalAttempted = parseInt(localStorage.getItem('totalAttempted')) || 0;
    
    localStorage.setItem('totalCorrect', totalCorrect + sessionScore);
    localStorage.setItem('totalAttempted', totalAttempted + sessionQuestions.length);
}

function checkAndUpdateStreak() {
    const today = new Date();
    const todayStr = today.toDateString();
    
    let lastActiveStr = localStorage.getItem('lastActiveDate');
    let currentStreak = parseInt(localStorage.getItem('streak')) || 0;

    if (lastActiveStr !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActiveStr === yesterdayStr) {
            currentStreak += 1; // Played yesterday, continue streak
        } else {
            currentStreak = 1; // Missed a day or first time
        }

        localStorage.setItem('lastActiveDate', todayStr);
        localStorage.setItem('streak', currentStreak);
    }
    
    return currentStreak;
}

function updateMasteryDisplay() {
    let totalCorrect = parseInt(localStorage.getItem('totalCorrect')) || 0;
    let totalAttempted = parseInt(localStorage.getItem('totalAttempted')) || 0;
    
    let percentage = 0;
    if (totalAttempted > 0) {
        percentage = Math.round((totalCorrect / totalAttempted) * 100);
    }

    document.getElementById('mastery-text').innerText = `${percentage}%`;
    document.getElementById('mastery-fill').style.width = `${percentage}%`;
}

// ==========================================
// 6. UTILITY FUNCTIONS
// ==========================================
function showScreen(screenElement) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    // Show target screen
    screenElement.classList.remove('hidden');
    screenElement.classList.add('active');
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}