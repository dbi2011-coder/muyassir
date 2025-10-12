class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('muyassir_initialized')) {
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        const users = [
            { id: 1, username: 'owner', password: 'admin123', role: 'owner', name: 'مالك النظام', email: 'owner@muyassir.com', phone: '0500000000' },
            { id: 2, username: 'teacher1', password: 'teach123', role: 'teacher', name: 'المعلم أحمد', email: 'ahmed@school.com', phone: '0500000001' },
            { id: 3, username: 'student1', password: 'stud123', role: 'student', name: 'الطالب سامي', email: 'sami@student.com', phone: '0500000002' },
            { id: 4, username: 'committee1', password: 'comm123', role: 'committee', name: 'عضو اللجنة ليلى', email: 'layla@committee.com', phone: '0500000003' }
        ];

        localStorage.setItem('muyassir_users', JSON.stringify(users));
        localStorage.setItem('muyassir_initialized', 'true');

        console.log('تم تهيئة بيانات المستخدمين الافتراضية لأربعة أدوار.');
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
