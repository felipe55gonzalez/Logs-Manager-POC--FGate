/**
 * Sistema de Pestañas.
 * Aquí se administra la gestión de sesiones de monitoreo, permitiendo crear,
 * renombrar, cambiar y cerrar tabs según se necesite.
 */
import { state } from './state.js';
import { saveSession } from './session.js';
import { updateGridLayout } from './grid.js';

export function getActiveTab() {
    return state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
}

export function createNewTab() {
    const newId = 'tab-' + Date.now();
    state.tabs.push({ id: newId, name: 'Nueva Pestaña', files: [] });
    switchTab(newId);
}

export function switchTab(tabId) {
    state.activeTabId = tabId;
    state.previewFile = null; 
    renderTabs();
    updateGridLayout();
    saveSession();
}

export function deleteTab(tabId, e) {
    e.stopPropagation();
    if (state.tabs.length <= 1) return; 
    
    if (confirm("¿Cerrar esta pestaña y sus vistas?")) {
        const index = state.tabs.findIndex(t => t.id === tabId);
        state.tabs.splice(index, 1);
        
        if (state.activeTabId === tabId) {
            state.activeTabId = state.tabs[Math.max(0, index - 1)].id;
        }
        
        renderTabs();
        updateGridLayout();
        saveSession();
    }
}

export function renameTab(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;
    const newName = prompt("Nombre de la pestaña:", tab.name);
    if (newName && newName.trim()) {
        tab.name = newName.trim();
        renderTabs();
        saveSession();
    }
}

export function renderTabs() {
    const container = document.getElementById("tabs-bar");
    const addBtn = container.lastElementChild;
    container.innerHTML = '';
    
    state.tabs.forEach(tab => {
        const isActive = tab.id === state.activeTabId;
        const btn = document.createElement("div");
        btn.className = `tab-item ${isActive ? 'active' : ''}`;
        btn.onclick = () => switchTab(tab.id);
        btn.ondblclick = () => renameTab(tab.id);
        
        btn.innerHTML = `
            <span>${tab.name}</span>
            <i onclick="deleteTab('${tab.id}', event)" data-lucide="x" width="12" class="tab-close p-0.5 ml-1"></i>
        `;
        container.appendChild(btn);
    });
    
    container.appendChild(addBtn);
    if(window.lucide) window.lucide.createIcons();
}