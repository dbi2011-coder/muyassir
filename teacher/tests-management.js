// إدارة الاختبارات التشخيصية
class TestsManager {
    constructor() {
        this.database = database;
        this.auth = auth;
        this.currentTestId = null;
        this.currentQuestions = [];
        this.currentEditQuestionId = null;
        this.init();
    }

    init() {
        if (!this.auth.protectPage('teacher')) {
            return;
        }

        this.loadTests();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // تسجيل الخروج
        document.querySelector('.logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });
    }

    loadTests() {
        const tests = this.database.getTests();
        this.displayTests(tests);
    }

    displayTests(tests) {
        const container = document.getElementById('testsContainer');
        
        if (tests.length === 0) {
            container.innerHTML = `
                <div class="no-tests">
                    <div class="no-tests-icon">📝</div>
                    <h3>لا توجد اختبارات بعد</h3>
                    <p>ابدأ بإنشاء أول اختبار تشخيصي للطلاب</p>
                    <button class="btn btn-primary" onclick="testsManager.showTestForm()">
                        إنشاء أول اختبار
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = tests.map(test => this.createTestCard(test)).join('');
    }

    createTestCard(test) {
        const questionCount = test.questions ? test.questions.length : 0;
        const gradeName = this.getGradeName(test.grade);
        const subjectName = this.getSubjectName(test.subject);

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
                            <span class="detail-value">${test.passingScore || 60}%</span>
                        </div>
                        <div class="test-detail">
                            <span class="detail-label">تاريخ الإنشاء:</span>
                            <span class="detail-value">${Utils.formatDate(test.created_at)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="test-footer">
                    <div class="test-status">
                        <span class="status-badge status-active">نشط</span>
                    </div>
                    <div class="test-stats">
                        <span class="stat">👥 5 طلاب</span>
                        <span class="stat">📊 75% متوسط</span>
                    </div>
                </div>
            </div>
        `;
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

    async saveTest(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const testData = {
            title: formData.get('title'),
            grade: formData.get('grade'),
            subject: formData.get('subject'),
            description: formData.get('description'),
            duration: parseInt(formData.get('duration')) || 30,
            passingScore: parseInt(formData.get('passingScore')) || 60,
            teacher_id: this.auth.getCurrentUser().id,
            questions: []
        };

        if (!this.validateTestData(testData)) {
            return;
        }

        try {
            if (this.currentTestId) {
                // تحديث الاختبار الموجود
                const updatedTest = this.database.updateTest(this.currentTestId, testData);
                if (updatedTest) {
                    Utils.showNotification('تم تحديث الاختبار بنجاح', 'success');
                }
            } else {
                // إنشاء اختبار جديد
                const newTest = this.database.addTest(testData);
                if (newTest) {
                    Utils.showNotification('تم إنشاء الاختبار بنجاح', 'success');
                    this.currentTestId = newTest.id;
                    this.showQuestionsModal();
                }
            }

            this.hideTestForm();
            this.loadTests();
            
        } catch (error) {
            Utils.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving test:', error);
        }
    }

    validateTestData(data) {
        if (!data.title.trim()) {
            Utils.showNotification('يرجى إدخال عنوان الاختبار', 'error');
            return false;
        }

        if (!data.grade) {
            Utils.showNotification('يرجى اختيار الصف الدراسي', 'error');
            return false;
        }

        if (!data.subject) {
            Utils.showNotification('يرجى اختيار المادة', 'error');
            return false;
        }

        return true;
    }

    showQuestionsModal() {
        if (!this.currentTestId) return;

        const test = this.database.findTestById(this.currentTestId);
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
        
        if (this.currentQuestions.length === 0) {
            container.innerHTML = `
                <div class="no-questions">
                    <p>لا توجد أسئلة بعد</p>
                    <p>ابدأ بإضافة الأسئلة إلى الاختبار</p>
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
            // تعبئة خيارات الاختيار من متعدد
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
        Utils.showNotification('تم حفظ السؤال بنجاح', 'success');
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
            Utils.showNotification('يرجى إدخال نص السؤال', 'error');
            return false;
        }

        if (data.type === 'multiple_choice' || data.type === 'multiple_answer') {
            if (!data.options || data.options.length < 2) {
                Utils.showNotification('يرجى إضافة خيارين على الأقل', 'error');
                return false;
            }

            const correctOptions = data.options.filter(opt => opt.correct);
            if (correctOptions.length === 0) {
                Utils.showNotification('يرجى تحديد إجابة صحيحة على الأقل', 'error');
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
        Utils.showNotification('تم حذف السؤال', 'success');
    }

    updateTestQuestions() {
        if (!this.currentTestId) return;
        
        const test = this.database.findTestById(this.currentTestId);
        if (test) {
            test.questions = this.currentQuestions;
            this.database.saveTests(this.database.getTests());
        }
    }

    finalizeTest() {
        this.hideQuestionsModal();
        Utils.showNotification('تم حفظ الاختبار بنجاح', 'success');
        this.loadTests();
    }

    editTest(testId) {
        const test = this.database.findTestById(testId);
        if (!test) return;

        this.currentTestId = testId;
        document.getElementById('testFormTitle').textContent = 'تعديل الاختبار';
        
        document.getElementById('testTitle').value = test.title;
        document.getElementById('testGrade').value = test.grade;
        document.getElementById('testSubject').value = test.subject;
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testDuration').value = test.duration || 30;
        document.getElementById('testPassingScore').value = test.passingScore || 60;

        document.getElementById('testFormModal').classList.add('active');
    }

    manageQuestions(testId) {
        this.currentTestId = testId;
        this.showQuestionsModal();
    }

    async deleteTest(testId) {
        const test = this.database.findTestById(testId);
        if (!test) return;

        const confirmed = await Utils.showConfirmation(
            `هل أنت متأكد من حذف الاختبار "${test.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const tests = this.database.getTests().filter(t => t.id !== testId);
            this.database.saveTests(tests);
            Utils.showNotification('تم حذف الاختبار بنجاح', 'success');
            this.loadTests();
        }
    }

    assignTest(testId) {
        Utils.showNotification('سيتم فتح نافذة تعيين الاختبار للطلاب', 'info');
        // في التطبيق الحقيقي، سيتم فتح نافذة لاختيار الطلاب
    }

    filterTests() {
        const gradeFilter = document.getElementById('gradeFilter').value;
        const subjectFilter = document.getElementById('subjectFilter').value;
        
        let tests = this.database.getTests();
        
        if (gradeFilter) {
            tests = tests.filter(test => test.grade === gradeFilter);
        }
        
        if (subjectFilter) {
            tests = tests.filter(test => test.subject === subjectFilter);
        }
        
        this.displayTests(tests);
    }

    showTemplateLibrary() {
        Utils.showNotification('سيتم فتح مكتبة نماذج الاختبارات', 'info');
        // في التطبيق الحقيقي، سيتم فتح مكتبة النماذج
    }

    getGradeName(grade) {
        const grades = {
            'first': 'الصف الأول',
            'second': 'الصف الثاني',
            'third': 'الصف الثالث',
            'fourth': 'الصف الرابع',
            'fifth': 'الصف الخامس',
            'sixth': 'الصف السادس'
        };
        return grades[grade] || grade;
    }

    getSubjectName(subject) {
        const subjects = {
            'reading': 'القراءة',
            'writing': 'الكتابة',
            'math': 'الرياضيات',
            'skills': 'المهارات'
        };
        return subjects[subject] || subject;
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

// إنشاء نسخة من مدير الاختبارات
const testsManager = new TestsManager();