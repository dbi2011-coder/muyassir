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
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        const user = database.findUser(username, password, role);

        if (!user) {
            alert('بيانات الدخول غير صحيحة!');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        alert(`مرحباً ${user.name}!`);

        if (role === 'owner') {
            window.location.href = 'owner/dashboard.html'; // صفحة المالك
        } else {
            alert('هذا النظام مخصص حالياً فقط لحساب المالك.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
