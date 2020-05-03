import StopWatch from './stopwatch';

export default class ConfirmedActions {
    constructor (numberOfPlayers) {
        this.numberOfPlayers = numberOfPlayers;
        
        this.playersConfirmedCurrentAction = [];
        this.playersConfirmedPriorAction = [];

        this.currentSW = new StopWatch();
        this.priorSW = new StopWatch();
    }

    dump () {
        console.log('\t- Confirmed actions');
        console.log(`\t\t* players confirmed current action  : + ${JSON.stringify(this.playersConfirmedCurrentAction)}`);
        console.log(`\t\t* players confirmed prior action  : + ${JSON.stringify(this.playersConfirmedPriorAction)}`);
    }

    getPriorTime () {
        return this.priorSW.elapsedMilliseconds;
    }

    startTimer () {
        this.currentSW.start();
    }

    dropUser (userId) {
        if (this.numberOfPlayers > 0) {
            this.numberOfPlayers--;
        }
        
        if (this.playersConfirmedPriorAction.length > this.numberOfPlayers) {
            this.playersConfirmedPriorAction.length = this.numberOfPlayers
        }
    
        if (this.playersConfirmedCurrentAction.length > this.numberOfPlayers) {
            this.playersConfirmedCurrentAction.length = this.numberOfPlayers
        }
    }

    confirmAction (confirmingPlayerID, currentLockStepTurn, confirmedActionLockStepTurn) {
        if (confirmedActionLockStepTurn == currentLockStepTurn) {
            // if current turn, add to the current turn confirmation
            this.playersConfirmedCurrentAction.push(confirmingPlayerID);

            // if received the last confirmation, stop timer
            // this gives us the length of the longest roundtrip message
            if (this.playersConfirmedCurrentAction.length == this.numberOfPlayers) {
                this.currentSW.stop();
            }
        }
        else if (confirmedActionLockStepTurn == currentLockStepTurn - 1) {
            // if confirmation for prior turn, add to the prior turn confirmation
            this.playersConfirmedPriorAction.push(confirmingPlayerID);

            // if received the last confirmation, stop timer
            // this gives us the length of the longest roundtrip message
            if (this.playersConfirmedPriorAction.length == this.numberOfPlayers) {
                this.priorSW.stop();
            }
        }
        else {
            console.error(`WARNING!!! Unexpected lockstepID confirmed: ${confirmedActionLockStepTurn} from player: ${confirmingPlayerID}`);
        }
    }

    nextTurn () {
        this.playersConfirmedPriorAction = this.playersConfirmedCurrentAction;
        this.playersConfirmedCurrentAction = [];

        const swap = this.priorSW;
        this.priorSW = this.currentSW;
        this.currentSW = swap;
        this.currentSW.reset();
    }
    
    readyForNextTurn (lockStepTurnID) {
        // check that the action that is going to be processed has been confirmed
        if (this.playersConfirmedPriorAction.length == this.numberOfPlayers) {
            return true;
        }
        
        // if 2nd turn, check that the 1st turns action has been confirmed
        if (lockStepTurnID == 1) {
            return this.playersConfirmedCurrentAction.length == this.numberOfPlayers;
        }
        
        // no actions has been sent out prior to the first turn
        if (lockStepTurnID == 0) {
            return true;
        }
        
        // if none of conditions have been met
        return false;
    }
}
