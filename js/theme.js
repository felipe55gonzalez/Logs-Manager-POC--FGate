/**
 * Gestor de Temas y Estilos.
 * Maneja la inyección de variables CSS para los colores, el estado del sidebar
 * y la lógica del modal para la creación de temas personalizados.
 */
import { state } from './state.js';
import { saveSession } from './session.js';

export function updateRefreshRate(val) {
    state.refreshInterval = parseInt(val);
    document.getElementById("refresh-rate-display").innerText = val + "ms";
    saveSession();
}

export function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    applySidebarState();
    saveSession();
}

export function applySidebarState() {
    const sb = document.getElementById("sidebar");
    if (state.sidebarCollapsed) {
        sb.classList.add("collapsed");
        sb.classList.remove("w-72");
    } else {
        sb.classList.remove("collapsed");
        sb.classList.add("w-72");
    }
}

export function setTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    saveSession();
}

export function openThemeCreator() {
    state.previousTheme = document.documentElement.getAttribute("data-theme");
    state.isThemeSaved = false;

    document.getElementById("custom-theme-modal").classList.remove("hidden");
    
    const currentValues = state.customTheme || {};
    const variables = [
        'bg-body', 'bg-sidebar', 'bg-panel', 'bg-terminal',
        'text-main', 'text-dim', 'accent', 'border',
        'lvl-info', 'lvl-warn', 'lvl-error',
        'log-ts', 'log-method', 'log-uuid'
    ];

    variables.forEach(k => {
        const input = document.getElementById(`cp-${k}`);
        if(input) {
            if (currentValues[k]) input.value = currentValues[k];
            input.oninput = function() {
                previewCustomTheme();
            };
        }
    });

    setTheme('custom');
    if(state.customTheme) applyCustomCSS(state.customTheme);
}

export function previewCustomTheme() {
    const variables = [
        'bg-body', 'bg-sidebar', 'bg-panel', 'bg-terminal',
        'text-main', 'text-dim', 'accent', 'border',
        'lvl-info', 'lvl-warn', 'lvl-error',
        'log-ts', 'log-method', 'log-uuid'
    ];
    
    const themeData = {};
    variables.forEach(v => {
        const el = document.getElementById(`cp-${v}`);
        if(el) themeData[v] = el.value;
    });

    applyCustomCSS(themeData);
}

export function closeThemeCreator() {
    document.getElementById("custom-theme-modal").classList.add("hidden");
    
    if (!state.isThemeSaved && state.previousTheme) {
        setTheme(state.previousTheme);
    }
}

export function applyCustomTheme() {
    const variables = [
        'bg-body', 'bg-sidebar', 'bg-panel', 'bg-terminal',
        'text-main', 'text-dim', 'accent', 'border',
        'lvl-info', 'lvl-warn', 'lvl-error',
        'log-ts', 'log-method', 'log-uuid'
    ];
    
    const themeData = {};
    variables.forEach(v => {
        const el = document.getElementById(`cp-${v}`);
        if(el) themeData[v] = el.value;
    });

    state.customTheme = themeData;
    state.isThemeSaved = true;
    
    applyCustomCSS(themeData);
    setTheme('custom');
    closeThemeCreator();
}

export function applyCustomCSS(data) {
    let style = document.getElementById('custom-theme-style');
    if(!style) {
        style = document.createElement('style');
        style.id = 'custom-theme-style';
        document.head.appendChild(style);
    }
    
    let css = `[data-theme="custom"] {`;
    css += `--bg-body: ${data['bg-body']}; --bg-sidebar: ${data['bg-sidebar']}; --bg-panel: ${data['bg-panel']}; --bg-terminal: ${data['bg-terminal']};`;
    css += `--bg-input: ${data['bg-terminal']};`;
    css += `--text-main: ${data['text-main']}; --text-dim: ${data['text-dim']}; --border-color: ${data['border']};`;
    css += `--accent-primary: ${data['accent']}; --accent-glow: ${data['accent']}33; --scroll-thumb: ${data['border']};`;
    css += `--lvl-info: ${data['lvl-info']}; --lvl-warn: ${data['lvl-warn']}; --lvl-error: ${data['lvl-error']};`;
    css += `--log-ts: ${data['log-ts']}; --log-method: ${data['log-method']}; --log-uuid: ${data['log-uuid']};`;
    css += `--log-bracket: ${data['text-dim']}; --log-num: ${data['accent']}; --log-text: ${data['text-main']};`;
    css += `}`;

    style.innerHTML = css;
}

export function toggleSettings() {
    document.getElementById("settings-modal").classList.toggle("hidden");
}

export function copyConfig(el) {
    navigator.clipboard.writeText(el.innerText).then(() => {
        alert("Configuración copiada");
    });
}