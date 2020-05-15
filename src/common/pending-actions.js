const CURRENT = 0
const NEXT = 1
const NEXT_NEXT = 2
const NEXT_NEXT_NEXT = 3

export default class PendingActions {
  constructor(numberOfPlayers) {
    this.queue = []

    this.numberOfPlayers = numberOfPlayers

    this.queue.push({
      actions: new Array(numberOfPlayers),
      count: 0,
    })

    this.queue.push({
      actions: new Array(numberOfPlayers),
      count: 0,
    })

    this.queue.push({
      actions: new Array(numberOfPlayers),
      count: 0,
    })

    // in case other players advance to the next step and send their action before we advance to a step
    this.queue.push({
      actions: new Array(numberOfPlayers),
      count: 0,
    })

    this.dropedUsers = []
    this.dropedUsersCount = 0
  }

  dump() {
    console.log('\t- Pending actions')
    console.log(
      `\t\t* current actions (${this.queue[CURRENT].count}) : + ${JSON.stringify(this.queue[CURRENT.actions])}`
    )
    console.log(`\t\t* next actions (${this.queue[NEXT].count}) : + ${JSON.stringify(this.queue[NEXT.actions])}`)
    console.log(
      `\t\t* next next actions (${this.queue[NEXT_NEXT].count}) : + ${JSON.stringify(this.queue[NEXT_NEXT.actions])}`
    )
    console.log(
      `\t\t* next next next actions (${this.queue[NEXT_NEXT_NEXT].count}) : + ${JSON.stringify(
        this.queue[NEXT_NEXT_NEXT.actions]
      )}`
    )
  }

  dropUser(userId) {
    this.dropedUsers.push(userId)
    this.dropedUsersCount++
  }

  nextTurn() {
    // remove CURRENT and PROPAGATE ALL TO THE LEFT
    this.queue.shift()

    // ADD A NEW ONE
    this.queue.push({
      actions: new Array(this.numberOfPlayers),
      count: 0,
    })

    for (let i in this.dropedUsers) {
      this.queue[NEXT_NEXT_NEXT].actions[this.dropedUsers[i]] = {
        command: 'noop',
        networkAverage: 0,
        runtimeAverage: 0,
      }
      this.queue[NEXT_NEXT_NEXT].count += 1
    }
  }

  addAction(action, playerID, currentLockStepTurn, actionsLockStepTurn) {
    // add action for processing later
    if (actionsLockStepTurn == currentLockStepTurn + 1) {
      // if action is for next turn, add for processing 3 turns away

      const nextNextNext = this.queue[NEXT_NEXT_NEXT]

      if (nextNextNext.actions[playerID]) {
        console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`)
      }

      nextNextNext.actions[playerID] = action
      nextNextNext.count += 1
    } else if (actionsLockStepTurn == currentLockStepTurn) {
      // if received action during our current turn, add for processing 2 turns away

      const nextNext = this.queue[NEXT_NEXT]

      // if action is for next turn, add for processing 3 turns away
      if (nextNext.actions[playerID]) {
        console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`)
      }

      nextNext.actions[playerID] = action
      nextNext.count += 1
    } else if (actionsLockStepTurn == currentLockStepTurn - 1) {
      // if received action for last turn, add for processing 1 turns away

      // if action is for next turn, add for processing 3 turns away

      const next = this.queue[NEXT]

      if (next.actions[playerID]) {
        console.error(`WARNING!!! Received multiple actions for player ${playerID} for turn ${actionsLockStepTurn}`)
      }

      next.actions[playerID] = action
      next.count += 1
    } else {
      console.error(`WARNING!!! Unexpected lockstepID received: ${actionsLockStepTurn}`)
    }
  }

  readyForNextTurn(lockStepTurnID) {
    if (this.queue[NEXT_NEXT].count === this.numberOfPlayers) {
      // if this is the 2nd turn, check if all the actions sent out on the 1st turn have been received
      if (lockStepTurnID == 1) {
        return true
      }

      // check if all actions that will be processed next turn have been received
      if (this.queue[NEXT].count === this.numberOfPlayers) {
        return true
      }
    }

    // if this is the 1st turn, no actions had the chance to be received yet
    if (lockStepTurnID == 0) {
      return true
    }

    // if none of conditions have been met, return false
    return false
  }
}
