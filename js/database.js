class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('muyassir_users')) {
            this.initializeOwnersOnly();
        }
    }

    initializeOwnersOnly() {
        // بيانات حساب مالك واحد فقط بدون حسابات تجريبية
        const users = [
            {
                id: 1,
                username: 'owner',
                password: 'admin123',
                role: 'teacher', // صلاحيات مالك النظام كمعلم
                name: 'مالك النظام',
                email: 'owner@muyassir.com',
                phone: '0500000000'
            }
        ];

        // تهيئة بيانات فارغة للفئات الأخرى
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

        console.log('تم تهيئة قاعدة البيانات بحساب مالك واحد فقط.');
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('muyassir_users') || '[]');
    }

    // دوال أخرى حسب الحاجة مثل إضافة وحذف المستخدمين...
}

const database = new Database();
