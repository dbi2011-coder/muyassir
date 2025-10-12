class TeachersManager {
    constructor() {
        this.currentEditId = null;
        this.init();
    }

    init() {
        // حماية الصفحات بإذن فقط للمعلمين
        if (!auth.protectPage('teacher')) return;
        this.loadTeachers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', auth.logout.bind(auth));
        document.getElementById('addTeacherBtn')?.addEventListener('click', this.showAddForm.bind(this));
        document.getElementById('teacherForm').addEventListener('submit', this.saveTeacher.bind(this));
    }

    loadTeachers() {
        const teachers = database.getUsers().filter(u => u.role === 'teacher');
        this.displayTeachers(teachers);
    }

    displayTeachers(teachers) {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color:#666;">لا يوجد معلمون مسجلون</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        teachers.forEach(teacher => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td>${teacher.username}</td>
                <td>${teacher.email || ''}</td>
                <td>${teacher.phone || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="teachersManager.editTeacher(${teacher.id})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="teachersManager.deleteTeacher(${teacher.id})">حذف</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    showAddForm() {
        this.currentEditId = null;
        document.getElementById('teacherFormTitle').textContent = "إضافة معلم جديد";
        document.getElementById('teacherForm').reset();
        document.getElementById('teacherFormModal').classList.add('active');
    }

    hideForm() {
        document.getElementById('teacherFormModal').classList.remove('active');
    }

    saveTeacher(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const teacherData = {
            name: formData.get('name').trim(),
            username: formData.get('username').trim(),
            password: formData.get('password').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            role: 'teacher'
        };

        // تحقق من صحة البيانات
        if (!teacherData.name || !teacherData.username || !teacherData.password) {
            auth.showNotification('يرجى تعبئة جميع الحقول الإلزامية', 'error');
            return;
        }

        if (teacherData.password.length < 6) {
            auth.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        // تحقق من وجود اسم مستخدم مسبقًا
        if (database.isUsernameTaken(teacherData.username) && this.currentEditId !== teacherData.id) {
            auth.showNotification('اسم المستخدم محجوز مسبقًا', 'error');
            return;
        }

        if (this.currentEditId) {
            const updated = database.updateUser(this.currentEditId, teacherData);
            if (updated) {
                auth.showNotification('تم تعديل بيانات المعلم بنجاح', 'success');
            }
        } else {
            const newTeacher = database.addUser(teacherData);
            if (newTeacher) {
                auth.showNotification('تم إضافة المعلم الجديد بنجاح', 'success');
            }
        }
        this.hideForm();
        this.loadTeachers();
    }

    editTeacher(id) {
        const teacher = database.getUsers().find(u => u.role === 'teacher' && u.id === id);
        if (!teacher) return;
        this.currentEditId = teacher.id;
        document.getElementById('teacherFormTitle').textContent = "تعديل بيانات المعلم";
        document.getElementById('name').value = teacher.name;
        document.getElementById('username').value = teacher.username;
        document.getElementById('password').value = teacher.password;
        document.getElementById('email').value = teacher.email || '';
        document.getElementById('phone').value = teacher.phone || '';
        document.getElementById('teacherFormModal').classList.add('active');
    }

    deleteTeacher(id) {
        if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
            database.deleteUser(id);
            auth.showNotification('تم حذف المعلم بنجاح', 'success');
            this.loadTeachers();
        }
    }
}

// أنشئ كائن مدير المعلمين لاستخدامه في الصفحة
const teachersManager = new TeachersManager();
