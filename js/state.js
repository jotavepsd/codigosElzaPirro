import { DEFAULT_TEAMS } from './config.js';

// NOVO: Função segura para ler JSON do localStorage sem quebrar a página
function loadSafeStorage(key, fallback = []) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        console.warn(`Dados corrompidos removidos do localStorage (${key}):`, e);
        localStorage.removeItem(key);
        return fallback;
    }
}

export const state = {
    db: null,
    rootRef: null,
    isFirebaseOnline: false,
    isAdmin: false,
    currentPeriod: 'manha',
    currentSubTab: 'tabela',
    currentArtilhariaFilter: 'todos',
    currentElencoPeriod: 'manha',
    currentMatchStatusFilter: 'todos',
    currentMatchTeamFilter: 'todos',   
    userFavorites: {
        teams: loadSafeStorage('fav_teams', []),
        players: loadSafeStorage('fav_players', [])
    },
    appData: {
        teams: JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
        teamLogos: {},
        nextMatches: { manha: null, tarde: null },
        jogos: { manha: {}, tarde: {} },
        jogadores: {}
    }
};

export function saveStateToFirebase() {
    if (state.rootRef && state.isFirebaseOnline && state.isAdmin) {
        state.rootRef.set(state.appData).catch((error) => {
            console.error("Erro ao sincronizar com o Firebase:", error);
            alert("⚠️ Erro ao salvar dados na nuvem! Verifique sua conexão com a internet.");
        });
    }
}

export function setSession(role) {
    localStorage.setItem('user_role', role);
    localStorage.setItem('login_timestamp', Date.now().toString());
}