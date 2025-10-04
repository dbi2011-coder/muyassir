class StudentDashboard {
    constructor() {
        this.studentId = JSON.parse(localStorage.getItem('currentStudent'))?.id;
        this.init();
    }

    init() {
        if (!this.studentId) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadStudentData();
        this.loadQuickStats();
        this.loadUpcomingLessons();
        this.loadRecentActivity();
    }

    bindEvents() {
        // أحداث التنقل السريع
        document.getElementById('startTestBtn')?.addEventListener('click', () => this.startTest());
        document.getElementById('viewLessonsBtn')?.addEventListener('click', () => this.viewLessons());
        document.getElementById('practiceHandwritingBtn')?.addEventListener('click', () => this.practiceHandwriting());
        
        // أحداث الإشعارات
        this.setupNotifications();
    }

    loadStudentData() {
        const student = JSON.parse(localStorage.getItem('currentStudent'));
        if (!student) return;

        // تحديث معلومات الطالب في الواجهة
        const studentNameEl = document.getElementById('studentName');
        const studentGradeEl = document.getElementById('studentGrade');
        const studentAvatarEl = document.getElementById('studentAvatar');

        if (studentNameEl) studentNameEl.textContent = student.name;
        if (studentGradeEl) studentGradeEl.textContent = `الصف ${student.grade}`;
        if (studentAvatarEl) studentAvatarEl.textContent = student.name.charAt(0);
    }

    loadQuickStats() {
        const container = document.getElementById('quickStats');
        if (!container) return;

        const stats = this.calculateQuickStats();
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📚</div>
                <div class="stat-info">
                    <h3>${stats.completedLessons}</h3>
                    <p>الدروس المكتملة</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                    <h3>${stats.averageScore}%</h3>
                    <p>متوسط الدرجات</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-info">
                    <h3>${stats.points}</h3>
                    <p>نقاط التعزيز</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-info">
                    <h3>${stats.progress}%</h3>
                    <p>التقدم العام</p>
                </div>
            </div>
        `;
    }

    calculateQuickStats() {
        const progress = JSON.parse(localStorage.getItem(`student_progress_${this.studentId}`)) || {};
        const testResults = JSON.parse(localStorage.getItem(`student_tests_${this.studentId}`)) || [];
        const points = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];

        const completedLessons = Object.values(progress).filter(p => p >= 80).length;
        const averageScore = testResults.length > 0 ? 
            Math.round(testResults.reduce((sum, test) => sum + (test.score || 0), 0) / testResults.length) : 0;
        const totalPoints = points.reduce((sum, record) => sum + (record.points || 0), 0);
        const overallProgress = Object.values(progress).length > 0 ? 
            Math.round(Object.values(progress).reduce((sum, p) => sum + p, 0) / Object.values(progress).length) : 0;

        return {
            completedLessons,
            averageScore,
            points: totalPoints,
            progress: overallProgress
        };
    }

    loadUpcomingLessons() {
        const container = document.getElementById('upcomingLessons');
        if (!container) return;

        const lessons = this.getUpcomingLessons();
        
        if (lessons.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد دروش قادمة</p>';
            return;
        }

        container.innerHTML = lessons.map(lesson => `
            <div class="lesson-item">
                <div class="lesson-icon">📖</div>
                <div class="lesson-details">
                    <h5>${lesson.title}</h5>
                    <p>${lesson.subject} - ${lesson.duration} دقيقة</p>
                    <small>${this.formatLessonTime(lesson.dueDate)}</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="studentDashboard.startLesson('${lesson.id}')">
                    ابدأ
                </button>
            </div>
        `).join('');
    }

    getUpcomingLessons() {
        const assignments = JSON.parse(localStorage.getItem(`student_assignments_${this.studentId}`)) || [];
        const now = new Date();
        
        return assignments
            .filter(assignment => {
                const dueDate = new Date(assignment.dueDate);
                return dueDate > now && !assignment.completed;
            })
            .slice(0, 5)
            .map(assignment => ({
                id: assignment.id,
                title: assignment.title,
                subject: assignment.subject,
                duration: assignment.duration || 30,
                dueDate: assignment.dueDate
            }));
    }

    formatLessonTime(dueDate) {
        const date = new Date(dueDate);
        const now = new Date();
        const diffMs = date - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'اليوم';
        } else if (diffDays === 1) {
            return 'غداً';
        } else if (diffDays < 7) {
            return `بعد ${diffDays} أيام`;
        } else {
            return date.toLocaleDateString('ar-SA');
        }
    }

    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const activities = this.getRecentActivity();
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">${activity.icon}</div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <small>${this.formatActivityTime(activity.timestamp)}</small>
                </div>
                ${activity.points ? `<span class="activity-points">+${activity.points}</span>` : ''}
            </div>
        `).join('');
    }

    getRecentActivity() {
        const activities = JSON.parse(localStorage.getItem(`student_activity_${this.studentId}`)) || [];
        
        // إضافة أنشطة افتراضية إذا لم توجد
        if (activities.length === 0) {
            return [
                {
                    type: 'lesson',
                    icon: '📚',
                    message: 'أكملت درس الرياضيات بنجاح',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    points: 10
                },
                {
                    type: 'test',
                    icon: '📝',
                    message: 'اختبرت في مادة العلوم',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    points: 15
                },
                {
                    type: 'homework',
                    icon: '📋',
                    message: 'سلمت الواجب المنزلي',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    points: 5
                }
            ];
        }

        return activities.slice(0, 5);
    }

    formatActivityTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `قبل ${diffMins} دقيقة`;
        } else if (diffHours < 24) {
            return `قبل ${diffHours} ساعة`;
        } else if (diffDays < 7) {
            return `قبل ${diffDays} يوم`;
        } else {
            return date.toLocaleDateString('ar-SA');
        }
    }

    setupNotifications() {
        this.checkPendingAssignments();
        this.checkNewMessages();
    }

    checkPendingAssignments() {
        const assignments = JSON.parse(localStorage.getItem(`student_assignments_${this.studentId}`)) || [];
        const pending = assignments.filter(a => !a.completed && new Date(a.dueDate) > new Date());
        
        if (pending.length > 0) {
            this.showNotification(`لديك ${pending.length} مهام معلقة`, 'info');
        }
    }

    checkNewMessages() {
        const messages = JSON.parse(localStorage.getItem(`student_messages_${this.studentId}`)) || [];
        const unread = messages.filter(m => !m.read);
        
        if (unread.length > 0) {
            this.showNotification(`لديك ${unread.length} رسائل جديدة من المعلم`, 'warning');
        }
    }

    showNotification(message, type) {
        // تنفيذ بسيط للإشعارات
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification('ميسر التعلم', {
                body: message,
                icon: '../images/logo.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('ميسر التعلم', {
                        body: message,
                        icon: '../images/logo.png'
                    });
                }
            });
        }

        // إشعار داخل التطبيق
        const notificationEl = document.createElement('div');
        notificationEl.className = `alert alert-${type} alert-dismissible fade show`;
        notificationEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const notificationsContainer = document.getElementById('notificationsContainer');
        if (notificationsContainer) {
            notificationsContainer.appendChild(notificationEl);
        }
    }

    startTest() {
        window.location.href = 'tests.html';
    }

    viewLessons() {
        window.location.href = 'lessons.html';
    }

    practiceHandwriting() {
        window.location.href = 'handwriting.html';
    }

    startLesson(lessonId) {
        // الانتقال إلى صفحة الدرس
        window.location.href = `lesson-view.html?id=${lessonId}`;
    }

    logout() {
        localStorage.removeItem('currentStudent');
        window.location.href = '../login.html';
    }
}

// تهيئة لوحة تحكم الطالب
let studentDashboard;
document.addEventListener('DOMContentLoaded', function() {
    studentDashboard = new StudentDashboard();
    
    // طلب إذن الإشعارات
    if ('Notification' in window) {
        Notification.requestPermission();
    }
});