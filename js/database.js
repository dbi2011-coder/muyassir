class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('muyassir_initialized')) {
            localStorage.setItem('muyassir_users', JSON.stringify([]));
            localStorage.setItem('muyassir_initialized', 'true');
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('muyassir_users') || '[]');
    }

    findUser(username, password, role) {
        const users = this.getUsers();
        return users.find(user => user.username === username && user.password === password && user.role === role);
    }

    saveUsers(users) {
        localStorage.setItem('muyassir_users', JSON.stringify(users));
    }
}

const database = new Database();
