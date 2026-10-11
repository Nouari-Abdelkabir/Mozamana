/**
 * عميل الخادم
 * Miqat - Server Client
 *
 * يتواصل مع خادم Python المحلي (server.py)
 * - جلب التوقيتات
 * - حفظ التوقيتات
 * - قائمة التوقيتات المتاحة
 */

// ============================================================
// الإعدادات
// ============================================================
const SERVER_BASE_URL = window.location.origin;

// ============================================================
// 1. جلب توقيتات موجودة
// ============================================================
async function fetchAlignment(surahNum, mushafId, reciterId) {
    const surahPadded = String(surahNum).padStart(3, '0');
    const url = `${SERVER_BASE_URL}/api/alignment/${mushafId}/${reciterId}/${surahPadded}`;
    
    try {
        console.log(`📥 جلب: ${mushafId}/${reciterId}/${surahPadded}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            return { status: 'error', message: `HTTP ${response.status}` };
        }
        
        const result = await response.json();
        console.log('📦 نتيجة:', result.status);
        return result;
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// 2. حفظ توقيتات
// ============================================================
async function saveAlignment(surahNum, mushafId, reciterId, alignmentData) {
    const surahPadded = String(surahNum).padStart(3, '0');
    const url = `${SERVER_BASE_URL}/api/alignment/${mushafId}/${reciterId}/${surahPadded}`;
    
    try {
        console.log(`💾 حفظ: ${mushafId}/${reciterId}/${surahPadded}`);
        
        alignmentData.updated_at = new Date().toISOString();
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alignmentData)
        });
        
        if (!response.ok) {
            return { status: 'error', message: `HTTP ${response.status}` };
        }
        
        const result = await response.json();
        console.log('✅ تم الحفظ:', result.path);
        return result;
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// 3. قائمة التوقيتات المتاحة
// ============================================================
async function listAlignments() {
    const url = `${SERVER_BASE_URL}/api/alignment-list`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log(`📋 التوقيتات: ${result.total}`);
        return result;
    } catch (error) {
        console.error('❌ خطأ:', error);
        return { total: 0, items: [] };
    }
}

// ============================================================
// 4. تصدير JSON
// ============================================================
async function exportAlignment(surahNum, mushafId, reciterId) {
    const result = await fetchAlignment(surahNum, mushafId, reciterId);
    
    if (result.status !== 'found') {
        return { status: 'error', message: 'لا توجد توقيتات' };
    }
    
    const json = JSON.stringify(result.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mushafId}_${reciterId}_${String(surahNum).padStart(3, '0')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    return { status: 'exported' };
}

// ============================================================
// 5. استيراد JSON
// ============================================================
async function importAlignment(jsonFile) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.mushaf_id || !data.reciter_id || !data.surah_id) {
                    resolve({ status: 'error', message: 'الملف غير صالح' });
                    return;
                }
                
                const result = await saveAlignment(
                    data.surah_id,
                    data.mushaf_id,
                    data.reciter_id,
                    data
                );
                
                resolve(result);
                
            } catch (error) {
                resolve({ status: 'error', message: error.message });
            }
        };
        
        reader.readAsText(jsonFile);
    });
}

// ============================================================
// 6. تحقق من رابط صوت
// ============================================================
async function verifyAudioUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok 
            ? { status: 'ok' }
            : { status: 'error', message: `HTTP ${response.status}` };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// 7. حفظ في مجلد (يعمل عبر Python فقط)
// ============================================================
async function saveToFolder(surahNum, mushafId, reciterId) {
    // ✅ في النسخة المحلية، نحفظ عبر Python مباشرة
    const result = await fetchAlignment(surahNum, mushafId, reciterId);
    
    if (result.status !== 'found') {
        return { status: 'error', message: 'لا توجد توقيتات' };
    }
    
    console.log(`✅ التوقيتات محفوظة في: alignments/${mushafId}/${reciterId}/${String(surahNum).padStart(3, '0')}.json`);
    
    return {
        status: 'saved',
        path: `alignments/${mushafId}/${reciterId}/${String(surahNum).padStart(3, '0')}.json`
    };
}

// ============================================================
// تصدير
// ============================================================
window.SERVER_BASE_URL = SERVER_BASE_URL;
window.fetchAlignment = fetchAlignment;
window.saveAlignment = saveAlignment;
window.listAlignments = listAlignments;
window.verifyAudioUrl = verifyAudioUrl;
window.exportAlignment = exportAlignment;
window.importAlignment = importAlignment;
window.saveToFolder = saveToFolder;

console.log('✅ server-client.js محمّل (Python mode)');
console.log(`   🌐 Server: ${SERVER_BASE_URL}`);