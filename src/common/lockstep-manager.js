import PendingActions from './pending-actions'
import ConfirmedActions from './confirmed-actions'
import RollingAverage from './rolling-average'
import StopWatch from './stopwatch'

const CURRENT = 0

export default class LockStepManager {
  constructor(playerID, numberOfPlayers) {
    this.playerID = playerID
    this.numberOfPlayers = numberOfPlayers

    this.pendingActions = new PendingActions(numberOfPlayers)
    this.confirmedActions = new ConfirmedActions(numberOfPlayers)

    // used to find the maximum gameframe runtime in the current lockstep turn
    this.currentGameFrameRuntime = 0

    this.gameTurnSW = new StopWatch()

    // Lockstep metrics

    this.initialLockStepTurnLength = 200 // milliseconds
    this.initialGameFrameTurnLength = 50 // milliseconds

    this.networkAverage = new RollingAverage(numberOfPlayers, this.initialLockStepTurnLength)
    this.runtimeAverage = new RollingAverage(numberOfPlayers, this.initialLockStepTurnLength)

    this.lockStepTurnLength = this.initialLockStepTurnLength
    this.gameFrameTurnLength = this.initialGameFrameTurnLength

    this.gameFramesPerLockstepTurn = (this.lockStepTurnLength / this.gameFrameTurnLength) | 0

    this.gameFrame = 0
    this.accumulatedTime = 0 // ms

    this.lockStepTurnID = 0

    this.actionsToSend = []

    this.networker = null

    // used to rotate what players's action gets processed first
    this.playerIdToProcessFirst = 0
  }

  dump() {
    console.log(`LSM (${this.playerID}) lockStepTurnID=${this.lockStepTurnID} gameFrame=${this.gameFrame}`)
    if (this.actionsToSend.length > 0) {
      console.log(`actions to send: ${JSON.stringify(this.actionsToSend)}`)
    }
    this.pendingActions.dump()
    this.confirmedActions.dump()
  }

  setNetworker(networker) {
    this.networker = networker
    networker.setLockStepManager(this)
  }

  dropUser(userId) {
    this.pendingActions.dropUser(userId)
    this.confirmedActions.dropUser(userId)
  }

  update(dt, updateCallback, processActionsCallback) {
    this.accumulatedTime += dt

    while (this.accumulatedTime > this.gameFrameTurnLength) {
      this.gameFrameTurn(dt, updateCallback, processActionsCallback)
      this.accumulatedTime -= this.gameFrameTurnLength
    }
  }

  /**
   * @param dt - time delta (milliseconds) ~15,16,17
   * */
  gameFrameTurn(dt, updateCallback, processActionsCallback) {
    // let timestamp = new Date(Date.now());
    // console.log(`PROCEED gameFrameTurn ${this.gameFrame} at ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}.${timestamp.getMilliseconds()}`);

    //на первом шаге обрабатываем команды
    if (this.gameFrame == 0) {
      if (!this.lockStepTurn(processActionsCallback)) {
        return
      }
    }

    this.gameTurnSW.start()
    // на последующих обновляем логику

    updateCallback(this.gameFrameTurnLength)

    this.gameFrame++

    if (this.gameFrame == this.gameFramesPerLockstepTurn) {
      this.gameFrame = 0
    }

    this.gameTurnSW.stop()

    const runtime = dt + this.gameTurnSW.elapsedMilliseconds

    if (runtime > this.currentGameFrameRuntime) {
      this.currentGameFrameRuntime = runtime
    }

    this.gameTurnSW.reset()
  }

  lockStepTurn(processActionsCallback) {
    // console.log(`[${this.playerID}] LOCKSTEP TURN ${this.lockStepTurnID}`);

    const readyForNextTurn = this.readyForNextTurn()

    if (readyForNextTurn) {
      this.lockStepTurnID++

      this.confirmedActions.nextTurn()
      this.pendingActions.nextTurn()

      this.sendPendingActions()

      // после прогрева игры на 3 шага уже возможно выполнять действия
      if (this.lockStepTurnID >= 3) {
        // process actions should be considered in runtime performance
        this.gameTurnSW.start()

        const commands = []

        for (let i = this.playerIdToProcessFirst; i < this.pendingActions.queue[CURRENT].actions.length; i++) {
          const action = this.pendingActions.queue[CURRENT].actions[i]

          this.runtimeAverage.add(action.runtimeAverage, i)
          this.networkAverage.add(action.networkAverage, i)

          if (action.command !== 'ping' && action.command !== 'noop') {
            commands.push(action)
          }
        }

        for (let i = 0; i < this.playerIdToProcessFirst; i++) {
          const action = this.pendingActions.queue[CURRENT].actions[i]

          this.runtimeAverage.add(action.runtimeAverage, i)
          this.networkAverage.add(action.networkAverage, i)

          if (action.command !== 'ping' && action.command !== 'noop') {
            commands.push(action)
          }
        }

        if (commands.length > 0) {
          processActionsCallback(commands)

          this.playerIdToProcessFirst++
          if (this.playerIdToProcessFirst >= this.pendingActions.queue[CURRENT].actions.length) {
            this.playerIdToProcessFirst = 0
          }
        }

        this.gameTurnSW.stop()
      }
    }

    this.updateGameFrameRate()

    return readyForNextTurn
  }

  updateGameFrameRate() {
    this.lockStepTurnLength = this.networkAverage.max * 2 /* 2 round trips */
    if (this.lockStepTurnLength == 0) {
      this.lockStepTurnLength = 1 // minimum 1 ms
    }
    this.gameFrameTurnLength = this.runtimeAverage.max

    // lockstep turn has to bee at least as long as one game frame
    if (this.gameFrameTurnLength > this.lockStepTurnLength) {
      this.lockStepTurnLength = this.gameFrameTurnLength
    }

    this.gameFramesPerLockstepTurn = Math.floor(this.lockStepTurnLength / this.gameFrameTurnLength)
    //if gameframe turn length does not evenly divide the lockstep turn, there is extra time left after the last
    //game frame. Add one to the game frame turn length so it will consume it and recalculate the Lockstep turn length
    if (this.lockStepTurnLength % this.gameFrameTurnLength > 0) {
      this.gameFrameTurnLength++
      this.lockStepTurnLength = this.gameFramesPerLockstepTurn * this.gameFrameTurnLength
    }
  }

  readyForNextTurn() {
    return (
      this.confirmedActions.readyForNextTurn(this.lockStepTurnID) &&
      this.pendingActions.readyForNextTurn(this.lockStepTurnID)
    )
  }

  /**
   * Sending action to server
   * */
  sendPendingActions() {
    let action = null

    if (this.actionsToSend.length > 0) {
      action = this.actionsToSend.shift()

      //     let timestamp = new Date(Date.now());
      //     console.log(`Sending action at lockstepTurn ${this.lockStepTurnID} at ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}.${timestamp.getMilliseconds()}`);
    }

    if (action === null) {
      action = { command: 'ping', details: { sender: this.playerID } }
    }

    if (this.lockStepTurnID > 1) {
      action.networkAverage = this.confirmedActions.getPriorTime()
    } else {
      action.networkAverage = this.initialLockStepTurnLength
    }

    action.runtimeAverage = this.currentGameFrameRuntime

    this.currentGameFrameRuntime = 0

    // add action to our own list of actions to process
    this.pendingActions.addAction(action, this.playerID, this.lockStepTurnID, this.lockStepTurnID)

    // start the confirmed action timer for network average
    this.confirmedActions.startTimer()

    //confirm our own action (as it was like over network yet received)
    // this.confirmedActions.playersConfirmedCurrentAction.push(this.playerID);
    this.confirmedActions.confirmAction(this.playerID, this.lockStepTurnID, this.lockStepTurnID)

    // sending action to all other players
    this.networker.sendCommand(action, this.lockStepTurnID, this.playerID)
  }

  /**
   * Receiving action from server
   *
   * @param lockStepTurn - the is action for
   * @param playerID - sender id (number 0..numberOfPlayers-1 )
   * @param action - action
   * */
  receiveCommand(command, lockStepTurn, playerID) {
    this.pendingActions.addAction(command, playerID, this.lockStepTurnID, lockStepTurn)

    this.networker.confirmCommand(lockStepTurn, this.playerID, playerID)
  }

  /**
   * Receiving action confirmation
   * */
  confirmCommand(lockStepTurn, confirmingPlayerId) {
    if (lockStepTurn == this.lockStepTurnID) {
      // if current turn, add to the current turn confirmation
      this.confirmedActions.playersConfirmedCurrentAction.push(confirmingPlayerId)
    } else if (lockStepTurn == this.lockStepTurnID - 1) {
      // if confirmation for prior turn, add to the prior turn confirmation
      this.confirmedActions.playersConfirmedPriorAction.push(confirmingPlayerId)
    } else {
      console.error(`WARNING!!! Unexpected lockstepID ${lockStepTurn} from player ${confirmingPlayerId}`)
    }
  }

  addCommand(command) {
    // let timestamp = new Date(Date.now());
    // console.log(`Enqueue action at lockstepTurn ${this.lockStepTurnID} at ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}.${timestamp.getMilliseconds()}`);

    this.actionsToSend.push(command)
  }
}
