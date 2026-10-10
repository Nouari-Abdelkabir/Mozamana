/**
 * عارض التوقيتات
 * Miqat - Alignment Viewer
 */

// ============================================================
// الحالة
// ============================================================
const ViewerState = {
    currentSurah: null,
    currentMushafId: null,
    currentReciterCode: null,
    currentAlignment: null,
    currentAudioUrl: null,
    wavesurfer: null,
    lastHighlightedIndex: -1
};

// ============================================================
// حالة الزوم والسرعة
// ============================================================
let currentZoom = 0;
const ZOOM_LEVELS = [1, 2, 5, 10];
const ZOOM_LABELS = ['1x', '2x', '5x', '10x'];

let currentSpeed = 1;

// ============================================================
// 1. عرض النص القرآني
// ============================================================
async function displayQuranText(mushafId, surahNum) {
    const content = document.getElementById('quran-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center text-slate-500 mt-32">
            <div class="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
            <p class="text-lg font-Tajawal">جاري تحميل النص...</p>
        </div>
    `;
    
    try {
        const ayahs = await getSurahText(mushafId, surahNum);
        
        if (!ayahs || ayahs.length === 0) {
            content.innerHTML = `
                <div class="text-center text-red-400 mt-32">
                    <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
                    <p>تعذر تحميل نص السورة</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        content.innerHTML = '';
        let absoluteWordIndex = 0;
        
        ayahs.forEach(ayah => {
            const ayahSpan = document.createElement('span');
            ayahSpan.className = 'quran-ayah animate-fade-in';
            ayahSpan.dataset.ayahId = ayah.id;
            
            if (ayah.html && ayah.html.includes('<span')) {
                ayahSpan.innerHTML = ayah.html;
                processAyahWords(ayahSpan, ayah.id, () => absoluteWordIndex++);
            } else {
                const words = ayah.text.split(' ').filter(w => w.trim() !== '');
                
                words.forEach((word, idx) => {
                    const wordSpan = document.createElement('span');
                    const hasLetters = /[\u0621-\u064A\u0671\u0670]/.test(word);
                    
                    if (hasLetters) {
                        wordSpan.className = 'quran-word';
                        wordSpan.textContent = word;
                        wordSpan.dataset.wordIndex = `${ayah.id}-${idx}`;
                        wordSpan.dataset.absoluteIndex = absoluteWordIndex++;
                    } else {
                        wordSpan.className = 'quran-symbol inline-block mx-1 opacity-70';
                        wordSpan.textContent = word;
                    }
                    
                    ayahSpan.appendChild(wordSpan);
                    ayahSpan.appendChild(document.createTextNode(' '));
                });
            }
            
            if (ayah.id > 0) {
                const ayahNum = document.createElement('span');
                ayahNum.className = 'text-emerald-500/60 font-Tajawal text-lg align-middle mx-4 select-none';
                ayahNum.innerHTML = `&nbsp;﴿${ayah.id}﴾&nbsp;`;
                ayahSpan.appendChild(ayahNum);
            }
            
            content.appendChild(ayahSpan);
        });
        
        content.parentElement.scrollTop = 0;
        
        console.log(`✅ تم عرض ${ayahs.length} آية`);
        setupAyahClickHandlers();
        
    } catch (error) {
        console.error('❌ خطأ في عرض النص:', error);
        content.innerHTML = `
            <div class="text-center text-red-400 mt-32">
                <p>خطأ: ${error.message}</p>
            </div>
        `;
    }
    
    // تهيئة مشغل الصوت
    if (ViewerState.currentReciterCode && ViewerState.currentSurah) {
        const audioUrl = buildAudioUrl(
            ViewerState.currentReciterCode, 
            ViewerState.currentSurah
        );
        
        if (audioUrl) {
            console.log(`🎵 تهيئة الصوت: ${audioUrl}`);
            initWavesurfer(audioUrl);
        }
    }
}

// ============================================================
// 2. تهيئة مشغل الصوت
// ============================================================
async function initWavesurfer(audioUrl) {
    // ✅ تحقق من الرابط أولاً
    console.log(`🔍 التحقق من الرابط: ${audioUrl}`);
    
    try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        if (!response.ok) {
            console.error(`❌ الرابط غير صالح: HTTP ${response.status}`);
            console.error(`🔗 الرابط: ${audioUrl}`);
            // اعرض تنبيهاً
            alert(`⚠️ رابط الصوت غير متاح (HTTP ${response.status})\n\n${audioUrl}`);
            return;
        }
        console.log('✅ الرابط صالح');
    } catch (e) {
        console.error('❌ فشل التحقق:', e.message);
        alert(`⚠️ لا يمكن الوصول لرابط الصوت:\n${audioUrl}\n\n${e.message}`);
        return;
    }
    
    // ✅ الآن، تدمير القديم بأمان
    if (ViewerState.wavesurfer) {
        try { 
            ViewerState.wavesurfer.destroy(); 
        } catch(e) {
            console.warn('⚠️ فشل التدمير:', e.message);
        }
    }
    
    ViewerState.currentAudioUrl = audioUrl;
    ViewerState.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#10b981',
        progressColor: '#065F46',
        cursorColor: '#B8860B',
        barWidth: 2,
        barGap: 3,
        barRadius: 4,
        height: 50,
        normalize: true,
    });
    
    ViewerState.wavesurfer.load(audioUrl);
    
    // ✅ ربط أزرار الزوم والسرعة
    bindZoomControls();
    bindSpeedControls();
    
    const playerContainer = document.getElementById('audio-player-container');
    if (playerContainer) playerContainer.classList.remove('hidden');
    
    const topPlayBtn = document.getElementById('top-play-pause-btn');
    if (topPlayBtn) topPlayBtn.classList.remove('hidden');
    
    // عند الجاهزية
    ViewerState.wavesurfer.on('ready', () => {
        console.log('🎵 الصوت جاهز:', ViewerState.wavesurfer.getDuration(), 'ثانية');
        updateDurationDisplay();
        
        // ✅ الآن يمكن تطبيق الزوم (الصوت محمّل)
        applyZoom();
    });
    
    // عند التشغيل
    ViewerState.wavesurfer.on('play', () => {
        updatePlayIcon(true);
    });
    
    // عند الإيقاف
    ViewerState.wavesurfer.on('pause', () => {
        updatePlayIcon(false);
    });
    
    // عند الانتهاء
    ViewerState.wavesurfer.on('finish', () => {
        updatePlayIcon(false);
        clearHighlight();
    });
    
    // تحديث الوقت
    ViewerState.wavesurfer.on('timeupdate', (time) => {
        updateTimeDisplay(time);
        if (ViewerState.currentAlignment) {
            updateHighlight(time);
        }
    });
    
    // ربط أزرار التشغيل
    setTimeout(() => {
        const playBtn = document.getElementById('play-pause-btn');
        const topPlayBtn = document.getElementById('top-play-pause-btn');
        
        if (playBtn) {
            const newPlayBtn = playBtn.cloneNode(true);
            playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
            
            newPlayBtn.addEventListener('click', () => {
                ViewerState.wavesurfer.playPause();
            });
        }
        
        if (topPlayBtn) {
            const newTopBtn = topPlayBtn.cloneNode(true);
            topPlayBtn.parentNode.replaceChild(newTopBtn, topPlayBtn);
            
            newTopBtn.addEventListener('click', () => {
                ViewerState.wavesurfer.playPause();
            });
        }
        
        lucide.createIcons();
    }, 100);
    
    // إظهار لوحة التوقيتات
    setTimeout(() => {
        if (window.TimingState && TimingState.ayahs.length > 0) {
            if (window.showTimingPanel) {
                showTimingPanel(true);
                updateTimingPanel();
            }
        }
    }, 300);
}

// ============================================================
// 3. عرض التوقيتات المحفوظة
// ============================================================
async function displayAlignment(alignmentData) {
    if (!alignmentData || !alignmentData.ayahs) {
        console.warn('⚠️ بيانات التوقيتات فارغة');
        return;
    }
    
    ViewerState.currentAlignment = alignmentData;
    
    await displayQuranText(
        ViewerState.currentMushafId,
        ViewerState.currentSurah
    );
    
    const audioUrl = alignmentData.audio_url || 
        buildAudioUrl(ViewerState.currentReciterCode, ViewerState.currentSurah);
    
    if (audioUrl) {
        initWavesurfer(audioUrl);
    }
    
    const exportContainer = document.getElementById('export-container');
    if (exportContainer) exportContainer.classList.remove('hidden');
    
    console.log(`✅ تم عرض التوقيتات (${alignmentData.ayahs.length} آية)`);
}

// ============================================================
// 4. التظليل — معطّل (المستخدم يتحكم يدوياً)
// ============================================================
function updateHighlight(currentTime) {
    return;
}

function clearHighlight() {
    document.querySelectorAll('.quran-ayah.active').forEach(el => {
        el.classList.remove('active');
    });
    ViewerState.lastHighlightedIndex = -1;
}

// ============================================================
// 5. دوال مساعدة
// ============================================================
function updateTimeDisplay(time) {
    const el = document.getElementById('current-time');
    if (el) el.textContent = formatTime(time);
    
    const progress = document.getElementById('player-progress');
    if (progress && ViewerState.wavesurfer) {
        const duration = ViewerState.wavesurfer.getDuration();
        if (duration > 0) {
            progress.style.width = `${(time / duration) * 100}%`;
        }
    }
}

function updateDurationDisplay() {
    const el = document.getElementById('duration');
    if (el && ViewerState.wavesurfer) {
        el.textContent = formatTime(ViewerState.wavesurfer.getDuration());
    }
}

function updatePlayIcon(isPlaying) {
    const icon = document.getElementById('play-icon');
    const topIcon = document.getElementById('top-play-icon');
    
    [icon, topIcon].forEach(el => {
        if (el) el.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
    });
    lucide.createIcons();
}

function formatTime(s) {
    if (!s || isNaN(s)) return '00:00';
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
}

function isElementInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
}

// ============================================================
// 6. ربط أزرار التشغيل
// ============================================================
function bindPlayerButtons() {
    const playBtn = document.getElementById('play-pause-btn');
    const topPlayBtn = document.getElementById('top-play-pause-btn');
    
    [playBtn, topPlayBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (ViewerState.wavesurfer) {
                    ViewerState.wavesurfer.playPause();
                }
            });
        }
    });
    
    const zoomIn = document.getElementById('zoom-in-btn');
    const zoomOut = document.getElementById('zoom-out-btn');
    const content = document.getElementById('quran-content');
    
    let currentSize = 48;
    
    if (zoomIn && content) {
        zoomIn.addEventListener('click', () => {
            currentSize = Math.min(80, currentSize + 4);
            content.style.fontSize = `${currentSize}px`;
        });
    }
    
    if (zoomOut && content) {
        zoomOut.addEventListener('click', () => {
            currentSize = Math.max(20, currentSize - 4);
            content.style.fontSize = `${currentSize}px`;
        });
    }
}

// ============================================================
// 7. 🔊 الزوم على waveform
// ============================================================
function bindZoomControls() {
    const zoomIn = document.getElementById('zoom-wave-in');
    const zoomOut = document.getElementById('zoom-wave-out');
    
    if (zoomIn) {
        const newZoomIn = zoomIn.cloneNode(true);
        zoomIn.parentNode.replaceChild(newZoomIn, zoomIn);
        
        newZoomIn.addEventListener('click', () => {
            if (currentZoom < ZOOM_LEVELS.length - 1) {
                currentZoom++;
                applyZoom();
            }
        });
    }
    
    if (zoomOut) {
        const newZoomOut = zoomOut.cloneNode(true);
        zoomOut.parentNode.replaceChild(newZoomOut, zoomOut);
        
        newZoomOut.addEventListener('click', () => {
            if (currentZoom > 0) {
                currentZoom--;
                applyZoom();
            }
        });
    }
    
    // ✅ لا تستدعي applyZoom هنا — سيُستدعى عند ready
}

function applyZoom() {
    const level = ZOOM_LEVELS[currentZoom];  // 1, 2, 5, 10
    const pixelValue = level * 10;           // ← قيمة أقل (10, 20, 50, 100)
    
    if (ViewerState.wavesurfer) {
        try {
            ViewerState.wavesurfer.zoom(pixelValue);
        } catch (e) {
            console.warn('⚠️ zoom failed:', e.message);
        }
    }
    
    const label = document.getElementById('zoom-level');
    if (label) label.textContent = ZOOM_LABELS[currentZoom];
    
    console.log(`🔍 زوم: ${ZOOM_LABELS[currentZoom]} (${pixelValue}px)`);
}

// ============================================================
// 8. ⚡ سرعة الصوت
// ============================================================
function bindSpeedControls() {
    const speedBtn = document.getElementById('speed-btn');
    const speedMenu = document.getElementById('speed-menu');
    const options = document.querySelectorAll('.speed-option');
    
    if (!speedBtn || !speedMenu) {
        console.warn('⚠️ أزرار السرعة غير موجودة');
        return;
    }
    
    // احذف المستمعين القدماء
    const newSpeedBtn = speedBtn.cloneNode(true);
    speedBtn.parentNode.replaceChild(newSpeedBtn, speedBtn);
    
    newSpeedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const isHidden = speedMenu.classList.contains('hidden');
        
        if (isHidden) {
            // احسب الموضع
            const rect = newSpeedBtn.getBoundingClientRect();
            speedMenu.style.left = `${rect.left}px`;
            speedMenu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            speedMenu.style.top = 'auto';
            
            speedMenu.classList.remove('hidden');
        } else {
            speedMenu.classList.add('hidden');
        }
        
        console.log('⚡ قائمة السرعة:', isHidden ? 'مفتوحة' : 'مغلقة');
    });
    
    // النقر على خيار
    options.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const speed = parseInt(newBtn.dataset.speed);
            setSpeed(speed);
            speedMenu.classList.add('hidden');
        });
    });
    
    // إغلاق عند النقر خارج
    document.addEventListener('click', (e) => {
        if (!newSpeedBtn.contains(e.target) && !speedMenu.contains(e.target)) {
            speedMenu.classList.add('hidden');
        }
    });
    
    updateSpeedActive();
}
function setSpeed(speed) {
    currentSpeed = speed;
    
    if (ViewerState.wavesurfer) {
        const rate = speed === 0 ? 0.1 : speed;
        ViewerState.wavesurfer.setPlaybackRate(rate);
    }
    
    const label = document.getElementById('speed-label');
    if (label) label.textContent = `${speed}x`;
    
    updateSpeedActive();
    
    console.log(`⚡ سرعة: ${speed}x`);
}

function updateSpeedActive() {
    document.querySelectorAll('.speed-option').forEach(btn => {
        const speed = parseInt(btn.dataset.speed);
        if (speed === currentSpeed) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ============================================================
// 9. ربط النقر على الآيات
// ============================================================
function setupAyahClickHandlers() {
    const ayahElements = document.querySelectorAll('.quran-ayah');
    
    ayahElements.forEach(el => {
        el.style.cursor = 'pointer';
        el.replaceWith(el.cloneNode(true));
    });
    
    const newAyahElements = document.querySelectorAll('.quran-ayah');
    
    newAyahElements.forEach(el => {
        el.addEventListener('click', () => {
            const ayahId = parseInt(el.dataset.ayahId);
            console.log(`👆 نقر على الآية ${ayahId}`);
            goToAyahById(ayahId);
        });
    });
    
    console.log(`✅ تم ربط النقر على ${newAyahElements.length} آية`);
}

// ============================================================
// 10. الانتقال إلى آية محددة
// ============================================================
function goToAyahById(ayahId) {
    if (!TimingState.ayahs || TimingState.ayahs.length === 0) {
        console.warn('⚠️ لا توجد توقيتات');
        return;
    }
    
    const idx = TimingState.ayahs.findIndex(a => a.ayah_number === ayahId);
    
    if (idx === -1) {
        console.warn(`⚠️ الآية ${ayahId} غير موجودة في التوقيتات`);
        return;
    }
    
    TimingState.currentIndex = idx;
    
    if (window.updateTimingPanel) {
        updateTimingPanel();
    }
    
    document.querySelectorAll('.quran-ayah.active').forEach(e => {
        e.classList.remove('active');
    });
    
    const el = document.querySelector(`.quran-ayah[data-ayah-id="${ayahId}"]`);
    if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (ViewerState.wavesurfer) {
        const ayah = TimingState.ayahs[idx];
        ViewerState.wavesurfer.setTime(ayah.start);
        ViewerState.wavesurfer.play();
        console.log(`🎵 الصوت انتقل للآية ${ayahId} عند ${ayah.start}s`);
    }
}

// ============================================================
// 11. معالجة كلمات الآية
// ============================================================
function processAyahWords(ayahSpan, ayahId, incrementIndex) {
    let wordIdx = 0;
    
    // 1. السبانات الملونة (c1..c26)
    const coloredSpans = ayahSpan.querySelectorAll('span[class^="c"]');
    coloredSpans.forEach(span => {
        if (/^c\d+$/.test(span.className)) {
            span.classList.add('quran-word');
            span.dataset.wordIndex = `${ayahId}-${wordIdx}`;
            span.dataset.absoluteIndex = incrementIndex();
            wordIdx++;
        }
    });
    
    // 2. النصوص العادية
    const walker = document.createTreeWalker(ayahSpan, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        const parent = node.parentNode;
        if (parent && parent.tagName === 'SPAN' && /^c\d+/.test(parent.className)) {
            continue;
        }
        textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        if (!text || !text.trim()) return;
        
        const parts = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        
        parts.forEach(part => {
            if (!part) return;
            
            if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(part));
                return;
            }
            
            const hasLetters = /[\u0621-\u064A\u0671\u0670]/.test(part);
            
            if (hasLetters) {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'quran-word';
                wordSpan.textContent = part;
                wordSpan.dataset.wordIndex = `${ayahId}-${wordIdx}`;
                wordSpan.dataset.absoluteIndex = incrementIndex();
                wordIdx++;
                fragment.appendChild(wordSpan);
            } else {
                const symbolSpan = document.createElement('span');
                symbolSpan.className = 'quran-symbol inline-block mx-1 opacity-70';
                symbolSpan.textContent = part;
                fragment.appendChild(symbolSpan);
            }
        });
        
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

// ============================================================
// التصدير
// ============================================================
window.ViewerState = ViewerState;
window.displayQuranText = displayQuranText;
window.displayAlignment = displayAlignment;
window.initWavesurfer = initWavesurfer;
window.bindPlayerButtons = bindPlayerButtons;
window.processAyahWords = processAyahWords;
window.setupAyahClickHandlers = setupAyahClickHandlers;
window.goToAyahById = goToAyahById;
window.setSpeed = setSpeed;
window.applyZoom = applyZoom;

// التهيئة
document.addEventListener('DOMContentLoaded', () => {
    bindPlayerButtons();
});

console.log('✅ alignment-viewer.js محمّل');