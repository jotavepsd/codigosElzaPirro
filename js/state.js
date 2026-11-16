import { DEFAULT_TEAMS } from './config.js';

export const state = {
    db: null,
    rootRef: null,
    isFirebaseOnline: false,
    isAdmin: false,
    currentPeriod: 'manha',
    currentSubTab: 'tabela',
    currentArtilhariaFilter: 'todos',
    currentElencoPeriod: 'manha',
    userFavorites: {
        teams: JSON.parse(localStorage.getItem('fav_teams') || '[]'),
        players: JSON.parse(localStorage.getItem('fav_players') || '[]')
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
        state.rootRef.set(state.appData);
    }
}

export function setSession(role) {
    localStorage.setItem('user_role', role);
    localStorage.setItem('login_timestamp', Date.now().toString());
}
