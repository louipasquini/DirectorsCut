const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Detectar sistema operacional
const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

console.log(`Sistema operacional detectado: ${process.platform}`)
console.log(`Windows: ${isWindows}, Mac: ${isMac}, Linux: ${isLinux}`)

// Configurações da aplicação
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

// Variável global para controle de fechamento
global.app = app
app.isQuiting = false

let mainWindow = null
let tray = null

// Função para obter o ícone apropriado baseado no tema do sistema
function getAppIcon() {
  try {
    const { systemPreferences } = require('electron')
    
    // Detectar se o sistema está em modo escuro
    let isDarkMode = false
    
    if (isMac) {
      isDarkMode = systemPreferences.isDarkMode()
    } else if (isWindows) {
      // No Windows, verificar se o tema é escuro
      try {
        const windowColor = systemPreferences.getColor('window')
        isDarkMode = windowColor === '#000000' || windowColor === '#1e1e1e'
      } catch (error) {
        console.log('Não foi possível detectar tema do Windows, usando modo claro')
        isDarkMode = false
      }
    } else {
      // Linux - assumir modo claro por padrão
      isDarkMode = false
    }
    
    // Sempre usar ícone branco na aplicação para melhor visibilidade
    const iconFileName = 'IconWhite.ico'
    
    // Verificar se estamos em modo empacotado
    let iconPath
    if (app.isPackaged) {
      // Em modo empacotado, tentar diferentes caminhos possíveis
      const possiblePaths = [
        path.join(process.resourcesPath, 'public', iconFileName),
        path.join(process.resourcesPath, iconFileName),
        path.join(process.resourcesPath, 'app', 'public', iconFileName),
        path.join(process.resourcesPath, 'app', iconFileName),
        path.join(__dirname, '..', 'public', iconFileName),
        path.join(__dirname, '..', iconFileName),
        path.join(process.execPath, '..', 'resources', 'public', iconFileName),
        path.join(process.execPath, '..', 'resources', iconFileName)
      ]
      
      // Encontrar o primeiro caminho que existe
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          iconPath = testPath
          console.log(`🎨 Ícone encontrado em: ${iconPath}`)
          break
        }
      }
      
      // Se não encontrou, usar o primeiro caminho como fallback
      if (!iconPath) {
        iconPath = possiblePaths[0]
        console.log(`⚠️ Ícone não encontrado, usando fallback: ${iconPath}`)
      }
    } else {
      // Em modo desenvolvimento, o ícone está em ../public
      iconPath = path.join(__dirname, '../public', iconFileName)
    }
    
    console.log(`🎨 Tema detectado: ${isDarkMode ? 'Escuro' : 'Claro'}`)
    console.log(`🎨 Usando ícone: ${iconFileName}`)
    console.log(`🎨 Caminho do ícone: ${iconPath}`)
    console.log(`🎨 Ícone existe: ${fs.existsSync(iconPath)}`)
    
    return iconPath
  } catch (error) {
    console.error('Erro ao detectar tema do sistema:', error)
    // Fallback para ícone branco (melhor visibilidade)
    return path.join(__dirname, '../public', 'IconWhite.ico')
  }
}

function createWindow() {
  try {
    // Obter dimensões da tela
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
    
    // Calcular posição para aparecer no canto superior direito
    const windowWidth = APP_CONFIG.WINDOW.WIDTH
    const windowHeight = APP_CONFIG.WINDOW.HEIGHT
    const x = screenWidth - windowWidth - 20 // 20px de margem da borda direita
    const y = 20 // 20px de margem do topo
    
    // Configurar ícone baseado no tema do sistema
    const iconPath = getAppIcon()
    const iconImage = nativeImage.createFromPath(iconPath)
    
    console.log(`🎨 Carregando ícone da janela: ${iconPath}`)
    console.log(`🎨 Ícone carregado: ${!iconImage.isEmpty()}`)
    console.log(`🎨 Tamanho do ícone: ${iconImage.getSize()}`)
    console.log(`🎨 Ícone é vazio: ${iconImage.isEmpty()}`)
    
    // Criar a janela principal
  mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x,
      y: y,
      minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
      minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
      icon: iconImage,
      title: 'DirectorsCut',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        partition: 'persist:main'
    },
      frame: false,
    titleBarStyle: 'hidden',
      show: false,
    backgroundColor: '#1a1a1a',
    transparent: false,
    resizable: true,
      alwaysOnTop: false, // CORRIGIDO: Sempre no topo desativado por padrão para evitar overlay
      skipTaskbar: false
    })

    // Carregar aplicação
    const isDev = !app.isPackaged && process.env.NODE_ENV === 'development'
    
    console.log('Modo desenvolvimento:', isDev)
    console.log('App empacotado:', app.isPackaged)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    if (isDev) {
      // Modo desenvolvimento - usar servidor Vite
      const viteUrl = `http://localhost:${APP_CONFIG.PORTS.VITE_DEFAULT}`
      console.log('Carregando URL de desenvolvimento:', viteUrl)
      
      mainWindow.loadURL(viteUrl).catch((error) => {
        console.error('Erro ao carregar servidor de desenvolvimento:', error)
        console.log('Tentando carregar página de erro...')
        
        // Se falhar, carregar uma página de erro simples
        mainWindow.loadURL(`data:text/html,<h1>Erro ao carregar aplicação</h1><p>Verifique se o servidor de desenvolvimento está rodando.</p>`)
      })
    } else {
      // Modo produção - usar arquivos locais
      const indexPath = path.join(__dirname, '../dist/index.html')
      console.log('Carregando arquivo local:', indexPath)
      
      mainWindow.loadFile(indexPath).catch((error) => {
        console.error('Erro ao carregar arquivo local:', error)
        console.log('Tentando carregar página de erro...')
        
        // Se falhar, carregar uma página de erro simples
        mainWindow.loadURL(`data:text/html,<h1>Erro ao carregar aplicação</h1><p>Arquivos da aplicação não encontrados.</p>`)
      })
    }
    
    // Código de fallback para desenvolvimento (removido)

    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
      mainWindow.show()
      console.log('URL carregada com sucesso')
      
      // CORRIGIDO: Garantir que a janela não fique sempre no topo por padrão
      mainWindow.setAlwaysOnTop(false)
      console.log('🎨 AlwaysOnTop desativado por padrão para evitar overlay')
      
      // Forçar atualização do ícone da janela
      if (iconImage && !iconImage.isEmpty()) {
        mainWindow.setIcon(iconImage)
        console.log('🎨 Ícone da janela atualizado')
      }
      
    })

    // Adicionar listener para erros de carregamento
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Falha ao carregar:', errorCode, errorDescription, validatedURL)
    })

    // Adicionar listener para quando a página carregar
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Página carregada completamente')
      
      // Forçar atualização do ícone após carregamento completo
      setTimeout(() => {
        if (iconImage && !iconImage.isEmpty()) {
          mainWindow.setIcon(iconImage)
          console.log('🎨 Ícone da janela atualizado após carregamento completo')
        }
      }, 1000)
    })

    // Eventos da janela
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    mainWindow.on('minimize', () => {
      if (tray) {
        mainWindow.hide()
      }
    })

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
        event.preventDefault()
        mainWindow.hide()
      }
      return false
    })

    // Criar tray
    createTray()

  } catch (error) {
    console.error('Erro ao criar janela:', error)
  }
}

function createTray() {
  try {
    // Usar ícone baseado no tema do sistema
    const trayIconPath = getAppIcon()
    console.log('Criando bandeja com ícone:', trayIconPath)
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(trayIconPath)) {
      console.error('Ícone da bandeja não encontrado:', trayIconPath)
      // Fallback para ícone padrão
      tray = new Tray(nativeImage.createFromNamedImage('document'))
      console.log('Tray criado com ícone padrão (fallback)')
    } else {
      const trayIcon = nativeImage.createFromPath(trayIconPath)
      console.log(`🎨 Tray ícone carregado: ${!trayIcon.isEmpty()}`)
      tray = new Tray(trayIcon)
      console.log('Tray criado com ícone personalizado')
    }
    
    // Menu do tray
  const contextMenu = Menu.buildFromTemplate([
    {
        label: 'Mostrar DirectorsCut',
      click: () => {
        if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
        }
      }
    },
    {
      label: 'Sair',
      click: () => {
          app.isQuiting = true
          app.quit()
      }
    }
    ])
  
    tray.setContextMenu(contextMenu)
    tray.setToolTip('DirectorsCut - Organizador de Arquivos')
  
    // Clique duplo no tray para mostrar janela
    tray.on('double-click', () => {
    if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })
    
    console.log('Tray criado com sucesso usando ícone padrão')
    
  } catch (error) {
    console.error('Erro ao criar tray:', error)
    // Se falhar, continuar sem tray
    console.log('Continuando sem tray...')
  }
}

// Handlers IPC
function registerHandlers() {
  // Handler para selecionar arquivos
ipcMain.handle('select-files', async () => {
    console.log('🔥 HANDLER SELECT-FILES CHAMADO! 🔥')
    
    try {
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
      
      console.log('Resultado do diálogo:', result)
      
      if (!result.canceled && result.filePaths.length > 0) {
        const files = result.filePaths.map(filePath => {
          const stats = fs.statSync(filePath)
          return {
            name: path.basename(filePath),
            path: filePath,
            size: stats.size
          }
        })
        console.log('Arquivos selecionados:', files)
        return files
      }
      
      console.log('Nenhum arquivo selecionado')
      return []
    } catch (error) {
      console.error('Erro no handler select-files:', error)
      return []
    }
  })

  // Handler para obter informações do arquivo
ipcMain.handle('get-file-info', async (event, filePath) => {
    const stats = fs.statSync(filePath)
  return {
    name: path.basename(filePath),
      path: filePath,
    size: stats.size,
      lastModified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    }
  })

  // Handler para selecionar pasta de destino
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
  
  if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // Handler para mover arquivo
  ipcMain.handle('move-file', async (event, sourcePath, destinationFolder, organizedPath = null) => {
    const fs = require('fs');
    const path = require('path');
    
    console.log(`\n🔥 HANDLER MOVE-FILE CHAMADO! 🔥`);
    console.log(`Argumentos recebidos:`, { sourcePath, destinationFolder, organizedPath });
    
    try {
      console.log(`\n=== INICIANDO MOVIMENTAÇÃO DE ARQUIVO ===`);
      console.log(`Arquivo origem: ${sourcePath}`);
      console.log(`Pasta destino: ${destinationFolder}`);
      console.log(`Caminho organizado: ${organizedPath || 'Nenhum'}`);
      console.log(`Tipo do organizedPath: ${typeof organizedPath}`);
      console.log(`OrganizedPath é null: ${organizedPath === null}`);
      console.log(`OrganizedPath é undefined: ${organizedPath === undefined}`);
      
      // Verificar se o arquivo de origem existe
      if (!fs.existsSync(sourcePath)) {
        throw new Error('Arquivo de origem não encontrado')
      }

      // Verificar se a pasta de destino existe e tem permissão de escrita
      if (!fs.existsSync(destinationFolder)) {
        throw new Error('Pasta de destino não existe')
      }

      try {
        // Testar permissão de escrita na pasta de destino
        const testFile = path.join(destinationFolder, '.test-write-permission')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile)
      } catch (permError) {
        throw new Error('Sem permissão de escrita na pasta de destino')
      }

      // Construir caminho de destino
      let finalDestinationPath
      if (organizedPath) {
        // Se há organização, criar estrutura de pastas
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        // Criar diretório organizado se não existir (compatível com Windows e Mac)
        if (!fs.existsSync(organizedDir)) {
          try {
            // Usar separadores corretos para cada sistema operacional
            const normalizedDir = isWindows ? organizedDir.replace(/\//g, '\\') : organizedDir
            fs.mkdirSync(normalizedDir, { recursive: true })
            console.log(`Diretório criado: ${normalizedDir}`)
          } catch (mkdirError) {
            console.error('Erro ao criar diretório:', mkdirError)
            throw new Error(`Erro ao criar diretório: ${mkdirError.message}`)
          }
        }
        
        finalDestinationPath = fullOrganizedPath
      } else {
        // Sem organização, usar pasta de destino diretamente
        finalDestinationPath = path.join(destinationFolder, path.basename(sourcePath))
      }

      console.log(`Caminho final de destino: ${finalDestinationPath}`)

      // Verificar se o arquivo de destino já existe
      if (fs.existsSync(finalDestinationPath)) {
        throw new Error('Arquivo já existe no destino')
      }

      // Criar diretório de destino se não existir
      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        try {
          fs.mkdirSync(destDir, { recursive: true })
        } catch (mkdirError) {
          throw new Error(`Erro ao criar diretório de destino: ${mkdirError.message}`)
        }
      }

      // Mover arquivo usando streams para melhor compatibilidade cross-platform
      try {
        // Primeiro, tentar rename (mais eficiente)
        fs.renameSync(sourcePath, finalDestinationPath)
        console.log('Arquivo movido com rename')
        return { success: true, message: 'Arquivo movido com sucesso' }
      } catch (moveError) {
        console.log('Rename falhou, tentando cópia com streams:', moveError.message)
        
        // Se rename falhar, usar streams para cópia (compatível com Windows e Mac)
        const readStream = fs.createReadStream(sourcePath)
        const writeStream = fs.createWriteStream(finalDestinationPath)
        
        return new Promise((resolve, reject) => {
          readStream.on('error', (readError) => {
            console.error('Erro ao ler arquivo:', readError)
            reject(new Error(`Erro ao ler arquivo: ${readError.message}`))
          })
          
          writeStream.on('error', (writeError) => {
            console.error('Erro ao escrever arquivo:', writeError)
            reject(new Error(`Erro ao escrever arquivo: ${writeError.message}`))
          })
          
          writeStream.on('finish', () => {
            try {
              // Tentar deletar o arquivo original
              fs.unlinkSync(sourcePath)
              console.log('Arquivo copiado com streams e original removido')
              resolve({ success: true, message: 'Arquivo movido com sucesso (via cópia)' })
            } catch (deleteError) {
              console.log('Aviso: Arquivo copiado mas original não foi removido:', deleteError.message)
              resolve({ success: true, message: 'Arquivo copiado com sucesso (original mantido)' })
            }
          })
          
          readStream.pipe(writeStream)
        })
      }
    } catch (error) {
      console.error('Erro ao mover arquivo:', error)
      return { success: false, message: error.message }
    }
  })

  // Handler para mover arquivo do navegador
  ipcMain.handle('move-file-from-browser', async (event, fileData, destinationFolder, organizedPath = null) => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      console.log(`\n🔥 HANDLER MOVE-FILE-FROM-BROWSER CHAMADO! 🔥`);
      console.log(`Argumentos recebidos:`, { 
        fileName: fileData.name, 
        fileSize: fileData.size, 
        fileType: fileData.type,
        destinationFolder, 
        organizedPath 
      });
      
      // Converter dados base64 para Buffer
      const buffer = Buffer.from(fileData.data, 'base64')
      const fileName = fileData.name
      
      // Construir caminho de destino
      let finalDestinationPath
      if (organizedPath) {
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        if (!fs.existsSync(organizedDir)) {
          fs.mkdirSync(organizedDir, { recursive: true })
        }
        
        finalDestinationPath = fullOrganizedPath
      } else {
        finalDestinationPath = path.join(destinationFolder, fileName)
      }

      // Criar diretório de destino se não existir
      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      // Escrever arquivo
      fs.writeFileSync(finalDestinationPath, buffer)
      
      // Verificação final
      if (fs.existsSync(finalDestinationPath)) {
        console.log(`Arquivo do navegador movido com sucesso: ${finalDestinationPath}`)
        return { success: true, message: 'Arquivo movido com sucesso' }
      } else {
        throw new Error('Falha ao criar arquivo de destino')
      }
    } catch (error) {
      console.error('Erro ao mover arquivo do navegador:', error)
      return { success: false, message: error.message }
    }
  })

  // Handler para mover arquivo com renomeação
  ipcMain.handle('move-file-with-rename', async (event, sourcePath, destinationFolder, organizedPath = null) => {
    const fs = require('fs');
    const path = require('path');
    
    console.log(`\n🔥 HANDLER MOVE-FILE-WITH-RENAME CHAMADO! 🔥`);
    console.log(`Argumentos recebidos:`, { sourcePath, destinationFolder, organizedPath });
    
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error('Arquivo de origem não encontrado')
      }

      let finalDestinationPath
      if (organizedPath) {
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        if (!fs.existsSync(organizedDir)) {
          fs.mkdirSync(organizedDir, { recursive: true })
        }
        
        // Verificar se o arquivo já existe e renomear se necessário
        if (fs.existsSync(fullOrganizedPath)) {
          const fileName = path.basename(fullOrganizedPath)
          const nameWithoutExt = path.parse(fileName).name
          const ext = path.parse(fileName).ext
          let counter = 1
          let newFileName = fileName
          
          while (fs.existsSync(path.join(organizedDir, newFileName))) {
            newFileName = `${nameWithoutExt}_Cópia_${counter}${ext}`
            counter++
          }
          
          finalDestinationPath = path.join(organizedDir, newFileName)
        } else {
          finalDestinationPath = fullOrganizedPath
        }
      } else {
        const fileName = path.basename(sourcePath)
        const nameWithoutExt = path.parse(fileName).name
        const ext = path.parse(fileName).ext
        let counter = 1
        let newFileName = fileName
        
        while (fs.existsSync(path.join(destinationFolder, newFileName))) {
          newFileName = `${nameWithoutExt}_Cópia_${counter}${ext}`
          counter++
        }
        
        finalDestinationPath = path.join(destinationFolder, newFileName)
      }

      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.renameSync(sourcePath, finalDestinationPath)
      
      return { success: true, message: 'Arquivo movido com sucesso' }
    } catch (error) {
      console.error('Erro ao mover arquivo com renomeação:', error)
      return { success: false, message: error.message }
    }
  })

  // Handler para mover arquivo com substituição
  ipcMain.handle('move-file-with-replace', async (event, sourcePath, destinationFolder, organizedPath = null) => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error('Arquivo de origem não encontrado')
      }

      let finalDestinationPath
      if (organizedPath) {
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        if (!fs.existsSync(organizedDir)) {
          fs.mkdirSync(organizedDir, { recursive: true })
        }
        
        finalDestinationPath = fullOrganizedPath
      } else {
        finalDestinationPath = path.join(destinationFolder, path.basename(sourcePath))
      }

      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      // Remover arquivo existente se houver
      if (fs.existsSync(finalDestinationPath)) {
        fs.unlinkSync(finalDestinationPath)
      }

      fs.renameSync(sourcePath, finalDestinationPath)
      
      return { success: true, message: 'Arquivo movido com sucesso' }
    } catch (error) {
      console.error('Erro ao mover arquivo com substituição:', error)
      return { success: false, message: error.message }
    }
  })

  // Handler para mover arquivo do navegador com renomeação
  ipcMain.handle('move-file-from-browser-with-rename', async (event, fileData, destinationFolder, organizedPath = null) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
      console.log(`\n🔥 HANDLER MOVE-FILE-FROM-BROWSER-WITH-RENAME CHAMADO! 🔥`);
      console.log(`Argumentos recebidos:`, { 
        fileName: fileData.name, 
        fileSize: fileData.size, 
        fileType: fileData.type,
        destinationFolder, 
        organizedPath 
      });
      
      const buffer = Buffer.from(fileData.data, 'base64')
      const fileName = fileData.name
      
      let finalDestinationPath
      if (organizedPath) {
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        if (!fs.existsSync(organizedDir)) {
          fs.mkdirSync(organizedDir, { recursive: true })
        }
        
        // Verificar se o arquivo já existe e renomear se necessário
        if (fs.existsSync(fullOrganizedPath)) {
          const fileName = path.basename(fullOrganizedPath)
          const nameWithoutExt = path.parse(fileName).name
          const ext = path.parse(fileName).ext
          let counter = 1
          let newFileName = fileName
          
          while (fs.existsSync(path.join(organizedDir, newFileName))) {
            newFileName = `${nameWithoutExt}_Cópia_${counter}${ext}`
            counter++
          }
          
          finalDestinationPath = path.join(organizedDir, newFileName)
        } else {
          finalDestinationPath = fullOrganizedPath
        }
      } else {
        const nameWithoutExt = path.parse(fileName).name
        const ext = path.parse(fileName).ext
        let counter = 1
        let newFileName = fileName
        
        while (fs.existsSync(path.join(destinationFolder, newFileName))) {
          newFileName = `${nameWithoutExt}_Cópia_${counter}${ext}`
          counter++
        }
        
        finalDestinationPath = path.join(destinationFolder, newFileName)
      }

      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      fs.writeFileSync(finalDestinationPath, buffer)
      
      return { success: true, message: 'Arquivo movido com sucesso' }
  } catch (error) {
      console.error('Erro ao mover arquivo do navegador com renomeação:', error)
      return { success: false, message: error.message }
  }
  })

  // Handler para mover arquivo do navegador com substituição
  ipcMain.handle('move-file-from-browser-with-replace', async (event, fileData, destinationFolder, organizedPath = null) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
      console.log(`\n🔥 HANDLER MOVE-FILE-FROM-BROWSER-WITH-REPLACE CHAMADO! 🔥`);
      console.log(`Argumentos recebidos:`, { 
        fileName: fileData.name, 
        fileSize: fileData.size, 
        fileType: fileData.type,
        destinationFolder, 
        organizedPath 
      });
      
      const buffer = Buffer.from(fileData.data, 'base64')
      const fileName = fileData.name
      
      let finalDestinationPath
      if (organizedPath) {
        const fullOrganizedPath = path.join(destinationFolder, organizedPath)
        const organizedDir = path.dirname(fullOrganizedPath)
        
        if (!fs.existsSync(organizedDir)) {
          fs.mkdirSync(organizedDir, { recursive: true })
        }
        
        finalDestinationPath = fullOrganizedPath
      } else {
        finalDestinationPath = path.join(destinationFolder, fileName)
      }

      const destDir = path.dirname(finalDestinationPath)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      // Remover arquivo existente se houver
    if (fs.existsSync(finalDestinationPath)) {
        fs.unlinkSync(finalDestinationPath)
      }

      fs.writeFileSync(finalDestinationPath, buffer)
      
      return { success: true, message: 'Arquivo movido com sucesso' }
    } catch (error) {
      console.error('Erro ao mover arquivo do navegador com substituição:', error)
      return { success: false, message: error.message }
    }
  })

  // Handler para verificar se arquivo existe
  ipcMain.handle('check-file-exists', async (event, filePath) => {
    return fs.existsSync(filePath)
  })

  // Handler para criar diretório
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        return { success: true, message: 'Diretório criado com sucesso' }
      }
      return { success: true, message: 'Diretório já existe' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  // Handlers de controle da janela
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.handle('window-close', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  ipcMain.handle('set-always-on-top', (event, alwaysOnTop) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(alwaysOnTop)
      return alwaysOnTop
    }
    return false
  })

  // Handlers de configurações da aplicação
  ipcMain.handle('load-app-settings', async () => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')
      
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8')
        return JSON.parse(settingsData)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da aplicação:', error)
    }
    
    return null
  })

  ipcMain.handle('save-app-settings', async (event, settings) => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')
      
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
  } catch (error) {
      console.error('Erro ao salvar configurações da aplicação:', error)
      return { success: false, message: error.message }
    }
  })
}

// Eventos da aplicação
app.whenReady().then(() => {
  // Configurar App User Model ID para Windows ANTES de criar a janela
  if (isWindows) {
    try {
      app.setAppUserModelId('com.directorscut.app')
      console.log('🎨 App User Model ID configurado para Windows')
      
      // Configurar nome da aplicação para Windows
      app.setName('DirectorsCut')
      console.log('🎨 Nome da aplicação configurado para Windows')
      
    } catch (error) {
      console.log('Aviso: Não foi possível configurar App User Model ID:', error.message)
    }
  }
  
  // Configurar ícone da aplicação globalmente (apenas para macOS)
  if (isMac) {
    try {
      const appIconPath = getAppIcon()
      const appIcon = nativeImage.createFromPath(appIconPath)
      if (!appIcon.isEmpty()) {
        app.dock.setIcon(appIcon)
        console.log('🎨 Ícone da aplicação configurado para macOS')
      }
    } catch (error) {
      console.log('Aviso: Não foi possível configurar ícone para macOS:', error.message)
    }
  }
  
  registerHandlers()
  createWindow()
  console.log('Aplicação inicializada com sucesso')
})

// Configurar variáveis de ambiente
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'development'
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  app.isQuiting = true
})