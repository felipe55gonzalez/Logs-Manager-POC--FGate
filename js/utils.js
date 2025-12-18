/**
 * Utilidades Generales.
 * Funciones auxiliares puras para tareas comunes, como formateo de rutas,
 * limpieza de strings y generación de IDs seguros para el DOM.
 */
export function getDisplayName(path) {
    return path.split('/').pop();
}

export function fileAsId(name) { 
    return name.replace(/[^a-zA-Z0-9]/g, "-"); 
}