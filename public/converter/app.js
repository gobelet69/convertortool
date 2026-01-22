// --- CONFIGURATION ---
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

const FORMATS = {
    video: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif', 'mp3'],
    audio: ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
    image: ['jpg', 'png', 'webp', 'bmp', 'ico'],
    doc:   ['pdf']
};

const DEFAULTS = {
    video: { res: 'original', fps: 'original', audio: 'keep', qual: 'medium' },
    audio: { bitrate: '128k', channels: 'original' },
    image: { scale: '100', qual: '90', gray: 'no' }, // Options images
    doc:   { margin: '10' }
};

let files = [];

const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileList: document.getElementById('file-list'),
    empty: document.getElementById('empty-state'),
    status: document.getElementById('engine-status'),
    convertBtn: document.getElementById('convert-all-btn'),
    downloadAllBtn: document.getElementById('download-all-btn'),
    hiddenRenderer: document.getElementById('hidden-renderer')
};

// --- INIT ENGINE ---
async function initFFmpeg() {
    try {
        ffmpeg = createFFmpeg({ log: false });
        await ffmpeg.load();
        dom.status.className = "flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200";
        dom.status.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Engine Ready`;
    } catch (e) {
        console.error("FFmpeg error:", e);
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

// --- GESTION FICHIERS ---
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
            showToast(`Format non supporté: ${file.name}`, true);
            return;
        }

        dom.empty.style.display = 'none';
        dom.fileList.classList.remove('hidden');
        dom.convertBtn.disabled = false;
        dom.convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        const id = Math.random().toString(36).substr(2, 9);
        const defaultTarget = type === 'doc' ? 'pdf' : (type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'png'));
        const settings = JSON.parse(JSON.stringify(DEFAULTS[type]));

        files.push({ id, file, type, target: defaultTarget, settings, status: 'idle', resultBlob: null });
        renderCard(id, file, type, defaultTarget);
    });
}

function renderCard(id, file, type, defaultTarget) {
    const div = document.createElement('div');
    div.id = `card-${id}`;
    div.className = "bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 fade-in relative group";
    
    const iconMap = { video: '🎬', audio: '🎵', image: '🖼️', doc: '📝' };
    const fmtOpts = FORMATS[type].map(f => `<option value="${f}" ${f === defaultTarget ? 'selected' : ''}>${f.toUpperCase()}</option>`).join('');

    let settingsHTML = '';
    
    if (type === 'video') {
        settingsHTML = `
            <select onchange="updateSet('${id}', 'res', this.value)" class="opt-input"><option value="original">Orig Res</option><option value="1080">1080p</option><option value="720">720p</option></select>
            <select onchange="updateSet('${id}', 'qual', this.value)" class="opt-input"><option value="medium">Med Q</option><option value="high">High Q</option><option value="low">Low Q</option></select>
        `;
    } else if (type === 'image') {
        settingsHTML = `
             <select onchange="updateSet('${id}', 'scale', this.value)" class="opt-input">
                <option value="100">100% Size</option><option value="75">75% Size</option><option value="50">50% Size</option>
            </select>
            <select onchange="updateSet('${id}', 'qual', this.value)" class="opt-input">
                <option value="90">High Q</option><option value="75">Med Q</option><option value="50">Low Q</option>
            </select>
            <select onchange="updateSet('${id}', 'gray', this.value)" class="opt-input">
                <option value="no">Color</option><option value="yes">B&W</option>
            </select>
        `;
    } else if (type === 'doc') {
        settingsHTML = `
             <select onchange="updateSet('${id}', 'margin', this.value)" class="opt-input">
                <option value="10">Marge Normale</option><option value="0">Sans Marge</option><option value="20">Marge Large</option>
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

// --- MOTEUR DE CONVERSION ---
async function convertAll() {
    if(!ffmpeg && files.some(f => f.type !== 'doc')) return alert("Engine loading...");
    
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
    els.stat.innerText = "Processing...";
    els.stat.className = "text-xs font-bold text-iri mt-1 text-right animate-pulse";

    try {
        let outBlob = null;

        // --- 1. DOCX VERS PDF ---
        if (f.type === 'doc') {
            const arrayBuffer = await f.file.arrayBuffer();
            
            // On vide et prépare le conteneur
            dom.hiddenRenderer.innerHTML = "";
            
            // Rendu du DOCX en HTML (docx-preview)
            // Note: ignoreWidth: false force l'utilisation de la largeur réelle
            await docx.renderAsync(arrayBuffer, dom.hiddenRenderer, null, { 
                inWrapper: false, 
                ignoreWidth: false,
                renderHeaders: true,
                renderFooters: true
            });

            // CRITIQUE : Petit délai pour laisser le navigateur dessiner les images
            await new Promise(r => setTimeout(r, 1000));

            els.stat.innerText = "Saving PDF...";
            
            const opt = {
                margin: parseInt(f.settings.margin),
                filename: f.file.name.replace('.docx', '.pdf'),
                image: { type: 'jpeg', quality: 0.98 },
                // scale: 2 améliore la netteté
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Conversion HTML -> PDF
            outBlob = await html2pdf().set(opt).from(dom.hiddenRenderer).output('blob');
            dom.hiddenRenderer.innerHTML = ""; // Nettoyage
        }
        
        // --- 2. MULTIMEDIA (FFMPEG) ---
        else {
            const inName = `in_${f.id}.${f.file.name.split('.').pop()}`;
            const outName = `out_${f.id}.${f.target}`;
            
            ffmpeg.FS('writeFile', inName, await fetchFile(f.file));
            ffmpeg.setProgress(({ ratio }) => { els.bar.style.width = `${Math.max(5, ratio * 100)}%`; });

            let args = ['-i', inName];
            const s = f.settings;

            if (f.type === 'video') {
                if (s.res !== 'original') args.push('-vf', `scale=-2:${s.res}`);
                if (s.qual) {
                    const crf = { high: '23', medium: '28', low: '35' };
                    args.push('-crf', crf[s.qual], '-preset', 'ultrafast'); 
                }
            }

            if (f.type === 'image') {
                let filters = [];
                if (s.scale !== '100') filters.push(`scale=iw*${s.scale/100}:-1`);
                if (s.gray === 'yes') filters.push('hue=s=0');
                if(filters.length > 0) args.push('-vf', filters.join(','));
                
                if(f.target === 'jpg' || f.target === 'jpeg') {
                    let q = s.qual === '90' ? 2 : (s.qual === '75' ? 10 : 20);
                    args.push('-q:v', q);
                }
            }

            args.push(outName);
            await ffmpeg.run(...args);

            const data = ffmpeg.FS('readFile', outName);
            outBlob = new Blob([data.buffer], { type: `${f.type}/${f.target}` });
            
            ffmpeg.FS('unlink', inName);
            ffmpeg.FS('unlink', outName);
        }

        f.resultBlob = outBlob;
        f.status = 'done';
        
        const url = URL.createObjectURL(outBlob);
        const newName = f.file.name.substring(0, f.file.name.lastIndexOf('.')) + '.' + f.target;
        
        els.act.innerHTML = `
            <a href="${url}" download="${newName}" class="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                <span>⬇ Save</span>
            </a>
        `;

    } catch (err) {
        console.error(err);
        els.stat.innerText = "Error";
        els.stat.className = "text-xs font-bold text-red-500 mt-1 text-right";
        showToast("Erreur conversion: " + err.message, true);
    }
}

// --- ZIP DOWNLOAD ---
async function downloadAll() {
    const doneFiles = files.filter(f => f.status === 'done' && f.resultBlob);
    if(doneFiles.length === 0) return;

    dom.downloadAllBtn.innerText = "Zipping...";
    dom.downloadAllBtn.disabled = true;

    const zip = new JSZip();
    doneFiles.forEach(f => {
        const name = f.file.name.substring(0, f.file.name.lastIndexOf('.')) + '.' + f.target;
        zip.file(name, f.resultBlob);
    });

    try {
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = "converted_files.zip";
        link.click();
    } catch(e) {
        showToast("Erreur ZIP", true);
    }

    dom.downloadAllBtn.innerText = "📦 Download ZIP";
    dom.downloadAllBtn.disabled = false;
}

function checkIfAllDone() {
    if (files.some(f => f.status === 'done')) {
        dom.downloadAllBtn.classList.remove('hidden');
    } else {
        dom.downloadAllBtn.classList.add('hidden');
    }
}

function showToast(msg, isError = false) {
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 px-6 py-4 rounded-lg shadow-xl text-white font-bold z-50 transform translate-y-20 opacity-0 transition-all duration-300 ${isError ? 'bg-red-500' : 'bg-slate-800'}`;
    t.innerText = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-y-20', 'opacity-0'));
    setTimeout(() => { t.classList.add('translate-y-20', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 4000);
}