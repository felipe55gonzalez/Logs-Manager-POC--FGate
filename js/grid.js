/**
 * Motor del Layout (Grid).
 * Se calcula la distribución de los paneles en pantalla, gestionando las clases
 * de filas/columnas y alternando entre la vista de contenido y el estado vacío.
 */
import { state } from './state.js';
import { getActiveTab } from './tabs.js';
import { fileAsId } from './utils.js';
import { createLogPanel, updatePanelHeaderVisuals } from './panel-ui.js';
import { handleResizeMove, handleResizeEnd } from './resize.js';

export function getAllOpenFiles() {
    const files = [...getActiveTab().files];
    if (state.previewFile && !files.includes(state.previewFile)) {
        files.push(state.previewFile);
    }
    return files;
}

export function updateGridLayout() {
    state.isLayoutUpdating = true;
    
    const container = document.getElementById("logs-container");
    const empty = document.getElementById("empty-state");
    const files = getAllOpenFiles();
    const activeFiles = getActiveTab().files;
    
    if (files.length === 0) {
        container.classList.add("hidden");
        empty.classList.remove("hidden");
        state.isLayoutUpdating = false;
        return;
    }
    
    container.classList.remove("hidden");
    empty.classList.add("hidden");
    
    container.className = "grid gap-4 p-4 h-full overflow-y-auto content-start grid-flow-dense " + 
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[400px]";

    Array.from(container.children).forEach(child => {
        const f = child.getAttribute("data-file");
        if (!activeFiles.includes(f) && state.previewFile !== f) {
            child.remove();
        }
    });

    files.forEach(f => {
        const safeId = fileAsId(f);
        let panel = document.getElementById(`panel-${safeId}`);
        if (!panel) {
            createLogPanel(f, container);
            panel = document.getElementById(`panel-${safeId}`);
        } else {
            updatePanelHeaderVisuals(f);
        }

        if (state.layout[f]) {
            const { col, row } = state.layout[f];
            panel.style.gridColumn = `span ${col}`;
            panel.style.gridRow = `span ${row}`;
        } else {
            panel.style.gridColumn = "span 2";
            panel.style.gridRow = "span 1";
        }
    });
    
    if(window.lucide) window.lucide.createIcons();
    setTimeout(() => {
        maintainScroll();
        setTimeout(() => state.isLayoutUpdating = false, 500);
    }, 50);
}

export function maintainScroll() {
    const files = getAllOpenFiles();
    files.forEach(f => {
        if (!state.inspectorMode.has(f)) {
            const el = document.getElementById(`content-${fileAsId(f)}`);
            if(el) el.scrollTop = el.scrollHeight;
        }
    });
}