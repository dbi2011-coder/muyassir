class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('muyassir_initialized')) {
            this.initializeAllData();
        }
    }

    initializeAllData() {
        const users = [
            { 
                id: 1, 
                username: 'teacher', 
                password: '123456', 
                role: 'teacher', 
                name: 'أ/ صالح العجلان',
                email: 'teacher@muyassir.com',
                phone: '+966500000001'
            },
            { 
                id: 2, 
                username: 'student1', 
                password: '123456', 
                role: 'student', 
                name: 'محمد أحمد',
                grade: 'second',
                email: 'student1@muyassir.com'
            },
            { 
                id: 3, 
                username: 'student2', 
                password: '123456', 
                role: 'student', 
                name: 'فاطمة علي',
                grade: 'third',
                email: 'student2@muyassir.com'
            },
            { 
                id: 4, 
                username: 'committee', 
                password: '123456', 
                role: 'committee', 
                name: 'عضو اللجنة',
                email: 'committee@muyassir.com'
            }
        ];

        const students = [
            {
                id: 1,
                name: 'محمد أحمد',
                username: 'student1',
                password: '123456',
                grade: 'second',
                status: 'active',
                points: 150,
                created_at: new Date().toISOString(),
                diagnostic_results: {
                    reading: 85,
                    writing: 78,
                    math: 82
                },
                mastered_skills: ['قراءة الحروف', 'كتابة الكلمات البسيطة'],
                handwriting_level: 'beginner',
                teacher_id: 1
            },
            {
                id: 2,
                name: 'فاطمة علي',
                username: 'student2',
                password: '123456',
                grade: 'third',
                status: 'active',
                points: 200,
                created_at: new Date().toISOString(),
                diagnostic_results: {
                    reading: 92,
                    writing: 85,
                    math: 88
                },
                mastered_skills: ['قراءة الجمل', 'كتابة الفقرات'],
                handwriting_level: 'intermediate',
                teacher_id: 1
            }
        ];

        const tests = [
            {
                id: 1,
                title: 'الاختبار التشخيصي للصف الثاني - القراءة',
                grade: 'second',
                subject: 'reading',
                duration: 30,
                passing_score: 60,
                teacher_id: 1,
                questions: [
                    {
                        id: 1,
                        type: 'multiple_choice',
                        text: 'اختر الكلمة الصحيحة:',
                        options: ['قلم', 'فلم', 'كلم'],
                        correct_answer: [0],
                        points: 10,
                        objective: 'تمييز الحروف'
                    },
                    {
                        id: 2,
                        type: 'multiple_choice',
                        text: 'ما معنى كلمة "مدرسة"؟',
                        options: ['مكان للتعلم', 'مكان للعب', 'مكان للأكل'],
                        correct_answer: [0],
                        points: 10,
                        objective: 'فهم المفردات'
                    }
                ],
                created_at: new Date().toISOString(),
                status: 'active'
            }
        ];

        const lessons = [
            {
                id: 1,
                title: 'درس الحروف المتشابهة',
                grade: 'second',
                type: 'reading',
                strategy: 'التعلم باللعب',
                target_percentage: 80,
                content: {
                    type: 'interactive',
                    materials: ['صور', 'أصوات'],
                    exercises: [
                        {
                            type: 'matching',
                            question: 'طابق بين الحرف وصوته',
                            options: ['أ - 🍎', 'ب - 🏀', 'ت - 🌳'],
                            correct_answers: [0,1,2]
                        }
                    ]
                },
                teacher_id: 1,
                created_at: new Date().toISOString(),
                status: 'active'
            }
        ];

        const homework = [
            {
                id: 1,
                title: 'واجب القراءة الأسبوعي',
                description: 'قراءة قصة قصيرة والإجابة على الأسئلة',
                lesson_id: 1,
                teacher_id: 1,
                assigned_to: [1, 2],
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                created_at: new Date().toISOString()
            }
        ];

        const activities = [
            {
                id: 1,
                title: 'نشاط القراءة الجماعية',
                type: 'academic',
                date: new Date().toISOString(),
                description: 'نشاط قراءة جماعي لتحسين مهارات القراءة',
                participants: [1, 2],
                attachments: [],
                teacher_id: 1,
                created_at: new Date().toISOString()
            }
        ];

        const schedule = [
            {
                id: 1,
                day: 'sunday',
                periods: [
                    { time: '08:00-09:00', subject: 'قراءة', students: [1, 2] },
                    { time: '09:00-10:00', subject: 'كتابة', students: [1] },
                    { time: '10:00-11:00', subject: 'رياضيات', students: [2] }
                ],
                teacher_id: 1
            }
        ];

        const handwriting = [
            {
                id: 1,
                student_id: 1,
                template: 'خط النسخ',
                level: 'beginner',
                progress: 40,
                exercises: [],
                created_at: new Date().toISOString()
            }
        ];

        const rewards = [
            {
                id: 1,
                name: 'نجمة التفوق',
                points: 50,
                description: 'مكافأة للتميز في الأداء',
                available: true
            }
        ];

        // حفظ جميع البيانات
        localStorage.setItem('muyassir_users', JSON.stringify(users));
        localStorage.setItem('muyassir_students', JSON.stringify(students));
        localStorage.setItem('muyassir_tests', JSON.stringify(tests));
        localStorage.setItem('muyassir_lessons', JSON.stringify(lessons));
        localStorage.setItem('muyassir_homework', JSON.stringify(homework));
        localStorage.setItem('muyassir_activities', JSON.stringify(activities));
        localStorage.setItem('muyassir_schedule', JSON.stringify(schedule));
        localStorage.setItem('muyassir_handwriting', JSON.stringify(handwriting));
        localStorage.setItem('muyassir_rewards', JSON.stringify(rewards));
        localStorage.setItem('muyassir_initialized', 'true');
        
        console.log('تم تهيئة قاعدة البيانات بنجاح');
    }

    // دوال الحصول على البيانات
    getUsers() { return JSON.parse(localStorage.getItem('muyassir_users') || '[]'); }
    getStudents() { return JSON.parse(localStorage.getItem('muyassir_students') || '[]'); }
    getTests() { return JSON.parse(localStorage.getItem('muyassir_tests') || '[]'); }
    getLessons() { return JSON.parse(localStorage.getItem('muyassir_lessons') || '[]'); }
    getHomework() { return JSON.parse(localStorage.getItem('muyassir_homework') || '[]'); }
    getActivities() { return JSON.parse(localStorage.getItem('muyassir_activities') || '[]'); }
    getSchedule() { return JSON.parse(localStorage.getItem('muyassir_schedule') || '[]'); }
    getHandwriting() { return JSON.parse(localStorage.getItem('muyassir_handwriting') || '[]'); }
    getRewards() { return JSON.parse(localStorage.getItem('muyassir_rewards') || '[]'); }

    // دوال الحفظ
    saveStudents(students) { localStorage.setItem('muyassir_students', JSON.stringify(students)); }
    saveTests(tests) { localStorage.setItem('muyassir_tests', JSON.stringify(tests)); }
    saveLessons(lessons) { localStorage.setItem('muyassir_lessons', JSON.stringify(lessons)); }
    saveHomework(homework) { localStorage.setItem('muyassir_homework', JSON.stringify(homework)); }
    saveActivities(activities) { localStorage.setItem('muyassir_activities', JSON.stringify(activities)); }
    saveSchedule(schedule) { localStorage.setItem('muyassir_schedule', JSON.stringify(schedule)); }
    saveHandwriting(handwriting) { localStorage.setItem('muyassir_handwriting', JSON.stringify(handwriting)); }

    // إضافة بيانات جديدة
    addStudent(studentData) {
        const students = this.getStudents();
        const newStudent = {
            id: this.generateId(students),
            ...studentData,
            created_at: new Date().toISOString(),
            status: 'active',
            points: 0,
            diagnostic_results: {},
            mastered_skills: [],
            handwriting_level: 'beginner',
            teacher_id: 1
        };
        
        students.push(newStudent);
        this.saveStudents(students);
        return newStudent;
    }

    addTest(testData) {
        const tests = this.getTests();
        const newTest = {
            id: this.generateId(tests),
            ...testData,
            created_at: new Date().toISOString(),
            status: 'active',
            teacher_id: 1
        };
        tests.push(newTest);
        this.saveTests(tests);
        return newTest;
    }

    addLesson(lessonData) {
        const lessons = this.getLessons();
        const newLesson = {
            id: this.generateId(lessons),
            ...lessonData,
            created_at: new Date().toISOString(),
            status: 'active',
            teacher_id: 1
        };
        lessons.push(newLesson);
        this.saveLessons(lessons);
        return newLesson;
    }

    addHomework(hwData) {
        const homework = this.getHomework();
        const newHw = {
            id: this.generateId(homework),
            ...hwData,
            created_at: new Date().toISOString(),
            status: 'active',
            teacher_id: 1
        };
        homework.push(newHw);
        this.saveHomework(homework);
        return newHw;
    }

    addActivity(activityData) {
        const activities = this.getActivities();
        const newActivity = {
            id: this.generateId(activities),
            ...activityData,
            created_at: new Date().toISOString(),
            teacher_id: 1
        };
        activities.push(newActivity);
        this.saveActivities(activities);
        return newActivity;
    }

    // البحث
    findUser(username, password) {
        const users = this.getUsers();
        return users.find(user => user.username === username && user.password === password);
    }

    findStudentById(id) {
        const students = this.getStudents();
        return students.find(student => student.id === id);
    }

    findTestById(id) {
        const tests = this.getTests();
        return tests.find(test => test.id === id);
    }

    findLessonById(id) {
        const lessons = this.getLessons();
        return lessons.find(lesson => lesson.id === id);
    }

    // التحديث
    updateStudent(id, updates) {
        const students = this.getStudents();
        const index = students.findIndex(student => student.id === id);
        if (index !== -1) {
            students[index] = { ...students[index], ...updates };
            this.saveStudents(students);
            return students[index];
        }
        return null;
    }

    updateTest(id, updates) {
        const tests = this.getTests();
        const index = tests.findIndex(test => test.id === id);
        if (index !== -1) {
            tests[index] = { ...tests[index], ...updates };
            this.saveTests(tests);
            return tests[index];
        }
        return null;
    }

    // الحذف
    deleteStudent(id) {
        const students = this.getStudents().filter(student => student.id !== id);
        this.saveStudents(students);
        return true;
    }

    deleteTest(id) {
        const tests = this.getTests().filter(test => test.id !== id);
        this.saveTests(tests);
        return true;
    }

    deleteLesson(id) {
        const lessons = this.getLessons().filter(lesson => lesson.id !== id);
        this.saveLessons(lessons);
        return true;
    }

    // التحقق
    isUsernameTaken(username) {
        const students = this.getStudents();
        return students.some(student => student.username === username);
    }

    // توليد ID
    generateId(array) {
        return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
    }

    // إحصائيات
    getStatistics() {
        const students = this.getStudents();
        const tests = this.getTests();
        const lessons = this.getLessons();
        const homework = this.getHomework();

        return {
            totalStudents: students.length,
            totalTests: tests.length,
            totalLessons: lessons.length,
            activeHomework: homework.filter(hw => hw.status === 'active').length,
            averageScore: this.calculateAverageScore(students)
        };
    }

    calculateAverageScore(students) {
        if (students.length === 0) return 0;
        const total = students.reduce((sum, student) => {
            const scores = Object.values(student.diagnostic_results || {});
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            return sum + avg;
        }, 0);
        return Math.round(total / students.length);
    }
}

const database = new Database();