# Roadmap: Recriando o Quiplash com HTML, CSS, JS, Python e WebSockets

## Visão Geral
Este roadmap descreve o plano para recriar o jogo "Quiplash" usando HTML, CSS, JavaScript para o front-end, Python no back-end, e WebSockets para comunicação em tempo real. 

---

## Estrutura do Projeto

### Front-End
- **HTML**: Estrutura básica das páginas (lobby, jogo, pontuação, etc.).
- **CSS**: Estilização para tornar o jogo visualmente atraente.
- **JavaScript**: Interatividade no cliente e comunicação via WebSockets.

### Back-End
- **Python**: Lógica do jogo e gerenciamento dos jogadores.
- **WebSockets**: Comunicação em tempo real entre o servidor e os jogadores.

### Fluxo de Jogo
1. **Lobby**:
   - Jogadores entram com um código de sala.
   - Host inicia o jogo.
2. **Rodadas**:
   - Os jogadores recebem perguntas/palpites.
   - Respostas são enviadas ao servidor e apresentadas para votação.
3. **Votação**:
   - Jogadores votam nas respostas mais engraçadas.
   - Pontuação é atribuída com base nos votos.
4. **Finalização**:
   - Exibe o vencedor e os melhores momentos.

---

## Etapas do Desenvolvimento

### 1. Configuração Inicial
- [ ] Configurar ambiente de desenvolvimento (Python, WebSockets, etc.).
- [ ] Criar estrutura básica do projeto (pastas para front-end e back-end).

### 2. Back-End (Python)
- [ ] Configurar servidor WebSocket.
- [ ] Gerenciar conexões (entrar/sair de jogadores).
- [ ] Implementar lógica do lobby (criação de salas e controle do host).
- [ ] Implementar lógica das rodadas (envio de perguntas e recebimento de respostas).
- [ ] Gerenciar votação e cálculo de pontuação.

### 3. Front-End
- [ ] Criar páginas básicas (lobby, jogo, votação, resultados).
- [ ] Implementar comunicação via WebSockets.
- [ ] Estilizar com CSS para uma interface atraente.

### 4. Integração
- [ ] Conectar o front-end ao back-end via WebSockets.
- [ ] Testar fluxos de jogo completos (lobby até finalização).

### 5. Polimento
- [ ] Adicionar animações e transições para melhorar a experiência do usuário.
- [ ] Criar uma tela de instruções/tutoriais.
- [ ] Implementar mensagens de erro e validações.

### 6. Testes
- [ ] Testar com grupos de jogadores para garantir a estabilidade.
- [ ] Corrigir bugs e ajustar o balanceamento do jogo.

---

## Ferramentas e Tecnologias
- **Front-End**: HTML5, CSS3, JavaScript (ES6+).
- **Back-End**: Python (usando biblioteca `websockets`).
- **Outras Ferramentas**:
  - Editor de código: VS Code, PyCharm, ou similar.
  - Controle de versão: Git/GitHub.

---

## Timeline
- **Semana 1**: Configuração do ambiente e estrutura do projeto.
- **Semana 2**: Desenvolvimento do back-end (lobby e lógica básica).
- **Semana 3**: Desenvolvimento do front-end e integração inicial.
- **Semana 4**: Polimento, testes e correções.

---

## Futuras Melhorias
- Adicionar suporte para diferentes idiomas.
- Implementar armazenamento persistente de pontuações (ranking).
- Adicionar novos modos de jogo ou perguntas personalizadas.

---

## Referências
- [Documentação do WebSockets em Python](https://websockets.readthedocs.io/)
- [MDN Web Docs - HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN Web Docs - CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

