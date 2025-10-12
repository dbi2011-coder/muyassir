class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('muyassir_initialized')) {
            // تهيئة قاعدة البيانات بدون حسابات تجريبية
            localStorage.setItem('muyassir_users', JSON.stringify([]));
            localStorage.setItem('muyassir_students', JSON.stringify([]));
            localStorage.setItem('muyassir_tests', JSON.stringify([]));
            localStorage.setItem('muyassir_lessons', JSON.stringify([]));
            localStorage.setItem('muyassir_homework', JSON.stringify([]));
            localStorage.setItem('muyassir_activities', JSON.stringify([]));
            localStorage.setItem('muyassir_schedule', JSON.stringify([]));
            localStorage.setItem('muyassir_handwriting', JSON.stringify([]));
            localStorage.setItem('muyassir_rewards', JSON.stringify([]));
            localStorage.setItem('muyassir_initialized', 'true');
            console.log('تم تهيئة قاعدة بيانات فارغة بدون حسابات.');
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('muyassir_users') || '[]');
    }

    findUser(username, password, role) {
        const users = this.getUsers();
        return users.find(user => user.username === username && user.password === password && user.role === role);
    }
}

const database = new Database();
