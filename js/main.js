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
// Atualiza a presença online ao logar e sincroniza o mundo
async function atualizarPresencaOnline(userId) {
    if (!userId) return;

    // 1. Atualiza o status do jogador
    await db.collection("usuarios").doc(userId).update({
        online: true,
        ultimaAtividade: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. Puxa as Raças, Classes e Afinidades Novas da Forja!
    await sincronizarMatrizesDaForja();
}
// Funções únicas de controle do Grimório Pessoal
function fecharGrimorioPessoal() {
    const modal = document.getElementById('modal-grimorio-titulos');
    if (modal) modal.classList.add('hidden');
}

async function abrirGrimorioPessoal() {
    if (!usuarioLogado) {
        alert("⚠️ Você precisa estar logado para abrir seu Grimório!");
        return;
    }

    const container = document.getElementById("lista-titulos-grimorio");
    if (!container) return;

    container.innerHTML = "<span style='color: #aaa; font-size: 12px;'>Abrindo registros antigos...</span>";

    // Abre o modal na tela
    const modal = document.getElementById('modal-grimorio-titulos');
    if (modal) modal.classList.remove('hidden');

    try {
        // Busca os dados do jogador atual logado
        const doc = await db.collection("usuarios").doc(usuarioLogado).get();

        if (!doc.exists) {
            container.innerHTML = "<span style='color: #d9534f;'>Alma não encontrada no banco.</span>";
            return;
        }

        const d = doc.data();
        const listaTitulos = d.grimorio || [];
        const tituloAtivo = d.titulo || "";

        if (listaTitulos.length === 0) {
            container.innerHTML = "<span style='color: #777; font-size: 13px; font-style: italic; text-align: center; display:block; margin: 20px 0;'>Você ainda não conquistou nenhum título nesta jornada...</span>";
            return;
        }

        let html = "";
        listaTitulos.forEach(t => {
            const ehOAtivo = (t === tituloAtivo);

            html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: ${ehOAtivo ? 'rgba(212,175,55,0.15)' : '#1a1525'}; border: 1px solid ${ehOAtivo ? '#d4af37' : '#4a3b69'}; padding: 10px; border-radius: 6px;">
                <span style="color: ${ehOAtivo ? '#ffd700' : '#fff'}; font-weight: bold; font-size: 14px;">👑 [${t}]</span>
                ${ehOAtivo ?
                    `<span style="color: #d4af37; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Ativo</span>` :
                    `<button class="btn-sucesso-pequeno" style="padding: 4px 10px; font-size: 11px; background: #4a3b69; border-color:#a982ed;" onclick="equiparTituloDoGrimorio('${t}')">Equipar</button>`
                }
            </div>`;
        });

        container.innerHTML = html;

    } catch (erro) {
        console.error("Erro ao ler grimório de títulos:", erro);
        container.innerHTML = "<span style='color: #d9534f;'>Falha ao ler o Grimório Místico.</span>";
    }
}

// Função para o jogador equipar qualquer título antigo que esteja guardado no grimório dele!
async function equiparTituloDoGrimorio(tituloEscolhido) {
    if (!usuarioLogado) return;

    try {
        await db.collection("usuarios").doc(usuarioLogado).update({
            titulo: tituloEscolhido
        });

        // Atualiza a interface da HUD na hora (se houver a função)
        if (typeof atualizarInterfaceJogador === "function") atualizarInterfaceJogador();

        // Atualiza o visual interno do grimório para mostrar o novo título ativo instantaneamente
        abrirGrimorioPessoal();

    } catch (e) {
        console.error("Erro ao equipar título do grimório:", e);
        alert("🔥 O Oráculo não conseguiu alterar seu título ativo.");
    }
}
function toggleCorreioAdmin() {
    const modalCorreio = document.getElementById('modal-correio-admin');

    if (!modalCorreio) {
        console.error("ERRO: O elemento 'modal-correio-admin' não foi encontrado no HTML!");
        return;
    }

    // Se o modal tiver a classe 'hidden', nós a removemos para abrir. Se não tiver, adicionamos para fechar.
    if (modalCorreio.classList.contains('hidden')) {
        modalCorreio.classList.remove('hidden');
    } else {
        modalCorreio.classList.add('hidden');
    }
}
let dadosDoPresenteRecebido = null; // Guarda os dados do brinde temporariamente

// Esta função deve ser chamada logo após o login de qualquer jogador (na função entrarNoSistema)
async function checarPresentesNoReload() {
    if (!usuarioLogado) return;

    try {
        const userRef = db.collection("usuarios").doc(usuarioLogado);
        const doc = await userRef.get();

        if (doc.exists && doc.data().popupPendente) {
            dadosDoPresenteRecebido = doc.data().popupPendente;

            // Mostra a tela do presente místico fechado
            document.getElementById("tela-presente-fechado").style.display = "block";
            document.getElementById("tela-presente-aberto").style.display = "none";
            document.getElementById("modal-presente-mistico").classList.remove("hidden");

            // Limpa o gatilho imediatamente no banco para que NÃO apareça em futuros reloads
            await userRef.update({
                popupPendente: firebase.firestore.FieldValue.delete()
            });
        }
    } catch (e) {
        console.error("Erro ao checar presente pendente:", e);
    }
}

// Executada ao clicar no presente 3D gigante
function revelarPresenteMistico() {
    if (!dadosDoPresenteRecebido) return;

    // Atualiza os textos do pop-up dinamicamente
    document.getElementById("txt-presente-motivo").innerHTML = `"${dadosDoPresenteRecebido.mensagem}"`;
    document.getElementById("ganho-essencias").innerText = `🔮 +${dadosDoPresenteRecebido.essencias} Essências (Tentativas)`;

    const divTitulo = document.getElementById("ganho-titulo");
    if (dadosDoPresenteRecebido.titulo) {
        divTitulo.innerText = `👑 Novo Título: [${dadosDoPresenteRecebido.titulo}]`;
        divTitulo.style.display = "block";
    } else {
        divTitulo.style.display = "none";
    }

    // Faz a transição de telas com efeito visual
    document.getElementById("tela-presente-fechado").style.display = "none";
    document.getElementById("tela-presente-aberto").style.display = "block";
}

// Fecha o modal inteiro e atualiza a HUD na tela
function fecharPresenteMistico() {
    document.getElementById("modal-presente-mistico").classList.add("hidden");

    // Atualiza o saldo de essências visível na tela imediatamente
    if (typeof atualizarInterfaceJogador === "function") {
        atualizarInterfaceJogador();
    } else {
        // Fallback caso você mude o texto na raça
        const divEssencias = document.getElementById("qtd-essencias-tela");
        if (divEssencias && dadosDoPresenteRecebido) {
            // Recarrega a página ou pega o novo valor real do saldo para atualizar a tela
            location.reload();
        }
    }
}
async function enviarPacoteDirecionado() {
    // 1. Captura os valores dos inputs do modal
    const playerInput = document.getElementById("correio-player-id").value.trim();
    const qtdEssencias = parseInt(document.getElementById("correio-essencias").value) || 0;
    const tituloInput = document.getElementById("correio-titulo").value.trim();
    const mensagemInput = document.getElementById("correio-mensagem").value.trim();

    // Validações
    if (!playerInput) {
        alert("⚠️ Digite o Nome do Jogador (ou nomes separados por vírgula)!");
        return;
    }
    if (qtdEssencias <= 0 && !tituloInput) {
        alert("⚠️ Você precisa enviar pelo menos algumas Essências ou um Título!");
        return;
    }

    const nomesAlvo = playerInput.split(",").map(nome => nome.trim().toLowerCase());

    if (!confirm(`Confirmar o envio dos recursos para: ${playerInput}?`)) return;

    try {
        const snap = await db.collection("usuarios").get();
        let b = db.batch();
        let contagemEncontrados = 0;

        snap.forEach(d => {
            const dadosUsuario = d.data();
            const idDoc = d.id.toLowerCase();
            const nomeExibicao = dadosUsuario.exibicao ? dadosUsuario.exibicao.toLowerCase() : "";

            if (nomesAlvo.includes(idDoc) || nomesAlvo.includes(nomeExibicao)) {
                contagemEncontrados++;

                let dadosAtualizacao = {};

                // A. Incremento das tentativas (sua lógica padrão)
                if (qtdEssencias > 0) {
                    dadosAtualizacao["tentativas"] = firebase.firestore.FieldValue.increment(qtdEssencias);
                }

                // B. Lógica do Título Ativo + Grimório
                if (tituloInput) {
                    // O título novo se torna o ativo do jogador (substituindo o antigo no perfil)
                    dadosAtualizacao["titulo"] = tituloInput;
                    // O título novo também é injetado no Grimório pessoal dele sem duplicar
                    dadosAtualizacao["grimorio"] = firebase.firestore.FieldValue.arrayUnion(tituloInput);
                }

                // C. Histórico de transações
                if (mensagemInput) {
                    const novoHistorico = {
                        categoria: "RECOMPENSA",
                        afinidade: `Mestre enviou: ${qtdEssencias}es ${tituloInput ? `+ Título [${tituloInput}]` : ''}`,
                        motivo: mensagemInput,
                        data: new Date().toLocaleDateString('pt-BR')
                    };
                    dadosAtualizacao["historico"] = firebase.firestore.FieldValue.arrayUnion(novoHistorico);
                }

                // D. Gatilho do Popup 3D
                dadosAtualizacao["popupPendente"] = {
                    essencias: qtdEssencias,
                    titulo: tituloInput || "",
                    mensagem: mensagemInput || "O Mestre enviou uma recompensa especial!"
                };

                b.update(d.ref, dadosAtualizacao);
            }
        });

        if (contagemEncontrados === 0) {
            alert(`❌ Nenhum dos jogadores informados (${playerInput}) foi encontrado no Oráculo!`);
            return;
        }

        await b.commit();
        if (tituloInput) {
            const mensagemAnuncio = `🌟 O Oráculo abençoou ${playerInput} com o título [${tituloInput}]!`;

            await db.collection("chat").add({
                canal: 'global',
                remetenteId: 'sistema',
                remetenteExibicao: 'Oráculo',
                remetenteTitulo: 'Deus',
                destinoId: '',
                texto: mensagemAnuncio,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        alert(`🎉 Recursos e o Presente Visual enviados com sucesso para ${contagemEncontrados} herói(s)!`);

        // Limpeza
        document.getElementById("correio-player-id").value = "";
        document.getElementById("correio-essencias").value = "0";
        document.getElementById("correio-titulo").value = "";
        document.getElementById("correio-mensagem").value = "";

        if (typeof fecharModalCorreioAdmin === "function") {
            fecharModalCorreioAdmin();
        }

    } catch (erro) {
        console.error("Erro ao processar correio direcionado:", erro);
        alert("🔥 Falha ao aplicar recursos no banco de dados.");
    }
}

function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.remove('hidden');
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.add('hidden');
}
// Função única para abrir o Modal do Correio Místico
function abrirModalCorreioAdmin() {
    const modalCorreio = document.getElementById('modal-correio-admin');
    if (modalCorreio) {
        modalCorreio.classList.remove('hidden');
    } else {
        console.error("ERRO: Elemento 'modal-correio-admin' não foi mapeado no DOM.");
    }
}

// Função única para fechar o Modal do Correio Místico
function fecharModalCorreioAdmin() {
    const modalCorreio = document.getElementById('modal-correio-admin');
    if (modalCorreio) {
        modalCorreio.classList.add('hidden');
    }
}
async function carregarOlhoQueTudoVe() {
    try {
        const snap = await db.collection("usuarios").get();

        if (snap.empty) {
            console.warn("Nenhum jogador encontrado para gerar estatísticas.");
            return;
        }

        let totalEssencias = 0;
        let contagemClasses = {};
        let totalJogadores = snap.size;

        // Array auxiliar para processarmos os rankings de atributos e níveis
        let listaParaRankings = [];

        snap.forEach((doc) => {
            const player = doc.data();

            // 1. Somatório das Essências (campo 'tentativas')
            const essenciasDoCara = Number(player.tentativas) || 0;
            totalEssencias += essenciasDoCara;

            // 2. Contagem de Classe
            const classeDoJogador = player.classe || "Sem Classe";
            if (!contagemClasses[classeDoJogador]) {
                contagemClasses[classeDoJogador] = 0;
            }
            contagemClasses[classeDoJogador]++;

            // 3. Coleta de dados para a Arena de Rankings
            const pts = player.pontosBase || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
            const somaAtributosTotal = Number(pts.FOR || 0) + Number(pts.VEL || 0) + Number(pts.HAB || 0) + Number(pts.RES || 0) + Number(pts.POD || 0);

            listaParaRankings.push({
                nome: player.exibicao || doc.id,
                nivel: Number(player.nivel) || 1,
                FOR: Number(pts.FOR) || 0,
                VEL: Number(pts.VEL) || 0,
                HAB: Number(pts.HAB) || 0,
                RES: Number(pts.RES) || 0,
                POD: Number(pts.POD) || 0,
                totalAtributos: somaAtributosTotal
            });
        });

        // 4. Descobrir qual a Classe REAL mais usada
        let classeMaisUsada = "Nenhuma";
        let maxEscolhas = 0;
        for (const [nomeClasse, quantidade] of Object.entries(contagemClasses)) {
            if (nomeClasse !== "Sem Classe" && quantidade > maxEscolhas) {
                maxEscolhas = quantidade;
                classeMaisUsada = nomeClasse;
            }
        }

        // ==========================================
        // 🔮 PROCESSAMENTO DOS RANKINGS (EM MEMÓRIA)
        // ==========================================

        // Top 3 Níveis
        const top3Niveis = [...listaParaRankings].sort((a, b) => b.nivel - a.nivel).slice(0, 3);

        // Líderes Supremos por Categoria de Atributo
        const campeaoFOR = [...listaParaRankings].sort((a, b) => b.FOR - a.FOR)[0];
        const campeaoVEL = [...listaParaRankings].sort((a, b) => b.VEL - a.VEL)[0];
        const campeaoHAB = [...listaParaRankings].sort((a, b) => b.HAB - a.HAB)[0];
        const campeaoRES = [...listaParaRankings].sort((a, b) => b.RES - a.RES)[0];
        const campeaoPOD = [...listaParaRankings].sort((a, b) => b.POD - a.POD)[0];

        // Jogador com mais atributos somados no total
        const deusDosAtributos = [...listaParaRankings].sort((a, b) => b.totalAtributos - a.totalAtributos)[0];

        // ==========================================
        // 🌟 INJETAR OS DADOS NO HTML COM SEGURANÇA
        // ==========================================

        const elTotalEssencias = document.getElementById("stat-total-essencias");
        if (elTotalEssencias) elTotalEssencias.innerText = totalEssencias.toLocaleString();

        const elTotalJogadores = document.getElementById("stat-total-jogadores");
        if (elTotalJogadores) elTotalJogadores.innerText = totalJogadores;

        const elClasseDominante = document.getElementById("stat-classe-dominante");
        if (elClasseDominante) elClasseDominante.innerText = classeMaisUsada;

        const elClasseDetalhe = document.getElementById("stat-classe-detalhe");
        if (elClasseDetalhe) elClasseDetalhe.innerText = `${maxEscolhas} jogadores escolheram este destino`;

        // Injetar os dados na lista do Top 3 Níveis
        const elRankNiveis = document.getElementById("rank-niveis");
        if (elRankNiveis) {
            elRankNiveis.innerHTML = top3Niveis.map((p, idx) =>
                `<li><strong style="color: #ffca28;">${idx + 1}º</strong> ${p.nome} <span style="color: #aaa;">(Nvl ${p.nivel})</span></li>`
            ).join("");
        }

        // Injetar os dados na lista de Atributos Supremas
        const elRankAtributos = document.getElementById("rank-atributos");
        if (elRankAtributos) {
            elRankAtributos.innerHTML = `
                <li>💪 <b>FOR:</b> ${campeaoFOR && campeaoFOR.FOR > 0 ? `<span style="color:#5cb85c;">${campeaoFOR.nome}</span> (${campeaoFOR.FOR})` : 'Ninguém'}</li>
                <li>⚡ <b>VEL:</b> ${campeaoVEL && campeaoVEL.VEL > 0 ? `<span style="color:#5cb85c;">${campeaoVEL.nome}</span> (${campeaoVEL.VEL})` : 'Ninguém'}</li>
                <li>🎯 <b>HAB:</b> ${campeaoHAB && campeaoHAB.HAB > 0 ? `<span style="color:#5cb85c;">${campeaoHAB.nome}</span> (${campeaoHAB.HAB})` : 'Ninguém'}</li>
                <li>🛡️ <b>RES:</b> ${campeaoRES && campeaoRES.RES > 0 ? `<span style="color:#5cb85c;">${campeaoRES.nome}</span> (${campeaoRES.RES})` : 'Ninguém'}</li>
                <li>🔮 <b>POD:</b> ${campeaoPOD && campeaoPOD.POD > 0 ? `<span style="color:#5cb85c;">${campeaoPOD.nome}</span> (${campeaoPOD.POD})` : 'Ninguém'}</li>
                <hr style="border: 0; border-top: 1px dashed #4a3b69; margin: 8px 0;">
                <li>👑 <b>Mais Forte (Total):</b> ${deusDosAtributos && deusDosAtributos.totalAtributos > 0 ? `<span style="color:#ffca28; font-weight:bold;">${deusDosAtributos.nome}</span> (${deusDosAtributos.totalAtributos} pts)` : 'Ninguém'}</li>
            `;
        }

        // Termómetro Económico
        const alertaTxt = document.getElementById("alerta-inflacao");
        if (alertaTxt) {
            if (totalEssencias > 1000000) {
                alertaTxt.innerHTML = "⚠️ <strong style='color:#d9534f;'>Inflação Crítica!</strong> Hora de taxar ou criar sumidouros.";
            } else {
                alertaTxt.innerHTML = "🟢 <strong style='color:#5cb85c;'>Economia Estável.</strong> O mercado flui bem.";
            }
        }

    } catch (error) {
        console.error("Erro ao carregar o Olho Que Tudo Vê:", error);
    }
}
// Opcional: Executa automaticamente quando o script carrega ou quando abres o painel
// carregarOlhoQueTudoVe();
// ==========================================
// 🕊️ SISTEMA DE PERDÃO (UNBAN)
// ==========================================
async function concederPerdaoDireto() {
    const nomeJogador = document.getElementById("input-perdao-nome").value.trim();

    if (!nomeJogador) {
        if (typeof showToast === "function") showToast("⚠️ Digite o nome do jogador para perdoar.", "error");
        return;
    }

    // Confirmação de segurança para o Admin
    if (!confirm(`Tens a certeza que queres conceder perdão divino a ${nomeJogador} e remover o seu banimento?`)) return;

    try {
        // Verifica se o jogador realmente existe no banco
        const doc = await db.collection("usuarios").doc(nomeJogador).get();
        if (!doc.exists) {
            if (typeof showToast === "function") showToast("❌ O Oráculo não encontrou este jogador.", "error");
            return;
        }

        // Remove especificamente o campo 'banidoAte' da conta do jogador
        await db.collection("usuarios").doc(nomeJogador).update({
            banidoAte: firebase.firestore.FieldValue.delete()
        });

        if (typeof showToast === "function") showToast(`✨ Perdão divino concedido! ${nomeJogador} está livre.`, "success");
        document.getElementById("input-perdao-nome").value = ""; // Limpa a caixinha

        // Se a lista de jogadores do painel adm estiver visível, atualiza-a
        if (typeof renderListaJogadoresAdm === "function") {
            renderListaJogadoresAdm();
        }

    } catch (error) {
        console.error("Erro ao conceder perdão:", error);
        if (typeof showToast === "function") showToast("🔥 Erro ao contactar o Oráculo.", "error");
    }
}
function atualizarDatalistCategorias() {
    const datalist = document.getElementById("lista-categorias-afinidade");
    if (!datalist) return;

    // Pega todas as categorias que o jogo possui atualmente
    const categoriasExistentes = Object.keys(afinidades);

    // Limpa as opções antigas e injeta as atualizadas
    datalist.innerHTML = categoriasExistentes.map(cat => `<option value="${cat}">`).join("");
}
async function deletarCategoria(nomeCategoria) {
    let confirmacao = confirm(`⚠️ ALERTA VERMELHO! ⚠️\nVocê está prestes a apagar a categoria [${nomeCategoria}] e TODAS as afinidades que fazem parte dela!\nTem certeza absoluta que deseja destruir tudo isso?`);
    if (!confirmacao) return;

    try {
        // 1. Deleta do Firebase (Afinidades)
        const snap = await db.collection("afinidades").where("categoria", "==", nomeCategoria).get();
        const batch = db.batch();
        snap.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 2. Deleta do Firebase (Taxas de Drop)
        await db.collection("config").doc("sistema").update({
            [`taxas.${nomeCategoria}`]: firebase.firestore.FieldValue.delete()
        });

        // 3. Limpa da memória local do JavaScript
        delete afinidades[nomeCategoria];
        if (typeof taxas !== 'undefined') delete taxas[nomeCategoria];

        // 4. Remove visualmente da tela (sem dar F5)
        // Certifique-se de que a div da sua categoria tenha um ID no seu HTML, ex: id="box-categoria-Fogo"
        const elementoVisual = document.getElementById(`box-categoria-${nomeCategoria}`);
        if (elementoVisual) {
            elementoVisual.remove();
        } else {
            // Se você não usa IDs nas divs, chame aqui a sua função principal que desenha a tela
            // Exemplo: renderizarPainel();
        }

        alert(`💥 A categoria [${nomeCategoria}] foi apagada com sucesso!`);

    } catch (error) {
        console.error("Erro ao destruir categoria:", error);
        alert("Falha ao tentar apagar a categoria. Verifique o console.");
    }
}
// ==========================================
// ✏️ SISTEMA DE EDIÇÃO
// ==========================================
function prepararEdicao(tipo, nome, dadosJSON) {
    const dados = JSON.parse(dadosJSON);

    // Abre a aba da Forja
    mudarAbaAdm('forja');

    // Configura o tipo
    document.getElementById('forja-tipo-base').value = tipo;
    alternarCamposForja(); // Atualiza a tela da forja

    // Preenche os dados comuns
    document.getElementById('forja-nome').value = nome;

    if (tipo === 'raca' || tipo === 'classe') {
        document.getElementById('forja-for').value = dados.FOR || 0;
        document.getElementById('forja-vel').value = dados.VEL || 0;
        document.getElementById('forja-hab').value = dados.HAB || 0;
        document.getElementById('forja-res').value = dados.RES || 0;
        document.getElementById('forja-pod').value = dados.POD || 0;
    } else if (tipo === 'afinidade') {
        document.getElementById('forja-categoria-afinidade').value = dados.cat;
        document.getElementById('forja-bonus').value = dados.bonus;
        document.getElementById('forja-passiva').value = dados.passiva;
    }
}
// ==========================================
// 🎨 RENDERIZAÇÃO DO PAINEL DO MESTRE (Com Edição/Exclusão)
// ==========================================

// 1. Desenha as Afinidades agrupadas (igual a imagem catr.PNG)
function carregarAfinidadesAdmin() {
    const div = document.getElementById("lista-afinidades-existentes-adm");
    div.innerHTML = "";

    for (let categoria in afinidades) {
        // Título da Categoria
        let html = `<h4 style="color:#a982ed; margin-top:10px;">[${categoria} - Matrizes]</h4><ul style="list-style:none; padding-left:0;">`;

        afinidades[categoria].forEach(af => {
            // Prepara os dados para o botão de editar poder jogar de volta na forja
            const dadosEdit = JSON.stringify({ nome: af.nome, cat: categoria, bonus: af.bonus, passiva: af.passiva }).replace(/"/g, '&quot;');

            html += `
            <li style="margin-bottom: 8px; font-size: 14px;">
                <span style="color:#fff;">${af.nome}</span> 
                <span style="color:#ccc;">(${af.bonus}) - <i style="color:#aaa;">${af.passiva}</i></span>
                
                <button onclick="prepararEdicao('afinidade', '${af.nome}', '${dadosEdit}')" style="background:transparent; border:none; cursor:pointer;" title="Editar">✏️</button>
                <button onclick="deletarMatrizDaForja('afinidade', '${af.nome}')" style="background:transparent; border:none; cursor:pointer;" title="Excluir">🗑️</button>
            </li>`;
        });
        html += `</ul>`;
        div.innerHTML += html;
    }
}

// 2. Desenha o Grid de Taxas de Drop Dinâmico
function carregarTaxasAdmin() {
    const grid = document.getElementById("grid-taxas-admin");
    grid.innerHTML = "";

    // Adiciona categorias novas que não estão nas taxas padrão com valor 0%
    for (let categoria in afinidades) {
        if (taxas[categoria] === undefined) {
            taxas[categoria] = 0.0;
        }
    }

    // Desenha os inputs
    for (let cat in taxas) {
        grid.innerHTML += `
        <div style="background:#1a1525; padding:5px; border:1px solid #3c1e69; border-radius:4px; text-align:center;">
            <label style="font-size:12px; display:block; color:#d4af37;">${cat}</label>
            <input type="number" id="taxa-${cat}" value="${taxas[cat]}" style="width:100%; text-align:center; padding:3px;" step="0.1">
        </div>`;
    }
}

// 3. Desenha as Tabelas de Raças e Classes
function carregarTabelasRacasClasses() {
    // Raças
    document.getElementById("th-racas").innerHTML = "<tr><th>Nome</th><th>Atributos</th><th>Ação</th></tr>";
    const tbRacas = document.getElementById("tb-racas");
    tbRacas.innerHTML = "";

    for (let nome in racasAtuais) {
        const r = racasAtuais[nome];
        const atributos = `F:${r.FOR} V:${r.VEL} H:${r.HAB} R:${r.RES} P:${r.POD}`;
        const dadosEdit = JSON.stringify({ nome: nome, ...r }).replace(/"/g, '&quot;');

        tbRacas.innerHTML += `
        <tr>
            <td>${nome}</td>
            <td style="font-size:12px; color:#aaa;">${atributos}</td>
            <td>
                <button onclick="prepararEdicao('raca', '${nome}', '${dadosEdit}')" style="background:transparent; border:none; cursor:pointer;">✏️</button>
                <button onclick="deletarMatrizDaForja('raca', '${nome}')" style="background:transparent; border:none; cursor:pointer;">🗑️</button>
            </td>
        </tr>`;
    }

    // Classes (Mesma lógica das Raças, resumida para não poluir)
    document.getElementById("th-classes").innerHTML = "<tr><th>Nome</th><th>Atributos</th><th>Ação</th></tr>";
    const tbClasses = document.getElementById("tb-classes");
    tbClasses.innerHTML = "";

    for (let nome in classesAtuais) {
        const c = classesAtuais[nome];
        const atributos = `F:${c.FOR} V:${c.VEL} H:${c.HAB} R:${c.RES} P:${c.POD}`;
        const dadosEdit = JSON.stringify({ nome: nome, ...c }).replace(/"/g, '&quot;');

        tbClasses.innerHTML += `
        <tr>
            <td>${nome}</td>
            <td style="font-size:12px; color:#aaa;">${atributos}</td>
            <td>
                <button onclick="prepararEdicao('classe', '${nome}', '${dadosEdit}')" style="background:transparent; border:none; cursor:pointer;">✏️</button>
                <button onclick="deletarMatrizDaForja('classe', '${nome}')" style="background:transparent; border:none; cursor:pointer;">🗑️</button>
            </td>
        </tr>`;
    }
}
// Abre ou fecha o painel de Sussurros
window.togglePainelSussurros = function (forcarAbrir = false) {
    const painel = document.getElementById("sussurro-chat-panel");
    if (forcarAbrir) {
        painel.classList.remove("hidden");
    } else {
        painel.classList.toggle("hidden");
    }

    // Se abrir, carrega as conversas salvas no Firebase
    if (!painel.classList.contains("hidden")) {
        carregarSidebarSussurros();
    }
}
function inserirEmoji(emoji) {
    const input = document.getElementById("input-msg-privada");
    // Só insere o emoji se a pessoa já tiver selecionado alguém pra conversar
    if (!input.disabled) {
        input.value += emoji;
        input.focus(); // Mantém o teclado ativo para continuar escrevendo
    }
}

// ==========================================
// 🔌 SISTEMA DE FUSÃO DA FORJA (FIREBASE -> JOGO)
// ==========================================

async function sincronizarMatrizesDaForja() {
    console.log("Sincronizando criações da Forja com o universo...");

    try {
        // 1. Injetar Raças Customizadas
        const snapRacas = await db.collection("racas").get();
        snapRacas.forEach(doc => {
            const dados = doc.data();
            racasAtuais[doc.id] = {
                FOR: dados.forca || 0,
                VEL: dados.velocidade || 0,
                HAB: dados.habilidade || 0,
                RES: dados.resistencia || 0,
                POD: dados.poder || 0,
                passiva: dados.passiva || "Nova linhagem descoberta."
            };
        });

        // 2. Injetar Classes Customizadas
        const snapClasses = await db.collection("classes").get();
        snapClasses.forEach(doc => {
            const dados = doc.data();
            classesAtuais[doc.id] = {
                FOR: dados.forca || 0,
                VEL: dados.velocidade || 0,
                HAB: dados.habilidade || 0,
                RES: dados.resistencia || 0,
                POD: dados.poder || 0,
                desc: dados.desc || "Caminho forjado recentemente."
            };
        });

        // 3. Injetar Afinidades Customizadas
        const snapAfinidades = await db.collection("afinidades").get();
        snapAfinidades.forEach(doc => {
            const dados = doc.data();
            const categoria = dados.categoria;

            // ✨ CORREÇÃO: Se a categoria vinda do banco não existir no objeto local, nós a criamos dinamicamente!
            if (!afinidades[categoria]) {
                afinidades[categoria] = [];
            }

            // Previne duplicação caso a função rode duas vezes
            const jaExiste = afinidades[categoria].find(a => a.nome === doc.id);
            if (!jaExiste) {
                afinidades[categoria].push({
                    nome: doc.id,
                    bonus: dados.bonus || "",
                    passiva: dados.passiva || ""
                });
            }
        });

        // 4. Reconstruir a lista da Roleta (Gacha)
        todosElementosLista.length = 0; // Limpa a lista antiga
        for (let cat in afinidades) {
            afinidades[cat].forEach(af => {
                todosElementosLista.push({ ...af, categoria: cat });
            });
        }
        // Atualiza a variável que a Roleta usa para sortear
        afinidadesPossiveis = todosElementosLista.map(el => el.nome);

        console.log("Fusão concluída! O Gacha e a Ficha agora reconhecem as novas matrizes.");

        // Atualiza as tabelas visuais do painel ADM com os nomes corretos
        if (typeof renderPainelRacasClasses === "function") renderPainelRacasClasses();
        if (typeof renderPainelAfinidadesExistentes === "function") renderPainelAfinidadesExistentes();
        if (typeof renderAbaAfinidadesGeral === "function") renderAbaAfinidadesGeral();

        // --- NOVO: Garante que o Datalist da Forja se atualize sozinho ---
        atualizarDatalistCategorias();

    } catch (error) {
        console.error("Erro ao sincronizar Forja:", error);
    }
}
async function salvarTaxasDropNoBanco() {
    // 1. Coleta os valores atualizados de cada caixinha da tela
    Object.keys(taxas).forEach(cat => {
        const input = document.getElementById(`edit-taxa-${cat}`);
        if (input) {
            taxas[cat] = parseFloat(input.value) || 0.0;
        }
    });

    try {
        // 2. Salva o objeto 'taxas' atualizado diretamente no documento de configuração do Firebase
        // (Ajuste o caminho da coleção/documento abaixo de acordo com onde você guarda as configurações globais)
        await db.collection("configuracoes").doc("taxas-drop").set(taxas);

        alert("📊 Taxas de Drop balanceadas e salvas com sucesso no servidor!");

        // Recarrega o visual da aba para confirmar
        renderAbaAfinidadesGeral();
    } catch (error) {
        console.error("Erro ao salvar taxas de drop:", error);
        alert("Erro ao salvar as taxas no banco de dados.");
    }
}
// ==========================================
// CONTROLE DE SESSÃO DOS CONTATOS PRIVADOS
// ==========================================
let usuarioChatAtivo = null;
let listenerMensagensPrivadas = null;
let contatosAtivos = []; // Guarda os contatos abertos APENAS nesta sessão

/**
 * Abre ou ativa uma conversa. Se o contato não estiver na barra lateral, ele é adicionado.
 */
async function abrirConversaCom(nomeDestinatario) {
    if (!nomeDestinatario || nomeDestinatario === usuarioLogado) {
        alert("Não podes sussurrar contigo mesmo ou com um usuário inválido!");
        return;
    }

    if (!contatosAtivos.includes(nomeDestinatario)) {
        contatosAtivos.push(nomeDestinatario);
    }

    usuarioChatAtivo = nomeDestinatario;

    // BUSCA O TÍTULO DO DESTINATÁRIO PARA EXIBIR NO TOPO DO SUSSURRO
    const docDest = await db.collection("usuarios").doc(nomeDestinatario).get();
    const dadosDest = docDest.data();
    const tDest = dadosDest?.titulo ? ` [${dadosDest.titulo}]` : "";

    const tituloChat = document.getElementById("nome-usuario-ativo");
    if (tituloChat) tituloChat.innerText = `Sussurrando com: ${nomeDestinatario}${tDest}`;

    const containerMensagens = document.getElementById("box-mensagens-sussurro");
    if (containerMensagens) containerMensagens.innerHTML = "<p class='sistema-msg'>Conectando...</p>";

    if (listenerMensagensPrivadas) listenerMensagensPrivadas();

    // BUSCA TAMBÉM O SEU PRÓPRIO TÍTULO ATUAL
    const docEu = await db.collection("usuarios").doc(usuarioLogado).get();
    const dadosEu = docEu.data();
    const tEu = dadosEu?.titulo ? `<span style="color: #d4af37; font-weight: bold; margin-right: 4px;">[${dadosEu.titulo}]</span> ` : "";
    const tagTituloDest = dadosDest?.titulo ? `<span style="color: #d4af37; font-weight: bold; margin-right: 4px;">[${dadosDest.titulo}]</span> ` : "";

    const salaId = gerarSalaId(usuarioLogado, nomeDestinatario);
    const queryMensagens = db.collection("chats_privados")
        .doc(salaId)
        .collection("mensagens")
        .orderBy("timestamp", "asc");

    listenerMensagensPrivadas = queryMensagens.onSnapshot((snapshot) => {
        if (!containerMensagens) return;
        containerMensagens.innerHTML = "";

        if (snapshot.empty) {
            containerMensagens.innerHTML = "<p class='sistema-msg'>Início do histórico privado.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const dados = doc.data();
            const divMsg = document.createElement("div");

            if (dados.remetente === usuarioLogado) {
                divMsg.className = "msg-sussurro-enviada";
                // ADICIONADO: Renderiza o seu título se você tiver um
                divMsg.innerHTML = `<strong>${tEu}Tu:</strong> ${dados.texto}`;
            } else {
                divMsg.className = "msg-sussurro-recebida";
                // ADICIONADO: Renderiza o título do outro jogador do lado do nome dele
                divMsg.innerHTML = `<strong>${tagTituloDest}${dados.remetente}:</strong> ${dados.texto}`;
            }
            containerMensagens.appendChild(divMsg);
        });

        containerMensagens.scrollTop = containerMensagens.scrollHeight;
    });

    renderizarAbasLaterais();
}
// Carrega as conversas salvas no Firebase para a sessão atual
async function carregarConversasSalvas() {
    if (!usuarioLogado) return;
    try {
        const doc = await db.collection("usuarios").doc(usuarioLogado).get();
        if (doc.exists) {
            const salvas = doc.data().conversasAtivas || [];

            // Reabastece o teu Set com os dados recuperados
            conversasAbertas = new Set(salvas);

            // Desenha a barra lateral com os contatos resgatados
            renderizarAbasLaterais();
        }
    } catch (erro) {
        console.error("Erro ao recuperar lista de conversas salvas:", erro);
    }
}

/**
 * Remove o contato da sua aba lateral (Some até que você digite o nome dele de novo)
 */
function fecharConversaLocal(nomeContato, event) {
    if (event) event.stopPropagation(); // Impede de abrir o chat ao clicar no botão de fechar

    // Remove do array de contatos ativos
    contatosAtivos = contatosAtivos.filter(c => c !== nomeContato);

    // Se você fechou o chat que estava lendo agora, limpa o painel principal
    if (usuarioChatAtivo === nomeContato) {
        usuarioChatAtivo = null;
        if (listenerMensagensPrivadas) listenerMensagensPrivadas();

        const containerMensagens = document.getElementById("box-mensagens-sussurro");
        if (containerMensagens) containerMensagens.innerHTML = "<p class='sistema-msg'>Selecione ou adicione um contacto para conversar.</p>";

        const tituloChat = document.getElementById("nome-usuario-ativo");
        if (tituloChat) tituloChat.innerText = "Sussurro Privado";
    }

    renderizarAbasLaterais();
}



// Sincroniza a remoção do contacto na sessão local e na nuvem
async function fecharConversaDefinitiva(nomeContato, event) {
    if (event) event.stopPropagation(); // Impede de reabrir o chat ao clicar no '×'

    conversasAbertas.delete(nomeContato);

    try {
        await db.collection("usuarios").doc(usuarioLogado).update({
            conversasAtivas: firebase.firestore.FieldValue.arrayRemove(nomeContato)
        });
    } catch (e) {
        console.error("Erro ao remover contato da nuvem:", e);
    }

    // Se o chat fechado era o chat atualmente ativo na tela, limpa a janela
    if (usuarioChatAtivo === nomeContato) {
        usuarioChatAtivo = null;
        if (listenerChatAtual) listenerChatAtual();

        document.getElementById("box-mensagens-sussurro").innerHTML = "";
        document.getElementById("nome-usuario-ativo").innerText = "Sussurro Privado";
        document.getElementById("input-msg-privada").disabled = true;
        document.getElementById("btn-enviar-privado").disabled = true;
        document.getElementById("input-msg-privada").placeholder = "Selecione um contacto...";
    }

    renderizarAbasLaterais();
}

// Renderiza a lista lateral incluindo o botão de apagar contacto permanentemente
function renderizarAbasLaterais() {
    const container = document.getElementById("lista-conversas-ativas");
    if (!container) return;
    container.innerHTML = "";

    if (!conversasAbertas || conversasAbertas.size === 0) {
        container.innerHTML = `<div style="padding:15px; text-align:center; color:#666; font-size:12px; font-style:italic;">Nenhuma conversa ativa.</div>`;
        return;
    }

    conversasAbertas.forEach(nome => {
        const classeAtiva = nome === usuarioChatAtivo ? "aba-conversa ativa" : "aba-conversa";
        const divAba = document.createElement("div");
        divAba.className = classeAtiva;

        // Estilização flex para empurrar o botão de fechar para o canto direito da aba
        divAba.style.display = "flex";
        divAba.style.justifyContent = "space-between";
        divAba.style.alignItems = "center";
        divAba.style.padding = "8px 10px";

        divAba.innerHTML = `
            <span style="flex-grow: 1; cursor: pointer; display: block;" onclick="abrirConversaCom('${nome}')">👤 ${nome}</span>
            <button onclick="fecharConversaDefinitiva('${nome}', event)" style="background:transparent; border:none; color:#999; cursor:pointer; font-size:16px; font-weight:bold; padding: 0 5px; line-height:1;">&times;</button>
        `;
        container.appendChild(divAba);
    });
}

/**
 * Gatilho do input de busca
 */
function abrirSussurroPorInput() {
    const inputNome = document.getElementById("input-novo-alvo");
    if (!inputNome) return;

    const nome = inputNome.value.trim();
    if (nome) {
        abrirConversaCom(nome);
        inputNome.value = ""; // Limpa a caixinha após adicionar
    }
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
// Chame esta função imediatamente após o utilizador entrar com sucesso no sistema:
// ligarMonitorDeJogadoresOnline();
// atualizarPresencaOnline(usuarioLogado);
// --- SISTEMA DE ÁUDIO SINTETIZADO ---
let somPermitido = true;
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
    // Verifica se a bolinha de notificação existe antes de tentar apagá-la
    const notificacao = document.getElementById("notificacao-chat-geral");
    if (notificacao) {
        notificacao.style.display = "none";
    }

    const painelChat = document.getElementById("painel-chat-social");

    if (painelChat) {
        if (painelChat.classList.contains("hidden")) {
            painelChat.classList.remove("hidden");

            // Força o carregamento das mensagens se o listener ainda não estiver ativo
            if (typeof unsubscribeChat !== 'undefined' && !unsubscribeChat) {
                mudarCanalChat(typeof canalChatAtivo !== 'undefined' && canalChatAtivo ? canalChatAtivo : 'global');
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
        // Se usar toast, garanta que a função existe. Senão usa console.warn
        console.warn("Aviso: Painel do chat não encontrado no sistema.");
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
let afinidades = BANCO_AFINIDADES; let taxas = TAXAS_PADRAO; let todosElementosLista = [];
let racasAtuais = BANCO_RACAS; let classesAtuais = BANCO_CLASSES; let missoesSemanas = [];
let configGlobais = { pityMax: 30, nivelMax: 99, avisoGlobal: "Sejam bem-vindos!", eventoAtivo: "", bannerRateUp: "" };
let usuarioLogado = ""; let ehAdmin = false; let somAtivado = true;
let objFichaAtual = null; let usuarioVisualizandoFicha = ""; let playerDetetiveId = "";
let canalChatAtivo = "global"; let ultimoEnvioChat = 0; let receptorSussurro = "";

// Dicionário de Auto-Moderação
const PALAVRAS_BANIDAS = ["fracassado", "lixo", "nb", "noob", "hack", "corno", "otario"];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function somClique() { if (somAtivado) { try { let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(550, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08); gain.gain.setValueAtTime(0.12, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.08); } catch (e) { } } }
function somTickRoleta() { if (somAtivado) { try { let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'triangle'; osc.frequency.setValueAtTime(320, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.03); } catch (e) { } } }
function tocarClique() { if (audioCtx.state === 'suspended') audioCtx.resume(); somClique(); }

// Inicializador de Tabelas Estáticas e Eventos Remotos
function setupEstruturasIniciais() {
    Object.keys(afinidades).forEach(cat => { afinidades[cat].forEach(el => todosElementosLista.push({ ...el, categoria: cat })); });

    db.collection("config").doc("sistema").onSnapshot((doc) => {
        if (!doc.exists) {
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

    // SISTEMA DE RANKING ATUALIZADO
    db.collection("usuarios").where("scorePrestigio", ">", 0).orderBy("scorePrestigio", "desc").limit(5).onSnapshot(snap => {
        let html = ""; let pos = 1;
        snap.forEach(doc => {
            const u = doc.data();
            // CORRIGIDO: u.tituloEquipado trocado por u.titulo para casar o formato perfeitamente
            html += `<li><strong style="color:#d4af37;">${pos}º ${u.titulo ? `[${u.titulo}] ` : ""}${u.exibicao}</strong><br><span style="font-size:11px;color:#bcaad6;">Nível: ${u.nivel || 1}</span></li>`;
            pos++;
        });
        const caixaRanking = document.getElementById("lista-ranking");
        if (caixaRanking) {
            caixaRanking.innerHTML = html || "<li>Nenhuma lenda activa...</li>";
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

if (usuarioLogado.ehAdmin) {
    document.getElementById('btn-master-admin').style.display = 'block';
    document.getElementById('btn-correio-admin').style.display = 'block'; // Torna o botão do correio visível para o ADM
}
// --- SISTEMA DE LOGS E AMBIENTE SOCIAL ---
async function entrarNoSistema() {
    const nome = document.getElementById("nome-personagem").value.trim();
    const senha = document.getElementById("senha-personagem").value.trim();

    async function verificarCorreioMistico() {
        // Evita rodar se o usuário não estiver logado ou se for o mestre logado como admin puro
        if (!usuarioLogado || (typeof ehAdmin !== 'undefined' && ehAdmin)) return;


        try {
            const userRef = db.collection("usuarios").doc(usuarioLogado);
            const doc = await userRef.get();

            if (!doc.exists) return;
            const u = doc.data();

            const pacotes = u.notificacoesPendentes || [];
            if (pacotes.length === 0) return; // Nada no correio, segue o jogo!

            let essenciasGanhasTotal = 0;
            let novosHistoricos = u.historico || [];
            let titulosAdicionados = [];

            // Processa todos os pacotes acumulados na caixa de entrada do cara
            for (let pacote of pacotes) {
                essenciasGanhasTotal += pacote.essencias;

                // Monta o texto do Pop-up Estilizado
                let textoPremio = "";
                if (pacote.essencias > 0) textoPremio += `🔮 <b>${pacote.essencias} Essências</b><br>`;
                if (pacote.titulo) {
                    textoPremio += `👑 Título Especial: <b>[${pacote.titulo}]</b><br>`;
                    titulosAdicionados.push(pacote.titulo);
                }

                // Cria uma janela bonita de Alerta ou usa o alert modificado
                // Se você tiver um modal de avisos, use-o. Caso contrário, o JavaScript monta um dinamicamente:
                const containerAlerta = document.createElement("div");
                containerAlerta.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#1a1525; border:2px solid #d4af37; padding:25px; border-radius:8px; z-index:10000; text-align:center; box-shadow:0 0 30px rgba(0,0,0,0.8); color:#fff; font-family:sans-serif; min-width:300px;";
                containerAlerta.innerHTML = `
                <h2 style="color:#d4af37; margin-top:0;">🎁 Recompensa do Mestre!</h2>
                <p style="font-size:14px; margin:15px 0;">O Mestre recompensou você ${pacote.mensagem}</p>
                <div style="background:rgba(212,175,55,0.1); padding:10px; border-radius:4px; border:1px dashed #d4af37; margin:15px 0; text-align:left; font-size:13px;">
                    ${textoPremio}
                </div>
                <button id="btn-fechar-correio" style="background:#d4af37; color:#000; border:none; padding:8px 20px; font-weight:bold; border-radius:4px; cursor:pointer;">Receber e Agradecer</button>
            `;
                document.body.appendChild(containerAlerta);

                // Aguarda o clique do botão "Receber" para fechar o pop-up
                await new Promise(resolve => {
                    document.getElementById("btn-fechar-correio").onclick = () => {
                        containerAlerta.remove();
                        resolve();
                    };
                });

                // Adiciona a entrada no histórico pessoal do jogador para prestação de contas
                novosHistoricos.push({
                    categoria: "RECOMPENSA",
                    afinidade: `Ganhou ${pacote.essencias}es ${pacote.titulo ? `+ [${pacote.titulo}]` : ''}`,
                    data: pacote.dataEnvio
                });
            }

            // Calcula os novos saldos matemáticos do jogador
            let novoSaldoEssencias = (u.tentativas || 0) + essenciasGanhasTotal;

            // Se ganhou títulos novos, você pode adicioná-los à lista de conquistas/títulos liberados dele aqui
            // Exemplo fictício assumindo que seu sistema guarde uma array de titulosLiberados:
            let listaTitulosAtualizada = u.titulosLiberados || [];
            titulosAdicionados.forEach(t => {
                if (!listaTitulosAtualizada.includes(t)) listaTitulosAtualizada.push(t);
            });

            // Executa a limpeza da caixa e atualiza o saldo real no Firebase do Jogador de uma vez só!
            await userRef.update({
                tentativas: novoSaldoEssencias,
                historico: novosHistoricos,
                titulosLiberados: listaTitulosAtualizada,
                notificacoesPendentes: [] // <--- Caixa esvaziada com sucesso!
            });

            // Atualiza a interface gráfica do jogador na hora
            const divEssencias = document.getElementById("qtd-essencias-tela");
            if (divEssencias) divEssencias.innerText = novoSaldoEssencias;
            if (typeof atualizarInterfaceJogador === "function") atualizarInterfaceJogador();

            if (typeof showToast === "function") showToast("Recompensas adicionadas ao seu inventário!", "success");

        } catch (erro) {
            console.error("Erro ao processar correio de recompensas:", erro);
        }
    }

    if (!nome || !senha) {
        if (typeof showToast === "function") showToast("⚠️ O Oráculo exige um nome e uma senha!", "error");
        return;
    }

    try {
        // Vai ao banco de dados procurar o jogador
        const doc = await db.collection("usuarios").doc(nome).get();

        if (doc.exists) {
            const dados = doc.data();

            // VERIFICAÇÃO DE BANIMENTO
            if (dados.banidoAte) {
                const agora = new Date().getTime();
                if (agora < dados.banidoAte) {
                    const dias = Math.ceil((dados.banidoAte - agora) / (1000 * 60 * 60 * 24));
                    showToast(`🚫 O Oráculo baniu-te! Restam ${dias} dia(s).`, "error");
                    return; // Chuta o jogador para fora!
                }
            }

            // A CONTA EXISTE! Vamos verificar a senha:
            if (dados.senha !== senha) {
                if (typeof showToast === "function") showToast("❌ Senha incorreta, impostor!", "error");
                return;
            }
            // Senha correta, carrega os dados!
            usuarioLogado = nome;
            userDataGlobal = dados;
            ehAdmin = dados.ehAdmin === true;
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
                conversasAtivas: [],
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("usuarios").doc(nome).set(novaConta);

            usuarioLogado = nome;
            userDataGlobal = novaConta;
            ehAdmin = false;
            if (typeof showToast === "function") showToast(`✨ Nova alma registada! Bem-vindo, ${nome}!`, "success");
        }

        // ==========================================
        // 🛡️ O CADEADO DO MESTRE (REVELA PAINÉIS OCULTOS)
        // ==========================================
        const painelOraculo = document.getElementById("container-admin-oraculo");
        const painelRoleta = document.getElementById("container-admin-roleta");
        const btnCorreioAdmin = document.getElementById("btn-correio-admin"); // Adicionado aqui

        if (ehAdmin) {
            // Se for Mestre, quebra a invisibilidade!
            if (btnCorreioAdmin) btnCorreioAdmin.style.display = "block"; // Revela o botão na navbar!

            if (painelOraculo) {
                painelOraculo.style.display = "block";
                // Já atualiza os gráficos do olho que tudo vê
                if (typeof carregarOlhoQueTudoVe === "function") carregarOlhoQueTudoVe();
            }
            if (painelRoleta) {
                painelRoleta.style.display = "block";
            }
        } else {
            // Se for jogador, garante que continua escondido (proteção extra)
            if (btnCorreioAdmin) btnCorreioAdmin.style.display = "none"; // Esconde o botão se for jogador comum

            if (painelOraculo) painelOraculo.style.display = "none";
            if (painelRoleta) painelRoleta.style.display = "none";
        }
        // ==========================================
        // ==========================================

        // =========================================================
        // 🌟 NOVA LÓGICA DE VISIBILIDADE (A REGRA DE OURO) 🌟
        // =========================================================

        // Pega os elementos baseados no seu HTML
        const roletaElement = document.getElementById("tela-sorteio");
        const statsDashboard = document.getElementById("painel-dashboard-stats");
        const containerOraculo = document.getElementById("container-admin-oraculo");

        if (ehAdmin) {
            // ==========================================
            // SE FOR O MESTRE (ADM)
            // ==========================================
            // 1. Esconde a interface da roleta
            if (roletaElement) {
                roletaElement.style.display = 'none';
                roletaElement.classList.add('hidden'); // Garante que a classe hidden também atue
            }

            // 2. Mostra o Olho que Tudo Vê (Dashboard)
            if (statsDashboard) statsDashboard.style.display = 'flex';
            if (containerOraculo) containerOraculo.style.display = 'block';

        } else {
            // ==========================================
            // SE FOR UM JOGADOR
            // ==========================================
            // 1. Mostra a interface da roleta
            if (roletaElement) {
                roletaElement.style.display = 'block';
                roletaElement.classList.remove('hidden');
            }

            // 2. Esconde o Olho que Tudo Vê (Dashboard)
            if (statsDashboard) statsDashboard.style.display = 'none';
            if (containerOraculo) containerOraculo.style.display = 'none';
        }
        // =========================================================

        // No final de entrarNoSistema():
        if (typeof iniciarInterfacePrincipal === "function") {
            iniciarInterfacePrincipal();
        }
        checarPresentesNoReload(); // Gatilho adicionado aqui para ler o presente no login/reload!

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

    // 🌟 SINCRONIZAÇÃO DAS CONVERSAS (Nuvem + Escuta ativa)
    carregarConversasSalvas();
    escutarNovosSussurrosGlobais();
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

    const doc = await db.collection("usuarios").doc(usuarioLogado).get();
    const u = doc.data();
    const nomeExibicao = u.exibicao || usuarioLogado;

    // Atualiza o nome do usuário com segurança
    const elementoUsuario = document.getElementById("usuario-atual");
    if (elementoUsuario) {
        // CORRIGIDO: Trocado u.tituloEquipado por u.titulo (e removido o split para mostrar o título completo)
        elementoUsuario.innerText = u.titulo
            ? `[${u.titulo}] ${nomeExibicao}`
            : nomeExibicao;
    }

    // Atualiza o contador de tentativas com segurança
    const elementoContador = document.getElementById("contador-tentativas");
    if (elementoContador) {
        elementoContador.innerHTML = `Essências: <strong>${u.tentativas}</strong> <span style="font-size:11px;color:#888;display:block;">Piedade: ${u.pityCounter || 0}/${configGlobais?.pityMax || 100}</span>`;
    }

    // Mostra ou esconde o botão de 10x com segurança
    const btnSortear10 = document.getElementById("btn-sortear-10");
    if (btnSortear10) {
        if (u.tentativas >= 10) {
            btnSortear10.classList.remove("hidden");
        } else {
            btnSortear10.classList.add("hidden");
        }
    }

    // Atualiza o histórico pessoal com segurança
    const elementoHistorico = document.getElementById("lista-historico-pessoal");
    if (elementoHistorico && u.historico) {
        elementoHistorico.innerHTML = u.historico.slice(-15).map(h => `<li>[${h.data}] <strong>${h.afinidade}</strong></li>`).reverse().join("");
    }
}

// --- ENGINES DO CHAT MULTI-ABAS (COM PIPELINE DE AUTO-LIMPEZA) ---
function mudarCanalChat(canal) {
    canalChatAtivo = canal;
    try {
        // Remove a classe 'active' de todas as abas
        document.querySelectorAll('.chat-tab-btn').forEach(btn => btn.classList.remove('active'));

        // Tenta ativar a aba atual (se ela existir)
        const tabAtiva = document.getElementById('tab-chat-' + canal);
        if (tabAtiva) {
            tabAtiva.classList.add('active');
        }
    } catch (e) {
        console.warn("Mudança de aba concluída sem interface visual.");
    }
}
let unsubscribeChat = null;
function ouvirMensagensChat() {
    if (unsubscribeChat) unsubscribeChat();

    let query = db.collection("chat").orderBy("timestamp", "desc").limit(50);

    const divChatGeral = document.getElementById("painel-chat-social");
    const notificacao = document.getElementById("notificacao-chat-geral");

    // CORREÇÃO: Só tenta alterar visualmente se os elementos existirem
    if (divChatGeral && notificacao) {
        // Verifica se o chat está fechado (pela classe hidden ou pelo style)
        if (divChatGeral.style.display === "none" || divChatGeral.classList.contains("hidden")) {
            notificacao.style.display = "inline";
        }
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
            let tag = m.remetenteId === 'l' ? `<span style="color:#d4af37;">[MESTRE]</span> ` : ``;
            let corpo = `<span style="color:#c4b4de;">${m.texto}</span>`;

            // Nova lógica para exibir o título no chat
            let tituloDisplay = m.remetenteTitulo ? `<span style="color:#d4af37; font-weight:bold;">[${m.remetenteTitulo}]</span> ` : ``;

            if (m.canal === 'sussurro') corpo = `<i style="color:#ff69b4;">[Sussurro]: ${m.texto}</i>`;

            // O botão de denúncia já está aqui, se não aparecer na tela, o problema é no CSS (HTML)
            return `<div class="msg-linha">
                        <button class="btn-report-msg" onclick="denunciarMensagemAltar('${m.id}', '${m.remetenteExibicao}', '${m.texto}')" title="Denunciar aos Deuses" style="cursor:pointer; background:transparent; border:none;">🚩</button>
                        ${tag}${tituloDisplay}<strong onclick="definirAlvoSussurro('${m.remetenteId}')" style="cursor:pointer;">${m.remetenteExibicao}:</strong> ${corpo}
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

    // Filtro Automático
    PALAVRAS_BANIDAS.forEach(p => {
        let regex = new RegExp(p, "gi");
        txt = txt.replace(regex, "[***]");
    });

    const docU = await db.collection("usuarios").doc(usuarioLogado).get();
    const u = docU.data();

    const novaMsg = {
        canal: 'global',
        remetenteId: usuarioLogado,
        remetenteExibicao: u.exibicao || usuarioLogado,
        // ADICIONADO: Garante que o título ativo vai junto com o texto no Chat Global
        remetenteTitulo: u.titulo || "",
        destinoId: "",
        texto: txt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("chat").add(novaMsg);
    document.getElementById("chat-input-texto").value = "";
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

    // SEGURANÇA MÁXIMA: Tenta ler 'titulo', se não achar tenta 'tituloEquipado', se não tiver nada usa ""
    let tituloFicha = objFichaAtual.titulo || objFichaAtual.tituloEquipado || "";
    let ba = extrairBonusAfinidade(tituloFicha);

    ['FOR', 'VEL', 'HAB', 'RES', 'POD'].forEach(a => {
        document.getElementById(`ficha-base-${a}`).innerText = pts[a];
        document.getElementById(`ficha-total-${a}`).innerText = pts[a] + br[a] + bc[a] + ba[a];
    });
    let tRES = pts.RES + br.RES + bc.RES + ba.RES; let tPOD = pts.POD + br.POD + bc.POD + ba.POD;
    document.getElementById("ficha-pv").innerText = tRES * 5; document.getElementById("ficha-pp").innerText = tPOD * 5; document.getElementById("ficha-def").innerText = Math.ceil(tRES / 2);
    document.getElementById("ficha-pontos-livres").innerText = (20 + (((objFichaAtual.nivel || 1) - 1) * 2)) - (pts.FOR + pts.VEL + pts.HAB + pts.RES + pts.POD);
}

async function salvarFicha() {
    try {
        // 1. Pega os valores selecionados no HTML
        objFichaAtual.raca = document.getElementById("ficha-raca").value;
        objFichaAtual.classe = document.getElementById("ficha-classe").value;

        // 2. GARANTIA ANTI-TRAVAMENTO: Se o jogador não mexeu nos atributos, garante que não envia "undefined" pro Firebase
        const pontosSeguros = objFichaAtual.pontosBase || { FOR: 0, VEL: 0, HAB: 0, RES: 0, POD: 0 };
        objFichaAtual.pontosBase = pontosSeguros;

        // 3. Salva no banco de dados
        await db.collection("usuarios").doc(usuarioVisualizandoFicha).update({
            raca: objFichaAtual.raca,
            classe: objFichaAtual.classe,
            pontosBase: pontosSeguros
        });

        // 4. Avisa que deu certo (substituí o alert nativo pelo seu showToast se ele existir)
        if (typeof showToast === "function") {
            showToast("Estrutura da Ficha Atualizada!", "success");
        } else {
            alert("Estrutura da Ficha Atualizada!");
        }

        fecharModal('modal-ficha');

        // 5. PROTEÇÃO DE ESCOPO: Só executa a atualização da lista se for o Mestre e a aba existir
        if (typeof aba !== 'undefined' && aba === 'jogadores') {
            if (typeof renderListaJogadoresAdm === "function") {
                renderListaJogadoresAdm();
            }
        }

    } catch (erro) {
        console.error("Erro fatal ao salvar a ficha:", erro);
        if (typeof showToast === "function") showToast("Erro ao tentar salvar a ficha no Oráculo.", "error");
    }
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

    if (aba === 'jogadores') renderListaJogadoresAdm();
    else if (aba === 'missoes') renderPainelMissoesAdm();
    else if (aba === 'raca') renderPainelRacasClasses();
    else if (aba === 'afinidades') { renderPainelAfinidadesExistentes(); renderAbaAfinidadesGeral(); }
    else if (aba === 'servidor') renderizarCamposGlobaisServidor();
    else if (aba === 'denuncias') renderPainelDenunciasAdm();
    else if (aba === 'inbox') renderPainelInboxAdm();
}
window.modificarRollsJogador = async function (id, qtd) {
    await db.collection("usuarios").doc(id).update({ tentativas: firebase.firestore.FieldValue.increment(qtd) });
    renderPainelJogadores();
}
window.toggleBanirJogador = async function (id, status) {
    if (!confirm(status ? "Reativar conta?" : "Deseja banir este jogador do servidor?")) return;
    await db.collection("usuarios").doc(id).update({ banido: !status });
    renderPainelJogadores();
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
    let h = `<tr><th>Nome</th><th>FOR</th><th>VEL</th><th>HAB</th><th>RES</th><th>POD</th><th>Ações</th></tr>`;
    document.getElementById("th-racas").innerHTML = h;
    document.getElementById("th-classes").innerHTML = h;

    document.getElementById("tb-racas").innerHTML = Object.keys(racasAtuais).map(k => {
        let r = racasAtuais[k];
        return `<tr>
            <td><strong>${k}</strong></td><td>${r.FOR}</td><td>${r.VEL}</td><td>${r.HAB}</td><td>${r.RES}</td><td>${r.POD}</td>
            <td><button onclick="deletarMatrizDaForja('raca', '${k}')" style="background: darkred; color: white; padding: 2px 5px; border-radius: 4px; border: none; cursor: pointer;">Excluir</button></td>
        </tr>`;
    }).join("");

    document.getElementById("tb-classes").innerHTML = Object.keys(classesAtuais).map(k => {
        let c = classesAtuais[k];
        return `<tr>
            <td><strong>${k}</strong></td><td>${c.FOR}</td><td>${c.VEL}</td><td>${c.HAB}</td><td>${c.RES}</td><td>${c.POD}</td>
            <td><button onclick="deletarMatrizDaForja('classe', '${k}')" style="background: darkred; color: white; padding: 2px 5px; border-radius: 4px; border: none; cursor: pointer;">Excluir</button></td>
        </tr>`;
    }).join("");
}

// Alterna a exibição dos campos baseados no que o Mestre está criando
function alternarCamposForja() {
    const tipo = document.getElementById("forja-tipo-base").value;
    const camposAtributos = document.getElementById("forja-campos-atributos");
    const camposAfinidade = document.getElementById("forja-campos-afinidade");

    if (tipo === "raca" || tipo === "classe") {
        camposAtributos.style.display = "flex";
        camposAfinidade.style.display = "none";
    } else if (tipo === "afinidade") {
        camposAtributos.style.display = "none";
        camposAfinidade.style.display = "block";
    }
}

async function salvarMatrizOficial() {
    const tipo = document.getElementById("forja-tipo-base").value;
    const nome = document.getElementById("forja-nome").value.trim();

    if (!nome) {
        alert("A matriz precisa de um nome!");
        return;
    }

    // Prepara o pacote de dados dependendo do tipo
    let payload = {
        nome: nome,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    let nomeColecao = "";

    if (tipo === "raca" || tipo === "classe") {
        nomeColecao = tipo === "raca" ? "racas" : "classes";

        payload.forca = parseInt(document.getElementById("forja-for").value) || 0;
        payload.velocidade = parseInt(document.getElementById("forja-vel").value) || 0;
        payload.habilidade = parseInt(document.getElementById("forja-hab").value) || 0;
        payload.resistencia = parseInt(document.getElementById("forja-res").value) || 0;
        payload.poder = parseInt(document.getElementById("forja-pod").value) || 0;

    } else if (tipo === "afinidade") {
        nomeColecao = "afinidades";

        payload.categoria = document.getElementById("forja-categoria-afinidade").value;
        payload.bonus = document.getElementById("forja-bonus").value.trim();
        payload.passiva = document.getElementById("forja-passiva").value.trim();
    }

    try {
        // Salva diretamente na coleção que o jogo já usa!
        // Usamos .doc(nome).set() para evitar itens duplicados com o mesmo nome
        await db.collection(nomeColecao).doc(nome).set(payload);

        alert(`⚔️ Sucesso! A matriz [${nome}] foi forjada e enviada para o servidor!`);

        // Limpa os campos após salvar
        document.getElementById("forja-nome").value = "";

        // Aqui chamaremos a função que atualiza a tabela do Mestre (veja abaixo)
        // carregarTabelasAdmin(); 

    } catch (error) {
        console.error("Erro ao forjar matriz:", error);
        alert("Falha na Forja. Verifique a conexão com o banco de dados.");
    }
}
function renderAbaAfinidadesGeral() {
    const grid = document.getElementById("grid-taxas-admin");
    let htmlGrid = "";

    // 1. Vasculha as afinidades forjadas e garante que categorias novas entrem na lista de taxas
    Object.keys(afinidades).forEach(cat => {
        if (taxas[cat] === undefined) {
            taxas[cat] = 0.0; // Categorias novas nascem com 0% de drop rate
        }
    });

    // 2. Desenha um cartão para cada categoria
    Object.keys(taxas).forEach(cat => {
        htmlGrid += `
        <div style="background: #2a233b; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 100px;">
            <label style='font-size:13px; font-weight: bold; color: #a982ed; text-transform: uppercase;'>${cat}</label>
            
            <div style="display: flex; gap: 5px; align-items: center;">
                <input type='number' id='edit-taxa-${cat}' value='${taxas[cat]}' step='0.1' style='padding:6px; font-size:14px; width: 70px; text-align: center; border-radius: 4px; border: 1px solid #a982ed; background: #110e1b; color: white;'>
                <span style="font-size: 14px; font-weight: bold;">%</span>
            </div>
            
            <button onclick="deletarCategoria('${cat}')" style="background: darkred; color: white; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px; width: 100%; margin-top: 5px;">
                ☠️ Excluir Categoria
            </button>
        </div>`;
    });

    grid.innerHTML = htmlGrid;
}
function renderPainelAfinidadesExistentes() {
    const lista = document.getElementById("lista-afinidades-existentes-adm");
    if (!lista) return;

    let html = "<h4 style='color:#a982ed;'>Afinidades Forjadas</h4><ul>";

    for (let cat in afinidades) {
        afinidades[cat].forEach(af => {
            html += `<li style="margin-bottom: 8px;">
                <strong>[${cat}]</strong> ${af.nome} 
                <button onclick="deletarMatrizDaForja('afinidade', '${af.nome}')" style="background: darkred; color: white; padding: 2px 5px; border-radius: 4px; border: none; cursor: pointer; font-size: 10px; margin-left: 10px;">Excluir</button>
            </li>`;
        });
    }
    html += "</ul>";
    lista.innerHTML = html;
}

window.salvarTaxasNuvem = async function () {
    let updates = {};

    // Varre todas as taxas da tela (incluindo as novas com 0%) e monta o objeto de atualização
    Object.keys(taxas).forEach(cat => {
        let el = document.getElementById(`edit-taxa-${cat}`);
        if (el) {
            updates[`taxas.${cat}`] = parseFloat(el.value) || 0.0;
        }
    });

    try {
        // Atualiza diretamente o documento lido pelo setup inicial do jogo
        await db.collection("config").doc("sistema").update(updates);
        alert("📊 Matriz de Drops rebalanceada com sucesso no servidor!");
        window.location.reload();
    } catch (error) {
        console.error("Erro ao salvar taxas:", error);
        alert("Falha ao tentar salvar as taxas. Verifique o console.");
    }
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
    snap.forEach(d => { if (!d.data().isAdmin) b.update(d.ref, { tentativas: firebase.firestore.FieldValue.increment(qtd) }); });
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
    const container = document.getElementById("lista-inbox-mensagens");
    container.innerHTML = "Lendo relatórios...";

    const snap = await db.collection("feedbacks").orderBy("timestamp", "desc").limit(20).get();

    if (snap.empty) {
        container.innerHTML = "<p>Nenhum bug reportado.</p>";
        return;
    }

    container.innerHTML = snap.docs.map(doc => {
        const f = doc.data();
        // Se o bug ainda não tiver status definido, mostramos como "Pendente"
        const statusAtual = f.status || '⚪ Pendente';

        return `
        <div class="inbox-bloco" style="border-left: 4px solid #666; padding-left: 10px; margin-bottom: 15px;">
            <h4>
                🐛 Autor: ${f.autor} 
                <span style="font-size: 11px; background: #222; padding: 3px 6px; border-radius: 4px; margin-left: 8px;">Status: ${statusAtual}</span>
                <button class="btn-deletar-pequeno" style="float:right;" onclick="deletarFeedbackInbox('${doc.id}')">Lido (Apagar)</button>
            </h4>
            <p style="margin-bottom: 10px;">${f.texto}</p>
            
            <!-- 🛠️ GESTÃO AVANÇADA -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px;">
                <button onclick="mudarStatusFeedback('${doc.id}', '🔴 Crítico')" style="background: #d9534f; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">🔴 Crítico</button>
                <button onclick="mudarStatusFeedback('${doc.id}', '🟡 Sugestão')" style="background: #f0ad4e; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">🟡 Sugestão</button>
                <button onclick="mudarStatusFeedback('${doc.id}', '🟢 Resolvido')" style="background: #5cb85c; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">🟢 Resolvido</button>
                
                <div style="width: 1px; background: #ccc; margin: 0 4px;"></div> <!-- Divisória visual -->
                
                <button onclick="sussurrarParaReporter('${f.autor}')" style="background: #9b59b6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold;">💬 Sussurrar</button>
            </div>
        </div>`;
    }).join("");
}

// Mantém a tua função de deletar intacta
window.deletarFeedbackInbox = async function (id) {
    await db.collection("feedbacks").doc(id).delete();
    renderPainelInboxAdm();
}

// ==========================================
// 🛠️ FUNÇÕES DE GESTÃO DE BUGS
// ==========================================

// Função para atualizar a Tag do Report no Firebase
window.mudarStatusFeedback = async function (id, novoStatus) {
    try {
        await db.collection("feedbacks").doc(id).update({
            status: novoStatus
        });

        // Renderiza novamente para mostrar o novo status imediatamente
        renderPainelInboxAdm();
    } catch (error) {
        console.error("Erro ao mudar status do feedback:", error);
    }
}

// Função para atalho do sussurro
// ==========================================
// 💬 ATALHO DE SUSSURRO (INTEGRAÇÃO COM CHAT)
// ==========================================
window.sussurrarParaReporter = function (nomeJogador) {
    if (!nomeJogador) return;

    // 1. Esconder o painel de administração para veres o chat
    // NOTA: Troca "modal-painel-adm" pelo ID real da janela do teu painel de Mestre (se for um modal).
    // Se o teu painel não for um modal, podes apagar estas 4 linhas.
    const painelAdm = document.getElementById("modal-painel-adm");
    if (painelAdm) {
        painelAdm.style.display = "none"; // ou painelAdm.classList.add("hidden"); dependendo do teu CSS
    }

    // 2. Força a abertura do painel lateral de sussurros
    if (typeof window.togglePainelSussurros === "function") {
        window.togglePainelSussurros(true);
    }

    // 3. Abre a sala de chat diretamente com o autor do bug
    if (typeof window.abrirConversaCom === "function") {
        window.abrirConversaCom(nomeJogador);
    }

    // 4. Dá um pequeno tempo (100ms) para o DOM carregar e preenche a caixa de mensagem
    setTimeout(() => {
        // Já sabemos pelo teu código que o input se chama "input-msg-privada"
        const inputSussurro = document.getElementById("input-msg-privada");
        if (inputSussurro) {
            // Habilita o campo caso esteja desativado e escreve o contexto
            inputSussurro.disabled = false;
            inputSussurro.value = `Sobre o teu report do bug... `;
            inputSussurro.focus(); // Coloca o cursor lá para o Mestre só continuar a escrever
        }
    }, 100);
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
                    <label>tentativas(+):</label><input type="number" id="ess-${doc.id}" value="0" style="width:50px;">
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

window.salvarEdicaoDivina = async function (idJogador, tentativasAtuais) {
    // 1. Captura os dados dos inputs gerados pelo loop baseados no ID do jogador
    const novoTitulo = document.getElementById(`tit-${idJogador}`).value.trim();
    const novoNivel = parseInt(document.getElementById(`lvl-${idJogador}`).value) || 1;
    const novosPontos = parseInt(document.getElementById(`pts-${idJogador}`).value) || 0;
    const tentativasAdicionais = parseInt(document.getElementById(`ess-${idJogador}`).value) || 0;

    try {
        const userRef = db.collection("usuarios").doc(idJogador);

        // 2. Cria o objeto base com as alterações normais de Nível e Pontos
        let dadosAtualizacao = {
            nivel: novoNivel,
            pontosTotais: novosPontos
        };

        // 3. Se o ADM digitou tentativas adicionais (+), faz a soma/incremento
        if (tentativasAdicionais > 0) {
            dadosAtualizacao["tentativas"] = firebase.firestore.FieldValue.increment(tentativasAdicionais);
        }

        // 4. A MÁGICA DOS TÍTULOS SINCRONIZADOS COM O GRIMÓRIO:
        if (novoTitulo) {
            // Substitui o título ativo principal do jogador pelo que foi digitado
            dadosAtualizacao["titulo"] = novoTitulo;

            // Adiciona o novo título ao Grimório dele (se já não existir na lista)
            dadosAtualizacao["grimorio"] = firebase.firestore.FieldValue.arrayUnion(novoTitulo);
        }

        // 5. Salva de uma vez só tudo no documento do jogador
        await userRef.update(dadosAtualizacao);

        // Mensagem de sucesso (ou use o seu showToast se preferir)
        alert(`✨ Destino de ${idJogador} alterado e grimório atualizado com sucesso!`);

    } catch (erro) {
        console.error("Erro ao salvar edição divina:", erro);
        alert("🔥 O Oráculo não conseguiu salvar as alterações divinas.");
    }
};
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
<li onclick="abrirConversaCom('${doc.id}')"; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; display: flex; align-items: center; gap: 6px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
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


function escutarChatFirebase() {
    if (!db) return;

    // Escutando o chat global
    db.collection("chat").orderBy("timestamp", "desc").limit(30).onSnapshot(snap => {
        const box = document.getElementById("chat-box-mensagens");
        // ESCUDO: Se a caixa do chat não estiver na tela, não faz nada e não quebra!
        if (!box) return;

        let html = "";
        const mensagens = [];
        snap.forEach(doc => mensagens.unshift(doc.data()));

        mensagens.forEach(m => {
            // 🛑 ESCUDO ANTI-VAZAMENTO: Ignora qualquer mensagem de sussurro que tenha ficado no banco global antigo
            if (m.canal === "sussurro" || (m.destinoId && m.destinoId !== "")) return;

            html += `<div class="msg-linha"><strong style="color:#d4af37;">${m.tituloEAfim || ''}${m.autor || m.remetenteExibicao || 'Oráculo'}${m.sufixo || ''}</strong>: ${m.texto}</div>`;
        });

        const boxWasEmpty = box.innerHTML === "";
        box.innerHTML = html;
        if (!boxWasEmpty && typeof chatAberto !== 'undefined' && !chatAberto && typeof atualizarBadgeChat === "function") atualizarBadgeChat('global');
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
    let essenciasAtuais = Math.max(u.tentativas || 0, u.tentativas || 0);

    if (essenciasAtuais < qtd) {
        if (typeof showToast === "function") showToast("Essências Insuficientes!", "error");
        else alert("Essências Insuficientes!");
        return;
    }

    // 2. Desativa os botões para evitar flood
    document.getElementById("btn-girar").disabled = true;
    let btn10 = document.getElementById("btn-sortear-10");
    if (btn10) btn10.disabled = true;

    // 3. Cálculos Matemáticos do Sorteio
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

    // 🌟 UPGRADE VISUAL 3D: Se for um giro de 10x, a roleta ganha uma aura mística e gira no dobro da velocidade!
    if (qtd >= 10) {
        roleta3D.style.filter = "drop-shadow(0 0 20px #8a2be2) hue-rotate(45deg)";
        roleta3D.style.animationDuration = "0.2s";
    } else {
        roleta3D.style.filter = "";
        roleta3D.style.animationDuration = "0.5s";
    }

    let afinidadesPossiveis = todosElementosLista.map(el => el.nome);
    let piscar = 0;

    // Inicia a animação 3D de nomes a piscar (Mais rápida caso seja 10x)
    const velocidadeFlicker = qtd >= 10 ? 60 : 120;
    const loopVisual3D = setInterval(() => {
        roleta3D.innerHTML = `<span style="font-size:18px; font-weight:bold; text-shadow: 1px 1px 5px #000; text-align:center;">${afinidadesPossiveis[piscar % afinidadesPossiveis.length]}</span>`;
        piscar++;
    }, velocidadeFlicker);

    // Som de "tick" acompanhando a velocidade
    let intvTicks = setInterval(() => { if (typeof somTickRoleta === "function") somTickRoleta(); }, velocidadeFlicker - 10);

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
        roleta3D.style.filter = ""; // Reseta o efeito de aura gacha
        roleta3D.style.animationDuration = "";

        // Se girou 1x mostra o item na bola, se girou 10x reseta para a mística esfera original
        roleta3D.innerHTML = qtd === 1 ? `<span style="font-size:14px; text-align:center; color:${resFinais[0].raro ? '#d4af37' : '#fff'};">${resFinais[0].item.nome}</span>` : "🔮";

        // 🛑 2. FORÇAR A PARAGEM DO ÁUDIO DE GIRO
        const audioGiroObj = document.getElementById("audio-roletando");
        if (audioGiroObj) {
            audioGiroObj.pause();
            audioGiroObj.currentTime = 0;
            audioGiroObj.loop = false;
        }

        // Verifica se o jogador ganhou um item raro ou não no meio de todos os giros
        const ganhouRaro = resFinais.some(res => res.raro === true);
        const somFinal = document.getElementById(ganhouRaro ? "audio-sucesso" : "audio-fail");

        if (somFinal) {
            somFinal.currentTime = 0;
            somFinal.loop = false;
            somFinal.play().catch(e => console.log("O navegador bloqueou o áudio:", e));
        }

        // Reativa os botões da interface
        document.getElementById("btn-girar").disabled = false;
        if (btn10) btn10.disabled = false;

        // Monta o HTML do resultado (Adicionado badge estético para itens raros)
        let htm = ""; let dStr = new Date().toLocaleDateString();
        for (let res of resFinais) {
            if (!u.historico) u.historico = [];
            u.historico.push({ categoria: res.cat, afinidade: res.item.nome, data: dStr });

            let cor = res.raro ? "#d4af37" : "#e2d7f3";
            let prefixo = res.raro ? "⭐ [ÉPICO] " : "✨ ";
            htm += `<div style='padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); color:${cor}; font-weight:bold;'>${prefixo}${res.item.nome} (${res.cat})</div>`;
        }

        // Tenta fazer o update no Firebase e CAPTURA erros
        try {
            let totalGirosAtual = (u.totalGiros || 0) + qtd;
            let novoNivel = Math.min(configGlobais.nivelMax || 99, Math.floor(1 + (totalGirosAtual / 25)));
            let novoValorEssencias = Math.max(0, essenciasAtuais - qtd);

            // Pega a ÚLTIMA afinidade tirada na roleta para equipar automaticamente
            let ultimaAfinidadeSorteada = resFinais[resFinais.length - 1].item.nome;

            // Envia tudo condensado numa única chamada ao banco de dados (Corrigido duplicata)
            await userRef.update({
                tentativas: novoValorEssencias,
                historico: u.historico,
                totalGiros: totalGirosAtual,
                totalRaros: (u.totalRaros || 0) + (resFinais.filter(x => x.raro).length),
                scorePrestigio: totalGirosAtual * 10,
                pityCounter: pity,
                nivel: novoNivel,
                tituloEquipado: ultimaAfinidadeSorteada
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
            else alert("Erro ao salvar no banco de dados.");
        }
    }, 4600); // Mantém os 4.6 segundos originais para gerar aquele suspense clássico!
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

    let essenciasAtuais = Math.max(u.tentativas || 0, u.tentativas || 0);
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
            tentativas: parseInt(novasEssencias),
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
let listenerChatAtual = null;
let conversasAbertas = new Set();

// 1. CHAME ESTA FUNÇÃO LOGO APÓS O LOGIN DO JOGADOR (ex: dentro de entrarNoSistema)
function liberarBotaoSussurroDoJogo() {
    const btn = document.getElementById("btn-abrir-sussurros");
    if (btn) btn.style.display = "inline-block"; // Torna o botão visível após login
}



// 3. Auxiliar para criar IDs determinísticas das salas no Firebase
function gerarSalaId(user1, user2) {
    return [user1, user2].sort().join("_");
}

// 4. Abre o canal de comunicação direto com um jogador
function abrirConversaCom(nomeDestinatario) {
    if (!nomeDestinatario || nomeDestinatario === usuarioLogado) return;

    usuarioChatAtivo = nomeDestinatario;

    // 🌟 ALTERADO: Se o contato não estiver no Set, adiciona localmente e salva no Firebase
    if (!conversasAbertas.has(nomeDestinatario)) {
        conversasAbertas.add(nomeDestinatario);

        db.collection("usuarios").doc(usuarioLogado).update({
            conversasAtivas: firebase.firestore.FieldValue.arrayUnion(nomeDestinatario)
        }).catch(e => console.error("Erro ao sincronizar novo contacto na nuvem:", e));
    }

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
            const caixa = document.getElementById("box-mensagens-sussurro");

            if (!caixa) {
                console.error("Erro: A caixa 'box-mensagens-sussurro' não foi encontrada no HTML!");
                return;
            }

            caixa.innerHTML = "";

            if (snapshot.empty) {
                caixa.innerHTML = `<div class="aviso-inicial" style="color: #888; text-align: center; font-style: italic; margin-top: 50px;">Início do sussurro seguro com ${nomeDestinatario}.</div>`;
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



async function enviarMensagemSussurro() {
    console.log("🔍 Alvo detectado na hora de enviar:", usuarioChatAtivo);
    // 1. Verifica se tem um alvo selecionado
    if (typeof usuarioChatAtivo === 'undefined' || !usuarioChatAtivo) {
        alert("Selecione alguém para sussurrar primeiro!");
        return;
    }

    const input = document.getElementById("input-msg-privada");
    let texto = input.value.trim();

    // 2. Não deixa enviar mensagem vazia
    if (!texto) return;

    // (Opcional) Atalhos rápidos de teclado para emojis!
    texto = texto.replace(/:\)/g, "🙂").replace(/:D/g, "😃").replace(/<3/g, "❤️");

    // 3. Gera o ID da sala exato entre você e o alvo
    const salaId = gerarSalaId(usuarioLogado, usuarioChatAtivo);

    const novaMsg = {
        remetente: usuarioLogado,
        texto: texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // 4. Salva a mensagem no banco de dados da sala
        await db.collection("chats_privados").doc(salaId).collection("mensagens").add(novaMsg);

        // 5. Manda um "sinal" para o banco avisando o alvo que ele tem mensagem nova (para piscar a bolinha)
        await db.collection("notificacoes_sussurro").doc(usuarioChatAtivo).set({
            novaMensagem: true,
            remetenteAtivo: usuarioLogado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 6. Limpa a barra de digitação após o envio
        input.value = "";
        input.focus();
    } catch (error) {
        console.error("Erro ao enviar o sussurro:", error);
    }
}
function escutarNovosSussurrosGlobais() {
    if (!usuarioLogado) return;

    db.collection("notificacoes_sussurro").doc(usuarioLogado)
        .onSnapshot(doc => {
            if (doc.exists) {
                const dados = doc.data();

                if (dados.novaMensagem && dados.remetenteAtivo) {
                    const novoContato = dados.remetenteAtivo;

                    // 🌟 ALTERADO: Se for uma pessoa nova, adiciona no Set e salva permanentemente na nuvem
                    if (typeof conversasAbertas !== 'undefined' && !conversasAbertas.has(novoContato)) {
                        conversasAbertas.add(novoContato);

                        db.collection("usuarios").doc(usuarioLogado).update({
                            conversasAtivas: firebase.firestore.FieldValue.arrayUnion(novoContato)
                        }).catch(e => console.error("Erro ao salvar contato recebido por sussurro:", e));
                    }

                    if (typeof renderizarAbasLaterais === "function") renderizarAbasLaterais();

                    // Verifica se o painel está fechado ou se estamos a falar com outra pessoa
                    const painel = document.getElementById("sussurro-chat-panel");
                    if (painel && (painel.classList.contains("hidden") || typeof usuarioChatAtivo === 'undefined' || usuarioChatAtivo !== novoContato)) {
                        // Mostra a bolinha vermelha!
                        const badge = document.getElementById("notificacao-sussurro-geral");
                        if (badge) badge.style.display = "inline";
                    }

                    // Apaga o alerta no banco para não ficar a piscar repetidamente
                    db.collection("notificacoes_sussurro").doc(usuarioLogado).update({ novaMensagem: false });
                }
            }
        });
}
// Garante que o jogo vai puxar as matrizes novas assim que a página carregar
window.addEventListener('load', () => {
    sincronizarMatrizesDaForja();
});
// ==========================================
// 🗑️ SISTEMA DE EXCLUSÃO DA FORJA
// ==========================================

async function deletarMatrizDaForja(tipoBase, nomeDaMatriz) {
    let confirmacao = confirm(`⚠️ O Machado vai cair!\nTem certeza que deseja apagar [${nomeDaMatriz}] para sempre?`);
    if (!confirmacao) return;

    // Descobre em qual coleção procurar
    let colecao = "";
    if (tipoBase === "raca") colecao = "racas";
    else if (tipoBase === "classe") colecao = "classes";
    else if (tipoBase === "afinidade") colecao = "afinidades";

    try {
        // 1. Apaga do banco de dados Firebase
        await db.collection(colecao).doc(nomeDaMatriz).delete();

        // 2. Limpa da memória local do JavaScript para não voltar se a tela for redesenhada
        if (tipoBase === "raca" && typeof racas !== 'undefined') {
            // Se for objeto: delete racas[nomeDaMatriz];
            // Se for array:
            racas = racas.filter(r => (r.nome || r.id) !== nomeDaMatriz);
        }
        else if (tipoBase === "classe" && typeof classes !== 'undefined') {
            // Se for objeto: delete classes[nomeDaMatriz];
            // Se for array:
            classes = classes.filter(c => (c.nome || c.id) !== nomeDaMatriz);
        }
        else if (tipoBase === "afinidade" && typeof afinidades !== 'undefined') {
            // Como as afinidades são divididas por categoria, varremos todas para remover a correta
            Object.keys(afinidades).forEach(categoria => {
                afinidades[categoria] = afinidades[categoria].filter(a => a.nome !== nomeDaMatriz);
            });
        }

        // 3. Destrói o elemento na tela instantaneamente
        // Tenta achar o elemento pelo ID formatado (ex: id="card-raca-Elfo") ou pelo ID simples (ex: id="Elfo")
        const idFormatado = `card-${tipoBase}-${nomeDaMatriz}`;
        const elementoVisual = document.getElementById(idFormatado) || document.getElementById(nomeDaMatriz);

        if (elementoVisual) {
            elementoVisual.remove();
        } else {
            console.warn(`Elemento HTML não encontrado para remover sem F5. O ID procurado era '${idFormatado}' ou '${nomeDaMatriz}'.`);
            // Se o elemento não sumir, você precisará ajustar o HTML (veja a dica abaixo).
        }

        alert(`💥 [${nomeDaMatriz}] foi apagado(a) da existência!`);

        // REMOVIDO: window.location.reload(); 
    } catch (error) {
        console.error("Erro ao apagar:", error);
        alert("Erro ao tentar apagar. Verifique o console.");
    }
}