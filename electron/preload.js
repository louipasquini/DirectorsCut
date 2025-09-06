const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Seleção de arquivos
  selectFiles: () => ipcRenderer.invoke('select-files'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Operações de arquivo
  moveFile: (sourcePath, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file', sourcePath, destinationFolder, organizedPath),
  moveFileFromBrowser: (file, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file-from-browser', file, destinationFolder, organizedPath),
  moveFileWithRename: (sourcePath, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file-with-rename', sourcePath, destinationFolder, organizedPath),
  moveFileWithReplace: (sourcePath, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file-with-replace', sourcePath, destinationFolder, organizedPath),
  moveFileFromBrowserWithRename: (file, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file-from-browser-with-rename', file, destinationFolder, organizedPath),
  moveFileFromBrowserWithReplace: (file, destinationFolder, organizedPath) => ipcRenderer.invoke('move-file-from-browser-with-replace', file, destinationFolder, organizedPath),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  
  // Controles da janela
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.invoke('set-always-on-top', alwaysOnTop),
  
  // Configurações
  loadAppSettings: () => ipcRenderer.invoke('load-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),
  
  // Utilitários
  platform: process.platform,
  versions: process.versions
});