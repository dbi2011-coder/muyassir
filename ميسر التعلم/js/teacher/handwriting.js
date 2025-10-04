class HandwritingManager {
    constructor() {
        this.fontTemplates = JSON.parse(localStorage.getItem('fontTemplates')) || [];
        this.studentAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFontTemplates();
        this.renderStudentAssignments();
    }

    bindEvents() {
        // أحداث إنشاء قالب خط
        document.getElementById('createTemplateBtn')?.addEventListener('click', () => this.showTemplateModal());
        document.getElementById('saveTemplateBtn')?.addEventListener('click', () => this.saveTemplate());
        document.getElementById('templateText')?.addEventListener('input', (e) => this.previewTemplate(e.target.value));

        // أحداث تعيين القوالب للطلاب
        document.getElementById('assignTemplateBtn')?.addEventListener('click', () => this.showAssignmentModal());
        document.getElementById('saveAssignmentBtn')?.addEventListener('click', () => this.saveAssignment());

        // أحداث ممارسة الخط
        this.setupHandwritingPractice();
    }

    showTemplateModal() {
        document.getElementById('templateModal').style.display = 'block';
        this.clearCanvas();
    }

    hideTemplateModal() {
        document.getElementById('templateModal').style.display = 'none';
    }

    previewTemplate(text) {
        const canvas = document.getElementById('templateCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '40px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    saveTemplate() {
        const templateName = document.getElementById('templateName').value;
        const templateText = document.getElementById('templateText').value;
        const difficulty = document.getElementById('templateDifficulty').value;

        if (!templateName || !templateText) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        const template = {
            id: Date.now().toString(),
            name: templateName,
            text: templateText,
            difficulty: difficulty,
            createdAt: new Date().toISOString()
        };

        this.fontTemplates.push(template);
        localStorage.setItem('fontTemplates', JSON.stringify(this.fontTemplates));
        
        this.loadFontTemplates();
        this.hideTemplateModal();
        this.showNotification('تم حفظ القالب بنجاح', 'success');
    }

    loadFontTemplates() {
        const container = document.getElementById('fontTemplatesContainer');
        if (!container) return;

        container.innerHTML = this.fontTemplates.map(template => `
            <div class="template-card" data-id="${template.id}">
                <h4>${template.name}</h4>
                <p>${template.text}</p>
                <div class="template-meta">
                    <span class="difficulty-badge ${template.difficulty}">${this.getDifficultyText(template.difficulty)}</span>
                    <span class="date">${new Date(template.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary" onclick="handwritingManager.assignTemplate('${template.id}')">تعيين</button>
                    <button class="btn btn-sm btn-danger" onclick="handwritingManager.deleteTemplate('${template.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    getDifficultyText(difficulty) {
        const difficulties = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        return difficulties[difficulty] || difficulty;
    }

    showAssignmentModal() {
        document.getElementById('assignmentModal').style.display = 'block';
        this.loadStudentsForAssignment();
    }

    hideAssignmentModal() {
        document.getElementById('assignmentModal').style.display = 'none';
    }

    loadStudentsForAssignment() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const select = document.getElementById('studentSelect');
        
        select.innerHTML = students.map(student => `
            <option value="${student.id}">${student.name} - ${student.grade}</option>
        `).join('');
    }

    saveAssignment() {
        const studentId = document.getElementById('studentSelect').value;
        const templateId = document.getElementById('assignmentTemplateSelect').value;
        const deadline = document.getElementById('assignmentDeadline').value;

        if (!studentId || !templateId || !deadline) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        if (!this.studentAssignments[studentId]) {
            this.studentAssignments[studentId] = [];
        }

        const assignment = {
            id: Date.now().toString(),
            templateId: templateId,
            deadline: deadline,
            assignedAt: new Date().toISOString(),
            completed: false,
            progress: 0
        };

        this.studentAssignments[studentId].push(assignment);
        localStorage.setItem('handwritingAssignments', JSON.stringify(this.studentAssignments));
        
        this.hideAssignmentModal();
        this.renderStudentAssignments();
        this.showNotification('تم تعيين التمرين للطالب', 'success');
    }

    renderStudentAssignments() {
        const container = document.getElementById('assignmentsContainer');
        if (!container) return;

        const students = JSON.parse(localStorage.getItem('students')) || [];
        let html = '';

        students.forEach(student => {
            const assignments = this.studentAssignments[student.id] || [];
            
            if (assignments.length > 0) {
                html += `
                    <div class="student-assignments">
                        <h4>${student.name} - الصف ${student.grade}</h4>
                        <div class="assignments-list">
                            ${assignments.map(assignment => {
                                const template = this.fontTemplates.find(t => t.id === assignment.templateId);
                                return `
                                    <div class="assignment-item ${assignment.completed ? 'completed' : ''}">
                                        <div class="assignment-info">
                                            <h5>${template?.name || 'قالب محذوف'}</h5>
                                            <p>${template?.text || ''}</p>
                                            <div class="assignment-meta">
                                                <span>موعد التسليم: ${new Date(assignment.deadline).toLocaleDateString('ar-SA')}</span>
                                                <span class="progress">التقدم: ${assignment.progress}%</span>
                                            </div>
                                        </div>
                                        <div class="assignment-actions">
                                            <button class="btn btn-sm btn-info" onclick="handwritingManager.viewProgress('${student.id}', '${assignment.id}')">عرض التقدم</button>
                                            <button class="btn btn-sm btn-warning" onclick="handwritingManager.extendDeadline('${student.id}', '${assignment.id}')">تمديد</button>
                                            <button class="btn btn-sm btn-danger" onclick="handwritingManager.removeAssignment('${student.id}', '${assignment.id}')">إلغاء</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html || '<p class="text-muted">لا توجد تمارين معينة</p>';
    }

    setupHandwritingPractice() {
        const canvas = document.getElementById('handwritingCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let currentPath = [];

        // إعداد Canvas
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#007bff';

        // أحداث الماوس
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // أحداث اللمس
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);

        function startDrawing(e) {
            isDrawing = true;
            const pos = getMousePos(canvas, e);
            [lastX, lastY] = [pos.x, pos.y];
            currentPath = [[pos.x, pos.y]];
        }

        function draw(e) {
            if (!isDrawing) return;
            
            const pos = getMousePos(canvas, e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            
            [lastX, lastY] = [pos.x, pos.y];
            currentPath.push([pos.x, pos.y]);
            
            // التحقق من دقة الكتابة
            checkWritingAccuracy(currentPath);
        }

        function stopDrawing() {
            isDrawing = false;
            if (currentPath.length > 0) {
                analyzeWriting(currentPath);
            }
        }

        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            
            if (e.type === 'touchstart') {
                startDrawing(mouseEvent);
            } else if (e.type === 'touchmove') {
                draw(mouseEvent);
            }
        }

        function getMousePos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
    }

    checkWritingAccuracy(path) {
        // محاكاة التحقق من دقة الكتابة
        const feedback = document.getElementById('writingFeedback');
        if (!feedback) return;

        // هنا يمكن إضافة خوارزمية أكثر تعقيداً للتحقق من دقة الكتابة
        const deviation = this.calculateDeviation(path);
        
        if (deviation > 50) {
            feedback.textContent = 'انتبه! حاول البقاء على الخط';
            feedback.style.color = '#dc3545';
        } else if (deviation > 25) {
            feedback.textContent = 'جيد، يمكنك التحسين أكثر';
            feedback.style.color = '#ffc107';
        } else {
            feedback.textContent = 'ممتاز! أنت على المسار الصحيح';
            feedback.style.color = '#28a745';
        }
    }

    calculateDeviation(path) {
        // محاكاة حساب الانحراف عن المسار الصحيح
        if (path.length < 2) return 0;
        
        let totalDeviation = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i][0] - path[i-1][0];
            const dy = path[i][1] - path[i-1][1];
            totalDeviation += Math.sqrt(dx*dx + dy*dy);
        }
        
        return totalDeviation / path.length;
    }

    analyzeWriting(path) {
        // محاكاة تحليل الكتابة
        console.log('تحليل المسار:', path);
        
        // هنا يمكن إضافة تحليل أكثر تعقيداً للكتابة
        const smoothness = this.calculateSmoothness(path);
        const speed = this.calculateSpeed(path);
        
        this.updateProgress(smoothness, speed);
    }

    calculateSmoothness(path) {
        if (path.length < 3) return 100;
        
        let angleChanges = 0;
        for (let i = 2; i < path.length; i++) {
            const v1 = [path[i-1][0] - path[i-2][0], path[i-1][1] - path[i-2][1]];
            const v2 = [path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]];
            
            const dot = v1[0]*v2[0] + v1[1]*v2[1];
            const mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
            const mag2 = Math.sqrt(v2[0]*v2[0] + v2[1]*v2[1]);
            
            if (mag1 > 0 && mag2 > 0) {
                const angle = Math.acos(dot / (mag1 * mag2));
                angleChanges += Math.abs(angle);
            }
        }
        
        return Math.max(0, 100 - (angleChanges * 10));
    }

    calculateSpeed(path) {
        if (path.length < 2) return 0;
        const totalDistance = this.calculateTotalDistance(path);
        return totalDistance / path.length;
    }

    calculateTotalDistance(path) {
        let distance = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i][0] - path[i-1][0];
            const dy = path[i][1] - path[i-1][1];
            distance += Math.sqrt(dx*dx + dy*dy);
        }
        return distance;
    }

    updateProgress(smoothness, speed) {
        const progressBar = document.getElementById('handwritingProgress');
        if (!progressBar) return;

        // محاكاة تحسين التقدم
        const currentProgress = parseInt(progressBar.style.width) || 0;
        const newProgress = Math.min(100, currentProgress + 2);
        
        progressBar.style.width = newProgress + '%';
        progressBar.textContent = newProgress + '%';

        if (newProgress >= 100) {
            this.showNotification('تهانينا! أكملت التمرين بنجاح', 'success');
        }
    }

    // وظائف إضافية للتعامل مع القوالب والتعيينات
    assignTemplate(templateId) {
        this.showAssignmentModal();
        document.getElementById('assignmentTemplateSelect').value = templateId;
    }

    deleteTemplate(templateId) {
        if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
            this.fontTemplates = this.fontTemplates.filter(t => t.id !== templateId);
            localStorage.setItem('fontTemplates', JSON.stringify(this.fontTemplates));
            this.loadFontTemplates();
            this.showNotification('تم حذف القالب', 'success');
        }
    }

    viewProgress(studentId, assignmentId) {
        // عرض تقدم الطالب في تمرين محدد
        const assignment = this.studentAssignments[studentId]?.find(a => a.id === assignmentId);
        if (assignment) {
            alert(`تقدم الطالب في هذا التمرين: ${assignment.progress}%`);
        }
    }

    extendDeadline(studentId, assignmentId) {
        const newDeadline = prompt('أدخل الموعد الجديد (YYYY-MM-DD):');
        if (newDeadline) {
            const assignment = this.studentAssignments[studentId]?.find(a => a.id === assignmentId);
            if (assignment) {
                assignment.deadline = newDeadline;
                localStorage.setItem('handwritingAssignments', JSON.stringify(this.studentAssignments));
                this.renderStudentAssignments();
                this.showNotification('تم تمديد الموعد', 'success');
            }
        }
    }

    removeAssignment(studentId, assignmentId) {
        if (confirm('هل أنت متأكد من إلغاء هذا التمرين؟')) {
            this.studentAssignments[studentId] = this.studentAssignments[studentId]?.filter(a => a.id !== assignmentId);
            localStorage.setItem('handwritingAssignments', JSON.stringify(this.studentAssignments));
            this.renderStudentAssignments();
            this.showNotification('تم إلغاء التمرين', 'success');
        }
    }

    clearCanvas() {
        const canvas = document.getElementById('templateCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        document.getElementById('templateName').value = '';
        document.getElementById('templateText').value = '';
        document.getElementById('templateDifficulty').value = 'medium';
    }

    showNotification(message, type) {
        // تنفيذ بسيط للإشعارات
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fixed-top mx-auto mt-3`;
        notification.style.cssText = 'width: 300px; z-index: 9999;';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة مدير تحسين الخط عند تحميل الصفحة
let handwritingManager;
document.addEventListener('DOMContentLoaded', function() {
    handwritingManager = new HandwritingManager();
});