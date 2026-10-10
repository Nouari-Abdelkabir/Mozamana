/**
 * واجهة المستخدم
 * Miqat - UI Logic
 *
 * يدير:
 * - قوائم المصحف / القارئ / السورة
 * - اختيار مصدر الصوت (سيرفر / ملف محلي)
 * - عرض حالة التوقيتات
 */

// ============================================================
// الحالة العامة
// ============================================================
const UIState = {
    currentMushafId: null,
    currentReciterId: null,        // ← جديد
    currentReciterCode: null,
    currentSurahNum: null,
    currentSourceType: 'server',
    currentLocalFile: null,
    surahsData: [],
    currentAlignment: null
};

// ============================================================
// 1. تحميل قائمة السور
// ============================================================
async function loadSurahs() {
    try {
        const response = await fetch('data/surahs.json');
        UIState.surahsData = await response.json();
        console.log(`✅ تم تحميل ${UIState.surahsData.length} سورة`);
        return UIState.surahsData;
    } catch (error) {
        console.error('❌ خطأ في تحميل السور:', error);
        return [];
    }
}

// ============================================================
// 2. ملء قائمة المصاحف
// ============================================================
function populateMushafSelect() {
    const select = document.getElementById('mushaf-select');
    if (!select) {
        console.warn('⚠️ لم يُعثر على mushaf-select');
        return;
    }
    
    select.innerHTML = '<option value="">اختر الرواية...</option>';
    
    // RIWAYAT_LIST تحتوي على id + name فقط
    RIWAYAT_LIST.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
    
    console.log(`✅ تم ملء ${select.options.length - 1} رواية`);
}

// ============================================================
// 3. ملء قائمة القراء (حسب المصحف المختار)
// ============================================================
function populateReciterSelect(mushafId) {
    const select = document.getElementById('reciter-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر القارئ...</option>';
    
    const mushaf = MUSHAAFS[mushafId];
    if (!mushaf) {
        console.warn(`⚠️ مصحف غير موجود: ${mushafId}`);
        return;
    }
    
    mushaf.reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.id;              // ← reciter.id (مثل afs)
        option.textContent = reciter.name;
        option.dataset.reciterCode = reciter.code;
        select.appendChild(option);
    });
    
    console.log(`✅ ${mushaf.name}: ${mushaf.reciters.length} قارئ`);
}

// ============================================================
// 4. ملء قائمة السور
// ============================================================
function populateSurahSelect() {
    const select = document.getElementById('surah-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر السورة...</option>';
    
    UIState.surahsData.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.nameArabic}`;
        select.appendChild(option);
    });
    
    console.log(`✅ تم ملء ${UIState.surahsData.length} سورة`);
}

// ============================================================
// 5. تحديث معاينة مصدر الصوت
// ============================================================
function updateAudioSourcePreview() {
    const preview = document.getElementById('audio-url-preview');
    if (!preview) return;
    
    if (UIState.currentSourceType === 'server') {
        if (UIState.currentReciterCode && UIState.currentSurahNum) {
            const url = buildAudioUrl(UIState.currentReciterCode, UIState.currentSurahNum);
            preview.textContent = url || 'رابط غير متوفر';
            preview.classList.remove('hidden');
        } else {
            preview.textContent = 'اختر القارئ والسورة أولاً';
        }
    } else {
        preview.textContent = UIState.currentLocalFile 
            ? `ملف محلي: ${UIState.currentLocalFile.name}`
            : 'لم يتم اختيار ملف';
    }
}

// ============================================================
// 6. تحديث حالة التوقيتات
// ============================================================
async function updateAlignmentStatus() {
    const statusBox = document.getElementById('alignment-status');
    if (!statusBox) return;
    
    // حالة: لم يتم الاختيار
    if (!UIState.currentMushafId || !UIState.currentReciterCode || !UIState.currentSurahNum) {
        statusBox.innerHTML = `
            <div class="text-slate-500 text-sm">
                <i data-lucide="info" class="w-4 h-4 inline"></i>
                اختر الرواية والقارئ والسورة
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    // مرّر بيانات الحالة إلى ViewerState
    ViewerState.currentMushafId = UIState.currentMushafId;
    ViewerState.currentReciterCode = UIState.currentReciterCode;
    ViewerState.currentSurah = UIState.currentSurahNum;
    
    // حالة: جاري البحث
    statusBox.innerHTML = `
        <div class="text-amber-400 text-sm flex items-center gap-2">
            <div class="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></div>
            جاري البحث عن التوقيتات...
        </div>
    `;
    
    // 1. اعرض النص القراني أولاً
    ViewerState.currentAlignment = null;
    await displayQuranText(UIState.currentMushafId, UIState.currentSurahNum);
    bindPlayerButtons();
    
    // 2. ابحث عن التوقيتات
    const result = await fetchAlignment(
        UIState.currentSurahNum,
        UIState.currentMushafId,
        UIState.currentReciterId
    );
        
    // ============================================
    // الحالة (أ): التوقيتات موجودة
    // ============================================
    if (result.status === 'found') {
        UIState.currentAlignment = result.data;
        
        // حمّل التوقيتات في المحرر
        if (window.initTiming) {
            initTiming(result.data);
            showTimingPanel(true);
            updateTimingPanel();
        }
        
        const ayahsCount = result.data.ayahs?.length || 0;
        const updatedAt = result.data.updated_at 
            ? new Date(result.data.updated_at).toLocaleString('ar')
            : 'غير معروف';
        
        statusBox.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    التوقيتات محفوظة ✅
                </div>
                <div class="text-xs text-slate-400 space-y-1">
                    <div>عدد الايات: ${ayahsCount}</div>
                    <div>اخر تحديث: ${updatedAt}</div>
                </div>
                <button id="load-alignment-btn" 
                    class="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="play-circle" class="w-4 h-4"></i>
                    عرض التوقيتات
                </button>
            </div>
        `;
        
        // ربط زر العرض
        document.getElementById('load-alignment-btn').onclick = async () => {
            ViewerState.currentMushafId = UIState.currentMushafId;
            ViewerState.currentReciterCode = UIState.currentReciterCode;
            ViewerState.currentSurah = UIState.currentSurahNum;
            
            await displayAlignment(result.data);
            
            // أظهر لوحة التحكم
            if (window.initTiming) {
                initTiming(result.data);
                showTimingPanel(true);
                updateTimingPanel();
            }
        };
        
    // ============================================
    // الحالة (ب): التوقيتات غير موجودة
    // ============================================
    } else if (result.status === 'not_found') {
        statusBox.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-amber-400 text-sm">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                    لا توجد توقيتات لهذه السورة
                </div>
                <p class="text-xs text-slate-500">
                    اضغط "توليد التوقيتات" لبدء المعالجة
                </p>
                <button id="generate-alignment-btn" 
                    class="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="zap" class="w-4 h-4"></i>
                    توليد التوقيتات
                </button>
            </div>
        `;
        
        // اعرض زر "بدء الضبط اليدوي" في بطاقة المشغل
        if (window.showTimingPanel) {
            showTimingPanel(false);
        }
        
        // ربط زر التوليد
        document.getElementById('generate-alignment-btn').onclick = async () => {
        console.log('⚡ بدء توليد التوقيتات...');
        
        // 1. تحقق من وجود wavesurfer
        if (!ViewerState.wavesurfer) {
            alert('يرجى انتظار تحميل الصوت أولاً');
            return;
        }
        
        // 2. انتظر حتى ينتهي تحميل الصوت
        console.log('⏳ انتظار تحميل الصوت...');
        let duration = 0;
        let attempts = 0;
        
        while (attempts < 50) {  // 5 ثوانٍ كحد أقصى
            duration = ViewerState.wavesurfer.getDuration();
            if (duration && duration > 0) break;
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (!duration || duration === 0) {
            alert('الصوت لم يُحمّل بعد. يرجى المحاولة بعد قليل.');
            return;
        }
        
        console.log(`✅ الصوت جاهز: ${duration.toFixed(2)}s`);
        
        // 3. تحقق من النص
        const ayahElements = document.querySelectorAll('.quran-ayah');
        const ayahCount = ayahElements.length;
        
        if (ayahCount === 0) {
            alert('لا يوجد نص معروض');
            return;
        }
        
        // 4. توليد التوقيتات
        const wordCounts = [];
        let totalWords = 0;
        
        ayahElements.forEach((el) => {
            const words = Array.from(el.querySelectorAll('.quran-word'));
            const count = Math.max(1, words.length);
            wordCounts.push(count);
            totalWords += count;
        });
        
        console.log(`📖 ${ayahCount} آية، ${totalWords} كلمة`);
        
        let currentTime = 0;
        const ayahs = [];
        
        ayahElements.forEach((el, idx) => {
            const percentage = wordCounts[idx] / totalWords;
            const ayahDuration = duration * percentage;
            
            ayahs.push({
                ayah_number: parseInt(el.dataset.ayahId),
                start: parseFloat(currentTime.toFixed(2)),
                end: parseFloat((currentTime + ayahDuration).toFixed(2)),
                wordCount: wordCounts[idx],
                confidence: 1.0,
                manually_verified: false
            });
            
            currentTime += ayahDuration;
        });
        
        // تصحيح الأخير
        if (ayahs.length > 0) {
            ayahs[ayahs.length - 1].end = parseFloat(duration.toFixed(2));
        }
        
        // 5. بناء JSON
        const alignmentData = {
            surah_id: parseInt(UIState.currentSurahNum),
            mushaf_id: UIState.currentMushafId,
            reciter_id: UIState.currentReciterId,
            reciter_code: UIState.currentReciterCode,
            reciter_name: (MUSHAAFS[UIState.currentMushafId]?.reciters.find(r => r.id === UIState.currentReciterId) || {}).name || '',
            audio_url: buildAudioUrl(UIState.currentReciterCode, UIState.currentSurahNum),
            audio_duration: parseFloat(duration.toFixed(2)),
            generated_at: new Date().toISOString(),
            ayahs: ayahs
        };
        
        // 6. حفظ
        const saveResult = await saveAlignment(
            UIState.currentSurahNum,
            UIState.currentMushafId,
            UIState.currentReciterId,
            alignmentData
        );
        
        if (saveResult.status === 'saved') {
            console.log('✅ تم الحفظ بنجاح:', saveResult.path);
            
            // اعرض التوقيتات
            ViewerState.currentAlignment = alignmentData;
            
            // أظهر لوحة التحكم
            if (window.initTiming) {
                initTiming(alignmentData);
                showTimingPanel(true);
                updateTimingPanel();
            }
            
            // حدّث الحالة
            updateAlignmentStatus();
        } else {
            alert('❌ فشل الحفظ: ' + (saveResult.message || 'غير معروف'));
        }
    };
            
    // ============================================
    // الحالة (ج): خطأ
    // ============================================
    } else {
        if (window.showTimingPanel) {
            showTimingPanel(false);
        }
        
        statusBox.innerHTML = `
            <div class="text-red-400 text-sm">
                <i data-lucide="x-circle" class="w-4 h-4 inline"></i>
                خطأ: ${result.message || 'غير معروف'}
            </div>
        `;
    }
    
    lucide.createIcons();
}

// ============================================================
// 7. ربط الأحداث
// ============================================================
function bindUIEvents() {
    // تغيير المصحف
    const mushafSelect = document.getElementById('mushaf-select');
    if (mushafSelect) {
        mushafSelect.addEventListener('change', (e) => {
            UIState.currentMushafId = e.target.value;
            UIState.currentReciterCode = null;
            populateReciterSelect(e.target.value);
            updateAudioSourcePreview();
            updateAlignmentStatus();
        });
    }
    
    // تغيير القارئ
    const reciterSelect = document.getElementById('reciter-select');
    if (reciterSelect) {
        reciterSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            UIState.currentReciterId = e.target.value;                        // ← id (afs)
            UIState.currentReciterCode = selectedOption.dataset.reciterCode;  // ← code
            updateAudioSourcePreview();
            updateAlignmentStatus();
        });
    }
    
    // تغيير السورة
    const surahSelect = document.getElementById('surah-select');
    if (surahSelect) {
        surahSelect.addEventListener('change', (e) => {
            UIState.currentSurahNum = e.target.value;
            updateAudioSourcePreview();
            updateAlignmentStatus();
        });
    }
    
    // تبديل مصدر الصوت
    const serverTab = document.getElementById('source-server-tab');
    const localTab = document.getElementById('source-local-tab');
    
    if (serverTab && localTab) {
        serverTab.addEventListener('click', () => {
            UIState.currentSourceType = 'server';
            serverTab.classList.add('active');
            localTab.classList.remove('active');
            document.getElementById('panel-server')?.classList.remove('hidden');
            document.getElementById('panel-local')?.classList.add('hidden');
            updateAudioSourcePreview();
        });
        
        localTab.addEventListener('click', () => {
            UIState.currentSourceType = 'local';
            localTab.classList.add('active');
            serverTab.classList.remove('active');
            document.getElementById('panel-server')?.classList.add('hidden');
            document.getElementById('panel-local')?.classList.remove('hidden');
            updateAudioSourcePreview();
        });
    }
    
    // رفع ملف محلي
    const localFileInput = document.getElementById('local-audio-file');
    if (localFileInput) {
        localFileInput.addEventListener('change', (e) => {
            UIState.currentLocalFile = e.target.files[0] || null;
            updateAudioSourcePreview();
        });
    }
    
    console.log('✅ تم ربط الأحداث');
}

// ============================================================
// 8. التهيئة
// ============================================================
async function initUI() {
    console.log('🚀 تهيئة الواجهة...');
    
    await loadSurahs();
    populateMushafSelect();
    populateSurahSelect();
    bindUIEvents();
    
    console.log('✅ الواجهة جاهزة');
}

// تصدير
window.UIState = UIState;
window.initUI = initUI;
window.populateMushafSelect = populateMushafSelect;
window.populateReciterSelect = populateReciterSelect;
window.updateAudioSourcePreview = updateAudioSourcePreview;
window.updateAlignmentStatus = updateAlignmentStatus;

// التشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initUI);

console.log('✅ ui.js محمّل');