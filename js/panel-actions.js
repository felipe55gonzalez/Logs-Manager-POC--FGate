/**
 * Acciones de los Paneles.
 * Contiene la lógica específica ejecutada por los botones de la interfaz:
 * ajuste de fuentes, modificación manual de celdas y cierre de archivos.
 */
import { state } from './state.js';
import { saveSession } from './session.js';
import { getActiveTab } from './tabs.js';
import { fileAsId } from './utils.js';
import { updateGridLayout } from './grid.js';
import { renderFileList } from './files.js';

export function adjustPanelLayout(filename, type, delta) {
    if (!state.layout[filename]) state.layout[filename] = { col: 1, row: 1 };
    
    let current = state.layout[filename][type];
    let newVal = current + delta;
    
    if (newVal < 1) newVal = 1;
    if (newVal > 4) newVal = 4; 

    state.layout[filename][type] = newVal;
    
    const safeId = fileAsId(filename);
    const display = document.getElementById(`display-${type}-${safeId}`);
    if(display) display.innerText = newVal;
    
    updateGridLayout();
    saveSession();
}

export function changeFontSize(filename, delta) {
    const safeId = fileAsId(filename);
    const content = document.getElementById(`content-${safeId}`);
    const display = document.getElementById(`font-display-${safeId}`);
    
    let current = state.fontSizes[filename] || 11.5;
    let newSize = parseFloat((current + delta).toFixed(1));
    if (newSize < 6) newSize = 6;
    if (newSize > 24) newSize = 24;
    
    state.fontSizes[filename] = newSize;
    if (content) content.style.fontSize = `${newSize}px`;
    if (display) display.innerText = newSize;
    if (!state.inspectorMode.has(filename) && content) content.scrollTop = content.scrollHeight;
    saveSession();
}

export function closeFile(f) {
    const tab = getActiveTab();
    tab.files = tab.files.filter(file => file !== f);
    if (state.previewFile === f) state.previewFile = null;
    updateGridLayout();
    saveSession();
    renderFileList();
}