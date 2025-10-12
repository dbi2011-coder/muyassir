class HomeworkManager {
  constructor() {
    this.homeworks = this.loadHomework();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.renderHomeworkList();
    this.setupAddHomeworkForm();
  }

  loadHomework() {
    const allHomework = JSON.parse(localStorage.getItem('muyassir_homework') || '[]');
    return allHomework.filter(hw => hw.teacher_id === this.currentUser.id);
  }

  saveHomework() {
    let allHomework = JSON.parse(localStorage.getItem('muyassir_homework') || '[]');
    allHomework = allHomework.filter(hw => hw.teacher_id !== this.currentUser.id);
    const updated = [...allHomework, ...this.homeworks];
    localStorage.setItem('muyassir_homework', JSON.stringify(updated));
  }

  renderHomeworkList() {
    const container = document.getElementById('homeworkList');
    if(!container) return;
    container.innerHTML = '';
    this.homeworks.forEach(hw => {
      const el = document.createElement('div');
      el.textContent = `${hw.title} - تاريخ التسليم: ${hw.due_date}`;
      container.appendChild(el);
    });
  }

  setupAddHomeworkForm() {
    const form = document.getElementById('addHomeworkForm');
    if(!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = form.querySelector('#homeworkTitle').value;
      const description = form.querySelector('#homeworkDesc').value;
      const due_date = form.querySelector('#dueDate').value;
      if(!title || !description || !due_date) {
        alert('يرجى ملء جميع الحقول');
        return;
      }
      this.homeworks.push({
        id: Date.now(),
        title,
        description,
        due_date,
        teacher_id: this.currentUser.id,
        status: 'active',
        created_at: new Date().toISOString(),
      });
      this.saveHomework();
      this.renderHomeworkList();
      form.reset();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HomeworkManager();
});
