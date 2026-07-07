// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAyCR1Hod1kFemfLkXlPme88ihbRFlXhaM",
    authDomain: "sorteioafinidade.firebaseapp.com",
    projectId: "sorteioafinidade",
    storageBucket: "sorteioafinidade.firebasestorage.app",
    messagingSenderId: "338718810770",
    appId: "1:338718810770:web:7c0cc44fbf70df30b27c4b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// Atualiza a presença online ao logar
async function atualizarPresencaOnline(userId) {
    if (!userId) return;
    await db.collection("usuarios").doc(userId).update({
        online: true,
        ultimaAtividade: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Monitoriza e exibe todos os jogadores online para toda a gente
function ligarMonitorDeJogadoresOnline() {
    db.collection("usuarios").where("online", "==", true)
        .onSnapshot(snapshot => {
            const listaUl = document.getElementById("lista-jogadores-online");
            if (!listaUl) return;

            if (snapshot.empty) {
                listaUl.innerHTML = "<li>Nenhum herói online...</li>";
                return;
            }

            let html = "";
            snapshot.forEach(doc => {
                const u = doc.data();
                const nivel = u.nivel || 1;
                const titulo = u.titulo ? ` [${u.titulo}]` : "";
                html += `<li style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;">
                  🟢 <strong style="color: #fff;">${doc.id}</strong> <span style="color: #a982ed;">(Nível ${nivel})</span><em style="font-size: 10px; color: #aa7c11;">${titulo}</em>
              </li>`;
            });
            listaUl.innerHTML = html;
        });
}
function showToast(mensagem, tipo = 'info') {
    // Busca o container no HTML
    let container = document.getElementById("toast-container");
    
    // BLINDAGEM: Se o container não existir, usa o body como plano B para não travar o login
    if (!container) {
        console.warn("Aviso: 'toast-container' não foi encontrado no HTML. Usando fallback.");
        container = document.body;
    }

    // Cria o elemento do Toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.innerText = mensagem;

    // Estilização rápida de emergência caso caia no fallback do body
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "bold";
    toast.style.color = "#fff";
    toast.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4)";
    toast.style.pointerEvents = "auto";
    toast.style.transition = "all 0.3s ease";

    // Define as cores dinamicamente por tipo
    if (tipo === 'success' || tipo === 'sucesso') {
        toast.style.background = "#2ecc71";
    } else if (tipo === 'error' || tipo === 'erro') {
        toast.style.background = "#e74c3c";
    } else {
        toast.style.background = "#3498db";
    }

    // Adiciona ao container/tela
    container.appendChild(toast);

    // Remove o aviso após 3 segundos suavemente
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Chame esta função imediatamente após o utilizador entrar com sucesso no sistema:
// ligarMonitorDeJogadoresOnline();
// atualizarPresencaOnline(usuarioLogado);
// --- SISTEMA DE ÁUDIO SINTETIZADO ---
let somPermitido = true;
function toggleSom() {
    somPermitido = !somPermitido;
    document.getElementById("btn-som-nav").innerText = somPermitido ? "🔊" : "🔇";
}

function tocarSomBotao() {
    if (!somPermitido) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch (e) { }
}

function tocarSomSucesso() {
    if (!somPermitido) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
}

// Vincula o som automaticamente a todos os botões que possuem a classe nav-btn ou btn-primario
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("nav-btn") || e.target.classList.contains("btn-primario") || e.target.tagName === "BUTTON") {
        tocarSomBotao();
    }
});

// ---- NOVAS FUNÇÕES GLOBAIS ----
function showToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.className = `toast-card ${tipo}`;
    toast.innerHTML = `<span>${mensagem}</span> <button class="toast-btn-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) { toast.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => toast.remove(), 300); } }, 5000);
}
let chatAberto = false; let mensagensNaoLidas = 0; let isChatPrivadoPrioridade = false;
function toggleAltoContraste() { document.body.classList.toggle('alto-contraste'); }
function toggleTamanhoFonteChat() { document.getElementById('chat-box-mensagens').classList.toggle('fonte-grande'); }
function toggleChat() {
    // Ao abrir o chat geral...
document.getElementById("notificacao-chat-geral").style.display = "none"; // Apaga a bolinha
    const painelChat = document.getElementById("painel-chat-social");
    
    if (painelChat) {
        if (painelChat.classList.contains("hidden")) {
            painelChat.classList.remove("hidden");
            
            // NOVO: Força o carregamento das mensagens se o listener ainda não estiver ativo
            if (!unsubscribeChat) {
                mudarCanalChat(canalChatAtivo || 'global');
            }
            
            const badge = document.getElementById("chat-badge-contador");
            if (badge) {
                badge.innerText = "";
                badge.style.display = "none";
            }
            
            const boxMensagens = document.querySelector(".chat-mensagens-box");
            if (boxMensagens) {
                setTimeout(() => {
                    boxMensagens.scrollTop = boxMensagens.scrollHeight;
                }, 50);
            }
        } else {
            painelChat.classList.add("hidden");
        }
    } else {
        showToast("Erro: Painel do chat não encontrado no sistema.", "error");
    }
}
function scrollToBottom(force = false) {
    const box = document.getElementById('chat-box-mensagens');
    if (force || (box.scrollHeight - box.clientHeight <= box.scrollTop + 20)) { setTimeout(() => box.scrollTop = box.scrollHeight, 100); }
}
function registrarAcaoFeed(texto) { db.collection("feed_acoes").add({ texto: texto, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }

// --- BANCO DE DADOS DEFINITIVO DE RAÇAS, CLASSES E AFINIDADES INJETADO NATIVAMENTE ---
const BANCO_RACAS = {
    "Humano": { FOR: 1, VEL: 1, HAB: 1, RES: 1, POD: 1, passiva: "Adaptabilidade: Uma vez por combate, pode repetir um teste que tenha falhado." },
    "Elfo": { FOR: 0, VEL: 0, HAB: 3, RES: 0, POD: 2, passiva: "Sentidos Aguçados: Bônus de Percepção, rastreamento e pontaria duplicados." },
    "Goblin": { FOR: 0, VEL: 2, HAB: 3, RES: 0, POD: 0, passiva: "Improvisador Nato: Uma vez por combate, usa técnica sem gastar PP." },
    "Anjo": { FOR: 0, VEL: 0, HAB: 0, RES: 2, POD: 3, passiva: "Aura Divina: Toda cura, escudo ou proteção concedida é aplicada em x2." },
    "Demónio": { FOR: 3, VEL: 0, HAB: 0, RES: 0, POD: 2, passiva: "Fúria Infernal: Todo dano causado abaixo de 50% de PV é aplicado em x2." },
    "Vampiro": { FOR: 0, VEL: 3, HAB: 0, RES: 0, POD: 2, passiva: "Vampirismo: Toda recuperação de PV via drenagem é aplicada em x2." },
    "Zoofolk": { FOR: 2, VEL: 2, HAB: 0, RES: 1, POD: 0, passiva: "Instinto Bestial: Bônus de rastreamento, percepção, reflexos e perseguição em x2." }
};

const BANCO_CLASSES = {
    "Acólito": { FOR: 0, VEL: 0, HAB: 0, RES: 1, POD: 2, desc: "Focado em suporte, proteção e restauração de energia vital." },
    "Mago": { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 3, desc: "Domínio absoluto da modelagem de energias arcanas perigosas." },
    "Guerreiro": { FOR: 2, VEL: 0, HAB: 0, RES: 1, POD: 0, desc: "Especialista em combate corporal direto e linha de frente duradoura." },
    "Ladino": { FOR: 0, VEL: 2, HAB: 1, RES: 0, POD: 0, desc: "Mestre da velocidade, infiltrações perigosas e ataques furtivos." }
};

const BANCO_AFINIDADES = {
    "Elementais": [
        { nome: "🔥 Fogo", bonus: "+2 POD", passiva: "Espírito Ardente: Todo dano causado por técnicas de Fogo é aplicado em x2." },
        { nome: "🌊 Água", bonus: "+1 RES, +1 POD", passiva: "Fluxo Contínuo: Toda recuperação de PP é aplicada em x2." },
        { nome: "🪨 Terra", bonus: "+2 RES", passiva: "Corpo de Pedra: Toda redução de dano é aplicada em x2." },
        { nome: "🌪️ Ar", bonus: "+2 VEL", passiva: "Vento Favorável: Todos os bônus em Esquiva são aplicados em x2." }
    ],
    "Sub-Elementais": [
        { nome: "⚡ Relâmpago", bonus: "+1 VEL, +1 HAB", passiva: "Reflexos Elétricos: Todos os bônus em Iniciativa são aplicados em x2." },
        { nome: "❄️ Gelo", bonus: "+1 RES, +1 HAB", passiva: "Frieza Absoluta: Bônus para resistir a efeitos de controle em x2." },
        { nome: "🌋 Magma", bonus: "+1 FOR, +1 POD", passiva: "Pele Incandescente: Todo dano refletido ao atacante é aplicado em x2." },
        { nome: "🌫️ Névoa", bonus: "+1 VEL, +1 HAB", passiva: "Forma Nebulosa: Todos os bônus em Furtividade são aplicados em x2." },
        { nome: "☣️ Veneno", bonus: "+1 POD, +1 RES", passiva: "Toxina Natural: Todo dano contínuo causado por você é aplicado em x2." },
        { nome: "💎 Cristal", bonus: "+1 RES, +1 HAB", passiva: "Estrutura Cristalina: Resistência de barreiras/construções criadas em x2." },
        { nome: "🧲 Metal", bonus: "+1 FOR, +1 RES", passiva: "Corpo Temperado: Bônus contra agarrões, empurrões e desarmes em x2." },
        { nome: "🌱 Natureza", bonus: "+1 RES, +1 POD", passiva: "Vitalidade Natural: Toda recuperação de PV é aplicada em x2." },
        { nome: "🏜️ Areia", bonus: "+1 POD, +1 HAB", passiva: "Tempestade de Poeira: Penalidades causadas em Percepção em x2." }
    ],
    "Espirituais": [
        { nome: "👻 Espírito", bonus: "+2 POD", passiva: "Percepção Espiritual: Bônus para detectar magia/presenças em x2." },
        { nome: "🧠 Psíquica", bonus: "+1 POD, +1 HAB", passiva: "Mente Serena: Todos os bônus contra ilusões e efeitos mentais em x2." },
        { nome: "🌑 Sombras", bonus: "+1 VEL, +1 POD", passiva: "Caminho Sombrio: Todos os bônus em ambientes escuros em x2." },
        { nome: "☀️ Luz", bonus: "+1 POD, +1 HAB", passiva: "Aura Purificadora: Bônus contra maldições, corrupção e trevas em x2." },
        { nome: "🩸 Sangue", bonus: "+2 RES", passiva: "Instinto Primordial: Bônus concedidos abaixo de 50% dos PV em x2." },
        { nome: "🔮 Arcana", bonus: "+2 POD", passiva: "Condutor Arcano: Toda redução de custo de PP é aplicada em x2." }
    ],
    "Celestiais": [
        { nome: "😇 Celestial", bonus: "+1 POD, +1 RES", passiva: "Bênção Divina: Todos os bônus para resistir a efeitos negativos em x2." },
        { nome: "🌙 Lunar", bonus: "+1 VEL, +1 POD", passiva: "Serenidade da Lua: Toda recuperação de PV e PP em descansos em x2." },
        { nome: "☀️ Solar", bonus: "+1 FOR, +1 POD", passiva: "Luz Radiante: Toda penetração de defesa de técnicas em x2." },
        { nome: "⭐ Estelar", bonus: "+1 HAB, +1 POD", passiva: "Guia das Estrelas: Todos os bônus em testes de Percepção em x2." }
    ],
    "Cósmicas": [
        { nome: "🌌 Éter", bonus: "+2 POD", passiva: "Energia Universal: Todo aumento máximo de PP recebido é aplicado em x2." },
        { nome: "🌠 Gravidade", bonus: "+1 FOR, +1 POD", passiva: "Peso Esmagador: Bônus em agarrões, empurrões e derrubadas em x2." },
        { nome: "🕳️ Vazio", bonus: "+1 VEL, +1 POD", passiva: "Presença Inexistente: Bônus em Furtividade e Ocultação em x2." },
        { nome: "☄️ Meteoro", bonus: "+1 FOR, +1 HAB", passiva: "Impacto Devastador: Todo dano adicional por acertos críticos em x2." },
        { nome: "⏳ Tempo", bonus: "+1 VEL, +1 HAB", passiva: "Percepção Temporal: Todos os bônus em Iniciativa são aplicados em x2." },
        { nome: "🌌 Espaço", bonus: "+1 HAB, +1 POD", passiva: "Dobra Espacial: Todo deslocamento adicional por técnicas em x2." }
    ]
};

const TAXAS_PADRAO = { "Elementais": 50.0, "Sub-Elementais": 25.0, "Espirituais": 10.0, "Celestiais": 10.0, "Cósmicas": 5.0 };

// Variáveis de Estado
let afinidades = BANCO_AFINIDADES; let taxas = TAXAS_PADRAO; const todosElementosLista = [];
let racasAtuais = BANCO_RACAS; let classesAtuais = BANCO_CLASSES; let missoesSemanas = [];
let configGlobais = { pityMax: 30, nivelMax: 99, avisoGlobal: "Sejam bem-vindos!", eventoAtivo: "", bannerRateUp: "" };
let usuarioLogado = ""; let ehAdmin = false; let somAtivado = true;
let objFichaAtual = null; let usuarioVisualizandoFicha = ""; let playerDetetiveId = "";
let canalChatAtivo = "global"; let ultimoEnvioChat = 0; let receptorSussurro = "";

// Dicionário de Auto-Moderação
const PALAVRAS_BANIDAS = ["fracassado", "lixo", "nb", "noob", "hack", "corno", "otario"];

function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }
function toggleSom() { somAtivado = !somAtivado; document.getElementById('btn-som-nav').innerText = somAtivado ? '🔊' : '🔇'; }

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function somClique() { if (somAtivado) { try { let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(550, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08); gain.gain.setValueAtTime(0.12, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.08); } catch (e) { } } }
function somTickRoleta() { if (somAtivado) { try { let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'triangle'; osc.frequency.setValueAtTime(320, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.03); } catch (e) { } } }
function tocarClique() { if (audioCtx.state === 'suspended') audioCtx.resume(); somClique(); }

// Inicializador de Tabelas Estáticas e Eventos Remotos
function setupEstruturasIniciais() {
    Object.keys(afinidades).forEach(cat => { afinidades[cat].forEach(el => todosElementosLista.push({ ...el, categoria: cat })); });

    db.collection("config").doc("sistema").onSnapshot((doc) => {
        if (!doc.exists) {
            // Inicialização Primária da Nuvem com as raças e classes oficiais fornecidas
            db.collection("config").doc("sistema").set({ taxas: TAXAS_PADRAO, configGlobais: configGlobais, missoes: [] });
            return;
        }
        const dados = doc.data();
        taxas = dados.taxas || TAXAS_PADRAO;
        missoesSemanas = dados.missoes || [];
        configGlobais = dados.configGlobais || configGlobais;

        let htmlTaxas = ""; Object.keys(taxas).sort((a, b) => taxas[b] - taxas[a]).forEach(cat => { htmlTaxas += `<div class="taxa-linha"><span>${cat}:</span> <strong>${Number(taxas[cat]).toFixed(1)}%</strong></div>`; });
        document.getElementById("lista-taxas-dinamica").innerHTML = htmlTaxas;
        document.getElementById("aviso-global-persistente").innerText = configGlobais.avisoGlobal || "";

        const bEvt = document.getElementById("banner-evento-alerta");
        if (configGlobais.eventoAtivo) {
            bEvt.innerText = `🔥 EVENTO ATIVO: ${configGlobais.eventoAtivo} (Taxas de ${configGlobais.bannerRateUp} Modificadas!)`;
            bEvt.classList.remove("hidden");
        } else { bEvt.classList.add("hidden"); }
    });

    db.collection("usuarios").where("scorePrestigio", ">", 0).orderBy("scorePrestigio", "desc").limit(5).onSnapshot(snap => {
        let html = ""; let pos = 1;
        snap.forEach(doc => { const u = doc.data(); html += `<li><strong style="color:#d4af37;">${pos}º ${u.tituloEquipado ? `[${u.tituloEquipado.split(' ')[0]}] ` : ""}${u.exibicao}</strong><br><span style="font-size:11px;color:#bcaad6;">Nível: ${u.nivel || 1}</span></li>`; pos++; });
        const caixaRanking = document.getElementById("lista-ranking");
        if (caixaRanking) {
            caixaRanking.innerHTML = html || "<li>Nenhuma lenda ativa...</li>";
        }
    });
}
setupEstruturasIniciais();

window.deslogarSistema = async function () {
    if (!usuarioLogado) return;
    try {
        await atualizarPresencaOnline(usuarioLogado, false); // Fica offline
        usuarioLogado = null;
        userDataGlobal = null;
        showToast("Saindo da taverna...", "info");
        setTimeout(() => { window.location.reload(); }, 1000);
    } catch (e) {
        window.location.reload();
    }
}
// --- SISTEMA DE LOGS E AMBIENTE SOCIAL ---
async function entrarNoSistema() {
    const nome = document.getElementById("nome-personagem").value.trim();
    const senha = document.getElementById("senha-personagem").value.trim();

    if (!nome || !senha) {
        if (typeof showToast === "function") showToast("⚠️ O Oráculo exige um nome e uma senha!", "error");
        return;
    }

    try {
        // Vai ao banco de dados procurar o jogador
        const doc = await db.collection("usuarios").doc(nome).get();

        if (doc.exists) {
            const dados = doc.data();

            // VERIFICAÇÃO DE BANIMENTO (NOVO)
            if (dados.banidoAte) {
                const agora = new Date().getTime();
                if (agora < dados.banidoAte) {
                    const dias = Math.ceil((dados.banidoAte - agora) / (1000 * 60 * 60 * 24));
                    showToast(`🚫 O Oráculo baniu-te! Restam ${dias} dia(s).`, "error");
                    return; // Chuta o jogador para fora!
                }
            }

            // ... (dentro de entrarNoSistema)

            // A CONTA EXISTE! Vamos verificar a senha:
            if (dados.senha !== senha) {
                if (typeof showToast === "function") showToast("❌ Senha incorreta, impostor!", "error");
                return;
            }
            // Senha correta, carrega os dados!
            usuarioLogado = nome;
            userDataGlobal = dados;
            ehAdmin = dados.ehAdmin === true; // CORRIGIDO: mudado de isAdmin para ehAdmin
            if (typeof showToast === "function") showToast(`Bem-vindo de volta à Taverna, ${nome}!`, "success");

        } else {
            // 2. A CONTA NÃO EXISTE! Cria uma conta nova automaticamente:
            const novaConta = {
                exibicao: nome,
                senha: senha,
                nivel: 1,
                pontosTotais: 0,
                tentativas: 3,
                online: true,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("usuarios").doc(nome).set(novaConta);

            usuarioLogado = nome;
            userDataGlobal = novaConta;
            ehAdmin = false; // CORRIGIDO: mudado de isAdmin para ehAdmin
            if (typeof showToast === "function") showToast(`✨ Nova alma registada! Bem-vindo, ${nome}!`, "success");
        }

        // 3. ABRE AS PORTAS DO JOGO!
        if (typeof iniciarInterfacePrincipal === "function") {
            iniciarInterfacePrincipal();
        } else {
            console.error("A função iniciarInterfacePrincipal não foi encontrada!");
        }

    } catch (erro) {
        console.error("Erro no login:", erro);
        if (typeof showToast === "function") showToast("🔥 Erro ao contactar o Oráculo.", "error");
    }
}

// ✅ COMO DEVE FICAR (CORRETO):

// 1. Apenas a criação da função (sem chamar a si mesma)
window.atualizarContadorNaTela = function (tentativas) {
    const divContador = document.getElementById("contador-tentativas");
    if (divContador) {
        divContador.innerHTML = `Essências disponíveis: <strong style="color: #fff;">${tentativas || 0}</strong>`;
    }
}
function iniciarInterfacePrincipal() {
    // 1. Esconde a tela de login e mostra a do jogo
    const telaLogin = document.getElementById("tela-login");
    const telaSorteio = document.getElementById("tela-sorteio");
    if (telaLogin) telaLogin.classList.add("hidden");
    if (telaSorteio) telaSorteio.classList.remove("hidden");

    // 2. Mostra a barra de navegação inteira (com todos os botões padrões)
    const topNavbar = document.getElementById("top-navbar");
    if (topNavbar) topNavbar.classList.remove("hidden");

    // 3. Atualizar nome do usuário
    const divUsuario = document.getElementById("usuario-atual");
    if (divUsuario) divUsuario.innerText = usuarioLogado;

    // 4. CONTROLE DE PERMISSÕES DOS DOIS BOTÕES NOVOS
    const btnRanking = document.getElementById("btn-ranking-global");
    if (btnRanking && usuarioLogado) {
        btnRanking.style.display = "inline-block"; // Todos logados veem o ranking
    }
    
    const btnAdmin = document.getElementById("btn-master-admin");
    if (btnAdmin) {
        if (ehAdmin) {
            btnAdmin.style.display = "inline-block"; // Só Admin vê o painel mestre
        } else {
            btnAdmin.style.display = "none";
        }
    }

    // 5. Funções secundárias de carregamento
    const painelRanking = document.getElementById("ranking");
    if (painelRanking) painelRanking.classList.remove("hidden");

    if (ehAdmin) {
        if (typeof renderListaJogadoresAdm === "function") renderListaJogadoresAdm();
        if (typeof escutarFeedAdm === "function") escutarFeedAdm();
    }

    if (typeof window.atualizarContadorNaTela === "function" && userDataGlobal) {
        window.atualizarContadorNaTela(userDataGlobal.tentativas);
    }

    if (typeof window.atualizarPresencaOnline === "function") {
        window.atualizarPresencaOnline(usuarioLogado, true);
    }
    if (typeof window.ligarMonitorDeJogadoresOnline === "function") {
        window.ligarMonitorDeJogadoresOnline();
    }
    if (typeof escutarChatFirebase === "function") {
        escutarChatFirebase();
    }
    if (typeof window.tocarMusicaFundo === "function") {
        window.tocarMusicaFundo();
    }
}

function deslogarSistema() {
    // Esconde os botões especiais e a barra inteira
    const btnRanking = document.getElementById("btn-ranking-global");
    const btnAdmin = document.getElementById("btn-master-admin");
    if (btnRanking) btnRanking.style.display = "none";
    if (btnAdmin) btnAdmin.style.display = "none";

    const topNavbar = document.getElementById("top-navbar");
    if (topNavbar) topNavbar.classList.add("hidden");

    // Reseta variáveis
    usuarioLogado = ""; 
    ehAdmin = false;
    
    // Esconde os painéis do jogo
    const paineis = [
        "aviso-global-persistente", "tela-sorteio", "ranking", 
        "taxas-drop", "historico-pessoal", "painel-chat-social", "modal-adm"
    ];
    paineis.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    
    // Mostra tela de login novamente
    const telaLogin = document.getElementById("tela-login");
    if (telaLogin) telaLogin.classList.remove("hidden");
}
async function atualizarInterfaceJogador() {
    if (ehAdmin) return;
    const doc = await db.collection("usuarios").doc(usuarioLogado).get(); const u = doc.data();
    const nomeExibicao = u.exibicao || usuarioLogado;
    document.getElementById("usuario-atual").innerText = u.tituloEquipado
        ? `[${u.tituloEquipado.split(' ')[0]}] ${nomeExibicao}`
        : nomeExibicao;
    document.getElementById("contador-tentativas").innerHTML = `Essências: <strong>${u.rolagens}</strong> <span style="font-size:11px;color:#888;display:block;">Piedade: ${u.pityCounter || 0}/${configGlobais.pityMax}</span>`;
    if (u.rolagens >= 10) document.getElementById("btn-sortear-10").classList.remove("hidden"); else document.getElementById("btn-sortear-10").classList.add("hidden");
    document.getElementById("lista-historico-pessoal").innerHTML = u.historico.slice(-15).map(h => `<li>[${h.data}] <strong>${h.afinidade}</strong></li>`).reverse().join("");
}

// --- ENGINES DO CHAT MULTI-ABAS (COM PIPELINE DE AUTO-LIMPEZA) ---
function mudarCanalChat(canal) {
    canalChatAtivo = canal;
    document.getElementById("tab-chat-global").classList.remove("active");
   let elemento = document.getElementById("sussurro-mensagens");
if (elemento) {
    elemento.classList.add("ativa");
} else {
    console.warn("Aviso: O elemento do chat antigo não foi encontrado, ignorando...");
}
    if (canal === 'global') {
        document.getElementById("tab-chat-global").classList.add("active");
        document.getElementById("chat-input-texto").placeholder = "Mensagem para o mundo...";
    } else {
        document.getElementById("tab-chat-privado").classList.add("active");
        if (!receptorSussurro) {
            let dest = prompt("Digita o ID de quem queres cochichar (ou digite 'l' para falar com o Mestre):");
            if (dest) receptorSussurro = dest.toLowerCase().trim();
        }
        document.getElementById("chat-input-texto").placeholder = `Sussurrar para [${receptorSussurro}]...`;
    }
    ouvirMensagensChat();
}

let unsubscribeChat = null;
function ouvirMensagensChat() {
    if (unsubscribeChat) unsubscribeChat();

    let query = db.collection("chat").orderBy("timestamp", "desc").limit(50);
    // Quando chegam mensagens no chat geral:
const divChatGeral = document.getElementById("painel-chat-social");
// Se o chat estiver fechado, mostra a bolinha
if (divChatGeral.style.display === "none" || divChatGeral.style.display === "") {
    document.getElementById("notificacao-chat-geral").style.display = "inline";
}

    unsubscribeChat = query.onSnapshot(snap => {
        const box = document.getElementById("chat-box-mensagens");
        let arr = [];
        snap.forEach(d => {
            const m = d.data();
            // Regra de Visibilidade de Canais (Filtro Dinâmico)
            if (canalChatAtivo === 'global' && m.canal === 'global') {
                arr.push({ id: d.id, ...m });
            } else if (canalChatAtivo === 'sussurro' && m.canal === 'sussurro') {
                if (ehAdmin || m.remetenteId === usuarioLogado || m.destinoId === usuarioLogado) {
                    arr.push({ id: d.id, ...m });
                }
            }
        });

        arr.reverse();
        box.innerHTML = arr.map(m => {
            let tag = m.remetenteId === 'l' ? `<span style="color:#d4af37;">[MESTRE]</span>` : ``;
            let corpo = `<span style="color:#c4b4de;">${m.texto}</span>`;
            if (m.canal === 'sussurro') corpo = `<i style="color:#ff69b4;">[Sussurro]: ${m.texto}</i>`;

            return `<div class="msg-linha">
                        <button class="btn-report-msg" onclick="denunciarMensagemAltar('${m.id}', '${m.remetenteExibicao}', '${m.texto}')" title="Denunciar aos Deuses">🚩</button>
                        ${tag} <strong onclick="definirAlvoSussurro('${m.remetenteId}')">${m.remetenteExibicao}:</strong> ${corpo}
                    </div>`;
        }).join("");
        box.scrollTop = box.scrollHeight;
    });
}

function definirAlvoSussurro(id) {
    receptorSussurro = id;
    mudarCanalChat('sussurro');
}

async function enviarMensagemChat() {
    const agora = Date.now();
    if (agora - ultimoEnvioChat < 2000) { alert("Calma, não floodes a taverna!"); return; }

    let txt = document.getElementById("chat-input-texto").value.trim();
    if (!txt) return;

    ultimoEnvioChat = agora;

    // Filtro Automático de Linguagem
    PALAVRAS_BANIDAS.forEach(p => {
        let regex = new RegExp(p, "gi");
        txt = txt.replace(regex, "[***]");
    });

    const docU = await db.collection("usuarios").doc(usuarioLogado).get();
    const u = docU.data();

    const novaMsg = {
        canal: canalChatAtivo,
        remetenteId: usuarioLogado,
        remetenteExibicao: u.exibicao,
        destinoId: canalChatAtivo === 'sussurro' ? receptorSussurro : "",
        texto: txt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("chat").add(novaMsg);
    document.getElementById("chat-input-texto").value = "";

    // Pipeline de Auto-Limpeza Ativa (Mantém apenas os últimos 50 registros globais na nuvem)
    db.collection("chat").orderBy("timestamp", "desc").limit(50).get().then(s => {
        s.forEach(doc => doc.ref.delete());
    });
}

// CONTROLADOR DE DENÚNCIAS REAL-TIME
async function denunciarMensagemAltar(msgId, autor, texto) {
    if (!confirm("Deseja reportar esta linha de texto diretamente aos deuses da moderação?")) return;
    await db.collection("denuncias").add({
        msgId: msgId,
        autorInfrator: autor,
        textoOfensivo: texto,
        denunciante: usuarioLogado,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Denúncia protocolada com sucesso. Os Mestres agirão em breve.");
}

// --- FICHA E PROGRESSÃO ---
function extrairBonusAfinidade(nomeAf) {
    let b = { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 }; if (!nomeAf) return b;
    const item = todosElementosLista.find(e => e.nome === nomeAf); if (!item || !item.bonus) return b;
    let m = item.bonus.toLowerCase().match(/\+(\d+)\s*([a-zçã]+)/g);
    if (m) { m.forEach(x => { let val = parseInt(x.match(/\d+/)[0]); if (x.includes('for')) b.FOR += val; if (x.includes('vel')) b.VEL += val; if (x.includes('hab')) b.HAB += val; if (x.includes('res')) b.RES += val; if (x.includes('pod')) b.POD += val; }); }
    return b;
}

async function abrirFicha(userId) {
    tocarClique(); usuarioVisualizandoFicha = userId;
    const doc = await db.collection("usuarios").doc(userId).get(); objFichaAtual = doc.data();
    document.getElementById("ficha-nome").innerText = objFichaAtual.exibicao;
    document.getElementById("ficha-nivel").innerText = `Nível ${objFichaAtual.nivel || 1}`;

    let buildSelect = (elId, fonte) => {
        let el = document.getElementById(elId); el.innerHTML = "<option value=''>Escolha...</option>";
        Object.keys(fonte).forEach(key => el.innerHTML += `<option value="${key}">${key}</option>`);
    };
    buildSelect("ficha-raca", racasAtuais); buildSelect("ficha-classe", classesAtuais);
    document.getElementById("ficha-raca").value = objFichaAtual.raca || "";
    document.getElementById("ficha-classe").value = objFichaAtual.classe || "";

    document.getElementById("ficha-raca").disabled = !!objFichaAtual.raca && !ehAdmin;
    document.getElementById("ficha-classe").disabled = !!objFichaAtual.classe && !ehAdmin;

    calcularFicha(); document.getElementById("modal-ficha").classList.remove("hidden");
}

function modificarAtributo(attr, val) {
    let pts = objFichaAtual.pontosBase || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
    let maxP = 20 + (((objFichaAtual.nivel || 1) - 1) * 2); let gasto = pts.FOR + pts.VEL + pts.HAB + pts.RES + pts.POD;
    if (val > 0 && gasto >= maxP) return; if (val < 0 && pts[attr] <= 0) return;
    pts[attr] += val; objFichaAtual.pontosBase = pts; calcularFicha();
}

function calcularFicha() {
    let pts = objFichaAtual.pontosBase || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
    let br = racasAtuais[document.getElementById("ficha-raca").value] || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
    let bc = classesAtuais[document.getElementById("ficha-classe").value] || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
    let ba = extrairBonusAfinidade(objFichaAtual.tituloEquipado);

    ['FOR', 'VEL', 'HAB', 'RES', 'POD'].forEach(a => {
        document.getElementById(`ficha-base-${a}`).innerText = pts[a];
        document.getElementById(`ficha-total-${a}`).innerText = pts[a] + br[a] + bc[a] + ba[a];
    });
    let tRES = pts.RES + br.RES + bc.RES + ba.RES; let tPOD = pts.POD + br.POD + bc.POD + ba.POD;
    document.getElementById("ficha-pv").innerText = tRES * 5; document.getElementById("ficha-pp").innerText = tPOD * 5; document.getElementById("ficha-def").innerText = Math.ceil(tRES / 2);
    document.getElementById("ficha-pontos-livres").innerText = (20 + (((objFichaAtual.nivel || 1) - 1) * 2)) - (pts.FOR + pts.VEL + pts.HAB + pts.RES + pts.POD);
}

async function salvarFicha() {
    objFichaAtual.raca = document.getElementById("ficha-raca").value; objFichaAtual.classe = document.getElementById("ficha-classe").value;
    await db.collection("usuarios").doc(usuarioVisualizandoFicha).update({ raca: objFichaAtual.raca, classe: objFichaAtual.classe, pontosBase: objFichaAtual.pontosBase });
    alert("Estrutura da Ficha Atualizada!"); fecharModal('modal-ficha');
    if (ehAdmin) renderPainelJogadores();
}

// --- MISSÕES E SUPORTE ---
window.abrirModalFeedback = function () {
    document.getElementById("modal-feedback").classList.remove("hidden");
}

window.enviarFeedback = async function () {
    const texto = document.getElementById("texto-feedback").value.trim();
    if (!texto) {
        showToast("Escreva algo antes de enviar!", "error");
        return;
    }
    try {
        await db.collection("feedbacks").add({
            autor: usuarioLogado || "Anónimo",
            texto: texto,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById("texto-feedback").value = "";
        fecharModal("modal-feedback");
        tocarSomSucesso();
        showToast("Relatório enviado aos Mestres!", "success");
    } catch (e) {
        showToast("Erro ao reportar. Tente novamente.", "error");
    }
}

async function abrirModalMissoes() {
    tocarClique(); const container = document.getElementById("lista-missoes-usuario"); container.innerHTML = "Consultando pergaminhos...";
    document.getElementById("modal-missoes").classList.remove("hidden");
    if (missoesSemanas.length === 0) { container.innerHTML = "<p>Sem ordens do mestre por hoje.</p>"; return; }
    const docU = await db.collection("usuarios").doc(usuarioLogado).get(); const concluidas = docU.data().missoesConcluidas || [];
    container.innerHTML = missoesSemanas.map(m => {
        const checked = concluidas.includes(m.titulo);
        return `<div class="missao-bloco"><h4>${m.titulo}</h4><p>${m.desc}</p>${checked ? `<span style="color:#5cb85c; font-weight:bold;">✔️ Concluída</span>` : `<button class="btn-primario" onclick="concluirMissaoEfectiva('${m.titulo}')" style="padding:4px 8px; font-size:12px;">Concluir</button>`}</div>`;
    }).join("");
}

window.concluirMissaoEfectiva = async function (titulo) {
    await db.collection("usuarios").doc(usuarioLogado).update({ missoesConcluidas: firebase.firestore.FieldValue.arrayUnion(titulo) });
    abrirModalMissoes();
}

// =========================================================================
// =========================== ENGINE MASTER ADM ===========================
// =========================================================================
// Função para abrir o Painel do Mestre
function abrirPainelAdm() {
    // Procura o super painel do ADM no HTML
    const modalAdm = document.getElementById("modal-adm") || document.querySelector(".modal-adm-box");
    
    if (modalAdm) {
        // Remove a classe hidden do painel do mestre
        modalAdm.classList.remove("hidden");
        
        // Garante que o modal de feedback/bug fique FECHADO para não dar conflito
        const modalBug = document.getElementById("modal-feedback"); // Ajuste o ID se o seu for diferente
        if (modalBug) modalBug.classList.add("hidden");

        showToast("Grimório do Mestre Aberto", "info");
    } else {
        showToast("Erro: O painel do mestre não foi localizado no HTML.", "error");
    }
}
function mudarAbaAdm(aba) {
    document.querySelectorAll(".aba-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".aba-adm-conteudo").forEach(div => div.classList.add("hidden"));
    document.getElementById(`btn-aba-${aba}`).classList.add("active"); document.getElementById(`conteudo-adm-${aba}`).classList.remove("hidden");

    if (aba === 'jogadores') renderPainelJogadores();
    else if (aba === 'missoes') renderPainelMissoesAdm();
    else if (aba === 'raca') renderPainelRacasClasses();
    else if (aba === 'afinidades') { renderPainelAfinidadesExistentes(); renderAbaAfinidadesGeral(); }
    else if (aba === 'servidor') renderizarCamposGlobaisServidor();
    else if (aba === 'denuncias') renderPainelDenunciasAdm();
    else if (aba === 'inbox') renderPainelInboxAdm();
}
window.modificarRollsJogador = async function (id, qtd) {
    await db.collection("usuarios").doc(id).update({ rolagens: firebase.firestore.FieldValue.increment(qtd) });
    renderPainelJogadores();
}
window.toggleBanirJogador = async function (id, status) {
    if (!confirm(status ? "Reativar conta?" : "Deseja banir este jogador do servidor?")) return;
    await db.collection("usuarios").doc(id).update({ banido: !status });
    renderPainelJogadores();
}

window.abrirDetetiveAdm = async function (id) {
    playerDetetiveId = id; const doc = await db.collection("usuarios").doc(id).get(); const u = doc.data();
    document.getElementById("detetive-titulo").innerText = `Grimório: ${u.exibicao}`;
    document.getElementById("detetive-historico-lista").innerHTML = u.historico && u.historico.length > 0
        ? u.historico.map(h => `<div>• [${h.data}] <strong>${h.afinidade}</strong></div>`).join("")
        : "Nenhuma afinidade conquistada.";

    let sel = document.getElementById("detetive-inject-select"); sel.innerHTML = "";
    todosElementosLista.forEach(e => sel.innerHTML += `<option value="${e.nome}">${e.nome} [${e.categoria}]</option>`);
    document.getElementById("modal-detetive-adm").classList.remove("hidden");
}

window.executarInjecaoDireta = async function () {
    let itemNome = document.getElementById("detetive-inject-select").value; if (!itemNome) return;
    const itemObj = todosElementosLista.find(x => x.nome === itemNome);
    let dStr = new Date().toLocaleDateString();
    await db.collection("usuarios").doc(playerDetetiveId).update({
        historico: firebase.firestore.FieldValue.arrayUnion({ categoria: itemObj.categoria, afinidade: itemObj.nome, data: dStr }),
        tituloEquipado: itemObj.nome
    });
    alert("Item injetado diretamente no jogador!"); fecharModal("modal-detetive-adm"); renderPainelJogadores();
}

function renderPainelMissoesAdm() {
    const container = document.getElementById("lista-missoes-adm");
    container.innerHTML = missoesSemanas.map((m, idx) => `<div style="background:rgba(0,0,0,0.3); border:1px solid #3c1e69; padding:8px; margin-bottom:5px; border-radius:4px; font-size:12px; display:flex; justify-content:space-between;"><span><strong>${m.titulo}</strong></span><button class="btn-deletar-pequeno" onclick="deletarMissaoNuvem(${idx})">Deletar</button></div>`).join("");
}
window.criarMissaoAdmin = async function () {
    const t = document.getElementById("nova-missao-titulo").value.trim(); const d = document.getElementById("nova-missao-desc").value.trim();
    if (!t || !d) return;
    await db.collection("config").doc("sistema").update({ missoes: firebase.firestore.FieldValue.arrayUnion({ titulo: t, desc: d }) });
    document.getElementById("nova-missao-titulo").value = ""; document.getElementById("nova-missao-desc").value = "";
}
window.deletarMissaoNuvem = async function (idx) {
    let n = [...missoesSemanas]; n.splice(idx, 1);
    await db.collection("config").doc("sistema").update({ missoes: n });
}
window.resetarMissoesJogadores = async function () {
    if (!confirm("Zerar as missões de todos?")) return;
    const snap = await db.collection("usuarios").get(); let b = db.batch();
    snap.forEach(d => { if (!d.data().isAdmin) b.update(d.ref, { missoesConcluidas: [] }); });
    await b.commit(); alert("Semana reiniciada!");
}

function renderPainelRacasClasses() {
    let h = `<tr><th>Nome</th><th>FOR</th><th>VEL</th><th>HAB</th><th>RES</th><th>POD</th></tr>`;
    document.getElementById("th-racas").innerHTML = h; document.getElementById("th-classes").innerHTML = h;

    document.getElementById("tb-racas").innerHTML = Object.keys(racasAtuais).map(k => {
        let r = racasAtuais[k]; return `<tr><td><strong>${k}</strong></td><td>${r.FOR}</td><td>${r.VEL}</td><td>${r.HAB}</td><td>${r.RES}</td><td>${r.POD}</td></tr>`;
    }).join("");
    document.getElementById("tb-classes").innerHTML = Object.keys(classesAtuais).map(k => {
        let c = classesAtuais[k]; return `<tr><td><strong>${k}</strong></td><td>${c.FOR}</td><td>${c.VEL}</td><td>${c.HAB}</td><td>${c.RES}</td><td>${c.POD}</td></tr>`;
    }).join("");
}

function renderAbaAfinidadesGeral() {
    const grid = document.getElementById("grid-taxas-admin"); let htmlGrid = "";
    Object.keys(taxas).forEach(cat => { htmlGrid += `<div><label style='font-size:11px;'>${cat}</label><input type='number' id='edit-taxa-${cat}' value='${taxas[cat]}' step='0.1' style='padding:4px; font-size:12px;'></div>`; });
    grid.innerHTML = htmlGrid;
}

function renderPainelAfinidadesExistentes() {
    const container = document.getElementById("lista-afinidades-existentes-adm");
    let html = "";
    Object.keys(afinidades).forEach(cat => {
        html += `<div style='margin-bottom:12px;'><strong style='color:#d4af37; font-size:14px;'>[${cat} - Matriz Original]</strong><br>`;
        afinidades[cat].forEach((el) => {
            html += `<div style='font-size:12px; margin:4px 0; background:rgba(255,255,255,0.02); padding:4px; border-radius:4px;'>• <strong>${el.nome}</strong> (${el.bonus}) - <i style="color:#aaa;">${el.passiva}</i></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

window.salvarTaxasNuvem = async function () {
    let updates = {};
    Object.keys(taxas).forEach(cat => { let el = document.getElementById(`edit-taxa-${cat}`); if (el) updates[`taxas.${cat}`] = parseFloat(el.value) || 0; });
    await db.collection("config").doc("sistema").update(updates); alert("Matriz de Drops rebalanceada!");
}

function renderizarCamposGlobaisServidor() {
    document.getElementById("cfg-aviso-texto").value = configGlobais.avisoGlobal || "";
    document.getElementById("cfg-pity-max").value = configGlobais.pityMax || 30;
    document.getElementById("cfg-lvl-max").value = configGlobais.nivelMax || 99;
}

window.salvarConfigGlobais = async function () {
    const pack = {
        avisoGlobal: document.getElementById("cfg-aviso-texto").value,
        pityMax: parseInt(document.getElementById("cfg-pity-max").value) || 30,
        nivelMax: parseInt(document.getElementById("cfg-lvl-max").value) || 99,
        eventoAtivo: configGlobais.eventoAtivo || "",
        bannerRateUp: configGlobais.bannerRateUp || ""
    };
    await db.collection("config").doc("sistema").update({ configGlobais: pack });
    alert("Configurações atualizadas na nuvem!");
}

window.enviarPresenteGlobal = async function () {
    let qtd = parseInt(document.getElementById("gift-qtd").value); if (!qtd || qtd <= 0) return;
    if (!confirm(`Enviar +${qtd} Essências para TODOS os players cadastrados?`)) return;
    const snap = await db.collection("usuarios").get(); let b = db.batch();
    snap.forEach(d => { if (!d.data().isAdmin) b.update(d.ref, { rolagens: firebase.firestore.FieldValue.increment(qtd) }); });
    await b.commit(); alert(`Brinde global enviado!`);
    document.getElementById("gift-qtd").value = "";
}

// NOVO PAINEL DE GESTÃO DE SEGURANÇA E DENÚNCIAS DO CHAT
async function renderPainelDenunciasAdm() {
    const container = document.getElementById("lista-denuncias-chat"); container.innerHTML = "Examinando altares...";
    const snap = await db.collection("denuncias").orderBy("timestamp", "desc").limit(20).get();
    if (snap.empty) { container.innerHTML = "<p>Nenhuma infração de chat registrada nas abas do Oráculo.</p>"; return; }

    container.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        return `<div class="inbox-bloco" style="border-color:#d9534f;">
                    <h4>🚩 Alvo Denunciado: <span style="color:#fff;">${d.autorInfrator}</span></h4>
                    <p style="background:rgba(0,0,0,0.5); padding:6px; border-radius:4px; font-style:italic;">"${d.textoOfensivo}"</p>
                    <span style="font-size:10px; color:#888;">Reportado por: ${d.denunciante}</span>
                    <button class="btn-deletar-pequeno" style="float:right; margin-top:-5px;" onclick="arquivarDenuncia('${doc.id}')">Arquivar Caso</button>
                </div>`;
    }).join("");
}

window.arquivarDenuncia = async function (id) {
    await db.collection("denuncias").doc(id).delete();
    renderPainelDenunciasAdm();
}

async function renderPainelInboxAdm() {
    const container = document.getElementById("lista-inbox-mensagens"); container.innerHTML = "Lendo relatórios...";
    const snap = await db.collection("feedbacks").orderBy("timestamp", "desc").limit(20).get();
    if (snap.empty) { container.innerHTML = "<p>Nenhum bug reportado.</p>"; return; }
    container.innerHTML = snap.docs.map(doc => {
        const f = doc.data();
        return `<div class="inbox-bloco"><h4>🐛 Autor: ${f.autor} <button class="btn-deletar-pequeno" style="float:right;" onclick="deletarFeedbackInbox('${doc.id}')">Lido</button></h4><p>${f.texto}</p></div>`;
    }).join("");
}
window.deletarFeedbackInbox = async function (id) {
    await db.collection("feedbacks").doc(id).delete();
    renderPainelInboxAdm();
}
// ---- MODO DEUS (ADM) E TÍTULOS CHAT ----
function escutarFeedAdm() {
    if (!db) return;
    db.collection("feed_acoes").orderBy("timestamp", "desc").limit(15).onSnapshot(snap => {
        const feed = document.getElementById("feed-global-adm");
        // ESCUDO: Protege contra o erro null se o ADM não estiver com o painel aberto
        if (!feed) return;

        feed.innerHTML = snap.docs.map(d => `<div class="feed-linha">${d.data().texto}</div>`).join("");
    });
}
// Variável para guardar a escuta e evitar o bug de duplicação
let listenerJogadoresAdm = null;

window.renderListaJogadoresAdm = function () {
    const container = document.getElementById("lista-jogadores-edicao");
    if (!container) return;
    container.innerHTML = "Carregando almas...";

    // Se já existia uma escuta ativa (de abas anteriores), desliga-a!
    if (listenerJogadoresAdm) {
        listenerJogadoresAdm();
    }

    // Cria uma escuta única e limpa
    listenerJogadoresAdm = db.collection("usuarios").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            html += `
            <div class="user-card-edit">
                <h4>👤 ${doc.id}</h4>
                <div class="input-linha"><label>Título:</label><input type="text" id="tit-${doc.id}" value="${d.titulo || ''}" style="width:120px;"></div>
                <div class="input-linha">
                    <label>Nível:</label><input type="number" id="lvl-${doc.id}" value="${d.nivel || 1}" style="width:50px;">
                    <label>Pts:</label><input type="number" id="pts-${doc.id}" value="${d.pontosTotais || 0}" style="width:50px;">
                </div>
                <div class="input-linha">
                    <label>rolagens(+):</label><input type="number" id="ess-${doc.id}" value="0" style="width:50px;">
                    <button class="btn-sucesso-pequeno" onclick="salvarEdicaoDivina('${doc.id}', ${d.tentativas || 0})">Salvar</button>
                    <button class="btn-sucesso-pequeno" style="background:#d9534f; margin-left: 5px;" onclick="punirJogador('${doc.id}')">Banir</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}
// O Motor do Banimento
window.punirJogador = async function (userId) {
    const dias = prompt(`O Mestre exige punição!\nQuantos dias de banimento para ${userId}?`);
    if (!dias || isNaN(dias) || dias <= 0) return;

    const ms = dias * 24 * 60 * 60 * 1000;
    const dataFim = new Date().getTime() + ms;

    await db.collection("usuarios").doc(userId).update({ banidoAte: dataFim });
    showToast(`O machado caiu! ${userId} foi banido por ${dias} dias!`, "success");
    if (typeof registrarAcaoFeed === "function") registrarAcaoFeed(`⚡ O Mestre baniu ${userId} por ${dias} dias.`);
}
window.punirJogador = async function (userId) {
    const dias = prompt(`O Mestre exige punição!\nQuantos dias de banimento para ${userId}?`);
    if (!dias || isNaN(dias) || dias <= 0) return;

    const ms = dias * 24 * 60 * 60 * 1000;
    const dataFim = new Date().getTime() + ms;

    await db.collection("usuarios").doc(userId).update({ banidoAte: dataFim });
    showToast(`O machado caiu! ${userId} foi banido por ${dias} dias!`, "success");
    if (typeof registrarAcaoFeed === "function") registrarAcaoFeed(`⚡ O Mestre baniu ${userId} por ${dias} dias.`);
}

window.salvarEdicaoDivina = async function (userId, tentativasAtuais) {
    const tit = document.getElementById(`tit-${userId}`).value;
    const lvl = parseInt(document.getElementById(`lvl-${userId}`).value) || 1;
    const pts = parseInt(document.getElementById(`pts-${userId}`).value) || 0;
    const addEss = parseInt(document.getElementById(`ess-${userId}`).value) || 0;

    let updates = { titulo: tit, nivel: lvl, pontosTotais: pts };
    if (addEss > 0) updates.tentativas = tentativasAtuais + addEss;

    await db.collection("usuarios").doc(userId).update(updates);
    if (typeof showToast === 'function') showToast(`Ficha de ${userId} editada com sucesso!`, "success");
    renderListaJogadoresAdm();
}
// ---- MOTOR DA LISTA DE HABITANTES ONLINE ----
async function atualizarPresencaOnline(userId, status) {
    if (!userId || !db) return;
    try {
        await db.collection("usuarios").doc(userId).update({
            online: status,
            ultimaAtividade: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { console.error("Erro ao atualizar presença:", e); }
}

function ligarMonitorDeJogadoresOnline() {
    if (!db) return;
    db.collection("usuarios").where("online", "==", true)
        .onSnapshot(snapshot => {
            const listaUl = document.getElementById("lista-jogadores-online");
            if (!listaUl) return;

            if (snapshot.empty) {
                listaUl.innerHTML = `<li style="color: #666; font-style: italic; font-size:12px; padding: 5px 0;">Nenhum herói nas tavernas...</li>`;
                return;
            }

            let html = "";
            snapshot.forEach(doc => {
                const u = doc.data();
                const nivel = u.nivel || 1;
                const titulo = u.titulo ? ` [${u.titulo}]` : "";

                html += `
              <li style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; display: flex; align-items: center; gap: 6px;">
                  <span style="color: #5cb85c; font-size: 10px;">🟢</span> 
                  <strong style="color: #fff;">${doc.id}</strong> 
                  <span style="color: #a982ed;">(Nível ${nivel})</span>
                  <em style="font-size: 10px; color: #d4af37;">${titulo}</em>
              </li>`;
            });
            listaUl.innerHTML = html;
        }, erro => {
            console.log("Erro ao escutar jogadores online:", erro);
        });
}

// ---- SISTEMA DE SAÍDA SEGURA ----
window.deslogarSistema = async function () {
    if (!usuarioLogado) return;
    try {
        await atualizarPresencaOnline(usuarioLogado, false);
        usuarioLogado = null;
        userDataGlobal = null;
        if (typeof showToast === "function") showToast("Saindo da taverna medieval...", "info");
        setTimeout(() => { window.location.reload(); }, 1000);
    } catch (e) {
        window.location.reload();
    }
}

// Ouvinte para interceptar cliques e tocar som de alaúde medieval
document.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON" || e.target.classList.contains("nav-btn") || e.target.classList.contains("btn-primario")) {
        if (typeof tocarSomBotao === "function") tocarSomBotao();
    }
});

// ==========================================
// MOTOR DE ÁUDIO MEDIEVAL (Global)
// ==========================================
window.somPermitido = true; // Agora é global e reconhecido em todo o lado!

window.toggleSom = function () {
    window.somPermitido = !window.somPermitido;
    const btn = document.getElementById("btn-som-nav");
    if (btn) btn.innerText = window.somPermitido ? "🎵 Som: Ligado" : "🔇 Som: Mudo";
}

window.tocarSomBotao = function () {
    if (!window.somPermitido) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [440, 554.37].forEach((freq, i) => {
            setTimeout(() => {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.25);
            }, i * 40);
        });
    } catch (e) { }
}

document.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON" || e.target.classList.contains("nav-btn")) {
        window.tocarSomBotao();
    }
});

// ==========================================
// SISTEMA ONLINE E DESLOGAR (Global)
// ==========================================
window.atualizarPresencaOnline = async function (userId, status) {
    if (!userId || !db) return;
    try { await db.collection("usuarios").doc(userId).update({ online: status }); } catch (e) { }
}

function escutarChatFirebase() {
    if (!db) return;
    db.collection("chat_global").orderBy("timestamp", "desc").limit(30).onSnapshot(snap => {
        const box = document.getElementById("chat-box-mensagens");
        // ESCUDO: Se a caixa do chat não estiver na tela, não faz nada e não quebra!
        if (!box) return;

        let html = "";
        const mensagens = [];
        snap.forEach(doc => mensagens.unshift(doc.data()));
        mensagens.forEach(m => {
            html += `<div class="msg-linha"><strong style="color:#d4af37;">${m.tituloEAfim || ''}${m.autor}${m.sufixo || ''}</strong>: ${m.texto}</div>`;
        });

        const boxWasEmpty = box.innerHTML === "";
        box.innerHTML = html;
        if (!boxWasEmpty && !chatAberto && typeof atualizarBadgeChat === "function") atualizarBadgeChat('global');
        if (typeof scrollToBottom === "function") scrollToBottom();
    });
}
window.ligarMonitorDeJogadoresOnline = function () {
    if (!db) return;
    db.collection("usuarios").where("online", "==", true).onSnapshot(snapshot => {
        const listaUl = document.getElementById("lista-jogadores-online");
        // ESCUDO: Se a lista não existir, previne o erro innerHTML null
        if (!listaUl) return;

        if (snapshot.empty) { listaUl.innerHTML = `<li>Nenhum herói online...</li>`; return; }

        let html = "";
        snapshot.forEach(doc => {
            const u = doc.data();
            const nivel = u.nivel || 1;
            const titulo = u.titulo ? ` [${u.titulo}]` : "";
            html += `<li style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;">
                <span style="color: #5cb85c;">🟢</span> <strong style="color: #fff;">${doc.id}</strong> 
                <span style="color: #a982ed;">(Nível ${nivel})</span> <em style="color: #d4af37;">${titulo}</em>
            </li>`;
        });
        listaUl.innerHTML = html;
    });
}
window.girarRoleta3D = async function (qtd) {
    // 1. Evita o Mestre ou bugs girarem sem itens no jogo
    if (typeof ehAdmin !== 'undefined' && ehAdmin || todosElementosLista.length === 0) return;

    const userRef = db.collection("usuarios").doc(usuarioLogado);
    const doc = await userRef.get();
    let u = doc.data();

    // Sincroniza a verificação 
   // LINHA NOVA BLINDADA:
let essenciasAtuais = Math.max(u.rolagens || 0, u.tentativas || 0);

    if (essenciasAtuais < qtd) {
        if (typeof showToast === "function") showToast("Essências Insuficientes!", "error");
        else alert("Essências Insuficientes!");
        return;
    }

    // 2. Desativa os botões para evitar flood
    document.getElementById("btn-girar").disabled = true;
    let btn10 = document.getElementById("btn-sortear-10");
    if (btn10) btn10.disabled = true;

    // 3. Cálculos Matemáticos do Sorteio (Sem mexer no HTML da roleta antiga)
    let resFinais = [];
    let soma = 0;
    Object.keys(taxas).forEach(c => soma += parseFloat(taxas[c] || 0));
    const ord = Object.keys(taxas).sort((a, b) => taxas[b] - taxas[a]);
    let pity = u.pityCounter || 0;

    for (let r = 0; r < qtd; r++) {
        let rnd = Math.random() * soma; let cat = ord[ord.length - 1]; let ac = 0;
        for (let c of ord) { ac += parseFloat(taxas[c] || 0); if (rnd <= ac) { cat = c; break; } }

        if (configGlobais.eventoAtivo && configGlobais.bannerRateUp === cat) {
            if (Math.random() < 0.3) { cat = configGlobais.bannerRateUp; }
        }

        let isRaro = (taxas[cat] || 100) < 11;
        if (!isRaro && pity >= (configGlobais.pityMax - 1)) {
            const raras = ord.filter(c => (taxas[c] || 100) < 11);
            if (raras.length > 0) { cat = raras[Math.floor(Math.random() * raras.length)]; isRaro = true; }
        }
        let lista = afinidades[cat] || todosElementosLista;
        const item = lista[Math.floor(Math.random() * lista.length)];
        if (isRaro) pity = 0; else pity++;
        resFinais.push({ item: item, cat: cat, raro: isRaro });
    }

    // 4. A ROLETA 3D (Efeitos Visuais e Áudio de Giro)
    const roleta3D = document.getElementById("roleta-visual");
    roleta3D.classList.add("girando");

    const afinidadesPossiveis = todosElementosLista.map(el => el.nome);
    let piscar = 0;

    // Inicia a animação 3D de nomes a piscar
    const loopVisual3D = setInterval(() => {
        roleta3D.innerHTML = `<span style="font-size:18px; font-weight:bold; text-shadow: 1px 1px 5px #000; text-align:center;">${afinidadesPossiveis[piscar % afinidadesPossiveis.length]}</span>`;
        piscar++;
    }, 120);

    // Som de "tick" se o tiveres
    let intvTicks = setInterval(() => { if (typeof somTickRoleta === "function") somTickRoleta(); }, 110);

    // Toca a música de roletar e COLOCA EM LOOP
    const audioGiro = document.getElementById("audio-roletando");
    if (audioGiro && window.somPermitido !== false) {
        audioGiro.volume = 0.5;
        audioGiro.currentTime = 0;
        audioGiro.loop = true;
        audioGiro.play().catch(e => console.log("Áudio bloqueado"));
    }

    // 5. O FINAL DO GIRO E SALVAR NA NUVEM
    setTimeout(async () => {
        // 🛑 1. PARAR TODAS AS ANIMAÇÕES PRIMEIRO
        clearInterval(loopVisual3D);
        if (typeof intvTicks !== 'undefined') clearInterval(intvTicks);

        roleta3D.classList.remove("girando");
        roleta3D.innerHTML = qtd === 1 ? `<span style="font-size:14px; text-align:center; color:${resFinais[0].raro ? '#d4af37' : '#fff'};">${resFinais[0].item.nome}</span>` : "🔮";

        // 🛑 2. FORÇAR A PARAGEM DO ÁUDIO DE GIRO (com reset de tempo)
        const audioGiroObj = document.getElementById("audio-roletando");
        if (audioGiroObj) {
            audioGiroObj.pause();
            audioGiroObj.currentTime = 0; // Obriga a voltar ao início
            audioGiroObj.loop = false;    // Corta o loop à força
        }

        // Verifica se o jogador ganhou um item raro ou não
        const ganhouRaro = resFinais.some(res => res.raro === true);

        // Puxa o áudio correspondente do HTML
        const somFinal = document.getElementById(ganhouRaro ? "audio-sucesso" : "audio-fail");

        if (somFinal) {
            somFinal.currentTime = 0; // Garante que começa do zero
            somFinal.loop = false;    // Trava de segurança contra o loop infinito
            somFinal.play().catch(e => console.log("O navegador bloqueou o áudio:", e));
        }

        // Reativa os botões da interface
        document.getElementById("btn-girar").disabled = false;
        if (btn10) btn10.disabled = false;

        // Monta o HTML do resultado
        let htm = ""; let dStr = new Date().toLocaleDateString();
        for (let res of resFinais) {
            if (!u.historico) u.historico = [];
            u.historico.push({ categoria: res.cat, afinidade: res.item.nome, data: dStr });
            let cor = res.raro ? "#d4af37" : "#e2d7f3";
            htm += `<div style='padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:${cor}; font-weight:bold;'>${res.item.nome} (${res.cat})</div>`;
        }

        // Tenta fazer o update no Firebase e CAPTURA erros
        try {
            let totalGirosAtual = (u.totalGiros || 0) + qtd;
            let novoNivel = Math.min(configGlobais.nivelMax || 99, Math.floor(1 + (totalGirosAtual / 25)));
            let novoValorEssencias = Math.max(0, essenciasAtuais - qtd);

            // Pega a ÚLTIMA afinidade tirada na roleta para equipar automaticamente
            let ultimaAfinidadeSorteada = resFinais[resFinais.length - 1].item.nome;

            // Envia tudo condensado numa única chamada ao banco de dados
            await userRef.update({
                rolagens: novoValorEssencias,
                tentativas: novoValorEssencias,
                historico: u.historico,
                totalGiros: totalGirosAtual,
                totalRaros: (u.totalRaros || 0) + (resFinais.filter(x => x.raro).length),
                scorePrestigio: totalGirosAtual * 10,
                pityCounter: pity,
                nivel: novoNivel,
                tituloEquipado: ultimaAfinidadeSorteada // Atualiza o equipamento aqui com segurança!
            });

            // Mostra os resultados na tela principal
            const caixaResultados = document.getElementById("conteudo-resultados-lista");
            if (caixaResultados) caixaResultados.innerHTML = htm;
            const divResultados = document.getElementById("resultado");
            if (divResultados) divResultados.style.display = "block";

            // Atualiza a tela imediatamente para refletir o desconto das essências
            const divEssencias = document.getElementById("qtd-essencias-tela");
            if (divEssencias) divEssencias.innerText = novoValorEssencias;

            // Atualiza a interface geral do jogador
            if (typeof atualizarInterfaceJogador === "function") atualizarInterfaceJogador();

            // Abre automaticamente o painel exibindo o buff da nova afinidade APÓS a animação terminar
            if (typeof verMinhaAfinidade === "function") {
                verMinhaAfinidade(ultimaAfinidadeSorteada);
            }

        } catch (erro) {
            console.error("Erro ao salvar o giro:", erro);
            if (typeof showToast === "function") showToast("Erro ao gravar destino!", "error");
            else alert("Erro ao salvar no banco de dados. Verifica as tuas permissões do Firebase!");
        }
    }, 4600); // Fim dos 4.6 segundos de suspense
};
// ==========================================
// MÚSICA MEDIEVAL (Forçada a Tocar)
// ==========================================
window.tocarMusicaFundo = function () {
    const musicaPlayer = document.getElementById("musica-medieval");
    if (musicaPlayer && window.somPermitido) {
        musicaPlayer.volume = 0.3; // Deixa o som agradável
        // Tenta dar play quando o jogador entra
        musicaPlayer.play().catch(e => console.log("Navegador bloqueou áudio inicial."));
    }
}

window.toggleSom = function () {
    window.somPermitido = !window.somPermitido;
    const btn = document.getElementById("btn-som-nav");
    const musicaPlayer = document.getElementById("musica-medieval");
    if (window.somPermitido) {
        btn.innerText = "🎵 Som: Ligado";
        if (musicaPlayer) musicaPlayer.play();
    } else {
        btn.innerText = "🔇 Som: Mudo";
        if (musicaPlayer) musicaPlayer.pause();
    }
}
async function adminGerenciarUsuario(idUsuarioAlvo) {
    if (!ehAdmin) {
        alert("Acesso Negado.");
        return;
    }

    // Procura o usuário no Firebase
    const ref = db.collection("usuarios").doc(idUsuarioAlvo);
    const doc = await ref.get();

    if (!doc.exists) {
        alert("Usuário não encontrado!");
        return;
    }

    const u = doc.data();
  
let essenciasAtuais = Math.max(u.rolagens || 0, u.tentativas || 0);
    let afinidadeAtual = u.afinidadeEquipada || "Nenhuma";

    // Pede ao Admin os novos dados via Prompt (Interface rápida)
    // Numa versão final podes criar um HTML bonitinho para isto
    let novasEssencias = prompt(`Quantas essências o jogador ${idUsuarioAlvo} deve ter? (Atualmente: ${essencias})`, essencias);
    if (novasEssencias === null) return; // Cancelou

    let novaAfinidade = prompt(`Qual afinidade equipar? (Atualmente: ${afinidadeAtual})`, afinidadeAtual);
    if (novaAfinidade === null) return; // Cancelou

    // Salva as alterações
    try {
        await ref.update({
            rolagens: parseInt(novasEssencias),
            tentativas: parseInt(novasEssencias),
            afinidadeEquipada: novaAfinidade
        });
        alert(`Sucesso! Jogador atualizado.\nEssências: ${novasEssencias}\nAfinidade: ${novaAfinidade}`);
    } catch (erro) {
        console.error("Erro ao atualizar jogador:", erro);
        alert("Erro ao salvar os dados.");
    }
}
window.tocarMusicaFundo = function () {
    const musica = document.getElementById("musica-medieval");
    if (musica && window.somPermitido) {
        musica.volume = 0.3; // Volume agradável para não assustar o jogador
        // O play() funciona aqui porque ocorreu após o 'click' do usuário no botão de login
        musica.play().catch(e => console.log("O navegador bloqueou o áudio: ", e));
    }
}
function iniciarVigiaDePresenca() {
    let tempoInativo = 0;
    const LIMITE_MINUTOS = 10;

    // Reseta o relógio sempre que o jogador mexer o mouse, clicar ou digitar
    window.addEventListener('mousemove', () => tempoInativo = 0);
    window.addEventListener('click', () => tempoInativo = 0);
    window.addEventListener('keypress', () => tempoInativo = 0);

    // Checa inatividade a cada 1 minuto (60.000 ms)
    setInterval(() => {
        if (usuarioLogado) {
            tempoInativo++;
            if (tempoInativo >= LIMITE_MINUTOS) {
                console.log("Jogador inativo. Deslogando...");
                deslogarSistema();
            }
        }
    }, 60000);

    // Força o status offline se o jogador fechar a aba abruptamente
    window.addEventListener('beforeunload', (e) => {
        if (usuarioLogado) {
            // Chamada síncrona/direta para garantir envio antes da página morrer
            db.collection("usuarios").doc(usuarioLogado).update({ online: false });
        }
    });
}
// Função para visualizar os buffs da afinidade atual
window.verMinhaAfinidade = async function (afinidadeForcada = null) {
    if (!usuarioLogado) return;

    let afAtual = afinidadeForcada;

    // Se não for passado um nome direto, busca do banco de dados qual está equipada
    if (!afAtual) {
        const doc = await db.collection("usuarios").doc(usuarioLogado).get();
        const u = doc.data();
        afAtual = u.tituloEquipado;
    }

    const modal = document.getElementById('modal-afinidade');
    const titulo = document.getElementById('modal-afinidade-titulo');
    const buffs = document.getElementById('modal-afinidade-buffs');

    if (!afAtual) {
        titulo.innerText = "Nenhuma Afinidade";
        buffs.innerHTML = "Você é uma casca vazia. Gire a roleta para obter uma afinidade!";
    } else {
        // Busca os atributos da afinidade na lista global existente
        const item = todosElementosLista.find(e => e.nome === afAtual);

        if (item) {
            titulo.innerHTML = `✨ ${item.nome}`;
            buffs.innerHTML = `
                <div style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 6px; border: 1px solid #4a2d7a; margin-top: 10px;">
                    <p style="color: #5cb85c; margin: 0 0 10px 0; font-size: 14px;">
                        <strong>💪 Bônus de Atributos:</strong><br> 
                        ${item.bonus}
                    </p>
                    <p style="color: #a982ed; margin: 0; font-size: 13px;">
                        <strong>🔮 Passiva Única:</strong><br> 
                        <i>"${item.passiva}"</i>
                    </p>
                </div>
            `;
        } else {
            titulo.innerText = "Afinidade: " + afAtual;
            buffs.innerHTML = "Atributos ocultos ou perdidos no tempo.";
        }
    }

    // Exibe o modal
    modal.style.display = 'block';
}
// ==========================================
// SISTEMA DE RANKING (CORRIGIDO)
// ==========================================
function abrirRanking() {
    // 1. Corrigido para buscar o ID exato que está no HTML
    const modalRanking = document.getElementById("modal-ranking");
    
    if (modalRanking) {
        // 2. Corrigido para alterar o style diretamente, já que o HTML usa CSS inline
        modalRanking.style.display = "block";
        showToast("Carregando mural das lendas...", "sucesso");
        
        // 3. Renderiza os dados do Firebase
        if (typeof renderizarRankingGlobal === "function") {
            renderizarRankingGlobal();
        }
    } else {
        showToast("Erro: Elemento de ranking não encontrado.", "error");
    }
}
// ==========================================
// EFEITOS DE DOPAMINA
// ==========================================

// Para funcionar bem, você precisa colocar links reais de áudio (MP3/WAV) nas URLs abaixo
const sonsGacha = {
    girando: new Audio("https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg"), // Som provisório
    lendario: new Audio("https://actions.google.com/sounds/v1/magic/magic_chime.ogg") // Som provisório
};

function dispararEfeitoLendario() {
    if (window.somPermitido) {
        sonsGacha.lendario.volume = 0.8;
        sonsGacha.lendario.play().catch(e => console.log("Áudio bloqueado."));
    }

    // Tremer o body da página
    document.body.classList.add("efeito-lendario");

    // Remove o tremor após a animação acabar (1 segundo)
    setTimeout(() => {
        document.body.classList.remove("efeito-lendario");
    }, 1000);
}
// Função para abrir o Reportar Bug (Garante que não abra o de ADM junto)
function abrirModalFeedback() {
    const modalBug = document.getElementById("modal-feedback"); // ou o ID correto do seu modal de bugs
    if (modalBug) {
        modalBug.classList.remove("hidden");
        
        // Garante que o do ADM feche se estiver aberto
        const modalAdm = document.getElementById("modal-adm") || document.querySelector(".modal-adm-box");
        if (modalAdm) modalAdm.classList.add("hidden");
    } else {
        showToast("Erro: Modal de reporte não encontrado.", "error");
    }
}
// Navegação suave interna do painel
function rolarParaSistema(idSistema) {
    const elemento = document.getElementById(idSistema);
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// 📢 SISTEMA DE AVISO GLOBAL (EXIBIÇÃO ÚNICA)
// ==========================================
function enviarAvisoGlobalSupremo() {
    const texto = document.getElementById("adm-texto-aviso-global").value;
    if (!texto) return showToast("Digite uma mensagem!", "error");

    // Salva na raiz do Firebase com um ID de timestamp único
    const novoAvisoId = "aviso_" + Date.now();
    db.collection("configuracoes_globais").doc("decreto_mestre").set({
        idAviso: novoAvisoId,
        mensagem: texto,
        criadoEm: new Date()
    }).then(() => {
        showToast("Decreto Real enviado para todo o servidor!", "success");
        document.getElementById("adm-texto-aviso-global").value = "";
    });
}

// LÓGICA DE LEITURA DO JOGADOR (Adicionar no fluxo de entrada do jogador comum)
// Quando o jogador logar, o JS verifica se o idAviso atual já foi visto localmente (localStorage)
function checarDecretoPendenteDoMestre(dadosAvisoDoFirebase) {
    const vistoLocal = localStorage.getItem("ultimo_aviso_visto");
    if (vistoLocal !== dadosAvisoDoFirebase.idAviso) {
        // Exibe o aviso em tela de forma persistente ou modal
        alert(`📜 DECRETO DO MESTRE:\n\n${dadosAvisoDoFirebase.mensagem}`);
        // Grava no navegador do jogador para nunca mais abrir esse aviso específico
        localStorage.setItem("ultimo_aviso_visto", dadosAvisoDoFirebase.idAviso);
    }
}

// ==========================================
// ⚖️ TRIBUNAL: BANIMENTO DIRETO DA DENÚNCIA
// ==========================================
function banirUsuarioDireto(nomeUsuario, idDenuncia) {
    if (confirm(`Tem certeza que deseja banir PERMANENTEMENTE a alma de ${nomeUsuario}?`)) {
        // Altera o status do jogador para banido no banco
        db.collection("usuarios").doc(nomeUsuario).update({
            banido: true,
            statusAtivo: "Banido no Limbo"
        }).then(() => {
            // Remove ou atualiza a denúncia
            db.collection("denuncias").doc(idDenuncia).delete();
            showToast(`${nomeUsuario} foi banido com sucesso!`, "success");
            // Atualiza o feed em tempo real
            db.collection("logs_mundo").add({
                acao: `⚡ O Mestre baniu a alma de ${nomeUsuario} do servidor!`,
                data: new Date()
            });
        });
    }
}

// ==========================================
// 🐛 BUG REPORTS COM RESPOSTA INLINE
// ==========================================
function responderBugReport(idBug) {
    const inputResposta = document.getElementById(`resposta-bug-${idBug}`);
    if (!inputResposta || !inputResposta.value) return showToast("Escreva uma resposta!", "error");

    db.collection("bugs").doc(idBug).update({
        respostaMestre: inputResposta.value,
        status: "Resolvido/Respondido",
        respondidoEm: new Date()
    }).then(() => {
        showToast("Resposta enviada para a caixa de correio do jogador!", "success");
    });
}
// BANIR DIRETAMENTE DA TELA DE DENÚNCIAS
function banirUsuarioDireto(nomeUsuario, idDenuncia) {
    if (!nomeUsuario) return;
    if (confirm(`Deseja banir a alma de ${nomeUsuario} permanentemente?`)) {
        db.collection("usuarios").doc(nomeUsuario).update({
            banido: true
        }).then(() => {
            if (idDenuncia) db.collection("denuncias").doc(idDenuncia).delete();
            showToast(`${nomeUsuario} foi banido!`, "success");
        });
    }
}

// ENVIAR AVISO GLOBAL (Salva no Firebase para ler no login dos players)
function enviarAvisoGlobalSupremo() {
    const texto = document.getElementById("adm-texto-aviso-global").value;
    if (!texto) return showToast("Escreva o aviso!", "error");

    const idAvisoUnico = "aviso_" + Date.now();
    db.collection("configuracoes_globais").doc("decreto_mestre").set({
        idAviso: idAvisoUnico,
        mensagem: texto,
        enviadoEm: new Date()
    }).then(() => {
        showToast("Decreto Real publicado!", "success");
        document.getElementById("adm-texto-aviso-global").value = "";
    });
}

// CRIAR NOVA MISSÃO COM DIFICULDADE PERSONALIZADA
function criarNovaMissaoMestre() {
    const titulo = document.getElementById("adm-missao-titulo").value;
    const dificuldade = document.getElementById("adm-missao-dificuldade").value;
    
    if (!titulo) return showToast("Dê um nome à missão!", "error");

    db.collection("missoes").add({
        titulo: titulo,
        dificuldade: dificuldade,
        criadoEm: new Date(),
        status: "Ativa"
    }).then(() => {
        showToast(`Missão [${dificuldade}] lançada com sucesso!`, "success");
        document.getElementById("adm-missao-titulo").value = "";
    });
}
let usuarioChatAtivo = null;
let listenerChatAtual = null;
let conversasAbertas = new Set();

// 1. CHAME ESTA FUNÇÃO LOGO APÓS O LOGIN DO JOGADOR (ex: dentro de entrarNoSistema)
function liberarBotaoSussurroDoJogo() {
    const btn = document.getElementById("btn-abrir-sussurros");
    if (btn) btn.style.display = "inline-block"; // Torna o botão visível após login
}

// 2. Abre ou fecha a janela inteira do Chat de Sussurros
function togglePainelSussurros() {
    const painel = document.getElementById("sussurro-chat-panel");
    if (!painel) return;
    
    if (painel.style.display === "none" || painel.style.display === "") {
        painel.style.display = "block";
        renderizarAbasLaterais();
    } else {
        painel.style.display = "none";
    }
}

// 3. Auxiliar para criar IDs determinísticas das salas no Firebase
function gerarSalaId(user1, user2) {
    return [user1, user2].sort().join("_");
}

// 4. Abre o canal de comunicação direto com um jogador
function abrirConversaCom(nomeDestinatario) {
    if (!nomeDestinatario || nomeDestinatario === usuarioLogado) return;

    usuarioChatAtivo = nomeDestinatario;
    conversasAbertas.add(nomeDestinatario);

    // [MOBILE] Se estiver no telemóvel, aplica a classe para dar o efeito de troca de tela
    const painel = document.getElementById("sussurro-chat-panel");
    if (window.innerWidth <= 768) {
        painel.classList.add("mobile-ver-conversa");
    }

    renderizarAbasLaterais();

    // Libera a escrita
    document.getElementById("input-msg-privada").disabled = false;
    document.getElementById("btn-enviar-privado").disabled = false;
    document.getElementById("input-msg-privada").placeholder = `Sussurrar para ${nomeDestinatario}...`;
    document.getElementById("nome-usuario-ativo").innerText = nomeDestinatario;

    // Desliga escutas de mensagens antigas para não misturar dados
    if (listenerChatAtual) listenerChatAtual();

    const salaId = gerarSalaId(usuarioLogado, usuarioChatAtivo);

    // Conecta em tempo real ao Firebase
    listenerChatAtual = db.collection("chats_privados").doc(salaId)
        .collection("mensagens")
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshot => {
            const caixa = document.getElementById("sussurro-mensagens");
            caixa.innerHTML = "";

            if (snapshot.empty) {
                caixa.innerHTML = `<div class="aviso-inicial">Início do sussurro seguro com ${nomeDestinatario}.</div>`;
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const classeMsg = data.remetente === usuarioLogado ? "minha" : "dele";
                
                const divMsg = document.createElement("div");
                divMsg.className = `balao-msg ${classeMsg}`;
                divMsg.innerText = data.texto;
                caixa.appendChild(divMsg);
            });

            caixa.scrollTop = caixa.scrollHeight; // Rola até o final das mensagens
        });
}

// 5. Botão de voltar exclusivo para Smartphones
function voltarParaListaMobile() {
    const painel = document.getElementById("sussurro-chat-panel");
    painel.classList.remove("mobile-ver-conversa");
    usuarioChatAtivo = null;
    if (listenerChatAtual) listenerChatAtual(); // Desconecta o ouvinte temporariamente
}

// 6. Atualiza a lista lateral de conversas
function renderizarAbasLaterais() {
    const container = document.getElementById("lista-conversas-ativas");
    container.innerHTML = "";

    if (conversasAbertas.size === 0) {
        container.innerHTML = `<div style="padding:15px; text-align:center; color:#555; font-size:12px;">Nenhuma conversa aberta.</div>`;
        return;
    }

    conversasAbertas.forEach(nome => {
        const classeAtiva = nome === usuarioChatAtivo ? "aba-conversa ativa" : "aba-conversa";
        const divAba = document.createElement("div");
        divAba.className = classeAtiva;
        divAba.innerHTML = `👤 ${nome}`;
        divAba.onclick = () => abrirConversaCom(nome);
        container.appendChild(divAba);
    });
}

// 7. Dispara ao clicar no botão "➕"
function abrirSussurroPorInput() {
    const input = document.getElementById("input-novo-alvo");
    const nome = input.value.trim();
    if (nome) {
        abrirConversaCom(nome);
        input.value = "";
    }
}

async function enviarMensagemPrivada() {
    const input = document.getElementById("input-msg-privada");
    const texto = input.value.trim();
    if (!texto || !usuarioChatAtivo) return;

    const salaId = gerarSalaId(usuarioLogado, usuarioChatAtivo);

    try {
        // 1. Grava a mensagem na sala (O teu código atual)
        await db.collection("chats_privados").doc(salaId).collection("mensagens").add({
            remetente: usuarioLogado,
            destinatario: usuarioChatAtivo,
            texto: texto,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = "";

        // 2. NOVA PARTE: "Toca a campainha" do destinatário para ele saber que chegou mensagem
        await db.collection("notificacoes_sussurro").doc(usuarioChatAtivo).set({
            remetenteAtivo: usuarioLogado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            novaMensagem: true
        });

    } catch (erro) {
        console.error("Erro ao enviar mensagem privada:", erro);
    }
}
function escutarNovosSussurrosGlobais() {
    if (!usuarioLogado) return;

    db.collection("notificacoes_sussurro").doc(usuarioLogado)
        .onSnapshot(doc => {
            if (doc.exists) {
                const dados = doc.data();
                
                if (dados.novaMensagem && dados.remetenteAtivo) {
                    // Adiciona a pessoa à lista lateral automaticamente
                    conversasAbertas.add(dados.remetenteAtivo);
                    renderizarAbasLaterais();

                    // Verifica se o painel está fechado ou se estamos a falar com outra pessoa
                    const painel = document.getElementById("sussurro-chat-panel");
                    if (painel.style.display === "none" || painel.style.display === "" || usuarioChatAtivo !== dados.remetenteAtivo) {
                        // Mostra a bolinha vermelha!
                        document.getElementById("notificacao-sussurro-geral").style.display = "inline";
                    }

                    // Apaga o alerta no banco para não ficar a piscar repetidamente
                    db.collection("notificacoes_sussurro").doc(usuarioLogado).update({ novaMensagem: false });
                }
            }
        });
}
function togglePainelSussurros() {
    const painel = document.getElementById("sussurro-chat-panel");
    if (!painel) return;
    
    if (painel.style.display === "none" || painel.style.display === "") {
        painel.style.display = "block";
        document.getElementById("notificacao-sussurro-geral").style.display = "none"; // Apaga a bolinha!
        renderizarAbasLaterais();
    } else {
        painel.style.display = "none";
    }
}