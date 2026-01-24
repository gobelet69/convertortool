const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

const FORMATS = {
    video: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif', 'mp3'],
    audio: ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
    image: ['jpg', 'png', 'webp', 'bmp', 'ico']
};

const DEFAULTS = {
    video: { res: 'original', fps: 'original', audio: 'keep', qual: 'medium' },
    audio: { bitrate: '128k', channels: 'original' },
    image: { scale: '100', qual: '90', gray: 'no' }
};

let files = [];

const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileList: document.getElementById('file-list'),
    empty: document.getElementById('empty-state'),
    status: document.getElementById('engine-status'),
    convertBtn: document.getElementById('convert-all-btn'),
    downloadAllBtn: document.getElementById('download-all-btn')
};

async function initFFmpeg() {
    try {
        ffmpeg = createFFmpeg({ log: false });
        await ffmpeg.load();
        dom.status.className = "flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200";
        dom.status.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Engine Ready`;
    } catch (e) {
        console.error("FFmpeg error:", e);
    }
}
initFFmpeg();

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

function getType(file) {
    if (file.type.startsWith('video/') || ['mkv','avi','mov'].some(x => file.name.endsWith(x))) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
}

function handleFiles(fileList) {
    if (!fileList.length) return;
    Array.from(fileList).forEach(file => {
        const type = getType(file);
        if (type === 'unknown') return showToast(`Format non supporté: ${file.name}`, true);

        dom.empty.style.display = 'none';
        dom.fileList.classList.remove('hidden');
        dom.convertBtn.disabled = false;
        dom.convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        const id = Math.random().toString(36).substr(2, 9);
        const defaultTarget = type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'png');
        const settings = JSON.parse(JSON.stringify(DEFAULTS[type]));

        files.push({ id, file, type, target: defaultTarget, settings, status: 'idle', resultBlob: null });
        renderCard(id, file, type, defaultTarget);
    });
}

function renderCard(id, file, type, defaultTarget) {
    const div = document.createElement('div');
    div.id = `card-${id}`;
    div.className = "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 fade-in relative group";
    
    const iconMap = { video: '🎬', audio: '🎵', image: '🖼️' };
    const fmtOpts = FORMATS[type].map(f => `<option value="${f}" ${f === defaultTarget ? 'selected' : ''}>${f.toUpperCase()}</option>`).join('');

    let settingsHTML = '';
    if (type === 'video') {
        settingsHTML = `
            <select onchange="updateSet('${id}', 'res', this.value)" class="opt-input"><option value="original">Orig Res</option><option value="1080">1080p</option><option value="720">720p</option></select>
            <select onchange="updateSet('${id}', 'qual', this.value)" class="opt-input"><option value="medium">Med Quality</option><option value="high">High Quality</option><option value="low">Low Quality</option></select>
        `;
    } else if (type === 'image') {
        settingsHTML = `
            <select onchange="updateSet('${id}', 'scale', this.value)" class="opt-input"><option value="100">100% Size</option><option value="50">50% Size</option></select>
            <select onchange="updateSet('${id}', 'qual', this.value)" class="opt-input"><option value="90">High Qual</option><option value="70">Med Qual</option></select>
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
                <select onchange="updateTarget('${id}', this.value)" class="opt-input font-bold text-iri">${fmtOpts}</select>
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

function updateTarget(id, val) { files.find(x => x.id === id).target = val; }
function updateSet(id, key, val) { files.find(x => x.id === id).settings[key] = val; }
function removeFile(id) {
    files = files.filter(f => f.id !== id);
    document.getElementById(`card-${id}`).remove();
    checkIfAllDone();
}

async function convertAll() {
    if(!ffmpeg) return alert("Engine loading...");
    dom.convertBtn.disabled = true;
    dom.convertBtn.innerHTML = `<span class="spin inline-block mr-2">↻</span> Processing...`;

    for (const f of files) {
        if (f.status === 'done') continue;
        await processFile(f);
    }
    dom.convertBtn.disabled = false;
    dom.convertBtn.innerHTML = "Convert All";
    checkIfAllDone();
}

async function processFile(f) {
    const els = {
        bg: document.getElementById(`prog-bg-${f.id}`),
        bar: document.getElementById(`prog-bar-${f.id}`),
        stat: document.getElementById(`status-${f.id}`),
        act: document.getElementById(`action-${f.id}`)
    };

    els.bg.classList.remove('hidden');
    els.stat.innerText = "Converting...";

    try {
        const inName = `in_${f.id}.${f.file.name.split('.').pop()}`;
        const outName = `out_${f.id}.${f.target}`;
        
        ffmpeg.FS('writeFile', inName, await fetchFile(f.file));
        
        ffmpeg.setProgress(({ ratio }) => {
            els.bar.style.width = `${Math.max(5, ratio * 100)}%`;
        });

        let args = ['-i', inName];
        if (f.type === 'video') {
            if (f.settings.res !== 'original') args.push('-vf', `scale=-2:${f.settings.res}`);
            const crf = { high: '18', medium: '28', low: '35' }[f.settings.qual];
            args.push('-crf', crf);
        }
        args.push(outName);

        await ffmpeg.run(...args);

        const data = ffmpeg.FS('readFile', outName);
        f.resultBlob = new Blob([data.buffer], { type: `${f.type}/${f.target}` });
        f.status = 'done';
        
        const url = URL.createObjectURL(f.resultBlob);
        els.act.innerHTML = `
            <a href="${url}" download="converted_${f.file.name.split('.')[0]}.${f.target}" class="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                <span>⬇ Download</span>
            </a>
        `;
        
        ffmpeg.FS('unlink', inName);
        ffmpeg.FS('unlink', outName);
    } catch (err) {
        console.error(err);
        els.stat.innerText = "Error";
    }
}

async function downloadAll() {
    const doneFiles = files.filter(f => f.status === 'done' && f.resultBlob);
    if(doneFiles.length === 0) return;
    
    const zip = new JSZip();
    doneFiles.forEach(f => {
        zip.file(`converted_${f.file.name.split('.')[0]}.${f.target}`, f.resultBlob);
    });
    
    const content = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = "converted_files.zip";
    link.click();
}

function checkIfAllDone() {
    if (files.some(f => f.status === 'done')) dom.downloadAllBtn.classList.remove('hidden');
}

function showToast(msg, isError = false) {
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 px-6 py-4 rounded-lg shadow-xl text-white font-bold z-50 ${isError ? 'bg-red-500' : 'bg-slate-800'}`;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}