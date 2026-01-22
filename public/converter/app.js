// --- CONFIGURATION ---
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

// Supported Formats
const FORMATS = {
    video: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif', 'mp3'],
    audio: ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
    image: ['jpg', 'png', 'webp', 'bmp', 'ico'],
    doc:   ['pdf', 'html']
};

// Default States
const DEFAULTS = {
    video: { res: 'original', fps: 'original', audio: 'keep', qual: 'medium' },
    audio: { bitrate: '128k', channels: 'original' },
    image: { scale: '100' },
    doc:   { pageSize: 'a4', orientation: 'portrait', margin: '10' } // NEW: DOCX Defaults
};

// --- STATE ---
let files = [];

const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileList: document.getElementById('file-list'),
    empty: document.getElementById('empty-state'),
    status: document.getElementById('engine-status'),
    convertBtn: document.getElementById('convert-all-btn')
};

// --- INIT ENGINE ---
async function initFFmpeg() {
    try {
        ffmpeg = createFFmpeg({ log: false });
        await ffmpeg.load();
        dom.status.className = "flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200";
        dom.status.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Engine Ready`;
    } catch (e) {
        console.error("Engine failed:", e);
        dom.status.innerHTML = "Engine Error (Check Console)";
    }
}
initFFmpeg();

// --- DRAG & DROP ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eName => {
    dom.dropZone.addEventListener(eName, e => { e.preventDefault(); e.stopPropagation(); });
});
dom.dropZone.addEventListener('dragenter', () => dom.dropZone.classList.add('drag-over'));
dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag-over'));
dom.dropZone.addEventListener('drop', (e) => {
    dom.dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});
document.getElementById('file-upload').addEventListener('change', (e) => handleFiles(e.target.files));

// --- FILE LOGIC ---
function getType(file) {
    if (file.name.endsWith('.docx')) return 'doc';
    if (file.type.startsWith('video/') || ['mkv','avi','mov'].some(x => file.name.endsWith(x))) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
}

function handleFiles(fileList) {
    if (!fileList.length) return;

    Array.from(fileList).forEach(file => {
        const type = getType(file);
        
        if (type === 'unknown') {
            showToast(`Error: ${file.name} is not a supported format.`, true);
            return;
        }

        dom.empty.style.display = 'none';
        dom.fileList.classList.remove('hidden');
        dom.convertBtn.disabled = false;
        dom.convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        const id = Math.random().toString(36).substr(2, 9);
        const defaultTarget = type === 'doc' ? 'pdf' : (type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'png'));
        
        const settings = JSON.parse(JSON.stringify(DEFAULTS[type]));

        files.push({ id, file, type, target: defaultTarget, settings, status: 'idle' });
        renderCard(id, file, type, defaultTarget, settings);
    });
}

function renderCard(id, file, type, defaultTarget, settings) {
    const div = document.createElement('div');
    div.id = `card-${id}`;
    div.className = "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 fade-in relative group";
    
    const iconMap = { video: '🎬', audio: '🎵', image: '🖼️', doc: '📝' };
    const fmtOpts = FORMATS[type].map(f => `<option value="${f}" ${f === defaultTarget ? 'selected' : ''}>${f.toUpperCase()}</option>`).join('');

    // --- DYNAMIC SETTINGS GENERATOR ---
    let settingsHTML = '';
    
    if (type === 'video') {
        settingsHTML = `
            <select onchange="updateSet('${id}', 'res', this.value)" class="opt-input">
                <option value="original">Orig Res</option>
                <option value="1080">1080p</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
            </select>
            <select onchange="updateSet('${id}', 'fps', this.value)" class="opt-input">
                <option value="original">Orig FPS</option>
                <option value="60">60 fps</option>
                <option value="30">30 fps</option>
            </select>
            <select onchange="updateSet('${id}', 'qual', this.value)" class="opt-input">
                <option value="medium" selected>Med Q</option>
                <option value="high">High Q</option>
                <option value="low">Low Q</option>
            </select>
            <select onchange="updateSet('${id}', 'audio', this.value)" class="opt-input">
                <option value="keep">Keep Audio</option>
                <option value="remove">Mute</option>
            </select>
        `;
    } else if (type === 'audio') {
        settingsHTML = `
            <select onchange="updateSet('${id}', 'bitrate', this.value)" class="opt-input">
                <option value="128k" selected>128 kbps</option>
                <option value="320k">320 kbps</option>
                <option value="64k">64 kbps</option>
            </select>
            <select onchange="updateSet('${id}', 'channels', this.value)" class="opt-input">
                <option value="original">Orig Channels</option>
                <option value="2">Stereo</option>
                <option value="1">Mono</option>
            </select>
        `;
    } else if (type === 'image') {
        settingsHTML = `
             <select onchange="updateSet('${id}', 'scale', this.value)" class="opt-input">
                <option value="100">Orig Size</option>
                <option value="75">75% Scale</option>
                <option value="50">50% Scale</option>
            </select>
        `;
    } else if (type === 'doc') {
        // NEW: DOCX SPECIFIC OPTIONS
        settingsHTML = `
             <select onchange="updateSet('${id}', 'pageSize', this.value)" class="opt-input">
                <option value="a4">A4 Page</option>
                <option value="letter">Letter Page</option>
            </select>
             <select onchange="updateSet('${id}', 'orientation', this.value)" class="opt-input">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
            </select>
             <select onchange="updateSet('${id}', 'margin', this.value)" class="opt-input">
                <option value="10">Normal Margin</option>
                <option value="0">No Margin</option>
                <option value="20">Wide Margin</option>
            </select>
        `;
    }

    div.innerHTML = `
        <div class="flex items-center gap-4 w-full">
            <div class="w-12 h-12 bg-indigo-50 text-iri rounded-xl flex items-center justify-center text-2xl flex-shrink-0">${iconMap[type]}</div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 truncate">${file.name}</h4>
                <p class="text-xs text-slate-500 font-medium">${(file.size / 1024 / 1024).toFixed(2)} MB • ${type.toUpperCase()}</p>
            </div>
            <button onclick="removeFile('${id}')" class="text-slate-300 hover:text-red-500 p-2 text-xl">&times;</button>
        </div>

        <div class="w-full bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div class="flex flex-col col-span-1">
                <label class="text-[10px] text-slate-400 font-bold uppercase mb-1">Target</label>
                <select onchange="updateTarget('${id}', this.value)" class="opt-input font-bold text-iri">
                    ${fmtOpts}
                </select>
            </div>
            ${settingsHTML}
        </div>

        <div id="action-${id}" class="w-full">
            <div class="w-full bg-slate-200 rounded-full h-1.5 hidden mt-2" id="prog-bg-${id}">
                <div class="bg-iri h-1.5 rounded-full transition-all duration-300" style="width: 0%" id="prog-bar-${id}"></div>
            </div>
            <div id="status-${id}" class="text-xs font-bold text-slate-400 mt-1 text-right h-4"></div>
        </div>
    `;
    dom.fileList.appendChild(div);
}

// --- STATE UPDATES ---
function updateTarget(id, val) {
    const f = files.find(x => x.id === id);
    if(f) f.target = val;
}
function updateSet(id, key, val) {
    const f = files.find(x => x.id === id);
    if(f) f.settings[key] = val;
}
function removeFile(id) {
    files = files.filter(f => f.id !== id);
    document.getElementById(`card-${id}`).remove();
    if(!files.length) {
        dom.empty.style.display = 'flex';
        dom.fileList.classList.add('hidden');
        dom.convertBtn.disabled = true;
        dom.convertBtn.classList.add('opacity-50');
    }
}

// --- CORE PROCESSOR ---
async function convertAll() {
    if(!ffmpeg && files.some(f => f.type !== 'doc')) return alert("Video engine still loading...");
    
    dom.convertBtn.disabled = true;
    dom.convertBtn.innerHTML = `<span class="spin inline-block mr-2">↻</span> Processing...`;

    for (const f of files) {
        if (f.status === 'done') continue;
        await processFile(f);
    }

    dom.convertBtn.disabled = false;
    dom.convertBtn.innerHTML = "Convert All";
}

async function processFile(f) {
    const els = {
        bg: document.getElementById(`prog-bg-${f.id}`),
        bar: document.getElementById(`prog-bar-${f.id}`),
        stat: document.getElementById(`status-${f.id}`),
        act: document.getElementById(`action-${f.id}`)
    };

    els.bg.classList.remove('hidden');
    els.stat.innerText = "Processing...";
    els.stat.className = "text-xs font-bold text-iri mt-1 text-right animate-pulse";

    try {
        // --- 1. DOCX PROCESSOR ---
        if (f.type === 'doc') {
            const arrayBuffer = await f.file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            
            if (f.target === 'html') {
                downloadBlob(new Blob([result.value], {type: 'text/html'}), f.file.name, 'html', els);
            } else {
                els.stat.innerText = "Rendering PDF...";
                
                const element = document.createElement('div');
                // Basic styling to make the PDF look decent
                element.innerHTML = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
                        ${result.value}
                    </div>
                `;

                // Use the user-selected settings
                const opt = {
                    margin: parseInt(f.settings.margin),
                    filename: f.file.name.replace('.docx', '.pdf'),
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: f.settings.pageSize, orientation: f.settings.orientation }
                };

                // Save PDF (auto-downloads)
                await html2pdf().set(opt).from(element).save();
                finishUI(els);
            }
            f.status = 'done';
            return;
        }

        // --- 2. FFMPEG PROCESSOR ---
        const inName = `in_${f.id}.${f.file.name.split('.').pop()}`;
        const outName = `out_${f.id}.${f.target}`;
        
        ffmpeg.FS('writeFile', inName, await fetchFile(f.file));
        ffmpeg.setProgress(({ ratio }) => { els.bar.style.width = `${Math.max(5, ratio * 100)}%`; });

        // Build Arguments based on Settings
        let args = ['-i', inName];
        const s = f.settings;

        if (f.type === 'video') {
            if (s.res !== 'original') args.push('-vf', `scale=-2:${s.res}`);
            if (s.fps !== 'original') args.push('-r', s.fps);
            if (s.audio === 'remove') args.push('-an');
            
            const crfMap = { high: '23', medium: '28', low: '35' };
            args.push('-crf', crfMap[s.qual]);
            args.push('-preset', 'ultrafast'); 
        }
        
        if (f.type === 'audio') {
            args.push('-b:a', s.bitrate);
            if (s.channels !== 'original') args.push('-ac', s.channels);
        }

        if (f.type === 'image') {
            if (s.scale !== '100') {
                const scaleVal = parseInt(s.scale) / 100;
                args.push('-vf', `scale=iw*${scaleVal}:ih*${scaleVal}`);
            }
        }

        args.push(outName);

        // Execute
        await ffmpeg.run(...args);

        // Retrieve & Download
        const data = ffmpeg.FS('readFile', outName);
        const blob = new Blob([data.buffer], { type: `${f.type}/${f.target}` });
        downloadBlob(blob, f.file.name, f.target, els);

        // Cleanup
        ffmpeg.FS('unlink', inName);
        ffmpeg.FS('unlink', outName);
        f.status = 'done';

    } catch (err) {
        console.error(err);
        els.stat.innerText = "Failed";
        els.stat.className = "text-xs font-bold text-red-500 mt-1 text-right";
        showToast(`Error processing ${f.file.name}`, true);
    }
}

// --- UTILS ---
function downloadBlob(blob, originalName, ext, els) {
    const url = URL.createObjectURL(blob);
    const newName = originalName.substring(0, originalName.lastIndexOf('.')) + '.' + ext;
    els.act.innerHTML = `
        <a href="${url}" download="${newName}" class="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
            <span>Save ${ext.toUpperCase()}</span>
        </a>
    `;
}

function finishUI(els) {
    els.act.innerHTML = `<div class="mt-2 w-full bg-emerald-100 text-emerald-600 text-sm font-bold py-2 px-4 rounded-lg text-center">✓ Saved</div>`;
}

function showToast(msg, isError = false) {
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 px-6 py-4 rounded-lg shadow-xl text-white font-bold z-50 transform translate-y-20 opacity-0 transition-all duration-300 ${isError ? 'bg-red-500' : 'bg-slate-800'}`;
    t.innerText = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-y-20', 'opacity-0'));
    setTimeout(() => {
        t.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => t.remove(), 300);
    }, 4000);
}