// لوحة تحكم المعلم
class TeacherDashboard {
    constructor() {
        this.database = database;
        this.auth = auth;
        this.init();
    }

    init() {
        // التحقق من صلاحية المستخدم
        if (!this.auth.protectPage('teacher')) {
            return;
        }

        this.loadDashboardData();
        this.setupEventListeners();
        this.displayUserInfo();
    }

    setupEventListeners() {
        // تسجيل الخروج
        document.querySelector('.logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });

        // تحديث البيانات كل 30 ثانية
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    displayUserInfo() {
        const user = this.auth.getCurrentUser();
        if (user) {
            document.querySelector('.user-info span').textContent = `مرحباً، ${user.name}`;
        }
    }

    loadDashboardData() {
        this.loadStatistics();
        this.loadRecentStudents();
        this.loadRecentTests();
    }

    loadStatistics() {
        const students = this.database.getStudents();
        const tests = this.database.getTests();
        const lessons = this.database.getLessons();
        const homework = this.database.getHomework();

        // تحديث الإحصائيات
        document.getElementById('students-count').textContent = students.length;
        document.getElementById('tests-count').textContent = tests.length;
        document.getElementById('lessons-count').textContent = lessons.length;
        document.getElementById('homework-count').textContent = homework.length;
    }

    loadRecentStudents() {
        const students = this.database.getStudents();
        const recentStudents = students.slice(-5).reverse(); // آخر 5 طلاب
        
        const container = document.getElementById('recent-students');
        container.innerHTML = '';

        if (recentStudents.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد طلاب مسجلين بعد</p>';
            return;
        }

        recentStudents.forEach(student => {
            const studentElement = this.createStudentElement(student);
            container.appendChild(studentElement);
        });
    }

    createStudentElement(student) {
        const div = document.createElement('div');
        div.className = 'student-item';
        
        div.innerHTML = `
            <div class="item-info">
                <h4>${student.name}</h4>
                <p>الصف: ${student.grade} | المستوى: ${this.getStudentLevel(student)}</p>
            </div>
            <div class="item-status status-active">نشط</div>
        `;

        return div;
    }

    loadRecentTests() {
        const tests = this.database.getTests();
        const recentTests = tests.slice(-5).reverse(); // آخر 5 اختبارات
        
        const container = document.getElementById('recent-tests');
        container.innerHTML = '';

        if (recentTests.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد اختبارات بعد</p>';
            return;
        }

        recentTests.forEach(test => {
            const testElement = this.createTestElement(test);
            container.appendChild(testElement);
        });
    }

    createTestElement(test) {
        const div = document.createElement('div');
        div.className = 'test-item';
        
        div.innerHTML = `
            <div class="item-info">
                <h4>${test.title}</h4>
                <p>الصف: ${this.getGradeName(test.grade)} | عدد الأسئلة: ${test.questions.length}</p>
            </div>
            <div class="item-status status-active">نشط</div>
        `;

        return div;
    }

    getStudentLevel(student) {
        if (!student.diagnostic_results || Object.keys(student.diagnostic_results).length === 0) {
            return 'لم يتم التشخيص';
        }
        
        const scores = Object.values(student.diagnostic_results);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        if (average >= 80) return 'متميز';
        if (average >= 60) return 'متوسط';
        return 'يحتاج دعم';
    }

    getGradeName(grade) {
        const grades = {
            'first': 'الأول الابتدائي',
            'second': 'الثاني الابتدائي',
            'third': 'الثالث الابتدائي',
            'fourth': 'الرابع الابتدائي',
            'fifth': 'الخامس الابتدائي',
            'sixth': 'السادس الابتدائي'
        };
        
        return grades[grade] || grade;
    }
}

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new TeacherDashboard();
});