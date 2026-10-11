/**
 * تحميل نص القران
 * Miqat - Quran Text Loader
 * 
 * يحمّل نص القران حسب الرواية المختارة
 * يستخدم ملفات data/mushaf_*.js
 * 
 * تنسيق الملفات:
 *   const quranData = [
 *     { sura: 1, name: "الفاتحة", ayah: 1, text: "...", page: 1 },
 *     ...
 *   ];
 */

// ============================================================
// ربط المصاحف بملفات النص
// ============================================================
const mushafToFile = {
    // حفص
    'mushaf_hafs':       'mushaf_hafs.js',
    'mushaf_hafs_2':     'mushaf_hafs.js',
    'mushaf_hafs_plain': 'mushaf_hafs_plain.js',

    // ورش
    'mushaf_warsh1':     'mushaf_warsh1.js',
    'mushaf_warsh2':     'mushaf_warsh2.js',
    'mushaf_warsh2_2':   'mushaf_warsh2.js',
    'mushaf_warsh3':     'mushaf_warsh3.js',
    'mushaf_warsh4':     'mushaf_warsh4.js',
    'mushaf_asbahani':   'mushaf_asbahani.js',
    'mushaf_asbahani_2': 'mushaf_asbahani.js',
    'mushaf_asbahani_3': 'mushaf_asbahani.js',

    // قالون
    'mushaf_qalun1':     'mushaf_qalun1.js',
    'mushaf_qalun2':     'mushaf_qalun2.js',
    'mushaf_qalun3':     'mushaf_qalun3.js',
    'mushaf_qalun4':     'mushaf_qalun4.js',

    // البزي
    'mushaf_bazzi':      'mushaf_bazzi.js',

    // قنبل
    'mushaf_qunbul':     'mushaf_qunbul.js',

    // الدوري
    'mushaf_doori1':     'mushaf_doori1.js',
    'mushaf_doori':      'mushaf_doori.js',
    'mushaf_doori_kisai': 'mushaf_doori_kisai.js',

    // السوسي
    'mushaf_soosi':      'mushaf_soosi.js',
    'mushaf_soosi_2':    'mushaf_soosi.js',

    // هشام
    'mushaf_hisham':     'mushaf_hisham.js',

    // ابن ذكوان
    'mushaf_ibnDhakwan': 'mushaf_ibnDhakwan.js',

    // شعبة
    'mushaf_shubah':     'mushaf_shubah.js',

    // خلف
    'mushaf_khalaf1':    'mushaf_khalaf1.js',
    'mushaf_khalaf2':    'mushaf_khalaf2.js',
    'mushaf_khallad1':   'mushaf_khallad1.js',
    'mushaf_khallad2':   'mushaf_khallad2.js',
    'mushaf_ishaq':      'mushaf_ishaq.js',

    // أبو الحارث
    'mushaf_abuHarith':  'mushaf_abuHarith.js',

    // ابن وردان
    'mushaf_ibnWardan':  'mushaf_ibnWardan.js',
    'mushaf_ibnJammaz':  'mushaf_ibnJammaz.js',

    // روح
    'mushaf_ruh':        'mushaf_ruh.js',
    'mushaf_ruh_2':      'mushaf_ruh.js',

    // رويس
    'mushaf_ruways':     'mushaf_ruways.js'
};

// ============================================================
// حالة التحميل
// ============================================================
let currentLoadedMushafId = null;
let currentLoadedData = null;

// ============================================================
// تحميل ملف مصحف
// ============================================================
async function loadMushafFile(mushafId) {
    // إذا كان محمّلاً مسبقاً
    if (currentLoadedMushafId === mushafId && currentLoadedData) {
        console.log(`📚 المصحف (${mushafId}) محمّل مسبقاً`);
        return currentLoadedData;
    }
    
    const fileName = mushafToFile[mushafId];
    if (!fileName) {
        console.warn(`⚠️ لا يوجد ملف لـ: ${mushafId}`);
        // fallback إلى حفص
        if (mushafId !== 'mushaf_hafs') {
            return await loadMushafFile('mushaf_hafs');
        }
        throw new Error(`لا يوجد ملف لـ: ${mushafId}`);
    }
    
    console.log(`📥 تحميل ملف المصحف: data/${fileName}`);
    
    try {
        // احذف الـ script القديم إذا وُجد
        const oldScript = document.getElementById('mushaf-script');
        if (oldScript) oldScript.remove();
        
        // احذف quranData القديم
        if (window.quranData) {
            delete window.quranData;
        }
        
        // حمّل الملف الجديد
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'mushaf-script';
            script.src = `data/${fileName}`;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`فشل تحميل: ${fileName}`));
            document.head.appendChild(script);
        });
        
        // اقرأ البيانات
        // ============================================================
        // ابحث عن البيانات في المتغيرات العالمية
        // ============================================================

        // 1. جرّب window.quranData أولاً (للحالة var)
        let foundData = null;
        let foundName = null;

        if (window.quranData && Array.isArray(window.quranData) && window.quranData.length > 100) {
            foundData = window.quranData;
            foundName = 'quranData';
        }

        // 2. إذا لم نجد، ابحث في كل المتغيرات العالمية
        if (!foundData) {
            for (const key of Object.keys(window)) {
                // تخطَّ المتغيرات المدمجة والمكتبات
                if (key.startsWith('webkit') || 
                    key.startsWith('moz') ||
                    key.startsWith('on') ||
                    key === 'location' ||
                    key === 'top' ||
                    key === 'window' ||
                    key === 'self' ||
                    key === 'document' ||
                    key === 'parent' ||
                    key === 'frames') {
                    continue;
                }
                
                try {
                    const val = window[key];
                    // ابحث عن مصفوفة تحتوي على عناصر بـ sura و text
                    if (Array.isArray(val) && 
                        val.length > 100 && 
                        val[0] && 
                        typeof val[0] === 'object' &&
                        'sura' in val[0] &&
                        'text' in val[0]) {
                        foundData = val;
                        foundName = key;
                        console.log(`🔍 وُجد المتغير: ${key} (${val.length} عنصر)`);
                        break;
                    }
                } catch (e) {
                    // تجاهل الأخطاء (بعض المتغيرات لا يمكن الوصول إليها)
                }
            }
        }

        // 3. إذا لم نجد في window، جرّب قراءة الملف كـ نص
        if (!foundData) {
            console.log('🔍 لم يُعثر في window.quranData — جاري محاولة قراءة الملف كنص...');
            
            try {
                const response = await fetch(`data/${fileName}`);
                const text = await response.text();
                
                // استخرج المصفوفة من النص باستخدام eval داخل function scope
                // (هذا امن لأننا نتحكم في الملفات)
                const extractFn = new Function(`
                    ${text}
                    return quranData;
                `);
                const data = extractFn();
                
                if (Array.isArray(data) && data.length > 100) {
                    foundData = data;
                    foundName = 'quranData (من الملف)';
                    console.log(`✅ تم استخراج البيانات من الملف`);
                }
            } catch (e) {
                console.error('❌ فشل استخراج البيانات:', e);
            }
        }

        // 4. إذا لم نجد أي شيء، أعلن الخطأ
        if (!foundData) {
            const allKeys = Object.keys(window).filter(k => 
                !k.startsWith('webkit') && 
                !k.startsWith('moz') &&
                !k.startsWith('on') &&
                k.length < 30
            );
            console.error('🔍 المتغيرات العالمية المتاحة:', allKeys);
            throw new Error(`لم يُعثر على بيانات المصحف في ${fileName}`);
        }

        console.log(`✅ وُجد المتغير: ${foundName}`);

        // وحّد الاسم في window.quranData
        window.quranData = foundData;

        currentLoadedMushafId = mushafId;
        currentLoadedData = foundData;

        console.log(`✅ تم تحميل ${fileName}: ${foundData.length} اية`);
        return foundData;
    } catch (error) {
        console.error(`❌ خطأ في تحميل ${fileName}:`, error);
        
        // fallback إلى حفص
        if (mushafId !== 'mushaf_hafs') {
            console.log('↩️ fallback إلى حفص');
            return await loadMushafFile('mushaf_hafs');
        }
        
        throw error;
    }
}

// ============================================================
// جلب نص سورة محددة
// ============================================================
async function getSurahText(mushafId, surahNum) {
    const allData = await loadMushafFile(mushafId);
    
    // فلترة السورة
    const surahAyahs = allData.filter(item => item.sura === parseInt(surahNum));
    
    if (surahAyahs.length === 0) {
        console.error(`❌ لا يوجد نص للسورة ${surahNum}`);
        return null;
    }
    
    // إزالة عنوان السورة (ayah: 0 مع اسم السورة فقط)
    // لكن نبقي البسملة
    const cleanAyahs = surahAyahs.filter(item => {
        // احذف العناصر التي نصها هو عنوان السورة فقط
        if (item.ayah === 0 && item.text && item.text.startsWith('سُورَةُ')) {
            return false;
        }
        return true;
    });
    
    // تنظيف النص: إزالة HTML spans، تحويل رموز الوقف
       // نُجهّز نسختين لكل اية:
    // 1. text: نص نظيف (للمزامنة والبحث)
    // 2. html: نص مع HTML (للعرض بالألوان)
        let ayahCounter = 0;
        const cleaned = cleanAyahs.map(item => {
            // ✅ تحديد إذا كانت بسملة (آية 0 في سورة غير الفاتحة)
            const isBasmala = item.ayah === 0 && item.text && 
                            !item.text.startsWith('سُورَةُ') &&
                            (item.text.includes('بسم') || item.text.includes('بِسۡمِ'));
            
            if (item.ayah > 0) {
                ayahCounter = item.ayah;
            } else if (isBasmala) {
                // ✅ البسملة: نحتفظ بها بدون رقم
                // (id = 0 يعني "ليست آية")
                return {
                    id: 0,   // ← البسملة
                    originalAyah: item.ayah,
                    isBasmala: true,
                    text: cleanAyahText(item.text),
                    html: cleanAyahHtml(item.text),
                    page: item.page,
                    raw: item.text
                };
            } else if (item.ayah === 0) {
                // ✅ عنوان السورة (تمت إزالته مسبقاً)
                ayahCounter++;
            }
            
            return {
                id: item.ayah > 0 ? item.ayah : ayahCounter,
                originalAyah: item.ayah,
                text: cleanAyahText(item.text),
                html: cleanAyahHtml(item.text),
                page: item.page,
                raw: item.text
            };
        });
    
    console.log(`📖 السورة ${surahNum}: ${cleaned.length} اية`);
    return cleaned;
}

// ============================================================
// تنظيف نص الاية
// ============================================================
function cleanAyahText(text) {
    if (!text) return '';
    
    // 1. أزل وسوم HTML (span)
    let cleaned = text.replace(/<span[^>]*>.*?<\/span>/g, '');
    
    // 2. أزل الوسوم المتبقية
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // 3. أزل الرموز الخاصة (رموز الوقف ﴢ ۝ وغيرها)
    cleaned = cleaned.replace(/[ﴢﴖﴗﴘﴙﴚ۝۞]/g, '');
    
    // 4. نظّف المسافات المتعددة
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// ============================================================
// تنظيف HTML مع الاحتفاظ بالألوان
// ============================================================
function cleanAyahHtml(text) {
    if (!text) return '';
    
    // ✅ لا نحذف أي شيء!
    // فقط نُصحّح بنية السبانات
    
    // صحّح: class='c1' → class="c1"
    let cleaned = text.replace(/<span\s+class=['"]?(c\d+)['"]?\s*>/g, '<span class="$1">');
    
    // نظّف المسافات المتعددة
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}


// ============================================================
// الحصول على اسم السورة
// ============================================================
async function getSurahName(mushafId, surahNum) {
    const allData = await loadMushafFile(mushafId);
    const firstAyah = allData.find(item => 
        item.sura === parseInt(surahNum) && item.ayah === 0
    );
    return firstAyah ? firstAyah.name : '';
}



// ============================================================
// تصدير
// ============================================================
window.loadMushafFile = loadMushafFile;
window.getSurahText = getSurahText;
window.getSurahName = getSurahName;
window.cleanAyahText = cleanAyahText;
window.cleanAyahHtml = cleanAyahHtml;  // ← ✅ أضف هذا السطر

window.mushafToFile = mushafToFile;

console.log('✅ quran-loader.js محمّل');