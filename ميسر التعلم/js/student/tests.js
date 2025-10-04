class StudentTests {
    constructor() {
        this.studentId = JSON.parse(localStorage.getItem('currentStudent'))?.id;
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.timer = null;
        this.timeLeft = 0;
        this.init();
    }

    init() {
        if (!this.studentId) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadAvailableTests();
        this.setupTestNavigation();
    }

    bindEvents() {
        document.getElementById('startTestBtn')?.addEventListener('click', () => this.startSelectedTest());
        document.getElementById('nextQuestionBtn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('prevQuestionBtn')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('submitTestBtn')?.addEventListener('click', () => this.submitTest());
        document.getElementById('saveAnswerBtn')?.addEventListener('click', () => this.saveAnswer());
        
        // أحداث التسجيل الصوتي
        this.setupAudioRecording();
    }

    loadAvailableTests() {
        const container = document.getElementById('availableTests');
        if (!container) return;

        const tests = this.getAvailableTests();
        
        if (tests.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد اختبارات متاحة حالياً</p>';
            return;
        }

        container.innerHTML = tests.map(test => `
            <div class="test-card">
                <div class="test-header">
                    <h4>${test.title}</h4>
                    <span class="test-badge ${test.difficulty}">${this.getDifficultyText(test.difficulty)}</span>
                </div>
                <div class="test-info">
                    <p><strong>المادة:</strong> ${test.subject}</p>
                    <p><strong>عدد الأسئلة:</strong> ${test.questions.length}</p>
                    <p><strong>الوقت:</strong> ${test.timeLimit} دقيقة</p>
                    <p><strong>الدرجة النهائية:</strong> ${test.totalScore}</p>
                </div>
                <div class="test-actions">
                    <button class="btn btn-primary" onclick="studentTests.startTest('${test.id}')">
                        بدء الاختبار
                    </button>
                </div>
            </div>
        `).join('');
    }

    getAvailableTests() {
        const student = JSON.parse(localStorage.getItem('currentStudent'));
        const allTests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        
        return allTests.filter(test => {
            // فلترة الاختبارات حسب صف الطالب والإعدادات
            return test.grades.includes(student.grade) && 
                   test.isActive && 
                   !this.isTestCompleted(test.id);
        });
    }

    isTestCompleted(testId) {
        const completedTests = JSON.parse(localStorage.getItem(`student_tests_${this.studentId}`)) || [];
        return completedTests.some(test => test.testId === testId);
    }

    getDifficultyText(difficulty) {
        const difficulties = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        return difficulties[difficulty] || difficulty;
    }

    startTest(testId) {
        const test = this.getTestById(testId);
        if (!test) return;

        this.currentTest = test;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.timeLeft = test.timeLimit * 60; // تحويل إلى ثواني

        this.showTestInterface();
        this.showQuestion(0);
        this.startTimer();
    }

    getTestById(testId) {
        const allTests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        return allTests.find(test => test.id === testId);
    }

    showTestInterface() {
        document.getElementById('testsList').style.display = 'none';
        document.getElementById('testInterface').style.display = 'block';
        
        this.updateProgressBar();
        this.updateQuestionNavigation();
    }

    showQuestion(index) {
        if (!this.currentTest || index < 0 || index >= this.currentTest.questions.length) {
            return;
        }

        this.currentQuestionIndex = index;
        const question = this.currentTest.questions[index];
        
        this.displayQuestion(question);
        this.updateNavigationButtons();
        this.updateProgressBar();
        this.updateQuestionNavigation();
    }

    displayQuestion(question) {
        const container = document.getElementById('questionContainer');
        if (!container) return;

        let questionHTML = `
            <div class="question-header">
                <h4>السؤال ${this.currentQuestionIndex + 1} من ${this.currentTest.questions.length}</h4>
                <span class="question-score">(${question.points} نقطة)</span>
            </div>
            
            <div class="question-content">
                <p>${question.text}</p>
        `;

        // عرض الوسائط إذا وجدت
        if (question.media) {
            questionHTML += this.renderMedia(question.media);
        }

        // عرض خيارات الإجابة حسب نوع السؤال
        questionHTML += this.renderAnswerOptions(question);

        questionHTML += '</div>';
        container.innerHTML = questionHTML;

        // تحميل الإجابة المحفوظة إن وجدت
        this.loadSavedAnswer(question.id);
    }

    renderMedia(media) {
        if (media.type === 'image') {
            return `<div class="question-media"><img src="${media.url}" alt="صورة السؤال" class="img-fluid"></div>`;
        } else if (media.type === 'video') {
            return `<div class="question-media"><video src="${media.url}" controls class="img-fluid"></video></div>`;
        } else if (media.type === 'audio') {
            return `
                <div class="question-media">
                    <audio src="${media.url}" controls></audio>
                    <div class="audio-recorder" id="audioRecorder">
                        <button class="btn btn-outline-primary" onclick="studentTests.startRecording()">
                            🎤 تسجيل الإجابة
                        </button>
                    </div>
                </div>
            `;
        }
        return '';
    }

    renderAnswerOptions(question) {
        switch (question.type) {
            case 'multiple_choice_single':
                return this.renderMultipleChoiceSingle(question);
            case 'multiple_choice_multiple':
                return this.renderMultipleChoiceMultiple(question);
            case 'essay':
                return this.renderEssay(question);
            case 'drag_drop':
                return this.renderDragDrop(question);
            case 'reading':
                return this.renderReading(question);
            default:
                return '<p>نوع السؤال غير مدعوم</p>';
        }
    }

    renderMultipleChoiceSingle(question) {
        return `
            <div class="answer-options">
                ${question.options.map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="answer" 
                               id="option${index}" value="${option}">
                        <label class="form-check-label" for="option${index}">
                            ${option}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderMultipleChoiceMultiple(question) {
        return `
            <div class="answer-options">
                ${question.options.map((option, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="option${index}" value="${option}">
                        <label class="form-check-label" for="option${index}">
                            ${option}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderEssay(question) {
        return `
            <div class="answer-options">
                <textarea class="form-control" rows="5" placeholder="اكتب إجابتك هنا..."></textarea>
            </div>
        `;
    }

    renderDragDrop(question) {
        return `
            <div class="drag-drop-container">
                <div class="drag-items">
                    ${question.items.map((item, index) => `
                        <div class="draggable-item" draggable="true" data-id="${item.id}">
                            ${item.text}
                        </div>
                    `).join('')}
                </div>
                <div class="drop-areas">
                    ${question.targets.map((target, index) => `
                        <div class="drop-area" data-target="${target.id}">
                            <span>${target.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderReading(question) {
        return `
            <div class="reading-container">
                <div class="reading-passage">
                    <p>${question.passage}</p>
                </div>
                <div class="reading-questions">
                    ${question.questions.map((q, index) => `
                        <div class="reading-question">
                            <p>${q.text}</p>
                            <textarea class="form-control" rows="2" 
                                      placeholder="الإجابة..." data-question="${q.id}"></textarea>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    loadSavedAnswer(questionId) {
        const savedAnswer = this.answers[questionId];
        if (!savedAnswer) return;

        // تحميل الإجابة المحفوظة حسب نوع السؤال
        // (سيتم تنفيذ التفاصيل حسب نوع السؤال)
    }

    saveAnswer() {
        if (!this.currentTest) return;

        const question = this.currentTest.questions[this.currentQuestionIndex];
        const answer = this.getCurrentAnswer();

        if (answer) {
            this.answers[question.id] = {
                answer: answer,
                timestamp: new Date().toISOString()
            };

            this.showNotification('تم حفظ الإجابة', 'success');
            this.updateQuestionNavigation();
        }
    }

    getCurrentAnswer() {
        // الحصول على الإجابة الحالية حسب نوع السؤال
        const question = this.currentTest.questions[this.currentQuestionIndex];
        
        switch (question.type) {
            case 'multiple_choice_single':
                const selectedRadio = document.querySelector('input[name="answer"]:checked');
                return selectedRadio ? selectedRadio.value : null;
            
            case 'multiple_choice_multiple':
                const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                return Array.from(selectedCheckboxes).map(cb => cb.value);
            
            case 'essay':
                const textarea = document.querySelector('textarea');
                return textarea ? textarea.value : null;
            
            case 'drag_drop':
                // معالجة السحب والإفلات
                return this.getDragDropAnswer();
            
            case 'reading':
                // معالجة أسئلة القراءة
                return this.getReadingAnswer();
            
            default:
                return null;
        }
    }

    getDragDropAnswer() {
        // تنفيذ جمع إجابات السحب والإفلات
        const dropAreas = document.querySelectorAll('.drop-area');
        const result = {};
        
        dropAreas.forEach(area => {
            const items = area.querySelectorAll('.draggable-item');
            result[area.dataset.target] = Array.from(items).map(item => item.dataset.id);
        });
        
        return result;
    }

    getReadingAnswer() {
        // تنفيذ جمع إجابات القراءة
        const textareas = document.querySelectorAll('textarea[data-question]');
        const result = {};
        
        textareas.forEach(textarea => {
            result[textarea.dataset.question] = textarea.value;
        });
        
        return result;
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const submitBtn = document.getElementById('submitTestBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentQuestionIndex < this.currentTest.questions.length - 1 ? 'block' : 'none';
        }

        if (submitBtn) {
            submitBtn.style.display = this.currentQuestionIndex === this.currentTest.questions.length - 1 ? 'block' : 'none';
        }
    }

    updateProgressBar() {
        const progressBar = document.getElementById('testProgress');
        if (!progressBar) return;

        const progress = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
    }

    updateQuestionNavigation() {
        const container = document.getElementById('questionNavigation');
        if (!container) return;

        container.innerHTML = this.currentTest.questions.map((_, index) => {
            const isAnswered = this.answers[this.currentTest.questions[index].id];
            const isCurrent = index === this.currentQuestionIndex;
            
            return `
                <button class="question-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}"
                        onclick="studentTests.showQuestion(${index})">
                    ${index + 1}
                </button>
            `;
        }).join('');
    }

    startTimer() {
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.submitTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('testTimer');
        if (!timerEl) return;

        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeLeft < 300) { // أقل من 5 دقائق
            timerEl.classList.add('text-danger');
        }
    }

    submitTest() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        if (!confirm('هل تريد تسليم الاختبار؟ لا يمكنك تعديل الإجابات بعد التسليم.')) {
            this.startTimer(); // استئناف المؤقت إذا ألغى المستخدم
            return;
        }

        const score = this.calculateScore();
        this.saveTestResult(score);
        this.showTestResult(score);
    }

    calculateScore() {
        let totalScore = 0;
        let maxScore = 0;

        this.currentTest.questions.forEach(question => {
            maxScore += question.points;
            const userAnswer = this.answers[question.id];
            
            if (userAnswer) {
                const questionScore = this.evaluateAnswer(question, userAnswer.answer);
                totalScore += questionScore;
            }
        });

        return {
            obtained: totalScore,
            total: maxScore,
            percentage: Math.round((totalScore / maxScore) * 100)
        };
    }

    evaluateAnswer(question, userAnswer) {
        // تقييم الإجابة حسب نوع السؤال
        switch (question.type) {
            case 'multiple_choice_single':
                return userAnswer === question.correctAnswer ? question.points : 0;
            
            case 'multiple_choice_multiple':
                const correctAnswers = new Set(question.correctAnswers);
                const userAnswers = new Set(userAnswer);
                
                let correctCount = 0;
                userAnswers.forEach(answer => {
                    if (correctAnswers.has(answer)) correctCount++;
                });
                
                return (correctCount / correctAnswers.size) * question.points;
            
            case 'essay':
            case 'reading':
                // تحتاج إلى تقييم يدوي من المعلم
                return 0;
            
            case 'drag_drop':
                return this.evaluateDragDrop(question, userAnswer);
            
            default:
                return 0;
        }
    }

    evaluateDragDrop(question, userAnswer) {
        let correctCount = 0;
        question.correctMapping.forEach(mapping => {
            if (JSON.stringify(userAnswer[mapping.target]) === JSON.stringify(mapping.items)) {
                correctCount++;
            }
        });
        
        return (correctCount / question.correctMapping.length) * question.points;
    }

    saveTestResult(score) {
        const testResult = {
            testId: this.currentTest.id,
            testTitle: this.currentTest.title,
            score: score.obtained,
            totalScore: score.total,
            percentage: score.percentage,
            answers: this.answers,
            completedAt: new Date().toISOString(),
            timeSpent: (this.currentTest.timeLimit * 60) - this.timeLeft
        };

        const completedTests = JSON.parse(localStorage.getItem(`student_tests_${this.studentId}`)) || [];
        completedTests.push(testResult);
        localStorage.setItem(`student_tests_${this.studentId}`, JSON.stringify(completedTests));

        // منح نقاط التعزيز
        this.awardPoints(score.percentage);
    }

    awardPoints(percentage) {
        let points = 0;
        
        if (percentage >= 90) points = 20;
        else if (percentage >= 80) points = 15;
        else if (percentage >= 70) points = 10;
        else if (percentage >= 60) points = 5;

        if (points > 0) {
            const pointsRecord = {
                points: points,
                reason: `إكمال اختبار ${this.currentTest.title}`,
                date: new Date().toISOString()
            };

            const studentPoints = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
            studentPoints.push(pointsRecord);
            localStorage.setItem(`student_points_${this.studentId}`, JSON.stringify(studentPoints));
        }
    }

    showTestResult(score) {
        document.getElementById('testInterface').style.display = 'none';
        document.getElementById('testResult').style.display = 'block';

        const resultContainer = document.getElementById('resultContainer');
        resultContainer.innerHTML = `
            <div class="result-card ${score.percentage >= 60 ? 'success' : 'warning'}">
                <h3>نتيجة الاختبار</h3>
                <div class="score-circle">
                    <span>${score.percentage}%</span>
                </div>
                <div class="result-details">
                    <p><strong>الدرجة:</strong> ${score.obtained} من ${score.total}</p>
                    <p><strong>الحالة:</strong> ${score.percentage >= 60 ? 'ناجح' : 'احتياج تحسين'}</p>
                    <p><strong>وقت الإنجاز:</strong> ${Math.floor((this.currentTest.timeLimit * 60 - this.timeLeft) / 60)} دقيقة</p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="studentTests.returnToTests()">
                        العودة إلى الاختبارات
                    </button>
                </div>
            </div>
        `;
    }

    returnToTests() {
        document.getElementById('testResult').style.display = 'none';
        document.getElementById('testsList').style.display = 'block';
        
        this.currentTest = null;
        this.loadAvailableTests();
    }

    setupAudioRecording() {
        // إعداد التسجيل الصوتي (تنفيذ أساسي)
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('التسجيل الصوتي غير مدعوم في هذا المتصفح');
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.saveAudioAnswer(audioBlob);
                };

                this.mediaRecorder.start();
                this.showRecordingUI();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('تعذر الوصول إلى الميكروفون');
            });
    }

    showRecordingUI() {
        const recorderEl = document.getElementById('audioRecorder');
        if (recorderEl) {
            recorderEl.innerHTML = `
                <div class="recording-indicator"></div>
                <span>جاري التسجيل...</span>
                <button class="btn btn-danger btn-sm" onclick="studentTests.stopRecording()">
                    إيقاف
                </button>
            `;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    saveAudioAnswer(audioBlob) {
        // حفظ الإجابة الصوتية
        const question = this.currentTest.questions[this.currentQuestionIndex];
        this.answers[question.id] = {
            answer: URL.createObjectURL(audioBlob),
            type: 'audio',
            timestamp: new Date().toISOString()
        };

        this.showNotification('تم حفظ التسجيل الصوتي', 'success');
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

// تهيئة إدارة اختبارات الطالب
let studentTests;
document.addEventListener('DOMContentLoaded', function() {
    studentTests = new StudentTests();
});