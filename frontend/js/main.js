const theme = {
    init() {
        this.toggle = document.getElementById('theme-toggle');
        this.body = document.body;
        
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Configurar evento de toggle
        this.toggle.addEventListener('click', () => {
            const newTheme = this.body.dataset.theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    },
    
    setTheme(theme) {
        this.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        this.toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        
        // Atualizar cor da barra de status mobile
        document.querySelector('meta[name="theme-color"]').content = 
            theme === 'dark' ? '#1a1a1a' : '#4CAF50';
    }
};

let ws = null;
let salaAtual = null;
let ehHost = false;
let reconnectTimeout = null;
let timerVotacao = null;

// Sistema de notificações
const toast = {
    container: null,
    
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    
    show(message, type = 'info', duration = 3000) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;
        
        // Adicionar ao container
        this.container.appendChild(toast);
        
        // Configurar botão de fechar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => this.dismiss(toast);
        
        // Auto-dismiss após duração
        setTimeout(() => this.dismiss(toast), duration);
        
        return toast;
    },
    
    dismiss(toast) {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    },
    
    success(message) {
        return this.show(message, 'success');
    },
    
    error(message) {
        return this.show(message, 'error');
    },
    
    info(message) {
        return this.show(message, 'info');
    },
    
    warning(message) {
        return this.show(message, 'warning');
    }
};

function updateConnectionStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const reconnectButton = document.getElementById('reconnect-button');

    switch(status) {
        case 'connected':
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
            reconnectButton.classList.add('hidden');
            break;
        case 'disconnected':
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Desconectado';
            reconnectButton.classList.remove('hidden');
            break;
        case 'connecting':
            statusDot.className = 'status-dot';
            statusText.textContent = 'Conectando...';
            reconnectButton.classList.add('hidden');
            break;
    }
}

function conectarWebSocket() {
    updateConnectionStatus('connecting');
    ws = new WebSocket('ws://192.168.11.3:8765');
    
    ws.onopen = () => {
        console.log('Conectado ao servidor');
        updateConnectionStatus('connected');
        clearTimeout(reconnectTimeout);
    };
    
    ws.onmessage = (evento) => {
        const dados = JSON.parse(evento.data);
        tratarMensagem(dados);
    };
    
    ws.onclose = () => {
        console.log('Desconectado do servidor');
        updateConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(conectarWebSocket, 3000);
    };

    ws.onerror = (erro) => {
        console.error('Erro WebSocket:', erro);
    };
}

function tratarMensagem(dados) {
    console.log('Mensagem recebida:', dados);
    
    switch(dados.tipo) {
        case 'sala_criada':
            salaAtual = dados.codigo;
            ehHost = dados.eh_host;
            document.getElementById('codigo-sala-display').textContent = salaAtual;
            document.getElementById('iniciar-jogo').style.display = ehHost ? 'block' : 'none';
            mostrarTela('lobby');
            toast.success('Sala criada com sucesso!');
            break;
            
        case 'jogador_entrou':
            atualizarListaJogadores(dados.jogadores);
            const novoJogador = dados.jogadores[dados.jogadores.length - 1];
            toast.info(`${novoJogador} entrou na sala`);
            break;
            
        case 'jogador_saiu':
            atualizarListaJogadores(dados.jogadores);
            toast.warning('Um jogador saiu da sala');
            break;
            
        case 'erro':
            toast.error(dados.mensagem);
            break;
            
        case 'iniciar_rodada':
            document.getElementById('numero-rodada').textContent = dados.rodada + 1;
            document.getElementById('pergunta-atual').textContent = dados.pergunta;
            document.getElementById('resposta').value = '';
            document.getElementById('resposta').disabled = false;
            document.getElementById('tempo-restante').textContent = '60 segundos restantes';
            mostrarTela('tela-pergunta');
            iniciarContadorTempo();
            break;
            
        case 'iniciar_votacao':
            document.getElementById('pergunta-votacao').textContent = dados.pergunta;
            mostrarRespostasParaVotacao(dados.respostas);
            mostrarTela('tela-votacao');
            iniciarTimerVotacao();
            break;
            
        case 'resultado_rodada':
            mostrarResultadosRodada(dados.pontuacoes, dados.votos);
            mostrarTela('tela-resultado');
            if (ehHost) {
                const btnProxima = document.createElement('button');
                btnProxima.textContent = 'Próxima Rodada';
                btnProxima.onclick = () => {
                    document.getElementById('proxima-rodada').innerHTML = '';
                };
                document.getElementById('proxima-rodada').appendChild(btnProxima);
            }
            break;
            
        case 'fim_jogo':
            mostrarResultadosFinais(dados.vencedor, dados.pontuacoes_finais);
            mostrarTela('tela-fim-jogo');
            break;
            
        case 'revelar_respostas':
            clearInterval(timerVotacao);
            mostrarRespostasReveladas(dados.respostas, dados.votos);
            break;
    }
}

function criarSala() {
    const container = document.querySelector('.botoes');
    const spinner = showLoading(container);
    
    try {
        const nomeInput = document.getElementById('nome-jogador');
        const nome = nomeInput.value.trim();
        if (!nome) {
            mostrarErro(nomeInput);
            return;
        }
        
        salvarNome(nome);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                tipo: 'criar_sala',
                nome: nome
            }));
        }
    } finally {
        hideLoading(spinner);
    }
}

function entrarSala() {
    const container = document.querySelector('.entrar-sala');
    const spinner = showLoading(container);
    
    try {
        const nomeInput = document.getElementById('nome-jogador');
        const codigoInput = document.getElementById('codigo-sala');
        const nome = nomeInput.value.trim();
        const codigo = codigoInput.value.trim();
        
        if (!nome) {
            mostrarErro(nomeInput);
            return;
        }
        if (!codigo) {
            mostrarErro(codigoInput);
            return;
        }
        
        salvarNome(nome);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                tipo: 'entrar_sala',
                nome: nome,
                codigo: codigo
            }));
        }
    } finally {
        hideLoading(spinner);
    }
}

function atualizarListaJogadores(jogadores) {
    const lista = document.getElementById('lista-jogadores');
    lista.innerHTML = '<h3>Jogadores:</h3>';
    const ul = document.createElement('ul');
    jogadores.forEach(nome => {
        const li = document.createElement('li');
        li.textContent = nome;
        ul.appendChild(li);
    });
    lista.appendChild(ul);
}

function enviarResposta() {
    const resposta = document.getElementById('resposta').value.trim();
    if (!resposta) {
        toast.warning('Por favor, digite uma resposta!');
        return;
    }
    
    ws.send(JSON.stringify({
        tipo: 'enviar_resposta',
        codigo: salaAtual,
        resposta: resposta
    }));
    
    document.getElementById('resposta').value = '';
    document.getElementById('resposta').disabled = true;
}

function mostrarRespostasParaVotacao(respostas) {
    const container = document.getElementById('respostas-votacao');
    container.innerHTML = '';
    
    const respostasValidas = respostas.filter(r => r !== '...');
    const respostasEmbaralhadas = respostasValidas.sort(() => Math.random() - 0.5);
    
    respostasEmbaralhadas.forEach((resposta, index) => {
        const btn = document.createElement('button');
        btn.className = 'resposta-votacao';
        btn.textContent = resposta;
        btn.onclick = () => votar(resposta);
        container.appendChild(btn);
    });
}

function votar(resposta) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            tipo: 'votar',
            codigo: salaAtual,
            resposta: resposta
        }));
        
        const botoes = document.querySelectorAll('#respostas-votacao button');
        botoes.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        clearInterval(timerVotacao);
    }
}

function mostrarResultadosRodada(pontuacoes, votos) {
    const container = document.getElementById('pontuacoes');
    container.innerHTML = '<h3>Resultados da Rodada:</h3>';
    
    const votosContainer = document.createElement('div');
    votosContainer.innerHTML = '<h4>Votos:</h4>';
    Object.entries(votos).forEach(([resposta, numVotos]) => {
        const votoDiv = document.createElement('div');
        votoDiv.className = 'pontos-animados';
        votoDiv.innerHTML = `<p>"${resposta}": ${numVotos} voto${numVotos !== 1 ? 's' : ''}</p>`;
        votosContainer.appendChild(votoDiv);
    });
    container.appendChild(votosContainer);
    
    const pontuacoesContainer = document.createElement('div');
    pontuacoesContainer.innerHTML = '<h4>Pontuação:</h4>';
    Object.entries(pontuacoes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([jogador, pontos], index) => {
            const pontuacaoDiv = document.createElement('div');
            pontuacaoDiv.className = 'pontos-animados';
            pontuacaoDiv.style.animationDelay = `${index * 0.1}s`;
            pontuacaoDiv.innerHTML = `<p>${jogador}: ${pontos} pontos</p>`;
            pontuacoesContainer.appendChild(pontuacaoDiv);
        });
    container.appendChild(pontuacoesContainer);
}

function mostrarResultadosFinais(vencedor, pontuacoes) {
    document.getElementById('vencedor').innerHTML = `<h3>🎉 ${vencedor} venceu! 🎉</h3>`;
    
    const container = document.getElementById('pontuacoes-finais');
    container.innerHTML = '<h3>Pontuação Final:</h3>';
    
    Object.entries(pontuacoes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([jogador, pontos]) => {
            container.innerHTML += `<p>${jogador}: ${pontos} pontos</p>`;
        });
}

function mostrarTela(id) {
    // Remover classe active de todas as telas
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('active');
        // Aguardar a transição terminar antes de esconder
        setTimeout(() => {
            if (!tela.classList.contains('active')) {
                tela.style.display = 'none';
            }
        }, 500);
    });
    
    // Mostrar e ativar a nova tela
    const telaNova = document.getElementById(id);
    telaNova.style.display = 'block';
    
    // Forçar um reflow antes de adicionar a classe active
    telaNova.offsetHeight;
    telaNova.classList.add('active');
}

function voltarAoLobby() {
    window.location.reload();
}

let tempoRestante = 60;
let temporizador = null;

function iniciarContadorTempo() {
    clearInterval(temporizador);
    tempoRestante = 60;
    
    temporizador = setInterval(() => {
        tempoRestante--;
        document.getElementById('tempo-restante').textContent = 
            `${tempoRestante} segundos restantes`;
        
        if (tempoRestante <= 0) {
            clearInterval(temporizador);
            enviarRespostaAutomatica();
        }
    }, 1000);
}

function enviarRespostaAutomatica() {
    const resposta = document.getElementById('resposta').value.trim();
    if (!resposta) {
        ws.send(JSON.stringify({
            tipo: 'enviar_resposta',
            codigo: salaAtual,
            resposta: '...'
        }));
    } else if (!document.getElementById('resposta').disabled) {
        enviarResposta();
    }
}

document.getElementById('iniciar-jogo').addEventListener('click', function() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            tipo: 'iniciar_jogo',
            codigo: salaAtual
        }));
    }
});

window.addEventListener('load', conectarWebSocket);

function copiarCodigoSala() {
    const codigo = document.getElementById('codigo-sala-display').textContent;
    navigator.clipboard.writeText(codigo)
        .then(() => toast.success('Código copiado!'))
        .catch(() => toast.error('Erro ao copiar código'));
}

function salvarNome(nome) {
    localStorage.setItem('playerName', nome);
}

function carregarNome() {
    return localStorage.getItem('playerName') || '';
}

document.addEventListener('DOMContentLoaded', () => {
    const nomeInput = document.getElementById('nome-jogador');
    nomeInput.value = carregarNome();
    
    document.getElementById('copiar-codigo').addEventListener('click', copiarCodigoSala);
    
    document.getElementById('reconnect-button').addEventListener('click', () => {
        clearTimeout(reconnectTimeout);
        conectarWebSocket();
    });
    
    theme.init();
    toast.init();
});

function mostrarRespostasReveladas(respostas, votos) {
    const container = document.getElementById('respostas-votacao');
    container.innerHTML = '<h3>Respostas Reveladas:</h3>';
    
    Object.entries(respostas)
        .sort(([resposta, _]) => -votos[resposta])
        .forEach(([resposta, autor]) => {
            const respostaDiv = document.createElement('div');
            respostaDiv.className = 'resposta-revelada';
            const numVotos = votos[resposta] || 0;
            
            respostaDiv.innerHTML = `
                <p class="resposta-texto">"${resposta}"</p>
                <p class="resposta-autor">por ${autor}</p>
                <p class="resposta-votos">${numVotos} voto${numVotos !== 1 ? 's' : ''}</p>
            `;
            
            container.appendChild(respostaDiv);
        });
}

function mostrarErro(elemento) {
    elemento.classList.add('shake');
    elemento.addEventListener('animationend', () => {
        elemento.classList.remove('shake');
    }, { once: true });
}

function mostrarErro(elemento) {
    elemento.classList.add('shake');
    elemento.addEventListener('animationend', () => {
        elemento.classList.remove('shake');
    }, { once: true });
}

function iniciarTimerVotacao() {
    clearInterval(timerVotacao);
    let tempo = 60;
    
    const timerElement = document.createElement('div');
    timerElement.id = 'timer-votacao';
    timerElement.className = 'timer-votacao';
    document.getElementById('tela-votacao').insertBefore(
        timerElement,
        document.getElementById('respostas-votacao')
    );
    
    function atualizarTimer() {
        timerElement.textContent = `${tempo} segundos para votar`;
        if (tempo <= 10) {
            timerElement.classList.add('acabando');
        }
        tempo--;
        
        if (tempo < 0) {
            clearInterval(timerVotacao);
            const botoes = document.querySelectorAll('#respostas-votacao button');
            botoes.forEach(btn => {
                btn.disabled = true;
                btn.classList.add('disabled');
            });
        }
    }
    
    atualizarTimer();
    timerVotacao = setInterval(atualizarTimer, 1000);
}

function showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    container.appendChild(spinner);
    return spinner;
}

function hideLoading(spinner) {
    spinner.remove();
} 