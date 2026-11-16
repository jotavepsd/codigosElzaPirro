import { firebaseConfig, ADMIN_PASSWORD, DEFAULT_TEAMS } from './config.js';
import { state, saveStateToFirebase, setSession } from './state.js';
import { slugify, renderTeamBadge } from './utils.js';
import { 
    updateRoleBadgeUI, switchTab, switchChampSubTab, renderAllViews, 
    renderChampionshipHeader, renderChampionshipView, renderStandingsTable, 
    renderMatchesView, renderFavoritosSection, renderTopScorersCards, 
    renderLastMatchCards, renderNextMatchCards, populateHomeTeamBadges, 
    updateHomeStats, renderArtilharia, updateTeamDropdown, renderElencos, 
    getPlayersByTeamAndPeriod 
} from './ui.js';

// Expor funções globais chamadas pelo HTML onclick
window.switchTab = switchTab;
window.switchChampSubTab = switchChampSubTab;
window.renderArtilharia = renderArtilharia;
window.renderElencos = renderElencos;
window.updateTeamDropdown = updateTeamDropdown;

window.loginAsGuest = function() {
    state.isAdmin = false;
    setSession('guest');
    document.getElementById('auth-screen').classList.add('hidden');
    updateRoleBadgeUI();
    checkFavoritosIntroModal();
    renderAllViews();
};

window.showAdminPasswordInput = function() {
    document.getElementById('admin-pass-box').classList.remove('hidden');
};

window.loginAsAdmin = function() {
    const pass = document.getElementById('admin-password-input').value;
    const errEl = document.getElementById('admin-pass-error');
    if (pass === ADMIN_PASSWORD) {
        state.isAdmin = true;
        setSession('admin');
        errEl.classList.add('hidden');
        document.getElementById('auth-screen').classList.add('hidden');
        updateRoleBadgeUI();
        checkFavoritosIntroModal();
        renderAllViews();
    } else {
        errEl.classList.remove('hidden');
    }
};

window.logoutRole = function() {
    localStorage.removeItem('user_role');
    localStorage.removeItem('login_timestamp');
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('admin-password-input').value = "";
    document.getElementById('admin-pass-box').classList.add('hidden');
};

window.closeFavoritosIntro = function(neverShowAgain) {
    if (neverShowAgain) {
        localStorage.setItem('hide_favoritos_intro', 'true');
    }
    document.getElementById('favoritos-intro-modal').classList.add('hidden');
};

window.toggleFavoriteTeam = function(teamName, event) {
    if(event) event.stopPropagation();
    const idx = state.userFavorites.teams.indexOf(teamName);
    if (idx === -1) {
        state.userFavorites.teams.push(teamName);
    } else {
        state.userFavorites.teams.splice(idx, 1);
    }
    localStorage.setItem('fav_teams', JSON.stringify(state.userFavorites.teams));
    renderAllViews();
};

window.toggleFavoritePlayer = function(playerId, event) {
    if(event) event.stopPropagation();
    const idx = state.userFavorites.players.indexOf(playerId);
    if (idx === -1) {
        state.userFavorites.players.push(playerId);
    } else {
        state.userFavorites.players.splice(idx, 1);
    }
    localStorage.setItem('fav_players', JSON.stringify(state.userFavorites.players));
    renderAllViews();
};

window.filterElencosPlayers = function() {
    const query = document.getElementById('search-player-input').value.toLowerCase();
    const container = document.getElementById('elencos-teams-container');
    if (!container) return;
    const cards = container.querySelectorAll('.bg-navy-900');

    cards.forEach(card => {
        const teamNameElement = card.querySelector('h4');
        const teamName = teamNameElement ? teamNameElement.textContent.toLowerCase() : "";
        const playerRows = card.querySelectorAll('.space-y-1.5 > div');
        let hasVisiblePlayer = false;

        playerRows.forEach(row => {
            const playerNameEl = row.querySelector('span.text-slate-200');
            const playerName = playerNameEl ? playerNameEl.textContent.toLowerCase() : "";
            if (playerName.includes(query) || teamName.includes(query)) {
                row.style.display = "";
                hasVisiblePlayer = true;
            } else {
                row.style.display = "none";
            }
        });

        if (hasVisiblePlayer || teamName.includes(query) || query === "") {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
};

window.setNextMatch = function(period, gameId, team1, team2) {
    if (!state.isAdmin) return;
    const existing = state.appData.nextMatches?.[period];
    if (existing && existing.gameId) {
        alert(`Já existe um próximo jogo agendado no período da ${period === 'manha' ? 'Manhã' : 'Tarde'}!`);
        return;
    }
    const dateTimeInput = prompt("Digite a data/horário do jogo (Ex: 15/11 às 08:30):");
    if (dateTimeInput === null) return;
    if (!state.appData.nextMatches) state.appData.nextMatches = { manha: null, tarde: null };
    state.appData.nextMatches[period] = { gameId, team1, team2, dateTime: dateTimeInput.trim() };
    saveStateToFirebase();
    renderAllViews();
    alert("Partida marcada como PRÓXIMA PARTIDA com sucesso!");
};

window.cancelNextMatch = function(period) {
    if (!state.isAdmin) return;
    if (confirm(`Deseja desmarcar a próxima partida do período da ${period === 'manha' ? 'Manhã' : 'Tarde'}?`)) {
        if (!state.appData.nextMatches) state.appData.nextMatches = { manha: null, tarde: null };
        state.appData.nextMatches[period] = null;
        saveStateToFirebase();
        renderAllViews();
    }
};

window.saveMatchScore = function(team1, team2, gameId) {
    if (!state.isAdmin) return;
    const input1 = document.getElementById(`input-${gameId}-1`);
    const input2 = document.getElementById(`input-${gameId}-2`);
    if (!input1 || !input2) return;
    const val1 = input1.value.trim();
    const val2 = input2.value.trim();
    if (val1 === '' || val2 === '') {
        alert("Por favor, informe o placar dos dois times antes de salvar.");
        return;
    }
    if (!state.appData.jogos) state.appData.jogos = { manha: {}, tarde: {} };
    if (!state.appData.jogos[state.currentPeriod]) state.appData.jogos[state.currentPeriod] = {};
    const existingMatchData = state.appData.jogos[state.currentPeriod][gameId] || {};
    state.appData.jogos[state.currentPeriod][gameId] = {
        ...existingMatchData, team1, team2,
        gols1: parseInt(val1), gols2: parseInt(val2),
        updatedAt: Date.now()
    };
    if (state.appData.nextMatches?.[state.currentPeriod]?.gameId === gameId) {
        state.appData.nextMatches[state.currentPeriod] = null;
    }
    saveStateToFirebase();
    renderAllViews();
};

window.resetMatchScore = function(gameId) {
    if (!state.isAdmin) return;
    if (confirm("Deseja reabrir esta partida para alteração de placar?")) {
        if (state.appData.jogos && state.appData.jogos[state.currentPeriod] && state.appData.jogos[state.currentPeriod][gameId]) {
            delete state.appData.jogos[state.currentPeriod][gameId].gols1;
            delete state.appData.jogos[state.currentPeriod][gameId].gols2;
            delete state.appData.jogos[state.currentPeriod][gameId].updatedAt;
        }
        saveStateToFirebase();
        renderAllViews();
    }
};

window.openGoalsModal = function(team1, team2, gameId) {
    const modal = document.getElementById('modal-match-goals');
    const content = document.getElementById('modal-match-goals-content');
    const t1Players = getPlayersByTeamAndPeriod(team1, state.currentPeriod);
    const t2Players = getPlayersByTeamAndPeriod(team2, state.currentPeriod);
    const match = state.appData.jogos?.[state.currentPeriod]?.[gameId] || {};
    const maxGols1 = match.gols1 !== undefined ? parseInt(match.gols1) : 0;
    const maxGols2 = match.gols2 !== undefined ? parseInt(match.gols2) : 0;

    let allocatedGols1 = 0;
    let allocatedGols2 = 0;
    if (match.matchGols) {
        Object.entries(match.matchGols).forEach(([pId, count]) => {
            const p = state.appData.jogadores?.[pId];
            if (p) {
                if (p.team === team1) allocatedGols1 += count;
                if (p.team === team2) allocatedGols2 += count;
            }
        });
    }
    if (match.matchOwnGols) {
        Object.entries(match.matchOwnGols).forEach(([pId, count]) => {
            const p = state.appData.jogadores?.[pId];
            if (p) {
                if (p.team === team1) allocatedGols2 += count;
                if (p.team === team2) allocatedGols1 += count;
            }
        });
    }

    const renderPlayerRow = (p) => {
        const matchGols = match.matchGols?.[p.id] || 0;
        const matchOwnGols = match.matchOwnGols?.[p.id] || 0;
        const yellowCards = match.matchCards?.[p.id]?.['amarelo'] || 0;
        const redCards = match.matchCards?.[p.id]?.['vermelho'] || 0;

        return `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-white text-sm">${p.nome}</span>
                    <span class="text-[10px] text-slate-400">Total no Campeonato: ${p.gols || 0} Golaço(s)</span>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    <div class="flex items-center gap-1.5">
                        <span class="text-gold-400 font-bold"><i class="fa-solid fa-futbol"></i> Gols (${matchGols}):</span>
                        ${state.isAdmin ? `
                            <button onclick="window._addMatchGoal('${gameId}', '${p.id}', 1, '${p.team}', '${team1}', '${team2}')" class="px-2 py-0.5 bg-pitch-600 text-white rounded font-bold text-xs">+</button>
                            <button onclick="window._addMatchGoal('${gameId}', '${p.id}', -1, '${p.team}', '${team1}', '${team2}')" class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold text-xs">-</button>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-red-400 font-bold"><i class="fa-solid fa-arrow-rotate-left"></i> GC (${matchOwnGols}):</span>
                        ${state.isAdmin ? `
                            <button onclick="window._addMatchOwnGoal('${gameId}', '${p.id}', 1, '${p.team}', '${team1}', '${team2}')" class="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-xs">+</button>
                            <button onclick="window._addMatchOwnGoal('${gameId}', '${p.id}', -1, '${p.team}', '${team1}', '${team2}')" class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold text-xs">-</button>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1">
                            <span class="text-amber-400 font-bold">🟨 (${yellowCards}):</span>
                            ${state.isAdmin ? `
                                <button onclick="window._addMatchCard('${gameId}', '${p.id}', 'amarelo', 1, '${team1}', '${team2}')" class="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded font-bold text-xs">+</button>
                                <button onclick="window._addMatchCard('${gameId}', '${p.id}', 'amarelo', -1, '${team1}', '${team2}')" class="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-bold text-xs">-</button>
                            ` : ''}
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-red-400 font-bold">🟥 (${redCards}):</span>
                            ${state.isAdmin ? `
                                <button onclick="window._addMatchCard('${gameId}', '${p.id}', 'vermelho', 1, '${team1}', '${team2}')" class="px-1.5 py-0.5 bg-slate-800 text-red-400 rounded font-bold text-xs">+</button>
                                <button onclick="window._addMatchCard('${gameId}', '${p.id}', 'vermelho', -1, '${team1}', '${team2}')" class="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-bold text-xs">-</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    content.innerHTML = `
        <div class="space-y-6">
            <div class="text-center pb-2 border-b border-slate-800">
                <span class="text-xs font-bold text-slate-400">Atributos da Partida</span>
                <h4 class="font-extrabold text-white text-base">${team1} (${maxGols1}) vs (${maxGols2}) ${team2}</h4>
            </div>
            <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 class="font-bold text-pitch-400 text-sm flex items-center gap-2">${renderTeamBadge(team1, "w-5 h-5")} ${team1}</h4>
                    <span class="text-xs font-bold ${allocatedGols1 === maxGols1 ? 'text-emerald-400' : 'text-amber-400'}">Gols validados: ${allocatedGols1} de ${maxGols1}</span>
                </div>
                ${t1Players.length === 0 ? `<p class="text-xs text-slate-500 italic">Sem jogadores cadastrados nesta equipe.</p>` : t1Players.map(renderPlayerRow).join('')}
            </div>
            <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 class="font-bold text-orange-400 text-sm flex items-center gap-2">${renderTeamBadge(team2, "w-5 h-5")} ${team2}</h4>
                    <span class="text-xs font-bold ${allocatedGols2 === maxGols2 ? 'text-emerald-400' : 'text-amber-400'}">Gols validados: ${allocatedGols2} de ${maxGols2}</span>
                </div>
                ${t2Players.length === 0 ? `<p class="text-xs text-slate-500 italic">Sem jogadores cadastrados nesta equipe.</p>` : t2Players.map(renderPlayerRow).join('')}
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window._addMatchGoal = function(gameId, playerId, amount, teamName, team1, team2) {
    if (!state.isAdmin) return;
    const match = state.appData.jogos[state.currentPeriod][gameId];
    const maxGolsAllowed = (teamName === match.team1) ? parseInt(match.gols1 || 0) : parseInt(match.gols2 || 0);
    if (!match.matchGols) match.matchGols = {};
    if (!match.matchOwnGols) match.matchOwnGols = {};
    const otherTeamName = (teamName === match.team1) ? match.team2 : match.team1;
    let currentTeamGolsCount = 0;
    Object.entries(match.matchGols).forEach(([pId, count]) => {
        const p = state.appData.jogadores?.[pId];
        if (p && p.team === teamName) currentTeamGolsCount += (count || 0);
    });
    Object.entries(match.matchOwnGols).forEach(([pId, count]) => {
        const p = state.appData.jogadores?.[pId];
        if (p && p.team === otherTeamName) currentTeamGolsCount += (count || 0);
    });
    if (amount > 0 && (currentTeamGolsCount + amount) > maxGolsAllowed) {
        alert(`⚠️ LIMITE ATINGIDO! O time "${teamName}" fez apenas ${maxGolsAllowed} gol(s).`);
        return;
    }
    match.matchGols[playerId] = Math.max(0, (match.matchGols[playerId] || 0) + amount);
    recalculatePlayerTotalGoals(playerId);
    saveStateToFirebase();
    renderAllViews();
    window.openGoalsModal(team1, team2, gameId);
};

window._addMatchOwnGoal = function(gameId, playerId, amount, playerTeam, team1, team2) {
    if (!state.isAdmin) return;
    const match = state.appData.jogos[state.currentPeriod][gameId];
    const beneficiaryTeam = (playerTeam === match.team1) ? match.team2 : match.team1;
    const maxGolsAllowed = (beneficiaryTeam === match.team1) ? parseInt(match.gols1 || 0) : parseInt(match.gols2 || 0);
    if (!match.matchGols) match.matchGols = {};
    if (!match.matchOwnGols) match.matchOwnGols = {};
    let currentBeneficiaryGolsCount = 0;
    Object.entries(match.matchGols).forEach(([pId, count]) => {
        const p = state.appData.jogadores?.[pId];
        if (p && p.team === beneficiaryTeam) currentBeneficiaryGolsCount += (count || 0);
    });
    Object.entries(match.matchOwnGols).forEach(([pId, count]) => {
        const p = state.appData.jogadores?.[pId];
        if (p && p.team === playerTeam) currentBeneficiaryGolsCount += (count || 0);
    });
    if (amount > 0 && (currentBeneficiaryGolsCount + amount) > maxGolsAllowed) {
        alert(`⚠️ LIMITE ATINGIDO!`);
        return;
    }
    match.matchOwnGols[playerId] = Math.max(0, (match.matchOwnGols[playerId] || 0) + amount);
    saveStateToFirebase();
    renderAllViews();
    window.openGoalsModal(team1, team2, gameId);
};

window._addMatchCard = function(gameId, playerId, cardType, amount, team1, team2) {
    if (!state.isAdmin) return;
    const match = state.appData.jogos[state.currentPeriod][gameId];
    if (!match.matchCards) match.matchCards = {};
    if (!match.matchCards[playerId]) match.matchCards[playerId] = { amarelo: 0, vermelho: 0 };
    match.matchCards[playerId][cardType] = Math.max(0, (match.matchCards[playerId][cardType] || 0) + amount);
    recalculatePlayerTotalCards(playerId, cardType);
    saveStateToFirebase();
    renderAllViews();
    window.openGoalsModal(team1, team2, gameId);
};

function recalculatePlayerTotalGoals(playerId) {
    let total = 0;
    ['manha', 'tarde'].forEach(p => {
        const matches = state.appData.jogos[p] || {};
        Object.values(matches).forEach(m => {
            if (m && m.matchGols && m.matchGols[playerId]) total += m.matchGols[playerId];
        });
    });
    if (state.appData.jogadores && state.appData.jogadores[playerId]) {
        state.appData.jogadores[playerId].gols = total;
    }
}

function recalculatePlayerTotalCards(playerId, cardType) {
    let total = 0;
    ['manha', 'tarde'].forEach(p => {
        const matches = state.appData.jogos[p] || {};
        Object.values(matches).forEach(m => {
            if (m && m.matchCards && m.matchCards[playerId] && m.matchCards[playerId][cardType]) {
                total += m.matchCards[playerId][cardType];
            }
        });
    });
    if (state.appData.jogadores && state.appData.jogadores[playerId]) {
        if (!state.appData.jogadores[playerId].cartoes) state.appData.jogadores[playerId].cartoes = { amarelo: 0, vermelho: 0 };
        state.appData.jogadores[playerId].cartoes[cardType] = total;
    }
}

window.closeGoalsModal = function() {
    document.getElementById('modal-match-goals').classList.add('hidden');
};

window.changeTeamLogo = function(teamName) {
    if (!state.isAdmin) return;
    const currentUrl = (state.appData.teamLogos?.[teamName]) || "";
    const newUrl = prompt(`Cole a URL da imagem do escudo do time "${teamName}":`, currentUrl);
    if (newUrl === null) return;
    if (!state.appData.teamLogos) state.appData.teamLogos = {};
    if (newUrl.trim() === "") {
        delete state.appData.teamLogos[teamName];
    } else {
        state.appData.teamLogos[teamName] = newUrl.trim();
    }
    saveStateToFirebase();
    populateHomeTeamBadges();
    renderAllViews();
};

window.renameTeam = function(period, oldName) {
    if (!state.isAdmin) return;
    const newName = prompt(`Digite o novo nome para o time "${oldName}":`, oldName);
    if (!newName || newName.trim() === "" || newName.trim() === oldName) return;
    const trimmedNewName = newName.trim();
    if (!state.appData.teams) state.appData.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    const teamIndex = state.appData.teams[period].indexOf(oldName);
    if (teamIndex !== -1) {
        state.appData.teams[period][teamIndex] = trimmedNewName;
    }
    if (state.appData.teamLogos && state.appData.teamLogos[oldName]) {
        state.appData.teamLogos[trimmedNewName] = state.appData.teamLogos[oldName];
        delete state.appData.teamLogos[oldName];
    }
    Object.values(state.appData.jogadores || {}).forEach(p => {
        if (p.team === oldName && p.periodo === period) p.team = trimmedNewName;
    });
    if (state.appData.jogos && state.appData.jogos[period]) {
        const updatedGames = {};
        Object.entries(state.appData.jogos[period]).forEach(([gameId, game]) => {
            const t1 = game.team1 === oldName ? trimmedNewName : game.team1;
            const t2 = game.team2 === oldName ? trimmedNewName : game.team2;
            const newGameId = `${slugify(t1)}_x_${slugify(t2)}`;
            updatedGames[newGameId] = { ...game, team1: t1, team2: t2 };
        });
        state.appData.jogos[period] = updatedGames;
    }
    saveStateToFirebase();
    populateHomeTeamBadges();
    updateTeamDropdown();
    renderAllViews();
    alert(`Time alterado com sucesso!`);
};

window.handleAddPlayer = function(e) {
    e.preventDefault();
    if (!state.isAdmin) return;
    const period = document.getElementById('new-player-period').value;
    const team = document.getElementById('new-player-team').value;
    const nameInput = document.getElementById('new-player-name');
    const name = nameInput.value.trim();
    if (!name) return;
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (!state.appData.jogadores) state.appData.jogadores = {};
    state.appData.jogadores[playerId] = {
        id: playerId, nome: name, team: team, periodo: period,
        gols: 0, cartoes: { amarelo: 0, vermelho: 0 }
    };
    saveStateToFirebase();
    nameInput.value = "";
    renderElencos(state.currentElencoPeriod);
    alert(`Jogador ${name} cadastrado com sucesso!`);
};

window.removePlayer = function(playerId) {
    if (!state.isAdmin) return;
    if (confirm("Deseja realmente remover este jogador?")) {
        delete state.appData.jogadores[playerId];
        saveStateToFirebase();
        renderAllViews();
    }
};

window.confirmReset = function() {
    if (!state.isAdmin) return;
    if (confirm("ATENÇÃO: Deseja apagar todos os placares, partidas e dados de artilharia?")) {
        state.appData = {
            teams: JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
            teamLogos: {},
            nextMatches: { manha: null, tarde: null },
            jogos: { manha: {}, tarde: {} },
            jogadores: {}
        };
        saveStateToFirebase();
        populateHomeTeamBadges();
        renderAllViews();
        alert("O campeonato foi restaurado!");
    }
};

function checkSavedSession() {
    const savedRole = localStorage.getItem('user_role');
    const savedTime = localStorage.getItem('login_timestamp');
    if (savedRole && savedTime) {
        const hoursPassed = (Date.now() - parseInt(savedTime)) / (1000 * 60 * 60);
        if (hoursPassed < 12) {
            state.isAdmin = (savedRole === 'admin');
            document.getElementById('auth-screen').classList.add('hidden');
            updateRoleBadgeUI();
            checkFavoritosIntroModal();
            return true;
        }
    }
    return false;
}

function checkFavoritosIntroModal() {
    const hideIntro = localStorage.getItem('hide_favoritos_intro');
    if (!hideIntro) {
        document.getElementById('favoritos-intro-modal').classList.remove('hidden');
    }
}

function initFirebaseListener() {
    if (!state.rootRef) {
        renderAllViews();
        return;
    }
    state.rootRef.on('value', (snapshot) => {
        state.isFirebaseOnline = true;
        const val = snapshot.val();
        if (val) {
            state.appData = {
                teams: val.teams || JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
                teamLogos: val.teamLogos || {},
                nextMatches: val.nextMatches || { manha: null, tarde: null },
                jogos: val.jogos || { manha: {}, tarde: {} },
                jogadores: val.jogadores || {}
            };
        } else {
            state.appData.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
            saveStateToFirebase();
        }
        populateHomeTeamBadges();
        renderAllViews();
    }, (error) => {
        console.warn("Firebase fallback:", error);
        renderAllViews();
    });
}

window.onload = function() {
    try {
        firebase.initializeApp(firebaseConfig);
        state.db = firebase.database();
        state.rootRef = state.db.ref("futebol_2026");
    } catch(e) {
        console.warn("Firebase init warn:", e);
    }
    checkSavedSession();
    initFirebaseListener();
    populateHomeTeamBadges();
    updateTeamDropdown();
};
