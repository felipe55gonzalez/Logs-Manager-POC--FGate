/**
 * Configuración y Estado Global.
 * Aquí se define la lista de archivos por defecto (AUTO_LOAD_FILES) y se mantiene
 * el objeto `state` que sincroniza toda la aplicación: filtros, layout y datos en memoria.
 */
export const rph = "./logsPath/";

export var AUTO_LOAD_FILES = [
    rph + "BuscarServiciosClientesSlam.log",
    rph + "FTPenviosSLAM.log",
    rph + "FTPenviosSLAMservicio.log",
    rph + "ManifestacionMongoService.log",
    rph + "ManifestacionRali.log",
    rph + "ManifestacionRepository.log",
    rph + "Parser_MV_Service.log",
    rph + "PedimentoLookupHelper.log",
    rph + "QuerysToCasaDB.log",
    rph + "servicio_ftp.log",
    rph + "toter_sync.log",
    rph + "webdav-expedientes.log"
];

export const state = {
    fileList: [],
    
    tabs: [
        { id: 'default', name: 'Principal', files: [] }
    ],
    
    activeTabId: 'default',
    previewFile: null,      
    pausedFiles: new Set(),
    inspectorMode: new Set(),
    logsData: {},
    filters: {},
    lineOffsets: {},
    fontSizes: {},
    layout: {}, 
    customTheme: null,
    sidebarCollapsed: false,
    refreshInterval: 1000,
    isLayoutUpdating: false,
    previousTheme: null,
    isThemeSaved: false,
    headerTimers: {},

    resizing: {
        active: false,
        filename: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startCol: 1,
        startRow: 1,
        panelElement: null
    }
};