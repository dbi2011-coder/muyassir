// لوحة تحكم لجنة صعوبات التعلم
class CommitteeDashboard {
    constructor() {
        this.database = database;
        this.auth = auth;
        this.init();
    }

    init() {
        if (!this.auth.protectPage('committee')) {
            return;
        }

        this.loadDashboardData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });
    }

    loadDashboardData() {
        this.loadStatistics();
        this.loadStudentsNeedAttention();
        this.loadRecentActivities();
    }

    loadStatistics() {
        const students = this.database.getStudents();
        const tests = this.database.getTests();
        const lessons = this.database.getLessons();

        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('totalTests').textContent = tests.length;
        document.getElementById('totalLessons').textContent = lessons.length;
        
        // حساب المهارات المتقنة (بيانات تجريبية)
        const masteredSkills = students.reduce((total, student) => {
            return total + (student.mastered_skills || 0);
        }, 0);
        document.getElementById('masteredSkills').textContent = masteredSkills;
    }

    loadStudentsNeedAttention() {
        const students = this.database.getStudents();
        const container = document.getElementById('studentsNeedAttention');
        
        // طلاب بحاجة لمتابعة (بيانات تجريبية)
        const studentsNeedingAttention = students.slice(0, 3).map(student => ({
            ...student,
            issue: this.getRandomIssue(),
            priority: this.getRandomPriority()
        }));

        container.innerHTML = studentsNeedingAttention.map(student => `
            <div class="student-attention-card ${student.priority}">
                <div class="student-avatar">👨‍🎓</div>
                <div class="student-details">
                    <h4>${student.name}</h4>
                    <p>${student.issue}</p>
                    <small>الصف: ${this.getGradeName(student.grade)}</small>
                </div>
            </div>
        `).join('');

        if (studentsNeedingAttention.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد طلاب بحاجة لمتابعة حالياً</p>';
        }
    }

    loadRecentActivities() {
        const activities = this.getRecentActivities();
        const container = document.getElementById('activitiesTimeline');
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <div class="activity-meta">
                        <span>${activity.type}</span>
                        <span>${Utils.formatDate(activity.date)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        if (activities.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد نشاطات حديثة</p>';
        }
    }

    getRecentActivities() {
        // بيانات تجريبية للنشاطات
        return [
            {
                description: 'تم تسجيل طالب جديد: أحمد محمد في الصف الثاني',
                type: 'تسجيل طالب',
                date: new Date().toISOString()
            },
            {
                description: 'أكمل الطالب محمد أحمد اختبار القراءة بنسبة 85%',
                type: 'انتهاء اختبار',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                description: 'تم إنشاء درس جديد في مهارة الكتابة',
                type: 'إنشاء درس',
                date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                description: 'احتياج لمتابعة: الطالب فاطمة علي في مهارة القراءة',
                type: 'تنبيه',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    getRandomIssue() {
        const issues = [
            'انخفاض في أداء القراءة',
            'حاجة لدعم في مهارة الكتابة',
            'تباطؤ في إتمام المهام',
            'حاجة لتركيز في الدروس',
            'تحسن ملحوظ يحتاج متابعة'
        ];
        return issues[Math.floor(Math.random() * issues.length)];
    }

    getRandomPriority() {
        const priorities = ['warning', 'danger'];
        return priorities[Math.floor(Math.random() * priorities.length)];
    }

    getGradeName(grade) {
        const grades = {
            'first': 'الأول',
            'second': 'الثاني', 
            'third': 'الثالث',
            'fourth': 'الرابع',
            'fifth': 'الخامس',
            'sixth': 'السادس'
        };
        return grades[grade] || grade;
    }

    generateGeneralReport() {
        Utils.showNotification('جاري إنشاء التقرير العام...', 'info');
        // في التطبيق الحقيقي، سيتم إنشاء وتحميل التقرير
        setTimeout(() => {
            Utils.showNotification('تم إنشاء التقرير العام بنجاح', 'success');
        }, 2000);
    }

    generateSkillsReport() {
        Utils.showNotification('جاري إنشاء تقرير المهارات...', 'info');
        setTimeout(() => {
            Utils.showNotification('تم إنشاء تقرير المهارات بنجاح', 'success');
        }, 2000);
    }

    generateProgressReport() {
        Utils.showNotification('جاري إنشاء تقرير التقدم...', 'info');
        setTimeout(() => {
            Utils.showNotification('تم إنشاء تقرير التقدم بنجاح', 'success');
        }, 2000);
    }
}

// إنشاء نسخة من لوحة تحكم اللجنة
const committeeDashboard = new CommitteeDashboard();