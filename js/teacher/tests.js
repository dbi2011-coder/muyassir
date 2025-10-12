class TestsManager {
    constructor() {
        this.currentTestId = null;
        this.currentQuestions = [];
        this.currentEditQuestionId = null;
        this.init();
    }

    init() {
        if (!auth.protectPage('teacher')) return;
        this.loadTests();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', () => auth.logout());
        
        // الفلاتر
        document.getElementById('gradeFilter')?.addEventListener('change', () => this.filterTests());
        document.getElementById('subjectFilter')?.addEventListener('change', () => this.filterTests());
    }

    loadTests() {
        const tests = database.getTests();
        this.displayTests(tests);
    }

    displayTests(tests) {
        const container = document.getElementById('testsContainer');
        if (!container) return;

        if (tests.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📝</div>
                        <h3 style="color: #666; margin-bottom: 1rem;">لا توجد اختبارات بعد</h3>
                        <p style="color: #888; margin-bottom: 2rem;">ابدأ بإنشاء أول اختبار تشخيصي للطلاب</p>
                        <button class="btn btn-primary" onclick="testsManager.showTestForm()">
                            إنشاء أول اختبار
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = tests.map(test => this.createTestCard(test)).join('');
    }

    createTestCard(test) {
        const questionCount = test.questions ? test.questions.length : 0;
        const gradeName = Utils.getGradeName(test.grade);
        const subjectName = Utils.getSubjectName(test.subject);

        return `
            <div class="test-card" data-test-id="${test.id}">
                <div class="test-header">
                    <div class="test-info">
                        <h3>${test.title}</h3>
                        <div class="test-meta">
                            <span class="test-grade">${gradeName}</span> • 
                            <span class="test-subject">${subjectName}</span> • 
                            <span class="test-questions">${questionCount} سؤال</span>
                        </div>
                    </div>
                    <div class="test-actions">
                        <button class="btn btn-sm btn-outline" onclick="testsManager.editTest(${test.id})" title="تعديل">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="testsManager.manageQuestions(${test.id})" title="إدارة الأسئلة">
                            📋
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="testsManager.assignTest(${test.id})" title="تعيين للطلاب">
                            👨‍🎓
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="testsManager.deleteTest(${test.id})" title="حذف">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="test-content">
                    <p class="test-description">${test.description || 'لا يوجد وصف'}</p>
                    
                    <div class="test-details">
                        <div class="test-detail">
                            <span class="detail-label">المدة:</span>
                            <span class="detail-value">${test.duration || 30} دقيقة</span>
                        </div>
                        <div class="test-detail">
                            <span class="detail-label">درجة النجاح:</span>
                            <span class="detail-value">${test.passing_score || 60}%</span>
                        </div>
                        <div class="test-detail">
                            <span class="detail-label">تاريخ الإنشاء:</span>
                            <span class="detail-value">${Utils.formatDate(test.created_at)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="test-footer">
                    <div class="test-status">
                        <span class="status-badge status-active">${test.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                    </div>
                    <div class="test-stats">
                        <span class="stat">👥 ${this.getAssignedStudentsCount(test)} طلاب</span>
                        <span class="stat">📊 ${this.getAverageScore(test)}% متوسط</span>
                    </div>
                </div>
            </div>
        `;
    }

    getAssignedStudentsCount(test) {
        // محاكاة لعدد الطلاب المعينين
        return Math.floor(Math.random() * 10) + 1;
    }

    getAverageScore(test) {
        // محاكاة لمتوسط الدرجات
        return Math.floor(Math.random() * 30) + 70;
    }

    showTestForm() {
        this.currentTestId = null;
        document.getElementById('testFormTitle').textContent = 'إنشاء اختبار تشخيصي جديد';
        document.getElementById('testForm').reset();
        document.getElementById('testFormModal').classList.add('active');
    }

    hideTestForm() {
        document.getElementById('testFormModal').classList.remove('active');
        this.currentTestId = null;
    }

    async saveTest(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const testData = {
            title: formData.get('title'),
            grade: formData.get('grade'),
            subject: formData.get('subject'),
            description: formData.get('description'),
            duration: parseInt(formData.get('duration')) || 30,
            passing_score: parseInt(formData.get('passingScore')) || 60,
            questions: []
        };

        if (!this.validateTestData(testData)) {
            return;
        }

        try {
            if (this.currentTestId) {
                // تحديث الاختبار الموجود
                const updatedTest = database.updateTest(this.currentTestId, testData);
                if (updatedTest) {
                    auth.showNotification('تم تحديث الاختبار بنجاح', 'success');
                }
            } else {
                // إنشاء اختبار جديد
                const newTest = database.addTest(testData);
                if (newTest) {
                    auth.showNotification('تم إنشاء الاختبار بنجاح', 'success');
                    this.currentTestId = newTest.id;
                    this.showQuestionsModal();
                }
            }

            this.hideTestForm();
            this.loadTests();
            
        } catch (error) {
            auth.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving test:', error);
        }
    }

    validateTestData(data) {
        if (!data.title.trim()) {
            auth.showNotification('يرجى إدخال عنوان الاختبار', 'error');
            return false;
        }

        if (!data.grade) {
            auth.showNotification('يرجى اختيار الصف الدراسي', 'error');
            return false;
        }

        if (!data.subject) {
            auth.showNotification('يرجى اختيار المادة', 'error');
            return false;
        }

        return true;
    }

    showQuestionsModal() {
        if (!this.currentTestId) return;

        const test = database.findTestById(this.currentTestId);
        if (!test) return;

        this.currentQuestions = test.questions || [];
        document.getElementById('questionsModalTitle').textContent = `إدارة أسئلة الاختبار: ${test.title}`;
        this.displayQuestions();
        document.getElementById('questionsModal').classList.add('active');
    }

    hideQuestionsModal() {
        document.getElementById('questionsModal').classList.remove('active');
        this.currentQuestions = [];
    }

    displayQuestions() {
        const container = document.getElementById('questionsList');
        if (!container) return;
        
        if (this.currentQuestions.length === 0) {
            container.innerHTML = `
                <div class="no-questions">
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">❓</div>
                        <p>لا توجد أسئلة بعد</p>
                        <p>ابدأ بإضافة الأسئلة إلى الاختبار</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentQuestions.map((question, index) => `
            <div class="question-item" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-number">السؤال ${index + 1}</div>
                    <div class="question-actions">
                        <button class="btn btn-sm btn-outline" onclick="testsManager.editQuestion('${question.id}')">تعديل</button>
                        <button class="btn btn-sm btn-danger" onclick="testsManager.deleteQuestion('${question.id}')">حذف</button>
                    </div>
                </div>
                <div class="question-content">
                    <p class="question-text">${question.text}</p>
                    <div class="question-meta">
                        <span class="question-type">${this.getQuestionTypeName(question.type)}</span>
                        <span class="question-points">${question.points} نقطة</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showQuestionForm(questionId = null) {
        this.currentEditQuestionId = questionId;
        document.getElementById('questionFormTitle').textContent = 
            questionId ? 'تعديل السؤال' : 'إضافة سؤال جديد';
        
        document.getElementById('questionForm').reset();
        
        if (questionId) {
            const question = this.currentQuestions.find(q => q.id === questionId);
            if (question) {
                this.fillQuestionForm(question);
            }
        }
        
        document.getElementById('questionFormModal').classList.add('active');
    }

    hideQuestionForm() {
        document.getElementById('questionFormModal').classList.remove('active');
        this.currentEditQuestionId = null;
    }

    fillQuestionForm(question) {
        document.getElementById('questionType').value = question.type;
        document.getElementById('questionText').value = question.text;
        document.getElementById('questionPoints').value = question.points || 10;
        document.getElementById('questionObjective').value = question.objective || '';
        
        this.handleQuestionTypeChange();
        
        if (question.options) {
            const optionsList = document.getElementById('optionsList');
            optionsList.innerHTML = '';
            
            question.options.forEach((option, index) => {
                this.addOption(option.text, option.correct);
            });
        }
    }

    handleQuestionTypeChange() {
        const type = document.getElementById('questionType').value;
        const optionsDiv = document.getElementById('multipleChoiceOptions');
        
        if (type === 'multiple_choice' || type === 'multiple_answer') {
            optionsDiv.classList.remove('hidden');
        } else {
            optionsDiv.classList.add('hidden');
        }
    }

    addOption(text = '', correct = false) {
        const optionsList = document.getElementById('optionsList');
        const optionId = Utils.generateId();
        
        const optionHtml = `
            <div class="option-item" data-option-id="${optionId}">
                <input type="text" class="option-text" placeholder="نص الخيار" value="${text}">
                <label class="option-correct-label">
                    <input type="checkbox" class="option-correct" ${correct ? 'checked' : ''}>
                    إجابة صحيحة
                </label>
                <button type="button" class="btn btn-sm btn-danger" onclick="testsManager.removeOption('${optionId}')">حذف</button>
            </div>
        `;
        
        optionsList.insertAdjacentHTML('beforeend', optionHtml);
    }

    removeOption(optionId) {
        const optionElement = document.querySelector(`[data-option-id="${optionId}"]`);
        if (optionElement) {
            optionElement.remove();
        }
    }

    saveQuestion(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const questionData = {
            type: formData.get('type'),
            text: formData.get('text'),
            points: parseInt(formData.get('points')) || 10,
            objective: formData.get('objective')
        };

        // جمع خيارات الاختيار من متعدد
        if (questionData.type === 'multiple_choice' || questionData.type === 'multiple_answer') {
            questionData.options = this.collectOptions();
        }

        if (!this.validateQuestionData(questionData)) {
            return;
        }

        if (this.currentEditQuestionId) {
            // تحديث السؤال الموجود
            const index = this.currentQuestions.findIndex(q => q.id === this.currentEditQuestionId);
            if (index !== -1) {
                this.currentQuestions[index] = { ...this.currentQuestions[index], ...questionData };
            }
        } else {
            // إضافة سؤال جديد
            questionData.id = Utils.generateId();
            this.currentQuestions.push(questionData);
        }

        this.updateTestQuestions();
        this.hideQuestionForm();
        this.displayQuestions();
        auth.showNotification('تم حفظ السؤال بنجاح', 'success');
    }

    collectOptions() {
        const options = [];
        const optionElements = document.querySelectorAll('.option-item');
        
        optionElements.forEach(element => {
            const textInput = element.querySelector('.option-text');
            const correctInput = element.querySelector('.option-correct');
            
            if (textInput.value.trim()) {
                options.push({
                    text: textInput.value.trim(),
                    correct: correctInput.checked
                });
            }
        });
        
        return options;
    }

    validateQuestionData(data) {
        if (!data.text.trim()) {
            auth.showNotification('يرجى إدخال نص السؤال', 'error');
            return false;
        }

        if (data.type === 'multiple_choice' || data.type === 'multiple_answer') {
            if (!data.options || data.options.length < 2) {
                auth.showNotification('يرجى إضافة خيارين على الأقل', 'error');
                return false;
            }

            const correctOptions = data.options.filter(opt => opt.correct);
            if (correctOptions.length === 0) {
                auth.showNotification('يرجى تحديد إجابة صحيحة على الأقل', 'error');
                return false;
            }
        }

        return true;
    }

    editQuestion(questionId) {
        this.showQuestionForm(questionId);
    }

    deleteQuestion(questionId) {
        this.currentQuestions = this.currentQuestions.filter(q => q.id !== questionId);
        this.updateTestQuestions();
        this.displayQuestions();
        auth.showNotification('تم حذف السؤال', 'success');
    }

    updateTestQuestions() {
        if (!this.currentTestId) return;
        
        const test = database.findTestById(this.currentTestId);
        if (test) {
            test.questions = this.currentQuestions;
            database.saveTests(database.getTests());
        }
    }

    finalizeTest() {
        this.hideQuestionsModal();
        auth.showNotification('تم حفظ الاختبار بنجاح', 'success');
        this.loadTests();
    }

    editTest(testId) {
        const test = database.findTestById(testId);
        if (!test) return;

        this.currentTestId = testId;
        document.getElementById('testFormTitle').textContent = 'تعديل الاختبار';
        
        document.getElementById('testTitle').value = test.title;
        document.getElementById('testGrade').value = test.grade;
        document.getElementById('testSubject').value = test.subject;
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testDuration').value = test.duration || 30;
        document.getElementById('testPassingScore').value = test.passing_score || 60;

        document.getElementById('testFormModal').classList.add('active');
    }

    manageQuestions(testId) {
        this.currentTestId = testId;
        this.showQuestionsModal();
    }

    async deleteTest(testId) {
        const test = database.findTestById(testId);
        if (!test) return;

        const confirmed = await Utils.confirm(
            `هل أنت متأكد من حذف الاختبار "${test.title}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const success = database.deleteTest(testId);
            if (success) {
                auth.showNotification('تم حذف الاختبار بنجاح', 'success');
                this.loadTests();
            }
        }
    }

    assignTest(testId) {
        auth.showNotification('سيتم فتح نافذة تعيين الاختبار للطلاب', 'info');
    }

    filterTests() {
        const gradeFilter = document.getElementById('gradeFilter').value;
        const subjectFilter = document.getElementById('subjectFilter').value;
        
        let tests = database.getTests();
        
        if (gradeFilter) {
            tests = tests.filter(test => test.grade === gradeFilter);
        }
        
        if (subjectFilter) {
            tests = tests.filter(test => test.subject === subjectFilter);
        }
        
        this.displayTests(tests);
    }

    showTemplateLibrary() {
        auth.showNotification('سيتم فتح مكتبة نماذج الاختبارات', 'info');
    }

    getQuestionTypeName(type) {
        const types = {
            'multiple_choice': 'اختيار من متعدد',
            'multiple_answer': 'اختيار متعدد الإجابات',
            'essay': 'مقالي',
            'drag_drop': 'سحب وإفلات',
            'image_based': 'بالصورة',
            'video_based': 'بالفيديو',
            'audio_based': 'صوتي',
            'reading': 'قراءة'
        };
        return types[type] || type;
    }
}

const testsManager = new TestsManager();