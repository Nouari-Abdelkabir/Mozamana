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
const SERVER_BASE_URL = window.location.origin; // http://localhost:8000

// ============================================================
// بناء معرف الملف: mushaf_hafs/afs
// ============================================================
function buildAlignmentPath(mushafId, reciterId) {
    if (!mushafId || !reciterId) return null;
    return `${mushafId}/${reciterId}`;
}

// ============================================================
// 1. جلب توقيتات
// ============================================================
async function fetchAlignment(surahNum, mushafId, reciterId) {
    const path = buildAlignmentPath(mushafId, reciterId);
    const surahPadded = String(surahNum).padStart(3, '0');
    
    // URL جديد: /api/alignment/{mushaf_id}/{reciter_id}/{surah}
    const url = `${SERVER_BASE_URL}/api/alignment/${path}/${surahPadded}`;
    
    try {
        console.log(`📥 جلب: ${path}/${surahPadded}`);
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
    const path = buildAlignmentPath(mushafId, reciterId);
    const surahPadded = String(surahNum).padStart(3, '0');
    
    // URL جديد
    const url = `${SERVER_BASE_URL}/api/alignment/${path}/${surahPadded}`;
    
    try {
        console.log(`💾 حفظ: ${path}/${surahPadded}`);
        
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

// تصدير
window.buildAlignmentPath = buildAlignmentPath;

// ============================================================
// 3. قائمة التوقيتات المتاحة
// ============================================================
async function listAlignments() {
    const url = `${SERVER_BASE_URL}/api/alignment-list`;
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log(`📋 التوقيتات المتاحة: ${result.total}`);
        return result;
    } catch (error) {
        console.error('❌ خطأ في جلب القائمة:', error);
        return { total: 0, items: [] };
    }
}

// ============================================================
// 4. تحقق من وجود رابط صوت
// ============================================================
async function verifyAudioUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
            return { status: 'error', message: `HTTP ${response.status}` };
        }
        
        const size = response.headers.get('Content-Length');
        const contentType = response.headers.get('Content-Type');
        
        return {
            status: 'ok',
            size: size ? parseInt(size) : null,
            contentType: contentType
        };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// تصدير
// ============================================================
window.fetchAlignment = fetchAlignment;
window.saveAlignment = saveAlignment;
window.listAlignments = listAlignments;
window.verifyAudioUrl = verifyAudioUrl;

console.log('✅ server-client.js محمّل');