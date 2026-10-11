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
// تحويل الأرقام إلى عربية
// ============================================================
function toArabicNumber(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map(d => arabicDigits[parseInt(d)] || d).join('');
}

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
            
           // ✅ أضف رقم الآية فقط إذا كانت آية حقيقية (ليس البسملة)
            if (ayah.id > 0 && !ayah.isBasmala) {
                const ayahNum = document.createElement('span');
                ayahNum.className = 'text-emerald-500 font-Tajawal text-lg align-middle mx-4 select-none';
                const arabicNum = toArabicNumber(ayah.id);
                ayahNum.innerHTML = `&nbsp;${arabicNum}&nbsp;`;
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
      // ============================================
    // تهيئة مشغل الصوت (حسب المصدر)
    // ============================================
     // ✅ لا نُهيّئ الصوت هنا — displayAlignment يتولى ذلك
}


// ============================================================
// 2. تهيئة المشغل — بدون WaveSurfer (خط بسيط)
// ============================================================
async function initWavesurfer(audioUrl, isLocal = false) {
    console.log(`🎵 تهيئة الصوت: ${isLocal ? 'محلي' : 'سيرفر'}`);
    
    // 1. احذف القديم
    if (ViewerState.simpleAudio) {
        try {
            ViewerState.simpleAudio.pause();
            ViewerState.simpleAudio.src = '';
        } catch (e) {}
        ViewerState.simpleAudio = null;
    }
    
    ViewerState.wavesurfer = null;
    
    // 2. بناء المصدر
    let src = audioUrl;
    if (isLocal && audioUrl instanceof ArrayBuffer) {
        const blob = new Blob([audioUrl], { type: 'audio/mpeg' });
        src = URL.createObjectURL(blob);
    }
    
    // 3. إنشاء audio بسيط
    const audio = new Audio(src);
    audio.preload = 'metadata';
    ViewerState.simpleAudio = audio;
    
    // 4. انتظر metadata
    audio.onloadedmetadata = () => {
        console.log(`🎵 الصوت جاهز: ${audio.duration.toFixed(2)} ثانية`);
        
        ViewerState.currentAudioUrl = audioUrl;
        ViewerState.isLocalFile = isLocal;
        ViewerState.audioDuration = audio.duration;
        
        // ✅ اعرض شريط التقسيمات
        showSegmentsBar(audio.duration);
        
        // ✅ إظهار لوحة التوقيتات
        if (window.TimingState && TimingState.ayahs.length > 0) {
            if (window.showTimingPanel) {
                showTimingPanel(true);
                updateTimingPanel();
            }
        }
        
        // ✅ ربط أزرار التشغيل
        bindSimplePlayerButtons(audio);
    };
    
    // 5. تحديث الشريط أثناء التشغيل
    audio.ontimeupdate = () => {
        updateSegmentsCursor(audio.currentTime, audio.duration);
        
        // تحديث الشريط السفلي
        const playerProgress = document.getElementById('player-progress');
        if (playerProgress) {
            playerProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        }
        
        // تحديث الوقت
        const currentTimeEl = document.getElementById('current-time');
        if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
        
        // ✅ التظليل التلقائي (في وضع المعاينة)
        if (TimingState.mode === 'preview' && TimingState.ayahs.length > 0) {
            for (let i = 0; i < TimingState.ayahs.length; i++) {
                const a = TimingState.ayahs[i];
                if (audio.currentTime >= a.start && audio.currentTime < a.end) {
                    if (i !== TimingState.currentIndex) {
                        TimingState.currentIndex = i;
                        updateHighlightFromTiming();
                        updateTimingPanel();
                    }
                    break;
                }
            }
        }
    };
    
    // 6. عند الانتهاء
    audio.onended = () => {
        updatePlayIcon(false);
        updateSegmentsCursor(0, audio.duration);
    };
    
     // 7. ربط أزرار الزوم
    bindZoomControls();
    
    // ✅ أضف هذا السطر
    bindSpeedControls();

    // 8. أظهر الحاويات
    const playerContainer = document.getElementById('audio-player-container');
    if (playerContainer) playerContainer.classList.remove('hidden');
    
    const topPlayBtn = document.getElementById('top-play-pause-btn');
    if (topPlayBtn) topPlayBtn.classList.remove('hidden');
}

// ============================================================
// عرض شريط التقسيمات
// ============================================================
function showSegmentsBar(duration) {
    const bar = document.getElementById('segments-bar');
    const track = document.getElementById('segments-track');
    const waveContainer = document.getElementById('waveform');
    
    if (!bar || !track) return;
    
    // ✅ أخفِ waveform، أظهر segments
    if (waveContainer) waveContainer.classList.add('hidden');
    bar.classList.remove('hidden');
    
    // ✅ امسح القديم
    track.innerHTML = '';
    
    // ✅ إذا لم تكن هناك توقيتات، اعرض شريطاً واحداً
    if (!TimingState.ayahs || TimingState.ayahs.length === 0) {
        const seg = document.createElement('div');
        seg.className = 'segment';
        seg.style.width = '100%';
        seg.style.flex = '1';
        seg.dataset.ayah = 'كامل السورة';
        track.appendChild(seg);
        return;
    }
    
    // ✅ ارسم قسماً لكل آية
    const totalDuration = duration || TimingState.audioDuration;
    const trackWidth = track.parentElement.offsetWidth - 16;
    
    TimingState.ayahs.forEach((ayah, idx) => {
        const seg = document.createElement('div');
        seg.className = 'segment';
        seg.dataset.ayah = `آية ${ayah.ayah_number}`;
        seg.dataset.index = idx;
        
        // العرض النسبي (بحسب المدة)
         // ✅ العرض النسبي (بحسب المدة) — استخدم width وليس flex
        const ayahDuration = ayah.end - ayah.start;
        const widthPercent = (ayahDuration / totalDuration) * 100;
        seg.style.width = `${widthPercent}%`;
        seg.style.flexShrink = '0';
        
        // إذا كان مثبّتاً
        if (ayah.fixed) {
            seg.classList.add('fixed');
        }
        
        // النقر → انتقال إلى الآية
        seg.onclick = () => {
            console.log(`👆 نقر على القسم ${idx + 1}`);
            
            if (ViewerState.simpleAudio) {
                ViewerState.simpleAudio.currentTime = ayah.start;
                ViewerState.simpleAudio.play();
            }
            
            TimingState.currentIndex = idx;
            updateHighlightFromTiming();
            updateTimingPanel();
        };
        
        track.appendChild(seg);
    });
    
    // ✅ أضف مؤشر التقدم
    const cursor = document.createElement('div');
    cursor.className = 'segment-cursor';
    cursor.id = 'segments-cursor';
    cursor.style.left = '0';
    cursor.style.top = '8px';
    cursor.style.bottom = '8px';
    cursor.style.height = 'auto';
    track.appendChild(cursor);
    
    console.log(`✅ تم رسم ${TimingState.ayahs.length} قسم`);
}

// ============================================================
// تحديث مؤشر التقدم
// ============================================================
function updateSegmentsCursor(currentTime, duration) {
    const cursor = document.getElementById('segments-cursor');
    const track = document.getElementById('segments-track');
    
    if (!cursor || !track) return;
    
    const percent = (currentTime / duration) * 100;
    const trackWidth = track.offsetWidth;
    cursor.style.left = `${(percent / 100) * trackWidth}px`;
}

// ============================================================
// ربط أزرار التشغيل للمشغل البسيط
// ============================================================
function bindSimplePlayerButtons(audio) {
    // زر التشغيل الرئيسي
    const playBtn = document.getElementById('play-pause-btn');
    const topPlayBtn = document.getElementById('top-play-pause-btn');
    
    if (playBtn) {
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
        
        newPlayBtn.onclick = () => {
            if (audio.paused) {
                audio.play();
                updatePlayIcon(true);
            } else {
                audio.pause();
                updatePlayIcon(false);
            }
        };
    }
    
    if (topPlayBtn) {
        const newTopBtn = topPlayBtn.cloneNode(true);
        topPlayBtn.parentNode.replaceChild(newTopBtn, topPlayBtn);
        
        newTopBtn.onclick = () => {
            if (audio.paused) {
                audio.play();
                updatePlayIcon(true);
            } else {
                audio.pause();
                updatePlayIcon(false);
            }
        };
    }
    
    // زر السرعة
    const speedOptions = document.querySelectorAll('.speed-option');
    speedOptions.forEach(opt => {
        const newOpt = opt.cloneNode(true);
        opt.parentNode.replaceChild(newOpt, opt);
        
        newOpt.onclick = () => {
            const speed = parseInt(newOpt.dataset.speed);
            audio.playbackRate = speed === 0 ? 0.1 : speed;
            
            const label = document.getElementById('speed-label');
            if (label) label.textContent = `${speed}x`;
            
            document.querySelectorAll('.speed-option').forEach(b => b.classList.remove('active'));
            newOpt.classList.add('active');
            
            const menu = document.getElementById('speed-menu');
            if (menu) menu.classList.add('hidden');
        };
    });
    
    lucide.createIcons();
    updateDurationDisplay();
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
    
    // ✅ 1. اعرض النص
    await displayQuranText(
        ViewerState.currentMushafId,
        ViewerState.currentSurah
    );
    
    // ✅ 2. جهّز الصوت (من المصدر الصحيح)
       // 2. جهّز الصوت
    if (window.UIState && UIState.currentSourceType === 'local' && UIState.currentLocalAudioBuffer) {
        // ✅ استخدم ArrayBuffer
        console.log(`🎵 تهيئة الصوت المحلي (ArrayBuffer)`);
        initWavesurfer(UIState.currentLocalAudioBuffer, true);
    } else {
        const audioUrl = alignmentData.audio_url || 
            buildAudioUrl(ViewerState.currentReciterCode, ViewerState.currentSurah);
        
        if (audioUrl) {
            console.log(`🎵 تهيئة الصوت من السيرفر: ${audioUrl}`);
            initWavesurfer(audioUrl, false);
        }
    }
    
    // ✅ 3. أظهر قسم التصدير
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
    if (!el) return;
    
    // ✅ دعم المشغل البسيط
    if (ViewerState.simpleAudio) {
        el.textContent = formatTime(ViewerState.simpleAudio.duration);
    } else if (ViewerState.wavesurfer) {
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
    const level = ZOOM_LEVELS[currentZoom];
    
    if (ViewerState.wavesurfer && ViewerState.wavesurfer.getDuration() > 0) {
        try {
            ViewerState.wavesurfer.zoom(level * 10);
        } catch (e) {}
    }
    
    const label = document.getElementById('zoom-level');
    if (label) label.textContent = ZOOM_LABELS[currentZoom];
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
    
    // ✅ ربط الخيارات
    options.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const speed = parseInt(newBtn.dataset.speed);
            console.log(`⚡ اختيار سرعة: ${speed}x`);
            
            // ✅ دعم المشغل البسيط + WaveSurfer
            const rate = speed === 0 ? 0.1 : speed;
            
            if (ViewerState.simpleAudio) {
                ViewerState.simpleAudio.playbackRate = rate;
                console.log(`  ✅ simpleAudio.playbackRate = ${rate}`);
            }
            
            if (ViewerState.wavesurfer && ViewerState.wavesurfer.setPlaybackRate) {
                ViewerState.wavesurfer.setPlaybackRate(rate);
            }
            
            // تحديث الزر
            const label = document.getElementById('speed-label');
            if (label) label.textContent = `${speed}x`;
            
            // تحديث التمييز
            document.querySelectorAll('.speed-option').forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');
            
            // إغلاق القائمة
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
    const rate = speed === 0 ? 0.1 : speed;
    
    // ✅ دعم المشغل البسيط
    if (ViewerState.simpleAudio) {
        ViewerState.simpleAudio.playbackRate = rate;
    }
    
    // ✅ دعم WaveSurfer (إن وُجد)
    if (ViewerState.wavesurfer && ViewerState.wavesurfer.setPlaybackRate) {
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
    
    // ✅ دعم المشغل البسيط + WaveSurfer
    const ayah = TimingState.ayahs[idx];
    
    if (ViewerState.simpleAudio) {
        // ✅ مشغل بسيط
        ViewerState.simpleAudio.currentTime = ayah.start;
        ViewerState.simpleAudio.play();
        console.log(`🎵 الصوت انتقل للآية ${ayahId} عند ${ayah.start}s (simpleAudio)`);
    } else if (ViewerState.wavesurfer) {
        // ✅ WaveSurfer
        ViewerState.wavesurfer.setTime(ayah.start);
        ViewerState.wavesurfer.play();
        console.log(`🎵 الصوت انتقل للآية ${ayahId} عند ${ayah.start}s (wavesurfer)`);
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