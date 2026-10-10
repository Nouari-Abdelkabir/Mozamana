/**
 * بناء روابط الصوت
 * Miqat - Audio URL Builder
 *
 * يبني رابط الصوت الكامل من:
 * - كود القارئ (reciterCode)
 * - رقم السورة (surahNum)
 *
 * يدعم عدة سيرفرات:
 * - way2quran.com
 * - mp3quran.net
 * - archive.org
 */

// ============================================================
// بناء رابط الصوت
// ============================================================
function buildAudioUrl(reciterCode, surahNum) {
    if (!reciterCode) {
        console.warn('⚠️ reciterCode فارغ');
        return null;
    }

    // رقم السورة مع padding (001، 002، ...)
    const suraNum = String(surahNum).padStart(3, '0');
    // رقم بدون padding (1، 2، ...) لبعض السيرفرات
    const rawNum = String(surahNum);

    // ============================================================
    // 1. way2quran.com (روابط خاصة)
    // ============================================================

    // ياسر العطالي (روح)
    if (reciterCode === 'yasser-al-syd-hussein-al-ataly/ruuh-an-yaqub-al-hadrami') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // العيون الكوشي (ورش) — بدون padding!
    if (reciterCode === 'al-uyoun-al-kushi/warsh-an-nafi') {
        return `https://media.way2quran.com/${reciterCode}/${rawNum}.mp3`;
    }

    // أبو الوليد الهاشمي (الأصبهاني)
    if (reciterCode === 'abu-al-walid-hmzh-awad-al-hashimi/warsh-an-nafi-min-tariq-al-asbahani') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // منصور البلحاج (الأصبهاني)
    if (reciterCode === 'mnswr-blhaj/warsh-an-nafi-min-tariq-al-asbahani') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // ياسر العتبي (السوسي)
    if (reciterCode === 'yasser-al-atby/as-susi-an-abu-amr') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // محمد الفقيه (حفص)
    if (reciterCode === 'mohammed-alfaqih/hafs-an-asim') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // عبد الرشيد صوفي (أبو الحارث)
    if (reciterCode === 'abdul-rashid-soufi/abi-al-harith-an-al-kisai') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // أيمن المزني (رويس)
    if (reciterCode === 'ayman-al-mazni/ruways-an-yaqub-al-hadrami') {
        return `https://media.way2quran.com/${reciterCode}/${suraNum}.mp3`;
    }

    // ============================================================
    // 2. archive.org (قراء محددون)
    // ============================================================
    const archiveReciters = [
        'khalladsaltani',
        'a625_202506a',
        'bvc65457689565732453567786745635466786878987565y2018_gmail_002_201806',
        '555_20vvvvvv',
        'rawhhameed',
        'ishaq_an_khalaf'
    ];
    if (archiveReciters.includes(reciterCode)) {
        return `https://archive.org/download/${reciterCode}/${suraNum}.mp3`;
    }

    // ============================================================
    // 3. mp3quran.net (سيرفرات متعددة)
    // ============================================================

    // سيرفر 16
    if (reciterCode.includes('deban/Rewayat') ||
        reciterCode.includes('soufi/Rewayat') ||
        reciterCode.includes('The-ten-readings')) {
        return `https://server16.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
    }

    // سيرفر 13 (الحصري)
    if (reciterCode.includes('husr/Rewayat')) {
        return `https://server13.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
    }

    // سيرفر 9 (عبدالله)
    if (reciterCode.includes('abdullah/Rewayat')) {
        return `https://server9.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
    }

    // سيرفر 12 (محمد كريم)
    if (reciterCode.includes('m_krm/Rewayat')) {
        return `https://server12.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
    }

    // سيرفر 14 (مفتاح سلطاني)
    if (reciterCode.includes('muftah_sultany/Rewayat')) {
        return `https://server14.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
    }

    // سيرفر 11 (ياسين الجزائري)
    if (reciterCode === 'qari') {
        return `https://server11.mp3quran.net/qari/${suraNum}.mp3`;
    }

    // ============================================================
    // 4. السيرفر الافتراضي (server8)
    // ============================================================
    return `https://server8.mp3quran.net/${reciterCode}/${suraNum}.mp3`;
}

// ============================================================
// بناء معرّف التوقيت (Alignment ID)
// ============================================================
function buildAlignmentId(mushafId, reciterCode) {
    if (!mushafId || !reciterCode) return null;
    // استبدال / بـ _ لجعل المعرّف امناً لأسماء الملفات
    const sanitized = reciterCode.replace(/\//g, '_');
    return `${mushafId}__${sanitized}`;
}

// ============================================================
// تصدير
// ============================================================
window.buildAudioUrl = buildAudioUrl;
window.buildAlignmentId = buildAlignmentId;

console.log('✅ audio-urls.js محمّل');

// اختبار سريع (في وضع التطوير)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🧪 اختبار buildAudioUrl:');
    console.log('  - العفاسي (حفص):', buildAudioUrl('afs', 1));
    console.log('  - الحصري (ورش):', buildAudioUrl('husr/Rewayat-Warsh-A-n-Nafi', 1));
    console.log('  - صوفي (السوسي):', buildAudioUrl('soufi/Rewayat-Assosi-A-n-Abu-Amr', 1));
    console.log('🧪 اختبار buildAlignmentId:');
    console.log('  -', buildAlignmentId('mushaf_hafs', 'afs'));
    console.log('  -', buildAlignmentId('mushaf_warsh2', 'husr/Rewayat-Warsh-A-n-Nafi'));
}