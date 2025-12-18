/**
 * Persistencia de Datos.
 * Se encarga de guardar y recuperar todo el estado en LocalStorage (tabs, temas, filtros)
 * para mantener la configuración del usuario entre recargas.
 */
import { state, AUTO_LOAD_FILES } from './state.js';
import { setTheme, applySidebarState, applyCustomCSS } from './theme.js';
import { renderTabs } from './tabs.js';
import { updateGridLayout } from './grid.js';
import { renderFileList, registerPredefinedFiles } from './files.js';

export function saveSession() {
    const sessionData = {
        fileList: state.fileList,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        fontSizes: state.fontSizes,
        lineOffsets: state.lineOffsets,
        filters: state.filters,
        layout: state.layout,
        theme: document.documentElement.getAttribute("data-theme") || "obsidian",
        customTheme: state.customTheme,
        sidebarCollapsed: state.sidebarCollapsed,
        refreshInterval: state.refreshInterval 
    };
    localStorage.setItem("Logs_Manager_POC_FGate", JSON.stringify(sessionData));
}

export function loadSession() {
    const saved = localStorage.getItem("Logs_Manager_POC_FGate");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            const combined = new Set([...(data.fileList || []), ...AUTO_LOAD_FILES]);
            state.fileList = Array.from(combined).sort();
            state.fontSizes = data.fontSizes || {};
            state.lineOffsets = data.lineOffsets || {};
            state.filters = data.filters || {};
            state.layout = data.layout || {};
            state.customTheme = data.customTheme || null;
            state.sidebarCollapsed = data.sidebarCollapsed || false;
            state.refreshInterval = data.refreshInterval || 1000;

            if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
                state.tabs = data.tabs;
                state.activeTabId = data.activeTabId || state.tabs[0].id;
            } else {
                state.tabs = [{ id: 'default', name: 'Principal', files: data.openedFiles || [] }];
                state.activeTabId = 'default';
            }
            
            if(state.customTheme) applyCustomCSS(state.customTheme);

            setTheme(data.theme);
            applySidebarState();
            
            const slider = document.getElementById("refresh-rate-slider");
            const display = document.getElementById("refresh-rate-display");
            if(slider && display) {
                slider.value = state.refreshInterval;
                display.innerText = state.refreshInterval + "ms";
            }
            
        } catch (e) { console.error(e); }
    } else {
        setTheme("obsidian");
        registerPredefinedFiles();
    }
    renderTabs();
    updateGridLayout();
    renderFileList();
}