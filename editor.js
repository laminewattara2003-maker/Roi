/**
 * ==========================================================================
 * SmartRevision - MODULE ÉDITEUR (editor.js)
 * Code d'Administration - Conception des Cours & Échanges d'Équipe
 * ==========================================================================
 */

// Injection des méthodes administratives dans l'objet global existant
window.app.toggleAdminMode = function() {
    const studentZone = document.getElementById('student-zone');
    const editorZone = document.getElementById('editor-zone');
    const toggleBtn = document.getElementById('toggle-mode-btn');

    if (this.currentViewZone === 'student-zone') {
        studentZone.classList.remove('active');
        editorZone.classList.add('active');
        this.currentViewZone = 'editor-zone';
        toggleBtn.innerText = "Mode Étudiant";
        toggleBtn.style.backgroundColor = "#173f27";
        toggleBtn.style.color = "#ffffff";
        // Repart toujours du tableau de bord éditeur (et non d'une vue restée
        // "collée" sur l'écran de création de cours depuis un précédent passage).
        this.switchView('editor-dashboard');
        this.renderEditorDashboard();
    } else {
        editorZone.classList.remove('active');
        studentZone.classList.add('active');
        this.currentViewZone = 'student-zone';
        toggleBtn.innerText = "Mode Éditeur";
        toggleBtn.style.backgroundColor = "var(--card-bg)";
        toggleBtn.style.color = "var(--accent-green)";
        this.switchView('dashboard');
    }
};

window.app.renderEditorDashboard = function() {
    const list = document.getElementById('editor-courses-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.state.courses.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:10px;">Aucun module créé.</p>';
        return;
    }

    this.state.courses.forEach(course => {
        const row = document.createElement('div');
        row.className = 'course-card';
        row.style.background = 'var(--inner-box-bg)';
        row.style.marginBottom = '10px';
        row.innerHTML = `
            <div>
                <strong style="color:var(--text-main); font-size:1rem;">${course.title}</strong>
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:bold;">${course.chapters.length} chapitre(s) programmé(s)</div>
            </div>
            <button onclick="window.app.deleteCourse('${course.id}')" style="background:none; border:none; color:var(--color-bad); font-weight:bold; cursor:pointer; padding:8px;">Supprimer</button>
        `;
        list.appendChild(row);
    });
};

window.app.openCourseCreator = function() {
    this.switchView('course-creator');
    const stack = document.getElementById('chapters-dynamic-stack');
    if (stack) stack.innerHTML = '';
    
    const titleInput = document.getElementById('input-course-title');
    if (titleInput) titleInput.value = '';
    
    this.addChapterField();
};

window.app.addChapterField = function() {
    const stack = document.getElementById('chapters-dynamic-stack');
    if (!stack) return;
    
    const chapIdx = stack.children.length + 1;
    const chapBox = document.createElement('div');
    chapBox.className = 'form-element';
    chapBox.style.marginTop = '14px';
    chapBox.style.borderLeft = '5px solid var(--accent-green)';
    chapBox.style.paddingLeft = '10px';
    
    chapBox.innerHTML = `
        <h4 style="color:var(--text-main); font-size:1rem; font-weight:bold; margin-bottom:6px;">Chapitre Numéro ${chapIdx}</h4>
        <input type="text" class="input-chap-title" placeholder="Titre du chapitre (Ex: Chapitre ${chapIdx} : Pharmacocinétique)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-bottom:10px;" required>
        
        <div class="parts-stack" style="background:rgba(0,0,0,0.02); padding:10px; border-radius:8px;">
            <h5 style="font-size:0.9rem; margin-bottom:4px; color:var(--accent-green);">📝 Contenu d'étude de la sous-partie</h5>
            <input type="text" class="input-part-title" placeholder="Titre de la sous-partie (Ex: 1. L'absorption intestinale)" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;" required>
            <textarea class="input-part-content" placeholder="Insère ici le texte de cours rédigé ou résumé du PDF..." style="width:100%; height:100px; margin-top:8px; padding:8px; border-radius:6px; border:1px solid #ccc; font-family:sans-serif;" required></textarea>
            
            <input type="text" class="input-part-tip" placeholder="Astuce mémo-technique pour le cerveau (Optionnel)" style="margin-top:6px; width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
            <input type="text" class="input-part-example" placeholder="Exemple clinique pratique (Optionnel)" style="margin-top:6px; width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
            
            <div class="question-builder-box" style="background:#ffffff; padding:12px; border-radius:10px; margin-top:12px; border:1px solid var(--inner-box-bg);">
                <h6 style="font-size:0.85rem; font-weight:bold; color:var(--text-main); margin-bottom:6px;">🎯 QUESTION DE VÉRIFICATION ACTIVE (QCM)</h6>
                <input type="text" class="input-q-text" placeholder="Énoncé clair de la question du Quiz" style="width:100%; padding:8px; margin-bottom:6px; border-radius:6px; border:1px solid #ccc;" required>
                <input type="text" class="input-q-opt1" placeholder="Option A (Cette case sera TOUJOURS la bonne réponse)" style="width:100%; padding:8px; margin-bottom:6px; border-radius:6px; border:1px solid #173f27; background:#f0fff4;" required>
                <input type="text" class="input-q-opt2" placeholder="Option B (Mauvaise réponse distributive)" style="width:100%; padding:8px; margin-bottom:6px; border-radius:6px; border:1px solid #ccc;" required>
                <input type="text" class="input-q-opt3" placeholder="Option C (Mauvaise réponse distributive)" style="width:100%; padding:8px; margin-bottom:6px; border-radius:6px; border:1px solid #ccc;" required>
                <textarea class="input-q-explanation" placeholder="Explication pédagogique immédiate (S'affiche après validation pour comprendre l'erreur)..." style="width:100%; height:60px; padding:8px; border-radius:6px; border:1px solid #ccc;" required></textarea>
            </div>
        </div>
    `;
    stack.appendChild(chapBox);
};

window.app.saveCreatedCourse = function() {
    const title = document.getElementById('input-course-title').value;
    if (!title) { 
        alert("Veuillez donner un titre principal à votre document de révision."); 
        return; 
    }

    const newCourse = {
        id: "cours_" + Date.now(),
        title: title,
        chapters: []
    };

    const chapBlocks = document.querySelectorAll('#chapters-dynamic-stack .form-element');
    let validationPassed = true;

    chapBlocks.forEach((block, cIdx) => {
        const chapTitle = block.querySelector('.input-chap-title').value;
        const partTitle = block.querySelector('.input-part-title').value;
        const partContent = block.querySelector('.input-part-content').value;
        const partTip = block.querySelector('.input-part-tip').value;
        const partExample = block.querySelector('.input-part-example').value;

        const qText = block.querySelector('.input-q-text').value;
        const qOpt1 = block.querySelector('.input-q-opt1').value;
        const qOpt2 = block.querySelector('.input-q-opt2').value;
        const qOpt3 = block.querySelector('.input-q-opt3').value;
        const qExp = block.querySelector('.input-q-explanation').value;

        if (!chapTitle || !partTitle || !partContent || !qText || !qOpt1 || !qOpt2 || !qExp) {
            validationPassed = false;
            return;
        }

        // Mélange des options pour ne pas que la bonne réponse soit toujours le premier bouton
        const rawOptions = [qOpt1, qOpt2, qOpt3].filter(o => o.trim() !== "");
        const correctAnswerString = qOpt1;
        
        // Algorithme de mélange basique (Fisher-Yates léger)
        const finalOptions = [...rawOptions].sort(() => Math.random() - 0.5);
        const correctIndexIndex = finalOptions.indexOf(correctAnswerString);

        newCourse.chapters.push({
            id: `chap_${cIdx}_${Date.now()}`,
            title: chapTitle,
            parts: [{
                id: `part_${cIdx}_${Date.now()}`,
                title: partTitle,
                content: partContent,
                tip: partTip,
                example: partExample,
                questions: [{
                    type: "QCM",
                    question: qText,
                    options: finalOptions,
                    answer: correctIndexIndex !== -1 ? correctIndexIndex : 0,
                    explanation: qExp
                }]
            }]
        });
    });

    if (!validationPassed) {
        alert("Erreur : Veuillez remplir l'ensemble des champs requis obligatoires (*).");
        return;
    }

    this.state.courses.push(newCourse);
    this.saveToStorage();
    alert("🎉 Le nouveau cours a été compilé et sécurisé en mémoire locale !");
    this.toggleAdminMode();
};

window.app.deleteCourse = function(courseId) {
    if (confirm("Supprimer définitivement ce module de révision de la mémoire de l'appareil ?")) {
        this.state.courses = this.state.courses.filter(c => c.id !== courseId);
        this.saveToStorage();
        this.renderEditorDashboard();
    }
};

// --- LOGIQUE D'ÉCHANGE DE FICHIERS (TRAVAIL DE GROUPE) ---
window.app.exportJSON = function() {
    if (this.state.courses.length === 0) {
        alert("Aucun cours à exporter pour le moment.");
        return;
    }
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.courses));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `SmartRevision_Fiche_Partage.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        console.log("Exportation effectuée.");
    } catch (e) {
        alert("Impossible d'exporter sur cet appareil mobile.");
    }
};

window.app.importJSON = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedCourses = JSON.parse(e.target.result);
            if (Array.isArray(importedCourses)) {
                // Fusion intelligente sans détruire tes propres cours existants
                this.state.courses = [...this.state.courses, ...importedCourses];
                this.saveToStorage();
                alert("📥 Fiches d'équipe intégrées avec succès ! Prêt pour le Quiz.");
                this.renderEditorDashboard();
            } else {
                alert("Le format du fichier JSON fourni n'est pas conforme.");
            }
        } catch (err) {
            alert("Erreur de décodage du fichier. Vérifie qu'il s'agit d'un JSON valide.");
        }
    };
    reader.readAsText(file);
};