# DirectorsCut

**Organizador de Arquivos Inteligente**

DirectorsCut é uma aplicação desktop desenvolvida com Electron e React que facilita a organização automática de arquivos baseada em padrões de nomenclatura inteligentes.

## 🚀 Características Principais

- **Interface Intuitiva**: Design moderno e responsivo com drag-and-drop
- **Organização Automática**: Sistema inteligente de organização baseado em padrões de nomenclatura
- **Multiplataforma**: Compatível com Windows, macOS e Linux
- **Sempre no Topo**: Opção para manter a janela sempre visível
- **Sistema de Notificações**: Feedback visual para todas as operações
- **Resolução de Conflitos**: Gerenciamento inteligente de arquivos duplicados

## 📋 Funcionalidades

### Organização de Arquivos
- **Padrão de Nomenclatura**: Suporte para formatos como `Cliente_Titulo_AAAAMMDD_vX.extensao`
- **Estrutura Hierárquica**: Organização automática por Cliente → Ano → Mês → Tipo de Arquivo
- **Configuração Flexível**: Ative/desative cada nível de organização conforme necessário

### Gerenciamento de Arquivos
- **Drag & Drop**: Arraste arquivos diretamente para a aplicação
- **Seleção Múltipla**: Selecione vários arquivos de uma vez
- **Resolução de Conflitos**: Opções para renomear, substituir ou ignorar arquivos duplicados
- **Suporte a Múltiplos Formatos**: Imagens, vídeos, áudios, documentos e mais

### Interface e Usabilidade
- **Janela Sempre no Topo**: Mantém a aplicação sempre visível
- **Sistema de Tray**: Acesso rápido através da bandeja do sistema
- **Configurações Persistentes**: Salva suas preferências automaticamente
- **Notificações em Tempo Real**: Acompanhe o progresso das operações

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19.1.1
- **Desktop**: Electron 38.0.0
- **Build**: Vite 7.1.2
- **Empacotamento**: Electron Builder
- **Linting**: ESLint

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação Local
```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]
cd DirectorsCut

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run start
```

### Scripts Disponíveis
```bash
# Desenvolvimento
npm run dev          # Inicia servidor Vite
npm run start        # Inicia aplicação Electron em modo dev

# Build
npm run build        # Constrói aplicação React
npm run electron-pack # Empacota aplicação para distribuição

# Utilitários
npm run lint         # Executa ESLint
npm run preview      # Preview da build
```

## 🎯 Como Usar

### 1. Configuração Inicial
1. Abra a aplicação
2. Clique no ícone de configurações (⚙)
3. Selecione a pasta de destino para os arquivos
4. Configure as opções de organização conforme necessário

### 2. Adicionando Arquivos
- **Drag & Drop**: Arraste arquivos diretamente para a área de drop
- **Seleção Manual**: Clique em "Selecionar Arquivos" para escolher via diálogo

### 3. Organização Automática
A aplicação reconhece automaticamente arquivos que seguem o padrão:
- `Cliente_Titulo_AAAAMMDD_vX.extensao` (com versão)
- `Cliente_Titulo_AAAAMMDD.extensao` (sem versão)

### 4. Estrutura Criada
```
Pasta de Destino/
├── Cliente/
│   └── 2024/
│       └── 09/
│           └── PNGs/
│               └── Cliente_Titulo_20240906_v1.png
```

## ⚙️ Configurações

### Organização de Arquivos
- **Cliente/Produto**: Organiza por nome do cliente
- **Ano**: Organiza por ano (extraído da data)
- **Mês**: Organiza por mês (extraído da data)
- **Extensão**: Organiza por tipo de arquivo

### Comportamento da Janela
- **Sempre no Topo**: Mantém a janela sempre visível
- **Posicionamento**: Aparece no canto superior direito da tela

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
DirectorsCut/
├── electron/           # Código do Electron
│   ├── main.js        # Processo principal
│   ├── preload.js     # Bridge de segurança
│   └── handlers/      # Handlers IPC
├── src/               # Código React
│   ├── App.jsx        # Componente principal
│   ├── components/    # Componentes React
│   └── services/      # Serviços
├── public/            # Recursos estáticos
└── dist/              # Build de produção
```

### Handlers IPC Principais
- `select-files`: Seleção de arquivos
- `move-file`: Movimentação de arquivos
- `select-folder`: Seleção de pasta
- `window-*`: Controles da janela
- `*-settings`: Gerenciamento de configurações

## 📱 Compatibilidade

- **Windows**: Windows 10/11
- **macOS**: macOS 10.14+
- **Linux**: Ubuntu 18.04+, Debian 9+, Fedora 30+

## 🚀 Distribuição

A aplicação é empacotada usando Electron Builder com suporte para:
- **Windows**: Instalador NSIS
- **macOS**: DMG
- **Linux**: AppImage

## 📄 Licença

Este projeto está sob licença [ESPECIFICAR_LICENCA].

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através de [EMAIL/CONTATO].

---

**DirectorsCut** - Organize seus arquivos de forma inteligente e eficiente.
