import Game from '../common/game'
export default class ClientGame extends Game {
    constructor(level, players, playerColor) {
        super(level, players, playerColor);
    }
    
    // sendCommand(uids, command) {
        //  УДАЛИТЬ ОТСЮДА!!!
        // this.processCommand(uids, command);
    // }
}