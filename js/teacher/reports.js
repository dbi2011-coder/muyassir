class ReportsManager {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        this.lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        this.homework = JSON.parse(localStorage.getItem('teacherHomework')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStudentsForReports();
        this.generateOverviewReport();
    }

    bindEvents() {
        document.getElementById('generateReportBtn')?.addEventListener('click', () => this.generateStudentReport());
        document.getElementById('printReportBtn')?.addEventListener('click', () => this.printReport());
        document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportReport());
        document.getElementById('comparePeriodsBtn')?.addEventListener('click', () => this.showComparisonModal());
    }

    loadStudentsForReports() {
        const select = document.getElementById('studentSelect');
        if (!select) return;

        select.innerHTML = this.students.map(student => `
            <option value="${student.id}">${student.name} - الصف ${student.grade}</option>
        `).join('');
    }

    generateOverviewReport() {
        const container = document.getElementById('overviewReports');
        if (!container) return;

        const stats = this.calculateOverviewStats();
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>إجمالي الطلاب</h3>
                    <div class="stat-number">${stats.totalStudents}</div>
                </div>
                <div class="stat-card">
                    <h3>الاختبارات المنشأة</h3>
                    <div class="stat-number">${stats.totalTests}</div>
                </div>
                <div class="stat-card">
                    <h3>الدروس المصممة</h3>
                    <div class="stat-number">${stats.totalLessons}</div>
                </div>
                <div class="stat-card">
                    <h3>متوسط التقدم</h3>
                    <div class="stat-number">${stats.averageProgress}%</div>
                </div>
            </div>
            
            <div class="recent-activity mt-4">
                <h4>النشاط الأخير</h4>
                <div class="activity-list">
                    ${this.getRecentActivity().map(activity => `
                        <div class="activity-item">
                            <span class="activity-icon">${activity.icon}</span>
                            <div class="activity-content">
                                <p>${activity.text}</p>
                                <small>${activity.time}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateOverviewStats() {
        const studentProgress = this.students.map(student => {
            const progress = JSON.parse(localStorage.getItem(`student_progress_${student.id}`)) || {};
            return Object.values(progress).reduce((sum, p) => sum + p, 0) / Object.values(progress).length || 0;
        });

        return {
            totalStudents: this.students.length,
            totalTests: this.tests.length,
            totalLessons: this.lessons.length,
            averageProgress: Math.round(studentProgress.reduce((sum, p) => sum + p, 0) / studentProgress.length) || 0
        };
    }

    getRecentActivity() {
        const activities = [];
        
        // جمع النشاط من الاختبارات
        this.tests.slice(-5).forEach(test => {
            activities.push({
                icon: '📝',
                text: `تم إنشاء اختبار: ${test.title}`,
                time: this.formatTime(test.createdAt)
            });
        });

        // جمع النشاط من الدروس
        this.lessons.slice(-5).forEach(lesson => {
            activities.push({
                icon: '📚',
                text: `تم تصميم درس: ${lesson.title}`,
                time: this.formatTime(lesson.createdAt)
            });
        });

        // جمع النشاط من الواجبات
        this.homework.slice(-5).forEach(hw => {
            activities.push({
                icon: '📋',
                text: `تم إرسال واجب: ${hw.title}`,
                time: this.formatTime(hw.createdAt)
            });
        });

        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
    }

    formatTime(dateString) {
        const date = new Date(dateString);
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

    generateStudentReport() {
        const studentId = document.getElementById('studentSelect').value;
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!studentId) {
            alert('يرجى اختيار طالب');
            return;
        }

        const student = this.students.find(s => s.id === studentId);
        const report = this.generateReportData(student, reportType, startDate, endDate);
        
        this.displayReport(report);
    }

    generateReportData(student, reportType, startDate, endDate) {
        const report = {
            student: student,
            type: reportType,
            period: { startDate, endDate },
            generatedAt: new Date().toISOString(),
            data: {}
        };

        switch (reportType) {
            case 'academic':
                report.data = this.generateAcademicReport(student, startDate, endDate);
                break;
            case 'behavioral':
                report.data = this.generateBehavioralReport(student, startDate, endDate);
                break;
            case 'comprehensive':
                report.data = this.generateComprehensiveReport(student, startDate, endDate);
                break;
        }

        return report;
    }

    generateAcademicReport(student, startDate, endDate) {
        const progress = JSON.parse(localStorage.getItem(`student_progress_${student.id}`)) || {};
        const testResults = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
        const homeworkResults = JSON.parse(localStorage.getItem(`student_homework_${student.id}`)) || [];

        const filteredTests = this.filterByDate(testResults, startDate, endDate);
        const filteredHomework = this.filterByDate(homeworkResults, startDate, endDate);

        return {
            overallProgress: this.calculateOverallProgress(progress),
            testPerformance: this.calculateTestPerformance(filteredTests),
            homeworkCompletion: this.calculateHomeworkCompletion(filteredHomework),
            skillsMastered: this.getMasteredSkills(progress),
            areasNeedingImprovement: this.getAreasNeedingImprovement(progress)
        };
    }

    generateBehavioralReport(student, startDate, endDate) {
        const behaviorData = JSON.parse(localStorage.getItem(`student_behavior_${student.id}`)) || [];
        const filteredData = this.filterByDate(behaviorData, startDate, endDate);

        return {
            attendance: this.calculateAttendance(filteredData),
            participation: this.calculateParticipation(filteredData),
            completionRate: this.calculateCompletionRate(filteredData),
            reinforcementPoints: this.calculateReinforcementPoints(student.id)
        };
    }

    generateComprehensiveReport(student, startDate, endDate) {
        const academic = this.generateAcademicReport(student, startDate, endDate);
        const behavioral = this.generateBehavioralReport(student, startDate, endDate);
        const handwriting = this.getHandwritingProgress(student.id);

        return {
            academic,
            behavioral,
            handwriting,
            recommendations: this.generateRecommendations(academic, behavioral, handwriting)
        };
    }

    filterByDate(data, startDate, endDate) {
        if (!startDate && !endDate) return data;

        return data.filter(item => {
            const itemDate = new Date(item.date || item.createdAt);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            
            return itemDate >= start && itemDate <= end;
        });
    }

    calculateOverallProgress(progress) {
        const values = Object.values(progress);
        return values.length > 0 ? Math.round(values.reduce((sum, p) => sum + p, 0) / values.length) : 0;
    }

    calculateTestPerformance(tests) {
        if (tests.length === 0) return { average: 0, total: 0, best: 0, worst: 0 };

        const scores = tests.map(t => t.score || 0);
        return {
            average: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
            total: tests.length,
            best: Math.max(...scores),
            worst: Math.min(...scores)
        };
    }

    calculateHomeworkCompletion(homework) {
        if (homework.length === 0) return { rate: 0, completed: 0, total: 0 };

        const completed = homework.filter(h => h.completed).length;
        return {
            rate: Math.round((completed / homework.length) * 100),
            completed: completed,
            total: homework.length
        };
    }

    getMasteredSkills(progress) {
        return Object.entries(progress)
            .filter(([skill, value]) => value >= 80)
            .map(([skill]) => skill);
    }

    getAreasNeedingImprovement(progress) {
        return Object.entries(progress)
            .filter(([skill, value]) => value < 60)
            .map(([skill, value]) => ({ skill, progress: value }));
    }

    calculateAttendance(behaviorData) {
        const attendanceRecords = behaviorData.filter(b => b.type === 'attendance');
        const presentDays = attendanceRecords.filter(b => b.status === 'present').length;
        
        return attendanceRecords.length > 0 ? Math.round((presentDays / attendanceRecords.length) * 100) : 0;
    }

    calculateParticipation(behaviorData) {
        const participationRecords = behaviorData.filter(b => b.type === 'participation');
        const activeParticipation = participationRecords.filter(b => b.level === 'high').length;
        
        return participationRecords.length > 0 ? Math.round((activeParticipation / participationRecords.length) * 100) : 0;
    }

    calculateCompletionRate(behaviorData) {
        const completionRecords = behaviorData.filter(b => b.type === 'completion');
        const completed = completionRecords.filter(b => b.completed).length;
        
        return completionRecords.length > 0 ? Math.round((completed / completionRecords.length) * 100) : 0;
    }

    calculateReinforcementPoints(studentId) {
        const pointsData = JSON.parse(localStorage.getItem(`student_points_${studentId}`)) || [];
        return pointsData.reduce((total, record) => total + (record.points || 0), 0);
    }

    getHandwritingProgress(studentId) {
        const assignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        const studentAssignments = assignments[studentId] || [];
        
        const completed = studentAssignments.filter(a => a.completed).length;
        const total = studentAssignments.length;
        const averageProgress = total > 0 ? 
            studentAssignments.reduce((sum, a) => sum + (a.progress || 0), 0) / total : 0;

        return {
            completed,
            total,
            averageProgress: Math.round(averageProgress),
            assignments: studentAssignments
        };
    }

    generateRecommendations(academic, behavioral, handwriting) {
        const recommendations = [];

        if (academic.overallProgress < 70) {
            recommendations.push('يحتاج الطالب إلى دعم إضافي في المهارات الأكاديمية');
        }

        if (academic.areasNeedingImprovement.length > 0) {
            recommendations.push(`التركيز على تحسين: ${academic.areasNeedingImprovement.map(a => a.skill).join(', ')}`);
        }

        if (behavioral.attendance < 80) {
            recommendations.push('تحسين معدل الحضور والمشاركة في الفصل');
        }

        if (handwriting.averageProgress < 50) {
            recommendations.push('الاستمرار في تمارين تحسين الخط');
        }

        if (academic.testPerformance.average >= 85 && behavioral.participation >= 80) {
            recommendations.push('الطالب متميز، يمكن تقديم أنشطة إثرائية إضافية');
        }

        return recommendations.length > 0 ? recommendations : ['أداء الطالب جيد، الاستمرار في نفس النهج'];
    }

    displayReport(report) {
        const container = document.getElementById('reportResults');
        if (!container) return;

        container.innerHTML = this.generateReportHTML(report);
        this.currentReport = report;
    }

    generateReportHTML(report) {
        return `
            <div class="report-header">
                <h3>تقرير ${this.getReportTypeText(report.type)} - ${report.student.name}</h3>
                <p>الفترة: ${report.period.startDate || 'البداية'} إلى ${report.period.endDate || 'النهاية'}</p>
                <p>تم الإنشاء في: ${new Date(report.generatedAt).toLocaleDateString('ar-SA')}</p>
            </div>

            <div class="report-content">
                ${this.generateReportSections(report)}
            </div>

            <div class="report-footer">
                <p>معلم صعوبات التعلم: أ/ صالح عبد العزيز عبد الله العجلان</p>
                <p>موقع ميسر التعلم © ${new Date().getFullYear()}</p>
            </div>
        `;
    }

    getReportTypeText(type) {
        const types = {
            'academic': 'أكاديمي',
            'behavioral': 'سلوكي',
            'comprehensive': 'شامل'
        };
        return types[type] || type;
    }

    generateReportSections(report) {
        switch (report.type) {
            case 'academic':
                return this.generateAcademicSections(report.data);
            case 'behavioral':
                return this.generateBehavioralSections(report.data);
            case 'comprehensive':
                return this.generateComprehensiveSections(report.data);
            default:
                return '';
        }
    }

    generateAcademicSections(data) {
        return `
            <div class="report-section">
                <h4>التقدم الأكاديمي</h4>
                <div class="progress-display">
                    <div class="progress overall-progress">
                        <div class="progress-bar" style="width: ${data.overallProgress}%">
                            ${data.overallProgress}%
                        </div>
                    </div>
                    <p>متوسط التقدم العام</p>
                </div>
            </div>

            <div class="report-section">
                <h4>أداء الاختبارات</h4>
                <div class="performance-stats">
                    <div class="stat">المعدل: <strong>${data.testPerformance.average}%</strong></div>
                    <div class="stat">أفضل نتيجة: <strong>${data.testPerformance.best}%</strong></div>
                    <div class="stat">أسوأ نتيجة: <strong>${data.testPerformance.worst}%</strong></div>
                    <div class="stat">عدد الاختبارات: <strong>${data.testPerformance.total}</strong></div>
                </div>
            </div>

            <div class="report-section">
                <h4>إنجاز الواجبات</h4>
                <div class="completion-stats">
                    <div class="stat">معدل الإنجاز: <strong>${data.homeworkCompletion.rate}%</strong></div>
                    <div class="stat">الواجبات المكتملة: <strong>${data.homeworkCompletion.completed}</strong></div>
                    <div class="stat">إجمالي الواجبات: <strong>${data.homeworkCompletion.total}</strong></div>
                </div>
            </div>

            <div class="report-section">
                <h4>المهارات المتقنة</h4>
                <ul class="skills-list">
                    ${data.skillsMastered.length > 0 ? 
                      data.skillsMastered.map(skill => `<li>${skill}</li>`).join('') : 
                      '<li>لا توجد مهارات متقنة بعد</li>'}
                </ul>
            </div>

            <div class="report-section">
                <h4>مجالات تحتاج تحسين</h4>
                <ul class="improvement-list">
                    ${data.areasNeedingImprovement.length > 0 ? 
                      data.areasNeedingImprovement.map(area => 
                        `<li>${area.skill} (${area.progress}%)</li>`
                      ).join('') : 
                      '<li>جميع المجالات بمستوى مقبول</li>'}
                </ul>
            </div>
        `;
    }

    generateBehavioralSections(data) {
        return `
            <div class="report-section">
                <h4>الحضور والانضباط</h4>
                <div class="behavior-stats">
                    <div class="stat">معدل الحضور: <strong>${data.attendance}%</strong></div>
                    <div class="stat">معدل المشاركة: <strong>${data.participation}%</strong></div>
                    <div class="stat">معدل إنجاز المهام: <strong>${data.completionRate}%</strong></div>
                    <div class="stat">نقاط التعزيز: <strong>${data.reinforcementPoints}</strong></div>
                </div>
            </div>
        `;
    }

    generateComprehensiveSections(data) {
        return `
            ${this.generateAcademicSections(data.academic)}
            ${this.generateBehavioralSections(data.behavioral)}
            
            <div class="report-section">
                <h4>تقدم تحسين الخط</h4>
                <div class="handwriting-stats">
                    <div class="stat">متوسط التقدم: <strong>${data.handwriting.averageProgress}%</strong></div>
                    <div class="stat">التمارين المكتملة: <strong>${data.handwriting.completed}</strong></div>
                    <div class="stat">إجمالي التمارين: <strong>${data.handwriting.total}</strong></div>
                </div>
            </div>

            <div class="report-section recommendations">
                <h4>التوصيات</h4>
                <ul class="recommendations-list">
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    printReport() {
        if (!this.currentReport) {
            alert('لا يوجد تقرير لعرضه');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = this.generatePrintableReport(this.currentReport);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقرير الطالب - ميسر التعلم</title>
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        margin: 40px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .report-header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .report-section { 
                        margin: 25px 0; 
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    }
                    .report-section h4 {
                        color: #2c5e8e;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 10px;
                    }
                    .progress {
                        background: #f0f0f0;
                        border-radius: 10px;
                        overflow: hidden;
                        height: 30px;
                        margin: 10px 0;
                    }
                    .progress-bar {
                        background: linear-gradient(45deg, #28a745, #20c997);
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 15px 0;
                    }
                    .stat {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .skills-list, .improvement-list, .recommendations-list {
                        list-style: none;
                        padding: 0;
                    }
                    .skills-list li, .improvement-list li {
                        background: #e8f5e8;
                        margin: 5px 0;
                        padding: 8px 15px;
                        border-radius: 5px;
                    }
                    .improvement-list li {
                        background: #ffeaa7;
                    }
                    .recommendations-list li {
                        background: #d1ecf1;
                        margin: 8px 0;
                        padding: 10px 15px;
                        border-radius: 5px;
                        border-right: 4px solid #17a2b8;
                    }
                    .report-footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                    }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${reportHTML}
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px; margin: 0 10px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; margin: 0 10px;">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    generatePrintableReport(report) {
        return this.generateReportHTML(report);
    }

    exportReport() {
        if (!this.currentReport) {
            alert('لا يوجد تقرير لتصديره');
            return;
        }

        const dataStr = JSON.stringify(this.currentReport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `تقرير_${this.currentReport.student.name}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    showComparisonModal() {
        // تنفيذ نافذة مقارنة الفترات
        alert('خاصية مقارنة الفترات قيد التطوير');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fixed-top mx-auto mt-3`;
        notification.style.cssText = 'width: 300px; z-index: 9999;';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة مدير التقارير عند تحميل الصفحة
let reportsManager;
document.addEventListener('DOMContentLoaded', function() {
    reportsManager = new ReportsManager();
});