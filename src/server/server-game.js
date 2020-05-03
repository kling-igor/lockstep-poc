import Game from './game'
export default class ServerGame extends Game {
    constructor(level, players) {
        super(level, players);
    }

    loadMap() {
        console.log('loading map ' + this.levelInfo.map);
    }
}