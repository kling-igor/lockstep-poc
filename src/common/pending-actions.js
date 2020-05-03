export default class PendingActions {
    constructor (numberOfPlayers) {
        this.numberOfPlayers = numberOfPlayers;
        
        this.currentActions = new Array(numberOfPlayers);
        this.currentActionsCount = 0;
        
        this.nextActions = new Array(numberOfPlayers);
        this.nextActionsCount = 0;
        
        this.nextNextActions = new Array(numberOfPlayers);
        this.nextNextActionsCount = 0;
        
        // in case other players advance to the next step and send their action before we advance to a step
        this.nextNextNextActions = new Array(numberOfPlayers);
        this.nextNextNextActionsCount = 0;
        
        
        this.dropedUsers = [];
        this.dropedUsersCount = 0;
    }

    dump () {
        console.log('\t- Pending actions');
        console.log(`\t\t* current actions (${this.currentActionsCount}) : + ${JSON.stringify(this.currentActions)}`);
        console.log(`\t\t* next actions (${this.nextActionsCount}) : + ${JSON.stringify(this.nextActions)}`);
        console.log(`\t\t* next next actions (${this.nextNextActionsCount}) : + ${JSON.stringify(this.nextNextActions)}`);
        console.log(`\t\t* next next next actions (${this.nextNextNextActionsCount}) : + ${JSON.stringify(this.nextNextNextActions)}`);
    }

    dropUser (userId) {
        this.dropedUsers.push(userId);
        this.dropedUsersCount++;
    }
    
    nextTurn () {
        this.currentActions = this.nextActions;
        this.currentActionsCount = this.nextActionsCount;
        
        this.nextActions = this.nextNextActions;
        this.nextActionsCount = this.nextNextActionsCount;
        
        this.nextNextActions = this.nextNextNextActions;
        this.nextNextActionsCount = this.nextNextNextActionsCount;
        
        this.nextNextNextActions = new Array(this.numberOfPlayers);
        this.nextNextNextActionsCount = 0;
        
        for (let i in this.dropedUsers) {
            this.nextNextNextActions[this.dropedUsers[i]] = {command:'noop', networkAverage:0, runtimeAverage:0};
            this.nextNextNextActionsCount++;
        }
    }
    
    addAction(action, playerID, currentLockStepTurn, actionsLockStepTurn) {
        // add action for processing later
        if (actionsLockStepTurn == currentLockStepTurn + 1) {
            // if action is for next turn, add for processing 3 turns away
            if (this.nextNextNextActions[playerID]) {
                console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`);
            }
            
            this.nextNextNextActions[playerID] = action;
            this.nextNextNextActionsCount++;
        }
        else if (actionsLockStepTurn == currentLockStepTurn) {
            // if received action during our current turn, add for processing 2 turns away
            
            // if action is for next turn, add for processing 3 turns away
            if (this.nextNextActions[playerID]) {
                console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`);
            }
            
            this.nextNextActions[playerID] = action;
            this.nextNextActionsCount++;
        }
        else if (actionsLockStepTurn == currentLockStepTurn - 1) {
            // if received action for last turn, add for processing 1 turns away
            
            // if action is for next turn, add for processing 3 turns away
            if (this.nextActions[playerID]) {
                console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`);
            }
            
            this.nextActions[playerID] = action;
            this.nextActionsCount++;
        }
        else {
            console.error(`WARNING!!! Unexpected lockstepID received: ${actionsLockStepTurn}`);
        }
    }
    
    readyForNextTurn (lockStepTurnID) {
        if (this.nextNextActionsCount == this.numberOfPlayers) {
            // if this is the 2nd turn, check if all the actions sent out on the 1st turn have been received
            if (lockStepTurnID == 1) {
                return true;
            }
            
            // check if all actions that will be processed next turn have been received
            if (this.nextActionsCount == this.numberOfPlayers) {
                return true;
            }
        }

        
        // if this is the 1st turn, no actions had the chance to be received yet
        if (lockStepTurnID == 0) {
            return true;
        }

        // if none of conditions have been met, return false
        return false;
    }
}