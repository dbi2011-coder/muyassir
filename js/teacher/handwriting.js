class HandwritingManager {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.handwritingData = this.loadHandwriting();
    this.renderHandwritingInfo();
  }

  loadHandwriting() {
    const allData = JSON.parse(localStorage.getItem('muyassir_handwriting') || '[]');
    return allData.filter(h => {
      // Filtering related to teacher's students
      return this.isStudentOfTeacher(h.student_id);
    });
  }

  isStudentOfTeacher(studentId) {
    const students = JSON.parse(localStorage.getItem('muyassir_students') || '[]');
    return students.some(s => s.id === studentId && s.teacher_id === this.currentUser.id);
  }

  renderHandwritingInfo() {
    const container = document.getElementById('handwritingDetails');
    if(!container) return;
    container.innerHTML = '';
    this.handwritingData.forEach(h => {
      const el = document.createElement('div');
      el.textContent = `طالب رقم: ${h.student_id} - مستوى الخط: ${h.level} - التقدم: ${h.progress}%`;
      container.appendChild(el);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HandwritingManager();
});
