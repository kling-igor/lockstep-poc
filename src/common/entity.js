import * as utils from './utils'

let lastGID = 0

const ITEM = Symbol('item')
const UNIT = Symbol('unit')
const BUILDING = Symbol('building')
const BULLET = Symbol('bullet')

const noop = function () {}

const NullView = {
  directionChanged: noop,
  selectionChanged: noop,
  positionChanged: noop,
  update: noop,
}

export default class Entity {
  constructor(description) {
    this._type = description.type || ITEM
    this._uid = Entity.getGID()
    this._position = description.position || { x: 0, y: 0 } // px
    this._size = description.size
    this._selectable = description.selectable || true
    this._selected = false

    this._directions = description.directions || 1
    this._direction = utils.wrapDirection(
      description.direction !== undefined ? description.direction : 0,
      this._directions
    )

    this._team = description.team

    this._view = NullView
  }

  static getGID() {
    lastGID++
    return lastGID
  }

  joinToTeam(team) {
    this._team = team
  }

  linkToView(sprite) {
    this._view = sprite
  }

  unlinkFromView() {
    if (this._view !== NullView) {
      this._view = NullView
    }
  }

  live(dt) {
    this._view.update()
  }

  get uid() {
    return this._uid
  }

  get type() {
    return this._type
  }

  get team() {
    return this._team
  }

  get selectable() {
    return this._selectable
  }

  get directions() {
    return this._directions
  }

  get direction() {
    return this._direction
  }

  set direction(direction) {
    this._direction = direction

    this._view.directionChanged()
  }

  set position(position) {
    this._position.x = position.x
    this._position.y = position.y

    this._view.positionChanged()
  }

  get position() {
    return this._position
  }

  get size() {
    return this._size
  }

  set selected(selected) {
    if (!this._selectable) return

    this._selected = selected

    this._view.selectionChanged()
  }

  get selected() {
    return this._selected
  }

  acceptOrder(detials) {}
}

Entity.ITEM = ITEM
Entity.UNIT = UNIT
Entity.BUILDING = BUILDING
Entity.BULLET = BULLET
