class LessonManager {
  constructor() {
    this.lessons = this.loadLessons();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.renderLessonList();
    this.setupAddLessonForm();
  }

  loadLessons() {
    const allLessons = JSON.parse(localStorage.getItem('muyassir_lessons') || '[]');
    // تحميل الدروس المرتبطة بالمعلم فقط
    return allLessons.filter(lesson => lesson.teacher_id === this.currentUser.id);
  }

  saveLessons() {
    const allLessons = JSON.parse(localStorage.getItem('muyassir_lessons') || '[]');
    // حذف دروس المعلم القديمة
    const filteredLessons = allLessons.filter(lesson => lesson.teacher_id !== this.currentUser.id);
    const updated = [...filteredLessons, ...this.lessons];
    localStorage.setItem('muyassir_lessons', JSON.stringify(updated));
  }

  renderLessonList() {
    const container = document.getElementById('lessonList');
    if(!container) return;
    container.innerHTML = '';
    this.lessons.forEach(lesson => {
      const el = document.createElement('div');
      el.textContent = lesson.title || 'درس بدون عنوان';
      container.appendChild(el);
    });
  }

  setupAddLessonForm() {
    const form = document.getElementById('addLessonForm');
    if(!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = form.querySelector('#lessonTitle').value;
      if(!title) return alert('أدخل عنوان الدرس');
      this.lessons.push({
        id: Date.now(),
        title,
        teacher_id: this.currentUser.id,
        created_at: new Date().toISOString(),
      });
      this.saveLessons();
      this.renderLessonList();
      form.reset();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LessonManager();
});
