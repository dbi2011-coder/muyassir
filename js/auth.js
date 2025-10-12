class Auth {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.messageDiv = document.getElementById('message');
        this.init();
    }

    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', e => {
                e.preventDefault();
                this.login();
            });
        }
    }

    clearMessage() {
        this.messageDiv.textContent = '';
        this.messageDiv.className = 'message';
    }

    showMessage(text, isSuccess) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
    }

    login() {
        this.clearMessage();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        const user = database.findUser(username, password, role);

        if (!user) {
            this.showMessage('بيانات الدخول غير صحيحة!', false);
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showMessage(`مرحباً ${user.name}! جاري التحويل...`, true);

        setTimeout(() => {
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
                    this.showMessage('دور المستخدم غير معروف!', false);
            }
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
