class StudentRewards {
    constructor() {
        this.studentId = JSON.parse(localStorage.getItem('currentStudent'))?.id;
        this.points = 0;
        this.rewards = [];
        this.init();
    }

    init() {
        if (!this.studentId) {
            window.location.href = '../login.html';
            return;
        }

        this.bindEvents();
        this.loadPoints();
        this.loadRewards();
        this.loadRewardHistory();
    }

    bindEvents() {
        document.getElementById('redeemRewardBtn')?.addEventListener('click', () => this.redeemReward());
        document.getElementById('filterRewards')?.addEventListener('change', () => this.filterRewards());
    }

    loadPoints() {
        const pointsData = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        this.points = pointsData.reduce((total, record) => total + (record.points || 0), 0);
        
        this.updatePointsDisplay();
    }

    updatePointsDisplay() {
        const pointsEl = document.getElementById('currentPoints');
        const progressEl = document.getElementById('pointsProgress');
        
        if (pointsEl) {
            pointsEl.textContent = this.points;
        }
        
        if (progressEl) {
            // افترض أن 1000 نقطة هي الحد الأقصى للتقدم
            const progress = Math.min((this.points / 1000) * 100, 100);
            progressEl.style.width = `${progress}%`;
        }
    }

    loadRewards() {
        const container = document.getElementById('rewardsCatalog');
        if (!container) return;

        this.rewards = this.getAvailableRewards();
        
        container.innerHTML = this.rewards.map(reward => `
            <div class="reward-item ${reward.cost > this.points ? 'disabled' : ''}">
                <div class="reward-image">
                    ${reward.image ? `<img src="${reward.image}" alt="${reward.name}">` : '🎁'}
                </div>
                <div class="reward-info">
                    <h5>${reward.name}</h5>
                    <p class="reward-description">${reward.description}</p>
                    <div class="reward-meta">
                        <span class="reward-cost">${reward.cost} نقطة</span>
                        <span class="reward-stock ${reward.stock === 0 ? 'out-of-stock' : ''}">
                            ${reward.stock > 0 ? `المتبقي: ${reward.stock}` : 'نفد المخزون'}
                        </span>
                    </div>
                </div>
                <div class="reward-actions">
                    <button class="btn btn-primary btn-sm" 
                            onclick="studentRewards.selectReward('${reward.id}')"
                            ${reward.cost > this.points || reward.stock === 0 ? 'disabled' : ''}>
                        استبدال
                    </button>
                </div>
            </div>
        `).join('');
    }

    getAvailableRewards() {
        // العوائد الافتراضية - يمكن جلبها من قاعدة البيانات
        return [
            {
                id: '1',
                name: 'شهادة تقدير',
                description: 'شهادة تقدير شخصية من المعلم',
                cost: 50,
                stock: 999,
                type: 'certificate'
            },
            {
                id: '2',
                name: 'خمس دقائق راحة إضافية',
                description: 'استراحة إضافية خلال الحصة',
                cost: 30,
                stock: 10,
                type: 'break'
            },
            {
                id: '3',
                name: 'مساعد المعلم ليوم واحد',
                description: 'كن مساعد المعلم ليوم كامل',
                cost: 100,
                stock: 5,
                type: 'assistant'
            },
            {
                id: '4',
                name: 'اختيار نشاط الحصة',
                description: 'اختر النشاط الذي تريد القيام به',
                cost: 40,
                stock: 15,
                type: 'activity'
            },
            {
                id: '5',
                name: 'جائزة مفاجئة',
                description: 'جائزة سرية من المعلم',
                cost: 75,
                stock: 20,
                type: 'surprise'
            },
            {
                id: '6',
                name: 'شعار تميز في الملف',
                description: 'شعار خاص يظهر في ملفك الشخصي',
                cost: 60,
                stock: 999,
                type: 'badge'
            }
        ];
    }

    selectReward(rewardId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) return;

        // عرض تأكيد الاستبدال
        if (confirm(`هل تريد استبدال ${reward.cost} نقطة مقابل "${reward.name}"؟`)) {
            this.redeemReward(reward);
        }
    }

    redeemReward(reward) {
        if (!reward) {
            const selectedRewardId = document.querySelector('input[name="selectedReward"]:checked')?.value;
            reward = this.rewards.find(r => r.id === selectedRewardId);
        }

        if (!reward) {
            alert('يرجى اختيار مكافأة');
            return;
        }

        if (this.points < reward.cost) {
            alert('ليس لديك نقاط كافية');
            return;
        }

        if (reward.stock === 0) {
            alert('هذه المكافأة غير متوفرة حالياً');
            return;
        }

        // خصم النقاط
        this.deductPoints(reward.cost);
        
        // تسجيل الاستبدال
        this.recordRedemption(reward);
        
        // تحديث المخزون
        reward.stock--;
        
        this.showRedemptionSuccess(reward);
        this.loadRewards();
        this.loadRewardHistory();
    }

    deductPoints(amount) {
        const deductionRecord = {
            points: -amount,
            reason: 'استبدال نقاط بمكافأة',
            date: new Date().toISOString()
        };

        const pointsData = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        pointsData.push(deductionRecord);
        localStorage.setItem(`student_points_${this.studentId}`, JSON.stringify(pointsData));
        
        this.points -= amount;
        this.updatePointsDisplay();
    }

    recordRedemption(reward) {
        const redemption = {
            id: Date.now().toString(),
            rewardId: reward.id,
            rewardName: reward.name,
            cost: reward.cost,
            redeemedAt: new Date().toISOString(),
            status: 'pending' // pending, approved, delivered
        };

        const redemptionHistory = JSON.parse(localStorage.getItem(`student_redemptions_${this.studentId}`)) || [];
        redemptionHistory.push(redemption);
        localStorage.setItem(`student_redemptions_${this.studentId}`, JSON.stringify(redemptionHistory));
    }

    showRedemptionSuccess(reward) {
        const successModal = document.getElementById('redemptionSuccess');
        if (!successModal) return;

        const messageEl = document.getElementById('successMessage');
        if (messageEl) {
            messageEl.innerHTML = `
                <div class="success-icon">🎉</div>
                <h4>تهانينا!</h4>
                <p>لقد استبدلت ${reward.cost} نقطة بنجاح</p>
                <p><strong>المكافأة:</strong> ${reward.name}</p>
                <p>سيقوم المعلم بتسليم المكافأة لك قريباً</p>
            `;
        }

        successModal.style.display = 'block';
    }

    hideSuccessModal() {
        const successModal = document.getElementById('redemptionSuccess');
        if (successModal) {
            successModal.style.display = 'none';
        }
    }

    loadRewardHistory() {
        const container = document.getElementById('rewardHistory');
        if (!container) return;

        const history = JSON.parse(localStorage.getItem(`student_redemptions_${this.studentId}`)) || [];
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-muted">لا توجد عمليات استبدال سابقة</p>';
            return;
        }

        container.innerHTML = history.slice(-10).reverse().map(redemption => `
            <div class="history-item ${redemption.status}">
                <div class="history-info">
                    <h6>${redemption.rewardName}</h6>
                    <p>تم الاستبدال: ${new Date(redemption.redeemedAt).toLocaleDateString('ar-SA')}</p>
                    <span class="history-cost">-${redemption.cost} نقطة</span>
                </div>
                <div class="history-status">
                    <span class="status-badge ${redemption.status}">
                        ${this.getStatusText(redemption.status)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'قيد المراجعة',
            'approved': 'تمت الموافقة',
            'delivered': 'تم التسليم'
        };
        return statuses[status] || status;
    }

    filterRewards() {
        const filterValue = document.getElementById('filterRewards').value;
        const rewardItems = document.querySelectorAll('.reward-item');
        
        rewardItems.forEach(item => {
            if (filterValue === 'all') {
                item.style.display = 'block';
            } else if (filterValue === 'affordable') {
                const isAffordable = !item.classList.contains('disabled');
                item.style.display = isAffordable ? 'block' : 'none';
            } else {
                // يمكن إضافة المزيد من الفلاتر حسب النوع
                item.style.display = 'block';
            }
        });
    }

    loadPointsHistory() {
        const container = document.getElementById('pointsHistory');
        if (!container) return;

        const pointsData = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        const recentPoints = pointsData.slice(-20).reverse();
        
        container.innerHTML = recentPoints.map(record => `
            <div class="points-record ${record.points > 0 ? 'earned' : 'spent'}">
                <div class="points-details">
                    <p>${record.reason}</p>
                    <small>${new Date(record.date).toLocaleDateString('ar-SA')}</small>
                </div>
                <div class="points-amount ${record.points > 0 ? 'positive' : 'negative'}">
                    ${record.points > 0 ? '+' : ''}${record.points}
                </div>
            </div>
        `).join('');
    }

    showPointsBreakdown() {
        const pointsData = JSON.parse(localStorage.getItem(`student_points_${this.studentId}`)) || [];
        const earned = pointsData.filter(p => p.points > 0).reduce((sum, p) => sum + p.points, 0);
        const spent = Math.abs(pointsData.filter(p => p.points < 0).reduce((sum, p) => sum + p.points, 0));
        
        alert(`إجمالي النقاط المكتسبة: ${earned}\nإجمالي النقاط المستهلكة: ${spent}\nالرصيد الحالي: ${this.points}`);
    }

    getAchievements() {
        // إنجازات الطالب
        const achievements = [
            {
                id: 'first_lesson',
                name: 'المبتدئ',
                description: 'أكمل أول درس',
                icon: '🎯',
                unlocked: this.hasCompletedLesson()
            },
            {
                id: 'test_master',
                name: 'خبير الاختبارات',
                description: 'احصل على 90% في أي اختبار',
                icon: '🏆',
                unlocked: this.hasHighTestScore()
            },
            {
                id: 'consistent',
                name: 'المنتظم',
                description: 'أكمل 5 دروس متتالية',
                icon: '📅',
                unlocked: this.hasConsistentProgress()
            },
            {
                id: 'speed_learner',
                name: 'المتعلم السريع',
                description: 'أكمل درس في أقل من نصف الوقت',
                icon: '⚡',
                unlocked: this.hasFastCompletion()
            }
        ];

        this.displayAchievements(achievements);
    }

    hasCompletedLesson() {
        const progress = JSON.parse(localStorage.getItem(`student_lesson_progress_${this.studentId}`)) || {};
        return Object.values(progress).some(p => p === 100);
    }

    hasHighTestScore() {
        const testResults = JSON.parse(localStorage.getItem(`student_tests_${this.studentId}`)) || [];
        return testResults.some(test => test.percentage >= 90);
    }

    hasConsistentProgress() {
        // تنفيذ بسيط للتحقق من الانتظام
        const progress = JSON.parse(localStorage.getItem(`student_lesson_progress_${this.studentId}`)) || {};
        return Object.values(progress).filter(p => p === 100).length >= 5;
    }

    hasFastCompletion() {
        // تنفيذ بسيط للتحقق من الإنجاز السريع
        return false; // يحتاج إلى بيانات إضافية
    }

    displayAchievements(achievements) {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;

        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">
                    ${achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                <div class="achievement-info">
                    <h6>${achievement.name}</h6>
                    <p>${achievement.description}</p>
                </div>
                <div class="achievement-status">
                    ${achievement.unlocked ? 'مكتمل' : 'غير مكتمل'}
                </div>
            </div>
        `).join('');
    }
}

// تهيئة نظام المكافآت للطالب
let studentRewards;
document.addEventListener('DOMContentLoaded', function() {
    studentRewards = new StudentRewards();
});