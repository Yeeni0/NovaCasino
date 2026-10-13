const GAMES = {};
const GAME_ORDER = [];
function reg(g) { GAMES[g.id] = g; GAME_ORDER.push(g.id); }
let currentGame = null;
