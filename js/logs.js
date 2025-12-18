/**
 * Lógica principal de Logs.
 * Este módulo se encarga del ciclo de vida de los datos: realiza el polling (fetch),
 * procesa las líneas de texto y aplica el resaltado de sintaxis antes de renderizar.
 */
import { state } from './state.js';
import { saveSession } from './session.js';
import { getAllOpenFiles } from './grid.js';
import { fileAsId } from './utils.js';

export function updatePanelFilter(filename, type, value) {
    if (!state.filters[filename]) state.filters[filename] = { text: '', level: 'ALL' };
    state.filters[filename][type] = value;
    const lines = state.logsData[filename] || [];
    renderLogContent(filename, lines);
    saveSession();
}

export function refreshAllLogs() {
    const files = getAllOpenFiles();
    files.forEach(f => {
        const lines = state.logsData[f] || [];
        renderLogContent(f, lines);
    });
}

export function clearLogView(f) {
    state.lineOffsets[f] = (state.logsData[f] || []).length;
    renderLogContent(f, state.logsData[f] || []);
    saveSession();
}

export async function reloadLogView(f) {
    state.lineOffsets[f] = 0;
    saveSession();
    await fetchLogFile(f); 
}

export function startLocalPolling() {
    const poll = () => {
        const files = getAllOpenFiles();
        files.forEach(f => {
            if (!state.pausedFiles.has(f)) fetchLogFile(f);
        });
        setTimeout(poll, state.refreshInterval);
    };
    poll();
}

export async function fetchLogFile(filename) {
    try {
        const res = await fetch(`./${filename}?t=${Date.now()}`);
        if (!res.ok) throw new Error("404");
        const text = await res.text();
        const lines = text.split("\n");
        state.logsData[filename] = lines;
        renderLogContent(filename, lines);
    } catch (e) {
        const el = document.getElementById(`content-${fileAsId(filename)}`);
        if(el && !state.logsData[filename]) el.innerHTML = `<div class="h-full flex flex-col items-center justify-center opacity-40 text-xs text-center"><i data-lucide="wifi-off" class="mb-2"></i><span>Desconectado<br>${filename}</span></div>`;
        if(window.lucide) window.lucide.createIcons();
    }
}

export function renderLogContent(filename, allLines) {
    const safeId = fileAsId(filename);
    const container = document.getElementById(`content-${safeId}`);
    if (!container) return;

    const offset = state.lineOffsets[filename] || 0;
    const linesToShow = allLines.slice(offset);
    const visualLines = linesToShow.slice(-500);

    if (visualLines.length === 0) {
        if (offset > 0) {
            container.innerHTML = `<div class="p-4 text-xs opacity-30 italic text-center mt-4 border-t border-dashed border-white/10">Historial limpiado localmente.<br>Esperando nuevas líneas...</div>`;
        } else {
            container.innerHTML = "";
        }
        return;
    }

    const globalDate = document.getElementById("date-filter-input").value;
    const localFilter = state.filters[filename] || { text: '', level: 'ALL' };
    const filterTextLower = localFilter.text.toLowerCase();

    const html = visualLines.map(line => {
        if (!line.trim()) return "";
        
        if (globalDate && !line.includes(globalDate)) return "";
        
        if (filterTextLower && !line.toLowerCase().includes(filterTextLower)) return "";
        
        if (localFilter.level !== 'ALL') {
            if (!line.includes(localFilter.level)) return "";
        }

        return formatLogLine(line);
    }).join("");

    if (container.innerHTML.length !== html.length) { 
        container.innerHTML = html;
        if (!state.inspectorMode.has(filename)) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

export function formatLogLine(line) {
    let safeLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let lineClass = "";
    if (safeLine.match(/ERROR|EXCEPTION|FAIL|CRITICAL/i)) lineClass = "line-err";

    safeLine = safeLine.replace(
        /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(\.\d{3})?)/, 
        '<span class="t-ts">$1</span>'
    );

    safeLine = safeLine.replace(
        /\[(INFO|WARN|ERROR|DEBUG|FATAL|TRACE)\]/g, 
        (match, p1) => `<span class="t-br">[</span><span class="t-${p1.toUpperCase()}">${p1}</span><span class="t-br">]</span>`
    );

    safeLine = safeLine.replace(
        /\[([a-zA-Z0-9_\-\.]+)\]/g, 
        '<span class="t-br">[</span><span class="t-mt">$1</span><span class="t-br">]</span>'
    );

    safeLine = safeLine.replace(
        /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
        '<span class="t-id">$&</span>'
    );

    safeLine = safeLine.replace(
        /(:\s+|=|\s)(\d+)(\s|$|\.)/g, 
        '$1<span class="t-nm">$2</span>$3'
    );

    return `<div class="log-line ${lineClass}">${safeLine}</div>`;
}

export function handleScroll(filename) {
    if (state.isLayoutUpdating) return;

    const safeId = fileAsId(filename);
    const el = document.getElementById(`content-${safeId}`);
    if (!el) return;
    
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const badge = document.getElementById(`inspector-${safeId}`);
    
    if (dist > 60) {
        if (!state.inspectorMode.has(filename)) {
            state.inspectorMode.add(filename);
            state.pausedFiles.add(filename);
            badge.classList.remove("opacity-0", "translate-y-10", "pointer-events-none");
        }
    } else {
        if (state.inspectorMode.has(filename)) {
            exitInspectorMode(filename);
        }
    }
}

export function exitInspectorMode(filename) {
    const safeId = fileAsId(filename);
    const el = document.getElementById(`content-${safeId}`);
    state.inspectorMode.delete(filename);
    state.pausedFiles.delete(filename);
    const badge = document.getElementById(`inspector-${safeId}`);
    badge.classList.add("opacity-0", "translate-y-10", "pointer-events-none");
    el.scrollTop = el.scrollHeight;
}