/**
 * Generador de Interfaz de Panel.
 * Se construye dinámicamente el HTML de cada ventana de log, incluyendo
 * su estructura base, contenedores y barra de herramientas.
 */
import { state } from './state.js';
import { getActiveTab } from './tabs.js';
import { fileAsId, getDisplayName } from './utils.js';
import { fetchLogFile } from './logs.js';
import { startResize } from './resize.js';

export function createLogPanel(filename, container) {
    const safeId = fileAsId(filename);
    const div = document.createElement("div");
    div.id = `panel-${safeId}`;
    div.setAttribute("data-file", filename);
    div.className = "glass-panel rounded-xl overflow-hidden relative group animate-in fade-in zoom-in duration-300 transition-all";
    
    const currentFontSize = state.fontSizes[filename] || 11.5;
    if (!state.filters[filename]) state.filters[filename] = { text: '', level: 'ALL' };
    const f = state.filters[filename];
    
    div.innerHTML = `
        <div id="header-${safeId}" 
             class="absolute top-0 left-0 right-0 z-20 px-2 py-1.5 transition-all duration-300 pointer-events-none">
            
            <div class="flex items-center justify-between pointer-events-auto gap-2">
                <div class="flex items-center gap-1 min-w-0">
                    <div onclick="toggleHeader('${safeId}')" 
                         class="flex items-center gap-2 overflow-hidden theme-element rounded-md px-2 py-1 shadow-sm cursor-pointer hover:brightness-110 transition-all active:scale-95"
                         title="Controles de panel">
                        <div class="status-dot w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span class="panel-title font-mono text-[11px] font-bold truncate opacity-90 select-text">${getDisplayName(filename)}</span>
                    </div>
                    
                    <button onclick="closeFile('${filename}')" 
                            class="p-1 theme-element rounded-md hover:text-red-400 hover:bg-red-400/10 transition-colors shadow-sm" 
                            title="Cerrar Log">
                        <i data-lucide="x" width="14"></i>
                    </button>
                </div>
                
                <div id="controls-${safeId}" 
                     class="header-controls opacity-0 transition-opacity duration-300 flex items-center gap-1 shrink-0 pointer-events-none"
                     onmouseenter="clearHeaderTimer('${safeId}')"
                     onmouseleave="resetHeaderTimer('${safeId}')">
                     
                    <div class="flex items-center theme-element rounded-md overflow-hidden border border-white/5">
                        <button onclick="changeFontSize('${filename}', -1)" class="px-1.5 py-1 hover:bg-white/5 transition-colors border-r border-white/5"><i data-lucide="minus" width="10"></i></button>
                        <span class="text-[9px] w-5 text-center font-mono opacity-70" id="font-display-${safeId}">${currentFontSize}</span>
                        <button onclick="changeFontSize('${filename}', 1)" class="px-1.5 py-1 hover:bg-white/5 transition-colors"><i data-lucide="plus" width="10"></i></button>
                    </div>
                    
                    <div class="h-4 w-[1px] bg-white/10 mx-0.5"></div>

                    <button onclick="toggleLayoutMenu('${safeId}')" class="p-1 theme-element rounded-md hover:text-indigo-400 transition-colors" title="Tamaño"><i data-lucide="layout-dashboard" width="13"></i></button>
                    <button onclick="reloadLogView('${filename}')" class="p-1 theme-element rounded-md hover:text-white transition-colors" title="Recargar"><i data-lucide="rotate-cw" width="13"></i></button>
                    <button onclick="clearLogView('${filename}')" class="p-1 theme-element rounded-md hover:text-white transition-colors" title="Limpiar"><i data-lucide="eraser" width="13"></i></button>
                    <button onclick="hideHeader('${safeId}')" class="p-1 theme-element rounded-md hover:text-amber-400 transition-colors" title="Ocultar"><i data-lucide="chevron-up" width="13"></i></button>
                </div>
            </div>

            <div id="filters-${safeId}" 
                 class="header-controls opacity-0 transition-opacity duration-300 flex items-center gap-1.5 text-[10px] mt-1.5 pointer-events-none"
                 onmouseenter="clearHeaderTimer('${safeId}')"
                 onmouseleave="resetHeaderTimer('${safeId}')">
                 
                <div class="relative flex-1 pointer-events-auto">
                    <i data-lucide="filter" width="10" class="absolute left-2 top-1.5 opacity-40"></i>
                    <input type="text" 
                           placeholder="Buscar en log..." 
                           class="w-full theme-element rounded-md py-1 pl-6 pr-2 focus:outline-none border-white/5 focus:border-indigo-500/30 placeholder-white/20"
                           value="${f.text}"
                           oninput="updatePanelFilter('${filename}', 'text', this.value)">
                </div>
                <select class="theme-element rounded-md py-1 px-1.5 focus:outline-none border-white/5 cursor-pointer pointer-events-auto text-[9px] font-bold"
                        onchange="updatePanelFilter('${filename}', 'level', this.value)">
                    <option value="ALL" ${f.level === 'ALL' ? 'selected' : ''}>TODOS</option>
                    <option value="INFO" ${f.level === 'INFO' ? 'selected' : ''}>INFO</option>
                    <option value="WARN" ${f.level === 'WARN' ? 'selected' : ''}>WARN</option>
                    <option value="ERROR" ${f.level === 'ERROR' ? 'selected' : ''}>ERROR</option>
                    <option value="DEBUG" ${f.level === 'DEBUG' ? 'selected' : ''}>DEBUG</option>
                </select>
            </div>
            
            <div id="layout-menu-${safeId}" class="hidden absolute top-8 right-2 bg-gray-900 border border-white/10 p-2 rounded-md shadow-xl z-50 text-white">
                 <div class="text-[10px] font-bold mb-1 opacity-70">Columnas (Ancho)</div>
                 <div class="flex items-center gap-2 mb-2">
                    <button onclick="adjustPanelLayout('${filename}', 'col', -1)" class="p-1 bg-white/5 rounded hover:bg-white/10"><i data-lucide="minus" width="10"></i></button>
                    <span id="display-col-${safeId}" class="text-xs font-mono w-4 text-center">${state.layout[filename]?.col || 2}</span>
                    <button onclick="adjustPanelLayout('${filename}', 'col', 1)" class="p-1 bg-white/5 rounded hover:bg-white/10"><i data-lucide="plus" width="10"></i></button>
                 </div>
                 <div class="text-[10px] font-bold mb-1 opacity-70">Filas (Alto)</div>
                 <div class="flex items-center gap-2">
                    <button onclick="adjustPanelLayout('${filename}', 'row', -1)" class="p-1 bg-white/5 rounded hover:bg-white/10"><i data-lucide="minus" width="10"></i></button>
                    <span id="display-row-${safeId}" class="text-xs font-mono w-4 text-center">${state.layout[filename]?.row || 1}</span>
                    <button onclick="adjustPanelLayout('${filename}', 'row', 1)" class="p-1 bg-white/5 rounded hover:bg-white/10"><i data-lucide="plus" width="10"></i></button>
                 </div>
            </div>
        </div>

        <div class="w-full h-full overflow-hidden" style="background-color: var(--bg-terminal);">
            <div id="content-${safeId}" tabindex="0" class="h-full overflow-y-auto p-3 pt-9 log-content scrollbar-thin scroll-smooth" onscroll="handleScroll('${filename}')" style="font-size: ${currentFontSize}px; outline: none;">
                <div class="flex items-center justify-center h-full opacity-20 text-[10px] font-mono">Cargando flujo de datos...</div>
            </div>
            
            <div id="inspector-${safeId}" class="absolute bottom-4 right-4 translate-y-10 opacity-0 transition-all duration-300 pointer-events-none flex flex-col items-end gap-2 z-10">
                <span class="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">Modo Inspector</span>
                <button onclick="exitInspectorMode('${filename}')" class="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg pointer-events-auto animate-bounce"><i data-lucide="arrow-down" width="16"></i></button>
            </div>
        </div>

        <div class="resize-handle absolute bottom-0 right-0 w-6 h-6 z-30 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
             onmousedown="startResize(event, '${filename}')"
             title="Arrastra para redimensionar">
             <i data-lucide="scaling" width="12" class="text-white/50"></i>
        </div>
    `;
    container.appendChild(div);
    
    const contentDiv = document.getElementById(`content-${safeId}`);
    if (contentDiv) {
        contentDiv.addEventListener('wheel', (e) => {
            if (document.activeElement !== contentDiv) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    updatePanelHeaderVisuals(filename);
    fetchLogFile(filename);
}

export function updatePanelHeaderVisuals(filename) {
    const safeId = fileAsId(filename);
    const titleEl = document.querySelector(`#panel-${safeId} .panel-title`);
    const statusDot = document.querySelector(`#panel-${safeId} .status-dot`);
    const activeFiles = getActiveTab().files;
    
    if (state.previewFile === filename && !activeFiles.includes(filename)) {
        if(titleEl) {
            titleEl.classList.add("italic", "opacity-60");
            titleEl.innerHTML = `${getDisplayName(filename)} <span class="text-[9px] ...">VISTA PREVIA</span>`;
        }
        if(statusDot) statusDot.className = "status-dot w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
    } else {
        if(titleEl) {
            titleEl.classList.remove("italic", "opacity-60");
            titleEl.innerHTML = getDisplayName(filename);
        }
        if(statusDot) statusDot.className = "status-dot w-2 h-2 rounded-full bg-indigo-500 animate-pulse";
    }
}