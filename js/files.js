/**
 * Gestión del Sidebar y Archivos.
 * Controla el renderizado de la lista lateral, el filtrado por búsqueda y
 * la diferencia entre vista previa (clic) y apertura persistente (doble clic).
 */
import { state, AUTO_LOAD_FILES } from './state.js';
import { saveSession } from './session.js';
import { getActiveTab } from './tabs.js';
import { updateGridLayout } from './grid.js';
import { getDisplayName } from './utils.js';

export function registerPredefinedFiles() {
    mergeFiles(AUTO_LOAD_FILES);
}

export async function tryPassiveDiscovery() {
    try {
        const response = await fetch("./", { cache: "no-store" });
        if (response.ok) {
            const text = await response.text();
            const regex = /href="([^\"]+\.log)"/g;
            let match;
            const found = [];
            while ((match = regex.exec(text)) !== null) {
                let cleanName = decodeURIComponent(match[1]);
                if (cleanName.startsWith("./")) cleanName = cleanName.substring(2);
                found.push(cleanName);
            }
            if (found.length > 0) mergeFiles(found);
        }
    } catch (e) { }
}

export function mergeFiles(newFiles) {
    const set = new Set([...state.fileList, ...newFiles]);
    state.fileList = Array.from(set).sort();
    renderFileList();
    saveSession();
}

export function deleteFileFromList(name, e) {
    e.stopPropagation();
    if (confirm("¿Ocultar archivo de la lista?")) {
        state.fileList = state.fileList.filter(f => f !== name);
        state.tabs.forEach(tab => {
            tab.files = tab.files.filter(f => f !== name);
        });
        if (state.previewFile === name) state.previewFile = null;
        renderFileList();
        updateGridLayout();
        saveSession();
    }
}

export function handleFileClick(file) {
    const activeFiles = getActiveTab().files;
    if (activeFiles.includes(file)) return;
    state.previewFile = file;
    updateGridLayout();
    renderFileList(document.getElementById("search-input").value);
}

export function handleFileDoubleClick(file) {
    const tab = getActiveTab();
    if (!tab.files.includes(file)) {
        tab.files.push(file);
    }
    if (state.previewFile === file) {
        state.previewFile = null;
    }
    updateGridLayout();
    saveSession();
    renderFileList(document.getElementById("search-input").value);
}

export function renderFileList(filter = "") {
    const container = document.getElementById("file-list");
    container.innerHTML = "";
    const filtered = state.fileList.filter(f => f.toLowerCase().includes(filter.toLowerCase()));
    document.getElementById("file-count").innerText = filtered.length;

    const activeFiles = getActiveTab().files;

    filtered.forEach(file => {
        const isPersistent = activeFiles.includes(file);
        const isPreview = state.previewFile === file;
        const isActive = isPersistent || isPreview;

        const el = document.createElement("div");
        el.title = file;

        let bgClass = isActive
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            : 'text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent';

        if (isPreview && !isPersistent) bgClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 italic';

        el.className = `group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-all select-none ${bgClass}`;
        el.onclick = () => handleFileClick(file);
        el.ondblclick = () => handleFileDoubleClick(file);

        let iconName = isPersistent ? 'pin' : (isPreview ? 'eye' : 'file-text');

        el.innerHTML = `
            <div class="flex items-center gap-2 overflow-hidden">
                <i data-lucide="${iconName}" class="w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-50'}"></i>
                    <span class="truncate font-medium">${getDisplayName(file)}</span>            
                </div>
            <button onclick="deleteFileFromList('${file}', event)" class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"><i data-lucide="eye-off" class="w-3 h-3"></i></button>
        `;
        container.appendChild(el);
    });
    if (window.lucide) window.lucide.createIcons();
}