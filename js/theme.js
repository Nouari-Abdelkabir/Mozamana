/**
 * إدارة الوضع (نهاري/ليلي)
 * Miqat - Theme Manager
 */

// ============================================================
// تهيئة الوضع
// ============================================================
function initTheme() {
    // اقرأ الوضع المحفوظ
    const savedTheme = localStorage.getItem('miqat-theme') || 'light';
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // حدّث الأيقونة
    updateThemeIcon();
    
    console.log(`🎨 الوضع الحالي: ${savedTheme === 'dark' ? '🌙 ليلي' : '☀️ نهاري'}`);
}

// ============================================================
// تبديل الوضع
// ============================================================
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const newTheme = isDark ? 'dark' : 'light';
    
    localStorage.setItem('miqat-theme', newTheme);
    updateThemeIcon();
    
    console.log(`🎨 تبديل إلى: ${newTheme === 'dark' ? '🌙 ليلي' : '☀️ نهاري'}`);
}

// ============================================================
// تحديث أيقونة الزر
// ============================================================
function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.getElementById('theme-icon');
    
    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    }
}

// ============================================================
// ربط الزر
// ============================================================
function bindThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// التهيئة
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    bindThemeToggle();
});

// تصدير
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;

console.log('✅ theme.js محمّل');