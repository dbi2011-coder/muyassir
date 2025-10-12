class StudentLessons {
    constructor() {
        this.studentId = JSON.parse(localStorage.getItem('currentStudent'))?.id;
        this.currentLesson = null;
        this.currentStep = 0;
        this.lessonProgress = {};
        this.init();
    }

    init() {
        if (!this.studentId) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadAvailableLessons();
        this.loadLessonProgress();
    }

    bindEvents() {
        // أحداث التنقل بين الدروس
        document.getElementById('filterSubject')?.addEventListener('change', () => this.filterLessons());
        document.getElementById('filterStatus')?.addEventListener('change', () => this.filterLessons());
        document.getElementById('searchLessons')?.addEventListener('input', () => this.searchLessons());
    }

    loadAvailableLessons() {
        const container = document.getElementById('lessonsContainer');
        if (!container) return;

        const lessons = this.getAvailableLessons();
        
        if (lessons.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد دروس متاحة حالياً</p>';
            return;
        }

        container.innerHTML = lessons.map(lesson => `
            <div class="lesson-card ${this.getLessonStatus(lesson.id)}">
                <div class="lesson-header">
                    <h4>${lesson.title}</h4>
                    <span class="lesson-badge ${lesson.difficulty}">${this.getDifficultyText(lesson.difficulty)}</span>
                </div>
                
                <div class="lesson-info">
                    <p><strong>المادة:</strong> ${lesson.subject}</p>
                    <p><strong>الاستراتيجية:</strong> ${lesson.strategy}</p>
                    <p><strong>المدة:</strong> ${lesson.duration} دقيقة</p>
                    <p><strong>المهارة:</strong> ${lesson.skill}</p>
                </div>

                <div class="lesson-progress">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${this.getLessonProgress(lesson.id)}%">
                            ${this.getLessonProgress(lesson.id)}%
                        </div>
                    </div>
                </div>

                <div class="lesson-actions">
                    ${this.getLessonActions(lesson)}
                </div>
            </div>
        `).join('');
    }

    getAvailableLessons() {
        const student = JSON.parse(localStorage.getItem('currentStudent'));
        const allLessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        
        return allLessons.filter(lesson => {
            // فلترة الدروس حسب صف الطالب وخطته
            return lesson.grades.includes(student.grade) && 
                   lesson.isActive;
        });
    }

    getLessonStatus(lessonId) {
        const progress = this.lessonProgress[lessonId];
        if (!progress) return 'not-started';
        if (progress >= 100) return 'completed';
        if (progress > 0) return 'in-progress';
        return 'not-started';
    }

    getLessonProgress(lessonId) {
        return this.lessonProgress[lessonId] || 0;
    }

    getDifficultyText(difficulty) {
        const difficulties = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        return difficulties[difficulty] || difficulty;
    }

    getLessonActions(lesson) {
        const status = this.getLessonStatus(lesson.id);
        
        switch (status) {
            case 'not-started':
                return `<button class="btn btn-primary" onclick="studentLessons.startLesson('${lesson.id}')">بدء الدرس</button>`;
            
            case 'in-progress':
                return `
                    <button class="btn btn-warning" onclick="studentLessons.continueLesson('${lesson.id}')">
                        متابعة
                    </button>
                    <button class="btn btn-outline-secondary" onclick="studentLessons.restartLesson('${lesson.id}')">
                        إعادة
                    </button>
                `;
            
            case 'completed':
                return `
                    <button class="btn btn-success" onclick="studentLessons.reviewLesson('${lesson.id}')">
                        مراجعة
                    </button>
                    <button class="btn btn-outline-primary" onclick="studentLessons.restartLesson('${lesson.id}')">
                        إعادة
                    </button>
                `;
            
            default:
                return '';
        }
    }

    loadLessonProgress() {
        const progressData = JSON.parse(localStorage.getItem(`student_lesson_progress_${this.studentId}`)) || {};
        this.lessonProgress = progressData;
    }

    saveLessonProgress() {
        localStorage.setItem(`student_lesson_progress_${this.studentId}`, JSON.stringify(this.lessonProgress));
    }

    startLesson(lessonId) {
        const lesson = this.getLessonById(lessonId);
        if (!lesson) return;

        this.currentLesson = lesson;
        this.currentStep = 0;
        
        this.showLessonInterface();
        this.showCurrentStep();
    }

    getLessonById(lessonId) {
        const allLessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        return allLessons.find(lesson => lesson.id === lessonId);
    }

    showLessonInterface() {
        document.getElementById('lessonsList').style.display = 'none';
        document.getElementById('lessonInterface').style.display = 'block';
        
        this.updateLessonProgressBar();
        this.updateNavigation();
    }

    showCurrentStep() {
        if (!this.currentLesson || this.currentStep >= this.currentLesson.steps.length) {
            this.completeLesson();
            return;
        }

        const step = this.currentLesson.steps[this.currentStep];
        this.displayStep(step);
        this.updateNavigation();
        this.updateLessonProgressBar();
    }

    displayStep(step) {
        const container = document.getElementById('lessonStepContainer');
        if (!container) return;

        let stepHTML = `
            <div class="lesson-step">
                <div class="step-header">
                    <h4>${step.title}</h4>
                    <span class="step-number">الخطوة ${this.currentStep + 1} من ${this.currentLesson.steps.length}</span>
                </div>
                
                <div class="step-content">
        `;

        // عرض محتوى الخطوة حسب النوع
        switch (step.type) {
            case 'content':
                stepHTML += this.renderContentStep(step);
                break;
            case 'video':
                stepHTML += this.renderVideoStep(step);
                break;
            case 'interactive':
                stepHTML += this.renderInteractiveStep(step);
                break;
            case 'quiz':
                stepHTML += this.renderQuizStep(step);
                break;
            case 'practice':
                stepHTML += this.renderPracticeStep(step);
                break;
        }

        stepHTML += `
                </div>
            </div>
        `;

        container.innerHTML = stepHTML;
        
        // تهيئة التفاعل حسب نوع الخطوة
        this.initializeStepInteraction(step);
    }

    renderContentStep(step) {
        return `
            <div class="content-step">
                <div class="content-text">
                    ${step.content}
                </div>
                ${step.media ? this.renderMedia(step.media) : ''}
            </div>
        `;
    }

    renderVideoStep(step) {
        return `
            <div class="video-step">
                <div class="video-container">
                    <video src="${step.videoUrl}" controls class="w-100"></video>
                </div>
                <div class="video-notes mt-3">
                    ${step.notes || ''}
                </div>
            </div>
        `;
    }

    renderInteractiveStep(step) {
        return `
            <div class="interactive-step">
                <div class="interactive-content">
                    ${step.content}
                </div>
                <div class="interactive-elements mt-3">
                    ${this.renderInteractiveElements(step.interactiveElements)}
                </div>
            </div>
        `;
    }

    renderInteractiveElements(elements) {
        if (!elements) return '';
        
        return elements.map(element => {
            switch (element.type) {
                case 'drag_drop':
                    return this.renderDragDropElement(element);
                case 'matching':
                    return this.renderMatchingElement(element);
                case 'sorting':
                    return this.renderSortingElement(element);
                default:
                    return '';
            }
        }).join('');
    }

    renderDragDropElement(element) {
        return `
            <div class="drag-drop-element">
                <h6>${element.question}</h6>
                <div class="drag-items">
                    ${element.items.map(item => `
                        <div class="draggable-item" draggable="true" data-id="${item.id}">
                            ${item.text}
                        </div>
                    `).join('')}
                </div>
                <div class="drop-targets">
                    ${element.targets.map(target => `
                        <div class="drop-target" data-id="${target.id}">
                            ${target.label}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderQuizStep(step) {
        return `
            <div class="quiz-step">
                <h5>اختبر فهمك</h5>
                <div class="quiz-questions">
                    ${step.questions.map((question, index) => `
                        <div class="quiz-question">
                            <p><strong>س ${index + 1}:</strong> ${question.text}</p>
                            <div class="quiz-options">
                                ${question.options.map((option, optIndex) => `
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" 
                                               name="q${index}" id="q${index}o${optIndex}" value="${option}">
                                        <label class="form-check-label" for="q${index}o${optIndex}">
                                            ${option}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPracticeStep(step) {
        return `
            <div class="practice-step">
                <h5>تمرين عملي</h5>
                <div class="practice-instructions">
                    ${step.instructions}
                </div>
                <div class="practice-area">
                    ${this.renderPracticeArea(step)}
                </div>
            </div>
        `;
    }

    renderPracticeArea(step) {
        switch (step.practiceType) {
            case 'writing':
                return `
                    <div class="writing-practice">
                        <textarea class="form-control" rows="5" placeholder="اكتب هنا..."></textarea>
                    </div>
                `;
            case 'drawing':
                return `
                    <div class="drawing-practice">
                        <canvas id="practiceCanvas" width="400" height="300"></canvas>
                    </div>
                `;
            case 'calculation':
                return `
                    <div class="calculation-practice">
                        <div class="calculation-problems">
                            ${step.problems.map(problem => `
                                <div class="problem">
                                    <p>${problem}</p>
                                    <input type="text" class="form-control" placeholder="الإجابة">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            default:
                return '<p>نوع التمرين غير مدعوم</p>';
        }
    }

    renderMedia(media) {
        if (media.type === 'image') {
            return `<img src="${media.url}" alt="صورة الدرس" class="img-fluid mt-3">`;
        }
        return '';
    }

    initializeStepInteraction(step) {
        // تهيئة التفاعل حسب نوع الخطوة
        switch (step.type) {
            case 'interactive':
                this.setupInteractiveStep(step);
                break;
            case 'quiz':
                this.setupQuizStep(step);
                break;
            case 'practice':
                this.setupPracticeStep(step);
                break;
        }
    }

    setupInteractiveStep(step) {
        // إعداد التفاعل للخطوات التفاعلية
        const draggableItems = document.querySelectorAll('.draggable-item');
        const dropTargets = document.querySelectorAll('.drop-target');

        draggableItems.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart);
        });

        dropTargets.forEach(target => {
            target.addEventListener('dragover', this.handleDragOver);
            target.addEventListener('drop', this.handleDrop);
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const item = document.querySelector(`[data-id="${itemId}"]`);
        
        if (item && e.target.classList.contains('drop-target')) {
            e.target.appendChild(item);
        }
    }

    setupQuizStep(step) {
        // إعداد الخطوات الاختبارية
        // يمكن إضافة التحقق من الإجابات تلقائياً
    }

    setupPracticeStep(step) {
        // إعداد التمارين العملية
        if (step.practiceType === 'drawing') {
            this.setupDrawingCanvas();
        }
    }

    setupDrawingCanvas() {
        const canvas = document.getElementById('practiceCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        }

        function draw(e) {
            if (!isDrawing) return;
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }

        function stopDrawing() {
            isDrawing = false;
        }
    }

    nextStep() {
        this.saveStepProgress();
        
        if (this.currentStep < this.currentLesson.steps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.completeLesson();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    saveStepProgress() {
        const progressPerStep = 100 / this.currentLesson.steps.length;
        const currentProgress = (this.currentStep + 1) * progressPerStep;
        
        this.lessonProgress[this.currentLesson.id] = Math.min(currentProgress, 100);
        this.saveLessonProgress();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const completeBtn = document.getElementById('completeLessonBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentStep < this.currentLesson.steps.length - 1 ? 'block' : 'none';
        }

        if (completeBtn) {
            completeBtn.style.display = this.currentStep === this.currentLesson.steps.length - 1 ? 'block' : 'none';
        }
    }

    updateLessonProgressBar() {
        const progressBar = document.getElementById('lessonProgress');
        if (!progressBar) return;

        const progress = ((this.currentStep + 1) / this.currentLesson.steps.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
    }

    completeLesson() {
        this.lessonProgress[this.currentLesson.id] = 100;
        this.saveLessonProgress();
        
        this.awardPoints();
        this.showCompletionMessage();
    }

    awardPoints() {
        const points = 10; // نقاط ثابتة لإكمال الدرس
        const pointsRecord = {
            points: points,
            reason: `إكمال درس ${this.currentLesson.title}`,
            date: new Date().toISOString()
        };

        const studentPoints = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        studentPoints.push(pointsRecord);
        localStorage.setItem(`student_points_${this.studentId}`, JSON.stringify(studentPoints));

        this.showNotification(`تهانينا! لقد ربحت ${points} نقطة`, 'success');
    }

    showCompletionMessage() {
        document.getElementById('lessonInterface').style.display = 'none';
        document.getElementById('lessonComplete').style.display = 'block';

        const completionContainer = document.getElementById('completionContainer');
        completionContainer.innerHTML = `
            <div class="completion-card">
                <div class="completion-icon">🎉</div>
                <h3>أحسنت!</h3>
                <p>لقد أكملت درس "${this.currentLesson.title}" بنجاح</p>
                <div class="completion-stats">
                    <p><strong>المادة:</strong> ${this.currentLesson.subject}</p>
                    <p><strong>المهارة:</strong> ${this.currentLesson.skill}</p>
                    <p><strong>الوقت المقدر:</strong> ${this.currentLesson.duration} دقيقة</p>
                </div>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="studentLessons.returnToLessons()">
                        العودة إلى الدروس
                    </button>
                    <button class="btn btn-outline-primary" onclick="studentLessons.restartCurrentLesson()">
                        إعادة الدرس
                    </button>
                </div>
            </div>
        `;
    }

    returnToLessons() {
        document.getElementById('lessonComplete').style.display = 'none';
        document.getElementById('lessonsList').style.display = 'block';
        
        this.currentLesson = null;
        this.loadAvailableLessons();
    }

    restartCurrentLesson() {
        this.lessonProgress[this.currentLesson.id] = 0;
        this.saveLessonProgress();
        this.startLesson(this.currentLesson.id);
    }

    continueLesson(lessonId) {
        const lesson = this.getLessonById(lessonId);
        if (!lesson) return;

        this.currentLesson = lesson;
        
        // استئناف من آخر خطوة غير مكتملة
        const progress = this.lessonProgress[lessonId] || 0;
        const stepsCompleted = Math.floor((progress / 100) * lesson.steps.length);
        this.currentStep = Math.min(stepsCompleted, lesson.steps.length - 1);
        
        this.showLessonInterface();
        this.showCurrentStep();
    }

    restartLesson(lessonId) {
        if (confirm('هل تريد إعادة هذا الدرس من البداية؟')) {
            this.lessonProgress[lessonId] = 0;
            this.saveLessonProgress();
            this.startLesson(lessonId);
        }
    }

    reviewLesson(lessonId) {
        this.startLesson(lessonId);
    }

    filterLessons() {
        const subjectFilter = document.getElementById('filterSubject').value;
        const statusFilter = document.getElementById('filterStatus').value;
        
        const lessonCards = document.querySelectorAll('.lesson-card');
        
        lessonCards.forEach(card => {
            const subject = card.querySelector('.lesson-info p:nth-child(1)').textContent;
            const status = card.classList.contains(statusFilter) || statusFilter === 'all';
            const subjectMatch = subjectFilter === 'all' || subject.includes(subjectFilter);
            
            card.style.display = status && subjectMatch ? 'block' : 'none';
        });
    }

    searchLessons() {
        const searchTerm = document.getElementById('searchLessons').value.toLowerCase();
        const lessonCards = document.querySelectorAll('.lesson-card');
        
        lessonCards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            const subject = card.querySelector('.lesson-info p:nth-child(1)').textContent.toLowerCase();
            const skill = card.querySelector('.lesson-info p:nth-child(4)').textContent.toLowerCase();
            
            const matches = title.includes(searchTerm) || subject.includes(searchTerm) || skill.includes(searchTerm);
            card.style.display = matches ? 'block' : 'none';
        });
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة إدارة دروس الطالب
let studentLessons;
document.addEventListener('DOMContentLoaded', function() {
    studentLessons = new StudentLessons();
});