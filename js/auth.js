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
        const displayName = user.name || user.username;
        this.showMessage(`مرحباً أ / ${displayName}! جاري التحويل...`, true);

        setTimeout(() => {
            let redirectPage = '';
            switch(role) {
                case 'owner':
                    redirectPage = 'owner/manage-users.html';
                    break;
                case 'teacher':
                    redirectPage = 'teacher/dashboard.html';
                    break;
                case 'student':
                    redirectPage = 'student/dashboard.html';
                    break;
                case 'committee':
                    redirectPage = 'committee/dashboard.html';
                    break;
                default:
                    this.showMessage('دور المستخدم غير معروف!', false);
                    return;
            }
            window.location.href = redirectPage;
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
