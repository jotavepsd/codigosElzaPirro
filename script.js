import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue,
    remove
}
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


// =========================================================
// FIREBASE
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


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const rootRef = ref(db, "volei_2026");


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


                    <div class="classificacao">

                        <h3 class="classificacao-titulo">
                            Classificação
                        </h3>


                        <table>

                            <thead>

                                <tr>

                                    <th>Pos.</th>

                                    <th>Equipe</th>

                                    <th>J</th>

                                    <th>V</th>

                                    <th>D</th>

                                    <th>PTS</th>

                                    <th>Saldo</th>

                                    <th>Torcida</th>

                                    <th>Total</th>

                                </tr>

                            </thead>


                            <tbody
                                id="tabela-${grupoId}">
                            </tbody>

                        </table>


                        <div class="legenda">

                            PTS = pontos das partidas |
                            Saldo = pontos feitos - sofridos |
                            Total = PTS + torcida

                        </div>

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

function atualizarTabelas() {

    for (
        const periodo
        of ["manha", "tarde"]
    ) {

        for (
            const grupoNome
            in campeonato[periodo]
        ) {

            const times =
                campeonato[periodo][grupoNome];


            const ranking =
                calcularClassificacao(
                    periodo,
                    grupoNome,
                    times
                );


            const quantidadeClassificados =
                classificados
                    [periodo]
                    [grupoNome];


            const tabelaId =
                `tabela-${periodo}-${idSeguro(grupoNome)}`;


            const tbody =
                document.getElementById(
                    tabelaId
                );


            if (!tbody) {
                continue;
            }


            tbody.innerHTML =

                ranking
                    .map((time, index) => {

                        const posicao =
                            index + 1;


                        const classificado =
                            posicao <=
                            quantidadeClassificados;


                        const saldoFormatado =
                            time.saldo > 0
                                ? `+${time.saldo}`
                                : time.saldo;


                        return `

                            <tr class="${
                                classificado
                                    ? "classificado"
                                    : ""
                            }">

                                <td>
                                    ${posicao}º
                                </td>


                                <td>
                                    ${time.nome}
                                </td>


                                <td>
                                    ${time.jogos}
                                </td>


                                <td>
                                    ${time.vitorias}
                                </td>


                                <td>
                                    ${time.derrotas}
                                </td>


                                <td>
                                    ${time.pontos}
                                </td>


                                <td>
                                    ${saldoFormatado}
                                </td>


                                <td>

                                    <strong>
                                        ${time.torcida}
                                    </strong>


                                    <div
                                        class="torcida-buttons">

                                        <button
                                            class="btn-torcida btn-menos"

                                            onclick="
                                                alterarTorcida(
                                                    '${periodo}',
                                                    '${grupoNome}',
                                                    '${time.nome}',
                                                    -1
                                                )
                                            "
                                        >
                                            −
                                        </button>


                                        <button
                                            class="btn-torcida btn-mais"

                                            onclick="
                                                alterarTorcida(
                                                    '${periodo}',
                                                    '${grupoNome}',
                                                    '${time.nome}',
                                                    1
                                                )
                                            "
                                        >
                                            +1
                                        </button>

                                    </div>

                                </td>


                                <td>
                                    <strong>
                                        ${time.total}
                                    </strong>
                                </td>

                            </tr>

                        `;

                    })
                    .join("");

        }

    }

}


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

        dadosAtuais =
            snapshot.val() || {};


        atualizarInputs();

        atualizarTabelas();

    }
);


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
