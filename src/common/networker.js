export default class Networker {
    constructor (socket, gameName) {
        this.socket = socket;
        this.gameName = gameName;
    }

    sendCommand(command, lockStepTurnID, playerID, ) {
        // if (command.command !== 'ping') console.log('SEND COMMAND:' + JSON.stringify(command));
        this.socket.emit('sendCommand', this.gameName, command, lockStepTurnID, playerID);
    }

    /**
     * @param lockStepTurn - шаг
     * @param confirmingPlayerID - id подтверждающего узла
     * @param confirmedPlayerID - id подтверждаемого узла
     * */
    confirmCommand(lockStepTurn, confirmingPlayerID, confirmedPlayerID) {
        // console.log('CONFIRMING ACTION');
        this.socket.emit('confirmCommand', this.gameName, lockStepTurn, confirmingPlayerID, confirmedPlayerID);
    }

    setLockStepManager (lsm) {
        this.socket.on('receiveCommand', (command, lockStepTurn, playerID) => {
            // if (command.command !== 'ping') console.log('RECEIVED COMMAND: ' + JSON.stringify(command));
            lsm.receiveCommand(command, lockStepTurn, playerID);
        });

        this.socket.on('confirmCommand', (lockStepTurn, confirmingPlayerID) => {

            // console.log(`CONFIRMING COMMAND FROM ${confirmingPlayerID}`);

            lsm.confirmCommand(lockStepTurn, confirmingPlayerID);
        });
        
        this.socket.on('dropUser', playerID => {
            lsm.dropUser(playerID);
        });
    }
}