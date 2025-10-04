class CommitteeReports {
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
        this.loadDetailedReports();
        this.setupChecklist();
    }

    bindEvents() {
        document.getElementById('generateDetailedReport')?.addEventListener('click', () => this.generateDetailedReport());
        document.getElementById('saveChecklist')?.addEventListener('click', () => this.saveChecklist());
        document.getElementById('addRecommendation')?.addEventListener('click', () => this.addRecommendation());
        document.getElementById('printChecklist')?.addEventListener('click', () => this.printChecklist());
    }

    loadDetailedReports() {
        this.loadTeacherScheduleReview();
        this.loadStudentTestsReview();
        this.loadStudentPlansReview();
        this.loadLessonsReview();
        this.loadActivitiesReview();
        this.loadHandwritingReview();
    }

    loadTeacherScheduleReview() {
        const container = document.getElementById('scheduleReview');
        if (!container) return;

        const schedule = JSON.parse(localStorage.getItem('teacherSchedule')) || {};
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
        
        let totalSessions = 0;
        let scheduledSessions = 0;

        days.forEach(day => {
            const daySessions = schedule[day] || [];
            daySessions.forEach(session => {
                totalSessions++;
                if (session.subject) {
                    scheduledSessions++;
                }
            });
        });

        const utilizationRate = totalSessions > 0 ? Math.round((scheduledSessions / totalSessions) * 100) : 0;

        container.innerHTML = `
            <div class="review-summary">
                <h5>جدول المعلم</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>إجمالي الحصص:</span>
                        <strong>${totalSessions}</strong>
                    </div>
                    <div class="stat">
                        <span>الحصص المجدولة:</span>
                        <strong>${scheduledSessions}</strong>
                    </div>
                    <div class="stat">
                        <span>معدل الاستخدام:</span>
                        <strong>${utilizationRate}%</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على جدول المعلم..." 
                              id="scheduleComments"></textarea>
                </div>
            </div>
        `;
    }

    loadStudentTestsReview() {
        const container = document.getElementById('testsReview');
        if (!container) return;

        const tests = JSON.parse(localStorage.getItem('teacherTests')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        let totalTests = tests.length;
        let activeTests = tests.filter(test => test.isActive).length;
        let totalTestResults = 0;

        students.forEach(student => {
            const studentTests = JSON.parse(localStorage.getItem(`student_tests_${student.id}`)) || [];
            totalTestResults += studentTests.length;
        });

        const averageTestsPerStudent = students.length > 0 ? Math.round(totalTestResults / students.length) : 0;

        container.innerHTML = `
            <div class="review-summary">
                <h5>الاختبارات التشخيصية</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>الاختبارات المنشأة:</span>
                        <strong>${totalTests}</strong>
                    </div>
                    <div class="stat">
                        <span>الاختبارات النشطة:</span>
                        <strong>${activeTests}</strong>
                    </div>
                    <div class="stat">
                        <span>متوسط الاختبارات للطالب:</span>
                        <strong>${averageTestsPerStudent}</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على الاختبارات..." 
                              id="testsComments"></textarea>
                </div>
            </div>
        `;
    }

    loadStudentPlansReview() {
        const container = document.getElementById('plansReview');
        if (!container) return;

        const students = JSON.parse(localStorage.getItem('students')) || [];
        let studentsWithPlans = 0;
        let plansWithRecentUpdates = 0;

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        students.forEach(student => {
            const plan = JSON.parse(localStorage.getItem(`student_plan_${student.id}`)) || {};
            if (Object.keys(plan).length > 0) {
                studentsWithPlans++;
                if (plan.updatedAt && new Date(plan.updatedAt) > oneMonthAgo) {
                    plansWithRecentUpdates++;
                }
            }
        });

        const planCoverage = students.length > 0 ? Math.round((studentsWithPlans / students.length) * 100) : 0;
        const updateRate = studentsWithPlans > 0 ? Math.round((plansWithRecentUpdates / studentsWithPlans) * 100) : 0;

        container.innerHTML = `
            <div class="review-summary">
                <h5>خطط الطلاب</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>الطلاب ذوو الخطط:</span>
                        <strong>${studentsWithPlans}/${students.length}</strong>
                    </div>
                    <div class="stat">
                        <span>تغطية الخطط:</span>
                        <strong>${planCoverage}%</strong>
                    </div>
                    <div class="stat">
                        <span>خطط محدثة:</span>
                        <strong>${updateRate}%</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على خطط الطلاب..." 
                              id="plansComments"></textarea>
                </div>
            </div>
        `;
    }

    loadLessonsReview() {
        const container = document.getElementById('lessonsReview');
        if (!container) return;

        const lessons = JSON.parse(localStorage.getItem('teacherLessons')) || [];
        const activeLessons = lessons.filter(lesson => lesson.isActive);
        const lessonsWithStrategies = lessons.filter(lesson => lesson.strategy && lesson.strategy !== '');
        
        const strategyDiversity = this.calculateStrategyDiversity(lessons);

        container.innerHTML = `
            <div class="review-summary">
                <h5>الدروس والاستراتيجيات</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>إجمالي الدروس:</span>
                        <strong>${lessons.length}</strong>
                    </div>
                    <div class="stat">
                        <span>الدروس النشطة:</span>
                        <strong>${activeLessons.length}</strong>
                    </div>
                    <div class="stat">
                        <span>تنوع الاستراتيجيات:</span>
                        <strong>${strategyDiversity}</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على الدروس والاستراتيجيات..." 
                              id="lessonsComments"></textarea>
                </div>
            </div>
        `;
    }

    calculateStrategyDiversity(lessons) {
        const strategies = new Set();
        lessons.forEach(lesson => {
            if (lesson.strategy) {
                strategies.add(lesson.strategy);
            }
        });
        
        const diversity = strategies.size;
        if (diversity >= 5) return 'ممتاز';
        if (diversity >= 3) return 'جيد';
        if (diversity >= 1) return 'مقبول';
        return 'يحتاج تحسين';
    }

    loadActivitiesReview() {
        const container = document.getElementById('activitiesReview');
        if (!container) return;

        const activities = JSON.parse(localStorage.getItem('teacherActivities')) || [];
        const recentActivities = activities.filter(activity => {
            const activityDate = new Date(activity.date);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return activityDate > oneMonthAgo;
        });

        const activitiesWithAttachments = activities.filter(activity => activity.attachments && activity.attachments.length > 0);

        container.innerHTML = `
            <div class="review-summary">
                <h5>الأنشطة والدورات</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>إجمالي الأنشطة:</span>
                        <strong>${activities.length}</strong>
                    </div>
                    <div class="stat">
                        <span>أنشطة حديثة:</span>
                        <strong>${recentActivities.length}</strong>
                    </div>
                    <div class="stat">
                        <span>أنشطة بمرفقات:</span>
                        <strong>${activitiesWithAttachments.length}</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على الأنشطة والدورات..." 
                              id="activitiesComments"></textarea>
                </div>
            </div>
        `;
    }

    loadHandwritingReview() {
        const container = document.getElementById('handwritingReview');
        if (!container) return;

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

        const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
        const averageProgress = totalAssignments > 0 ? Math.round(totalProgress / totalAssignments) : 0;

        container.innerHTML = `
            <div class="review-summary">
                <h5>برنامج تحسين الخط</h5>
                <div class="review-stats">
                    <div class="stat">
                        <span>إجمالي التمارين:</span>
                        <strong>${totalAssignments}</strong>
                    </div>
                    <div class="stat">
                        <span>معدل الإنجاز:</span>
                        <strong>${completionRate}%</strong>
                    </div>
                    <div class="stat">
                        <span>متوسط التقدم:</span>
                        <strong>${averageProgress}%</strong>
                    </div>
                </div>
                <div class="review-comment">
                    <textarea class="form-control" placeholder="ملاحظات على برنامج تحسين الخط..." 
                              id="handwritingComments"></textarea>
                </div>
            </div>
        `;
    }

    setupChecklist() {
        const checklistItems = [
            { id: 'schedule_approved', label: 'الاطلاع والموافقة على جدول المعلم' },
            { id: 'tests_reviewed', label: 'الاطلاع على اختبارات الطلاب التشخيصية' },
            { id: 'plans_reviewed', label: 'الاطلاع على خطط الطلاب' },
            { id: 'lessons_reviewed', label: 'الاطلاع على الدروس والواجبات' },
            { id: 'activities_reviewed', label: 'الاطلاع على أنشطة ودورات المعلم' },
            { id: 'handwriting_reviewed', label: 'الاطلاع على تدريب تحسين الخط' },
            { id: 'reports_generated', label: 'إنشاء التقارير اللازمة' },
            { id: 'recommendations_added', label: 'إضافة التوصيات والملاحظات' }
        ];

        const container = document.getElementById('checklistContainer');
        if (!container) return;

        container.innerHTML = checklistItems.map(item => `
            <div class="checklist-item">
                <div class="checklist-label">${item.label}</div>
                <div class="checklist-action">
                    <input type="checkbox" id="${item.id}" class="checklist-checkbox">
                    <label for="${item.id}" class="checkbox-custom"></label>
                </div>
            </div>
        `).join('');

        this.loadSavedChecklist();
    }

    loadSavedChecklist() {
        const savedChecklist = JSON.parse(localStorage.getItem('committee_checklist')) || {};
        Object.keys(savedChecklist).forEach(itemId => {
            const checkbox = document.getElementById(itemId);
            if (checkbox) {
                checkbox.checked = savedChecklist[itemId];
            }
        });
    }

    saveChecklist() {
        const checklistItems = [
            'schedule_approved', 'tests_reviewed', 'plans_reviewed', 'lessons_reviewed',
            'activities_reviewed', 'handwriting_reviewed', 'reports_generated', 'recommendations_added'
        ];

        const checklistState = {};
        checklistItems.forEach(itemId => {
            const checkbox = document.getElementById(itemId);
            checklistState[itemId] = checkbox ? checkbox.checked : false;
        });

        localStorage.setItem('committee_checklist', JSON.stringify(checklistState));
        this.showNotification('تم حفظ القائمة', 'success');
    }

    addRecommendation() {
        const recommendationText = document.getElementById('recommendationText').value;
        if (!recommendationText.trim()) {
            alert('يرجى إدخال نص التوصية');
            return;
        }

        const recommendation = {
            id: Date.now().toString(),
            text: recommendationText,
            date: new Date().toISOString(),
            addedBy: this.committeeMember.name,
            priority: document.getElementById('recommendationPriority').value
        };

        this.saveRecommendation(recommendation);
        this.displayRecommendation(recommendation);
        document.getElementById('recommendationText').value = '';
    }

    saveRecommendation(recommendation) {
        const recommendations = JSON.parse(localStorage.getItem('committee_recommendations')) || [];
        recommendations.push(recommendation);
        localStorage.setItem('committee_recommendations', JSON.stringify(recommendations));
    }

    displayRecommendation(recommendation) {
        const container = document.getElementById('recommendationsList');
        if (!container) return;

        const priorityClass = this.getPriorityClass(recommendation.priority);
        const priorityText = this.getPriorityText(recommendation.priority);

        const recommendationEl = document.createElement('div');
        recommendationEl.className = `recommendation-item ${priorityClass}`;
        recommendationEl.innerHTML = `
            <div class="recommendation-content">
                <p>${recommendation.text}</p>
                <div class="recommendation-meta">
                    <span class="priority ${priorityClass}">${priorityText}</span>
                    <span class="date">${new Date(recommendation.date).toLocaleDateString('ar-SA')}</span>
                    <span class="author">${recommendation.addedBy}</span>
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">حذف</button>
        `;

        container.appendChild(recommendationEl);
    }

    getPriorityClass(priority) {
        const classes = {
            'high': 'priority-high',
            'medium': 'priority-medium',
            'low': 'priority-low'
        };
        return classes[priority] || 'priority-medium';
    }

    getPriorityText(priority) {
        const texts = {
            'high': 'عالي',
            'medium': 'متوسط',
            'low': 'منخفض'
        };
        return texts[priority] || 'متوسط';
    }

    loadRecommendations() {
        const container = document.getElementById('recommendationsList');
        if (!container) return;

        const recommendations = JSON.parse(localStorage.getItem('committee_recommendations')) || [];
        container.innerHTML = '';

        recommendations.forEach(recommendation => {
            this.displayRecommendation(recommendation);
        });
    }

    generateDetailedReport() {
        const report = this.compileDetailedReport();
        this.displayDetailedReport(report);
    }

    compileDetailedReport() {
        const scheduleComments = document.getElementById('scheduleComments')?.value || '';
        const testsComments = document.getElementById('testsComments')?.value || '';
        const plansComments = document.getElementById('plansComments')?.value || '';
        const lessonsComments = document.getElementById('lessonsComments')?.value || '';
        const activitiesComments = document.getElementById('activitiesComments')?.value || '';
        const handwritingComments = document.getElementById('handwritingComments')?.value || '';

        const checklist = JSON.parse(localStorage.getItem('committee_checklist')) || {};
        const recommendations = JSON.parse(localStorage.getItem('committee_recommendations')) || [];

        return {
            generatedAt: new Date().toISOString(),
            committeeMember: this.committeeMember,
            sections: {
                schedule: { comments: scheduleComments },
                tests: { comments: testsComments },
                plans: { comments: plansComments },
                lessons: { comments: lessonsComments },
                activities: { comments: activitiesComments },
                handwriting: { comments: handwritingComments }
            },
            checklist: checklist,
            recommendations: recommendations,
            summary: this.generateReportSummary()
        };
    }

    generateReportSummary() {
        const checklist = JSON.parse(localStorage.getItem('committee_checklist')) || {};
        const completedItems = Object.values(checklist).filter(item => item).length;
        const totalItems = Object.keys(checklist).length;
        const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
            completionRate,
            status: completionRate >= 80 ? 'مكتمل' : completionRate >= 50 ? 'قيد الإنجاز' : 'غير مكتمل',
            priorityRecommendations: this.countPriorityRecommendations()
        };
    }

    countPriorityRecommendations() {
        const recommendations = JSON.parse(localStorage.getItem('committee_recommendations')) || [];
        const highPriority = recommendations.filter(r => r.priority === 'high').length;
        const mediumPriority = recommendations.filter(r => r.priority === 'medium').length;
        const lowPriority = recommendations.filter(r => r.priority === 'low').length;

        return { high: highPriority, medium: mediumPriority, low: lowPriority };
    }

    displayDetailedReport(report) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>التقرير التفصيلي - ميسر التعلم</title>
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
                    .checklist-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .checklist-item:last-child {
                        border-bottom: none;
                    }
                    .checked {
                        color: #28a745;
                    }
                    .unchecked {
                        color: #dc3545;
                    }
                    .recommendation {
                        background: #f8f9fa;
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: 5px;
                        border-right: 4px solid #007bff;
                    }
                    .priority-high {
                        border-right-color: #dc3545;
                    }
                    .priority-medium {
                        border-right-color: #ffc107;
                    }
                    .priority-low {
                        border-right-color: #28a745;
                    }
                    .summary-stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .stat-box {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    @media print {
                        body { margin: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>التقرير التفصيلي للجنة صعوبات التعلم</h1>
                    <h3>موقع ميسر التعلم</h3>
                    <p>العضو: ${report.committeeMember.name} - ${report.committeeMember.role}</p>
                    <p>تم الإنشاء في: ${new Date(report.generatedAt).toLocaleDateString('ar-SA')}</p>
                </div>

                <div class="summary-stats">
                    <div class="stat-box">
                        <h3>${report.summary.completionRate}%</h3>
                        <p>معدل إنجاز المراجعة</p>
                    </div>
                    <div class="stat-box">
                        <h3>${report.summary.priorityRecommendations.high}</h3>
                        <p>توصيات عالية الأولوية</p>
                    </div>
                    <div class="stat-box">
                        <h3>${report.summary.status}</h3>
                        <p>حالة التقرير</p>
                    </div>
                </div>

                <div class="section">
                    <h3>القائمة التفقدية</h3>
                    ${Object.entries(report.checklist).map(([item, checked]) => `
                        <div class="checklist-item">
                            <span>${this.getChecklistItemLabel(item)}</span>
                            <span class="${checked ? 'checked' : 'unchecked'}">
                                ${checked ? '✓ مكتمل' : '✗ غير مكتمل'}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h3>الملاحظات والتوصيات</h3>
                    ${report.recommendations.map(rec => `
                        <div class="recommendation priority-${rec.priority}">
                            <p>${rec.text}</p>
                            <div class="recommendation-meta">
                                <strong>الأولوية:</strong> ${this.getPriorityText(rec.priority)} | 
                                <strong>التاريخ:</strong> ${new Date(rec.date).toLocaleDateString('ar-SA')} | 
                                <strong>أضيف بواسطة:</strong> ${rec.addedBy}
                            </div>
                        </div>
                    `).join('')}
                    
                    ${Object.entries(report.sections).map(([section, data]) => 
                        data.comments ? `
                            <div class="recommendation">
                                <p><strong>${this.getSectionName(section)}:</strong> ${data.comments}</p>
                            </div>
                        ` : ''
                    ).join('')}
                </div>

                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p>توقيع العضو: ___________________</p>
                    <p>الاسم: ${report.committeeMember.name}</p>
                    <p>التاريخ: ___________________</p>
                </div>

                <div style="text-align: center; margin-top: 30px;" class="no-print">
                    <button onclick="window.print()" style="padding: 10px 20px;">طباعة</button>
                    <button onclick="window.close()" style="padding: 10px 20px; margin-right: 10px;">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    getChecklistItemLabel(itemId) {
        const labels = {
            'schedule_approved': 'الاطلاع والموافقة على جدول المعلم',
            'tests_reviewed': 'الاطلاع على اختبارات الطلاب التشخيصية',
            'plans_reviewed': 'الاطلاع على خطط الطلاب',
            'lessons_reviewed': 'الاطلاع على الدروس والواجبات',
            'activities_reviewed': 'الاطلاع على أنشطة ودورات المعلم',
            'handwriting_reviewed': 'الاطلاع على تدريب تحسين الخط',
            'reports_generated': 'إنشاء التقارير اللازمة',
            'recommendations_added': 'إضافة التوصيات والملاحظات'
        };
        return labels[itemId] || itemId;
    }

    getSectionName(section) {
        const names = {
            'schedule': 'جدول المعلم',
            'tests': 'الاختبارات التشخيصية',
            'plans': 'خطط الطلاب',
            'lessons': 'الدروس والواجبات',
            'activities': 'الأنشطة والدورات',
            'handwriting': 'برنامج تحسين الخط'
        };
        return names[section] || section;
    }

    printChecklist() {
        const checklist = JSON.parse(localStorage.getItem('committee_checklist')) || {};
        const recommendations = JSON.parse(localStorage.getItem('committee_recommendations')) || [];

        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>القائمة التفقدية - ميسر التعلم</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; }
                    .checklist-item { margin: 15px 0; padding: 10px; border-bottom: 1px solid #eee; }
                    .checked { color: #28a745; }
                    .unchecked { color: #dc3545; }
                    @media print { body { margin: 20px; } }
                </style>
            </head>
            <body>
                <h1 style="text-align: center;">القائمة التفقدية للجنة</h1>
                <p style="text-align: center;">${new Date().toLocaleDateString('ar-SA')}</p>
                
                ${Object.entries(checklist).map(([item, checked]) => `
                    <div class="checklist-item">
                        <span>${this.getChecklistItemLabel(item)}</span>
                        <span class="${checked ? 'checked' : 'unchecked'}" style="float: left;">
                            ${checked ? '✓' : '✗'}
                        </span>
                    </div>
                `).join('')}
                
                ${recommendations.length > 0 ? `
                    <h2 style="margin-top: 40px;">التوصيات</h2>
                    ${recommendations.map(rec => `
                        <div class="checklist-item">
                            <p>${rec.text}</p>
                            <small>${this.getPriorityText(rec.priority)} - ${new Date(rec.date).toLocaleDateString('ar-SA')}</small>
                        </div>
                    `).join('')}
                ` : ''}
                
                <div style="margin-top: 50px;">
                    <p>التوقيع: ___________________</p>
                    <p>الاسم: ${this.committeeMember.name}</p>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()">طباعة</button>
                    <button onclick="window.close()" style="margin-right: 10px;">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة نظام التقارير للجنة
let committeeReports;
document.addEventListener('DOMContentLoaded', function() {
    committeeReports = new CommitteeReports();
    committeeReports.loadRecommendations();
});