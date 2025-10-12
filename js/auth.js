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

        switch(role) {
            case 'owner':
                window.location.href = 'owner/dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher/dashboard.html';
                break;
            case 'student':
                window.location.href = 'student/dashboard.html';
                break;
            case 'committee':
                window.location.href = 'committee/dashboard.html';
                break;
            default:
                alert('دور المستخدم غير معروف!');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
