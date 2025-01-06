# Quiplash Clone 🎉

Este é um clone do popular jogo de festa Quiplash, onde os jogadores respondem a perguntas engraçadas e votam nas melhores respostas. Ideal para jogar com amigos e familiares!

## 📋 Funcionalidades

- **Multijogador**: Suporte para até 8 jogadores por sala.
- **Rodadas**: 3 rodadas por jogo com perguntas aleatórias.
- **Votação**: Sistema de votação para escolher as melhores respostas.
- **Pontuação**: Pontos são atribuídos com base nos votos recebidos.
- **Interface de TV**: Modo TV para exibição em telas grandes.
- **Tema Claro/Escuro**: Alternância entre temas para melhor experiência visual.
- **Notificações**: Sistema de notificações toast para eventos do jogo.
- **Responsividade**: Interface adaptada para dispositivos móveis e desktops.
- **Reconexão Automática**: Reconexão automática em caso de perda de conexão.

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python com WebSockets (biblioteca `websockets`).
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
- **Comunicação**: WebSocket para comunicação em tempo real.

## 📦 Estrutura do Projeto

- `backend/`: Contém o servidor WebSocket e as perguntas do jogo.
  - `server.py`: Servidor principal que gerencia as salas e a lógica do jogo.
  - `perguntas.py`: Lista de perguntas usadas no jogo.
  - `requirements.txt`: Dependências do Python.

- `frontend/`: Contém os arquivos do cliente.
  - `index.html`: Página principal do jogo para os jogadores.
  - `tv.html`: Interface de TV para exibição em telas grandes.
  - `css/style.css`: Estilos para a interface do usuário.
  - `js/main.js`: Lógica do cliente para os jogadores.
  - `js/tv.js`: Lógica do cliente para a interface de TV.

## 🚀 Como Rodar

### Pré-requisitos

- Python 3.7 ou superior.
- Navegador moderno com suporte a WebSocket.

### Passos para Execução

1. **Instalar Dependências**

   Navegue até o diretório `backend` e instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

2. **Iniciar o Servidor**

   Execute o servidor WebSocket:

   ```bash
   python server.py
   ```

3. **Acessar o Jogo**

   - Abra `frontend/index.html` em um navegador para os jogadores.
   - Para o modo TV, abra `frontend/tv.html`.

4. **Configurar IP do Servidor (se necessário)**

   - Edite a URL do WebSocket em:
     - `frontend/js/main.js`
     - `frontend/js/tv.js`

## 🎮 Como Jogar

1. **Criar ou Entrar em uma Sala**
   - Um jogador cria uma sala e recebe um código.
   - Outros jogadores usam o código para entrar na sala.
   - O criador da sala é o host.

2. **Modo TV (Opcional)**
   - Abra `tv.html` e insira o código da sala.
   - Ideal para exibir em uma TV ou projetor.

3. **Gameplay**
   - Cada jogador responde a uma pergunta.
   - 60 segundos para responder.
   - Todos votam nas melhores respostas.
   - Pontos são distribuídos com base nos votos.
   - Vence quem tiver mais pontos após 3 rodadas.

## 🎨 Personalização

### Perguntas
- Edite `backend/perguntas.py` para adicionar ou modificar perguntas.

### Temas
- Suporte a tema claro/escuro.
- Cores personalizáveis via CSS variables.

## 🤝 Contribuindo

Sinta-se à vontade para:
- Reportar bugs.
- Sugerir novas funcionalidades.
- Enviar pull requests.

## 📱 Compatibilidade

- **Desktop**: Chrome, Firefox, Safari, Edge.
- **Mobile**: Android e iOS.
- Suporte a orientação paisagem e retrato.

## 📅 Roadmap

Confira o `roadmap.md` para ver os planos futuros e melhorias para o projeto.

---

Divirta-se jogando e sinta-se à vontade para contribuir com melhorias! "# quiplash-clone" 
"# quiplash-clone" 
