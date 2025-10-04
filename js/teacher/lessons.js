class LessonsManager {
    constructor() {
        this.currentLessonId = null;
        this.init();
    }

    init() {
        if (!auth.protectPage('teacher')) return;
        this.loadLessons();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', () => auth.logout());
        
        // الفلاتر
        document.getElementById('gradeFilter')?.addEventListener('change', () => this.filterLessons());
        document.getElementById('typeFilter')?.addEventListener('change', () => this.filterLessons());
    }

    loadLessons() {
        const lessons = database.getLessons();
        this.displayLessons(lessons);
    }

    displayLessons(lessons) {
        const container = document.getElementById('lessonsContainer');
        if (!container) return;

        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📚</div>
                        <h3 style="color: #666; margin-bottom: 1rem;">لا توجد دروس بعد</h3>
                        <p style="color: #888; margin-bottom: 2rem;">ابدأ بإنشاء أول درس تفاعلي للطلاب</p>
                        <button class="btn btn-primary" onclick="lessonsManager.showLessonForm()">
                            إنشاء أول درس
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = lessons.map(lesson => this.createLessonCard(lesson)).join('');
    }

    createLessonCard(lesson) {
        const gradeName = Utils.getGradeName(lesson.grade);
        const typeName = this.getLessonTypeName(lesson.type);
        const strategyName = this.getStrategyName(lesson.strategy);

        return `
            <div class="lesson-card" data-lesson-id="${lesson.id}">
                <div class="lesson-header">
                    <div class="lesson-info">
                        <h3>${lesson.title}</h3>
                        <div class="lesson-meta">
                            <span class="lesson-grade">${gradeName}</span> • 
                            <span class="lesson-type">${typeName}</span> • 
                            <span class="lesson-strategy">${strategyName}</span>
                        </div>
                    </div>
                    <div class="lesson-actions">
                        <button class="btn btn-sm btn-outline" onclick="lessonsManager.editLesson(${lesson.id})" title="تعديل">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="lessonsManager.previewLesson(${lesson.id})" title="معاينة">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="lessonsManager.assignLesson(${lesson.id})" title="تعيين">
                            👨‍🎓
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="lessonsManager.deleteLesson(${lesson.id})" title="حذف">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="lesson-content">
                    <p class="lesson-description">${lesson.description || 'لا يوجد وصف'}</p>
                    
                    <div class="lesson-details">
                        <div class="lesson-detail">
                            <span class="detail-label">نسبة الإتقان المطلوبة:</span>
                            <span class="detail-value">${lesson.target_percentage || 80}%</span>
                        </div>
                        <div class="lesson-detail">
                            <span class="detail-label">نوع المحتوى:</span>
                            <span class="detail-value">${this.getContentTypeName(lesson.content?.type)}</span>
                        </div>
                        <div class="lesson-detail">
                            <span class="detail-label">تاريخ الإنشاء:</span>
                            <span class="detail-value">${Utils.formatDate(lesson.created_at)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="lesson-footer">
                    <div class="lesson-status">
                        <span class="status-badge status-active">${lesson.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                    </div>
                    <div class="lesson-stats">
                        <span class="stat">🎯 ${this.getAssignedStudentsCount(lesson)} طلاب</span>
                        <span class="stat">⭐ ${this.getMasteryRate(lesson)}% إتقان</span>
                    </div>
                </div>
            </div>
        `;
    }

    getAssignedStudentsCount(lesson) {
        // محاكاة لعدد الطلاب المعينين
        return Math.floor(Math.random() * 8) + 1;
    }

    getMasteryRate(lesson) {
        // محاكاة لنسبة الإتقان
        return Math.floor(Math.random() * 30) + 70;
    }

    showLessonForm() {
        this.currentLessonId = null;
        document.getElementById('lessonFormTitle').textContent = 'إنشاء درس جديد';
        document.getElementById('lessonForm').reset();
        document.getElementById('lessonFormModal').classList.add('active');
    }

    hideLessonForm() {
        document.getElementById('lessonFormModal').classList.remove('active');
        this.currentLessonId = null;
    }

    async saveLesson(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const lessonData = {
            title: formData.get('title'),
            grade: formData.get('grade'),
            type: formData.get('type'),
            strategy: formData.get('strategy'),
            description: formData.get('description'),
            objectives: formData.get('objectives'),
            target_percentage: parseInt(formData.get('targetPercentage')) || 80,
            lesson_type: formData.get('lessonType'),
            content: {
                type: formData.get('contentType'),
                materials: [],
                exercises: []
            }
        };

        if (!this.validateLessonData(lessonData)) {
            return;
        }

        try {
            if (this.currentLessonId) {
                // تحديث الدرس الموجود
                const updatedLesson = database.updateLesson(this.currentLessonId, lessonData);
                if (updatedLesson) {
                    auth.showNotification('تم تحديث الدرس بنجاح', 'success');
                }
            } else {
                // إنشاء درس جديد
                const newLesson = database.addLesson(lessonData);
                if (newLesson) {
                    auth.showNotification('تم إنشاء الدرس بنجاح', 'success');
                }
            }

            this.hideLessonForm();
            this.loadLessons();
            
        } catch (error) {
            auth.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving lesson:', error);
        }
    }

    validateLessonData(data) {
        if (!data.title.trim()) {
            auth.showNotification('يرجى إدخال عنوان الدرس', 'error');
            return false;
        }

        if (!data.grade) {
            auth.showNotification('يرجى اختيار الصف الدراسي', 'error');
            return false;
        }

        if (!data.type) {
            auth.showNotification('يرجى اختيار نوع الدرس', 'error');
            return false;
        }

        if (!data.strategy) {
            auth.showNotification('يرجى اختيار الاستراتيجية', 'error');
            return false;
        }

        return true;
    }

    editLesson(lessonId) {
        const lesson = database.findLessonById(lessonId);
        if (!lesson) return;

        this.currentLessonId = lessonId;
        document.getElementById('lessonFormTitle').textContent = 'تعديل الدرس';
        
        document.getElementById('lessonTitle').value = lesson.title;
        document.getElementById('lessonGrade').value = lesson.grade;
        document.getElementById('lessonType').value = lesson.type;
        document.getElementById('lessonStrategy').value = lesson.strategy;
        document.getElementById('lessonDescription').value = lesson.description || '';
        document.getElementById('lessonObjectives').value = lesson.objectives || '';
        document.getElementById('targetPercentage').value = lesson.target_percentage || 80;
        document.getElementById('lessonTypeSelect').value = lesson.lesson_type || 'teaching_goal';
        document.getElementById('contentType').value = lesson.content?.type || 'interactive';

        document.getElementById('lessonFormModal').classList.add('active');
    }

    async deleteLesson(lessonId) {
        const lesson = database.findLessonById(lessonId);
        if (!lesson) return;

        const confirmed = await Utils.confirm(
            `هل أنت متأكد من حذف الدرس "${lesson.title}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const success = database.deleteLesson(lessonId);
            if (success) {
                auth.showNotification('تم حذف الدرس بنجاح', 'success');
                this.loadLessons();
            }
        }
    }

    previewLesson(lessonId) {
        auth.showNotification('سيتم فتح معاينة الدرس', 'info');
    }

    assignLesson(lessonId) {
        auth.showNotification('سيتم فتح نافذة تعيين الدرس للطلاب', 'info');
    }

    filterLessons() {
        const gradeFilter = document.getElementById('gradeFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        
        let lessons = database.getLessons();
        
        if (gradeFilter) {
            lessons = lessons.filter(lesson => lesson.grade === gradeFilter);
        }
        
        if (typeFilter) {
            lessons = lessons.filter(lesson => lesson.type === typeFilter);
        }
        
        this.displayLessons(lessons);
    }

    showStrategyLibrary() {
        auth.showNotification('سيتم فتح مكتبة الاستراتيجيات', 'info');
    }

    getLessonTypeName(type) {
        const types = {
            'reading': 'قراءة',
            'writing': 'كتابة',
            'math': 'رياضيات',
            'skills': 'مهارات'
        };
        return types[type] || type;
    }

    getStrategyName(strategy) {
        const strategies = {
            'game_based': 'التعلم باللعب',
            'visual': 'التعلم البصري',
            'kinesthetic': 'التعلم الحركي',
            'cooperative': 'التعلم التعاوني'
        };
        return strategies[strategy] || strategy;
    }

    getContentTypeName(type) {
        const types = {
            'interactive': 'تفاعلي',
            'video': 'فيديو',
            'audio': 'صوتي',
            'text': 'نصي'
        };
        return types[type] || type;
    }
}

const lessonsManager = new LessonsManager();