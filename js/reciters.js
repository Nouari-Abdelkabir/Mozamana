/**
 * بيانات المصاحف والقراء
 * Miqat - Mushafs & Reciters
 *
 * البنية: كل مصحف → قائمة القراء المرتبطين به
 */

// ============================================================
// 📚 المصاحف والقراء
// ============================================================
const MUSHAAFS = {
    // ------ حفص عن عاصم ------
    'mushaf_hafs': {
        name: 'حفص عن عاصم',
        textFile: 'mushaf_hafs.js',
        reciters: [
            { id: 'afs', name: 'مشاري راشد العفاسي', code: 'afs' },
            { id: 'mohammed-alfaqih', name: 'محمد الفقيه', code: 'mohammed-alfaqih/hafs-an-asim' }
        ]
    },
    
    // ------ ورش عن نافع بقصر البدل ------
    'mushaf_warsh1': {
        name: 'ورش عن نافع بقصر البدل',
        textFile: 'mushaf_warsh1.js',
        reciters: [
            { id: 'qari', name: 'ياسين الجزائري', code: 'qari' }
        ]
    },
    
    // ------ ورش عن نافع بتوسط البدل ------
    'mushaf_warsh2': {
        name: 'ورش عن نافع بتوسط البدل',
        textFile: 'mushaf_warsh2.js',
        reciters: [
            { id: 'husr-warsh', name: 'محمود خليل الحصري', code: 'husr/Rewayat-Warsh-A-n-Nafi' },
            { id: 'al-uyoun-al-kushi', name: 'العيون الكوشي', code: 'al-uyoun-al-kushi/warsh-an-nafi' }
        ]
    },
    
    // ------ ورش من طريق الأصبهاني ------
    'mushaf_asbahani': {
        name: 'ورش من طريق الأصبهاني',
        textFile: 'mushaf_asbahani.js',
        reciters: [
            { id: 'm_krm', name: 'محمد عبدالكريم', code: 'm_krm/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Abi-Baker-Alasbahani' },
            { id: 'abu-al-walid', name: 'أبو الوليد حمزة عوض الهاشمي', code: 'abu-al-walid-hmzh-awad-al-hashimi/warsh-an-nafi-min-tariq-al-asbahani' },
            { id: 'mnswr-blhaj', name: 'منصور البلحاج', code: 'mnswr-blhaj/warsh-an-nafi-min-tariq-al-asbahani' }
        ]
    },
    
    // ------ قالون عن نافع بالإسكان ------
    'mushaf_qalun1': {
        name: 'قالون عن نافع بالإسكان',
        textFile: 'mushaf_qalun1.js',
        reciters: [
            { id: 'husr-qalun', name: 'محمود خليل الحصري', code: 'husr/Rewayat-Qalon-A-n-Nafi' }
        ]
    },
    
    // ------ قالون عن نافع بالصلة ------
    'mushaf_qalun2': {
        name: 'قالون عن نافع بالصلة',
        textFile: 'mushaf_qalun2.js',
        reciters: [
            { id: 'sabdulhakam', name: 'صابر عبد الحكم', code: 'The-ten-readings/Rewayat-Qalon-A-n-Nafi-Qaser-Jame/Sabdulhakam' }
        ]
    },
    
    // ------ البزي عن ابن كثير ------
    'mushaf_bazzi': {
        name: 'البزي عن ابن كثير',
        textFile: 'mushaf_bazzi.js',
        reciters: [
            { id: 'deban-bazzi', name: 'أحمد ديبان', code: 'deban/Rewayat-Albizi-A-n-Ibn-Katheer' }
        ]
    },
    
    // ------ قنبل عن ابن كثير ------
    'mushaf_qunbul': {
        name: 'قنبل عن ابن كثير',
        textFile: 'mushaf_qunbul.js',
        reciters: [
            { id: 'deban-qunbul', name: 'أحمد ديبان', code: 'deban/Rewayat-Qunbol-A-n-Ibn-Katheer' }
        ]
    },
    
    // ------ الدوري عن أبي عمرو ------
    'mushaf_doori1': {
        name: 'الدوري عن أبي عمرو',
        textFile: 'mushaf_doori1.js',
        reciters: [
            { id: 'deban-doori', name: 'أحمد ديبان', code: 'deban/Rewayat-Aldori-A-n-Abi-Amr' },
            { id: 'sabdulhakam-doori', name: 'صابر عبد الحكم', code: 'The-ten-readings/Rewayat-Aldori-A-n-Abi-Amr-madd/Sabdulhakam' }
        ]
    },
    
    // ------ السوسي عن أبي عمرو ------
    'mushaf_soosi': {
        name: 'السوسي عن أبي عمرو',
        textFile: 'mushaf_soosi.js',
        reciters: [
            { id: 'soufi-soosi', name: 'عبد الرشيد صوفي', code: 'soufi/Rewayat-Assosi-A-n-Abi-Amr' },
            { id: 'yasser-al-atby', name: 'ياسر العتبي', code: 'yasser-al-atby/as-susi-an-abu-amr' }
        ]
    },
    
    // ------ الدوري عن الكسائي ------
    'mushaf_doori_kisai': {
        name: 'الدوري عن الكسائي',
        textFile: 'mushaf_doori_kisai.js',
        reciters: [
            { id: 'abdullah-kisai', name: 'محمد عبدالحكيم سعيد عبدالله', code: 'abdullah/Rewayat-AlDorai-A-n-Al-Kisa-ai' }
        ]
    },
    
    // ------ هشام عن ابن عامر ------
    'mushaf_hisham': {
        name: 'هشام عن ابن عامر',
        textFile: 'mushaf_hisham.js',
        reciters: [
            { id: 'deban-hisham', name: 'أحمد ديبان', code: 'deban/Rewayat-Hesham-A-n-Abi-A-mer' }
        ]
    },
    
    // ------ ابن ذكوان عن ابن عامر ------
    'mushaf_ibnDhakwan': {
        name: 'ابن ذكوان عن ابن عامر',
        textFile: 'mushaf_ibnDhakwan.js',
        reciters: [
            { id: 'muftah-ibnDhakwan', name: 'مفتاح محمد سُلطاني', code: 'muftah_sultany/Rewayat_Ibn-Thakwan-A-n-Ibn-Amer' }
        ]
    },
    
    // ------ شعبة عن عاصم ------
    'mushaf_shubah': {
        name: 'شعبة عن عاصم',
        textFile: 'mushaf_shubah.js',
        reciters: [
            { id: 'deban-shubah', name: 'أحمد ديبان', code: 'deban/Rewayat-Sho-bah-A-n-Asim' }
        ]
    },
    
    // ------ خلف عن حمزة ------
    'mushaf_khalaf1': {
        name: 'خلف عن حمزة',
        textFile: 'mushaf_khalaf1.js',
        reciters: [
            { id: 'soufi-khalaf', name: 'عبد الرشيد صوفي', code: 'soufi/Rewayat-Khalaf-A-n-Hamzah' }
        ]
    },
    
    // ------ خلاد عن حمزة ------
    'mushaf_khallad2': {
        name: 'خلاد عن حمزة',
        textFile: 'mushaf_khallad2.js',
        reciters: [
            { id: 'khalladsaltani', name: 'مفتاح محمد سُلطاني', code: 'khalladsaltani' }
        ]
    },
    
    // ------ أبو الحارث عن الكسائي ------
    'mushaf_abuHarith': {
        name: 'أبو الحارث عن الكسائي',
        textFile: 'mushaf_abuHarith.js',
        reciters: [
            { id: 'soufi-abi-al-harith', name: 'عبد الرشيد صوفي', code: 'abdul-rashid-soufi/abi-al-harith-an-al-kisai' }
        ]
    },
    
    // ------ ابن وردان عن أبي جعفر ------
    'mushaf_ibnWardan': {
        name: 'ابن وردان عن أبي جعفر',
        textFile: 'mushaf_ibnWardan.js',
        reciters: [
            { id: 'bvc-ibnWardan', name: 'عبد الكريم عبد الحكم', code: 'bvc65457689565732453567786745635466786878987565y2018_gmail_002_201806' }
        ]
    },
    
    // ------ ابن جماز عن أبي جعفر ------
    'mushaf_ibnJammaz': {
        name: 'ابن جماز عن أبي جعفر',
        textFile: 'mushaf_ibnJammaz.js',
        reciters: [
            { id: '555-ibnJammaz', name: 'مفتاح السلطني', code: '555_20vvvvvv' }
        ]
    },
    
    // ------ روح عن يعقوب ------
    'mushaf_ruh': {
        name: 'روح عن يعقوب',
        textFile: 'mushaf_ruh.js',
        reciters: [
            { id: 'rawhhameed', name: 'عبد الله بن محمد الحميد', code: 'rawhhameed' },
            { id: 'yasser-al-ataly', name: 'ياسر السيد حسين العطالي', code: 'yasser-al-syd-hussein-al-ataly/ruuh-an-yaqub-al-hadrami' }
        ]
    },
    
    // ------ رويس عن يعقوب ------
    'mushaf_ruways': {
        name: 'رويس عن يعقوب',
        textFile: 'mushaf_ruways.js',
        reciters: [
            { id: 'ayman-al-mazni', name: 'أيمن المزني', code: 'ayman-al-mazni/ruways-an-yaqub-al-hadrami' }
        ]
    },
    
    // ------ إسحاق عن خلف ------
    'mushaf_ishaq': {
        name: 'إسحاق عن خلف',
        textFile: 'mushaf_ishaq.js',
        reciters: [
            { id: 'ishaq_an_khalaf', name: 'مفتاح محمد سُلطاني', code: 'ishaq_an_khalaf' }
        ]
    }
};

// ============================================================
// 🗺️ خريطة: المصحف → ملف النص
// ============================================================
const mushafToTextFile = {};
Object.keys(MUSHAAFS).forEach(id => {
    mushafToTextFile[id] = MUSHAAFS[id].textFile;
});

// ============================================================
// 📋 قائمة الروايات للعرض في الواجهة
// ============================================================
const RIWAYAT_LIST = Object.keys(MUSHAAFS).map(id => ({
    id: id,
    name: MUSHAAFS[id].name
}));

// ============================================================
// تصدير
// ============================================================
window.MUSHAAFS = MUSHAAFS;
window.mushafToTextFile = mushafToTextFile;
window.RIWAYAT_LIST = RIWAYAT_LIST;

console.log(`✅ reciters.js: ${Object.keys(MUSHAAFS).length} رواية`);
Object.keys(MUSHAAFS).forEach(id => {
    console.log(`   📖 ${MUSHAAFS[id].name}: ${MUSHAAFS[id].reciters.length} قارئ`);
});