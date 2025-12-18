/**
 * Punto de entrada (Entry Point).
 * Aquí se importan y centralizan todos los módulos, exponiéndolos al objeto `window`
 * para habilitar los eventos desde el HTML e iniciar los listeners globales.
 */
import * as State from './state.js';
import * as Utils from './utils.js';
import * as Theme from './theme.js';
import * as Session from './session.js';
import * as Tabs from './tabs.js';
import * as Files from './files.js';
import * as Grid from './grid.js';
import * as PanelUI from './panel-ui.js';
import * as PanelControls from './panel-controls.js';
import * as PanelActions from './panel-actions.js';
import * as Resize from './resize.js';
import * as Logs from './logs.js';

Object.assign(window, State);
Object.assign(window, Utils);
Object.assign(window, Theme);
Object.assign(window, Session);
Object.assign(window, Tabs);
Object.assign(window, Files);
Object.assign(window, Grid);
Object.assign(window, PanelUI);
Object.assign(window, PanelControls);
Object.assign(window, PanelActions);
Object.assign(window, Resize);
Object.assign(window, Logs);

document.addEventListener("DOMContentLoaded", () => {
    Session.loadSession();
    if(window.lucide) window.lucide.createIcons();
    Logs.startLocalPolling();
    
    Files.tryPassiveDiscovery();
    Files.registerPredefinedFiles();

    const searchInput = document.getElementById("search-input");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            Files.renderFileList(e.target.value);
        });
    }

    const dateFilter = document.getElementById("date-filter-input");
    if(dateFilter) {
        dateFilter.addEventListener("change", () => {
            Logs.refreshAllLogs();
        });
    }

    window.addEventListener("beforeunload", Session.saveSession);
    window.addEventListener('resize', () => {
        State.state.isLayoutUpdating = true;
        Grid.maintainScroll();
        setTimeout(() => State.state.isLayoutUpdating = false, 300);
    });

    document.addEventListener('mousemove', Resize.handleResizeMove);
    document.addEventListener('mouseup', Resize.handleResizeEnd);
});