// ملف تصحيح الأخطاء
console.log('=== بدء تصحيح نظام ميسر التعلم ===');

// فحص حالة البيانات
console.log('المستخدمين:', JSON.parse(localStorage.getItem('muyassir_users') || '[]'));
console.log('الطلاب:', JSON.parse(localStorage.getItem('muyassir_students') || '[]'));
console.log('المستخدم الحالي في الجلسة:', sessionStorage.getItem('currentUser'));

// إعادة تعيين البيانات
function resetData() {
    localStorage.clear();
    sessionStorage.clear();
    console.log('تم مسح جميع البيانات');
    location.reload();
}

// إضافة زر إعادة التعيين للتصحيح (فقط في وضع التطوير)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'إعادة تعيين البيانات (للتطوير)';
    resetBtn.style.cssText = 'position: fixed; bottom: 10px; left: 10px; z-index: 9999; padding: 10px; background: red; color: white; border: none; border-radius: 5px; cursor: pointer;';
    resetBtn.onclick = resetData;
    document.body.appendChild(resetBtn);
}

console.log('=== انتهاء تصحيح النظام ===');