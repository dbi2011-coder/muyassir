class ActivitiesManager {
    constructor() {
        this.currentActivityId = null;
        this.init();
    }

    init() {
        if (!auth.protectPage('teacher')) return;
        this.loadActivities();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', () => auth.logout());
    }

    loadActivities() {
        const activities = database.getActivities();
        this.displayActivities(activities);
    }

    displayActivities(activities) {
        const container = document.getElementById('activitiesContainer');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🎯</div>
                        <h3 style="color: #666; margin-bottom: 1rem;">لا توجد أنشطة بعد</h3>
                        <p style="color: #888; margin-bottom: 2rem;">ابدأ بإضافة أول نشاط مدرسي</p>
                        <button class="btn btn-primary" onclick="activitiesManager.showActivityForm()">
                            إضافة أول نشاط
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => this.createActivityCard(activity)).join('');
    }

    createActivityCard(activity) {
        const students = database.getStudents();
        const participants = students.filter(s => activity.participants.includes(s.id));
        const typeName = this.getActivityTypeName(activity.type);

        return `
            <div class="activity-card" data-activity-id="${activity.id}">
                <div class="activity-header">
                    <div class="activity-info">
                        <h3>${activity.title}</h3>
                        <div class="activity-meta">
                            <span class="activity-type">${typeName}</span> • 
                            <span class="activity-date">📅 ${Utils.formatDate(activity.date)}</span>
                        </div>
                    </div>
                    <div class="activity-actions">
                        <button class="btn btn-sm btn-outline" onclick="activitiesManager.editActivity(${activity.id})" title="تعديل">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="activitiesManager.viewActivity(${activity.id})" title="عرض">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="activitiesManager.deleteActivity(${activity.id})" title="حذف">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="activity-content">
                    <p class="activity-description">${activity.description || 'لا يوجد وصف'}</p>
                    
                    <div class="activity-details">
                        <div class="activity-detail">
                            <span class="detail-label">عدد المشاركين:</span>
                            <span class="detail-value">${participants.length} طالب</span>
                        </div>
                        <div class="activity-detail">
                            <span class="detail-label">المرفقات:</span>
                            <span class="detail-value">${activity.attachments?.length || 0} ملف</span>
                        </div>
                    </div>
                    
                    ${participants.length > 0 ? `
                        <div class="participants-list">
                            <strong>المشاركون:</strong>
                            <div class="students-tags">
                                ${participants.slice(0, 3).map(student => `
                                    <span class="student-tag">${student.name}</span>
                                `).join('')}
                                ${participants.length > 3 ? `
                                    <span class="student-tag more">+${participants.length - 3} أكثر</span>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getActivityTypeName(type) {
        const types = {
            'academic': 'أكاديمي',
            'sports': 'رياضي',
            'cultural': 'ثقافي',
            'social': 'اجتماعي'
        };
        return types[type] || type;
    }

    showActivityForm() {
        this.currentActivityId = null;
        document.getElementById('activityFormTitle').textContent = 'إضافة نشاط جديد';
        document.getElementById('activityForm').reset();
        
        // تعيين التاريخ الافتراضي (اليوم)
        document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
        
        this.loadStudentsList();
        document.getElementById('activityFormModal').classList.add('active');
    }

    hideActivityForm() {
        document.getElementById('activityFormModal').classList.remove('active');
        this.currentActivityId = null;
    }

    loadStudentsList() {
        const students = database.getStudents();
        const container = document.getElementById('participantsList');
        
        container.innerHTML = students.map(student => `
            <div class="student-checkbox">
                <label>
                    <input type="checkbox" name="participants" value="${student.id}">
                    <span class="checkmark"></span>
                    ${student.name} - ${Utils.getGradeName(student.grade)}
                </label>
            </div>
        `).join('');
    }

    async saveActivity(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const participants = Array.from(document.querySelectorAll('input[name="participants"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const activityData = {
            title: formData.get('title'),
            type: formData.get('type'),
            date: new Date(formData.get('date')).toISOString(),
            description: formData.get('description'),
            participants: participants,
            attachments: [] // سيتم إضافة المرفقات لاحقاً
        };

        if (!this.validateActivityData(activityData)) {
            return;
        }

        try {
            if (this.currentActivityId) {
                // تحديث النشاط الموجود
                const updated = database.updateActivity(this.currentActivityId, activityData);
                if (updated) {
                    auth.showNotification('تم تحديث النشاط بنجاح', 'success');
                }
            } else {
                // إنشاء نشاط جديد
                database.addActivity(activityData);
                auth.showNotification('تم إضافة النشاط بنجاح', 'success');
            }

            this.hideActivityForm();
            this.loadActivities();
            
        } catch (error) {
            auth.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving activity:', error);
        }
    }

    validateActivityData(data) {
        if (!data.title.trim()) {
            auth.showNotification('يرجى إدخال عنوان النشاط', 'error');
            return false;
        }

        if (!data.type) {
            auth.showNotification('يرجى اختيار نوع النشاط', 'error');
            return false;
        }

        if (!data.date) {
            auth.showNotification('يرجى تحديد تاريخ النشاط', 'error');
            return false;
        }

        return true;
    }

    editActivity(activityId) {
        const activity = database.getActivities().find(a => a.id === activityId);
        if (!activity) return;

        this.currentActivityId = activityId;
        document.getElementById('activityFormTitle').textContent = 'تعديل النشاط';
        
        document.getElementById('activityTitle').value = activity.title;
        document.getElementById('activityType').value = activity.type;
        document.getElementById('activityDate').value = activity.date.split('T')[0];
        document.getElementById('activityDescription').value = activity.description || '';
        
        // تحديد المشاركين
        const checkboxes = document.querySelectorAll('input[name="participants"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = activity.participants.includes(parseInt(checkbox.value));
        });

        document.getElementById('activityFormModal').classList.add('active');
    }

    async deleteActivity(activityId) {
        const activity = database.getActivities().find(a => a.id === activityId);
        if (!activity) return;

        const confirmed = await Utils.confirm(
            `هل أنت متأكد من حذف النشاط "${activity.title}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const activities = database.getActivities().filter(a => a.id !== activityId);
            database.saveActivities(activities);
            auth.showNotification('تم حذف النشاط بنجاح', 'success');
            this.loadActivities();
        }
    }

    viewActivity(activityId) {
        auth.showNotification('سيتم فتح صفحة تفاصيل النشاط', 'info');
    }

    uploadCertificate(activityId) {
        auth.showNotification('سيتم فتح نافذة رفع الشهادات', 'info');
    }

    generateReport(activityId) {
        auth.showNotification('جاري إنشاء تقرير النشاط...', 'info');
        setTimeout(() => {
            auth.showNotification('تم إنشاء التقرير بنجاح', 'success');
        }, 2000);
    }
}

const activitiesManager = new ActivitiesManager();