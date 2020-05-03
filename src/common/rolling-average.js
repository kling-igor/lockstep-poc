export default class RollingAverage {
    constructor (numberOfPlayers, initValue) {
        this.playerAverages = [];
        this.currentValues = [];

        for (let i = 0; i < numberOfPlayers; ++i) {
            this.playerAverages.push(initValue);
            this.currentValues.push(initValue);
        }
    }

    dropPlayer (playerId) {
        this.playerAverages[playerId] = 0;
        this.currentValues[playerId] = 0;
    }

    add (value, playerId) {
        if (value > this.playerAverages[playerId]) {
            // rise quickly
            this.playerAverages[playerId] = value;
        }
        else {
            // slowly fall down
            this.playerAverages[playerId] = (this.playerAverages[playerId] * 9 + value) / 10 | 0;
        }

        this.currentValues[playerId] = value;
    }

    get max() {
        let max = this.playerAverages[0];
        
        for (let i = 1; i < this.playerAverages.length; i++) {
            if (this.playerAverages[i] > max) {
                max = this.playerAverages[i];
            }
           
        }
    
        return max;
    }
}