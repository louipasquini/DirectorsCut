# Documentação Técnica - DirectorsCut

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes Principais](#componentes-principais)
4. [API e Handlers](#api-e-handlers)
5. [Sistema de Organização](#sistema-de-organização)
6. [Configurações](#configurações)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Build e Deploy](#build-e-deploy)
10. [Troubleshooting](#troubleshooting)

## Visão Geral

DirectorsCut é uma aplicação desktop multiplataforma desenvolvida com Electron e React que automatiza a organização de arquivos baseada em padrões de nomenclatura inteligentes. A aplicação utiliza uma arquitetura de processo principal (main) e processo de renderização (renderer) para garantir segurança e performance.

### Tecnologias Core
- **Electron 38.0.0**: Framework para aplicações desktop
- **React 19.1.1**: Biblioteca para interface de usuário
- **Vite 7.1.2**: Build tool e servidor de desenvolvimento
- **Node.js**: Runtime para operações de sistema

## Arquitetura

### Estrutura de Processos

```
┌─────────────────────────────────────┐
│           Main Process              │
│  (electron/main.js)                 │
│  - Gerenciamento de janelas         │
│  - Handlers IPC                     │
│  - Operações de arquivo             │
│  - Sistema de tray                  │
└─────────────────┬───────────────────┘
                  │ IPC Communication
┌─────────────────▼───────────────────┐
│         Renderer Process            │
│  (React App)                        │
│  - Interface de usuário             │
│  - Gerenciamento de estado          │
│  - Comunicação com main process     │
└─────────────────────────────────────┘
```

### Estrutura de Diretórios

```
DirectorsCut/
├── electron/                 # Processo principal Electron
│   ├── main.js              # Entry point e configuração da janela
│   ├── preload.js           # Bridge de segurança IPC
│   ├── handlers/            # Handlers IPC organizados
│   ├── services/            # Serviços de sistema
│   └── utils/               # Utilitários
├── src/                     # Aplicação React
│   ├── App.jsx              # Componente principal
│   ├── components/          # Componentes React
│   │   ├── common/          # Componentes reutilizáveis
│   │   ├── file/            # Componentes de arquivo
│   │   └── layout/          # Componentes de layout
│   ├── hooks/               # Custom hooks
│   ├── services/            # Serviços da aplicação
│   └── assets/              # Recursos estáticos
├── public/                  # Recursos públicos
├── dist/                    # Build de produção
└── dist-electron/           # Build empacotado
```

## Componentes Principais

### Main Process (electron/main.js)

#### Configuração da Janela
```javascript
const APP_CONFIG = {
  WINDOW: {
    WIDTH: 400,
    HEIGHT: 600,
    MIN_WIDTH: 350,
    MIN_HEIGHT: 500
  },
  PORTS: {
    VITE_DEFAULT: 5173
  }
}
```

#### Características da Janela
- **Posicionamento**: Canto superior direito da tela
- **Sempre no Topo**: Ativado por padrão
- **Frame Customizado**: Sem bordas nativas do sistema
- **Tray Integration**: Ícone na bandeja do sistema
- **Multiplataforma**: Detecção automática do SO

#### Sistema de Ícones
```javascript
function getAppIcon() {
  // Detecção de tema do sistema
  // Suporte a Windows, macOS e Linux
  // Fallback para ícone padrão
}
```

### Renderer Process (React App)

#### Estado Principal
```javascript
const [settings, setSettings] = useState({
  destinationFolder: '',
  alwaysOnTop: true,
  organization: {
    enabled: false,
    product: true,
    year: true,
    month: true,
    extension: true
  }
})
```

#### Gerenciamento de Arquivos
- **Drag & Drop**: Suporte nativo do navegador
- **Seleção Múltipla**: Via diálogo do sistema
- **Processamento**: Conversão para base64 para arquivos do navegador
- **Validação**: Verificação de tipos e tamanhos

## API e Handlers

### Preload Script (electron/preload.js)

O preload script expõe APIs seguras para o renderer process:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // Seleção de arquivos
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Operações de arquivo
  moveFile: (sourcePath, destinationFolder, organizedPath) => 
    ipcRenderer.invoke('move-file', sourcePath, destinationFolder, organizedPath),
  
  // Controles da janela
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.invoke('set-always-on-top', alwaysOnTop),
  
  // Configurações
  loadAppSettings: () => ipcRenderer.invoke('load-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings)
})
```

### Handlers IPC Principais

#### 1. Seleção de Arquivos
```javascript
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Todos os arquivos', extensions: ['*'] },
      { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
      { name: 'Vídeos', extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'] },
      { name: 'Áudios', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
      { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'] }
    ]
  })
})
```

#### 2. Movimentação de Arquivos
```javascript
ipcMain.handle('move-file', async (event, sourcePath, destinationFolder, organizedPath = null) => {
  // Verificações de segurança
  // Criação de diretórios
  // Movimentação com fallback para cópia
  // Tratamento de erros
})
```

#### 3. Resolução de Conflitos
- `move-file-with-rename`: Renomeia arquivos duplicados
- `move-file-with-replace`: Substitui arquivos existentes
- `move-file-from-browser-*`: Versões para arquivos do navegador

## Sistema de Organização

### Padrões de Nomenclatura Suportados

#### Formato com Versão
```
Cliente_Titulo_AAAAMMDD_vX.extensao
Exemplo: PCS_TrafegoPago_20250906_v1.png
```

#### Formato Simples
```
Cliente_Titulo_AAAAMMDD.extensao
Exemplo: PCS_TrafegoPago_20250906.psd
```

### Algoritmo de Organização

```javascript
const organizeFilePath = useCallback((fileName) => {
  // 1. Verificar se organização está ativada
  if (!settings.organization.enabled) return fileName
  
  // 2. Validar padrão de nomenclatura
  const parts = fileName.split('_')
  if (parts.length < 3) return fileName
  
  // 3. Extrair componentes
  const [product, title, date, versionAndExtension] = parts
  const year = date.substring(0, 4)
  const month = date.substring(4, 6)
  const extension = versionAndExtension.split('.')[1].toUpperCase()
  
  // 4. Construir caminho baseado nas configurações
  const pathParts = []
  if (settings.organization.product) pathParts.push(product)
  if (settings.organization.year) pathParts.push(year)
  if (settings.organization.month) pathParts.push(month)
  if (settings.organization.extension) pathParts.push(`${extension}s`)
  
  return pathParts.join('/') + '/' + fileName
}, [settings.organization])
```

### Estrutura de Pastas Gerada

```
Pasta de Destino/
├── Cliente/
│   └── 2024/
│       └── 09/
│           └── PNGs/
│               └── Cliente_Titulo_20240906_v1.png
│           └── PSDs/
│               └── Cliente_Titulo_20240906.psd
```

## Configurações

### Persistência de Dados

#### LocalStorage (Browser)
```javascript
localStorage.setItem('directorsCutSettings', JSON.stringify(settings))
```

#### Electron UserData
```javascript
const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
```

### Configurações Disponíveis

```javascript
{
  destinationFolder: string,     // Pasta de destino
  alwaysOnTop: boolean,          // Janela sempre no topo
  organization: {
    enabled: boolean,            // Ativar organização
    product: boolean,            // Organizar por cliente
    year: boolean,               // Organizar por ano
    month: boolean,              // Organizar por mês
    extension: boolean           // Organizar por extensão
  }
}
```

## Fluxo de Dados

### 1. Adição de Arquivos
```
User Action → File Selection/Drop → File Processing → State Update → UI Update
```

### 2. Movimentação de Arquivos
```
User Click → Conflict Check → Organization Logic → IPC Call → File Operation → Result Notification
```

### 3. Configurações
```
User Change → State Update → LocalStorage Save → Electron Save → Persistence Confirmation
```

## Tratamento de Erros

### Níveis de Tratamento

#### 1. Frontend (React)
```javascript
try {
  const result = await window.electronAPI.moveFile(...)
  if (result.success) {
    addNotification('Arquivo movido com sucesso!', 'success')
  } else {
    addNotification(`Erro: ${result.message}`, 'error')
  }
} catch (error) {
  addNotification(`Erro inesperado: ${error.message}`, 'error')
}
```

#### 2. Main Process (Electron)
```javascript
try {
  // Operação de arquivo
  fs.renameSync(sourcePath, finalDestinationPath)
  return { success: true, message: 'Arquivo movido com sucesso' }
} catch (error) {
  console.error('Erro ao mover arquivo:', error)
  return { success: false, message: error.message }
}
```

### Tipos de Erro Tratados
- **Arquivo não encontrado**
- **Sem permissão de escrita**
- **Arquivo já existe**
- **Diretório não pode ser criado**
- **Falha na comunicação IPC**

## Build e Deploy

### Configuração do Electron Builder

```json
{
  "build": {
    "appId": "com.directorscut.app",
    "productName": "DirectorsCut",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": "dmg"
    },
    "win": {
      "target": "nsis",
      "forceCodeSigning": false
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### Scripts de Build

```bash
# Desenvolvimento
npm run dev              # Servidor Vite
npm run start            # Electron + Vite

# Produção
npm run build            # Build React
npm run electron-pack    # Empacotamento completo
```

### Processo de Build

1. **Build React**: Vite compila a aplicação React
2. **Cópia de Recursos**: Arquivos necessários são copiados
3. **Empacotamento**: Electron Builder cria instaladores
4. **Assinatura**: (Opcional) Assinatura de código
5. **Distribuição**: Arquivos prontos para distribuição

## Troubleshooting

### Problemas Comuns

#### 1. Aplicação não inicia
```bash
# Verificar dependências
npm install

# Limpar cache
npm run clean
rm -rf node_modules package-lock.json
npm install
```

#### 2. Erro de permissão
- Verificar permissões de escrita na pasta de destino
- Executar como administrador (Windows)
- Verificar configurações de segurança (macOS)

#### 3. Arquivos não são organizados
- Verificar se organização está ativada
- Validar padrão de nomenclatura
- Verificar configurações de organização

#### 4. Problemas de performance
- Limitar número de arquivos simultâneos
- Verificar espaço em disco
- Monitorar uso de memória

### Logs e Debug

#### Habilitar Logs Detalhados
```javascript
// No main.js
console.log('Modo desenvolvimento:', isDev)
console.log('App empacotado:', app.isPackaged)
```

#### Verificar Comunicação IPC
```javascript
// No preload.js
console.log('IPC handlers registrados:', Object.keys(electronAPI))
```

### Suporte por Plataforma

#### Windows
- Verificar antivírus
- Executar como administrador se necessário
- Verificar políticas de grupo

#### macOS
- Verificar Gatekeeper
- Permitir aplicação em Preferências do Sistema
- Verificar permissões de arquivo

#### Linux
- Verificar permissões de arquivo
- Instalar dependências necessárias
- Verificar compatibilidade de bibliotecas

---

Esta documentação técnica fornece uma visão completa da arquitetura e funcionamento interno do DirectorsCut, facilitando manutenção, desenvolvimento e troubleshooting.
