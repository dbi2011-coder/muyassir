class Utils {
    static showNotification(message, type = 'info', duration = 5000) {
        auth.showNotification(message, type, duration);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return date.toLocaleDateString('ar-SA', options);
    }

    static formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static getGradeName(grade) {
        const grades = {
            'first': 'الصف الأول',
            'second': 'الصف الثاني', 
            'third': 'الصف الثالث',
            'fourth': 'الصف الرابع',
            'fifth': 'الصف الخامس',
            'sixth': 'الصف السادس'
        };
        return grades[grade] || grade;
    }

    static getSubjectName(subject) {
        const subjects = {
            'reading': 'القراءة',
            'writing': 'الكتابة',
            'math': 'الرياضيات',
            'skills': 'المهارات'
        };
        return subjects[subject] || subject;
    }

    static showLoading(message = 'جاري التحميل...') {
        this.hideLoading();

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .loading-content {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(loadingDiv);

        return loadingDiv;
    }

    static hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    static confirm(message) {
        return new Promise((resolve) => {
            // في بيئة حقيقية، استخدم SweetAlert أو مكتبة مشابهة
            const confirmed = confirm(message);
            resolve(confirmed);
        });
    }

    static exportToJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    static importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}