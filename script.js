// متغيرات حالة التطبيق
let currentCategory = null;
let currentMode = '';
let workingArray = []; 
let totalWords = 0, completedWords = 0;
let roundWords = [], matchAr = null, matchKu = null, roundMatched = 0;
let currentQuestionObj = null;

// ----------------------------------------------------
// نظام الوضع الليلي (Dark Mode)
// ----------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem('pz_theme');
    const themeBtn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeBtn) themeBtn.innerText = '☀️';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('pz_theme', 'dark');
        themeBtn.innerText = '☀️';
    } else {
        localStorage.setItem('pz_theme', 'light');
        themeBtn.innerText = '🌙';
    }
}

// ----------------------------------------------------
// تهيئة التطبيق
// ----------------------------------------------------
function initApp() {
    const grid = document.getElementById('categories-grid');
    appData.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-card';
        div.onclick = () => openModeScreen(cat);
        div.innerHTML = `<div class="cat-icon">${cat.icon}</div><div class="cat-title-ar">${cat.name}</div>`;
        grid.appendChild(div);
    });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('victory-screen').classList.remove('show');
}

function openModeScreen(cat) {
    currentCategory = cat;
    document.getElementById('selected-cat-title').innerText = cat.name;
    showScreen('mode-screen');
}

// ----------------------------------------------------
// نظام حفظ التقدم (Local Storage)
// ----------------------------------------------------
function saveProgress() {
    const saveKey = `pz_${currentCategory.id}_${currentMode}`;
    const saveData = { array: workingArray, completed: completedWords };
    localStorage.setItem(saveKey, JSON.stringify(saveData));
}

function loadProgress() {
    const saveKey = `pz_${currentCategory.id}_${currentMode}`;
    const savedData = localStorage.getItem(saveKey);
    if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.completed > 0 && parsed.completed < parsed.array.length) return parsed;
    }
    return null;
}

function clearProgress() {
    const saveKey = `pz_${currentCategory.id}_${currentMode}`;
    localStorage.removeItem(saveKey);
}

// ----------------------------------------------------
// بدء اللعبة
// ----------------------------------------------------
function startGame(mode) {
    currentMode = mode;
    const savedSession = loadProgress();
    
    if (savedSession) {
        workingArray = savedSession.array;
        completedWords = savedSession.completed;
        totalWords = workingArray.length;
    } else {
        workingArray = shuffleArray([...currentCategory[mode]]);
        totalWords = workingArray.length;
        completedWords = 0;
        saveProgress();
    }

    if (mode === 'match') {
        showScreen('match-screen');
        loadMatchRound();
    } else {
        document.getElementById('quiz-title-text').innerText = mode === 'meaning' ? 'اختيار المعنى' : 'تخمين الصورة';
        showScreen('quiz-screen');
        loadNextQuiz();
    }
}

function shuffleArray(arr) { 
    return arr.sort(() => Math.random() - 0.5); 
}

function updateProgress(type) {
    const pct = (completedWords / totalWords) * 100;
    document.getElementById(`${type}-progress-bar`).style.width = `${pct}%`;
    document.getElementById(`${type}-progress-text`).innerText = `التقدم: ${completedWords} / ${totalWords}`;
    
    if (completedWords >= totalWords) {
        clearProgress();
        setTimeout(() => document.getElementById('victory-screen').classList.add('show'), 500);
    } else {
        saveProgress();
    }
}

// ----------------------------------------------------
// محرك المطابقة (خالي من الصوت)
// ----------------------------------------------------
function loadMatchRound() {
    updateProgress('match');
    if (completedWords >= totalWords) return;
    
    roundWords = workingArray.slice(completedWords, completedWords + 5);
    roundMatched = 0; matchAr = null; matchKu = null;

    const arCol = document.getElementById('match-ar-col'), kuCol = document.getElementById('match-ku-col');
    arCol.innerHTML = ''; kuCol.innerHTML = '';

    const arrAr = shuffleArray([...roundWords]), arrKu = shuffleArray([...roundWords]);

    arrAr.forEach(w => {
        const c = document.createElement('div'); c.className = 'match-card'; c.innerText = w.a; c.dataset.id = w.k;
        c.onclick = () => selectMatch(c, 'a'); arCol.appendChild(c);
    });
    arrKu.forEach(w => {
        const c = document.createElement('div'); c.className = 'match-card'; c.innerText = w.k; c.dataset.id = w.k;
        c.onclick = () => selectMatch(c, 'k'); kuCol.appendChild(c);
    });
}

function selectMatch(card, type) {
    if (card.classList.contains('matched')) return;

    if (type === 'a') { 
        if(matchAr) matchAr.classList.remove('selected'); 
        matchAr = card; matchAr.classList.add('selected'); 
    } else { 
        if(matchKu) matchKu.classList.remove('selected'); 
        matchKu = card; matchKu.classList.add('selected'); 
    }

    if (matchAr && matchKu) {
        if (matchAr.dataset.id === matchKu.dataset.id) {
            matchAr.classList.add('matched'); matchKu.classList.add('matched');
            matchAr.classList.remove('selected'); matchKu.classList.remove('selected');
            matchAr = null; matchKu = null; 
            
            roundMatched++; 
            completedWords++; 
            updateProgress('match'); 
            
            if (roundMatched === roundWords.length) setTimeout(loadMatchRound, 600);
        } else {
            const tA = matchAr, tK = matchKu;
            tA.classList.add('wrong'); tK.classList.add('wrong');
            setTimeout(() => { tA.classList.remove('selected','wrong'); tK.classList.remove('selected','wrong'); }, 400);
            matchAr = null; matchKu = null;
        }
    }
}

// ----------------------------------------------------
// محرك الاختبارات (خالي من الصوت)
// ----------------------------------------------------
function loadNextQuiz() {
    updateProgress('quiz');
    if (completedWords >= totalWords) return;

    currentQuestionObj = workingArray[completedWords];
    const qBox = document.getElementById('quiz-question');
    const optGrid = document.getElementById('quiz-options');
    optGrid.innerHTML = '';

    if (currentMode === 'meaning') {
        qBox.innerText = currentQuestionObj.k; 
        qBox.style.fontSize = '2.5rem';
    } else {
        qBox.innerText = currentQuestionObj.i; 
        qBox.style.fontSize = '4.5rem';
    }

    let opts = [currentQuestionObj];
    let wrongs = shuffleArray(workingArray.filter(w => w.k !== currentQuestionObj.k));
    for(let j = 0; j < 3 && j < wrongs.length; j++) opts.push(wrongs[j]);
    opts = shuffleArray(opts);

    opts.forEach(o => {
        const btn = document.createElement('button'); btn.className = 'option-btn';
        
        btn.innerText = currentMode === 'meaning' ? o.a : o.k;
        
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'none');
            
            if (o.k === currentQuestionObj.k) {
                btn.classList.add('correct'); 
                completedWords++; 
                setTimeout(loadNextQuiz, 600);
            } else {
                btn.classList.add('wrong');
                setTimeout(() => { 
                    btn.classList.remove('wrong'); 
                    document.querySelectorAll('.option-btn').forEach(b => b.style.pointerEvents = 'auto'); 
                }, 400);
            }
        };
        optGrid.appendChild(btn);
    });
}

// تشغيل اللعبة والوضع الليلي فور تحميل الصفحة
window.onload = () => {
    initApp();
    initTheme();
};