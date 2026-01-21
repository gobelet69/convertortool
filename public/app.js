// --- CONFIGURATION ---
const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg = null;

// Conversion Map: What can be converted to what?
const FORMATS = {
    video: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'gif', 'mp3'], // Video can become audio
    audio: ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'],
    image: ['jpg', 'png', 'webp', 'bmp', 'tiff', 'ico', 'gif']
};

// MIME Type Sniffer
const getType = (file) => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    // Fallback based on extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (['mkv','avi','mov'].includes(ext)) return 'video';
    return 'unknown';
};

// State
let files = []; // { id, file, type, targetFormat, status, progress }

// --- DOM ---
const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileList: document.getElementById('file-list'),
    empty: document.getElementById('empty-state'),
    status: document.getElementById('engine-status'),
    convertBtn: document.getElementById('convert-all-btn')
};

// --- INITIALIZE ENGINE ---
async function initFFmpeg() {
    try {
        ffmpeg = createFFmpeg({ log: true });
        await ffmpeg.load();
        
        dom.status.className = "flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200";
        dom.status.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Engine Ready`;
        console.log("FFmpeg Loaded");
    } catch (e) {
        console.error(e);
        dom.status.innerHTML = "Engine Error (Check Headers)";
    }
}
initFFmpeg();

// --- DRAG & DROP & INPUTS ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dom.dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

dom.dropZone.addEventListener('dragenter', () => dom.dropZone.classList.add('drag-over'));
dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag-over'));
dom.dropZone.addEventListener('drop', (e) => {
    dom.dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

document.getElementById('file-upload').addEventListener('change', (e) => handleFiles(e.target.files));
document.getElementById('folder-upload').addEventListener('change', (e) => handleFiles(e.target.files));

// --- FILE HANDLING ---
function handleFiles(fileList) {
    if (!fileList.length) return;
    
    dom.empty.style.display = 'none';
    dom.fileList.classList.remove('hidden');
    dom.convertBtn.disabled = false;
    dom.convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    Array.from(fileList).forEach(file => {
        const type = getType(file);
        if (type === 'unknown') return; // Skip unsupported

        const id = Math.random().toString(36).substr(2, 9);
        const ext = file.name.split('.').pop().toLowerCase();
        
        // Default targets
        let defaultTarget = 'mp4';
        if (type === 'audio') defaultTarget = 'mp3';
        if (type === 'image') defaultTarget = 'png';

        // Add to state
        files.push({ id, file, type, targetFormat: defaultTarget, status: 'idle' });
        
        // Render Card
        renderFileCard(id, file, type, defaultTarget);
    });
}

function renderFileCard(id, file, type, defaultTarget) {
    const div = document.createElement('div');
    div.id = `card-${id}`;
    div.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 fade-in";
    
    const icon = type === 'video' ? '🎬' : type === 'audio' ? '🎵' : '🖼️';
    const options = FORMATS[type].map(fmt => 
        `<option value="${fmt}" ${fmt === defaultTarget ? 'selected' : ''}>to ${fmt.toUpperCase()}</option>`
    ).join('');

    div.innerHTML = `
        <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">${icon}</div>
        
        <div class="flex-1 min-w-0 w-full text-center md:text-left">
            <h4 class="font-bold text-slate-700 truncate">${file.name}</h4>
            <p class="text-xs text-slate-500">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto justify-center">
            <span class="text-slate-400 text-sm">Convert to:</span>
            <select onchange="updateTarget('${id}', this.value)" class="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-iri focus:border-iri block p-2">
                ${options}
            </select>
        </div>

        <div id="action-${id}" class="flex-shrink-0 w-full md:w-32">
             <div class="w-full bg-slate-200 rounded-full h-2.5 hidden" id="progress-container-${id}">
                <div class="bg-iri h-2.5 rounded-full progress-bar" style="width: 0%" id="progress-${id}"></div>
            </div>
            <div id="status-text-${id}" class="text-xs text-center text-slate-500 mt-1">Ready</div>
        </div>

        <button onclick="removeFile('${id}')" class="text-slate-400 hover:text-red-500 px-2">&times;</button>
    `;
    
    dom.fileList.appendChild(div);
}

// --- LOGIC ---
function updateTarget(id, val) {
    const f = files.find(x => x.id === id);
    if(f) f.targetFormat = val;
}

function removeFile(id) {
    files = files.filter(f => f.id !== id);
    document.getElementById(`card-${id}`).remove();
    if(files.length === 0) {
        dom.empty.style.display = 'flex';
        dom.fileList.classList.add('hidden');
        dom.convertBtn.disabled = true;
        dom.convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

async function convertAll() {
    if (!ffmpeg) return alert("Engine loading... please wait.");
    
    dom.convertBtn.disabled = true;
    dom.convertBtn.innerText = "Converting...";

    for (const f of files) {
        if (f.status === 'done') continue;
        await processFile(f);
    }

    dom.convertBtn.disabled = false;
    dom.convertBtn.innerText = "Convert All";
}

async function processFile(fObj) {
    const card = document.getElementById(`card-${fObj.id}`);
    const progBar = document.getElementById(`progress-${fObj.id}`);
    const progCont = document.getElementById(`progress-container-${fObj.id}`);
    const statusTxt = document.getElementById(`status-text-${fObj.id}`);
    const actionArea = document.getElementById(`action-${fObj.id}`);

    progCont.classList.remove('hidden');
    statusTxt.innerText = "Processing...";
    fObj.status = 'processing';

    try {
        const { file, id, targetFormat } = fObj;
        const inputName = `input_${id}.${file.name.split('.').pop()}`;
        const outputName = `output_${id}.${targetFormat}`;

        // 1. Write File to Memory
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));

        // 2. Run Command
        // Setup Progress Logger
        ffmpeg.setProgress(({ ratio }) => {
            progBar.style.width = `${ratio * 100}%`;
            statusTxt.innerText = `${(ratio * 100).toFixed(0)}%`;
        });

        // Basic FFmpeg command structure
        // -i input -strict -2 output
        await ffmpeg.run('-i', inputName, outputName);

        // 3. Read Result
        const data = ffmpeg.FS('readFile', outputName);

        // 4. Create Download Link
        const blob = new Blob([data.buffer], { type: `${fObj.type}/${targetFormat}` });
        const url = URL.createObjectURL(blob);

        // UI Update: Success
        actionArea.innerHTML = `
            <a href="${url}" download="${file.name.split('.')[0]}.${targetFormat}" class="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded shadow block text-center">
                Download
            </a>
        `;
        fObj.status = 'done';

        // Cleanup Memory
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (err) {
        console.error(err);
        statusTxt.innerText = "Error";
        statusTxt.classList.add('text-red-500');
    }
}