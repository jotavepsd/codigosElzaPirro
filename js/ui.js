import { state, saveStateToFirebase } from './state.js';
import { getTeams, getTeamLogo, renderTeamBadge, slugify } from './utils.js';
import { generateRoundRobin, calculateStandings, getSuspendedPlayersForTeam } from './rules.js';

export function updateRoleBadgeUI() {
    const text = document.getElementById('user-role-text');
    const icon = document.getElementById('user-role-icon');
    const resetBtn = document.getElementById('admin-reset-btn');
    const addBox = document.getElementById('admin-add-player-box');
    const elencosWrapper = document.getElementById('elencos-list-wrapper');

    if (state.isAdmin) {
        if (text) text.textContent = "Modo Admin";
        if (icon) icon.className = "fa-solid fa-user-shield text-gold-400";
        if (resetBtn) resetBtn.classList.remove('hidden');
        if (addBox) addBox.classList.remove('hidden');
        if (elencosWrapper) elencosWrapper.className = "lg:col-span-2 space-y-6";
    } else {
        if (text) text.textContent = "Visitante (Leitura)";
        if (icon) icon.className = "fa-solid fa-eye text-slate-400";
        if (resetBtn) resetBtn.classList.add('hidden');
        if (addBox) addBox.classList.add('hidden');
        if (elencosWrapper) elencosWrapper.className = "lg:col-span-3 space-y-6";
    }
}

export function switchTab(tabId) {
    ['home', 'championship', 'artilharia', 'gestao'].forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.add('hidden');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = "nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-2";
    });

    if (tabId === 'home') {
        document.getElementById('page-home').classList.remove('hidden');
        document.getElementById('nav-home').className = "nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-slate-800 border border-slate-700 flex items-center gap-2";
        updateHomeStats();
    } else if (tabId === 'manha' || tabId === 'tarde') {
        state.currentPeriod = tabId;
        document.getElementById('page-championship').classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).className = "nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-slate-800 border border-slate-700 flex items-center gap-2";
        renderChampionshipHeader();
        renderChampionshipView();
    } else if (tabId === 'artilharia') {
        document.getElementById('page-artilharia').classList.remove('hidden');
        document.getElementById('nav-artilharia').className = "nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-slate-800 border border-slate-700 flex items-center gap-2";
        renderArtilharia(state.currentArtilhariaFilter);
    } else if (tabId === 'gestao') {
        document.getElementById('page-gestao').classList.remove('hidden');
        document.getElementById('nav-gestao').className = "nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-slate-800 border border-slate-700 flex items-center gap-2";
        updateTeamDropdown();
        renderElencos(state.currentElencoPeriod);
    }
}

export function switchChampSubTab(sub) {
    state.currentSubTab = sub;
    const btnTab = document.getElementById('subtab-tabela');
    const btnJogos = document.getElementById('subtab-jogos');
    const viewTab = document.getElementById('champ-view-tabela');
    const viewJogos = document.getElementById('champ-view-jogos');

    if (sub === 'tabela') {
        if (btnTab) btnTab.className = "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all bg-pitch-600 text-white shadow";
        if (btnJogos) btnJogos.className = "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white";
        if (viewTab) viewTab.classList.remove('hidden');
        if (viewJogos) viewJogos.classList.add('hidden');
        renderStandingsTable();
    } else {
        if (btnJogos) btnJogos.className = "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all bg-pitch-600 text-white shadow";
        if (btnTab) btnTab.className = "flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white";
        if (viewJogos) viewJogos.classList.remove('hidden');
        if (viewTab) viewTab.classList.add('hidden');
        renderMatchesView();
    }
}

export function renderAllViews() {
    updateHomeStats();
    populateHomeTeamBadges();
    renderFavoritosSection();
    const champPage = document.getElementById('page-championship');
    if (champPage && !champPage.classList.contains('hidden')) {
        renderChampionshipHeader();
        renderChampionshipView();
    }
    const artPage = document.getElementById('page-artilharia');
    if (artPage && !artPage.classList.contains('hidden')) {
        renderArtilharia(state.currentArtilhariaFilter);
    }
    const gestPage = document.getElementById('page-gestao');
    if (gestPage && !gestPage.classList.contains('hidden')) {
        renderElencos(state.currentElencoPeriod);
    }
}

export function renderChampionshipHeader() {
    const isManha = state.currentPeriod === 'manha';
    const icon = document.getElementById('champ-period-icon');
    const tag = document.getElementById('champ-period-tag');
    const count = document.getElementById('champ-teams-count');
    const title = document.getElementById('champ-title');

    if (isManha) {
        if (icon) {
            icon.className = "w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-bold border border-amber-500/20";
            icon.innerHTML = `<i class="fa-solid fa-sun"></i>`;
        }
        if (tag) { tag.className = "text-xs font-bold uppercase tracking-wider text-amber-400"; tag.textContent = "Período Manhã"; }
        if (count) count.textContent = "7 Equipes • 21 Jogos Total";
        if (title) title.textContent = "Torneio da Manhã";
    } else {
        if (icon) {
            icon.className = "w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-2xl font-bold border border-orange-500/20";
            icon.innerHTML = `<i class="fa-solid fa-cloud-sun"></i>`;
        }
        if (tag) { tag.className = "text-xs font-bold uppercase tracking-wider text-orange-400"; tag.textContent = "Período Tarde"; }
        if (count) count.textContent = "5 Equipes • 20 Jogos Total (2 Turnos)";
        if (title) title.textContent = "Torneio da Tarde";
    }
}

export function renderChampionshipView() {
    if (state.currentSubTab === 'tabela') {
        renderStandingsTable();
    } else {
        renderMatchesView();
    }
}

export function renderStandingsTable() {
    const body = document.getElementById('table-standings-body');
    if (!body) return;
    const standings = calculateStandings(state.currentPeriod);

    let shareBar = document.getElementById('standings-share-bar');
    if (!shareBar && body.parentElement) {
        shareBar = document.createElement('div');
        shareBar.id = 'standings-share-bar';
        shareBar.className = 'flex justify-end mb-3';
        shareBar.innerHTML = `
            <button onclick="shareStandings()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 transition-all flex items-center gap-1.5">
                <i class="fa-brands fa-whatsapp text-sm"></i> Compartilhar Classificação
            </button>
        `;
        body.parentElement.parentElement.insertBefore(shareBar, body.parentElement);
    }

    body.innerHTML = standings.map((item, idx) => {
        const pos = idx + 1;
        let posBadge = `<span class="font-bold text-slate-400">${pos}º</span>`;
        let rowBg = "hover:bg-slate-800/40 transition-colors";

        if (pos === 1) {
            posBadge = `<span class="w-6 h-6 rounded-full bg-gold-500 text-navy-950 font-black flex items-center justify-center text-xs shadow-md shadow-gold-500/20">1</span>`;
            rowBg += " bg-pitch-500/5";
        } else if (pos === 2) {
            posBadge = `<span class="w-6 h-6 rounded-full bg-slate-300 text-navy-950 font-black flex items-center justify-center text-xs">2</span>`;
        } else if (pos === 3) {
            posBadge = `<span class="w-6 h-6 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-xs">3</span>`;
        }

        const sgFormatted = item.sg > 0 ? `+${item.sg}` : item.sg;
        const sgColor = item.sg > 0 ? "text-emerald-400" : (item.sg < 0 ? "text-red-400" : "text-slate-400");

        const last5 = item.form.slice(-5);
        let formHtml = last5.map(entry => {
            const res = typeof entry === 'string' ? entry : entry.res;
            const tooltip = typeof entry === 'string'
                ? (res === 'V' ? 'Vitória' : res === 'E' ? 'Empate' : 'Derrota')
                : entry.tooltip;

            if (res === 'V') return `<span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold cursor-help" title="${tooltip}">V</span>`;
            if (res === 'E') return `<span class="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold cursor-help" title="${tooltip}">E</span>`;
            return `<span class="w-5 h-5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-[10px] font-bold cursor-help" title="${tooltip}">D</span>`;
        }).join('');

        if (last5.length === 0) {
            formHtml = `<span class="text-[10px] text-slate-500 italic">N/A</span>`;
        }

        const isFav = state.userFavorites.teams.includes(item.nome);

        return `
            <tr class="${rowBg}">
                <td class="py-3.5 px-3 sm:px-4 text-center">${posBadge}</td>
                <td class="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                    <button onclick="toggleFavoriteTeam('${item.nome}', event)" class="${isFav ? 'text-gold-400' : 'text-slate-600 hover:text-gold-400'} text-xs">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    ${renderTeamBadge(item.nome, "w-6 h-6")}
                    <span>${item.nome}</span>
                </td>
                <td class="py-3.5 px-3 text-center font-black text-pitch-400 text-base bg-slate-900/40">${item.pts}</td>
                <td class="py-3.5 px-3 text-center text-slate-300">${item.j}</td>
                <td class="py-3.5 px-3 text-center font-semibold text-emerald-400">${item.v}</td>
                <td class="py-3.5 px-3 text-center font-semibold text-amber-400">${item.e}</td>
                <td class="py-3.5 px-3 text-center font-semibold text-red-400">${item.d}</td>
                <td class="py-3.5 px-3 text-center text-slate-300">${item.gp}</td>
                <td class="py-3.5 px-3 text-center text-slate-400">${item.gc}</td>
                <td class="py-3.5 px-3 text-center font-bold ${sgColor}">${sgFormatted}</td>
                <td class="py-3.5 px-4 text-center"><div class="flex items-center justify-center gap-1">${formHtml}</div></td>
            </tr>
        `;
    }).join('');
}

export function renderMatchesView() {
    const container = document.getElementById('matches-container');
    if (!container) return;

    const teams = getTeams(state.currentPeriod);
    // Garante que o filtro de equipe seja válido no turno atual
    if (state.currentMatchTeamFilter !== 'todos' && !teams.includes(state.currentMatchTeamFilter)) {
        state.currentMatchTeamFilter = 'todos';
    }

    const statusFilter = state.currentMatchStatusFilter || 'todos';
    const teamFilter = state.currentMatchTeamFilter || 'todos';
    const hasActiveFilter = statusFilter !== 'todos' || teamFilter !== 'todos';

    // Barra de Filtros (Status + Equipe)
    const statusBtnClass = (val) => statusFilter === val
        ? 'bg-gold-500 text-navy-950 border-gold-400 shadow'
        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800';

    let html = `
        <div class="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                    <i class="fa-solid fa-filter text-gold-400 mr-1"></i> Status:
                </span>
                <button onclick="setMatchStatusFilter('todos')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusBtnClass('todos')}">
                    Todos
                </button>
                <button onclick="setMatchStatusFilter('pendentes')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusBtnClass('pendentes')}">
                    Pendentes
                </button>
                <button onclick="setMatchStatusFilter('finalizados')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusBtnClass('finalizados')}">
                    Finalizados
                </button>
            </div>

            <div class="flex items-center gap-2">
                <select onchange="setMatchTeamFilter(this.value)" aria-label="Filtrar por equipe"
                    class="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-gold-500 w-full md:w-56">
                    <option value="todos" ${teamFilter === 'todos' ? 'selected' : ''}>🛡️ Todas as Equipes</option>
                    ${teams.map(t => `<option value="${t}" ${teamFilter === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
                ${hasActiveFilter ? `
                    <button onclick="resetMatchFilters()" title="Limpar filtros"
                        class="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all shrink-0">
                        <i class="fa-solid fa-xmark"></i> Limpar
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    const currentTeams = getTeams(state.currentPeriod);
    const rounds = generateRoundRobin(currentTeams, state.currentPeriod);
    const savedGames = state.appData.jogos?.[state.currentPeriod] || {};
    const periodGames = state.appData.jogos[state.currentPeriod] || {};
    const scheduledNextMatch = state.appData.nextMatches?.[state.currentPeriod];
    let totalVisibleMatches = 0;

    rounds.forEach((roundMatches, roundIdx) => {
        const roundNum = roundIdx + 1;
        const filteredMatches = roundMatches.filter(match => {
            const gameId = `${slugify(match.team1)}_x_${slugify(match.team2)}`;
            const saved = savedGames[gameId];
            const isPlayed = saved && saved.gols1 !== undefined && saved.gols2 !== undefined && saved.gols1 !== '' && saved.gols2 !== '';

            if (teamFilter !== 'todos' && match.team1 !== teamFilter && match.team2 !== teamFilter) {
                return false;
            }
            if (statusFilter === 'finalizados' && !isPlayed) return false;
            if (statusFilter === 'pendentes' && isPlayed) return false;

            return true;
        });

        // Se a rodada não tiver jogos que batem com o filtro, oculta apenas ela
        if (filteredMatches.length === 0) return;

        totalVisibleMatches += filteredMatches.length;

        html += `
            <div class="bg-navy-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span class="text-xs font-bold uppercase tracking-wider text-pitch-400 flex items-center gap-2">
                        <i class="fa-solid fa-flag-checkered"></i> Rodada ${roundNum} ${roundNum > (currentTeams.length - (currentTeams.length % 2 !== 0 ? 0 : 0) - 1) ? '(Returno)' : ''}
                    </span>
                    <span class="text-xs text-slate-500">${filteredMatches.length} Partida(s)</span>
                </div>
                <div class="space-y-3">
        `;

        filteredMatches.forEach(match => {
            const gameId = `${slugify(match.team1)}_x_${slugify(match.team2)}`;
            const savedGame = periodGames[gameId] || {};
            const val1 = savedGame.gols1 !== undefined ? savedGame.gols1 : '';
            const val2 = savedGame.gols2 !== undefined ? savedGame.gols2 : '';
            const isPlayed = val1 !== '' && val2 !== '';

            const isScheduledAsNext = scheduledNextMatch && scheduledNextMatch.gameId === gameId;
            const hasNextMatchLocked = scheduledNextMatch && scheduledNextMatch.gameId && !isScheduledAsNext;

            const disabledAttr = (state.isAdmin && !isPlayed) ? '' : 'disabled readOnly';

            html += `
                <div class="bg-slate-950 p-4 rounded-xl border ${isPlayed ? 'border-emerald-500/40 bg-slate-950/90' : (isScheduledAsNext ? 'border-gold-500 ring-2 ring-gold-500/20' : 'border-slate-800/80')} flex flex-col sm:flex-row items-center justify-between gap-4 relative">
                    ${isPlayed ? `<span class="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Partida Realizada</span>` : ''}

                    <div class="flex items-center justify-end sm:justify-start gap-3 w-full sm:w-5/12 text-right sm:text-left pt-2 sm:pt-0">
                        ${renderTeamBadge(match.team1, "w-7 h-7")}
                        <span class="font-bold text-sm text-white">${match.team1}</span>
                    </div>

                    <div class="flex items-center justify-center gap-2 w-full sm:w-auto">
                        <input type="number" min="0" max="99" id="input-${gameId}-1" value="${val1}" placeholder="0" ${disabledAttr}
                            class="w-12 h-11 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-lg text-white focus:outline-none focus:border-pitch-500 disabled:opacity-80">
                        
                        <span class="font-bold text-slate-500 text-xs">X</span>

                        <input type="number" min="0" max="99" id="input-${gameId}-2" value="${val2}" placeholder="0" ${disabledAttr}
                            class="w-12 h-11 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-lg text-white focus:outline-none focus:border-pitch-500 disabled:opacity-80">
                    </div>

                    <div class="flex items-center justify-start sm:justify-end gap-3 w-full sm:w-5/12 text-left sm:text-right">
                        <span class="font-bold text-sm text-white">${match.team2}</span>
                        ${renderTeamBadge(match.team2, "w-7 h-7")}
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 flex-wrap">
                        ${state.isAdmin ? (isPlayed ? `
                            <button onclick="resetMatchScore('${gameId}')" title="Desfazer/Editar Placar"
                                class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5">
                                <i class="fa-solid fa-rotate-left"></i> Editar
                            </button>
                        ` : `
                            <button onclick="saveMatchScore('${match.team1}', '${match.team2}', '${gameId}')" title="Salvar Placar"
                                class="px-3 py-2 bg-pitch-600 hover:bg-pitch-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5">
                                <i class="fa-solid fa-check"></i> Salvar
                            </button>

                            <button onclick="setNextMatch('${state.currentPeriod}', '${gameId}', '${match.team1}', '${match.team2}')" 
                                ${hasNextMatchLocked || isScheduledAsNext ? 'disabled' : ''}
                                class="px-3 py-2 ${isScheduledAsNext ? 'bg-gold-500 text-navy-950 font-black' : (hasNextMatchLocked ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-gold-400')} border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                                <i class="fa-solid fa-bell"></i> ${isScheduledAsNext ? 'Em Destaque' : 'Marcar Próximo'}
                            </button>
                        `) : ''}
                        <button onclick="openGoalsModal('${match.team1}', '${match.team2}', '${gameId}')" title="Autores dos Gols e Cartões"
                            class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gold-400 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                            <i class="fa-solid fa-futbol"></i> Gols & Cartões
                        </button>
                    </div>
                    ${isScheduledAsNext ? (() => {
                        const susp1 = getSuspendedPlayersForTeam(match.team1, state.currentPeriod, state);
                        const susp2 = getSuspendedPlayersForTeam(match.team2, state.currentPeriod, state);
                        if (susp1.length === 0 && susp2.length === 0) return '';
                        return `
                            <div class="w-full pt-2.5 mt-1 border-t border-red-500/20 flex flex-wrap items-center gap-2 text-[11px]">
                                <span class="font-bold text-red-400 flex items-center gap-1"><i class="fa-solid fa-ban"></i> Suspensos neste jogo:</span>
                                ${susp1.map(s => `<span class="px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">${s.nome} (${match.team1} - ${s.reason})</span>`).join('')}
                                ${susp2.map(s => `<span class="px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">${s.nome} (${match.team2} - ${s.reason})</span>`).join('')}
                            </div>
                        `;
                    })() : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    // Verifica apenas uma vez no final se nenhum jogo apareceu após filtrar todas as rodadas
    if (totalVisibleMatches === 0) {
        html += `
            <div class="bg-navy-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <i class="fa-solid fa-magnifying-glass text-2xl text-slate-500"></i>
                <p class="text-sm font-bold text-slate-300">Nenhuma partida encontrada para esta combinação de filtros.</p>
                <button onclick="resetMatchFilters()" class="px-4 py-2 rounded-xl text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 transition-all">
                    Mostrar Todos os Jogos
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}

export function formatGoalScorers(gameData, targetTeam) {
    if (!gameData) return null;
    const matchGols = gameData.matchGols || {};
    const matchOwnGols = gameData.matchOwnGols || {};
    const scorers = [];

    Object.entries(matchGols).forEach(([playerId, count]) => {
        if (count > 0) {
            const player = state.appData.jogadores?.[playerId];
            if (player && player.team === targetTeam) {
                scorers.push(count > 1 ? `${player.nome} (${count})` : player.nome);
            }
        }
    });

    Object.entries(matchOwnGols).forEach(([playerId, count]) => {
        if (count > 0) {
            const player = state.appData.jogadores?.[playerId];
            if (player && player.team !== targetTeam) {
                scorers.push(count > 1 ? `${player.nome} (GC x${count})` : `${player.nome} (GC)`);
            }
        }
    });

    return scorers.length > 0 ? scorers.join(', ') : null;
}

export function renderFavoritosSection() {
    const section = document.getElementById('home-favoritos-section');
    const container = document.getElementById('home-favoritos-cards');
    if (!section || !container) return;

    const favTeams = state.userFavorites.teams || [];
    const favPlayers = state.userFavorites.players || [];

    if (favTeams.length === 0 && favPlayers.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    let html = "";

    favTeams.forEach(teamName => {
        let period = 'manha';
        if (getTeams('tarde').includes(teamName)) {
            period = 'tarde';
        }

        const games = state.appData.jogos?.[period] || {};
        const playedGames = Object.values(games).filter(g => 
            g && (g.team1 === teamName || g.team2 === teamName) && 
            g.gols1 !== undefined && g.gols2 !== undefined && g.gols1 !== "" && g.gols2 !== ""
        );

        playedGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const lastGame = playedGames[0];

        let team1Scorers = lastGame ? formatGoalScorers(lastGame, lastGame.team1) : null;
        let team2Scorers = lastGame ? formatGoalScorers(lastGame, lastGame.team2) : null;

        html += `
            <div class="bg-navy-900 rounded-2xl p-5 border border-gold-500/40 space-y-3 relative overflow-hidden shadow-xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div class="flex items-center gap-2">
                        ${renderTeamBadge(teamName, "w-6 h-6")}
                        <h4 class="font-bold text-white text-base">${teamName}</h4>
                        <span class="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 capitalize">${period}</span>
                    </div>
                    <button onclick="toggleFavoriteTeam('${teamName}', event)" class="text-gold-400 hover:text-slate-400 text-sm">
                        <i class="fa-solid fa-star"></i>
                    </button>
                </div>

                ${lastGame ? `
                    <div class="text-xs space-y-2">
                        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Última Partida:</span>
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-200">${lastGame.team1}</span>
                                <span class="font-black text-gold-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">${lastGame.gols1} x ${lastGame.gols2}</span>
                                <span class="font-bold text-slate-200">${lastGame.team2}</span>
                            </div>
                            
                            ${(team1Scorers || team2Scorers) ? `
                                <div class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                                    <div class="text-left text-slate-400">
                                        ${team1Scorers ? `<span class="text-pitch-400 font-bold">⚽ Gols:</span> ${team1Scorers}` : ''}
                                    </div>
                                    <div class="text-right text-slate-400">
                                        ${team2Scorers ? `<span class="text-pitch-400 font-bold">⚽ Gols:</span> ${team2Scorers}` : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : `
                    <p class="text-xs text-slate-500 italic">Nenhum resultado registrado para este time ainda.</p>
                `}
                ${(() => {
                    const suspList = getSuspendedPlayersForTeam(teamName, period, state);
                    if (suspList.length === 0) return '';
                    return `
                        <div class="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                            <span class="text-red-400 font-bold flex items-center gap-1"><i class="fa-solid fa-ban"></i> Suspensos p/ próximo jogo:</span>
                            <p class="text-red-300">${suspList.map(s => `${s.nome} (${s.reason})`).join(', ')}</p>
                        </div>
                    `;
                })()}
            </div>
        `;
    });

    favPlayers.forEach(playerId => {
        const player = state.appData.jogadores?.[playerId];
        if (!player) return;

        const games = state.appData.jogos?.[player.periodo] || {};
        const playedGames = Object.values(games).filter(g => 
            g && (g.team1 === player.team || g.team2 === player.team) && 
            g.gols1 !== undefined && g.gols2 !== undefined && g.gols1 !== "" && g.gols2 !== ""
        );

        playedGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const lastGame = playedGames[0];
        const goalsInLastMatch = lastGame?.matchGols?.[playerId] || 0;
        const ownGoalsInLastMatch = lastGame?.matchOwnGols?.[playerId] || 0;

        html += `
            <div class="bg-navy-900 rounded-2xl p-5 border border-gold-500/40 space-y-3 relative overflow-hidden shadow-xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div class="flex items-center gap-2.5">
                        ${renderTeamBadge(player.team, "w-7 h-7")}
                        <div>
                            <h4 class="font-extrabold text-white text-base leading-tight">${player.nome}</h4>
                            <span class="text-[11px] text-slate-400 font-medium">${player.team} (${player.periodo})</span>
                        </div>
                    </div>
                    <button onclick="toggleFavoritePlayer('${player.id}', event)" class="text-gold-400 hover:text-slate-400 text-sm">
                        <i class="fa-solid fa-star"></i>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span class="block text-[10px] text-slate-400 font-semibold uppercase">Gols</span>
                        <span class="font-black text-gold-400 text-sm">${player.gols || 0}</span>
                    </div>
                    <div class="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span class="block text-[10px] text-amber-400 font-semibold uppercase">Amarelos</span>
                        <span class="font-bold text-amber-400 text-sm">${player.cartoes?.amarelo || 0}</span>
                    </div>
                    <div class="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span class="block text-[10px] text-red-400 font-semibold uppercase">Vermelhos</span>
                        <span class="font-bold text-red-400 text-sm">${player.cartoes?.vermelho || 0}</span>
                    </div>
                </div>

                ${(() => {
                    const suspList = getSuspendedPlayersForTeam(player.team, player.periodo, state);
                    const playerSusp = suspList.find(s => s.id === player.id);
                    if (!playerSusp) return '';
                    return `
                        <div class="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2 text-[11px] font-bold text-red-300 flex items-center gap-2">
                            <i class="fa-solid fa-ban text-red-400"></i>
                            <span>Suspenso da próxima partida (${playerSusp.reason})</span>
                        </div>
                    `;
                })()}

                ${lastGame ? `
                    <div class="text-xs pt-1 border-t border-slate-800 flex items-center justify-between">
                        <span class="text-slate-400">Último Jogo: <strong class="text-white">${lastGame.gols1} x ${lastGame.gols2}</strong></span>
                        ${goalsInLastMatch > 0 ? `<span class="text-[10px] font-extrabold text-pitch-400 bg-pitch-500/10 px-2 py-0.5 rounded border border-pitch-500/20">⚽ Fez ${goalsInLastMatch} gol(s)!</span>` : ''}
                        ${ownGoalsInLastMatch > 0 ? `<span class="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">⚠️ Gol Contra (${ownGoalsInLastMatch})</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

export function renderTopScorersCards() {
    const container = document.getElementById('home-top-scorers-cards');
    if (!container) return;

    const getTopScorersByPeriod = (period) => {
        const players = Object.values(state.appData.jogadores || {}).filter(p => p.periodo === period && (p.gols || 0) > 0);
        if (players.length === 0) return [];
        players.sort((a, b) => b.gols - a.gols);
        const maxGols = players[0].gols;
        return players.filter(p => p.gols === maxGols);
    };

    const topManha = getTopScorersByPeriod('manha');
    const topTarde = getTopScorersByPeriod('tarde');

    const createScorerCard = (scorers, title, iconClass, colorTheme) => {
        if (scorers.length === 0) {
            return `
                <div class="bg-navy-900 rounded-2xl p-5 border border-slate-800 flex flex-col justify-center items-center text-center space-y-2 min-h-[140px]">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">${title}</span>
                    <i class="fa-solid fa-futbol text-xl text-slate-600"></i>
                    <p class="text-xs text-slate-500 font-medium">Nenhum gol registrado neste período.</p>
                </div>
            `;
        }
        const isEmpate = scorers.length > 1;
        return `
            <div class="bg-navy-900 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${colorTheme} border border-current/20 flex items-center gap-1.5">
                        <i class="${iconClass}"></i> ${title}
                    </span>
                    <span class="text-xs font-black text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20 flex items-center gap-1">
                        <i class="fa-solid fa-fire text-amber-400"></i> ${scorers[0].gols} Gols ${isEmpate ? '(Empate)' : ''}
                    </span>
                </div>
                <div class="space-y-2">
                    ${scorers.map(p => `
                        <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div class="flex items-center gap-2.5">
                                ${renderTeamBadge(p.team, "w-8 h-8")}
                                <div>
                                    <h4 class="font-extrabold text-white text-sm leading-tight">${p.nome}</h4>
                                    <span class="text-[11px] text-slate-400 font-medium">${p.team}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick="toggleFavoritePlayer('${p.id}', event)" class="${state.userFavorites.players.includes(p.id) ? 'text-gold-400' : 'text-slate-600 hover:text-gold-400'} text-xs">
                                    <i class="fa-solid fa-star"></i>
                                </button>
                                <i class="fa-solid fa-crown text-gold-400 text-sm"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    container.innerHTML = 
        createScorerCard(topManha, 'Artilharia Manhã', 'fa-solid fa-sun', 'bg-amber-500/10 text-amber-400') +
        createScorerCard(topTarde, 'Artilharia Tarde', 'fa-solid fa-cloud-sun', 'bg-orange-500/10 text-orange-400');
}

export function renderLastMatchCards() {
    const container = document.getElementById('home-last-matches-cards');
    if (!container) return;

    const getLastPlayedMatch = (period) => {
        const games = state.appData.jogos?.[period] || {};
        const playedGames = Object.values(games).filter(
            g => g && g.gols1 !== undefined && g.gols2 !== undefined && g.gols1 !== "" && g.gols2 !== ""
        );
        if (playedGames.length === 0) return null;
        playedGames.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        return playedGames[0];
    };

    const lastManha = getLastPlayedMatch('manha');
    const lastTarde = getLastPlayedMatch('tarde');

    const createLastCard = (data, title, iconClass, colorTheme) => {
        if (!data) {
            return `
                <div class="bg-navy-900/60 rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-center items-center text-center space-y-1.5 min-h-[140px]">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">${title}</span>
                    <i class="fa-solid fa-clipboard-question text-xl text-slate-600 mt-1"></i>
                    <p class="text-xs text-slate-500 font-medium">Nenhuma partida finalizada ainda.</p>
                </div>
            `;
        }

        const team1Scorers = formatGoalScorers(data, data.team1);
        const team2Scorers = formatGoalScorers(data, data.team2);

        return `
            <div class="bg-navy-900 rounded-2xl p-5 border border-slate-800 space-y-3 relative overflow-hidden shadow-lg">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${colorTheme} border border-current/20 flex items-center gap-1.5">
                        <i class="${iconClass}"></i> ${title}
                    </span>
                    <span class="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <i class="fa-solid fa-circle-check"></i> Finalizado
                    </span>
                </div>
                <div class="flex items-center justify-between gap-2 py-1">
                    <div class="flex items-center justify-end sm:justify-start gap-2.5 w-5/12 text-right">
                        <span class="font-bold text-xs sm:text-sm text-white truncate">${data.team1}</span>
                        ${renderTeamBadge(data.team1, "w-8 h-8")}
                    </div>
                    <div class="w-2/12 flex items-center justify-center gap-1.5 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 font-black text-sm text-gold-400">
                        <span>${data.gols1}</span>
                        <span class="text-slate-600 text-[10px]">-</span>
                        <span>${data.gols2}</span>
                    </div>
                    <div class="flex items-center justify-start gap-2.5 w-5/12 text-left">
                        ${renderTeamBadge(data.team2, "w-8 h-8")}
                        <span class="font-bold text-xs sm:text-sm text-white truncate">${data.team2}</span>
                    </div>
                </div>
                ${(team1Scorers || team2Scorers) ? `
                    <div class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                        <div class="text-left text-slate-400">
                            ${team1Scorers ? `<span class="text-pitch-400 font-bold">⚽ Gols:</span> ${team1Scorers}` : ''}
                        </div>
                        <div class="text-right text-slate-400">
                            ${team2Scorers ? `<span class="text-pitch-400 font-bold">⚽ Gols:</span> ${team2Scorers}` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };

    container.innerHTML = 
        createLastCard(lastManha, 'Manhã', 'fa-solid fa-sun', 'bg-amber-500/10 text-amber-400') +
        createLastCard(lastTarde, 'Tarde', 'fa-solid fa-cloud-sun', 'bg-orange-500/10 text-orange-400');
}

export function renderNextMatchCards() {
    const container = document.getElementById('home-next-matches-cards');
    if (!container) return;

    const nextManha = state.appData.nextMatches?.manha;
    const nextTarde = state.appData.nextMatches?.tarde;

    const createCard = (period, data, title, iconClass, colorTheme) => {
        if (!data || !data.gameId) {
            return `
                <div class="bg-navy-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col justify-center items-center text-center space-y-2 min-h-[160px]">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">${title}</span>
                    <i class="fa-regular fa-calendar-xmark text-2xl text-slate-600 mt-2"></i>
                    <p class="text-xs text-slate-400 font-semibold">Nenhuma partida agendada como próxima.</p>
                </div>
            `;
        }

        return `
            <div class="bg-navy-900 rounded-2xl p-6 border border-slate-800 space-y-4 relative overflow-hidden shadow-xl">
                <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span class="px-3 py-1 rounded-lg text-xs font-bold uppercase ${colorTheme} border border-current/20 flex items-center gap-1.5">
                        <i class="${iconClass}"></i> ${title}
                    </span>
                    <span class="text-xs font-bold text-gold-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-clock"></i> ${data.dateTime || 'A definir'}
                    </span>
                </div>
                <div class="flex items-center justify-between gap-2 py-2">
                    <div class="flex flex-col items-center gap-2 w-5/12 text-center">
                        ${renderTeamBadge(data.team1, "w-12 h-12")}
                        <span class="font-extrabold text-sm text-white leading-tight">${data.team1}</span>
                    </div>
                    <div class="w-2/12 flex flex-col items-center justify-center">
                        <span class="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-black text-xs flex items-center justify-center shadow">VS</span>
                    </div>
                    <div class="flex flex-col items-center gap-2 w-5/12 text-center">
                        ${renderTeamBadge(data.team2, "w-12 h-12")}
                        <span class="font-extrabold text-sm text-white leading-tight">${data.team2}</span>
                    </div>
                </div>
                ${(() => {
                    const susp1 = getSuspendedPlayersForTeam(data.team1, period, state);
                    const susp2 = getSuspendedPlayersForTeam(data.team2, period, state);
                    const allSusp = [
                        ...susp1.map(s => ({ ...s, team: data.team1 })),
                        ...susp2.map(s => ({ ...s, team: data.team2 }))
                    ];
                    if (allSusp.length === 0) return '';
                    return `
                        <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 space-y-1">
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1">
                                <i class="fa-solid fa-ban"></i> Desfalques por Suspensão
                            </span>
                            <div class="flex flex-wrap gap-1.5">
                                ${allSusp.map(s => `<span class="text-[11px] font-semibold text-red-200 bg-slate-950/80 px-2 py-0.5 rounded border border-red-500/20">${s.nome} <span class="text-slate-400">(${s.team})</span></span>`).join('')}
                            </div>
                        </div>
                    `;
                })()}
                ${state.isAdmin ? `
                    <div class="pt-2 border-t border-slate-800 flex justify-end">
                        <button onclick="cancelNextMatch('${period}')" class="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                            <i class="fa-solid fa-xmark"></i> Desmarcar Próxima
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    };

    container.innerHTML = 
        createCard('manha', nextManha, 'Manhã', 'fa-solid fa-sun', 'bg-amber-500/10 text-amber-400') +
        createCard('tarde', nextTarde, 'Tarde', 'fa-solid fa-cloud-sun', 'bg-orange-500/10 text-orange-400');
}

export function populateHomeTeamBadges() {
    const manhaContainer = document.getElementById('home-manha-teams');
    const tardeContainer = document.getElementById('home-tarde-teams');
    if (!manhaContainer || !tardeContainer) return;

    const manhaTeams = getTeams('manha');
    const tardeTeams = getTeams('tarde');

    manhaContainer.innerHTML = manhaTeams.map(t => 
        `<span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">${renderTeamBadge(t, "w-4 h-4")} ${t}</span>`
    ).join('');

    tardeContainer.innerHTML = tardeTeams.map(t => 
        `<span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">${renderTeamBadge(t, "w-4 h-4")} ${t}</span>`
    ).join('');

    renderTopScorersCards();
    renderLastMatchCards();
    renderNextMatchCards();
}

export function updateHomeStats() {
    const topScorer = getTopScorer();
    const elScorer = document.getElementById('home-stat-artilheiro');
    if (elScorer) {
        if (topScorer && topScorer.gols > 0) {
            elScorer.innerHTML = `<strong class="text-gold-400">${topScorer.nome}</strong> (${topScorer.team}) - ${topScorer.gols} gols`;
        } else {
            elScorer.textContent = "Nenhum gol registrado ainda";
        }
    }

    const totalPlayers = Object.keys(state.appData.jogadores || {}).length;
    const statJogadores = document.getElementById('home-stat-jogadores');
    if (statJogadores) statJogadores.textContent = `${totalPlayers} atletas cadastrados nos elencos`;

    let totalGols = 0;
    let totalJogosRealizados = 0;

    ['manha', 'tarde'].forEach(p => {
        const games = state.appData.jogos[p] || {};
        Object.values(games).forEach(g => {
            if (g && g.gols1 !== undefined && g.gols2 !== undefined && g.gols1 !== "" && g.gols2 !== "") {
                totalGols += parseInt(g.gols1) + parseInt(g.gols2);
                totalJogosRealizados++;
            }
        });
    });

    const mediaGols = totalJogosRealizados > 0 ? (totalGols / totalJogosRealizados).toFixed(1) : "0.0";

    const statGols = document.getElementById('stat-total-gols');
    const statJogos = document.getElementById('stat-total-jogos');
    const statMedia = document.getElementById('stat-media-gols');
    if (statGols) statGols.textContent = totalGols;
    if (statJogos) statJogos.textContent = totalJogosRealizados;
    if (statMedia) statMedia.textContent = mediaGols;
}

export function getTopScorer() {
    const players = Object.values(state.appData.jogadores || {});
    if (players.length === 0) return null;
    const sorted = [...players].sort((a, b) => (b.gols || 0) - (a.gols || 0));
    return sorted[0];
}

export function renderArtilharia(filter = 'todos') {
    state.currentArtilhariaFilter = filter;
    ['todos', 'manha', 'tarde'].forEach(f => {
        const btn = document.getElementById(`filter-art-${f}`);
        if (btn) {
            btn.className = f === filter ? "px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-pitch-600 text-white" : "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white";
        }
    });

    let players = Object.values(state.appData.jogadores || {});
    if (filter !== 'todos') {
        players = players.filter(p => p.periodo === filter);
    }

    let sortedByGoals = [...players].sort((a, b) => (b.gols || 0) - (a.gols || 0));

    const podiumContainer = document.getElementById('artilharia-podium');
    const tableBody = document.getElementById('artilharia-table-body');
    const disciplinaBody = document.getElementById('disciplina-table-body');

    const top3 = sortedByGoals.filter(p => (p.gols || 0) > 0).slice(0, 3);

    if (podiumContainer) {
        if (top3.length > 0) {
            podiumContainer.innerHTML = top3.map((p, idx) => {
                const medals = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar'];
                const colors = ['border-gold-500/50 bg-gold-500/10', 'border-slate-400/50 bg-slate-400/10', 'border-amber-700/50 bg-amber-700/10'];
                return `
                    <div class="bg-navy-900 rounded-2xl border ${colors[idx]} p-5 flex flex-col items-center text-center space-y-2 shadow-lg">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-gold-400">${medals[idx]}</span>
                        <h4 class="font-extrabold text-white text-lg">${p.nome}</h4>
                        <p class="text-xs text-slate-300 flex items-center justify-center gap-1.5">${renderTeamBadge(p.team, "w-4 h-4")} ${p.team} (${p.periodo === 'manha' ? 'Manhã' : 'Tarde'})</p>
                        <span class="px-3 py-1 rounded-full text-xs font-black bg-pitch-500 text-navy-950">${p.gols || 0} Gols</span>
                    </div>
                `;
            }).join('');
        } else {
            podiumContainer.innerHTML = `<div class="col-span-3 text-center py-4 text-xs text-slate-500 italic">Nenhum gol registrado no ranking ainda.</div>`;
        }
    }

    if (tableBody) {
        tableBody.innerHTML = sortedByGoals.map((p, idx) => {
            const yellowCount = p.cartoes?.amarelo || 0;
            const redCount = p.cartoes?.vermelho || 0;
            const isFav = state.userFavorites.players.includes(p.id);

            return `
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/40">
                    <td class="py-3 px-4 text-center font-bold text-slate-400">${idx + 1}º</td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2.5">
                            <button onclick="toggleFavoritePlayer('${p.id}', event)" class="${isFav ? 'text-gold-400' : 'text-slate-600 hover:text-gold-400'} text-xs">
                                <i class="fa-solid fa-star"></i>
                            </button>
                            <span class="font-bold text-white text-sm">${p.nome}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2 text-slate-300 font-medium">
                            ${renderTeamBadge(p.team, "w-6 h-6")}
                            <span>${p.team}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-slate-400 capitalize">${p.periodo}</td>
                    <td class="py-3 px-4 text-center font-black text-gold-400 text-base">${p.gols || 0}</td>
                    <td class="py-3 px-4 text-center font-bold text-amber-400">${yellowCount}</td>
                    <td class="py-3 px-4 text-center font-bold text-red-400">${redCount}</td>
                </tr>
            `;
        }).join('');
    }

    if (disciplinaBody) {
        let sortedByCards = [...players].sort((a, b) => {
            const redA = a.cartoes?.vermelho || 0;
            const redB = b.cartoes?.vermelho || 0;
            if (redB !== redA) return redB - redA;
            const yellowA = a.cartoes?.amarelo || 0;
            const yellowB = b.cartoes?.amarelo || 0;
            return yellowB - yellowA;
        });

        disciplinaBody.innerHTML = sortedByCards.map((p, idx) => {
            const yellowCount = p.cartoes?.amarelo || 0;
            const redCount = p.cartoes?.vermelho || 0;

            return `
                <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/40">
                    <td class="py-3 px-4 text-center font-bold text-slate-400">${idx + 1}º</td>
                    <td class="py-3 px-4 font-bold text-white">${p.nome}</td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2 text-slate-300 font-medium">
                            ${renderTeamBadge(p.team, "w-6 h-6")}
                            <span>${p.team}</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-slate-400 capitalize">${p.periodo}</td>
                    <td class="py-3 px-4 text-center font-bold text-amber-400">${yellowCount}</td>
                    <td class="py-3 px-4 text-center font-bold text-red-400">${redCount}</td>
                </tr>
            `;
        }).join('');
    }
}

export function updateTeamDropdown() {
    const periodEl = document.getElementById('new-player-period');
    const select = document.getElementById('new-player-team');
    if (!periodEl || !select) return;
    const period = periodEl.value;
    const teams = getTeams(period);
    select.innerHTML = teams.map(t => `<option value="${t}">${t}</option>`).join('');
}

export function renderElencos(period) {
    state.currentElencoPeriod = period;
    const btnM = document.getElementById('btn-elenco-manha');
    const btnT = document.getElementById('btn-elenco-tarde');

    if (period === 'manha') {
        if (btnM) btnM.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-500 text-navy-950";
        if (btnT) btnT.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white";
    } else {
        if (btnT) btnT.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-orange-500 text-white";
        if (btnM) btnM.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white";
    }

    const container = document.getElementById('elencos-teams-container');
    if (!container) return;
    const teams = getTeams(period);

    container.innerHTML = teams.map(team => {
        const players = getPlayersByTeamAndPeriod(team, period);
        const isFavTeam = state.userFavorites.teams.includes(team);

        return `
            <div class="bg-navy-900 rounded-2xl border border-slate-800 p-5 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div class="flex items-center gap-2">
                            <button onclick="toggleFavoriteTeam('${team}', event)" class="${isFavTeam ? 'text-gold-400' : 'text-slate-600 hover:text-gold-400'} text-xs">
                                <i class="fa-solid fa-star"></i>
                            </button>
                            ${renderTeamBadge(team, "w-7 h-7")}
                            <h4 class="font-bold text-white text-base">${team}</h4>
                            ${state.isAdmin ? `
                                <button onclick="renameTeam('${period}', '${team}')" class="text-slate-400 hover:text-amber-400 p-1 text-xs" title="Editar nome">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button onclick="changeTeamLogo('${team}')" class="text-slate-400 hover:text-gold-400 p-1 text-xs" title="Alterar Escudo">
                                    <i class="fa-solid fa-shield"></i>
                                </button>
                            ` : ''}
                        </div>
                        <span class="text-xs text-slate-400 font-semibold">${players.length} Atleta(s)</span>
                    </div>
                    <div class="pt-3 space-y-1.5">
                        ${players.length === 0 ? `
                            <p class="text-xs text-slate-500 italic">Nenhum atleta cadastrado ainda.</p>
                        ` : players.map(p => {
                            const isFavP = state.userFavorites.players.includes(p.id);
                            return `
                                <div class="flex items-center justify-between text-xs py-1 border-b border-slate-800/40">
                                    <div class="flex items-center gap-2">
                                        <button onclick="toggleFavoritePlayer('${p.id}', event)" class="${isFavP ? 'text-gold-400' : 'text-slate-600 hover:text-gold-400'} text-[10px]">
                                            <i class="fa-solid fa-star"></i>
                                        </button>
                                        <span class="text-slate-200 font-medium">${p.nome}</span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <span class="text-gold-400 font-bold">${p.gols || 0} Gols</span>
                                        <span class="text-amber-400 font-bold">🟨 ${p.cartoes?.amarelo || 0}</span>
                                        <span class="text-red-400 font-bold">🟥 ${p.cartoes?.vermelho || 0}</span>
                                        ${state.isAdmin ? `
                                            <button onclick="removePlayer('${p.id}')" class="text-red-400 hover:text-red-300 ml-1">
                                                <i class="fa-solid fa-xmark"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function getPlayersByTeamAndPeriod(teamName, period) {
    return Object.values(state.appData.jogadores || {}).filter(
        p => p.team === teamName && p.periodo === period
    );
}

export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
        document.body.appendChild(container);
    }

    const styles = {
        success: 'bg-slate-900 border-emerald-500/50 text-emerald-400',
        error: 'bg-slate-900 border-red-500/50 text-red-400',
        warning: 'bg-slate-900 border-amber-500/50 text-amber-400'
    };

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation'
    };

    const toast = document.createElement('div');
    toast.className = `${styles[type] || styles.success} border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto backdrop-blur-md`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.success} text-sm"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

export function updateConnectionStatus(status) {
    let badge = document.getElementById('firebase-status-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'firebase-status-badge';
        badge.className = 'fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-2 shadow-lg transition-all duration-300';
        document.body.appendChild(badge);
    }

    if (status === 'syncing') {
        badge.className = 'fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-2 shadow-lg bg-slate-900/90 border-amber-500/40 text-amber-400';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Sincronizando...`;
    } else if (status === 'online') {
        badge.className = 'fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-2 shadow-lg bg-slate-900/90 border-emerald-500/30 text-emerald-400';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Online`;
    } else {
        badge.className = 'fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-2 shadow-lg bg-slate-900/90 border-red-500/40 text-red-400';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400"></span> Modo Offline`;
    }
}