class StudentHandwriting {
    constructor() {
        this.studentId = JSON.parse(localStorage.getItem('currentStudent'))?.id;
        this.currentAssignment = null;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentPath = [];
        this.templatePath = [];
        this.init();
    }

    init() {
        if (!this.studentId) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadAssignments();
        this.setupCanvas();
    }

    bindEvents() {
        document.getElementById('startPracticeBtn')?.addEventListener('click', () => this.startPractice());
        document.getElementById('clearCanvasBtn')?.addEventListener('click', () => this.clearCanvas());
        document.getElementById('submitPracticeBtn')?.addEventListener('click', () => this.submitPractice());
        document.getElementById('nextAssignmentBtn')?.addEventListener('click', () => this.nextAssignment());
    }

    loadAssignments() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        const assignments = this.getStudentAssignments();
        
        if (assignments.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد تمارين خط متاحة حالياً</p>';
            return;
        }

        container.innerHTML = assignments.map(assignment => `
            <div class="assignment-card ${assignment.completed ? 'completed' : 'active'}">
                <div class="assignment-header">
                    <h4>${assignment.templateName}</h4>
                    <span class="assignment-status ${assignment.completed ? 'completed' : 'pending'}">
                        ${assignment.completed ? 'مكتمل' : 'نشط'}
                    </span>
                </div>
                
                <div class="assignment-content">
                    <p class="practice-text">${assignment.templateText}</p>
                    
                    <div class="assignment-progress">
                        <div class="progress">
                            <div class="progress-bar" style="width: ${assignment.progress}%">
                                ${assignment.progress}%
                            </div>
                        </div>
                    </div>

                    <div class="assignment-meta">
                        <span>المستوى: ${this.getDifficultyText(assignment.difficulty)}</span>
                        <span>آخر موعد: ${new Date(assignment.deadline).toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>

                <div class="assignment-actions">
                    <button class="btn btn-primary" onclick="studentHandwriting.startAssignment('${assignment.id}')"
                            ${assignment.completed ? 'disabled' : ''}>
                        ${assignment.completed ? 'مكتمل' : 'بدء التمرين'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStudentAssignments() {
        const allAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        const studentAssignments = allAssignments[this.studentId] || [];
        const fontTemplates = JSON.parse(localStorage.getItem('fontTemplates')) || [];

        return studentAssignments.map(assignment => {
            const template = fontTemplates.find(t => t.id === assignment.templateId);
            return {
                id: assignment.id,
                templateId: assignment.templateId,
                templateName: template?.name || 'تمرين محذوف',
                templateText: template?.text || '',
                difficulty: template?.difficulty || 'medium',
                progress: assignment.progress || 0,
                completed: assignment.completed || false,
                deadline: assignment.deadline,
                assignedAt: assignment.assignedAt
            };
        }).filter(assignment => !assignment.completed); // عرض التمارين النشطة فقط
    }

    getDifficultyText(difficulty) {
        const difficulties = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        };
        return difficulties[difficulty] || difficulty;
    }

    startAssignment(assignmentId) {
        const assignments = this.getStudentAssignments();
        this.currentAssignment = assignments.find(a => a.id === assignmentId);
        
        if (!this.currentAssignment) return;

        this.showPracticeInterface();
        this.loadTemplate();
        this.startNewAttempt();
    }

    showPracticeInterface() {
        document.getElementById('assignmentsList').style.display = 'none';
        document.getElementById('practiceInterface').style.display = 'block';
        
        this.updateAssignmentInfo();
    }

    updateAssignmentInfo() {
        const infoEl = document.getElementById('assignmentInfo');
        if (!infoEl || !this.currentAssignment) return;

        infoEl.innerHTML = `
            <h4>${this.currentAssignment.templateName}</h4>
            <p class="practice-text-large">${this.currentAssignment.templateText}</p>
            <div class="assignment-stats">
                <span>المستوى: ${this.getDifficultyText(this.currentAssignment.difficulty)}</span>
                <span>التقدم: ${this.currentAssignment.progress}%</span>
                <span>الموعد النهائي: ${new Date(this.currentAssignment.deadline).toLocaleDateString('ar-SA')}</span>
            </div>
        `;
    }

    setupCanvas() {
        this.canvas = document.getElementById('handwritingCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setupDrawingEvents();
        this.setupCanvasStyle();
    }

    setupCanvasStyle() {
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#007bff';
        this.ctx.fillStyle = '#f8f9fa';
        
        // تعيين خلفية Canvas
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupDrawingEvents() {
        if (!this.canvas) return;

        // أحداث الماوس
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // أحداث اللمس
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        [this.lastX, this.lastY] = [pos.x, pos.y];
        this.currentPath = [[pos.x, pos.y]];
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        const pos = this.getMousePos(e);
        
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.currentPath.push([pos.x, pos.y]);
        [this.lastX, this.lastY] = [pos.x, pos.y];
        
        // التحقق من دقة الكتابة
        this.checkAccuracy();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.analyzeWriting();
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        this.canvas.dispatchEvent(mouseEvent);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    loadTemplate() {
        if (!this.currentAssignment || !this.canvas) return;

        // مسح Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setupCanvasStyle();

        // رسم النص كدليل
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.font = '40px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentAssignment.templateText, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();

        // إنشاء مسار القالب للتحقق من الدقة
        this.generateTemplatePath();
    }

    generateTemplatePath() {
        // إنشاء مسار افتراضي للنص (محاكاة)
        const text = this.currentAssignment.templateText;
        this.templatePath = [];
        
        // إحداثيات بسيطة لمحاكاة المسار الصحيح
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const letterSpacing = 30;
        
        for (let i = 0; i < text.length; i++) {
            const x = centerX - (text.length * letterSpacing) / 2 + i * letterSpacing;
            const y = centerY;
            this.templatePath.push([x, y]);
        }
    }

    checkAccuracy() {
        if (this.currentPath.length < 2) return;

        const feedbackEl = document.getElementById('writingFeedback');
        if (!feedbackEl) return;

        const deviation = this.calculateDeviation();
        const smoothness = this.calculateSmoothness();
        
        let message = '';
        let color = '#28a745';

        if (deviation > 50) {
            message = 'انتبه! حاول البقاء على الخط';
            color = '#dc3545';
        } else if (deviation > 25) {
            message = 'جيد، يمكنك التحسين أكثر';
            color = '#ffc107';
        } else if (smoothness < 60) {
            message = 'حاول جعل خطك أكثر سلاسة';
            color = '#fd7e14';
        } else {
            message = 'ممتاز! أنت على المسار الصحيح';
            color = '#28a745';
        }

        feedbackEl.textContent = message;
        feedbackEl.style.color = color;

        // تحديث الدقة في الوقت الفعلي
        this.updateRealTimeAccuracy(deviation, smoothness);
    }

    calculateDeviation() {
        if (this.currentPath.length < 2 || this.templatePath.length === 0) return 0;

        let totalDeviation = 0;
        let sampleCount = 0;

        // أخذ عينات من المسار الحالي ومقارنتها بأقرب نقطة في القالب
        for (let i = 0; i < this.currentPath.length; i += 5) {
            const [x, y] = this.currentPath[i];
            const closestTemplatePoint = this.findClosestTemplatePoint(x, y);
            
            if (closestTemplatePoint) {
                const dx = x - closestTemplatePoint[0];
                const dy = y - closestTemplatePoint[1];
                totalDeviation += Math.sqrt(dx * dx + dy * dy);
                sampleCount++;
            }
        }

        return sampleCount > 0 ? totalDeviation / sampleCount : 100;
    }

    findClosestTemplatePoint(x, y) {
        let minDistance = Infinity;
        let closestPoint = null;

        for (const point of this.templatePath) {
            const dx = x - point[0];
            const dy = y - point[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }

        return closestPoint;
    }

    calculateSmoothness() {
        if (this.currentPath.length < 3) return 100;

        let totalAngleChange = 0;
        let angleCount = 0;

        for (let i = 2; i < this.currentPath.length; i++) {
            const [x1, y1] = this.currentPath[i-2];
            const [x2, y2] = this.currentPath[i-1];
            const [x3, y3] = this.currentPath[i];

            const v1 = [x2 - x1, y2 - y1];
            const v2 = [x3 - x2, y3 - y2];

            const dot = v1[0]*v2[0] + v1[1]*v2[1];
            const mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
            const mag2 = Math.sqrt(v2[0]*v2[0] + v2[1]*v2[1]);

            if (mag1 > 0 && mag2 > 0) {
                const angle = Math.acos(dot / (mag1 * mag2));
                totalAngleChange += Math.abs(angle);
                angleCount++;
            }
        }

        const averageAngleChange = angleCount > 0 ? totalAngleChange / angleCount : 0;
        return Math.max(0, 100 - (averageAngleChange * 100));
    }

    updateRealTimeAccuracy(deviation, smoothness) {
        const accuracyEl = document.getElementById('currentAccuracy');
        if (!accuracyEl) return;

        const accuracy = Math.max(0, 100 - deviation);
        const overallScore = (accuracy + smoothness) / 2;
        
        accuracyEl.textContent = `${Math.round(overallScore)}%`;
        
        // تحديث مؤشر الدقة المرئي
        this.updateAccuracyIndicator(overallScore);
    }

    updateAccuracyIndicator(score) {
        const indicator = document.getElementById('accuracyIndicator');
        if (!indicator) return;

        indicator.style.width = `${score}%`;
        indicator.className = `accuracy-fill ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-improvement'}`;
    }

    analyzeWriting() {
        if (this.currentPath.length < 10) {
            this.showNotification('يرجى كتابة المزيد للتحليل', 'warning');
            return;
        }

        const deviation = this.calculateDeviation();
        const smoothness = this.calculateSmoothness();
        const speed = this.calculateSpeed();
        
        this.updateProgress(deviation, smoothness, speed);
        this.showAnalysisResults(deviation, smoothness, speed);
    }

    calculateSpeed() {
        if (this.currentPath.length < 2) return 0;
        
        const totalDistance = this.calculateTotalDistance(this.currentPath);
        const totalTime = this.currentPath.length * 16; // افتراضي: 16ms بين كل نقطة
        return totalDistance / (totalTime / 1000); // pixels per second
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

    updateProgress(deviation, smoothness, speed) {
        const progressEl = document.getElementById('practiceProgress');
        if (!progressEl || !this.currentAssignment) return;

        // حساب التقدم بناءً على الدقة والسلاسة
        const accuracy = Math.max(0, 100 - deviation);
        const overallScore = (accuracy + smoothness) / 2;
        
        // زيادة التقدم تدريجياً
        const progressIncrease = Math.min(5, overallScore / 20);
        const newProgress = Math.min(100, this.currentAssignment.progress + progressIncrease);
        
        this.currentAssignment.progress = newProgress;
        progressEl.style.width = `${newProgress}%`;
        progressEl.textContent = `${Math.round(newProgress)}%`;

        // حفظ التقدم
        this.saveProgress(newProgress);

        if (newProgress >= 100) {
            this.completeAssignment();
        }
    }

    saveProgress(progress) {
        const allAssignments = JSON.parse(localStorage.getItem('handwritingAssignments')) || {};
        const studentAssignments = allAssignments[this.studentId] || [];
        
        const assignmentIndex = studentAssignments.findIndex(a => a.id === this.currentAssignment.id);
        if (assignmentIndex > -1) {
            studentAssignments[assignmentIndex].progress = progress;
            if (progress >= 100) {
                studentAssignments[assignmentIndex].completed = true;
                studentAssignments[assignmentIndex].completedAt = new Date().toISOString();
            }
            
            allAssignments[this.studentId] = studentAssignments;
            localStorage.setItem('handwritingAssignments', JSON.stringify(allAssignments));
        }
    }

    showAnalysisResults(deviation, smoothness, speed) {
        const resultsEl = document.getElementById('analysisResults');
        if (!resultsEl) return;

        const accuracy = Math.max(0, 100 - deviation);
        
        resultsEl.innerHTML = `
            <h5>تحليل الكتابة</h5>
            <div class="analysis-stats">
                <div class="stat">
                    <span>الدقة:</span>
                    <strong>${Math.round(accuracy)}%</strong>
                </div>
                <div class="stat">
                    <span>السلاسة:</span>
                    <strong>${Math.round(smoothness)}%</strong>
                </div>
                <div class="stat">
                    <span>السرعة:</span>
                    <strong>${Math.round(speed)}px/s</strong>
                </div>
            </div>
            <div class="analysis-tips">
                ${this.generateTips(accuracy, smoothness, speed)}
            </div>
        `;
    }

    generateTips(accuracy, smoothness, speed) {
        const tips = [];
        
        if (accuracy < 70) {
            tips.push('💡 ركز على متابعة الخط بدقة أكبر');
        }
        
        if (smoothness < 60) {
            tips.push('💡 حاول جعل حركة يدك أكثر سلاسة');
        }
        
        if (speed > 200) {
            tips.push('💡 إبطئ قليلاً للتحكم أفضل في الخط');
        } else if (speed < 50) {
            tips.push('💡 يمكنك الكتابة بسرعة أكبر قليلاً');
        }
        
        if (tips.length === 0) {
            tips.push('🎉 أداء رائع! استمر في التمرين');
        }
        
        return tips.map(tip => `<p>${tip}</p>`).join('');
    }

    completeAssignment() {
        this.showNotification('تهانينا! أكملت التمرين بنجاح', 'success');
        this.awardPoints();
        
        // الانتقال التلقائي للتمرين التالي بعد 3 ثوان
        setTimeout(() => {
            this.nextAssignment();
        }, 3000);
    }

    awardPoints() {
        const points = 15; // نقاط ثابتة لإكمال تمرين الخط
        const pointsRecord = {
            points: points,
            reason: `إكمال تمرين خط: ${this.currentAssignment.templateName}`,
            date: new Date().toISOString()
        };

        const studentPoints = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        studentPoints.push(pointsRecord);
        localStorage.setItem(`student_points_${this.studentId}`, JSON.stringify(studentPoints));

        this.showNotification(`لقد ربحت ${points} نقطة!`, 'success');
    }

    clearCanvas() {
        if (!this.canvas) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setupCanvasStyle();
        this.loadTemplate();
        this.currentPath = [];
        
        const feedbackEl = document.getElementById('writingFeedback');
        if (feedbackEl) {
            feedbackEl.textContent = 'ابدأ الكتابة...';
            feedbackEl.style.color = '#666';
        }
    }

    submitPractice() {
        if (this.currentPath.length < 10) {
            alert('يرجى إكمال التمرين قبل التسليم');
            return;
        }

        this.analyzeWriting();
        this.showNotification('تم حفظ التمرين', 'success');
    }

    nextAssignment() {
        const assignments = this.getStudentAssignments();
        const currentIndex = assignments.findIndex(a => a.id === this.currentAssignment?.id);
        const nextIndex = (currentIndex + 1) % assignments.length;
        
        if (assignments.length > 0) {
            this.startAssignment(assignments[nextIndex].id);
        } else {
            this.returnToAssignments();
        }
    }

    returnToAssignments() {
        document.getElementById('practiceInterface').style.display = 'none';
        document.getElementById('assignmentsList').style.display = 'block';
        
        this.currentAssignment = null;
        this.loadAssignments();
    }

    startPractice() {
        // بدء تمرين حر (بدون واجب محدد)
        this.currentAssignment = {
            id: 'free_practice',
            templateName: 'تمرين حر',
            templateText: 'اكتب ما تريد',
            difficulty: 'medium',
            progress: 0,
            completed: false
        };

        this.showPracticeInterface();
        this.loadTemplate();
        this.startNewAttempt();
    }

    startNewAttempt() {
        this.clearCanvas();
        this.currentPath = [];
        
        const resultsEl = document.getElementById('analysisResults');
        if (resultsEl) {
            resultsEl.innerHTML = '<p>ابدأ الكتابة لرؤية التحليل</p>';
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة تدريب الخط للطالب
let studentHandwriting;
document.addEventListener('DOMContentLoaded', function() {
    studentHandwriting = new StudentHandwriting();
});