/**
 * ==========================================================================
 * SmartRevision - MODULE ÉTUDIANT (student.js)
 * Code d'Architecture Principal - Expérience Utilisateur & Quiz Premium
 * ==========================================================================
 */

window.app = {
    // --- 1. ÉTAT GLOBAL DE L'APPLICATION (STOCKAGE EN MÉMOIRE) ---
    state: {
        courses: [],
        stats: {
            streak: 0,
            xp: 0,
            lives: 5,
            livesRechargeAt: null, // Timestamp (ms) auquel les vies seront rechargées à 5
            totalTime: 0,
            totalAnswers: 0,
            correctAnswers: 0
        },
        settings: {
            theme: 'light',
            fontSize: 'medium',
            dyslexia: false
        }
    },

    // --- 2. ÉTAT TEMPORAIRE DU QUIZ EN COURS ---
    quiz: {
        currentQuestions: [],
        currentIndex: 0,
        score: 0,
        correct: 0,
        wrong: 0,
        selectedOptionIndex: null,
        timerInterval: null,
        timeLeft: 37,
        globalTimerInterval: null,
        globalTimeLeft: 1197 // Équivaut à 19:57 minutes
    },

    // --- 2bis. ÉTAT DU MINUTEUR POMODORO (ZONE LECTURE) ---
    pomodoro: {
        timeLeft: 1500 // 25:00 minutes
    },

    // --- 2ter. ÉTAT DE NAVIGATION DES FICHES DE RÉVISION (LECTEUR) ---
    reader: {
        parts: [],       // Toutes les fiches (sous-parties) du cours ouvert, à plat
        currentIndex: 0
    },

    // Constantes du système de vies
    MAX_LIVES: 5,
    LIVES_RECHARGE_MS: 60 * 60 * 1000, // 60 minutes
    DAILY_XP_GOAL: 1000,

    currentViewZone: 'student-zone',

    // --- 3. MÉTHODE DE LANCEMENT (INITIALISATION) ---
    init() {
        console.log("Démarrage du module étudiant...");
        this.loadFromStorage();
        this.applySettings();
        this.checkLivesRecharge();
        this.renderDashboard();
        this.initGlobalTimers();
    },

    // --- SYSTÈME DE VIES : VÉRIFICATION & RECHARGE COMPLÈTE APRÈS 60 MIN ---
    checkLivesRecharge() {
        const stats = this.state.stats;
        if (stats.lives <= 0 && stats.livesRechargeAt) {
            const now = Date.now();
            if (now >= stats.livesRechargeAt) {
                // Le délai de 60 minutes est écoulé : recharge totale
                stats.lives = this.MAX_LIVES;
                stats.livesRechargeAt = null;
                this.saveToStorage();
                return true; // Un changement a eu lieu (utile pour rafraîchir l'UI)
            }
        }
        return false;
    },

    // Met à jour l'affichage du bandeau de recharge + le compte à rebours MM:SS
    updateLivesRechargeUI() {
        const banner = document.getElementById('lives-recharge-banner');
        const countdownEl = document.getElementById('lives-recharge-countdown');
        if (!banner || !countdownEl) return;

        const stats = this.state.stats;
        if (stats.lives <= 0 && stats.livesRechargeAt) {
            const remainingMs = stats.livesRechargeAt - Date.now();
            if (remainingMs <= 0) {
                // La recharge vient de se terminer : on rafraîchit tout le tableau de bord
                this.checkLivesRecharge();
                this.renderDashboard();
                return;
            }
            const totalSeconds = Math.ceil(remainingMs / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            countdownEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    },

    // --- 4. PERSISTANCE DES DONNÉES SUR SMARTPHONE ---
    saveToStorage() {
        try {
            localStorage.setItem('smart_revision_data', JSON.stringify(this.state));
        } catch (error) {
            console.error("Erreur critique d'écriture dans le téléphone :", error);
        }
    },

    loadFromStorage() {
        try {
            const localData = localStorage.getItem('smart_revision_data');
            if (localData) {
                this.state = JSON.parse(localData);
            } else {
                this.seedDemoData();
            }
        } catch (error) {
            console.error("Erreur de lecture de la mémoire locale :", error);
            this.seedDemoData();
        }
    },

    // Injection de cours types INFAS pour ne pas démarrer sur un écran vide
    seedDemoData() {
        this.state.courses = [
            {
                id: "cours_pharma_1",
                title: "Pharmacologie : Les Voies d'Administration",
                chapters: [{
                    id: "chap_pharma_1",
                    title: "Les Formes Orales & Solides",
                    parts: [{
                        id: "part_pharma_1",
                        title: "1. Les Comprimés & Suspensions",
                        content: "<p>Les formes orales subissent le <b>premier passage hépatique</b>. Dans une suspension buvable, le principe actif est insoluble dans l'eau et nécessite d'être agité avant administration pour homogénéiser la dose.</p>",
                        tip: "Toujours secouer une suspension, sinon le principe actif reste collé au fond !",
                        example: "L'amoxicilline en sirop pour enfant est une suspension classique à reconstituer.",
                        questions: [
                            {
                                type: "QCM",
                                question: "Dans une suspension buvable, le principe actif est :",
                                options: [
                                    "Totalement dissous de façon stable",
                                    "Insoluble (dispersé) dans le liquide",
                                    "Transformé en gaz thérapeutique"
                                ],
                                answer: 1,
                                explanation: "Le principe actif d'une suspension est insoluble. C'est pourquoi le produit s'installe au fond s'il n'est pas agité vigoureusement."
                            },
                            {
                                type: "QCM",
                                question: "Quel organe est responsable du premier passage hépatique ?",
                                options: ["Le Cerveau", "Le Foie", "Les Poumons"],
                                answer: 1,
                                explanation: "Le foie filtre le sang provenant du tube digestif via la veine porte avant qu'il ne rejoigne la circulation générale."
                            }
                        ]
                    }]
                }]
            }
        ];
        // Stats initiales simulées pour l'esthétique
        this.state.stats = { streak: 1, xp: 50, lives: 5, totalTime: 12, totalAnswers: 5, correctAnswers: 4 };
        this.saveToStorage();
    },

    // --- 5. MOTEUR DE CHANGEMENT D'ÉCRAN AUTOMATIQUE ---
    switchView(viewId) {
        const activeZone = document.getElementById(this.currentViewZone);
        if (!activeZone) return;

        const views = activeZone.querySelectorAll('.app-view');
        views.forEach(v => v.classList.remove('active'));

        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Gestion de l'état graphique de la barre de navigation basse
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) {
            activeNav.classList.add('active');
        }

        // Rafraîchissement ciblé des éléments d'interface
        if (viewId === 'dashboard') this.renderDashboard();
        if (viewId === 'stats') this.renderStats();
    },

    // --- 6. CONTEXTUALISATION DU TABLEAU DE BORD ÉTUDIANT ---
    renderDashboard() {
        this.checkLivesRecharge();

        document.getElementById('stat-streak').innerText = this.state.stats.streak;
        document.getElementById('stat-xp').innerText = this.state.stats.xp;
        document.getElementById('stat-lives').innerText = this.state.stats.lives;

        this.updateLivesRechargeUI();

        const goal = this.DAILY_XP_GOAL;
        const objList = document.getElementById('objectives-list');
        if (objList) {
            objList.innerHTML = `
                <li>${this.state.stats.lives > 0 ? '✅' : '❌'} Rester en vie pour continuer à réviser</li>
                <li>${this.state.stats.xp >= goal ? '✅' : '🔥'} Objectif du jour : Atteindre ${goal} XP (${this.state.stats.xp}/${goal})</li>
            `;
        }

        const container = document.getElementById('courses-list');
        if (!container) return;
        container.innerHTML = '';

        if (this.state.courses.length === 0) {
            container.innerHTML = '<p style="color:#f4f3e8; text-align:center; padding:20px;">Aucun cours. Créez-en un dans le Mode Éditeur !</p>';
            return;
        }

        this.state.courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card';
            card.onclick = () => this.openReader(course.id);
            card.innerHTML = `
                <div>
                    <h3 style="color: var(--text-main); font-weight:700; font-size:1.1rem;">${course.title}</h3>
                    <span style="color: var(--text-muted); font-size:0.8rem; font-weight:bold;">${course.chapters.length} MODULE(S) DÉCOUPÉ(S)</span>
                </div>
                <span style="font-size: 1.3rem; color: var(--accent-green)">➡️</span>
            `;
            container.appendChild(card);
        });
    },

    // --- 7. SYSTÈME DE LECTURE ACTIVE DES MORCEAUX DE COURS ---
    openReader(courseId) {
        const course = this.state.courses.find(c => c.id === courseId);
        if (!course || course.chapters.length === 0) return;

        // Aplatit TOUTES les fiches (sous-parties) de TOUS les chapitres du cours,
        // afin de pouvoir naviguer d'une fiche à l'autre avec "Page suivante".
        this.reader.parts = [];
        course.chapters.forEach(chapter => {
            (chapter.parts || []).forEach(part => {
                this.reader.parts.push(part);
            });
        });

        if (this.reader.parts.length === 0) return;
        this.reader.currentIndex = 0;

        // Agrège les questions de TOUS les chapitres et TOUTES les parties du cours,
        // et non plus uniquement celles du premier chapitre (sinon le quiz s'arrêtait
        // après une seule question même si le cours en comportait davantage).
        this.quiz.currentQuestions = [];
        course.chapters.forEach(chapter => {
            (chapter.parts || []).forEach(part => {
                if (part.questions && part.questions.length) {
                    this.quiz.currentQuestions.push(...part.questions);
                }
            });
        });

        // Réinitialisation du minuteur Pomodoro à chaque nouvelle session de lecture
        this.pomodoro.timeLeft = 1500;
        this.updatePomodoroDisplay();

        this.switchView('reader');
        this.renderPart(0);
    },

    // Affiche la fiche (sous-partie) à l'index donné et met à jour la barre de progression
    renderPart(index) {
        const parts = this.reader.parts;
        if (!parts || parts.length === 0) return;

        // Sécurise l'index dans les bornes du tableau
        if (index < 0) index = 0;
        if (index >= parts.length) index = parts.length - 1;
        this.reader.currentIndex = index;

        const part = parts[index];

        document.getElementById('part-title').innerText = part.title;
        document.getElementById('part-content').innerHTML = part.content;

        const tipBox = document.getElementById('part-tip');
        if (part.tip) {
            tipBox.classList.remove('hidden');
            document.getElementById('part-tip-text').innerText = part.tip;
        } else {
            tipBox.classList.add('hidden');
        }

        const exBox = document.getElementById('part-example');
        if (part.example) {
            exBox.classList.remove('hidden');
            document.getElementById('part-example-text').innerText = part.example;
        } else {
            exBox.classList.add('hidden');
        }

        const indicator = document.getElementById('reader-part-indicator');
        if (indicator) {
            indicator.innerText = `Fiche ${index + 1}/${parts.length}`;
        }

        const progressPercent = ((index + 1) / parts.length) * 100;
        document.getElementById('reader-progress-bar').style.width = `${progressPercent}%`;

        // Le bouton "Page suivante" boucle vers la première fiche une fois la dernière atteinte,
        // ce qui permet de réviser en continu pendant que les vies se rechargent.
        const nextBtn = document.getElementById('btn-next-part');
        if (nextBtn) {
            nextBtn.innerText = (index === parts.length - 1) ? "🔁 Revoir depuis le début" : "➡️ Page suivante";
        }
    },

    // Passe à la fiche suivante (revient à la première fiche après la dernière)
    nextPart() {
        const parts = this.reader.parts;
        if (!parts || parts.length === 0) return;

        const nextIndex = (this.reader.currentIndex + 1) % parts.length;
        this.renderPart(nextIndex);
    },

    // Affiche le temps restant du minuteur Pomodoro au format MM:SS
    updatePomodoroDisplay() {
        const pomodoroView = document.getElementById('pomodoro-timer');
        if (!pomodoroView) return;
        let mins = Math.floor(this.pomodoro.timeLeft / 60);
        let secs = this.pomodoro.timeLeft % 60;
        pomodoroView.innerText = `⏱️ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // --- 8. MOTEUR EXCLUSIF DE QUIZ (FIDÈLE À TES CAPTURES) ---
    startQuiz() {
        if (this.quiz.currentQuestions.length === 0) {
            alert("Ce cours ne possède pas encore de questions d'évaluation.");
            return;
        }
        this.checkLivesRecharge();
        if (this.state.stats.lives <= 0) {
            let waitMsg = "Plus de vies (❤️) ! Tes vies se rechargeront entièrement dans 60 minutes.";
            if (this.state.stats.livesRechargeAt) {
                const remainingMin = Math.max(1, Math.ceil((this.state.stats.livesRechargeAt - Date.now()) / 60000));
                waitMsg = `Plus de vies (❤️) ! Recharge complète dans ${remainingMin} min. En attendant, révise tes fiches de cours !`;
            }
            alert(waitMsg);
            return;
        }

        this.quiz.currentIndex = 0;
        this.quiz.score = 0;
        this.quiz.correct = 0;
        this.quiz.wrong = 0;
        this.quiz.globalTimeLeft = 1197; // 19:57 fixe

        this.switchView('quiz');
        this.showQuestion();
    },

    showQuestion() {
        document.getElementById('quiz-feedback-box').classList.add('hidden');
        document.getElementById('btn-validate-quiz').classList.remove('hidden');

        const question = this.quiz.currentQuestions[this.quiz.currentIndex];

        document.getElementById('quiz-question-number').innerText = `QUESTION ${this.quiz.currentIndex + 1} / ${this.quiz.currentQuestions.length}`;
        document.getElementById('quiz-question-text').innerText = question.question;
        document.getElementById('quiz-question-badge').innerText = question.type || "QCM";

        document.getElementById('quiz-score').innerText = this.quiz.score;
        document.getElementById('quiz-correct').innerText = this.quiz.correct;
        document.getElementById('quiz-wrong').innerText = this.quiz.wrong;

        let currentGrade = (this.quiz.correct / this.quiz.currentQuestions.length) * 20;
        document.getElementById('quiz-grade').innerText = currentGrade.toFixed(1);

        let progressPercent = (this.quiz.currentIndex / this.quiz.currentQuestions.length) * 100;
        document.getElementById('quiz-progress-line').style.width = `${progressPercent}%`;

        // Gestion du chrono de réflexion par question
        this.quiz.timeLeft = 37;
        document.getElementById('question-timer-val').innerText = `${this.quiz.timeLeft}s`;
        
        clearInterval(this.quiz.timerInterval);
        this.quiz.timerInterval = setInterval(() => {
            this.quiz.timeLeft--;
            document.getElementById('question-timer-val').innerText = `${this.quiz.timeLeft}s`;
            if (this.quiz.timeLeft <= 0) {
                clearInterval(this.quiz.timerInterval);
                this.validateAnswer(true);
            }
        }, 1000);

        const container = document.getElementById('quiz-options-container');
        container.innerHTML = '';
        this.quiz.selectedOptionIndex = null;

        const letters = ['A', 'B', 'C', 'D'];
        question.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-item';
            btn.innerHTML = `
                <span class="option-letter">${letters[idx]}</span>
                <span class="option-string">${opt}</span>
            `;
            btn.onclick = () => this.selectOption(idx, btn);
            container.appendChild(btn);
        });
    },

    selectOption(index, element) {
        this.quiz.selectedOptionIndex = index;
        const items = document.querySelectorAll('.option-item');
        items.forEach(item => item.classList.remove('selected'));
        element.classList.add('selected');
    },

    validateAnswer(forcedTimeout = false) {
        clearInterval(this.quiz.timerInterval);

        if (this.quiz.selectedOptionIndex === null && !forcedTimeout) {
            alert("Veuillez sélectionner un choix de réponse !");
            return;
        }

        const question = this.quiz.currentQuestions[this.quiz.currentIndex];
        const feedbackBox = document.getElementById('quiz-feedback-box');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackExplanation = document.getElementById('feedback-explanation');
        const statusIcon = document.getElementById('feedback-status-icon');
        const validateBtn = document.getElementById('btn-validate-quiz');

        validateBtn.classList.add('hidden');
        feedbackBox.classList.remove('hidden');

        const isCorrect = !forcedTimeout && (this.quiz.selectedOptionIndex === question.answer);
        this.state.stats.totalAnswers++;

        const motivationBox = document.getElementById('quiz-motivation-text');

        if (isCorrect) {
            this.quiz.correct++;
            this.quiz.score += 40;
            this.state.stats.correctAnswers++;
            this.state.stats.xp += 15;
            
            statusIcon.innerText = "🎉";
            feedbackTitle.innerText = "Bonne réponse !";
            feedbackTitle.style.color = "var(--color-good)";
            motivationBox.innerText = "Excellent ! Ton travail acharné porte ses fruits.";
        } else {
            this.quiz.wrong++;
            this.state.stats.lives--;
            if (this.state.stats.lives <= 0) {
                this.state.stats.lives = 0;
                // Démarre le compte à rebours de 60 minutes pour la recharge totale des vies
                if (!this.state.stats.livesRechargeAt) {
                    this.state.stats.livesRechargeAt = Date.now() + this.LIVES_RECHARGE_MS;
                }
            }
            document.getElementById('stat-lives').innerText = this.state.stats.lives;

            statusIcon.innerText = "❌";
            feedbackTitle.innerText = forcedTimeout ? "Temps écoulé !" : "Erreur de diagnostic.";
            feedbackTitle.style.color = "var(--color-bad)";
            motivationBox.innerText = "Concentration, une erreur ne changera jamais l'objectif.";
        }

        feedbackExplanation.innerText = question.explanation;

        document.getElementById('quiz-score').innerText = this.quiz.score;
        document.getElementById('quiz-correct').innerText = this.quiz.correct;
        document.getElementById('quiz-wrong').innerText = this.quiz.wrong;
        
        let finalGrade = (this.quiz.correct / this.quiz.currentQuestions.length) * 20;
        document.getElementById('quiz-grade').innerText = finalGrade.toFixed(1);

        this.saveToStorage();
    },

    nextStep() {
        this.quiz.currentIndex++;
        if (this.quiz.currentIndex < this.quiz.currentQuestions.length && this.state.stats.lives > 0) {
            this.showQuestion();
        } else {
            clearInterval(this.quiz.timerInterval);
            let noteFinale = document.getElementById('quiz-grade').innerText;
            alert(`Évaluation terminée ! Note obtenue : ${noteFinale}/20. Nous sommes une équipe, continuez l'effort !`);
            this.switchView('dashboard');
        }
    },

    // --- 9. FONDATIONS DES CHRONOMÈTRES ET POMODORO ---
    initGlobalTimers() {
        setInterval(() => {
            const quizTimerView = document.getElementById('quiz-timer');
            if (quizTimerView && document.getElementById('view-quiz').classList.contains('active')) {
                this.quiz.globalTimeLeft--;
                if (this.quiz.globalTimeLeft <= 0) this.quiz.globalTimeLeft = 1197;

                let mins = Math.floor(this.quiz.globalTimeLeft / 60);
                let secs = this.quiz.globalTimeLeft % 60;
                quizTimerView.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        }, 1000);

        setInterval(() => {
            if (!document.getElementById('view-dashboard').classList.contains('active')) {
                this.state.stats.totalTime++;
                this.saveToStorage();
            }
        }, 60000);

        setInterval(() => {
            if (document.getElementById('view-reader').classList.contains('active')) {
                if (this.pomodoro.timeLeft > 0) {
                    this.pomodoro.timeLeft--;
                }
                this.updatePomodoroDisplay();
            }
        }, 1000);

        // Rafraîchit le compte à rebours du bandeau "vies rechargées dans..." chaque seconde
        setInterval(() => {
            if (document.getElementById('view-dashboard').classList.contains('active')) {
                this.updateLivesRechargeUI();
            }
        }, 1000);
    },

    // --- 10. RENDU STATISTIQUE ET FAUX GRAPH_CANVAS ---
    renderStats() {
        document.getElementById('stat-total-time').innerText = `${this.state.stats.totalTime} min`;
        document.getElementById('stat-total-answers').innerText = this.state.stats.totalAnswers;
        
        let rate = this.state.stats.totalAnswers > 0 ? Math.round((this.state.stats.correctAnswers / this.state.stats.totalAnswers) * 100) : 0;
        document.getElementById('stat-success-rate').innerText = `${rate}%`;

        const canvas = document.getElementById('stats-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 140;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#eae8d4';
        ctx.lineWidth = 1;
        
        for (let i = 1; i < 4; i++) {
            let y = (canvas.height / 4) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Dessin de la courbe d'évolution
        ctx.strokeStyle = '#173f27';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 10);
        ctx.lineTo(canvas.width * 0.4, canvas.height - 40);
        ctx.lineTo(canvas.width * 0.7, canvas.height - 20);
        ctx.lineTo(canvas.width, canvas.height - (rate * 1.1 > canvas.height ? canvas.height - 15 : rate * 1.1));
        ctx.stroke();

        const badgeContainer = document.getElementById('badges-container');
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <div class="stat-card" style="opacity: ${this.state.stats.streak >= 1 ? '1' : '0.3'}">🔥 <h3>Série 1j</h3></div>
                <div class="stat-card" style="opacity: ${this.state.stats.xp >= this.DAILY_XP_GOAL ? '1' : '0.3'}">⭐ <h3>${this.DAILY_XP_GOAL} XP</h3></div>
                <div class="stat-card" style="opacity: ${rate >= 70 ? '1' : '0.3'}">🎓 <h3>70% Vrai</h3></div>
            `;
        }
    },

    // --- 11. ACCESSIBILITÉ ---
    themeToggle(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.state.settings.theme = isDark ? 'dark' : 'light';
        this.saveToStorage();
    },

    fontSizeChange(size) {
        document.documentElement.setAttribute('data-size', size);
        this.state.settings.fontSize = size;
        this.saveToStorage();
    },

    fontToggle(isDyslexic) {
        document.documentElement.setAttribute('data-font', isDyslexic ? 'dyslexic' : 'standard');
        this.state.settings.dyslexia = isDyslexic;
        this.saveToStorage();
    },

    applySettings() {
        this.themeToggle(this.state.settings.theme === 'dark');
        this.fontSizeChange(this.state.settings.fontSize);
        this.fontToggle(this.state.settings.dyslexia);

        // Synchronisation visuelle des contrôles de réglages avec l'état chargé
        const darkModeInput = document.getElementById('setting-dark-mode');
        if (darkModeInput) darkModeInput.checked = this.state.settings.theme === 'dark';

        const fontSizeSelect = document.getElementById('setting-font-size');
        if (fontSizeSelect) fontSizeSelect.value = this.state.settings.fontSize;

        const dyslexiaInput = document.getElementById('setting-dyslexia');
        if (dyslexiaInput) dyslexiaInput.checked = this.state.settings.dyslexia;
    }
};

// Démarrage automatique global
document.addEventListener("DOMContentLoaded", () => {
    window.app.init();
});
