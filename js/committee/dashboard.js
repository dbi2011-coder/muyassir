class CommitteeDashboard {
    constructor() {
        this.committeeMember = JSON.parse(localStorage.getItem('currentCommittee'));
        this.init();
    }

    init() {
        if (!this.committeeMember) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadDashboardStats();
        this.loadRecentActivity();
        this.loadPendingReviews();
    }

    bindEvents() {
        document.getElementById('refreshStats')?.addEventListener('click', () => this.loadDashboardStats());
        document.getElementById('generateReport')?.addEventListener('click', () => this.generateOverallReport());
    }

    loadDashboardStats() {
        const stats = this.calculateDashboardStats();
        
        this.updateStatsDisplay(stats);
        this.renderCharts(stats);
    }

    calculateDashboardStats() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        const homework = JSON.parse(localStorage.getItem('teacherHomework')) || [];
        const activities = JSON.parse(localStorage.getItem('teacherActivities')) || [];

        // حساب إحصائيات الطلاب
        const studentProgress = students.map(student => {
            const progress = JSON.parse(localStorage.getItem(`student_progress_${student.id}`)) || {};
            return Object.values(progress).length > 0 ? 
                Object.values(progress).reduce((sum, p) => sum + p, 0) / Object.values(progress).length : 0;
        });

        const averageProgress = studentProgress.length > 0 ? 
            Math.round(studentProgress.reduce((sum, p) => sum + p, 0) / studentProgress.length) : 0;

        // حساب إحصائيات الاختبارات
        const testStats = this.calculateTestStats();

        // حساب إحصائيات تحسين الخط
        const handwritingStats = this.calculateHandwritingStats();

        return {
            totalStudents: students.length,
            totalTests: tests.length,
            totalLessons: lessons.length,
            totalHomework: homework.length,
            totalActivities: activities.length,
            averageProgress: averageProgress,
            studentsWithLowProgress: studentProgress.filter(p => p < 50).length,
            testStats: testStats,
            handwritingStats: handwritingStats,
            teacherActivity: this.calculateTeacherActivity()
        };
    }

    calculateTestStats() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        let totalTestsTaken = 0;
        let totalTestScore = 0;
        let testCount = 0;

        students.forEach(student => {
            const testResults = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
            totalTestsTaken += testResults.length;
            
            testResults.forEach(test => {
                totalTestScore += test.percentage || 0;
                testCount++;
            });
        });

        return {
            testsTaken: totalTestsTaken,
            averageScore: testCount > 0 ? Math.round(totalTestScore / testCount) : 0,
            completionRate: students.length > 0 ? Math.round((totalTestsTaken / (students.length * 5)) * 100) : 0 // افتراضي 5 اختبارات لكل طالب
        };
    }

    calculateHandwritingStats() {
        const allAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        let totalAssignments = 0;
        let completedAssignments = 0;
        let totalProgress = 0;

        Object.values(allAssignments).forEach(studentAssignments => {
            studentAssignments.forEach(assignment => {
                totalAssignments++;
                if (assignment.completed) {
                    completedAssignments++;
                }
                totalProgress += assignment.progress || 0;
            });
        });

        return {
            totalAssignments: totalAssignments,
            completedAssignments: completedAssignments,
            completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
            averageProgress: totalAssignments > 0 ? Math.round(totalProgress / totalAssignments) : 0
        };
    }

    calculateTeacherActivity() {
        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        const homework = JSON.parse(localStorage.getItem('teacherHomework')) || [];
        const activities = JSON.parse(localStorage.getItem('teacherActivities')) || [];

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const recentTests = tests.filter(test => new Date(test.createdAt) > lastMonth).length;
        const recentLessons = lessons.filter(lesson => new Date(lesson.createdAt) > lastMonth).length;
        const recentHomework = homework.filter(hw => new Date(hw.createdAt) > lastMonth).length;
        const recentActivities = activities.filter(activity => new Date(activity.date) > lastMonth).length;

        return {
            testsThisMonth: recentTests,
            lessonsThisMonth: recentLessons,
            homeworkThisMonth: recentHomework,
            activitiesThisMonth: recentActivities
        };
    }

    updateStatsDisplay(stats) {
        const statsContainer = document.getElementById('dashboardStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👨‍🎓</div>
                    <div class="stat-info">
                        <h3>${stats.totalStudents}</h3>
                        <p>إجمالي الطلاب</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <h3>${stats.averageProgress}%</h3>
                        <p>متوسط التقدم</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-info">
                        <h3>${stats.testStats.testsTaken}</h3>
                        <p>اختبارات مجراة</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">✍️</div>
                    <div class="stat-info">
                        <h3>${stats.handwritingStats.completionRate}%</h3>
                        <p>إنجاز تحسين الخط</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                        <h3>${stats.totalLessons}</h3>
                        <p>دروس مصممة</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-info">
                        <h3>${stats.studentsWithLowProgress}</h3>
                        <p>طلاب يحتاجون دعم</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderCharts(stats) {
        this.renderProgressChart(stats);
        this.renderActivityChart(stats);
        this.renderTestPerformanceChart(stats);
    }

    renderProgressChart(stats) {
        const ctx = document.getElementById('progressChart')?.getContext('2d');
        if (!ctx) return;

        // استخدام Chart.js إذا كان متاحاً، أو رسم بدائي
        this.drawBasicProgressChart(ctx, stats);
    }

    drawBasicProgressChart(ctx, stats) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // مسح Canvas
        ctx.clearRect(0, 0, width, height);
        
        // رسم مخطط بسيط للتقدم
        const progressData = [stats.averageProgress, stats.testStats.averageScore, stats.handwritingStats.averageProgress];
        const labels = ['التقدم العام', 'أداء الاختبارات', 'تحسين الخط'];
        const colors = ['#007bff', '#28a745', '#ffc107'];
        
        const barWidth = 60;
        const spacing = 30;
        const startX = 50;
        const maxHeight = height - 100;
        
        // رسم الأعمدة
        progressData.forEach((value, index) => {
            const x = startX + index * (barWidth + spacing);
            const barHeight = (value / 100) * maxHeight;
            const y = height - 50 - barHeight;
            
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // النص
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth/2, height - 30);
            ctx.fillText(value + '%', x + barWidth/2, y - 10);
        });
    }

    renderActivityChart(stats) {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;

        this.drawBasicActivityChart(ctx, stats.teacherActivity);
    }

    drawBasicActivityChart(ctx, activity) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const activities = [
            { label: 'اختبارات', value: activity.testsThisMonth, color: '#007bff' },
            { label: 'دروس', value: activity.lessonsThisMonth, color: '#28a745' },
            { label: 'واجبات', value: activity.homeworkThisMonth, color: '#ffc107' },
            { label: 'أنشطة', value: activity.activitiesThisMonth, color: '#dc3545' }
        ];
        
        const total = activities.reduce((sum, a) => sum + a.value, 0);
        let startAngle = 0;
        
        if (total === 0) {
            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.arc(width/2, height/2, Math.min(width, height)/3, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات', width/2, height/2);
            return;
        }
        
        activities.forEach(activity => {
            const sliceAngle = (activity.value / total) * 2 * Math.PI;
            
            ctx.fillStyle = activity.color;
            ctx.beginPath();
            ctx.moveTo(width/2, height/2);
            ctx.arc(width/2, height/2, Math.min(width, height)/3, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            startAngle += sliceAngle;
        });
    }

    renderTestPerformanceChart(stats) {
        const ctx = document.getElementById('testChart')?.getContext('2d');
        if (!ctx) return;

        this.drawBasicTestChart(ctx, stats.testStats);
    }

    drawBasicTestChart(ctx, testStats) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // رسم مؤشر الأداء
        const score = testStats.averageScore;
        const radius = Math.min(width, height) / 3;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // الخلفية
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // التقدم
        const progressAngle = (score / 100) * 2 * Math.PI;
        ctx.strokeStyle = score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + progressAngle);
        ctx.stroke();
        
        // النص
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(score + '%', centerX, centerY);
        
        ctx.font = '14px Arial';
        ctx.fillText('متوسط الدرجات', centerX, centerY + 30);
    }

    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const activities = this.getRecentActivities();
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">${activity.icon}</div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <small>${this.formatTime(activity.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = [];
        
        // جمع النشاط من الطلاب
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.forEach(student => {
            const testResults = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
            const recentTests = testResults.slice(-3);
            
            recentTests.forEach(test => {
                activities.push({
                    type: 'test',
                    icon: '📝',
                    message: `${student.name} - اختبر في ${test.testTitle}`,
                    timestamp: test.completedAt
                });
            });
        });

        // جمع النشاط من المعلم
        const teacherTests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const teacherLessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        
        teacherTests.slice(-5).forEach(test => {
            activities.push({
                type: 'teacher',
                icon: '👨‍🏫',
                message: `المعلم أنشأ اختبار: ${test.title}`,
                timestamp: test.createdAt
            });
        });

        teacherLessons.slice(-5).forEach(lesson => {
            activities.push({
                type: 'teacher',
                icon: '📚',
                message: `المعلم صمم درس: ${lesson.title}`,
                timestamp: lesson.createdAt
            });
        });

        return activities
            .filter(a => a.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    formatTime(timestamp) {
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

    loadPendingReviews() {
        const container = document.getElementById('pendingReviews');
        if (!container) return;

        const pendingItems = this.getPendingReviewItems();
        
        if (pendingItems.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد عناصر قيد المراجعة</p>';
            return;
        }

        container.innerHTML = pendingItems.map(item => `
            <div class="review-item">
                <div class="review-info">
                    <h5>${item.title}</h5>
                    <p>${item.description}</p>
                    <small>${item.type} - ${new Date(item.date).toLocaleDateString('ar-SA')}</small>
                </div>
                <div class="review-actions">
                    <button class="btn btn-primary btn-sm" onclick="committeeDashboard.reviewItem('${item.id}', '${item.type}')">
                        مراجعة
                    </button>
                </div>
            </div>
        `).join('');
    }

    getPendingReviewItems() {
        const items = [];
        
        // خطط الطلاب التي تحتاج مراجعة
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.forEach(student => {
            const plan = JSON.parse(localStorage.getItem(`student_plan_${student.id}`)) || {};
            if (!plan.reviewed) {
                items.push({
                    id: student.id,
                    type: 'student_plan',
                    title: `خطة ${student.name}`,
                    description: `خطة الطالب ${student.name} - الصف ${student.grade}`,
                    date: plan.createdAt || new Date().toISOString()
                });
            }
        });

        // اختبارات جديدة
        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        tests.slice(-5).forEach(test => {
            if (!test.reviewed) {
                items.push({
                    id: test.id,
                    type: 'test',
                    title: test.title,
                    description: `اختبار ${test.subject} - ${test.grades.join(', ')}`,
                    date: test.createdAt
                });
            }
        });

        return items.slice(0, 10);
    }

    reviewItem(itemId, itemType) {
        switch (itemType) {
            case 'student_plan':
                window.location.href = `plans-review.html?student=${itemId}`;
                break;
            case 'test':
                window.location.href = `lessons-review.html?test=${itemId}`;
                break;
            default:
                alert('نوع العنصر غير مدعوم');
        }
    }

    generateOverallReport() {
        const stats = this.calculateDashboardStats();
        const report = this.generateReportData(stats);
        
        this.displayReport(report);
    }

    generateReportData(stats) {
        return {
            generatedAt: new Date().toISOString(),
            period: 'الفصل الدراسي الحالي',
            stats: stats,
            recommendations: this.generateRecommendations(stats)
        };
    }

    generateRecommendations(stats) {
        const recommendations = [];

        if (stats.studentsWithLowProgress > stats.totalStudents * 0.3) {
            recommendations.push('يوجد عدد كبير من الطلاب بحاجة إلى دعم إضافي، يوصى بتصميم برامج دعم مكثفة');
        }

        if (stats.testStats.averageScore < 60) {
            recommendations.push('مستوى أداء الطلاب في الاختبارات يحتاج إلى تحسين، يوصى بمراجعة استراتيجيات التدريس');
        }

        if (stats.handwritingStats.completionRate < 50) {
            recommendations.push('برنامج تحسين الخط يحتاج إلى متابعة أكثر فعالية');
        }

        if (stats.teacherActivity.testsThisMonth < 2) {
            recommendations.push('يوصى بزيادة عدد الاختبارات التشخيصية لمتابعة تقدم الطلاب');
        }

        if (recommendations.length === 0) {
            recommendations.push('الأداء العام جيد، يوصى بالاستمرار في نفس النهج مع متابعة مستمرة');
        }

        return recommendations;
    }

    displayReport(report) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقرير اللجنة - ميسر التعلم</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .report-header { 
                        text-align: center; 
                        margin-bottom: 40px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 30px 0;
                    }
                    .stat-box {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        border-left: 4px solid #007bff;
                    }
                    .recommendations {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .recommendations ul {
                        margin: 10px 0;
                        padding-right: 20px;
                    }
                    .signature-area {
                        margin-top: 50px;
                        text-align: left;
                    }
                    @media print {
                        body { margin: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>تقرير لجنة صعوبات التعلم</h1>
                    <h3>موقع ميسر التعلم</h3>
                    <p>الفترة: ${report.period}</p>
                    <p>تم الإنشاء في: ${new Date(report.generatedAt).toLocaleDateString('ar-SA')}</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <h3>${report.stats.totalStudents}</h3>
                        <p>إجمالي الطلاب</p>
                    </div>
                    <div class="stat-box">
                        <h3>${report.stats.averageProgress}%</h3>
                        <p>متوسط التقدم</p>
                    </div>
                    <div class="stat-box">
                        <h3>${report.stats.testStats.averageScore}%</h3>
                        <p>متوسط الاختبارات</p>
                    </div>
                    <div class="stat-box">
                        <h3>${report.stats.handwritingStats.completionRate}%</h3>
                        <p>إنجاز الخط</p>
                    </div>
                </div>

                <div class="recommendations">
                    <h3>التوصيات</h3>
                    <ul>
                        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>

                <div class="signature-area">
                    <p>رئيس اللجنة: ___________________</p>
                    <p>التوقيع: ___________________</p>
                    <p>التاريخ: ___________________</p>
                </div>

                <div style="text-align: center; margin-top: 50px;">
                    <button onclick="window.print()" style="padding: 10px 20px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; margin-right: 10px;">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
}

// تهيئة لوحة تحكم اللجنة
let committeeDashboard;
document.addEventListener('DOMContentLoaded', function() {
    committeeDashboard = new CommitteeDashboard();
});