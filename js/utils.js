import { DEFAULT_TEAMS } from './config.js';
import { state } from './state.js';

export function getTeams(period) {
    return (state.appData.teams && state.appData.teams[period]) 
        ? state.appData.teams[period] 
        : DEFAULT_TEAMS[period];
}

export function getTeamLogo(teamName) {
    return (state.appData.teamLogos && state.appData.teamLogos[teamName]) 
        ? state.appData.teamLogos[teamName] 
        : null;
}

export function renderTeamBadge(teamName, sizeClass = "w-6 h-6") {
    const logoUrl = getTeamLogo(teamName);
    if (logoUrl) {
        return `<img src="${logoUrl}" alt="${teamName}" class="${sizeClass} rounded-full object-cover border border-slate-700 bg-slate-950 shrink-0">`;
    }
    const initial = teamName ? teamName.charAt(0).toUpperCase() : '?';
    return `<div class="${sizeClass} rounded-full bg-slate-800 border border-slate-700 text-gold-400 font-extrabold flex items-center justify-center text-[10px] shrink-0">${initial}</div>`;
}

export function slugify(text) {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
