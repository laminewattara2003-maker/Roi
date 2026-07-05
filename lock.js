/**
 * ==========================================================================
 * SmartRevision - VERROUILLAGE 100% HORS-LIGNE (lock.js)
 * Plus besoin de Google Script ! Génère les codes selon la date du jour.
 * ==========================================================================
 */

window.lock = {
    STORAGE_KEY: "smart_revision_lock",

    // --- Le générateur magique de codes ---
    generateDailyCode(type) {
        const today = new Date();
        // Crée une chaîne unique pour aujourd'hui (ex: "2026-7-5-student")
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}-${type}`;
        
        // Transforme cette chaîne en un code à 5 caractères
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
            hash = hash & hash; 
        }
        
        let code = Math.abs(hash).toString(36).toUpperCase();
        while (code.length < 5) code = "0" + code;
        return code.substring(0, 5);
    },

    getStoredUnlock() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return null;

            const data = JSON.parse(raw);
            const saved = new Date(data.timestamp);
            const today = new Date();

            const sameDay =
                saved.getFullYear() === today.getFullYear() &&
                saved.getMonth() === today.getMonth() &&
                saved.getDate() === today.getDate();

            if (!sameDay) {
                localStorage.removeItem(this.STORAGE_KEY);
                return null;
            }

            return data;
        } catch (e) {
            return null;
        }
    },

    setStoredUnlock(level) {
        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify({
                level: level,
                timestamp: new Date().toISOString()
            })
        );
    },

    init() {
        const stored = this.getStoredUnlock();
        const lockScreen = document.getElementById('lock-screen');

        if (stored) {
            lockScreen.classList.add('hidden');
        } else {
            lockScreen.classList.remove('hidden');
            document.getElementById('lock-code-input').focus();
        }

        this.wrapEditorToggle();
    },

    showStatus(elId, message, isLoading) {
        const el = document.getElementById(elId);
        el.textContent = message;
        el.classList.remove('hidden');
        el.classList.toggle('lock-status-loading', !!isLoading);
    },

    hideStatus(elId) {
        document.getElementById(elId).classList.add('hidden');
    },

    // --- Vérification Locale ---
    tryUnlock() {
        const input = document.getElementById('lock-code-input');
        const code = input.value.trim().toUpperCase();
        if (!code) return;

        // PORTE SECRÈTE POUR L'ADMINISTRATEUR
        if (code === "MASTER2026") {
            const codeEtu = this.generateDailyCode('student');
            const codeEdi = this.generateDailyCode('editor');
            alert(`--- CODES DU JOUR ---\n\nÉtudiant : ${codeEtu}\nÉditeur : ${codeEdi}`);
            input.value = "";
            return;
        }

        const expectedStudentCode = this.generateDailyCode('student');
        const expectedEditorCode = this.generateDailyCode('editor');

        if (code === expectedStudentCode || code === expectedEditorCode) {
            const type = (code === expectedEditorCode) ? 'editor' : 'student';
            this.setStoredUnlock(type);
            document.getElementById('lock-screen').classList.add('hidden');
            this.hideStatus('lock-status');
        } else {
            this.showStatus('lock-status', 'Code incorrect. Réessaie.', false);
        }
    },

    // --- Bouton Mode Éditeur ---
    wrapEditorToggle() {
        const originalToggle = window.app.toggleAdminMode.bind(window.app);

        window.app.toggleAdminMode = () => {
            const stored = this.getStoredUnlock();
            const goingToEditor = window.app.currentViewZone === 'student-zone';

            if (goingToEditor && (!stored || stored.level !== 'editor')) {
                document.getElementById('editor-code-modal').classList.remove('hidden');
                document.getElementById('editor-code-input').focus();
                return;
            }
            originalToggle();
        };
    },

    cancelEditorPrompt() {
        document.getElementById('editor-code-modal').classList.add('hidden');
        document.getElementById('editor-code-input').value = '';
        this.hideStatus('editor-code-status');
    },

    tryEditorUnlock() {
        const input = document.getElementById('editor-code-input');
        const code = input.value.trim().toUpperCase();
        if (!code) return;

        const expectedEditorCode = this.generateDailyCode('editor');

        if (code === expectedEditorCode) {
            this.setStoredUnlock('editor');
            document.getElementById('editor-code-modal').classList.add('hidden');
            input.value = '';
            this.hideStatus('editor-code-status');
            window.app.toggleAdminMode();
        } else {
            this.showStatus('editor-code-status', 'Code incorrect pour l\'éditeur.', false);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.lock.init();
});
