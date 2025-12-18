/**
 * Comportamiento Visual (UX).
 * Controla la interactividad de los paneles, como la visibilidad automática
 * de los encabezados (auto-hide) y la limpieza de timers de inactividad.
 */
import { state } from './state.js';

export function toggleHeader(safeId) {
    const controls = document.getElementById(`controls-${safeId}`);
    const isHidden = controls.classList.contains('opacity-0');
    
    if (isHidden) {
        showHeader(safeId);
    } else {
        hideHeader(safeId);
    }
}

export function showHeader(safeId) {
    const controls = document.getElementById(`controls-${safeId}`);
    const filters = document.getElementById(`filters-${safeId}`);
    const headerContainer = document.getElementById(`header-${safeId}`); 

    [controls, filters].forEach(el => {
        el.classList.remove('opacity-0', 'pointer-events-none');
        el.classList.add('opacity-100', 'pointer-events-auto');
    });
    
    if(headerContainer) headerContainer.classList.add('header-active-bg');
    
    resetHeaderTimer(safeId);
}

export function hideHeader(safeId) {
    const controls = document.getElementById(`controls-${safeId}`);
    const filters = document.getElementById(`filters-${safeId}`);
    const layoutMenu = document.getElementById(`layout-menu-${safeId}`); 
    const headerContainer = document.getElementById(`header-${safeId}`); 

    [controls, filters].forEach(el => {
        el.classList.add('opacity-0', 'pointer-events-none');
        el.classList.remove('opacity-100', 'pointer-events-auto');
    });
    
    if(headerContainer) headerContainer.classList.remove('header-active-bg');
    
    if(layoutMenu && !layoutMenu.classList.contains('hidden')) {
        layoutMenu.classList.add('hidden');
    }

    if (state.headerTimers[safeId]) {
        clearTimeout(state.headerTimers[safeId]);
        delete state.headerTimers[safeId];
    }
}

export function resetHeaderTimer(safeId) {
    if (state.headerTimers[safeId]) clearTimeout(state.headerTimers[safeId]);
    
    state.headerTimers[safeId] = setTimeout(() => {
        hideHeader(safeId);
    }, 20000); 
}

export function clearHeaderTimer(safeId) {
    if (state.headerTimers[safeId]) {
        clearTimeout(state.headerTimers[safeId]);
        delete state.headerTimers[safeId];
    }
}

export function toggleLayoutMenu(safeId) {
    const menu = document.getElementById(`layout-menu-${safeId}`);
    if (menu) {
        menu.classList.toggle('hidden');
        if(window.lucide) window.lucide.createIcons();
    }
}