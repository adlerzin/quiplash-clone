import asyncio
import websockets
import json
import random
from perguntas import PERGUNTAS

salas = {}

class Jogador:
    def __init__(self, nome, websocket):
        self.nome = nome
        self.websocket = websocket
        self.pontos = 0
        self.respostas = {}  # {rodada: resposta}
        self.respondeu = False
        self.votou = False

class Sala:
    def __init__(self, codigo):
        self.codigo = codigo
        self.jogadores = {}
        self.tvs = set()  # Conjunto para armazenar websockets das TVs
        self.host = None
        self.estado = "lobby"
        self.rodada_atual = 0
        self.perguntas = []
        self.respostas_rodada = {}
        self.votos = {}
        self.timer_task = None  # Para controlar o timer de votação
    
    def iniciar_jogo(self):
        self.perguntas = random.sample(PERGUNTAS, 3)  # 3 rodadas por jogo
        self.estado = "pergunta"
        self.rodada_atual = 0
        
    def todos_responderam(self):
        return all(jogador.respondeu for jogador in self.jogadores.values())
    
    def todos_votaram(self):
        return all(jogador.votou for jogador in self.jogadores.values())
    
    async def broadcast(self, mensagem):
        # Enviar para jogadores
        for jogador in self.jogadores.values():
            try:
                await jogador.websocket.send(json.dumps(mensagem))
            except:
                pass
        
        # Enviar para TVs
        for tv in self.tvs:
            try:
                await tv.send(json.dumps(mensagem))
            except:
                pass

    async def iniciar_timer_votacao(self):
        # Cancelar timer anterior se existir
        if self.timer_task:
            self.timer_task.cancel()
        
        # Criar novo timer
        self.timer_task = asyncio.create_task(self.timer_votacao())

    async def timer_votacao(self):
        try:
            await asyncio.sleep(60)  # Esperar 60 segundos
            if self.estado == "votacao":
                # Se ainda estiver em votação após 60 segundos, forçar fim
                await processar_fim_rodada(self)
        except asyncio.CancelledError:
            pass  # Timer foi cancelado, não fazer nada

async def gerenciar_conexao(websocket, path):
    try:
        async for mensagem in websocket:
            dados = json.loads(mensagem)
            
            if dados["tipo"] == "criar_sala":
                codigo_sala = gerar_codigo_sala()
                sala = Sala(codigo_sala)
                salas[codigo_sala] = sala
                
                # Criar jogador host
                jogador = Jogador(dados["nome"], websocket)
                sala.jogadores[websocket] = jogador
                sala.host = websocket
                
                await websocket.send(json.dumps({
                    "tipo": "sala_criada",
                    "codigo": codigo_sala,
                    "eh_host": True,
                    "jogadores": [j.nome for j in sala.jogadores.values()]
                }))
            
            elif dados["tipo"] == "entrar_sala":
                codigo = dados["codigo"]
                if codigo in salas:
                    sala = salas[codigo]
                    if len(sala.jogadores) < 8:  # máximo 8 jogadores
                        jogador = Jogador(dados["nome"], websocket)
                        sala.jogadores[websocket] = jogador
                        
                        # Enviar confirmação para o jogador que entrou
                        await websocket.send(json.dumps({
                            "tipo": "sala_criada",  # Usando o mesmo tipo para manter consistência
                            "codigo": codigo,
                            "eh_host": False,
                            "jogadores": [j.nome for j in sala.jogadores.values()]
                        }))
                        
                        # Notificar outros jogadores na sala
                        for ws in sala.jogadores:
                            if ws != websocket:  # Não enviar para o jogador que acabou de entrar
                                await ws.send(json.dumps({
                                    "tipo": "jogador_entrou",
                                    "jogadores": [j.nome for j in sala.jogadores.values()]
                                }))
                    else:
                        await websocket.send(json.dumps({
                            "tipo": "erro",
                            "mensagem": "Sala cheia"
                        }))
                else:
                    await websocket.send(json.dumps({
                        "tipo": "erro",
                        "mensagem": "Sala não encontrada"
                    }))
            
            elif dados["tipo"] == "entrar_sala_tv":
                codigo = dados["codigo"]
                if codigo in salas:
                    sala = salas[codigo]
                    sala.tvs.add(websocket)  # Adicionar TV à sala
                    
                    # Enviar estado atual da sala
                    await websocket.send(json.dumps({
                        "tipo": "sala_criada",
                        "jogadores": [j.nome for j in sala.jogadores.values()]
                    }))
                    
                    # Se o jogo já estiver em andamento, enviar o estado atual
                    if sala.estado == "pergunta":
                        await websocket.send(json.dumps({
                            "tipo": "iniciar_rodada",
                            "rodada": sala.rodada_atual,
                            "pergunta": sala.perguntas[sala.rodada_atual]
                        }))
                    elif sala.estado == "votacao":
                        await websocket.send(json.dumps({
                            "tipo": "iniciar_votacao",
                            "pergunta": sala.perguntas[sala.rodada_atual],
                            "respostas": [j.respostas[sala.rodada_atual] for j in sala.jogadores.values()]
                        }))
                else:
                    await websocket.send(json.dumps({
                        "tipo": "erro",
                        "mensagem": "Sala não encontrada"
                    }))
            
            elif dados["tipo"] == "iniciar_jogo":
                codigo = dados["codigo"]
                sala = salas[codigo]
                if websocket == sala.host and len(sala.jogadores) >= 2:
                    sala.iniciar_jogo()
                    # Enviar primeira pergunta
                    await sala.broadcast({
                        "tipo": "iniciar_rodada",
                        "rodada": sala.rodada_atual,
                        "pergunta": sala.perguntas[sala.rodada_atual]
                    })
            
            elif dados["tipo"] == "enviar_resposta":
                codigo = dados["codigo"]
                sala = salas[codigo]
                jogador = sala.jogadores[websocket]
                jogador.respostas[sala.rodada_atual] = dados["resposta"]
                jogador.respondeu = True
                
                if sala.todos_responderam():
                    # Iniciar votação
                    sala.estado = "votacao"
                    await sala.broadcast({
                        "tipo": "iniciar_votacao",
                        "pergunta": sala.perguntas[sala.rodada_atual],
                        "respostas": [j.respostas[sala.rodada_atual] for j in sala.jogadores.values()]
                    })
            
            elif dados["tipo"] == "votar":
                codigo = dados["codigo"]
                sala = salas[codigo]
                jogador = sala.jogadores[websocket]
                jogador.votou = True
                
                # Registrar voto
                resposta_votada = dados["resposta"]
                sala.votos[resposta_votada] = sala.votos.get(resposta_votada, 0) + 1
                
                if sala.todos_votaram():
                    # Cancelar o timer se todos votaram antes do tempo acabar
                    if sala.timer_task:
                        sala.timer_task.cancel()
                    await processar_fim_rodada(sala)

    except websockets.exceptions.ConnectionClosed:
        # Limpar recursos quando jogador desconectar
        for sala in salas.values():
            if websocket in sala.jogadores:
                del sala.jogadores[websocket]
                if len(sala.jogadores) == 0:
                    del salas[sala.codigo]
                else:
                    await sala.broadcast({
                        "tipo": "jogador_saiu",
                        "jogadores": [j.nome for j in sala.jogadores.values()]
                    })
                break
            elif websocket in sala.tvs:  # Remover TV desconectada
                sala.tvs.remove(websocket)
                break

async def processar_fim_rodada(sala):
    # Primeiro, enviar os resultados com as respostas reveladas
    respostas_reveladas = {}
    for jogador in sala.jogadores.values():
        resposta = jogador.respostas[sala.rodada_atual]
        if resposta != '...':  # Não mostrar autores de respostas vazias
            respostas_reveladas[resposta] = jogador.nome

    await sala.broadcast({
        "tipo": "revelar_respostas",
        "respostas": respostas_reveladas,
        "votos": sala.votos
    })

    # Esperar 3 segundos antes de continuar
    await asyncio.sleep(3)

    # Calcular pontos baseado nos votos
    for jogador in sala.jogadores.values():
        resposta = jogador.respostas[sala.rodada_atual]
        votos = sala.votos.get(resposta, 0)
        jogador.pontos += votos * 100

    # Enviar resultados da rodada
    await sala.broadcast({
        "tipo": "resultado_rodada",
        "pontuacoes": {j.nome: j.pontos for j in sala.jogadores.values()},
        "votos": sala.votos
    })

    # Preparar próxima rodada ou finalizar jogo
    sala.rodada_atual += 1
    if sala.rodada_atual < len(sala.perguntas):
        # Resetar estado dos jogadores
        for jogador in sala.jogadores.values():
            jogador.respondeu = False
            jogador.votou = False
        sala.votos = {}
        
        await sala.broadcast({
            "tipo": "iniciar_rodada",
            "rodada": sala.rodada_atual,
            "pergunta": sala.perguntas[sala.rodada_atual]
        })
    else:
        await sala.broadcast({
            "tipo": "fim_jogo",
            "vencedor": max(sala.jogadores.values(), key=lambda j: j.pontos).nome,
            "pontuacoes_finais": {j.nome: j.pontos for j in sala.jogadores.values()}
        })

def gerar_codigo_sala():
    letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    while True:
        codigo = "".join(random.choices(letras, k=4))
        if codigo not in salas:
            return codigo

async def main():
    server = await websockets.serve(
        gerenciar_conexao,
        "0.0.0.0",
        8765
    )
    print("Servidor iniciado em ws://192.168.11.3:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main()) 