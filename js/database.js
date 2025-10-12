class Database {
    constructor() {
        this.init();
    }

    init() {
        // حذف الحسابات السابقة واعادة التهيئة بسجل المالك فقط
        localStorage.clear();

        this.initializeOwnerOnly();
    }

    initializeOwnerOnly() {
        const users = [
            {
                id: 1,
                username: 'owner',
                password: 'admin123',
                role: 'owner',
                name: 'مالك النظام',
                email: 'owner@muyassir.com',
                phone: '0500000000'
            }
        ];
        localStorage.setItem('muyassir_users', JSON.stringify(users));
        localStorage.setItem('muyassir_students', JSON.stringify([]));
        localStorage.setItem('muyassir_tests', JSON.stringify([]));
        localStorage.setItem('muyassir_lessons', JSON.stringify([]));
        localStorage.setItem('muyassir_homework', JSON.stringify([]));
        localStorage.setItem('muyassir_activities', JSON.stringify([]));
        localStorage.setItem('muyassir_schedule', JSON.stringify([]));
        localStorage.setItem('muyassir_handwriting', JSON.stringify([]));
        localStorage.setItem('muyassir_rewards', JSON.stringify([]));
        localStorage.setItem('muyassir_initialized', 'true');

        console.log('تم تهيئة قاعدة البيانات بحساب مالك النظام فقط.');
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
