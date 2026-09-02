// =========================================================
// FIREBASE (COMPAT — funciona sem servidor/localmente)
// =========================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDPmyf4FhiPC-HNw_maPv1VRIaGTzHpFEc",

    authDomain:
        "interclassequeimada.firebaseapp.com",

    projectId:
        "interclassequeimada",

    storageBucket:
        "interclassequeimada.firebasestorage.app",

    messagingSenderId:
        "366267653198",

    databaseURL:
        "https://interclassequeimada-default-rtdb.firebaseio.com",

    appId:
        "1:366267653198:web:650743ca118bc8c239771f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const rootRef = db.ref("volei_2026");

// Compatibilidade com o restante do código original
const ref = (database, path) => database.ref(path);
const set = (reference, value) => reference.set(value);
const remove = (reference) => reference.remove();
const onValue = (reference, callback, errorCallback) => reference.on("value", callback, errorCallback);

// =========================================================
// TIMES
// =========================================================

const campeonato = {

    manha: {

        "Grupo A": [
            "Garras Noturnas",
            "Imperadores do Gelo",
            "Guardas de Ferro"
        ],

        "Grupo B": [
            "Ventos Celestes",
            "Presas Prateadas",
            "Dragões Celestiais"
        ],

        "Grupo C": [
            "Plumas Reais",
            "Presas Reais",
            "Asas Negras"
        ],

        "Grupo D": [
            "Olhos da Noite",
            "Guardiões do Gelo",
            "Asas Imperiais"
        ]
    },


    tarde: {

        "Grupo A": [
            "Fúrias do Norte",
            "Gigantes da Ilha",
            "Reis Implacáveis",
            "Garras de Neve"
        ],

        "Grupo B": [
            "Garras de Ouro",
            "Lanças do Mar",
            "Ecos da Sombra"
        ],

        "Grupo C": [
            "Ferrões de Fogo",
            "Mestres Astutos",
            "Ilusionistas"
        ]
    }

};


// =========================================================
// QUANTIDADE DE CLASSIFICADOS
// =========================================================

const classificados = {

    manha: {

        "Grupo A": 1,
        "Grupo B": 1,
        "Grupo C": 1,
        "Grupo D": 1

    },

    tarde: {

        "Grupo A": 2,
        "Grupo B": 1,
        "Grupo C": 1

    }

};


// =========================================================
// DADOS ATUAIS
// =========================================================

let dadosAtuais = {};
let classificacoes = { manha: {}, tarde: {} };


// =========================================================
// FUNÇÃO PARA CRIAR ID SEGURO
// =========================================================

function idSeguro(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
}


// =========================================================
// ID DO JOGO
// =========================================================

function criarIdJogo(time1, time2) {

    return `${idSeguro(time1)}_x_${idSeguro(time2)}`;

}


// =========================================================
// CRIAR INTERFACE
// =========================================================

function criarInterface() {

    const app = document.getElementById("app");

    let html = "";


    // =====================================================
    // MANHÃ E TARDE
    // =====================================================

    for (const periodo of ["manha", "tarde"]) {

        const titulo =
            periodo === "manha"
                ? "🌅 Jogos da Manhã"
                : "🌇 Jogos da Tarde";


        html += `
            <section>

                <h2>${titulo}</h2>
        `;


        // =================================================
        // GRUPOS
        // =================================================

        for (const grupoNome in campeonato[periodo]) {

            const grupoId =
                `${periodo}-${idSeguro(grupoNome)}`;


            html += `

                <div class="grupo">

                    <h3>${grupoNome}</h3>

                    <div
                        class="jogos"
                        id="jogos-${grupoId}">
                    </div>


                    <div class="painel-classificacao">
                        <div class="painel-classificacao-topo">
                            <div><strong>🏆 Classificar Times</strong><div class="status-classificacao" data-periodo="${periodo}" data-grupo="${grupoNome}"></div></div>
                            <label class="switch" title="Ativar classificação deste grupo">
                                <input type="checkbox" id="ativar-classificacao-${grupoId}" onchange="alternarClassificacao('${periodo}', '${grupoNome}', this.checked)">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="config-classificacao">
                            <label for="quantidade-classificados-${grupoId}">Quantos times serão classificados?</label>
                            <select id="quantidade-classificados-${grupoId}" disabled onchange="salvarConfiguracaoClassificacao('${periodo}', '${grupoNome}', this.value)">
                                <option value="">Selecione</option>
                                ${Array.from({length: campeonato[periodo][grupoNome].length}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}
                            </select>
                            <button id="btn-classificar-${grupoId}" class="btn-classificar" disabled onclick="classificarTimes('${periodo}', '${grupoNome}')">🏆 Classificar Times</button>
                        </div>
                    </div>

                    <div class="classificacao">
                        <div class="classificacao-cabecalho"><h3 class="classificacao-titulo">Classificação</h3><button class="btn-imprimir-grupo" onclick="imprimirTabela('${periodo}', '${grupoNome}')">🖨️ Imprimir</button></div>
                        <table id="table-${grupoId}">
                            <thead id="cabecalho-${grupoId}"></thead>
                            <tbody id="tabela-${grupoId}"></tbody>
                        </table>
                        <div class="legenda" id="legenda-${grupoId}"></div>
                    </div>

                </div>

            `;
        }


        html += `
            </section>
        `;
    }


    app.innerHTML = html;


    criarJogos();

}


// =========================================================
// CRIAR JOGOS
// =========================================================

function criarJogos() {

    for (const periodo of ["manha", "tarde"]) {

        for (const grupoNome in campeonato[periodo]) {

            const times =
                campeonato[periodo][grupoNome];


            const grupoId =
                `${periodo}-${idSeguro(grupoNome)}`;


            const container =
                document.getElementById(
                    `jogos-${grupoId}`
                );


            let html = "";


            // =============================================
            // TODAS AS COMBINAÇÕES
            // =============================================

            for (
                let i = 0;
                i < times.length;
                i++
            ) {

                for (
                    let j = i + 1;
                    j < times.length;
                    j++
                ) {

                    const time1 = times[i];

                    const time2 = times[j];


                    const jogoId =
                        criarIdJogo(
                            time1,
                            time2
                        );


                    html += `

                        <div
                            class="jogo"
                            data-jogo="${jogoId}">

                            <div class="jogo-header">


                                <span class="time">
                                    ${time1}
                                </span>


                                <div class="placar">

                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        class="placar1"

                                        data-periodo="${periodo}"

                                        data-grupo="${grupoNome}"

                                        data-time1="${time1}"

                                        data-time2="${time2}"

                                        aria-label="Pontos ${time1}"
                                    >


                                    <span class="vs">
                                        ×
                                    </span>


                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        class="placar2"

                                        data-periodo="${periodo}"

                                        data-grupo="${grupoNome}"

                                        data-time1="${time1}"

                                        data-time2="${time2}"

                                        aria-label="Pontos ${time2}"
                                    >

                                </div>


                                <span
                                    class="time time-direita">

                                    ${time2}

                                </span>


                            </div>


                            <div
                                class="status"
                                id="status-${jogoId}">
                            </div>

                        </div>

                    `;
                }
            }


            container.innerHTML = html;

        }
    }


    adicionarEventosPlacar();

}


// =========================================================
// EVENTOS DOS INPUTS
// =========================================================

function adicionarEventosPlacar() {

    document
        .querySelectorAll(
            ".placar1, .placar2"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                salvarPlacar
            );

        });

}


// =========================================================
// SALVAR PLACAR
// =========================================================

async function salvarPlacar(event) {

    const input = event.target;


    const periodo =
        input.dataset.periodo;


    const grupo =
        input.dataset.grupo;


    const time1 =
        input.dataset.time1;


    const time2 =
        input.dataset.time2;


    const jogoId =
        criarIdJogo(
            time1,
            time2
        );


    const jogoElement =
        document.querySelector(
            `[data-jogo="${jogoId}"]`
        );


    const input1 =
        jogoElement.querySelector(
            ".placar1"
        );


    const input2 =
        jogoElement.querySelector(
            ".placar2"
        );


    const valor1 =
        input1.value.trim();


    const valor2 =
        input2.value.trim();


    // =====================================================
    // APAGAR RESULTADO
    // =====================================================

    if (
        valor1 === "" &&
        valor2 === ""
    ) {

        await remove(
            ref(
                db,
                `volei_2026/${periodo}/${idSeguro(grupo)}/${jogoId}`
            )
        );

        return;

    }


    // =====================================================
    // UM CAMPO VAZIO
    // =====================================================

    if (
        valor1 === "" ||
        valor2 === ""
    ) {

        mostrarStatus(
            jogoId,
            "Informe os dois placares."
        );

        return;

    }


    const pontos1 =
        Number(valor1);


    const pontos2 =
        Number(valor2);


    // =====================================================
    // VALIDAR NÚMEROS
    // =====================================================

    if (
        !Number.isInteger(pontos1) ||
        !Number.isInteger(pontos2) ||
        pontos1 < 0 ||
        pontos2 < 0
    ) {

        mostrarStatus(
            jogoId,
            "Digite números inteiros positivos."
        );

        return;

    }


    // =====================================================
    // NÃO PERMITIR EMPATE
    // =====================================================

    if (
        pontos1 === pontos2
    ) {

        mostrarStatus(
            jogoId,
            "A partida não pode terminar empatada."
        );

        return;

    }


    // =====================================================
    // SALVAR
    // =====================================================

    try {

        await set(

            ref(
                db,
                `volei_2026/${periodo}/${idSeguro(grupo)}/${jogoId}`
            ),

            {

                time1,

                time2,

                pontos1,

                pontos2

            }

        );


        mostrarStatus(
            jogoId,
            "Resultado salvo ✓"
        );


    } catch (error) {

        console.error(error);


        mostrarStatus(
            jogoId,
            "Erro ao salvar resultado."
        );

    }

}


// =========================================================
// STATUS DO JOGO
// =========================================================

function mostrarStatus(
    jogoId,
    mensagem
) {

    const elemento =
        document.getElementById(
            `status-${jogoId}`
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        mensagem;


    setTimeout(() => {

        elemento.textContent = "";

    }, 2500);

}


// =========================================================
// TORCIDA
// =========================================================

async function alterarTorcida(
    periodo,
    grupo,
    time,
    quantidade
) {

    const atual =
        dadosAtuais
            ?. [periodo]
            ?. torcida
            ?. [idSeguro(grupo)]
            ?. [idSeguro(time)]
        || 0;


    const novoValor =
        Math.max(
            0,
            atual + quantidade
        );


    try {

        await set(

            ref(
                db,
                `volei_2026/${periodo}/torcida/${idSeguro(grupo)}/${idSeguro(time)}`
            ),

            novoValor

        );

    } catch (error) {

        console.error(error);


        alert(
            "Não foi possível atualizar a torcida."
        );

    }

}


window.alterarTorcida =
    alterarTorcida;


// =========================================================
// CALCULAR CLASSIFICAÇÃO
// =========================================================

function calcularClassificacao(
    periodo,
    grupo,
    times
) {

    const jogos =
        dadosAtuais
            ?. [periodo]
            ?. [idSeguro(grupo)]
        || {};


    const torcida =
        dadosAtuais
            ?. [periodo]
            ?. torcida
            ?. [idSeguro(grupo)]
        || {};


    const stats = {};


    // =====================================================
    // INICIALIZAR TIMES
    // =====================================================

    times.forEach(time => {

        stats[time] = {

            jogos: 0,

            vitorias: 0,

            derrotas: 0,

            pontos: 0,

            feitos: 0,

            sofridos: 0,

            saldo: 0,

            torcida:
                torcida[
                    idSeguro(time)
                ] || 0

        };

    });


    // =====================================================
    // PROCESSAR JOGOS
    // =====================================================

    Object.values(jogos)
        .forEach(jogo => {

            if (
                !jogo ||
                !Number.isInteger(
                    jogo.pontos1
                ) ||
                !Number.isInteger(
                    jogo.pontos2
                )
            ) {

                return;

            }


            const t1 =
                jogo.time1;


            const t2 =
                jogo.time2;


            const p1 =
                jogo.pontos1;


            const p2 =
                jogo.pontos2;


            if (
                !stats[t1] ||
                !stats[t2]
            ) {

                return;

            }


            // Jogos
            stats[t1].jogos++;

            stats[t2].jogos++;


            // Pontos feitos
            stats[t1].feitos += p1;

            stats[t2].feitos += p2;


            // Pontos sofridos
            stats[t1].sofridos += p2;

            stats[t2].sofridos += p1;


            // Vitória
            if (p1 > p2) {

                stats[t1].vitorias++;

                stats[t1].pontos += 3;

                stats[t2].derrotas++;

            } else {

                stats[t2].vitorias++;

                stats[t2].pontos += 3;

                stats[t1].derrotas++;

            }

        });


    // =====================================================
    // SALDO E TOTAL
    // =====================================================

    times.forEach(time => {

        stats[time].saldo =
            stats[time].feitos -
            stats[time].sofridos;


        stats[time].total =
            stats[time].pontos +
            stats[time].torcida;

    });


    // =====================================================
    // RANKING
    // =====================================================

    const ranking =
        times
            .map(time => ({

                nome: time,

                ...stats[time]

            }))
            .sort((a, b) => {


                // 1º PONTOS DAS PARTIDAS

                if (
                    b.pontos !==
                    a.pontos
                ) {

                    return (
                        b.pontos -
                        a.pontos
                    );

                }


                // 2º SALDO

                if (
                    b.saldo !==
                    a.saldo
                ) {

                    return (
                        b.saldo -
                        a.saldo
                    );

                }


                // 3º TORCIDA

                if (
                    b.torcida !==
                    a.torcida
                ) {

                    return (
                        b.torcida -
                        a.torcida
                    );

                }


                return 0;

            });


    return ranking;

}


// =========================================================
// ATUALIZAR TABELAS
// =========================================================

function grupoPossuiTorcida(periodo, grupo) {
    const torcida = dadosAtuais?.[periodo]?.torcida?.[idSeguro(grupo)] || {};
    return Object.values(torcida).some(valor => Number(valor) > 0);
}

function atualizarTabelas() {
    for (const periodo of ["manha", "tarde"]) {
        for (const grupoNome in campeonato[periodo]) {
            const times = campeonato[periodo][grupoNome];
            const ranking = calcularClassificacao(periodo, grupoNome, times);
            const grupoId = `${periodo}-${idSeguro(grupoNome)}`;
            const tbody = document.getElementById(`tabela-${grupoId}`);
            const cabecalho = document.getElementById(`cabecalho-${grupoId}`);
            const legenda = document.getElementById(`legenda-${grupoId}`);
            if (!tbody || !cabecalho || !legenda) continue;
            const possuiTorcida = grupoPossuiTorcida(periodo, grupoNome);
            const config = classificacoes?.[periodo]?.[idSeguro(grupoNome)] || {};
            const classificadosConfirmados = config.confirmada ? (config.classificados || []) : [];
            cabecalho.innerHTML = possuiTorcida ? `<tr><th>Pos.</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>PTS</th><th>Saldo</th><th>Torcida</th><th>Total</th></tr>` : `<tr><th>Pos.</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>PTS</th><th>Saldo</th></tr>`;
            legenda.innerHTML = possuiTorcida ? `PTS = pontos das partidas | Saldo = pontos feitos - sofridos | Total = PTS + torcida` : `PTS = pontos das partidas | Saldo = pontos feitos - sofridos`;
            tbody.innerHTML = ranking.map((time, index) => {
                const classificado = classificadosConfirmados.includes(time.nome);
                const saldo = time.saldo > 0 ? `+${time.saldo}` : time.saldo;
                return `<tr class="${classificado ? "classificado" : ""}"><td>${index + 1}º</td><td>${time.nome}</td><td>${time.jogos}</td><td>${time.vitorias}</td><td>${time.derrotas}</td><td>${time.pontos}</td><td>${saldo}</td>${possuiTorcida ? `<td><strong>${time.torcida}</strong><div class="torcida-buttons"><button class="btn-torcida btn-menos" onclick="alterarTorcida('${periodo}','${grupoNome}','${time.nome}',-1)">−</button><button class="btn-torcida btn-mais" onclick="alterarTorcida('${periodo}','${grupoNome}','${time.nome}',1)">+1</button></div></td><td><strong>${time.total}</strong></td>` : ""}</tr>`;
            }).join("");
        }
    }
    atualizarStatusClassificacao();
    atualizarControlesClassificacao();
}

async function salvarConfiguracaoClassificacao(periodo, grupo, quantidade) {
    if (quantidade === "") return;
    const quantidadeNumerica = Number(quantidade);
    const totalTimes = campeonato?.[periodo]?.[grupo]?.length || 0;
    if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica < 1) { alert("A quantidade de classificados deve ser um número inteiro positivo."); return; }
    if (quantidadeNumerica > totalTimes) { alert(`Esse grupo possui apenas ${totalTimes} equipes.`); return; }
    const grupoId = idSeguro(grupo);
    const anterior = classificacoes[periodo]?.[grupoId] || {};
    classificacoes[periodo] = classificacoes[periodo] || {};
    classificacoes[periodo][grupoId] = {...anterior, quantidade: quantidadeNumerica, ativa: true, confirmada: false, classificados: []};
    try { await set(ref(db, `volei_2026/classificacao/${periodo}/${grupoId}`), classificacoes[periodo][grupoId]); atualizarStatusClassificacao(); atualizarControlesClassificacao(); atualizarTabelas(); }
    catch(error){ console.error(error); alert("Não foi possível salvar a configuração de classificação."); }
}

async function alternarClassificacao(periodo, grupo, ativar) {
    const grupoId = idSeguro(grupo); classificacoes[periodo] = classificacoes[periodo] || {};
    const anterior = classificacoes[periodo][grupoId] || {};
    classificacoes[periodo][grupoId] = {...anterior, ativa:Boolean(ativar)};
    if (!ativar) { classificacoes[periodo][grupoId].confirmada=false; classificacoes[periodo][grupoId].classificados=[]; }
    try { await set(ref(db, `volei_2026/classificacao/${periodo}/${grupoId}`), classificacoes[periodo][grupoId]); atualizarStatusClassificacao(); atualizarControlesClassificacao(); atualizarTabelas(); }
    catch(error){ console.error(error); alert("Não foi possível atualizar a classificação."); }
}

async function classificarTimes(periodo, grupo) {
    const grupoId = idSeguro(grupo);
    const config = classificacoes?.[periodo]?.[grupoId];
    if (!config?.ativa) { alert("A classificação deste grupo ainda não está ativada."); return; }
    const quantidade = Number(config.quantidade);
    const times = campeonato?.[periodo]?.[grupo];
    if (!quantidade || quantidade < 1) { alert("Defina primeiro a quantidade de times classificados."); return; }
    if (!times?.length) { alert("Não foi possível encontrar as equipes deste grupo."); return; }
    const ranking = calcularClassificacao(periodo, grupo, times);
    const jogosEsperados = (times.length * (times.length - 1)) / 2;
    const jogosGrupo = dadosAtuais?.[periodo]?.[grupoId] || {};
    const jogosRealizados = Object.values(jogosGrupo).filter(j => j && Number.isInteger(j.pontos1) && Number.isInteger(j.pontos2)).length;
    if (jogosRealizados < jogosEsperados) {
        if (!confirm(`Ainda existem jogos não registrados neste grupo.\n\nJogos registrados: ${jogosRealizados}/${jogosEsperados}\n\nDeseja mesmo assim classificar os times?`)) return;
    }
    const selecionados = ranking.slice(0, quantidade).map(t => t.nome);
    let mensagem = `CLASSIFICAR TIMES\n\n${periodo === "manha" ? "MANHÃ" : "TARDE"} - ${grupo}\n\nSerão classificados ${quantidade} time(s):\n\n`;
    selecionados.forEach((nome, i) => { mensagem += `${i + 1}º - ${nome}\n`; });
    if (!confirm(mensagem + `\nDeseja confirmar essa classificação?`)) return;
    classificacoes[periodo][grupoId] = {
        ...config, quantidade, ativa: true, confirmada: true,
        classificados: selecionados, dataClassificacao: new Date().toISOString()
    };
    try {
        await set(ref(db, `volei_2026/classificacao/${periodo}/${grupoId}`), classificacoes[periodo][grupoId]);
        atualizarStatusClassificacao(); atualizarControlesClassificacao(); atualizarTabelas();
        alert(`Classificação do ${grupo} confirmada com sucesso!`);
    } catch (error) { console.error(error); alert("Não foi possível salvar a classificação."); }
}

function classificacaoMudou(periodo,grupo){const config=classificacoes?.[periodo]?.[idSeguro(grupo)];if(!config?.confirmada)return false;const ranking=calcularClassificacao(periodo,grupo,campeonato[periodo][grupo]);const atuais=ranking.slice(0,Number(config.quantidade)).map(t=>t.nome);return JSON.stringify(atuais)!==JSON.stringify(config.classificados||[]);}
function atualizarStatusClassificacao(){document.querySelectorAll(".status-classificacao").forEach(el=>{const periodo=el.dataset.periodo,grupo=el.dataset.grupo,config=classificacoes?.[periodo]?.[idSeguro(grupo)]||{};if(!config.ativa)el.innerHTML=`<span class="classificacao-inativa">Classificação desativada</span>`;else if(!config.confirmada)el.innerHTML=`<span class="classificacao-pendente">Classificação ativada — ${config.quantidade||"defina a quantidade"} classificado(s)</span>`;else if(classificacaoMudou(periodo,grupo))el.innerHTML=`<span class="classificacao-alerta">⚠️ Classificação precisa ser atualizada</span>`;else el.innerHTML=`<span class="classificacao-confirmada">🏆 ${config.quantidade} classificado(s)</span>`;});}
function atualizarControlesClassificacao(){for(const periodo of ["manha","tarde"])for(const grupoNome in campeonato[periodo]){const grupoId=`${periodo}-${idSeguro(grupoNome)}`,config=classificacoes?.[periodo]?.[idSeguro(grupoNome)]||{},checkbox=document.getElementById(`ativar-classificacao-${grupoId}`),select=document.getElementById(`quantidade-classificados-${grupoId}`),botao=document.getElementById(`btn-classificar-${grupoId}`);if(checkbox)checkbox.checked=Boolean(config.ativa);if(select){select.disabled=!config.ativa;select.value=config.quantidade||"";}if(botao)botao.disabled=!(config.ativa&&config.quantidade);}}
window.salvarConfiguracaoClassificacao=salvarConfiguracaoClassificacao;window.alternarClassificacao=alternarClassificacao;window.classificarTimes=classificarTimes;

function imprimirTabela(periodo,grupo,incluirClassificados=true){const grupoId=`${periodo}-${idSeguro(grupo)}`,tabela=document.getElementById(`table-${grupoId}`);if(!tabela)return;const config=classificacoes?.[periodo]?.[idSeguro(grupo)]||{},nomes=config.confirmada?(config.classificados||[]):[],w=window.open("","_blank","width=1000,height=800");if(!w){alert("O navegador bloqueou a janela de impressão. Permita pop-ups.");return;}const lista=incluirClassificados&&nomes.length?`<div class="print-classificados"><h3>🏆 Classificados</h3><ol>${nomes.map(n=>`<li>${n}</li>`).join("")}</ol></div>`:"";w.document.write(`<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>${grupo}</title><style>body{font-family:Arial;padding:30px}h1,h2{text-align:center}h2{color:#3949ab}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #999;padding:9px;text-align:center}th{background:#3949ab;color:#fff}td:nth-child(2){text-align:left;font-weight:bold}.classificado{background:#b9f6ca}.print-classificados{margin-top:25px}</style></head><body><h1>🏐 Interclasse de Vôlei 2026</h1><h2>${periodo==="manha"?"MANHÃ":"TARDE"} — ${grupo}</h2>${tabela.outerHTML}${lista}<script>window.onload=function(){window.print()}<\/script></body></html>`);w.document.close();}
window.imprimirTabela=imprimirTabela;


// =========================================================
// ATUALIZAR INPUTS
// =========================================================

function atualizarInputs() {

    for (
        const periodo
        of ["manha", "tarde"]
    ) {

        for (
            const grupoNome
            in campeonato[periodo]
        ) {

            const jogos =
                dadosAtuais
                    ?. [periodo]
                    ?. [idSeguro(grupoNome)]
                || {};


            Object.values(jogos)
                .forEach(jogo => {

                    if (!jogo) {
                        return;
                    }


                    const jogoId =
                        criarIdJogo(
                            jogo.time1,
                            jogo.time2
                        );


                    const elemento =
                        document.querySelector(
                            `[data-jogo="${jogoId}"]`
                        );


                    if (!elemento) {
                        return;
                    }


                    const input1 =
                        elemento.querySelector(
                            ".placar1"
                        );


                    const input2 =
                        elemento.querySelector(
                            ".placar2"
                        );


                    if (
                        document.activeElement !==
                        input1
                    ) {

                        input1.value =
                            jogo.pontos1 ?? "";

                    }


                    if (
                        document.activeElement !==
                        input2
                    ) {

                        input2.value =
                            jogo.pontos2 ?? "";

                    }

                });

        }

    }

}


// =========================================================
// FIREBASE EM TEMPO REAL
// =========================================================

onValue(
    rootRef,
    snapshot => {

        dadosAtuais = snapshot.val() || {};
        classificacoes = { manha: dadosAtuais?.classificacao?.manha || {}, tarde: dadosAtuais?.classificacao?.tarde || {} };
        atualizarInputs();
        atualizarTabelas();
        atualizarStatusClassificacao();
        atualizarControlesClassificacao();

    },
    error => {
        console.error("Erro ao carregar Firebase:", error);
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `<div class="carregando">Erro ao carregar o banco de dados.<br><small>${error?.message || "Verifique a internet e as regras do Firebase Realtime Database."}</small></div>`;
        }
    }
);


function abrirImpressaoTabelas(){
    const win=window.open("","_blank","width=1100,height=900");
    if(!win){alert("O navegador bloqueou a janela de impressão. Permita pop-ups.");return;}
    let html=`<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Interclasse de Vôlei 2026 — Tabelas</title><style>body{font-family:Arial;color:#222}section{padding:25px;page-break-after:always}section:last-child{page-break-after:auto}h1,h2{text-align:center}h2{color:#3949ab}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #999;padding:8px;text-align:center}th{background:#3949ab;color:#fff}td:nth-child(2){text-align:left;font-weight:bold}.classificado{background:#b9f6ca;font-weight:bold}.print-classificados{margin-top:18px}</style></head><body>`;
    for(const periodo of ["manha","tarde"])for(const grupo of Object.keys(campeonato[periodo])){const grupoId=`${periodo}-${idSeguro(grupo)}`,tabela=document.getElementById(`table-${grupoId}`),config=classificacoes?.[periodo]?.[idSeguro(grupo)]||{},nomes=config.confirmada?(config.classificados||[]):[];html+=`<section><h1>🏐 Interclasse de Vôlei 2026</h1><h2>${periodo==="manha"?"MANHÃ":"TARDE"} — ${grupo}</h2>${tabela?tabela.outerHTML:""}${nomes.length?`<div class="print-classificados"><h3>🏆 Classificados</h3><ol>${nomes.map(n=>`<li>${n}</li>`).join("")}</ol></div>`:""}</section>`;}
    html+=`<script>window.onload=function(){window.print()}<\/script></body></html>`;win.document.write(html);win.document.close();
}
window.abrirImpressaoTabelas=abrirImpressaoTabelas;

// =========================================================
// ZERAR BANCO
// =========================================================

window.limparBanco =
    async function () {

        const confirmar =
            confirm(

                "ATENÇÃO!\n\n" +

                "Isso apagará TODOS os " +
                "resultados e pontos de torcida.\n\n" +

                "Deseja realmente continuar?"

            );


        if (!confirmar) {
            return;
        }


        try {

            await remove(rootRef);


            alert(
                "Banco de dados zerado com sucesso."
            );


            location.reload();


        } catch (error) {

            console.error(error);


            alert(
                "Erro ao zerar o banco de dados."
            );

        }

    };


// =========================================================
// INICIAR SISTEMA
// =========================================================

criarInterface();
