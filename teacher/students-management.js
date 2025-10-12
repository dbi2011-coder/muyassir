// إدارة الطلاب
class StudentsManager {
    constructor() {
        this.database = database;
        this.auth = auth;
        this.currentEditId = null;
        this.init();
    }

    init() {
        if (!this.auth.protectPage('teacher')) {
            return;
        }

        this.loadStudents();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // تسجيل الخروج
        document.querySelector('.logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });

        // البحث عن الطلاب
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'بحث عن طالب...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        document.querySelector('.table-actions').prepend(searchInput);
    }

    loadStudents() {
        const students = this.database.getStudents();
        this.displayStudents(students);
        this.updateStudentsCount(students.length);
    }

    displayStudents(students) {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <div style="text-align: center; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">👨‍🎓</div>
                            <p>لا توجد طلاب مسجلين بعد</p>
                            <button class="btn btn-primary" onclick="studentsManager.showAddForm()">
                                إضافة أول طالب
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        students.forEach((student, index) => {
            const row = this.createStudentRow(student, index + 1);
            tbody.appendChild(row);
        });
    }

    createStudentRow(student, index) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index}</td>
            <td>
                <div class="student-info-cell">
                    <div class="student-avatar">👨‍🎓</div>
                    <div>
                        <strong>${student.name}</strong>
                        <div class="student-meta">${student.email || 'لا يوجد بريد'}</div>
                    </div>
                </div>
            </td>
            <td>${student.username}</td>
            <td>${this.getGradeName(student.grade)}</td>
            <td>
                <span class="item-status status-active">${student.status === 'active' ? 'نشط' : 'غير نشط'}</span>
            </td>
            <td>${Utils.formatDate(student.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="studentsManager.editStudent(${student.id})" title="تعديل">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="studentsManager.viewStudent(${student.id})" title="عرض">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="studentsManager.deleteStudent(${student.id})" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    showAddForm() {
        this.currentEditId = null;
        document.getElementById('studentFormTitle').textContent = 'إضافة طالب جديد';
        document.getElementById('studentForm').reset();
        document.getElementById('studentFormModal').classList.add('active');
    }

    hideForm() {
        document.getElementById('studentFormModal').classList.remove('active');
        this.currentEditId = null;
    }

    editStudent(studentId) {
        const student = this.database.findStudentById(studentId);
        if (!student) {
            Utils.showNotification('الطالب غير موجود', 'error');
            return;
        }

        this.currentEditId = studentId;
        document.getElementById('studentFormTitle').textContent = 'تعديل بيانات الطالب';
        
        // تعبئة النموذج بالبيانات
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentUsername').value = student.username;
        document.getElementById('studentPassword').value = student.password;
        document.getElementById('studentGrade').value = student.grade;
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentNotes').value = student.notes || '';

        document.getElementById('studentFormModal').classList.add('active');
    }

    async saveStudent(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const studentData = {
            name: formData.get('name'),
            username: formData.get('username'),
            password: formData.get('password'),
            grade: formData.get('grade'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            notes: formData.get('notes'),
            status: 'active',
            teacher_id: this.auth.getCurrentUser().id
        };

        // التحقق من صحة البيانات
        if (!this.validateStudentData(studentData)) {
            return;
        }

        try {
            if (this.currentEditId) {
                // تحديث الطالب الموجود
                const updatedStudent = this.database.updateStudent(this.currentEditId, studentData);
                if (updatedStudent) {
                    Utils.showNotification('تم تحديث بيانات الطالب بنجاح', 'success');
                }
            } else {
                // إضافة طالب جديد
                const newStudent = this.database.addStudent(studentData);
                if (newStudent) {
                    Utils.showNotification('تم إضافة الطالب بنجاح', 'success');
                }
            }

            this.hideForm();
            this.loadStudents();
            
        } catch (error) {
            Utils.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
            console.error('Error saving student:', error);
        }
    }

    validateStudentData(data) {
        if (!data.name.trim()) {
            Utils.showNotification('يرجى إدخال اسم الطالب', 'error');
            return false;
        }

        if (!data.username.trim()) {
            Utils.showNotification('يرجى إدخال اسم المستخدم', 'error');
            return false;
        }

        if (!data.password) {
            Utils.showNotification('يرجى إدخال كلمة المرور', 'error');
            return false;
        }

        if (data.password.length < 6) {
            Utils.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return false;
        }

        // التحقق من عدم تكرار اسم المستخدم
        const students = this.database.getStudents();
        const existingStudent = students.find(s => 
            s.username === data.username && s.id !== this.currentEditId
        );
        
        if (existingStudent) {
            Utils.showNotification('اسم المستخدم موجود مسبقاً', 'error');
            return false;
        }

        return true;
    }

    async deleteStudent(studentId) {
        const student = this.database.findStudentById(studentId);
        if (!student) return;

        const confirmed = await Utils.showConfirmation(
            `هل أنت متأكد من حذف الطالب "${student.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const success = this.database.deleteStudent(studentId);
            if (success) {
                Utils.showNotification('تم حذف الطالب بنجاح', 'success');
                this.loadStudents();
            } else {
                Utils.showNotification('حدث خطأ أثناء حذف الطالب', 'error');
            }
        }
    }

    viewStudent(studentId) {
        // في التطبيق الحقيقي، سيتم توجيه المستخدم لصفحة الطالب
        Utils.showNotification('سيتم فتح صفحة الطالب', 'info');
        // window.location.href = `student-profile.html?id=${studentId}`;
    }

    searchStudents(query) {
        const students = this.database.getStudents();
        const filteredStudents = students.filter(student =>
            student.name.includes(query) ||
            student.username.includes(query) ||
            student.grade.includes(query)
        );
        this.displayStudents(filteredStudents);
        this.updateStudentsCount(filteredStudents.length);
    }

    updateStudentsCount(count) {
        document.getElementById('studentsCount').textContent = count;
    }

    getGradeName(grade) {
        const grades = {
            'first': 'الأول الابتدائي',
            'second': 'الثاني الابتدائي',
            'third': 'الثالث الابتدائي',
            'fourth': 'الرابع الابتدائي',
            'fifth': 'الخامس الابتدائي',
            'sixth': 'السادس الابتدائي'
        };
        return grades[grade] || grade;
    }

    exportStudents() {
        const students = this.database.getStudents();
        const exportData = students.map(student => ({
            'اسم الطالب': student.name,
            'اسم المستخدم': student.username,
            'الصف الدراسي': this.getGradeName(student.grade),
            'البريد الإلكتروني': student.email || '',
            'رقم الهاتف': student.phone || '',
            'تاريخ التسجيل': Utils.formatDate(student.created_at),
            'الحالة': student.status === 'active' ? 'نشط' : 'غير نشط'
        }));

        Utils.exportToJSON(exportData, `طلاب_ميسر_التعلم_${new Date().toISOString().split('T')[0]}.json`);
        Utils.showNotification('تم تصدير بيانات الطلاب بنجاح', 'success');
    }
}

// إنشاء نسخة من مدير الطلاب
const studentsManager = new StudentsManager();