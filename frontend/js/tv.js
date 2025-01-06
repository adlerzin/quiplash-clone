let ws = null;
let salaAtual = null;
let timerInterval = null;

class SoundManager {
    constructor() {
        this.sounds = {
            countdown: new Audio('sounds/countdown.mp3'),
            reveal: new Audio('sounds/reveal.mp3'),
            vote: new Audio('sounds/vote.mp3'),
            results: new Audio('sounds/results.mp3'),
            winner: new Audio('sounds/winner.mp3'),
            tick: new Audio('sounds/tick.mp3')
        };
        
        // Remover loop automático
        this.sounds.countdown.loop = false;
        
        // Pré-carregar os sons
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });

        // Controle de timeout para os sons
        this.timeouts = {};
    }

    playWithDelay(soundName, delay = 1000) {
        // Limpar timeout anterior se existir
        if (this.timeouts[soundName]) {
            clearTimeout(this.timeouts[soundName]);
        }

        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Erro ao tocar som:', e));

            // Configurar próxima reprodução
            this.timeouts[soundName] = setTimeout(() => {
                this.playWithDelay(soundName, delay);
            }, delay);
        }
    }

    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
        // Limpar timeout se existir
        if (this.timeouts[soundName]) {
            clearTimeout(this.timeouts[soundName]);
            delete this.timeouts[soundName];
        }
    }

    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        // Limpar todos os timeouts
        Object.keys(this.timeouts).forEach(key => {
            clearTimeout(this.timeouts[key]);
            delete this.timeouts[key];
        });
    }
}

// Criar instância global
const soundManager = new SoundManager();

function conectarWebSocket() {
    ws = new WebSocket('ws://192.168.11.3:8765');
    
    ws.onopen = () => {
        console.log('TV conectada ao servidor');
    };
    
    ws.onmessage = (evento) => {
        const dados = JSON.parse(evento.data);
        tratarMensagemTV(dados);
    };
    
    ws.onclose = () => {
        console.log('TV desconectada do servidor');
        setTimeout(conectarWebSocket, 3000);
    };
}

function tratarMensagemTV(dados) {
    console.log('Mensagem recebida na TV:', dados);
    
    switch(dados.tipo) {
        case 'sala_criada':
        case 'jogador_entrou':
        case 'jogador_saiu':
            atualizarJogadoresTV(dados.jogadores);
            if (dados.tipo === 'sala_criada') {
                mostrarTelaTV('tv-aguardando');
            }
            break;
            
        case 'iniciar_rodada':
            document.getElementById('tv-pergunta').textContent = dados.pergunta;
            document.getElementById('tv-timer').textContent = '60';
            iniciarTimerTV();
            mostrarTelaTV('tv-respondendo');
            soundManager.play('countdown');
            break;
            
        case 'iniciar_votacao':
            document.getElementById('tv-pergunta-votacao').textContent = dados.pergunta;
            mostrarRespostasTV(dados.respostas);
            mostrarTelaTV('tv-votacao');
            soundManager.play('vote');
            iniciarTimerVotacao();
            break;
            
        case 'revelar_respostas':
            soundManager.play('reveal');
            mostrarRespostasReveladasTV(dados.respostas, dados.votos);
            break;
            
        case 'resultado_rodada':
            soundManager.play('results');
            mostrarResultadosRodadaTV(dados.pontuacoes);
            break;
            
        case 'fim_jogo':
            soundManager.play('winner');
            mostrarResultadoFinalTV(dados.vencedor, dados.pontuacoes_finais);
            mostrarTelaTV('tv-resultado-final');
            break;
    }
}

function entrarComoTV() {
    const codigo = document.getElementById('codigo-sala').value.trim().toUpperCase();
    if (!codigo) {
        alert('Por favor, digite o código da sala');
        return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            tipo: 'entrar_sala_tv',
            codigo: codigo
        }));
        salaAtual = codigo;
    }
}

function mostrarTelaTV(id) {
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('active');
        setTimeout(() => {
            if (!tela.classList.contains('active')) {
                tela.style.display = 'none';
            }
        }, 500);
    });
    
    const telaNova = document.getElementById(id);
    telaNova.style.display = 'block';
    
    telaNova.offsetHeight;
    telaNova.classList.add('active');
}

function atualizarJogadoresTV(jogadores) {
    const container = document.getElementById('tv-jogadores');
    container.innerHTML = '<h3>Jogadores na sala:</h3>';
    jogadores.forEach(jogador => {
        container.innerHTML += `<div class="tv-jogador">${jogador}</div>`;
    });
}

function iniciarTimerTV() {
    clearInterval(timerInterval);
    let tempo = 60;
    
    // Iniciar som de contagem com intervalo de 1 segundo
    soundManager.playWithDelay('countdown', 1000);
    
    timerInterval = setInterval(() => {
        tempo--;
        document.getElementById('tv-timer').textContent = tempo;
        
        if (tempo <= 10) {
            soundManager.stop('countdown');
            soundManager.playWithDelay('tick', 1000); // Tocar tick a cada segundo
        }
        
        if (tempo <= 0) {
            clearInterval(timerInterval);
            soundManager.stopAll();
        }
    }, 1000);
}

function mostrarRespostasTV(respostas) {
    soundManager.stopAll();
    const container = document.getElementById('tv-respostas');
    container.innerHTML = '';
    
    const respostasValidas = respostas.filter(r => r !== '...');
    const respostasEmbaralhadas = respostasValidas.sort(() => Math.random() - 0.5);
    
    respostasEmbaralhadas.forEach((resposta, index) => {
        const div = document.createElement('div');
        div.className = 'tv-resposta';
        div.style.animationDelay = `${index * 0.1}s`;
        div.innerHTML = `
            <div class="tv-resposta-numero">${index + 1}</div>
            <div class="tv-resposta-texto">${resposta}</div>
        `;
        container.appendChild(div);
    });
}

function mostrarRespostasReveladasTV(respostas, votos) {
    const container = document.getElementById('tv-respostas');
    container.innerHTML = '';
    
    Object.entries(respostas)
        .sort(([resposta, _]) => -(votos[resposta] || 0))
        .forEach(([resposta, autor], index) => {
            const div = document.createElement('div');
            div.className = 'tv-resposta';
            div.style.animationDelay = `${index * 0.1}s`;
            const numVotos = votos[resposta] || 0;
            div.innerHTML = `
                <div class="tv-resposta-texto">${resposta}</div>
                <div class="tv-resposta-autor">por ${autor}</div>
                <div class="tv-resposta-votos">${numVotos} voto${numVotos !== 1 ? 's' : ''}</div>
            `;
            container.appendChild(div);
        });
}

function mostrarResultadoFinalTV(vencedor, pontuacoes) {
    document.getElementById('tv-vencedor').textContent = `${vencedor} venceu!`;
    
    const container = document.getElementById('tv-pontuacoes');
    container.innerHTML = '';
    
    Object.entries(pontuacoes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([jogador, pontos]) => {
            const div = document.createElement('div');
            div.className = 'tv-pontuacao';
            div.textContent = `${jogador}: ${pontos} pontos`;
            container.appendChild(div);
        });
}

function mostrarResultadosRodadaTV(pontuacoes) {
    const container = document.getElementById('tv-pontuacoes');
    container.innerHTML = '<h3>Pontuação Atual:</h3>';
    
    Object.entries(pontuacoes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([jogador, pontos], index) => {
            const div = document.createElement('div');
            div.className = 'tv-pontuacao';
            div.style.animationDelay = `${index * 0.1}s`;
            div.textContent = `${jogador}: ${pontos} pontos`;
            container.appendChild(div);
        });
}

function mostrarErroTV(elemento) {
    elemento.classList.add('shake');
    elemento.addEventListener('animationend', () => {
        elemento.classList.remove('shake');
    }, { once: true });
}

function iniciarTimerVotacao() {
    clearInterval(timerInterval);
    let tempo = 60;
    
    const timerElement = document.createElement('div');
    timerElement.id = 'tv-timer-votacao';
    timerElement.className = 'tv-timer';
    document.getElementById('tv-votacao').insertBefore(
        timerElement,
        document.getElementById('tv-respostas')
    );
    
    soundManager.playWithDelay('countdown', 1000);
    
    timerInterval = setInterval(() => {
        tempo--;
        timerElement.textContent = tempo;
        
        if (tempo <= 10) {
            timerElement.classList.add('acabando');
            soundManager.stop('countdown');
            soundManager.playWithDelay('tick', 1000);
        }
        
        if (tempo <= 0) {
            clearInterval(timerInterval);
            soundManager.stopAll();
        }
    }, 1000);
}

window.addEventListener('load', conectarWebSocket);

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-sound');
    let muted = false;

    toggleButton.addEventListener('click', () => {
        muted = !muted;
        Object.values(soundManager.sounds).forEach(sound => {
            sound.muted = muted;
        });
        toggleButton.textContent = muted ? '🔇' : '🔊';
        toggleButton.classList.toggle('muted', muted);
    });
}); 