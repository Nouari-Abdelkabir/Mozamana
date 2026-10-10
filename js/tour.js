/**
 * جولة إرشادية تفاعلية
 * Miqat - Interactive Tour
 *
 * تعرض جولة خطوة بخطوة للمستخدم الجديد
 */

// ============================================================
// خطوات الجولة
// ============================================================
const TOUR_STEPS = [
    {
        selector: '#mushaf-select',
        title: '📖 اختر الرواية',
        description: 'اختر الرواية التي تريد التلاوة بها (حفص، ورش، قالون، ...). التطبيق يدعم 29 رواية.',
        position: 'bottom'
    },
    {
        selector: '#reciter-select',
        title: '🎙️ اختر القارئ',
        description: 'اختر القارئ المفضل لديك. القائمة تتغير تلقائياً حسب الرواية المختارة.',
        position: 'bottom'
    },
    {
        selector: '#surah-select',
        title: '📕 اختر السورة',
        description: 'اختر السورة من 1 إلى 114. سيظهر النص القراني مباشرة.',
        position: 'bottom'
    },
    {
        selector: '#source-server-tab',
        title: '☁️ مصدر الصوت',
        description: 'اختر "من السيرفر" لاستخدام التلاوات الجاهزة من الإنترنت.',
        position: 'bottom'
    },
    {
        selector: '#source-local-tab',
        title: '💾 من الجهاز',
        description: 'أو اختر "من الجهاز" لرفع ملف صوتي خاص بك.',
        position: 'bottom'
    },
    {
        selector: '#alignment-status',
        title: '📊 حالة التوقيتات',
        description: 'يعرض حالة التوقيتات: محفوظة (✅) أو تحتاج توليد (⚠️).',
        position: 'top'
    },
    {
        selector: '#generate-alignment-btn',
        title: '⚡ توليد التوقيتات',
        description: 'اضغط لتوليد توقيتات أولية بدقة 80%. يمكنك تحسينها يدوياً بعدها.',
        position: 'top'
    },
    {
        selector: '#play-pause-btn',
        title: '▶️ تشغيل / إيقاف',
        description: 'شغّل التلاوة. اضغط مرة أخرى للإيقاف المؤقت. يستأنف من نفس النقطة.',
        position: 'top'
    },
    {
        selector: '#preview-btn',
        title: '👁️ معاينة',
        description: 'شغّل المقطع مع تظليل تلقائي للايات. مفيد للتحقق من دقة المزامنة.',
        position: 'top'
    },
    {
        selector: '#cut-btn',
        title: '✂️ اقطع هنا',
        description: 'عند سماع نهاية الاية، اضغط هنا. يُسجّل التوقيت ويحفظ الملف تلقائياً.',
        position: 'top'
    },
    {
        selector: '#prev-ayah-btn',
        title: '⏪ التنقل بين الايات',
        description: 'استخدم السابقة/التالية للتنقل بين الايات. يمكنك النقر على أي اية في النص أيضاً.',
        position: 'top'
    }
];

// ============================================================
// الحالة
// ============================================================
let tourCurrentStep = 0;
let tourActive = false;

// ============================================================
// بدء الجولة
// ============================================================
function startTour() {
    tourCurrentStep = 0;
    tourActive = true;
    
    // أظهر الـ overlay والنافذة
    document.getElementById('tour-overlay').classList.remove('hidden');
    document.getElementById('tour-popup').classList.remove('hidden');
    
    // ابنِ النقاط
    buildTourDots();
    
    // اذهب للخطوة الأولى
    showTourStep(0);
    
    console.log('🎯 بدء الجولة الإرشادية');
}

// ============================================================
// إيقاف الجولة
// ============================================================
function stopTour() {
    tourActive = false;
    
    document.getElementById('tour-overlay').classList.add('hidden');
    document.getElementById('tour-popup').classList.add('hidden');
    
    // أزل التظليل عن العناصر
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
    
    console.log('⏹️ إيقاف الجولة');
}

// ============================================================
// عرض خطوة
// ============================================================
function showTourStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    
    tourCurrentStep = index;
    const step = TOUR_STEPS[index];
    
    // ابحث عن العنصر
    const targetEl = document.querySelector(step.selector);
    
    if (!targetEl) {
        console.warn(`⚠️ العنصر ${step.selector} غير موجود`);
        // تجاوز للخطوة التالية
        if (index < TOUR_STEPS.length - 1) {
            showTourStep(index + 1);
        }
        return;
    }
    
    // أزل التظليل السابق
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
    
    // ظلّل العنصر الحالي
    targetEl.classList.add('tour-highlight');
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // حدّث النص
    document.getElementById('tour-step-counter').textContent = 
        `الخطوة ${index + 1} من ${TOUR_STEPS.length}`;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-description').textContent = step.description;
    
    // موضع النافذة
    positionTourPopup(targetEl, step.position || 'bottom');
    
    // حدّث الأزرار
    const prevBtn = document.getElementById('tour-prev-btn');
    const nextBtn = document.getElementById('tour-next-btn');
    
    prevBtn.disabled = index === 0;
    
    if (index === TOUR_STEPS.length - 1) {
        nextBtn.innerHTML = `
            <i data-lucide="check" class="w-3 h-3"></i>
            إنهاء
        `;
    } else {
        nextBtn.innerHTML = `
            التالي
            <i data-lucide="chevron-left" class="w-3 h-3"></i>
        `;
    }
    
    // حدّث النقاط
    updateTourDots();
    
    // أعد إنشاء الأيقونات
    lucide.createIcons();
}

// ============================================================
// موضع النافذة بالنسبة للعنصر
// ============================================================
function positionTourPopup(targetEl, position) {
    const popup = document.getElementById('tour-popup');
    const rect = targetEl.getBoundingClientRect();
    const popupWidth = 380;
    const popupHeight = 200;
    const gap = 12;
    
    let top, left;
    
    // احسب الموضع
    switch (position) {
        case 'top':
            top = rect.top - popupHeight - gap + window.scrollY;
            left = rect.left + rect.width / 2 - popupWidth / 2 + window.scrollX;
            break;
        case 'bottom':
            top = rect.bottom + gap + window.scrollY;
            left = rect.left + rect.width / 2 - popupWidth / 2 + window.scrollX;
            break;
        case 'left':
            top = rect.top + rect.height / 2 - popupHeight / 2 + window.scrollY;
            left = rect.left - popupWidth - gap + window.scrollX;
            break;
        case 'right':
            top = rect.top + rect.height / 2 - popupHeight / 2 + window.scrollY;
            left = rect.right + gap + window.scrollX;
            break;
        default:
            top = rect.bottom + gap + window.scrollY;
            left = rect.left + window.scrollX;
    }
    
    // اضبط الحدود (لا تخرج عن الشاشة)
    const minLeft = 10;
    const maxLeft = window.innerWidth - popupWidth - 10;
    const minTop = 10;
    const maxTop = window.innerHeight - popupHeight - 10 + window.scrollY;
    
    left = Math.max(minLeft, Math.min(maxLeft, left));
    top = Math.max(minTop, Math.min(maxTop, top));
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

// ============================================================
// نقاط التقدم
// ============================================================
function buildTourDots() {
    const container = document.getElementById('tour-dots');
    if (!container) return;
    
    container.innerHTML = '';
    
    TOUR_STEPS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'tour-dot w-1.5 h-1.5 rounded-full bg-white/20 transition-colors';
        dot.dataset.index = i;
        container.appendChild(dot);
    });
}

function updateTourDots() {
    document.querySelectorAll('.tour-dot').forEach((dot, i) => {
        if (i === tourCurrentStep) {
            dot.classList.remove('bg-white/20');
            dot.classList.add('bg-amber-400');
        } else {
            dot.classList.remove('bg-amber-400');
            dot.classList.add('bg-white/20');
        }
    });
}

// ============================================================
// ربط الأحداث
// ============================================================
function bindTourEvents() {
    // زر "كيف يعمل؟" → ابدأ الجولة
    const howBtn = document.getElementById('how-it-works-btn');
    if (howBtn) {
        // احذف المستمعين القدماء
        const newBtn = howBtn.cloneNode(true);
        howBtn.parentNode.replaceChild(newBtn, howBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            startTour();
        });
    }
    
    // زر الإغلاق
    document.getElementById('tour-close-btn')?.addEventListener('click', stopTour);
    
    // زر السابق
    document.getElementById('tour-prev-btn')?.addEventListener('click', () => {
        if (tourCurrentStep > 0) showTourStep(tourCurrentStep - 1);
    });
    
    // زر التالي
    document.getElementById('tour-next-btn')?.addEventListener('click', () => {
        if (tourCurrentStep < TOUR_STEPS.length - 1) {
            showTourStep(tourCurrentStep + 1);
        } else {
            stopTour();
        }
    });
    
    // إغلاق عند النقر على الـ overlay
    document.getElementById('tour-overlay')?.addEventListener('click', stopTour);
    
    // إغلاق بمفتاح Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tourActive) stopTour();
        if (e.key === 'ArrowLeft' && tourActive) {
            if (tourCurrentStep < TOUR_STEPS.length - 1) showTourStep(tourCurrentStep + 1);
        }
        if (e.key === 'ArrowRight' && tourActive) {
            if (tourCurrentStep > 0) showTourStep(tourCurrentStep - 1);
        }
    });
    
    // إعادة الموضع عند تغيير حجم النافذة
    window.addEventListener('resize', () => {
        if (!tourActive) return;
        const step = TOUR_STEPS[tourCurrentStep];
        const el = document.querySelector(step.selector);
        if (el) positionTourPopup(el, step.position || 'bottom');
    });
}

// ============================================================
// التهيئة
// ============================================================
document.addEventListener('DOMContentLoaded', bindTourEvents);

// تصدير
window.startTour = startTour;
window.stopTour = stopTour;

console.log('✅ tour.js محمّل');