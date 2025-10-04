class ScheduleManager {
    constructor() {
        this.schedule = JSON.parse(localStorage.getItem('teacherSchedule')) || this.getDefaultSchedule();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderSchedule();
        this.loadStudentsForScheduling();
    }

    bindEvents() {
        document.getElementById('saveScheduleBtn')?.addEventListener('click', () => this.saveSchedule());
        document.getElementById('addSessionBtn')?.addEventListener('click', () => this.showAddSessionModal());
        document.getElementById('saveSessionBtn')?.addEventListener('click', () => this.saveSession());
        document.getElementById('printScheduleBtn')?.addEventListener('click', () => this.printSchedule());
    }

    getDefaultSchedule() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
        const defaultSchedule = {};
        
        days.forEach(day => {
            defaultSchedule[day] = Array(7).fill().map((_, index) => ({
                period: index + 1,
                subject: '',
                students: [],
                room: ''
            }));
        });
        
        return defaultSchedule;
    }

    renderSchedule() {
        const container = document.getElementById('scheduleContainer');
        if (!container) return;

        let html = '<div class="schedule-grid">';
        
        // رأس الجدول
        html += '<div class="schedule-header">';
        html += '<div class="time-slot">الحصة</div>';
        html += '<div class="day">الأحد</div>';
        html += '<div class="day">الاثنين</div>';
        html += '<div class="day">الثلاثاء</div>';
        html += '<div class="day">الأربعاء</div>';
        html += '<div class="day">الخميس</div>';
        html += '</div>';

        // الصفوف (الحصص)
        for (let period = 1; period <= 7; period++) {
            html += `<div class="schedule-row" data-period="${period}">`;
            html += `<div class="time-slot">الحصة ${period}<br>${this.getPeriodTime(period)}</div>`;
            
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(day => {
                const session = this.schedule[day]?.find(s => s.period === period) || {};
                html += `
                    <div class="session-cell ${session.subject ? 'occupied' : 'empty'}" 
                         data-day="${day}" 
                         data-period="${period}"
                         onclick="scheduleManager.editSession('${day}', ${period})">
                        ${session.subject ? `
                            <div class="session-info">
                                <strong>${session.subject}</strong>
                                <small>${session.students.length} طالب</small>
                                ${session.room ? `<br><small>${session.room}</small>` : ''}
                            </div>
                        ` : '<span class="text-muted">إضافة حصة</span>'}
                    </div>
                `;
            });
            
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    getPeriodTime(period) {
        const times = {
            1: '07:30 - 08:15',
            2: '08:15 - 09:00',
            3: '09:00 - 09:45',
            4: '10:00 - 10:45',
            5: '10:45 - 11:30',
            6: '11:30 - 12:15',
            7: '12:15 - 13:00'
        };
        return times[period] || '';
    }

    showAddSessionModal() {
        document.getElementById('sessionModal').style.display = 'block';
        this.clearSessionForm();
    }

    hideSessionModal() {
        document.getElementById('sessionModal').style.display = 'none';
    }

    editSession(day, period) {
        const session = this.schedule[day]?.find(s => s.period === period) || {
            day: day,
            period: period,
            subject: '',
            students: [],
            room: ''
        };

        this.showAddSessionModal();
        this.fillSessionForm(session);
    }

    fillSessionForm(session) {
        document.getElementById('sessionDay').value = session.day;
        document.getElementById('sessionPeriod').value = session.period;
        document.getElementById('sessionSubject').value = session.subject;
        document.getElementById('sessionRoom').value = session.room;
        
        // تعيين الطلاب المختارين
        const studentSelect = document.getElementById('sessionStudents');
        Array.from(studentSelect.options).forEach(option => {
            option.selected = session.students.includes(option.value);
        });
    }

    clearSessionForm() {
        document.getElementById('sessionDay').value = 'sunday';
        document.getElementById('sessionPeriod').value = '1';
        document.getElementById('sessionSubject').value = '';
        document.getElementById('sessionRoom').value = '';
        
        const studentSelect = document.getElementById('sessionStudents');
        Array.from(studentSelect.options).forEach(option => {
            option.selected = false;
        });
    }

    saveSession() {
        const day = document.getElementById('sessionDay').value;
        const period = parseInt(document.getElementById('sessionPeriod').value);
        const subject = document.getElementById('sessionSubject').value;
        const room = document.getElementById('sessionRoom').value;
        
        const studentSelect = document.getElementById('sessionStudents');
        const students = Array.from(studentSelect.selectedOptions).map(option => option.value);

        if (!subject) {
            alert('يرجى إدخال اسم المادة');
            return;
        }

        // البحث عن الجلسة الحالية أو إنشاء جديدة
        const sessionIndex = this.schedule[day]?.findIndex(s => s.period === period);
        const session = {
            day: day,
            period: period,
            subject: subject,
            students: students,
            room: room
        };

        if (sessionIndex > -1) {
            this.schedule[day][sessionIndex] = session;
        } else {
            this.schedule[day].push(session);
        }

        localStorage.setItem('teacherSchedule', JSON.stringify(this.schedule));
        this.renderSchedule();
        this.hideSessionModal();
        this.showNotification('تم حفظ الحصة بنجاح', 'success');
    }

    loadStudentsForScheduling() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const select = document.getElementById('sessionStudents');
        
        if (select) {
            select.innerHTML = students.map(student => `
                <option value="${student.id}">${student.name} - الصف ${student.grade}</option>
            `).join('');
        }
    }

    saveSchedule() {
        localStorage.setItem('teacherSchedule', JSON.stringify(this.schedule));
        this.showNotification('تم حفظ الجدول بنجاح', 'success');
    }

    printSchedule() {
        const printWindow = window.open('', '_blank');
        const scheduleHTML = this.generatePrintableSchedule();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>جدول المعلم - ميسر التعلم</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; }
                    .schedule-table { width: 100%; border-collapse: collapse; }
                    .schedule-table th, .schedule-table td { 
                        border: 1px solid #ddd; 
                        padding: 10px; 
                        text-align: center; 
                    }
                    .schedule-table th { background: #f8f9fa; }
                    .session-cell { min-height: 60px; }
                    .occupied { background: #e3f2fd; }
                    .empty { background: #f8f9fa; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${scheduleHTML}
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()">طباعة</button>
                    <button onclick="window.close()">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    generatePrintableSchedule() {
        const teacher = JSON.parse(localStorage.getItem('currentTeacher'));
        let html = `
            <div class="print-header">
                <h2>جدول المعلم: ${teacher?.name || 'أ/ صالح العجلان'}</h2>
                <p>ميسر التعلم - صعوبات التعلم</p>
                <p>الفصل الدراسي: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
            </div>
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>الحصة/اليوم</th>
                        <th>الأحد</th>
                        <th>الاثنين</th>
                        <th>الثلاثاء</th>
                        <th>الأربعاء</th>
                        <th>الخميس</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (let period = 1; period <= 7; period++) {
            html += `<tr><th>الحصة ${period}<br>${this.getPeriodTime(period)}</th>`;
            
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(day => {
                const session = this.schedule[day]?.find(s => s.period === period) || {};
                html += `
                    <td class="session-cell ${session.subject ? 'occupied' : 'empty'}">
                        ${session.subject ? `
                            <strong>${session.subject}</strong><br>
                            <small>${session.students.length} طالب</small>
                            ${session.room ? `<br><small>${session.room}</small>` : ''}
                        ` : '-'}
                    </td>
                `;
            });
            
            html += '</tr>';
        }

        html += '</tbody></table>';
        return html;
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

    getTodaysSchedule() {
        const today = new Date().getDay();
        const dayMap = {0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday'};
        const todayKey = dayMap[today];
        
        return this.schedule[todayKey] || [];
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

// تهيئة مدير الجدول عند تحميل الصفحة
let scheduleManager;
document.addEventListener('DOMContentLoaded', function() {
    scheduleManager = new ScheduleManager();
});