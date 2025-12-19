/**
 * Utilidades Generales.
 * Funciones auxiliares puras para tareas comunes, como formateo de rutas,
 * limpieza de strings y generación de IDs seguros para el DOM.
 */
export function getDisplayName(path) {
    // Si es una ruta del servidor "Bridge" (api/log?id=Nombre)
    if (path.includes("id=")) {
        return path.split("id=")[1].split("&")[0];
    }
    // Si es una ruta de archivo normal (carpeta/archivo.log)
    return path.split('/').pop();
}

export function fileAsId(name) { 
    return name.replace(/[^a-zA-Z0-9]/g, "-"); 
}