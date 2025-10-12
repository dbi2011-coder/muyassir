class Auth {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.init();
    }

    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
    }

    login() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const roleSelect = document.getElementById('role');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const role = roleSelect.value;

        const user = database.findUser(username, password, role);

        if (!user) {
            alert('بيانات الدخول غير صحيحة! يرجى المحاولة مرة أخرى.');
            return;
        }

        // حفظ المستخدم الحالي في LocalStorage (للعدم فقدان الحالة)
        localStorage.setItem('currentUser', JSON.stringify(user));

        alert(`مرحباً، ${user.name}! تم تسجيل الدخول بنجاح.`);

        // تحويل المستخدم للصفحة المناسبة بناء على الدور
        if (role === 'teacher') {
            window.location.href = 'teacher/dashboard.html';
        } else if (role === 'student') {
            window.location.href = 'student/dashboard.html';
        } else if (role === 'committee') {
            window.location.href = 'committee/dashboard.html';
        } else {
            // حال لم يكن الدور معروف
            alert('نوع الحساب غير معروف');
        }
    }
}

// تهيئة كائن التوثيق فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
