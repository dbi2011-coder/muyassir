class Auth {
    constructor() {
        this.currentUser = this.getCurrentUser();
    }

    login(username, password, role) {
        const user = database.findUser(username, password);
        
        if (user && user.role === role) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUser = user;
            this.showNotification('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => this.redirectToDashboard(user.role), 1000);
            return true;
        }
        
        this.showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        return false;
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = '../index.html';
    }

    getCurrentUser() {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    protectPage(requiredRole) {
        if (!this.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }

        if (requiredRole && !this.hasRole(requiredRole)) {
            window.location.href = '../index.html';
            return false;
        }

        return true;
    }

    redirectToDashboard(role) {
        const pages = {
            'teacher': 'teacher/dashboard.html',
            'student': 'student/dashboard.html',
            'committee': 'committee/dashboard.html'
        };
        window.location.href = pages[role] || 'index.html';
    }

    showNotification(message, type = 'info', duration = 3000) {
        // إزالة الإشعارات القديمة
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        // إنشاء إشعار جديد
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            z-index: 1001;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

        // ألوان حسب النوع
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;

        // إضافة الإشعار للصفحة
        document.body.appendChild(notification);

        // إخفاء الإشعار تلقائياً
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);

        // إمكانية إغلاق الإشعار بالنقر
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
    }
}

const auth = new Auth();

// معالجة نموذج تسجيل الدخول
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        auth.login(username, password, role);
    });
}

// حماية الصفحات
function protectPage(requiredRole) {
    return auth.protectPage(requiredRole);
}