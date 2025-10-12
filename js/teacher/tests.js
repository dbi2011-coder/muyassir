class TestManager {
  constructor() {
    this.tests = this.loadTests();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.renderTestList();
    this.setupAddTestForm();
  }

  loadTests() {
    const allTests = JSON.parse(localStorage.getItem('muyassir_tests') || '[]');
    return allTests.filter(test => test.teacher_id === this.currentUser.id);
  }

  saveTests() {
    let allTests = JSON.parse(localStorage.getItem('muyassir_tests') || '[]');
    allTests = allTests.filter(test => test.teacher_id !== this.currentUser.id);
    const updated = [...allTests, ...this.tests];
    localStorage.setItem('muyassir_tests', JSON.stringify(updated));
  }

  renderTestList() {
    const container = document.getElementById('testList');
    if(!container) return;
    container.innerHTML = '';
    this.tests.forEach(test => {
      const el = document.createElement('div');
      el.textContent = `${test.title} (حالة: ${test.status || 'غير محدد'})`;
      container.appendChild(el);
    });
  }

  setupAddTestForm() {
    const form = document.getElementById('addTestForm');
    if(!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = form.querySelector('#testTitle').value;
      if(!title) return alert('ادخل عنوان الاختبار');
      this.tests.push({
        id: Date.now(),
        title,
        teacher_id: this.currentUser.id,
        status: 'active',
        created_at: new Date().toISOString(),
      });
      this.saveTests();
      this.renderTestList();
      form.reset();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TestManager();
});
