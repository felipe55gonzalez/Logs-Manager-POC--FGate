/**
 * Lógica de Redimensionado.
 * Captura y procesa los eventos del mouse para calcular el tamaño de los paneles
 * en tiempo real cuando se arrastra desde la esquina.
 */
import { state } from './state.js';
import { saveSession } from './session.js';
import { fileAsId } from './utils.js';
import { updateGridLayout } from './grid.js';

export function startResize(e, filename) {
    e.preventDefault();
    const safeId = fileAsId(filename);
    const panel = document.getElementById(`panel-${safeId}`);
    
    if (!state.layout[filename]) state.layout[filename] = { col: 1, row: 1 };

    state.resizing = {
        active: true,
        filename: filename,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: panel.offsetWidth,
        startHeight: panel.offsetHeight,
        startCol: state.layout[filename].col,
        startRow: state.layout[filename].row,
        panelElement: panel
    };
    
    document.body.style.cursor = "nwse-resize";
}

export function handleResizeMove(e) {
    if (!state.resizing.active) return;
    e.preventDefault();

    const { startX, startY, startWidth, startHeight, startCol, startRow, filename } = state.resizing;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const colStep = 300; 
    const rowStep = 400;
    let newCol = startCol + Math.round(dx / colStep);
    let newRow = startRow + Math.round(dy / rowStep);

    if (newCol < 1) newCol = 1;
    if (newCol > 4) newCol = 4;    
    if (newRow < 1) newRow = 1;
    if (newRow > 3) newRow = 3;
    if (newCol !== state.layout[filename].col || newRow !== state.layout[filename].row) {
        state.layout[filename].col = newCol;
        state.layout[filename].row = newRow;
        
        const safeId = fileAsId(filename);
        const colDisplay = document.getElementById(`display-col-${safeId}`);
        const rowDisplay = document.getElementById(`display-row-${safeId}`);
        
        if (colDisplay) colDisplay.innerText = newCol;
        if (rowDisplay) rowDisplay.innerText = newRow;

        updateGridLayout();
    }
}

export function handleResizeEnd(e) {
    if (!state.resizing.active) return;
    
    state.resizing.active = false;
    state.resizing.filename = null;
    state.resizing.panelElement = null;
    
    document.body.style.cursor = "";
    saveSession();
}