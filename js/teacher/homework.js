class HomeworkManager {
    constructor() {
        this.currentHomeworkId = null;
        this.init();
    }

    init() {
        if (!auth.protectPage('teacher')) return;
        this.loadHomework();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', () => auth.logout());
        
        // الفلاتر
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filterHomework());
    }

    loadHomework() {
        const homework = database.getHomework();
        this.displayHomework(homework);
    }

    displayHomework(homework) {
        const container = document.getElementById('homeworkContainer');
        if (!container) return;

        if (homework.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                        <h3 style="color: #666; margin-bottom: 1rem;">لا توجد واجبات بعد</h3>
                        <p style="color: #888; margin-bottom: 2rem;">ابدأ بإنشاء أول واجب للطلاب</p>
                        <button class="btn btn-primary" onclick="homeworkManager.showHomeworkForm()">
                            إنشاء أول واجب
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = homework.map(hw => this.createHomeworkCard(hw)).join('');
    }

    createHomeworkCard(hw) {
        const students = database.getStudents();
        const assignedStudents = students.filter(s => hw.assigned_to.includes(s.id));
        const dueDate = new Date(hw.due_date);
        const now = new Date();
        const timeLeft = dueDate - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

        let timeLeftText = '';
        let timeLeftClass = '';
        
        if (daysLeft < 0) {
            timeLeftText = 'منتهي';
            timeLeftClass = 'time-overdue';
        } else if (daysLeft === 0) {
            timeLeftText = 'ينتهي اليوم';
            timeLeftClass = 'time-urgent';
        } else if (daysLeft === 1) {
            timeLeftText = 'يوم واحد';
            timeLeftClass = 'time-urgent';
        } else {
            timeLeftText = `${daysLeft} أيام`;
            timeLeftClass = daysLeft <= 3 ? 'time-warning' : 'time-normal';
        }

        return `
            <div class="homework-card" data-homework-id="${hw.id}">
                <div class="homework-header">
                    <div class="homework-info">
                        <h3>${hw.title}</h3>
                        <div class="homework-meta">
                            <span class="assigned-students">👨‍🎓 ${assignedStudents.length} طالب</span>
                            <span class="due-date">⏰ ${Utils.formatDate(hw.due_date)}</span>
                        </div>
                    </div>
                    <div class="homework-actions">
                        <span class="time-left ${timeLeftClass}">${timeLeftText}</span>
                        <button class="btn btn-sm btn-outline" onclick="homeworkManager.editHomework(${hw.id})" title="تعديل">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="homeworkManager.viewSubmissions(${hw.id})" title="التسليمات">
                            📨
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="homeworkManager.deleteHomework(${hw.id})" title="حذف">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="homework-content">
                    <p class="homework-description">${hw.description || 'لا يوجد وصف'}</p>
                    
                    <div class="homework-details">
                        <div class="homework-detail">
                            <span class="detail-label">الحالة:</span>
                            <span class="detail-value">
                                <span class="status-badge status-${hw.status}">${this.getStatusText(hw.status)}</span>
                            </span>
                        </div>
                        <div class="homework-detail">
                            <span class="detail-label">تاريخ الإنشاء:</span>
                            <span class="detail-value">${Utils.formatDate(hw.created_at)}</span>
                        </div>
                    </div>
                    
                    <div class="assigned-students-list">
                        <strong>الطلاب المعينون:</strong>
                        <div class="students-tags">
                            ${assignedStudents.map(student => `
                                <span class="student-tag">${student.name}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statuses = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'cancelled': 'ملغى'
        };
        return statuses[status] || status;
    }

    showHomeworkForm() {
        this.currentHomeworkId = null;
        document.getElementById('homeworkFormTitle').textContent = 'إنشاء واجب جديد';
        document.getElementById('homeworkForm').reset();
        
        // تعيين التاريخ الافتراضي (بعد 3 أيام)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        document.getElementById('dueDate').value = defaultDate.toISOString().split('T')[0];
        
        this.loadStudentsList();
        document.getElementById('homeworkFormModal').classList.add('active');
    }

    hideHomeworkForm() {
        document.getElementById('homeworkFormModal').classList.remove('active');
        this.currentHomeworkId = null;
    }

    loadStudentsList() {
        const students = database.getStudents();
        const container = document.getElementById('studentsList');
        
        container.innerHTML = students.map(student => `
            <div class="student-checkbox">
                <label>
                    <input type="checkbox" name="assignedStudents" value="${student.id}">
                    <span class="checkmark"></span>
                    ${student.name} - ${Utils.getGradeName(student.grade)}
                </label>
            </div>
        `).join('');
    }

    async saveHomework(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const assignedStudents = Array.from(document.querySelectorAll('input[name="assignedStudents"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const homeworkData = {
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: new Date(formData.get('dueDate')).toISOString(),
            assigned_to: assignedStudents
        };

        if (!this.validateHomeworkData(homeworkData)) {
            return;
        }

        try {
            if (this.currentHomeworkId) {
                // تحديث الواجب الموجود
                const updated = database.updateHomework(this.currentHomeworkId, homeworkData);
                if (updated) {
                    auth.showNotification('تم تحديث الواجب بنجاح', 'success');
                }
            } else {
                // إنشاء واجب جديد
                database.addHomework(homeworkData);
                auth.showNotification('تم إنشاء الواجب بنجاح', 'success');
            }

            this.hideHomeworkForm();
            this.loadHomework();
            
        } catch (error) {
            auth.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving homework:', error);
        }
    }

    validateHomeworkData(data) {
        if (!data.title.trim()) {
            auth.showNotification('يرجى إدخال عنوان الواجب', 'error');
            return false;
        }

        if (!data.due_date) {
            auth.showNotification('يرجى تحديد تاريخ التسليم', 'error');
            return false;
        }

        if (data.assigned_to.length === 0) {
            auth.showNotification('يرجى اختيار طالب واحد على الأقل', 'error');
            return false;
        }

        const dueDate = new Date(data.due_date);
        const today = new Date();
        if (dueDate < today) {
            auth.showNotification('تاريخ التسليم يجب أن يكون في المستقبل', 'error');
            return false;
        }

        return true;
    }

    editHomework(homeworkId) {
        const homework = database.getHomework().find(hw => hw.id === homeworkId);
        if (!homework) return;

        this.currentHomeworkId = homeworkId;
        document.getElementById('homeworkFormTitle').textContent = 'تعديل الواجب';
        
        document.getElementById('homeworkTitle').value = homework.title;
        document.getElementById('homeworkDescription').value = homework.description || '';
        document.getElementById('dueDate').value = homework.due_date.split('T')[0];
        
        // تحديد الطلاب المعينين
        const checkboxes = document.querySelectorAll('input[name="assignedStudents"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = homework.assigned_to.includes(parseInt(checkbox.value));
        });

        document.getElementById('homeworkFormModal').classList.add('active');
    }

    async deleteHomework(homeworkId) {
        const homework = database.getHomework().find(hw => hw.id === homeworkId);
        if (!homework) return;

        const confirmed = await Utils.confirm(
            `هل أنت متأكد من حذف الواجب "${homework.title}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const homeworkList = database.getHomework().filter(hw => hw.id !== homeworkId);
            database.saveHomework(homeworkList);
            auth.showNotification('تم حذف الواجب بنجاح', 'success');
            this.loadHomework();
        }
    }

    viewSubmissions(homeworkId) {
        auth.showNotification('سيتم فتح صفحة تسليمات الطلاب', 'info');
    }

    filterHomework() {
        const statusFilter = document.getElementById('statusFilter').value;
        let homework = database.getHomework();
        
        if (statusFilter) {
            homework = homework.filter(hw => hw.status === statusFilter);
        }
        
        this.displayHomework(homework);
    }

    extendDeadline(homeworkId) {
        auth.showNotification('سيتم فتح نافذة تمديد الوقت', 'info');
    }

    sendReminder(homeworkId) {
        auth.showNotification('تم إرسال تذكير للطلاب', 'success');
    }
}

const homeworkManager = new HomeworkManager();