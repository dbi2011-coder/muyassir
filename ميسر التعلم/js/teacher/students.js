class StudentsManager {
    constructor() {
        this.currentEditId = null;
        this.init();
    }

    init() {
        if (!auth.protectPage('teacher')) return;
        this.loadStudents();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector('.logout-btn')?.addEventListener('click', () => auth.logout());
        
        // البحث
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 ابحث عن طالب...';
        searchInput.style.cssText = 'padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px; width: 250px;';
        searchInput.addEventListener('input', (e) => this.searchStudents(e.target.value));
        
        document.querySelector('.table-actions').prepend(searchInput);
    }

    loadStudents() {
        const students = database.getStudents();
        this.displayStudents(students);
    }

    displayStudents(students) {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">👨‍🎓</div>
                        <p>لا توجد طلاب مسجلين بعد</p>
                        <button class="btn btn-primary" onclick="studentsManager.showAddForm()" style="margin-top: 1rem;">
                            إضافة أول طالب
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = this.createStudentRow(student);
            tbody.appendChild(row);
        });
    }

    createStudentRow(student) {
        const row = document.createElement('tr');
        
        const averageScore = this.calculateAverageScore(student);
        const gradeName = Utils.getGradeName(student.grade);
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 40px; height: 40px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">👨‍🎓</div>
                    <div>
                        <strong>${student.name}</strong>
                        <div style="font-size: 0.8rem; color: #666;">@${student.username}</div>
                    </div>
                </div>
            </td>
            <td>${gradeName}</td>
            <td>
                <div style="text-align: center;">
                    <strong style="color: #e67e22;">${student.points}</strong>
                    <div style="font-size: 0.8rem; color: #666;">نقطة</div>
                </div>
            </td>
            <td>
                <div style="text-align: center;">
                    <strong style="color: #27ae60;">${averageScore}%</strong>
                    <div style="font-size: 0.8rem; color: #666;">متوسط</div>
                </div>
            </td>
            <td><span class="status-badge ${student.status}">${student.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
            <td>
                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-outline" onclick="studentsManager.viewStudent(${student.id})" title="عرض الملف">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="studentsManager.editStudent(${student.id})" title="تعديل">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="studentsManager.deleteStudent(${student.id})" title="حذف">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    calculateAverageScore(student) {
        const scores = Object.values(student.diagnostic_results || {});
        if (scores.length === 0) return 0;
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return Math.round(average);
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

    async saveStudent(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentData = {
            name: formData.get('name'),
            username: formData.get('username'),
            password: formData.get('password'),
            grade: formData.get('grade'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        if (this.validateStudentData(studentData)) {
            try {
                if (this.currentEditId) {
                    // تحديث الطالب
                    const updated = database.updateStudent(this.currentEditId, studentData);
                    if (updated) {
                        auth.showNotification('تم تحديث بيانات الطالب بنجاح', 'success');
                    }
                } else {
                    // إضافة طالب جديد
                    database.addStudent(studentData);
                    auth.showNotification('تم إضافة الطالب بنجاح', 'success');
                }
                
                this.hideForm();
                this.loadStudents();
            } catch (error) {
                auth.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
                console.error('Error saving student:', error);
            }
        }
    }

    validateStudentData(data) {
        if (!data.name || !data.username || !data.password || !data.grade) {
            auth.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return false;
        }

        if (data.password.length < 6) {
            auth.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return false;
        }

        // التحقق من عدم تكرار اسم المستخدم
        const students = database.getStudents();
        const existingStudent = students.find(s => 
            s.username === data.username && s.id !== this.currentEditId
        );
        
        if (existingStudent) {
            auth.showNotification('اسم المستخدم موجود مسبقاً', 'error');
            return false;
        }

        return true;
    }

    editStudent(id) {
        const student = database.findStudentById(id);
        if (student) {
            this.currentEditId = id;
            document.getElementById('studentFormTitle').textContent = 'تعديل بيانات الطالب';
            
            // تعبئة النموذج بالبيانات
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentUsername').value = student.username;
            document.getElementById('studentPassword').value = student.password;
            document.getElementById('studentGrade').value = student.grade;
            document.getElementById('studentEmail').value = student.email || '';
            document.getElementById('studentPhone').value = student.phone || '';

            document.getElementById('studentFormModal').classList.add('active');
        }
    }

    async deleteStudent(id) {
        const student = database.findStudentById(id);
        if (!student) return;

        const confirmed = await Utils.confirm(
            `هل أنت متأكد من حذف الطالب "${student.name}"؟\nهذا الإجراء لا يمكن التراجع عنه.`
        );

        if (confirmed) {
            const success = database.deleteStudent(id);
            if (success) {
                auth.showNotification('تم حذف الطالب بنجاح', 'success');
                this.loadStudents();
            } else {
                auth.showNotification('حدث خطأ أثناء حذف الطالب', 'error');
            }
        }
    }

    viewStudent(id) {
        auth.showNotification('سيتم فتح صفحة الطالب قريباً', 'info');
        // في التطبيق الحقيقي: window.location.href = `student-profile.html?id=${id}`;
    }

    searchStudents(query) {
        const students = database.getStudents();
        const filteredStudents = students.filter(student =>
            student.name.includes(query) ||
            student.username.includes(query) ||
            student.grade.includes(query)
        );
        this.displayStudents(filteredStudents);
    }

    exportStudents() {
        const students = database.getStudents();
        const exportData = students.map(student => ({
            'اسم الطالب': student.name,
            'اسم المستخدم': student.username,
            'الصف الدراسي': Utils.getGradeName(student.grade),
            'النقاط': student.points,
            'البريد الإلكتروني': student.email || '',
            'رقم الهاتف': student.phone || '',
            'تاريخ التسجيل': Utils.formatDate(student.created_at),
            'الحالة': student.status === 'active' ? 'نشط' : 'غير نشط'
        }));

        Utils.exportToJSON(exportData, `طلاب_ميسر_التعلم_${new Date().toISOString().split('T')[0]}.json`);
        auth.showNotification('تم تصدير بيانات الطلاب بنجاح', 'success');
    }
}

const studentsManager = new StudentsManager();