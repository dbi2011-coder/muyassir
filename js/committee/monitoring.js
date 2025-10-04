class CommitteeMonitoring {
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
        this.loadStudentsData();
        this.loadTeacherSchedule();
        this.loadTeacherActivities();
    }

    bindEvents() {
        document.getElementById('exportData')?.addEventListener('click', () => this.exportAllData());
        document.getElementById('printReports')?.addEventListener('click', () => this.printAllReports());
        document.getElementById('filterStudents')?.addEventListener('change', () => this.filterStudents());
        document.getElementById('searchStudents')?.addEventListener('input', () => this.searchStudents());
    }

    loadStudentsData() {
        const container = document.getElementById('studentsData');
        if (!container) return;

        const students = this.getStudentsWithDetails();
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>اسم الطالب</th>
                        <th>الصف</th>
                        <th>التقدم العام</th>
                        <th>آخر اختبار</th>
                        <th>تحسين الخط</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.name}</td>
                            <td>${student.grade}</td>
                            <td>
                                <div class="progress">
                                    <div class="progress-bar" style="width: ${student.overallProgress}%">
                                        ${student.overallProgress}%
                                    </div>
                                </div>
                            </td>
                            <td>${student.lastTestScore}%</td>
                            <td>
                                <div class="progress">
                                    <div class="progress-bar" style="width: ${student.handwritingProgress}%">
                                        ${student.handwritingProgress}%
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${student.status}">
                                    ${this.getStatusText(student.status)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="committeeMonitoring.viewStudentDetails('${student.id}')">
                                    تفاصيل
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="committeeMonitoring.generateStudentReport('${student.id}')">
                                    تقرير
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getStudentsWithDetails() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        return students.map(student => {
            const progress = JSON.parse(localStorage.getItem(`student_progress_${student.id}`)) || {};
            const testResults = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
            const handwritingAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
            
            const overallProgress = Object.values(progress).length > 0 ? 
                Math.round(Object.values(progress).reduce((sum, p) => sum + p, 0) / Object.values(progress).length) : 0;
            
            const lastTest = testResults[testResults.length - 1];
            const lastTestScore = lastTest ? lastTest.percentage : 0;
            
            const studentHandwriting = handwritingAssignments[student.id] || [];
            const handwritingProgress = studentHandwriting.length > 0 ? 
                Math.round(studentHandwriting.reduce((sum, a) => sum + (a.progress || 0), 0) / studentHandwriting.length) : 0;
            
            let status = 'good';
            if (overallProgress < 50) status = 'needs_attention';
            else if (overallProgress < 70) status = 'average';
            
            return {
                ...student,
                overallProgress,
                lastTestScore,
                handwritingProgress,
                status
            };
        });
    }

    getStatusText(status) {
        const statuses = {
            'good': 'جيد',
            'average': 'متوسط',
            'needs_attention': 'يحتاج متابعة'
        };
        return statuses[status] || status;
    }

    viewStudentDetails(studentId) {
        window.location.href = `students-review.html?student=${studentId}`;
    }

    generateStudentReport(studentId) {
        const student = this.getStudentsWithDetails().find(s => s.id === studentId);
        if (!student) return;

        const report = this.generateStudentReportData(student);
        this.displayStudentReport(report);
    }

    generateStudentReportData(student) {
        const progress = JSON.parse(localStorage.getItem(`student_progress_${student.id}`)) || {};
        const testResults = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
        const homeworkResults = JSON.parse(localStorage.getItem(`student_homework_${student.id}`)) || [];
        const handwritingAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        
        const studentHandwriting = handwritingAssignments[student.id] || [];

        return {
            student: student,
            generatedAt: new Date().toISOString(),
            academic: {
                overallProgress: student.overallProgress,
                skillsMastered: Object.entries(progress).filter(([_, value]) => value >= 80).map(([skill]) => skill),
                areasNeedingImprovement: Object.entries(progress).filter(([_, value]) => value < 60).map(([skill, value]) => ({ skill, progress: value })),
                testPerformance: this.calculateTestPerformance(testResults),
                homeworkCompletion: this.calculateHomeworkCompletion(homeworkResults)
            },
            behavioral: {
                attendance: this.calculateAttendance(student.id),
                participation: this.calculateParticipation(student.id),
                reinforcementPoints: this.calculateReinforcementPoints(student.id)
            },
            handwriting: {
                progress: student.handwritingProgress,
                completedAssignments: studentHandwriting.filter(a => a.completed).length,
                totalAssignments: studentHandwriting.length,
                recentPractice: this.getRecentHandwritingPractice(studentHandwriting)
            },
            recommendations: this.generateStudentRecommendations(student)
        };
    }

    calculateTestPerformance(testResults) {
        if (testResults.length === 0) return { average: 0, total: 0, trend: 'no_data' };
        
        const scores = testResults.map(t => t.percentage || 0);
        const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
        
        let trend = 'stable';
        if (testResults.length >= 2) {
            const recentScore = testResults[testResults.length - 1].percentage;
            const previousScore = testResults[testResults.length - 2].percentage;
            trend = recentScore > previousScore ? 'improving' : recentScore < previousScore ? 'declining' : 'stable';
        }
        
        return { average, total: testResults.length, trend };
    }

    calculateHomeworkCompletion(homeworkResults) {
        if (homeworkResults.length === 0) return { rate: 0, completed: 0, total: 0 };
        
        const completed = homeworkResults.filter(h => h.completed).length;
        return {
            rate: Math.round((completed / homeworkResults.length) * 100),
            completed,
            total: homeworkResults.length
        };
    }

    calculateAttendance(studentId) {
        // بيانات افتراضية - يمكن استبدالها ببيانات حقيقية
        return 85; // نسبة الحضور
    }

    calculateParticipation(studentId) {
        // بيانات افتراضية - يمكن استبدالها ببيانات حقيقية
        return 75; // نسبة المشاركة
    }

    calculateReinforcementPoints(studentId) {
        const pointsData = JSON.parse(localStorage.getItem(`student_points_${studentId}`)) || [];
        return pointsData.reduce((total, record) => total + (record.points || 0), 0);
    }

    getRecentHandwritingPractice(assignments) {
        const recent = assignments
            .filter(a => a.completed)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 3);
        
        return recent.map(a => ({
            template: a.templateId,
            completedAt: a.completedAt,
            progress: a.progress
        }));
    }

    generateStudentRecommendations(student) {
        const recommendations = [];
        
        if (student.overallProgress < 60) {
            recommendations.push('يحتاج الطالب إلى خطة دعم فردية مكثفة');
        }
        
        if (student.lastTestScore < 50) {
            recommendations.push('يوصى بإعادة تقييم الطالب وتصميم اختبارات تقوية');
        }
        
        if (student.handwritingProgress < 50) {
            recommendations.push('الاستمرار في برنامج تحسين الخط مع زيادة عدد التمارين');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('أداء الطالب جيد، الاستمرار في نفس النهج');
        }
        
        return recommendations;
    }

    displayStudentReport(report) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقرير الطالب - ميسر التعلم</title>
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
                    .section { 
                        margin: 30px 0; 
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    }
                    .progress-bar {
                        background: #e9ecef;
                        border-radius: 10px;
                        overflow: hidden;
                        height: 20px;
                        margin: 10px 0;
                    }
                    .progress-fill {
                        height: 100%;
                        background: #007bff;
                        text-align: center;
                        color: white;
                        font-size: 12px;
                        line-height: 20px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 15px 0;
                    }
                    .stat-item {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .recommendations {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 8px;
                        padding: 20px;
                    }
                    @media print {
                        body { margin: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>تقرير متابعة الطالب</h1>
                    <h2>${report.student.name} - الصف ${report.student.grade}</h2>
                    <p>تم الإنشاء في: ${new Date(report.generatedAt).toLocaleDateString('ar-SA')}</p>
                </div>

                <div class="section">
                    <h3>التقدم الأكاديمي</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${report.academic.overallProgress}%">
                            ${report.academic.overallProgress}%
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h4>${report.academic.testPerformance.average}%</h4>
                            <p>متوسط الاختبارات</p>
                        </div>
                        <div class="stat-item">
                            <h4>${report.academic.homeworkCompletion.rate}%</h4>
                            <p>إنجاز الواجبات</p>
                        </div>
                        <div class="stat-item">
                            <h4>${report.academic.testPerformance.total}</h4>
                            <p>عدد الاختبارات</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>تحسين الخط</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${report.handwriting.progress}%">
                            ${report.handwriting.progress}%
                        </div>
                    </div>
                    <p>التمارين المكتملة: ${report.handwriting.completedAssignments} من ${report.handwriting.totalAssignments}</p>
                </div>

                <div class="section">
                    <h3>التوصيات</h3>
                    <div class="recommendations">
                        <ul>
                            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
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

    loadTeacherSchedule() {
        const container = document.getElementById('teacherSchedule');
        if (!container) return;

        const schedule = JSON.parse(localStorage.getItem('teacherSchedule')) || {};
        
        let html = '<h4>جدول المعلم</h4>';
        
        if (Object.keys(schedule).length === 0) {
            html += '<p class="text-muted">لا يوجد جدول مدخل</p>';
        } else {
            html += '<div class="schedule-preview">';
            
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(day => {
                const daySessions = schedule[day] || [];
                const sessionCount = daySessions.filter(s => s.subject).length;
                
                html += `
                    <div class="day-schedule">
                        <h5>${this.getDayName(day)}</h5>
                        <p>${sessionCount} حصة</p>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        container.innerHTML = html;
    }

    getDayName(day) {
        const days = {
            'sunday': 'الأحد',
            'monday': 'الاثنين',
            'tuesday': 'الثلاثاء',
            'wednesday': 'الأربعاء',
            'thursday': 'الخميس'
        };
        return days[day] || day;
    }

    loadTeacherActivities() {
        const container = document.getElementById('teacherActivities');
        if (!container) return;

        const activities = JSON.parse(localStorage.getItem('teacherActivities')) || [];
        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        
        const recentActivities = [...activities, ...tests.map(t => ({...t, type: 'test'})), ...lessons.map(l => ({...l, type: 'lesson'}))]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 10);
        
        container.innerHTML = `
            <h4>النشاط الأخير للمعلم</h4>
            <div class="activities-list">
                ${recentActivities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            ${activity.type === 'test' ? '📝' : activity.type === 'lesson' ? '📚' : '🎯'}
                        </div>
                        <div class="activity-content">
                            <p>${activity.title || activity.name}</p>
                            <small>${new Date(activity.createdAt || activity.date).toLocaleDateString('ar-SA')}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    filterStudents() {
        const filterValue = document.getElementById('filterStudents').value;
        const rows = document.querySelectorAll('#studentsData tbody tr');
        
        rows.forEach(row => {
            const statusBadge = row.querySelector('.status-badge');
            const status = statusBadge?.className.includes('needs_attention') ? 'needs_attention' : 
                          statusBadge?.className.includes('average') ? 'average' : 'good';
            
            if (filterValue === 'all' || status === filterValue) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    searchStudents() {
        const searchTerm = document.getElementById('searchStudents').value.toLowerCase();
        const rows = document.querySelectorAll('#studentsData tbody tr');
        
        rows.forEach(row => {
            const studentName = row.cells[0].textContent.toLowerCase();
            const grade = row.cells[1].textContent.toLowerCase();
            
            if (studentName.includes(searchTerm) || grade.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    exportAllData() {
        const data = this.prepareExportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `لجنة_صعوبات_التعلم_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    prepareExportData() {
        const students = this.getStudentsWithDetails();
        const schedule = JSON.parse(localStorage.getItem('teacherSchedule')) || {};
        const activities = JSON.parse(localStorage.getItem('teacherActivities')) || [];
        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        
        return {
            exportDate: new Date().toISOString(),
            students: students,
            teacherSchedule: schedule,
            teacherActivities: activities,
            tests: tests,
            lessons: lessons,
            summary: this.calculateExportSummary(students)
        };
    }

    calculateExportSummary(students) {
        const totalStudents = students.length;
        const averageProgress = Math.round(students.reduce((sum, s) => sum + s.overallProgress, 0) / totalStudents);
        const studentsNeedingAttention = students.filter(s => s.status === 'needs_attention').length;
        
        return {
            totalStudents,
            averageProgress,
            studentsNeedingAttention,
            attentionPercentage: Math.round((studentsNeedingAttention / totalStudents) * 100)
        };
    }

    printAllReports() {
        const printWindow = window.open('', '_blank');
        const students = this.getStudentsWithDetails();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقارير الطلاب - ميسر التعلم</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report { margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; }
                    .student-header { background: #f8f9fa; padding: 15px; margin-bottom: 15px; }
                    .progress-bar { 
                        background: #e9ecef; 
                        border-radius: 10px; 
                        overflow: hidden; 
                        height: 20px; 
                        margin: 5px 0; 
                    }
                    .progress-fill { 
                        height: 100%; 
                        background: #007bff; 
                        text-align: center; 
                        color: white; 
                        font-size: 12px; 
                        line-height: 20px; 
                    }
                    @media print {
                        body { margin: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1 style="text-align: center;">تقارير متابعة الطلاب</h1>
                <p style="text-align: center;">لجنة صعوبات التعلم - ${new Date().toLocaleDateString('ar-SA')}</p>
                
                ${students.map(student => `
                    <div class="report">
                        <div class="student-header">
                            <h3>${student.name} - الصف ${student.grade}</h3>
                        </div>
                        <div>
                            <p><strong>التقدم العام:</strong> ${student.overallProgress}%</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${student.overallProgress}%"></div>
                            </div>
                            
                            <p><strong>آخر اختبار:</strong> ${student.lastTestScore}%</p>
                            <p><strong>تحسين الخط:</strong> ${student.handwritingProgress}%</p>
                            <p><strong>الحالة:</strong> ${this.getStatusText(student.status)}</p>
                        </div>
                    </div>
                `).join('')}
                
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; margin-right: 10px;">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
}

// تهيئة نظام المتابعة للجنة
let committeeMonitoring;
document.addEventListener('DOMContentLoaded', function() {
    committeeMonitoring = new CommitteeMonitoring();
});