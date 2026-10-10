/**
 * عميل التخزين — مع تحميل من GitHub
 * Miqat - Client Storage (localStorage + GitHub)
 *
 * يعمل على:
 * - GitHub Pages (يحمّل من GitHub)
 * - محلياً (localStorage فقط)
 * - أي مكان (بدون Backend)
 */

// ============================================================
// إعدادات GitHub
// ============================================================
// ✅ نستخدم GitHub Pages (نفس النطاق — لا CORS)
const GITHUB_BASE = 'https://nouari-abdelkabir.github.io/Mozamana';
const GITHUB_ALIGNMENTS_PATH = 'alignments';

// ============================================================
// بناء مفتاح التخزين
// ============================================================
function buildStorageKey(surahNum, mushafId, reciterId) {
    const surahPadded = String(surahNum).padStart(3, '0');
    return `miqat_alignment_${mushafId}_${reciterId}_${surahPadded}`;
}

// ============================================================
// بناء رابط GitHub
// ============================================================
function buildGitHubUrl(surahNum, mushafId, reciterId) {
    const surahPadded = String(surahNum).padStart(3, '0');
    return `${GITHUB_BASE}/${GITHUB_ALIGNMENTS_PATH}/${mushafId}/${reciterId}/${surahPadded}.json`;
}

// ============================================================
// 1. جلب توقيتات
// ============================================================
async function fetchAlignment(surahNum, mushafId, reciterId) {
    try {
        const key = buildStorageKey(surahNum, mushafId, reciterId);
        console.log(`📥 جلب: ${key}`);
        
        // ============================================
        // 1. جرّب localStorage أولاً (الأسرع)
        // ============================================
        const saved = localStorage.getItem(key);
        
        if (saved) {
            const data = JSON.parse(saved);
            console.log('📦 نتيجة: found (localStorage)');
            return { status: 'found', data, source: 'local' };
        }
        
        // ============================================
        // 2. جرّب GitHub (فقط إذا كنا على GitHub Pages أو مضيف آخر)
        // ============================================
        const githubUrl = buildGitHubUrl(surahNum, mushafId, reciterId);
        console.log(`🌐 جرّب GitHub: ${githubUrl}`);
        
        try {
            const response = await fetch(githubUrl);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📦 نتيجة: found (GitHub)');
                
                // احفظ في localStorage للسرعة
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (e) {
                    console.warn('⚠️ فشل الحفظ في localStorage:', e);
                }
                
                return { status: 'found', data, source: 'github' };
            } else if (response.status === 404) {
                console.log('📦 GitHub: غير موجود (404)');
            } else {
                console.warn(`⚠️ GitHub: HTTP ${response.status}`);
            }
        } catch (e) {
            console.log('⚠️ تعذّر الاتصال بـ GitHub:', e.message);
        }
        
        // ============================================
        // 3. لا يوجد
        // ============================================
        console.log('📦 نتيجة: not_found');
        return { status: 'not_found' };
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// 2. حفظ توقيتات
// ============================================================
async function saveAlignment(surahNum, mushafId, reciterId, alignmentData) {
    try {
        const key = buildStorageKey(surahNum, mushafId, reciterId);
        console.log(`💾 حفظ: ${key}`);
        
        alignmentData.updated_at = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(alignmentData));
        
        console.log('✅ تم الحفظ في localStorage');
        return {
            status: 'saved',
            path: key
        };
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        return { status: 'error', message: error.message };
    }
}

// ============================================================
// 3. قائمة كل التوقيتات
// ============================================================
async function listAlignments() {
    try {
        const items = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('miqat_alignment_')) {
                items.push({ key });
            }
        }
        
        return { total: items.length, items };
        
    } catch (error) {
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
    const filename = `${String(surahNum).padStart(3, '0')}.json`;
    a.download = filename;
    console.log(`📁 احفظ الملف في: alignments/${mushafId}/${reciterId}/${filename}`);    a.click();
        
    URL.revokeObjectURL(url);
    
    return { status: 'exported' };
    // ============================================================
    // 4.5. تصدير SRT
    // ============================================================
    async function exportAlignmentSRT(surahNum, mushafId, reciterId) {
        try {
            const result = await fetchAlignment(surahNum, mushafId, reciterId);
            
            if (result.status !== 'found') {
                return { status: 'error', message: 'لا توجد توقيتات' };
            }
            
            const data = result.data;
            const ayahs = data.ayahs || [];
            
            // بناء SRT
            let srt = '';
            ayahs.forEach((ayah, index) => {
                srt += `${index + 1}\n`;
                srt += `${formatSRTTime(ayah.start)} --> ${formatSRTTime(ayah.end)}\n`;
                srt += `الآية ${ayah.ayah_number}\n\n`;
            });
            
            // تنزيل
            const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${mushafId}_${reciterId}_${String(surahNum).padStart(3, '0')}.srt`;
            a.click();
            URL.revokeObjectURL(url);
            
            return { status: 'exported' };
            
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    // ============================================================
    // 4.6. تصدير VTT
    // ============================================================
    async function exportAlignmentVTT(surahNum, mushafId, reciterId) {
        try {
            const result = await fetchAlignment(surahNum, mushafId, reciterId);
            
            if (result.status !== 'found') {
                return { status: 'error', message: 'لا توجد توقيتات' };
            }
            
            const data = result.data;
            const ayahs = data.ayahs || [];
            
            // بناء VTT
            let vtt = 'WEBVTT\n\n';
            ayahs.forEach((ayah, index) => {
                vtt += `${index + 1}\n`;
                vtt += `${formatVTTTime(ayah.start)} --> ${formatVTTTime(ayah.end)}\n`;
                vtt += `الآية ${ayah.ayah_number}\n\n`;
            });
            
            // تنزيل
            const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${mushafId}_${reciterId}_${String(surahNum).padStart(3, '0')}.vtt`;
            a.click();
            URL.revokeObjectURL(url);
            
            return { status: 'exported' };
            
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    // ============================================================
    // مساعدات تنسيق الوقت
    // ============================================================
    function formatSRTTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    function formatVTTTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }


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
// 6. تصدير كل التوقيتات
// ============================================================
async function exportAllAlignments() {
    const all = {};
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('miqat_alignment_')) {
            try {
                all[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {}
        }
    }
    
    const json = JSON.stringify(all, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `miqat_all_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    return { status: 'exported', count: Object.keys(all).length };
}

// ============================================================
// 7. استيراد كل التوقيتات
// ============================================================
async function importAllAlignments(jsonFile) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                let count = 0;
                
                Object.keys(data).forEach(key => {
                    if (key.startsWith('miqat_alignment_')) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                        count++;
                    }
                });
                
                resolve({ status: 'imported', count });
                
            } catch (error) {
                resolve({ status: 'error', message: error.message });
            }
        };
        
        reader.readAsText(jsonFile);
    });
}

// ============================================================
// 8. حذف كل التوقيتات
// ============================================================
async function clearAllAlignments() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('miqat_alignment_')) {
            keys.push(key);
        }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log(`🗑️ تم حذف ${keys.length} توقيت`);
    return { deleted: keys.length };
}

// ============================================================
// 9. تحقق من رابط صوت
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
// 10. جلب قائمة التوقيتات المتاحة على GitHub
// ============================================================
async function listGitHubAlignments() {
    try {
        const url = `${GITHUB_BASE}/data/alignments/index.json`;
        const response = await fetch(url);
        
        if (response.ok) {
            return await response.json();
        }
        
        return { total: 0, items: [] };
    } catch (error) {
        console.warn('⚠️ فشل جلب قائمة GitHub:', error);
        return { total: 0, items: [] };
    }
}

// ============================================================
// تصدير
// ============================================================
window.GITHUB_BASE = GITHUB_BASE;
window.buildAlignmentPath = buildStorageKey;
window.buildGitHubUrl = buildGitHubUrl;
window.fetchAlignment = fetchAlignment;
window.saveAlignment = saveAlignment;
window.listAlignments = listAlignments;
window.verifyAudioUrl = verifyAudioUrl;
window.clearAllAlignments = clearAllAlignments;
window.exportAlignment = exportAlignment;
window.importAlignment = importAlignment;
window.exportAllAlignments = exportAllAlignments;
window.importAllAlignments = importAllAlignments;
window.listGitHubAlignments = listGitHubAlignments;
window.exportAlignmentSRT = exportAlignmentSRT;
window.exportAlignmentVTT = exportAlignmentVTT;

console.log('✅ server-client.js محمّل (localStorage + GitHub mode)');
console.log(`   🌐 GitHub base: ${GITHUB_BASE}`);