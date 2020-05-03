import * as utils from '../common/utils'
import Game from '../common/game'
import Entity from '../common/entity'
import LockStepManager from '../common/lockstep-manager'
import Networker from '../common/networker'

export default class GameController {
  constructor(game, gameView, socket, gameName) {
    this.game = game
    this.gameView = gameView

    // обмен данными в игре через это класс
    this.networker = new Networker(socket, gameName)

    // регулятор последовательностей команд в многопользовательской игре
    this.lockStepManager = new LockStepManager(game.networkId, game.teams.length)
    this.lockStepManager.setNetworker(this.networker)

    this.raf = null

    // this._firstDate = 0;
    this._last = 0
    this.delta = 0
    // this.deltaMS = 0;
    this.time = 0
    this._lastTime = 0
    this.maxFrame = 35

    this.lastUpdateTime = 0
  }

  update(dt) {
    this.game.update(dt / 1000)

    this.lastUpdateTime = Date.now()
  }

  animation(time) {
    const now = Date.now()
    this.time += Math.min(now - this._last, this.maxFrame)
    this.delta = this.time - this._lastTime // milliseconds обычно 15,16,17
    this._lastTime = this.time
    this._last = now

    // this.absTime = time;

    this.lockStepManager.update(this.delta, this.update.bind(this), this.game.processCommands.bind(this.game))

    let drawInterpolationFactor = 0
    if (this.lastUpdateTime) {
      drawInterpolationFactor = (now - this.lastUpdateTime) / 50 // TODO 50 откуда ?!!!
      // console.log('factor: ' + drawInterpolationFactor);

      drawInterpolationFactor = drawInterpolationFactor > 1 ? 1 : drawInterpolationFactor
    }

    this.gameView.draw(drawInterpolationFactor)

    this.raf = requestAnimationFrame(this.animation.bind(this))
  }

  start() {
    this.animation(0)
  }

  stop() {
    if (this.animatinFrameHandle) {
      cancelAnimationFrame(this.raf)
    }
  }

  onPlayerClick(position, button, shiftPressed) {
    for (let i = 0; i < this.game.units.length; ++i) {
      let unit = this.game.units[i]

      if (
        utils.pointInRect(position, {
          x: (unit.position.x + 0.5) * Game.CELL_SIZE - unit.size.w / 2,
          y: (unit.position.y + 0.5) * Game.CELL_SIZE - unit.size.h / 2,
          w: unit.size.w,
          h: unit.size.h,
        })
      ) {
        // left button
        if (button === 0) {
          if (unit.selected) {
            if (shiftPressed) {
              unit.selected = false
              // ищем в спике выделенных юнитов и удаляем из него
              for (let i = 0; i < this.game.selectedUnits.length; ++i) {
                if (this.game.selectedUnits[i] === unit) {
                  this.game.selectedUnits.splice(i, 1)
                  break
                }
              }
            }
          } else {
            // если был список ранее выделенных юнитов, то всех развыделяем
            for (let i = 0; i < this.game.selectedUnits.length; ++i) {
              this.game.selectedUnits[i].selected = false
            }

            // создаем список заново с этим выделенным юнитом
            this.game.selectedUnits = [unit]
            unit.selected = true
          }
        }
        // right button
        else if (button === 2) {
          // console.log(`CLICK AT ${globalPosition.x / CELL_SIZE | 0},${position.y / CELL_SIZE | 0}`);
        }

        return
      }
    }

    // clicked on free area or other entity

    if (button === 2) {
      let uids = []

      for (let i = 0; i < this.game.selectedUnits.length; i++) {
        const unit = this.game.selectedUnits[i]

        if (unit.team === this.game.player) {
          uids.push(unit.uid)
        }
      }

      if (uids.length > 0) {
        this.lockStepManager.addCommand({
          uids: uids,
          command: 'move',
          details: {
            // TODO: экранная position должна учитывать смещение карты (см код создания Mouse в сцене)
            position: { x: (position.x / Game.CELL_SIZE) | 0, y: (position.y / Game.CELL_SIZE) | 0 },
          },
        })
      }
    }
  }

  onPlayerBoundSelect(bounds) {
    // console.log('PLAYER:' + this.game.player);
    //
    // console.log('bounds: ' + JSON.stringify(bounds));

    const newSelection = []

    let selectedBuilding = null

    for (let entity of this.game.units) {
      const entityRect = {
        x: (entity.position.x + 0.5) * Game.CELL_SIZE - entity.size.w / 2,
        y: (entity.position.y + 0.5) * Game.CELL_SIZE - entity.size.h / 2,
        w: entity.size.w,
        h: entity.size.h,
      }

      console.log(JSON.stringify(entityRect))

      const fits = utils.rectInRect(entityRect, bounds)
      //
      // console.log("fits:" + fits);
      //
      //
      // console.log('team:' + entity.team);

      if (fits && entity.team === this.game.player) {
        if (entity.selectable) {
          if (entity.type === Entity.BUILDING && !selectedBuilding) {
            selectedBuilding = entity
          } else if (entity.type === Entity.UNIT) {
            newSelection.push(entity)
          }
        }
      }
    }

    if (newSelection.length > 0) {
      for (let selectedUnit of this.game.selectedUnits) {
        let exists = false
        for (let i = 0; i < newSelection.length; ++i) {
          if (newSelection[i] === selectedUnit) {
            exists = true
            break
          }
        }
        if (!exists) {
          selectedUnit.selected = false
        }
      }

      this.game.selectedUnits = newSelection
    } else if (selectedBuilding) {
      this.game.selectedUnits = selectedBuilding
    }

    for (let selectedUnit of this.game.selectedUnits) {
      selectedUnit.selected = true
    }
  }
}
