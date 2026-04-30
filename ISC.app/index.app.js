// --- Configuration & State ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionXp = 0;
let userStats = {
    xp: 0,
    streak: 0,
    lastDate: null,
    level: "System Intern",
    flagged: []
};

// --- Initialization ---
window.onload = async () => {
    await loadQuestions();
    loadUserData();
    updateHeader();
    showHome();
};

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
    } catch (err) {
        console.error("Failed to load questions:", err);
        alert("Error loading questions. Check console.");
    }
}

// --- Navigation ---
function showHome() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('home-view').classList.remove('hidden');
    document.getElementById('flagged-count').innerText = `${userStats.flagged.length} Items`;
}

function startQuiz(mode) {
    score = 0;
    sessionXp = 0;
    currentQuestionIndex = 0;
    
    // Logic for different modes
    if (mode === 'quick') questions.sort(() => 0.5 - Math.random());
    
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('quiz-view').classList.remove('hidden');
    displayQuestion();
}

// --- Quiz Core ---
function displayQuestion() {
    const q = questions[currentQuestionIndex];
    document.getElementById('question-progress').innerText = `Question ${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('question-text').innerText = q.question;
    document.getElementById('feedback-area').classList.add('hidden');
    
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(index, q.answer, btn);
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, correctIndex, btn) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true); // Prevent double clicking

    const q = questions[currentQuestionIndex];
    const feedback = document.getElementById('feedback-area');
    const logicText = document.getElementById('logic-text');

    if (selectedIndex === correctIndex) {
        btn.classList.add('correct');
        score++;
        sessionXp += 10;
        logicText.innerHTML = `<strong>Correct!</strong> ${q.explanation}`;
    } else {
        btn.classList.add('incorrect');
        allBtns[correctIndex].classList.add('correct');
        logicText.innerHTML = `<strong>Incorrect.</strong> ${q.explanation}`;
    }

    feedback.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < 10) { // Limit to 10 for quick study
        displayQuestion();
    } else {
        showResults();
    }
}

// --- Gamification & Data ---
function showResults() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('results-view').classList.remove('hidden');
    
    document.getElementById('final-score').innerText = `${(score / 10) * 100}%`;
    document.getElementById('xp-gain-text').innerText = `+${sessionXp} XP Earned`;
    
    saveProgress(sessionXp);
}

function saveProgress(xpGained) {
    userStats.xp += xpGained;
    
    // Streak Logic
    const today = new Date().toDateString();
    if (userStats.lastDate !== today) {
        userStats.streak++;
        userStats.lastDate = today;
    }

    // Level Logic
    if (userStats.xp > 1000) userStats.level = "CISO";
    else if (userStats.xp > 500) userStats.level = "IS Manager";
    else if (userStats.xp > 200) userStats.level = "Senior Consultant";
    else if (userStats.xp > 50) userStats.level = "IT Audit Associate";

    localStorage.setItem('isc_quest_data', JSON.stringify(userStats));
    updateHeader();
}

function loadUserData() {
    const saved = localStorage.getItem('isc_quest_data');
    if (saved) userStats = JSON.parse(saved);
}

function updateHeader() {
    document.getElementById('xp-display').innerText = `XP: ${userStats.xp}`;
    document.getElementById('streak-display').innerText = `🔥 ${userStats.streak} Days`;
    document.getElementById('level-tag').innerText = userStats.level;
}