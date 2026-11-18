import { getTeams, slugify } from './utils.js';
import { state } from './state.js';

export function generateRoundRobin(teamsList, period) {
    let teams = [...teamsList];
    if (teams.length % 2 !== 0) {
        teams.push("FOLGA");
    }

    let numRounds = teams.length - 1;
    let halfSize = teams.length / 2;
    let rounds = [];

    for (let round = 0; round < numRounds; round++) {
        let matches = [];
        for (let i = 0; i < halfSize; i++) {
            let teamA = teams[i];
            let teamB = teams[teams.length - 1 - i];

            if (teamA !== "FOLGA" && teamB !== "FOLGA") {
                matches.push({ team1: teamA, team2: teamB });
            }
        }
        rounds.push(matches);
        teams.splice(1, 0, teams.pop());
    }

    // 2 turnos (Turno e Returno) exclusivos para o período da tarde
    if (period === 'tarde') {
        let secondTurnRounds = rounds.map(roundMatches => 
            roundMatches.map(match => ({ team1: match.team2, team2: match.team1 }))
        );
        rounds = rounds.concat(secondTurnRounds);
    }

    return rounds;
}

export function calculateStandings(period) {
    const teams = getTeams(period);
    const games = state.appData.jogos[period] || {};
    let stats = {};

    teams.forEach(team => {
        stats[team] = { nome: team, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, form: [] };
    });

    const rounds = generateRoundRobin(teams, period);
    rounds.forEach(roundMatches => {
        roundMatches.forEach(match => {
            const gameId = `${slugify(match.team1)}_x_${slugify(match.team2)}`;
            const game = games[gameId];
            if (game && game.gols1 !== undefined && game.gols2 !== undefined && game.gols1 !== "" && game.gols2 !== "") {
                const g1 = parseInt(game.gols1);
                const g2 = parseInt(game.gols2);
                const t1 = match.team1;
                const t2 = match.team2;

                if (stats[t1] && stats[t2]) {
                    stats[t1].j++; stats[t2].j++;
                    stats[t1].gp += g1; stats[t1].gc += g2;
                    stats[t2].gp += g2; stats[t2].gc += g1;

                    if (g1 > g2) {
                        stats[t1].pts += 3; stats[t1].v++; stats[t1].form.push('V');
                        stats[t2].d++; stats[t2].form.push('D');
                    } else if (g2 > g1) {
                        stats[t2].pts += 3; stats[t2].v++; stats[t2].form.push('V');
                        stats[t1].d++; stats[t1].form.push('D');
                    } else {
                        stats[t1].pts += 1; stats[t1].e++; stats[t1].form.push('E');
                        stats[t2].pts += 1; stats[t2].e++; stats[t2].form.push('E');
                    }
                }
            }
        });
    });

    Object.keys(stats).forEach(t => { stats[t].sg = stats[t].gp - stats[t].gc; });

    return Object.values(stats).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.sg !== a.sg) return b.sg - a.sg;
        if (b.gp !== a.gp) return b.gp - a.gp;
        if (b.v !== a.v) return b.v - a.v;
        return a.nome.localeCompare(b.nome);
    });
}

export function getSuspendedPlayersForTeam(teamName, period, stateRef) {
    const gamesObj = stateRef.appData.jogos?.[period] || {};
    const playersObj = stateRef.appData.jogadores || {};

    // Pega apenas os jogos já finalizados da equipe, ordenados do mais antigo para o mais recente
    const teamPlayedGames = Object.values(gamesObj)
        .filter(g => g && (g.team1 === teamName || g.team2 === teamName) && g.gols1 !== undefined && g.gols2 !== undefined && g.gols1 !== "" && g.gols2 !== "")
        .sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

    if (teamPlayedGames.length === 0) return [];

    const lastGame = teamPlayedGames[teamPlayedGames.length - 1];
    const teamPlayers = Object.values(playersObj).filter(p => p.team === teamName && p.periodo === period);
    const suspended = [];

    teamPlayers.forEach(player => {
        const lastCards = lastGame.matchCards?.[player.id] || { amarelo: 0, vermelho: 0 };
        const gotRedInLastGame = (lastCards.vermelho || 0) > 0;
        const gotYellowInLastGame = (lastCards.amarelo || 0) > 0;

        // Soma todos os amarelos acumulados nos jogos finalizados do time até agora
        let totalYellows = 0;
        teamPlayedGames.forEach(g => {
            totalYellows += (g.matchCards?.[player.id]?.amarelo || 0);
        });

        // Suspenso se levou vermelho no último jogo OU atingiu múltiplo de 3 amarelos no último jogo
        const suspendedByYellows = gotYellowInLastGame && totalYellows > 0 && (totalYellows % 3 === 0);

        if (gotRedInLastGame || suspendedByYellows) {
            suspended.push({
                id: player.id,
                nome: player.nome,
                reason: gotRedInLastGame ? 'Cartão Vermelho' : '3º Cartão Amarelo'
            });
        }
    });

    return suspended;
}
