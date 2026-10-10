/**
 * محرر التوقيتات
 * Miqat - Timing Editor
 *
 * الميزات:
 * - ضبط التوقيتات بزر واحد (اقطع هنا)
 * - الحفظ التلقائي
 * - التنقل بين الايات
 * - إعادة توزيع المتبقي
 */

// ============================================================
// الحالة
// ============================================================
const TimingState = {
    ayahs: [],
    currentIndex: 0,
    saveTimer: null,
    isDirty: false,
    audioDuration: 0,
    mode: 'edit'  // 'edit' أو 'preview'
};

// ============================================================
// تهيئة من توقيتات موجودة
// ============================================================
function initTiming(alignmentData) {
    if (!alignmentData || !alignmentData.ayahs) {
        console.warn('⚠️ بيانات التوقيتات فارغة');
        return false;
    }
    
    TimingState.ayahs = alignmentData.ayahs.map(a => ({
        ayah_number: a.ayah_number,
        start: a.start,
        end: a.end,
        fixed: a.manually_verified || false
    }));
    
    TimingState.currentIndex = 0;
    TimingState.audioDuration = alignmentData.audio_duration || 
        (ViewerState.wavesurfer ? ViewerState.wavesurfer.getDuration() : 0);
    
    console.log(`✅ تم تحميل ${TimingState.ayahs.length} آية`);
    
    // ✅ أظهر اللوحة تلقائياً
    setTimeout(() => {
        showTimingPanel(true);
        updateTimingPanel();
        updateHighlightFromTiming();   // ← أضف هذا
    }, 100);
    
    return true;   // ← الآن في النهاية
}
// ============================================================
// إنشاء توقيتات تجريبية (عند عدم وجود ملف)
// ============================================================
function createInitialTiming(ayahElements, audioDuration) {
    const count = ayahElements.length;
    if (count === 0 || !audioDuration) return false;
    
    console.log(`📊 حساب التوقيتات بناءً على عدد الكلمات...`);
    
    // ============================================
    // 1. احسب عدد الكلمات في كل اية
    // ============================================
    const wordCounts = [];
    let totalWords = 0;
    
    ayahElements.forEach((el, idx) => {
        // عدد الكلمات العربية فقط (بدون رموز)
        const words = Array.from(el.querySelectorAll('.quran-word'));
        const count = Math.max(1, words.length); // على الأقل كلمة واحدة
        wordCounts.push(count);
        totalWords += count;
    });
    
    console.log(`📖 إجمالي الكلمات: ${totalWords}`);
    console.log(`📊 توزيع الكلمات:`, wordCounts);
    
    // ============================================
    // 2. احسب التوقيت لكل اية بناءً على نسبتها
    // ============================================
    let currentTime = 0;
    const ayahs = [];
    
    for (let i = 0; i < count; i++) {
        // النسبة المئوية للاية
        const percentage = wordCounts[i] / totalWords;
        
        // المدة المتوقعة لهذه الاية
        const duration = audioDuration * percentage;
        
        // التوقيت
        const start = parseFloat(currentTime.toFixed(2));
        const end = parseFloat((currentTime + duration).toFixed(2));
        
        ayahs.push({
            ayah_number: parseInt(ayahElements[i].dataset.ayahId),
            start: start,
            end: end,
            wordCount: wordCounts[i],
            fixed: false
        });
        
        currentTime += duration;
    }
    
    // تصحيح التوقيت الأخير ليطابق المدة الكلية بالضبط
    if (ayahs.length > 0) {
        ayahs[ayahs.length - 1].end = parseFloat(audioDuration.toFixed(2));
    }
    
    TimingState.ayahs = ayahs;
    TimingState.currentIndex = 0;
    TimingState.audioDuration = audioDuration;
    
    // اطبع ملخص
    console.log(`✅ تم إنشاء ${count} اية بناءً على عدد الكلمات:`);
    ayahs.forEach((a, i) => {
        const duration = (a.end - a.start).toFixed(2);
        console.log(`  اية ${a.ayah_number}: ${a.start}s → ${a.end}s (${duration}s, ${a.wordCount} كلمة)`);
    });
    
    return true;
}

// ============================================================
// تحديث اللوحة
// ============================================================
function updateTimingPanel() {
    const current = TimingState.ayahs[TimingState.currentIndex];
    if (!current) return;
    
    // الاية الحالية
    const numEl = document.getElementById('timing-ayah-num');
    const totalEl = document.getElementById('timing-ayah-total');
    const textEl = document.getElementById('timing-ayah-text');
    
    if (numEl) numEl.textContent = current.ayah_number;
    if (totalEl) totalEl.textContent = TimingState.ayahs.length;
    
    // النص من DOM (مع الألوان)
    if (textEl) {
        const el = document.querySelector(`.quran-ayah[data-ayah-id="${current.ayah_number}"]`);
        if (el) {
            // احتفظ بالـ HTML الكامل (مع الألوان)
            let html = el.innerHTML;
            
            // أزل رقم الاية (﴿X﴾) من النهاية
            html = html.replace(/<span class="[^"]*text-emerald-500[^"]*"[^>]*>[\s\S]*?<\/span>\s*$/, '');
            
            // أزل أي عناصر تحكم
            textEl.innerHTML = html.trim();
        } else {
            // احتياطي: استخدم النص من المصفوفة
            textEl.textContent = current.text || '';
        }
    }
    
    // العدادات
    const fixedCount = TimingState.ayahs.filter(a => a.fixed).length;
    const remainingCount = TimingState.ayahs.length - fixedCount;
    
    const fixedEl = document.getElementById('timing-fixed-count');
    const remainingEl = document.getElementById('timing-remaining-count');
    
    if (fixedEl) fixedEl.textContent = fixedCount;
    if (remainingEl) remainingEl.textContent = remainingCount;
    
    
    // اعرض عدد الكلمات والمدة
    const wordCountEl = document.getElementById('timing-word-count');
    const durationEl = document.getElementById('timing-duration');
    
    if (wordCountEl && current.wordCount) {
        wordCountEl.textContent = current.wordCount;
    }
    
    if (durationEl && current.start !== undefined && current.end !== undefined) {
        durationEl.textContent = (current.end - current.start).toFixed(2) + 's';
    }
    // زر الحفظ
    updateSaveStatus();
}

// ============================================================
// تحديث حالة الحفظ
// ============================================================
function updateSaveStatus() {
    const statusEl = document.getElementById('timing-save-status');
    if (!statusEl) return;
    
    if (TimingState.isDirty) {
        statusEl.innerHTML = '⏳ جاري الحفظ...';
        statusEl.className = 'text-[10px] text-amber-400';
    } else {
        statusEl.innerHTML = '✅ محفوظ';
        statusEl.className = 'text-[10px] text-emerald-400';
    }
}

// ============================================================
// زر "اقطع هنا" — المنطق الأساسي
// ============================================================
function cutHere() {
    console.log('✂️ cutHere بدأ');
    console.log('  ViewerState.wavesurfer:', !!ViewerState.wavesurfer);
    console.log('  TimingState.currentIndex:', TimingState.currentIndex);
    console.log('  TimingState.ayahs.length:', TimingState.ayahs.length);
    
    if (!ViewerState.wavesurfer) {
        console.warn('⚠️ لا يوجد wavesurfer');
        return;
    }
    
    const currentTime = ViewerState.wavesurfer.getCurrentTime();
    const current = TimingState.ayahs[TimingState.currentIndex];
    
    console.log('  currentTime:', currentTime);
    console.log('  current:', current);
    
    if (!current) {
        console.warn('⚠️ لا توجد آية حالية');
        return;
    }
    
    // تحقق: هل الوقت الحالي بعد بداية الآية الحالية؟
    if (currentTime <= current.start) {
        console.warn(`⚠️ الوقت الحالي (${currentTime.toFixed(2)}) قبل بداية الآية (${current.start})`);
        return;
    }
    
    // ✅ هنا باقي الدالة المفقود
    console.log(`✂️ قطع عند ${currentTime.toFixed(2)}s — نهاية الآية ${current.ayah_number}`);
    
    // 1. ثبّت الآية الحالية
    current.end = parseFloat(currentTime.toFixed(2));
    current.fixed = true;
    
    // 2. إذا كانت هناك آية تالية
    if (TimingState.currentIndex < TimingState.ayahs.length - 1) {
        // 3. الآية التالية تبدأ من نهاية الحالية
        const next = TimingState.ayahs[TimingState.currentIndex + 1];
        next.start = current.end;
        
        // 4. أعد توزيع الآيات المتبقية
        redistributeRemaining();
        
        // 5. انتقل للآية التالية
        TimingState.currentIndex++;
    } else {
        // آخر آية — ثبّت النهاية
        current.end = TimingState.audioDuration;
        console.log('✅ اكتملت جميع الآيات!');
    }
    
    // 6. حدّث اللوحة
    updateTimingPanel();
    
    // 7. علّم التعديل واحفظ
    markDirtyAndSave();
    
    // 8. انتقل للتظليل الجديد
    updateHighlightFromTiming();
}


// ============================================================
// إعادة توزيع الايات غير المثبّتة
// ============================================================
function redistributeRemaining() {
    // ابحث عن أول اية غير مثبّتة بعد الحالية
    const startIdx = TimingState.currentIndex + 1;
    
    // احسب وقت البداية (من نهاية اخر اية مثبّتة)
    let startTime = TimingState.ayahs[startIdx - 1].end;
    
    // ابحث عن أول اية مثبّتة بعد startIdx (لن نلمسها)
    let endIdx = TimingState.ayahs.length;
    for (let i = startIdx; i < TimingState.ayahs.length; i++) {
        if (TimingState.ayahs[i].fixed) {
            endIdx = i;
            break;
        }
    }
    
    // الوقت المتاح للتوزيع
    const endTime = endIdx < TimingState.ayahs.length 
        ? TimingState.ayahs[endIdx].start 
        : TimingState.audioDuration;
    
    const count = endIdx - startIdx;
    if (count <= 0) return;
    
    const timePerAyah = (endTime - startTime) / count;
    
    // وزّع بالتساوي
    for (let i = startIdx; i < endIdx; i++) {
        TimingState.ayahs[i].start = parseFloat((startTime + (i - startIdx) * timePerAyah).toFixed(2));
        TimingState.ayahs[i].end = parseFloat((startTime + (i - startIdx + 1) * timePerAyah).toFixed(2));
    }
    
    console.log(`🔄 أُعيد توزيع ${count} اية على ${(endTime - startTime).toFixed(2)}s`);
}

// ============================================================
// تحديث التظليل بناءً على التوقيتات الجديدة
// ============================================================
function updateHighlightFromTiming() {
    const current = TimingState.ayahs[TimingState.currentIndex];
    if (!current) return;
    
    // 1. أزل التظليل القديم
    document.querySelectorAll('.quran-ayah.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // 2. ظلّل الاية الحالية (من currentIndex)
    const el = document.querySelector(`.quran-ayah[data-ayah-id="${current.ayah_number}"]`);
    if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    console.log(`🎯 التظليل على الاية ${current.ayah_number}`);
}

// ============================================================
// الحفظ التلقائي
// ============================================================
function markDirtyAndSave() {
    TimingState.isDirty = true;
    updateSaveStatus();
    
    // ألغ المؤقت السابق
    if (TimingState.saveTimer) {
        clearTimeout(TimingState.saveTimer);
    }
    
    // جدول حفظاً بعد ثانيتين
    TimingState.saveTimer = setTimeout(() => {
        saveTimingToServer();
    }, 2000);
}

async function saveTimingToServer() {
    // ✅ تحقق من الحالة
    if (!UIState.currentMushafId || !UIState.currentReciterId || !UIState.currentSurahNum) {
        console.warn('⚠️ بيانات ناقصة');
        return { status: 'error', message: 'بيانات ناقصة' };
    }
    
    // ✅ بناء بيانات الحفظ
    const reciter = MUSHAAFS[UIState.currentMushafId]?.reciters.find(r => r.id === UIState.currentReciterId);
    
    const alignmentData = {
        surah_id: parseInt(UIState.currentSurahNum),
        mushaf_id: UIState.currentMushafId,
        reciter_id: UIState.currentReciterId,                          // ← ✅ جديد!
        reciter_code: UIState.currentReciterCode,
        reciter_name: reciter?.name || '',
        audio_url: buildAudioUrl(UIState.currentReciterCode, UIState.currentSurahNum),
        audio_duration: TimingState.audioDuration,
        generated_at: new Date().toISOString(),
        ayahs: TimingState.ayahs.map(a => ({
            ayah_number: a.ayah_number,
            start: a.start,
            end: a.end,
            manually_verified: a.fixed
        }))
    };
    
    // ✅ حفظ باستخدام reciterId (النظيف)
    const result = await saveAlignment(
        UIState.currentSurahNum,
        UIState.currentMushafId,
        UIState.currentReciterId,                                      // ← ✅ الصحيح!
        alignmentData
    );
    
    // ✅ تحديث الحالة
    if (result.status === 'saved') {
        TimingState.isDirty = false;
        updateSaveStatus();
        showSaveNotification('✅ تم الحفظ بنجاح');
        ViewerState.currentAlignment = alignmentData;
    } else {
        showSaveNotification('❌ فشل الحفظ', 'error');
    }
    
    // ✅ إعادة النتيجة (مهم!)
    return result;
}

// ============================================================
// تنبيه بصري للحفظ
// ============================================================
function showSaveNotification(message, type = 'success') {
    // ابحث عن التنبيه الموجود أو أنشئه
    let notif = document.getElementById('save-notification');
    
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'save-notification';
        notif.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl transition-all duration-300';
        document.body.appendChild(notif);
    }
    
    // لون حسب النوع
    if (type === 'error') {
        notif.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 bg-red-500/90 text-white';
    } else {
        notif.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 bg-emerald-500/90 text-white';
    }
    
    notif.textContent = message;
    
    // أظهر
    setTimeout(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translate(-50%, 0)';
    }, 10);
    
    // أخفِ بعد 2 ثانية
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translate(-50%, -20px)';
    }, 2000);
}

// ============================================================
// ⏪ السابقة — ينقل الصوت والتظليل معاً
// ============================================================
function goToPrevAyah() {
    if (TimingState.currentIndex <= 0) return;
    
    TimingState.currentIndex--;
    const current = TimingState.ayahs[TimingState.currentIndex];
    
    // حدّث اللوحة
    updateTimingPanel();
    updateHighlightFromTiming();
    
    // انقل الصوت + شغّل
    if (ViewerState.wavesurfer && current) {
        ViewerState.wavesurfer.setTime(current.start);
        ViewerState.wavesurfer.play();
        console.log(`⏪ السابقة → الاية ${current.ayah_number}`);
    }
}

// ============================================================
// ⏩ التالية — ينقل الصوت والتظليل معاً
// ============================================================
function goToNextAyah() {
    if (TimingState.currentIndex >= TimingState.ayahs.length - 1) return;
    
    TimingState.currentIndex++;
    const current = TimingState.ayahs[TimingState.currentIndex];
    
    // حدّث اللوحة
    updateTimingPanel();
    updateHighlightFromTiming();
    
    // انقل الصوت + شغّل
    if (ViewerState.wavesurfer && current) {
        ViewerState.wavesurfer.setTime(current.start);
        ViewerState.wavesurfer.play();
        console.log(`⏩ التالية → الاية ${current.ayah_number}`);
    }
}

// ============================================================
// ربط الأزرار
// ============================================================
let timingControlsBound = false;

function bindTimingControls() {
    // ✅ حماية من الربط المكرر
    if (timingControlsBound) {
        console.log('⏭️ bindTimingControls مُستدعاة مسبقاً');
        return;
    }
    timingControlsBound = true;
    
    console.log('🔧 bindTimingControls بدأ');
    
    bindPreviewControls();
    
    // زر القطع
    const cutBtn = document.getElementById('cut-btn');
    if (cutBtn) {
        cutBtn.addEventListener('click', () => {
            console.log('🖱️ نقر على [✂️ اقطع هنا]');
            cutHere();
        });
        console.log('✅ تم ربط زر القطع');
    } else {
        console.warn('⚠️ زر القطع غير موجود');
    }
    
    // زر الحفظ اليدوي
    const saveBtn = document.getElementById('save-now-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            console.log('🖱️ نقر على [حفظ]');
            const result = await saveTimingToServer();
            if (result && result.status === 'saved') {
                console.log('✅ تم الحفظ:', result.path);
            } else {
                console.error('❌ فشل الحفظ:', result);
            }
        });
        console.log('✅ تم ربط زر الحفظ');
    }
    
    // السابقة / التالية
    const prevBtn = document.getElementById('prev-ayah-btn');
    const nextBtn = document.getElementById('next-ayah-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            console.log('🖱️ نقر على [السابقة]');
            goToPrevAyah();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            console.log('🖱️ نقر على [التالية]');
            goToNextAyah();
        });
    }
    
    // زر بدء الضبط اليدوي
    const startBtn = document.getElementById('start-timing-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startManualTiming);
    }
    
    // زر الإيقاف المؤقت
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (ViewerState.wavesurfer) {
                ViewerState.wavesurfer.pause();
            }
        });
    }
    
    console.log('✅ bindTimingControls انتهى');
}

// ============================================================
// بدء الضبط اليدوي
// ============================================================
function startManualTiming() {
    const ayahElements = document.querySelectorAll('.quran-ayah');
    const duration = ViewerState.wavesurfer ? ViewerState.wavesurfer.getDuration() : 0;
    
    if (ayahElements.length === 0 || duration === 0) {
        alert('انتظر تحميل الصوت والنص أولاً');
        return;
    }
    
    createInitialTiming(ayahElements, duration);
    
    // أخفِ زر البدء، أظهر اللوحة
    document.getElementById('start-timing-container')?.classList.add('hidden');
    document.getElementById('timing-panel')?.classList.remove('hidden');
    
    updateTimingPanel();
    
    // حفظ أولي
    markDirtyAndSave();
    
    // ابدأ التشغيل
    if (ViewerState.wavesurfer) {
        ViewerState.wavesurfer.setTime(0);
        ViewerState.wavesurfer.play();
    }
}

// ============================================================
// إظهار/إخفاء اللوحة بناءً على وجود توقيتات
// ============================================================
function showTimingPanel(hasAlignment) {
    const panel = document.getElementById('timing-panel');
    const startContainer = document.getElementById('start-timing-container');
    
    if (hasAlignment) {
        panel?.classList.remove('hidden');
        startContainer?.classList.add('hidden');
    } else {
        panel?.classList.add('hidden');
        startContainer?.classList.remove('hidden');
    }
    
    lucide.createIcons();
}


// ============================================================
// ▶️ بدء المعاينة
// ============================================================
function startPreview() {
    if (!ViewerState.wavesurfer) {
        alert('الصوت غير محمل');
        return;
    }
    
    if (!TimingState.ayahs || TimingState.ayahs.length === 0) {
        alert('لا توجد توقيتات');
        return;
    }
    
    // 1. حوّل إلى وضع المعاينة
    TimingState.mode = 'preview';
    console.log('▶️ بدء المعاينة من الاية', TimingState.currentIndex + 1);
    
    // 2. أظهر شريط المعاينة
    const previewBar = document.getElementById('preview-mode-bar');
    if (previewBar) previewBar.classList.remove('hidden');
    
    // 3. عطّل زر [✂️] مؤقتاً
    const cutBtn = document.getElementById('cut-btn');
    if (cutBtn) {
        cutBtn.disabled = true;
        cutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    // 4. انتقل لبداية الاية الحالية + شغّل
    const current = TimingState.ayahs[TimingState.currentIndex];
    if (current) {
        ViewerState.wavesurfer.setTime(current.start);
        ViewerState.wavesurfer.play();
    }
    
    // 5. ربط مستمع انتهاء التشغيل
    ViewerState.wavesurfer.once('finish', () => {
        console.log('✅ انتهت المعاينة');
        stopPreview();
    });
    
    // 6. ربط فاحص دوري للتقدم
    startPreviewMonitor();
}

// ============================================================
// ⏹️ إيقاف المعاينة
// ============================================================
function stopPreview() {
    TimingState.mode = 'edit';
    console.log('⏹️ إيقاف المعاينة — العودة لوضع التحرير');
    
    // 1. أخفِ شريط المعاينة
    const previewBar = document.getElementById('preview-mode-bar');
    if (previewBar) previewBar.classList.add('hidden');
    
    // 2. أعِد تفعيل زر [✂️]
    const cutBtn = document.getElementById('cut-btn');
    if (cutBtn) {
        cutBtn.disabled = false;
        cutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    // 3. أوقف الصوت
    if (ViewerState.wavesurfer) {
        ViewerState.wavesurfer.pause();
    }
    
    // 4. أوقف الفاحص
    if (window._previewMonitor) {
        clearInterval(window._previewMonitor);
        window._previewMonitor = null;
    }
    
    // 5. أعد التظليل للاية الحالية في وضع التحرير
    updateHighlightFromTiming();
    updateTimingPanel();
}

// ============================================================
// مراقبة المعاينة (تحديث التظليل تلقائياً)
// ============================================================
function startPreviewMonitor() {
    if (window._previewMonitor) {
        clearInterval(window._previewMonitor);
    }
    
    window._previewMonitor = setInterval(() => {
        if (TimingState.mode !== 'preview') return;
        if (!ViewerState.wavesurfer) return;
        if (!ViewerState.wavesurfer.isPlaying()) return;
        
        const currentTime = ViewerState.wavesurfer.getCurrentTime();
        
        // ابحث عن الاية الحالية
        for (let i = 0; i < TimingState.ayahs.length; i++) {
            const a = TimingState.ayahs[i];
            if (currentTime >= a.start && currentTime < a.end) {
                if (i !== TimingState.currentIndex) {
                    TimingState.currentIndex = i;
                    
                    // حدّث التظليل
                    document.querySelectorAll('.quran-ayah.active').forEach(el => {
                        el.classList.remove('active');
                    });
                    const el = document.querySelector(`.quran-ayah[data-ayah-id="${a.ayah_number}"]`);
                    if (el) {
                        el.classList.add('active');
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    // حدّث اللوحة
                    updateTimingPanel();
                }
                break;
            }
        }
    }, 100); // كل 100ms
}

// ============================================================
// ربط أزرار المعاينة
// ============================================================
function bindPreviewControls() {
    const previewBtn = document.getElementById('preview-btn');
    const cancelPreviewBtn = document.getElementById('cancel-preview-btn');
    
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            if (TimingState.mode === 'preview') {
                stopPreview();
            } else {
                startPreview();
            }
        });
    }
    
    if (cancelPreviewBtn) {
        cancelPreviewBtn.addEventListener('click', stopPreview);
    }
}




// ============================================================
// تصدير
// ============================================================
window.TimingState = TimingState;
window.initTiming = initTiming;
window.createInitialTiming = createInitialTiming;
window.updateTimingPanel = updateTimingPanel;
window.updateSaveStatus = updateSaveStatus;
window.cutHere = cutHere;
window.redistributeRemaining = redistributeRemaining;
window.updateHighlightFromTiming = updateHighlightFromTiming;
window.markDirtyAndSave = markDirtyAndSave;
window.saveTimingToServer = saveTimingToServer;          // ← ✅ جديد
window.showSaveNotification = showSaveNotification;
window.goToPrevAyah = goToPrevAyah;
window.goToNextAyah = goToNextAyah;
window.bindTimingControls = bindTimingControls;
window.startManualTiming = startManualTiming;
window.showTimingPanel = showTimingPanel;                // ← ✅ موجود لكن تأكد
window.startPreview = startPreview;
window.stopPreview = stopPreview;
window.bindPreviewControls = bindPreviewControls;

// تهيئة
document.addEventListener('DOMContentLoaded', () => {
    bindTimingControls();
});

console.log('✅ timing-editor.js محمّل:', {
    showTimingPanel: typeof showTimingPanel,
    saveTimingToServer: typeof saveTimingToServer
});