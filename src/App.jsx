import { useState, useCallback, useEffect } from 'react'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [currentPage, setCurrentPage] = useState('main') // 'main' ou 'settings'
  const [settings, setSettings] = useState({
    destinationFolder: '',
    alwaysOnTop: false, // CORRIGIDO: Sempre no topo desativado por padrão para evitar overlay
    organization: {
      enabled: false,
      product: true,
      year: true,
      month: true,
      extension: true
    }
  })
  const [notifications, setNotifications] = useState([])
  const [isMoving, setIsMoving] = useState(false)
  const [duplicateConflicts, setDuplicateConflicts] = useState([])
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Primeiro, tentar carregar do localStorage
        const savedSettings = localStorage.getItem('directorsCutSettings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
          console.log('Configurações carregadas do localStorage:', parsed)
        } else {
          // Se não houver no localStorage, tentar carregar do Electron
          if (window.electronAPI && window.electronAPI.loadAppSettings) {
            const electronSettings = await window.electronAPI.loadAppSettings()
            if (electronSettings) {
              setSettings(prev => ({ ...prev, ...electronSettings }))
              console.log('Configurações carregadas do Electron:', electronSettings)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
      setSettingsLoaded(true)
    }
    
    loadSettings()
  }, [])

  // Função para adicionar notificações
  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // ID mais único
    console.log(`Adicionando notificação: ${message} (${type})`)
    
    setNotifications(prev => {
      const newNotifications = [...prev, { id, message, type, timestamp: Date.now() }]
      console.log(`Total de notificações: ${newNotifications.length}`)
      return newNotifications
    })
    
    // Remover notificação após o tempo especificado com animação
    const timeoutId = setTimeout(() => {
      // Primeiro, adicionar classe de remoção
      const notificationElement = document.querySelector(`[data-notification-id="${id}"]`)
      if (notificationElement) {
        notificationElement.classList.add('removing')
        
        // Remover do estado após a animação
        setTimeout(() => {
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== id)
            console.log(`Removendo notificação ${id}, restam: ${filtered.length}`)
            return filtered
          })
        }, 300) // Tempo da animação
      } else {
        // Fallback se o elemento não for encontrado
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== id)
          console.log(`Removendo notificação ${id}, restam: ${filtered.length}`)
          return filtered
        })
      }
    }, duration)
    
    // Limpar timeout se componente for desmontado
    return () => clearTimeout(timeoutId)
  }, [])

  // Salvar configurações quando mudarem
  useEffect(() => {
    if (!settingsLoaded) return // Não salvar na primeira renderização
    
    const saveSettings = async () => {
      try {
        // Salvar no localStorage
        localStorage.setItem('directorsCutSettings', JSON.stringify(settings))
        console.log('Configurações salvas no localStorage:', settings)
        
        // Salvar no Electron também
        if (window.electronAPI && window.electronAPI.saveAppSettings) {
          await window.electronAPI.saveAppSettings(settings)
          console.log('Configurações salvas no Electron:', settings)
        }
      } catch (error) {
        console.error('Erro ao salvar configurações:', error)
        addNotification('Erro ao salvar configurações', 'error')
      }
    }
    
    saveSettings()
  }, [settings, settingsLoaded, addNotification])

  // Função para limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Função para gerar estrutura de exemplo baseada nas configurações
  const generateFolderStructure = useCallback(() => {
    const pathParts = []
    let indent = 0
    
    if (settings.organization.product) {
      pathParts.push({ text: '📁 Cliente/', indent: indent })
      indent += 2
    }
    
    if (settings.organization.year) {
      pathParts.push({ text: '└📁 Ano/', indent: indent })
      indent += 2
    }
    
    if (settings.organization.month) {
      pathParts.push({ text: '└📁 Mês/', indent: indent })
      indent += 2
    }
    
    if (settings.organization.extension) {
      pathParts.push({ text: '└📁 Tipo de Arquivo/', indent: indent })
      indent += 2
    }
    
    pathParts.push({ text: '└📄 arquivo.ext', indent: indent })
    
    return pathParts
  }, [settings.organization])

  // Função para organizar arquivos baseado no padrão de nomenclatura
  const organizeFilePath = useCallback((fileName) => {
    console.log(`\n=== ORGANIZANDO ARQUIVO ===`)
    console.log(`Nome do arquivo: ${fileName}`)
    console.log(`Organização ativada: ${settings.organization.enabled}`)
    console.log(`Configurações:`, settings.organization)
    
    if (!settings.organization.enabled) {
      console.log(`Organização desabilitada, retornando nome original: ${fileName}`)
      return fileName // Retorna nome original se organização desabilitada
    }

    // Verificar se o arquivo segue o padrão esperado
    const parts = fileName.split('_')
    if (parts.length < 3) {
      console.log(`Arquivo não segue o padrão esperado, retornando nome original: ${fileName}`)
      return fileName // Retorna nome original se não seguir o padrão
    }

    const defineYear = (directoryPart) => {
      return directoryPart.substring(0, 4);
    }

    const defineMonth = (directoryPart) => {
      return directoryPart.substring(4, 6);
    }

    let product, title, year, month, extension, version, date, versionAndExtension, dateAndExtension

    if (parts.length === 4) {
      // Formato: Cliente_Titulo_AAAAMMDD_vX.extensao
      [product, title, date, versionAndExtension] = parts;
      year = defineYear(date);
      month = defineMonth(date);
      version = versionAndExtension.split(".")[0];
      extension = versionAndExtension.split(".")[1].toUpperCase();

      console.log(`Arquivo ${title}_${version} criado.`);
    } else if (parts.length === 3) {
      // Formato: Cliente_Titulo_AAAAMMDD.extensao
      [product, title, dateAndExtension] = parts;
      year = defineYear(dateAndExtension);
      month = defineMonth(dateAndExtension);
      extension = dateAndExtension.split(".")[1].toUpperCase();

      console.log(`Arquivo ${title} criado.`);
    }

    console.log("----------------------------------------")
    console.log(`${product}`);
    console.log(`└${year}`);
    console.log(` └${month}`);
    console.log(`  └${extension}s`);

    // Construir caminho baseado nas configurações
    const pathParts = []
    
    if (settings.organization.product && product) {
      pathParts.push(product)
    }
    
    if (settings.organization.year && year) {
      pathParts.push(year)
    }
    
    if (settings.organization.month && month) {
      pathParts.push(month)
    }
    
    if (settings.organization.extension && extension) {
      const folderName = `${extension}s`
      pathParts.push(folderName)
    }

    const finalPath = pathParts.join('/')
    const result = finalPath ? `${finalPath}/${fileName}` : fileName
    console.log(`Resultado da organização: ${result}`)
    console.log(`=====================================\n`)
    return result
  }, [settings.organization])

  // Mover arquivos
  const moveFiles = useCallback(async () => {
    if (!settings.destinationFolder) {
      addNotification('Por favor, selecione uma pasta de destino nas configurações.', 'error')
      return
    }

    if (files.length === 0) {
      addNotification('Nenhum arquivo para mover.', 'warning')
      return
    }

    if (isMoving) {
      addNotification('Já há uma operação de movimentação em andamento.', 'warning')
      return
    }

    setIsMoving(true)
    addNotification('Iniciando movimentação de arquivos...', 'info')

    try {
      console.log(`Iniciando movimentação de ${files.length} arquivo(s)`)
      console.log(`Pasta de destino: ${settings.destinationFolder}`)
      console.log(`Organização ativada: ${settings.organization.enabled}`)
      
      const results = await Promise.all(files.map(async (file, index) => {
        console.log(`\n--- Movendo arquivo ${index + 1}/${files.length} ---`)
        console.log(`Nome: ${file.name}`)
        console.log(`Tipo: ${file.path ? 'Sistema' : 'Navegador'}`)
        
        // Organizar caminho do arquivo
        const organizedPath = organizeFilePath(file.name)
        console.log(`Caminho organizado: ${organizedPath}`)
        
        // Verificar se é arquivo do navegador ou do sistema
        if (file.path) {
          // Arquivo do sistema (selecionado via botão)
          console.log(`Chamando moveFile com:`, {
            sourcePath: file.path,
            destinationFolder: settings.destinationFolder,
            organizedPath: organizedPath
          })
          return await window.electronAPI.moveFile(file.path, settings.destinationFolder, organizedPath)
        } else if (file.isBrowserFile && file.data) {
          // Arquivo do navegador (drag and drop)
          console.log(`Chamando moveFileFromBrowser com:`, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData: file.data.substring(0, 50) + '...', // Log apenas uma parte dos dados
            destinationFolder: settings.destinationFolder,
            organizedPath: organizedPath
          })
          return await window.electronAPI.moveFileFromBrowser({
            name: file.name,
            size: file.size,
            type: file.type,
            data: file.data
          }, settings.destinationFolder, organizedPath)
        } else {
          throw new Error('Tipo de arquivo não suportado')
        }
      }))

      console.log(`\n=== Resultados da movimentação ===`)
      console.log(results)
      
      const successCount = results.filter(r => r && r.success).length
      const errorCount = results.filter(r => !r || !r.success).length
      
      console.log(`Sucessos: ${successCount}, Erros: ${errorCount}`)
      
      if (successCount > 0) {
        addNotification(`${successCount} arquivo(s) movido(s) com sucesso!`, 'success')
      }
      
      if (errorCount > 0) {
        addNotification(`${errorCount} arquivo(s) falharam na movimentação.`, 'error')
        // Mostrar detalhes dos erros no console
        results.forEach((result, index) => {
          if (!result || !result.success) {
            console.error(`Erro no arquivo ${index + 1}:`, result?.message || 'Erro desconhecido')
          }
        })
      }
      
      if (successCount === files.length) {
        addNotification('Todos os arquivos foram movidos com sucesso!', 'success')
        setFiles([]) // Limpar lista apenas se todos foram movidos com sucesso
      }

    } catch (error) {
      console.error('Erro geral ao mover arquivos:', error)
      addNotification(`Erro ao mover arquivos: ${error.message}`, 'error')
    } finally {
      setIsMoving(false)
    }
  }, [files, settings.destinationFolder, isMoving, addNotification, organizeFilePath, settings.organization.enabled])

  // Processar movimentação com conflitos
  const processMoveWithConflicts = useCallback(async () => {
    console.log('🔄 Processando conflitos...')
    console.log('🔄 Conflitos:', duplicateConflicts)
    setShowConflictDialog(false)
    setIsMoving(true)
    addNotification('Processando arquivos com conflitos...', 'info')

    try {
      let successCount = 0
      let errorCount = 0
      let skippedCount = 0

      for (const conflict of duplicateConflicts) {
        try {
          let result
          const organizedPath = organizeFilePath(conflict.file.name)
          
          if (conflict.action === 'rename') {
            console.log('🔄 Processando renomeação para arquivo:', conflict.file.name)
            console.log('🔄 Caminho organizado:', organizedPath)
            // Renomear arquivo
            if (conflict.file.path) {
              console.log('🔄 Chamando moveFileWithRename para arquivo do sistema')
              result = await window.electronAPI.moveFileWithRename(
                conflict.file.path, 
                settings.destinationFolder, 
                organizedPath
              )
            } else if (conflict.file.isBrowserFile && conflict.file.data) {
              console.log('🔄 Chamando moveFileFromBrowserWithRename para arquivo do navegador')
              result = await window.electronAPI.moveFileFromBrowserWithRename(
                {
                  name: conflict.file.name,
                  size: conflict.file.size,
                  type: conflict.file.type,
                  data: conflict.file.data
                }, 
                settings.destinationFolder, 
                organizedPath
              )
            } else {
              throw new Error('Tipo de arquivo não suportado para renomeação')
            }
          } else if (conflict.action === 'replace') {
            // Substituir arquivo
            if (conflict.file.path) {
              result = await window.electronAPI.moveFileWithReplace(
                conflict.file.path, 
                settings.destinationFolder, 
                organizedPath
              )
            } else if (conflict.file.isBrowserFile && conflict.file.data) {
              result = await window.electronAPI.moveFileFromBrowserWithReplace(
                {
                  name: conflict.file.name,
                  size: conflict.file.size,
                  type: conflict.file.type,
                  data: conflict.file.data
                }, 
                settings.destinationFolder, 
                organizedPath
              )
            } else {
              throw new Error('Tipo de arquivo não suportado para substituição')
            }
          } else if (conflict.action === 'skip') {
            // Ignorar arquivo
            result = { success: true, skipped: true, message: 'Arquivo ignorado pelo usuário' }
          }

          if (result.success) {
            if (result.skipped) {
              skippedCount++
            } else {
              successCount++
            }
          } else {
            errorCount++
            console.error('Erro ao processar arquivo:', result.message)
          }
        } catch (error) {
          errorCount++
          console.error('Erro ao processar arquivo:', error)
        }
      }

      // Mostrar resultados
      if (successCount > 0) {
        addNotification(`${successCount} arquivo(s) movido(s) com sucesso!`, 'success')
      }
      
      if (skippedCount > 0) {
        addNotification(`${skippedCount} arquivo(s) ignorado(s).`, 'info')
      }
      
      if (errorCount > 0) {
        addNotification(`${errorCount} arquivo(s) falharam na movimentação.`, 'error')
      }

      if (successCount + skippedCount === duplicateConflicts.length) {
        addNotification('Todos os arquivos foram processados!', 'success')
        setFiles([]) // Limpar lista de arquivos
      }

    } catch (error) {
      console.error('Erro ao processar conflitos:', error)
      addNotification('Erro ao processar arquivos com conflitos.', 'error')
    } finally {
      setIsMoving(false)
      setDuplicateConflicts([])
    }
  }, [duplicateConflicts, settings.destinationFolder, addNotification, organizeFilePath])

  // Verificar conflitos de arquivos
  const checkForConflicts = useCallback(async () => {
    if (!settings.destinationFolder) return []

    const conflicts = []
    
    for (const file of files) {
      try {
        const organizedPath = organizeFilePath(file.name)
        const fullPath = `${settings.destinationFolder}/${organizedPath}`
        const exists = await window.electronAPI.checkFileExists(fullPath)
        
        if (exists) {
          console.log(`⚠️ Conflito detectado para: ${file.name}`)
          console.log(`⚠️ Caminho de destino: ${fullPath}`)
          conflicts.push({
            file,
            destinationPath: fullPath,
            action: null // Usuário escolherá
          })
        }
      } catch (error) {
        console.error('Erro ao verificar conflito:', error)
      }
    }
    
    return conflicts
  }, [files, settings.destinationFolder, organizeFilePath])

  // Verificar conflitos antes de mover
  const handleMoveFiles = useCallback(async () => {
    console.log(`Verificando conflitos para ${files.length} arquivo(s)...`)
    
    const conflicts = await checkForConflicts()
    
    for (const conflict of conflicts) {
      console.log(`Verificando conflito para: ${conflict.file.name}`)
      console.log(`Sem conflito: ${conflict.file.name}`)
    }
    
    console.log(`Total de conflitos encontrados: ${conflicts.length}`)
    
    if (conflicts.length > 0) {
      setDuplicateConflicts(conflicts)
      setShowConflictDialog(true)
      addNotification(`${conflicts.length} arquivo(s) com conflitos encontrados`, 'warning')
    } else {
      await moveFiles()
    }
  }, [files, checkForConflicts, moveFiles, addNotification])

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    
    if (droppedFiles.length > 0) {
      try {
        // Converter arquivos do navegador para ArrayBuffer e depois para base64
        const processedFiles = await Promise.all(droppedFiles.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            
            // Converter para base64 de forma segura
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binary)
            
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              isBrowserFile: true,
              data: base64 // Dados do arquivo em base64
            }
          } catch (error) {
            console.error('Erro ao processar arquivo:', file.name, error)
            throw error
          }
        }))
        
        setFiles(prev => [...prev, ...processedFiles])
        addNotification(`${droppedFiles.length} arquivo(s) adicionado(s)`, 'success')
      } catch (error) {
        console.error('Erro ao processar arquivos do drag and drop:', error)
        addNotification('Erro ao processar arquivos arrastados', 'error')
      }
    }
  }, [addNotification])

  // File input handler
  const handleFileSelect = useCallback(async () => {
    console.log('🔍 BOTÃO CLICADO! Iniciando seleção de arquivos...')
    
    try {
      // Verificar se estamos em um ambiente Electron
      if (typeof window === 'undefined') {
        console.error('❌ Window não está disponível')
        throw new Error('Window não está disponível')
      }
      
      if (!window.electronAPI) {
        console.error('❌ electronAPI não está disponível')
        throw new Error('electronAPI não está disponível')
      }
      
      if (!window.electronAPI.selectFiles) {
        console.error('❌ selectFiles não está disponível na electronAPI')
        throw new Error('selectFiles não está disponível na electronAPI')
      }
      
      console.log('✅ Todas as verificações passaram, chamando selectFiles...')
      const selectedFiles = await window.electronAPI.selectFiles()
      console.log('📁 Arquivos selecionados:', selectedFiles)
      
      if (selectedFiles && selectedFiles.length > 0) {
        console.log(`➕ Adicionando ${selectedFiles.length} arquivo(s) à lista`)
        setFiles(prev => {
          const newFiles = [...prev, ...selectedFiles]
          console.log(`📊 Total de arquivos na lista: ${newFiles.length}`)
          return newFiles
        })
        addNotification(`${selectedFiles.length} arquivo(s) adicionado(s)`, 'success')
      } else {
        console.log('ℹ️ Nenhum arquivo selecionado')
        addNotification('Nenhum arquivo foi selecionado', 'info')
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar arquivos:', error)
      addNotification(`Erro ao selecionar arquivos: ${error.message}`, 'error')
    }
  }, [addNotification])

  // Folder selection handler
  const handleFolderSelect = useCallback(async () => {
    try {
      const selectedFolder = await window.electronAPI.selectFolder()
      if (selectedFolder) {
        setSettings(prev => ({ ...prev, destinationFolder: selectedFolder }))
        addNotification(`Pasta de destino selecionada: ${selectedFolder}`, 'success')
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error)
      addNotification('Erro ao selecionar pasta', 'error')
    }
  }, [addNotification])

  // Toggle always on top
  const toggleAlwaysOnTop = useCallback(async () => {
    try {
      const newValue = !settings.alwaysOnTop
      await window.electronAPI.setAlwaysOnTop(newValue)
      setSettings(prev => ({ ...prev, alwaysOnTop: newValue }))
      addNotification(`Janela sempre no topo ${newValue ? 'ativada' : 'desativada'}`, 'success')
    } catch (error) {
      console.error('Erro ao alterar sempre no topo:', error)
    }
  }, [settings.alwaysOnTop, addNotification])

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-drag-region">
          <div className="titlebar-title">DirectorsCut</div>
        </div>
        <div className="titlebar-controls">
          <button 
            className={`titlebar-button pin ${settings.alwaysOnTop ? 'active' : ''}`}
            onClick={toggleAlwaysOnTop}
            title="Janela Sempre no Topo"
          >
            ⊙
          </button>
          <button 
            className="titlebar-button settings"
            onClick={() => setCurrentPage(currentPage === 'main' ? 'settings' : 'main')}
            title="Configurações"
          >
            ⚙
          </button>
          <button 
            className="titlebar-button minimize"
            onClick={() => window.electronAPI?.minimizeWindow()}
            title="Minimizar"
          >
            −
          </button>
          <button 
            className="titlebar-button maximize"
            onClick={() => window.electronAPI?.maximizeWindow()}
            title="Maximizar"
          >
            □
          </button>
          <button 
            className="titlebar-button close"
            onClick={() => window.electronAPI?.closeWindow()}
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      {/* App Content */}
      <div className="app-content">

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              data-notification-id={notification.id}
              className={`notification ${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {currentPage === 'main' ? (
        <div className="main-content">
          {/* Drop Zone */}
          <div 
            className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-content">
              <div className="drop-icon">📁</div>
              <h2>Arraste arquivos aqui</h2>
              <p>ou</p>
              <button 
                className="select-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileSelect()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isMoving}
              >
                Selecionar Arquivos
              </button>
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="files-section">
              <h3>Arquivos Selecionados ({files.length})</h3>
              <div className="files-grid">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">
                        {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="actions">
                <button 
                  className="move-btn"
                  onClick={handleMoveFiles}
                  disabled={isMoving || !settings.destinationFolder}
                >
                  {isMoving ? 'Movendo...' : 'Mover para Pasta de Destino'}
                </button>
                <button 
                  className="clear-btn"
                  onClick={() => setFiles([])}
                  disabled={isMoving}
                >
                  Limpar Lista
                </button>
              </div>
            </div>
          )}

          {/* Destination Folder Info */}
          {settings.destinationFolder && (
            <div className="destination-info">
              <h4>Pasta de Destino:</h4>
              <p>{settings.destinationFolder}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="settings-content">
          <h2>Configurações</h2>
          
          {/* Destination Folder */}
          <div className="setting-item">
            <label className="setting-label">Pasta de Destino</label>
            <div className="setting-control">
              <button 
                className="select-folder-btn"
                onClick={handleFolderSelect}
              >
                Selecionar Pasta
              </button>
            </div>
            {settings.destinationFolder && (
              <p className="setting-description">
                {settings.destinationFolder}
              </p>
            )}
          </div>

          {/* Always On Top */}
          <div className="setting-item">
            <label className="setting-label">Janela Sempre no Topo</label>
            <div className="setting-control">
              <button 
                className={`toggle-btn ${settings.alwaysOnTop ? 'active' : ''}`}
                onClick={toggleAlwaysOnTop}
              >
                {settings.alwaysOnTop ? '✓ Ativado' : '✗ Desativado'}
              </button>
            </div>
            <p className="setting-description">
              Mantém a janela sempre visível sobre outras aplicações
            </p>
          </div>

          {/* File Organization */}
          <div className="setting-item">
            <label className="setting-label">Organização de arquivos</label>
            <div className="setting-control">
              <button 
                className={`toggle-btn ${settings.organization.enabled ? 'active' : ''}`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  organization: { ...prev.organization, enabled: !prev.organization.enabled }
                }))}
              >
                {settings.organization.enabled ? '✓ Ativado' : '✗ Desativado'}
              </button>
            </div>
            <p className="setting-description">
              Organiza automaticamente os arquivos baseado no padrão de nomenclatura
            </p>
            
            {settings.organization.enabled && (
              <div className="organization-guide">
                <h4>📋 Padrão de Nomenclatura</h4>
                <div className="naming-examples">
                  <div className="example-item">
                    <strong>Formato com versão:</strong>
                    <code>Cliente_Titulo_AAAAMMDD_vX.extensao</code>
                    <span className="example">Ex: PCS_TrafegoPago_20250906_v1.png</span>
                  </div>
                  <div className="example-item">
                    <strong>Formato simples:</strong>
                    <code>Cliente_Titulo_AAAAMMDD.extensao</code>
                    <span className="example">Ex: PCS_TrafegoPago_20250906.psd</span>
                  </div>
                </div>
                <div className="organization-structure">
                  <strong>Estrutura criada:</strong>
                  <div className="folder-tree">
                    {generateFolderStructure().map((item, index) => (
                      <div key={index} style={{ paddingLeft: `${item.indent}px` }}>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {settings.organization.enabled && (
              <div className="organization-options">
                <div className="organization-row">
                  <button 
                    className={`toggle-btn small ${settings.organization.product ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      organization: { ...prev.organization, product: !prev.organization.product }
                    }))}
                  >
                    {settings.organization.product ? '✓' : '✗'} Cliente/Produto
                  </button>
                  <button 
                    className={`toggle-btn small ${settings.organization.year ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      organization: { ...prev.organization, year: !prev.organization.year }
                    }))}
                  >
                    {settings.organization.year ? '✓' : '✗'} Ano
                  </button>
                </div>
                <div className="organization-row">
                  <button 
                    className={`toggle-btn small ${settings.organization.month ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      organization: { ...prev.organization, month: !prev.organization.month }
                    }))}
                  >
                    {settings.organization.month ? '✓' : '✗'} Mês
                  </button>
                  <button 
                    className={`toggle-btn small ${settings.organization.extension ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      organization: { ...prev.organization, extension: !prev.organization.extension }
                    }))}
                  >
                    {settings.organization.extension ? '✓' : '✗'} Extensão
                  </button>
                </div>
                <div className="current-folder">
                  <span>Exemplo: {settings.destinationFolder ? `${settings.destinationFolder}/` : ''}Cliente/Ano/Mês/Extensão/arquivo.ext</span>
                </div>
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="settings-actions">
            <button 
              className="back-btn"
              onClick={() => setCurrentPage('main')}
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* Conflict Dialog */}
      {showConflictDialog && (
        <div className="conflict-dialog-overlay">
          <div className="conflict-dialog">
            <h3>Conflitos de Arquivos</h3>
            <p>Os seguintes arquivos já existem na pasta de destino:</p>
            
            <div className="conflict-list">
              {duplicateConflicts.map((conflict, index) => (
                <div key={index} className="conflict-item">
                  <div className="conflict-file">
                    <strong>{conflict.file.name}</strong>
                    <span>Já existe em: {conflict.destinationPath}</span>
                  </div>
                  <div className="conflict-actions">
                    <button 
                      className={`conflict-btn ${conflict.action === 'rename' ? 'selected' : ''}`}
                      onClick={() => {
                        console.log('🔄 Botão Renomear clicado para arquivo:', conflict.file.name)
                        setDuplicateConflicts(prev => 
                          prev.map((c, i) => i === index ? { ...c, action: 'rename' } : c)
                        )
                      }}
                    >
                      Renomear
                    </button>
                    <button 
                      className={`conflict-btn ${conflict.action === 'replace' ? 'selected' : ''}`}
                      onClick={() => {
                        setDuplicateConflicts(prev => 
                          prev.map((c, i) => i === index ? { ...c, action: 'replace' } : c)
                        )
                      }}
                    >
                      Substituir
                    </button>
                    <button 
                      className={`conflict-btn ${conflict.action === 'skip' ? 'selected' : ''}`}
                      onClick={() => {
                        setDuplicateConflicts(prev => 
                          prev.map((c, i) => i === index ? { ...c, action: 'skip' } : c)
                        )
                      }}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="conflict-dialog-actions">
              <button 
                className="conflict-cancel-btn"
                onClick={() => setShowConflictDialog(false)}
              >
                Cancelar
              </button>
              <button 
                className="conflict-continue-btn"
                onClick={processMoveWithConflicts}
                disabled={duplicateConflicts.some(c => !c.action)}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default App