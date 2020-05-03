import Game from './game'
export default class SinglePlayerGame extends Game {
    constructor(level, players, player) {
        super(level, players, player);
    }
    
    sendCommand(uids, command) {
        this.processCommand(uids, command);
    }
}