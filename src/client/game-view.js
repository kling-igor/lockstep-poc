import UnitView from './unit-view'
import Mouse from './mouse'

export default class GameView extends PIXI.Container {
  constructor(game, renderer) {
    super()

    this.map = new PIXI.Sprite(PIXI.utils.TextureCache['test_map.png'])
    this.addChild(this.map)

    this.map.interactive = true
    this.map.buttonMode = true

    this.game = game
    this.renderer = renderer

    this._delegate = null

    // превратить в пулл объектов
    this.entitiesViews = []

    game.eachEntity((entity) => {
      console.log('-- adding entity:' + JSON.stringify(entity))

      let entityView = new UnitView(entity.team)
      this.map.addChild(entityView)
      entityView.linkTo(entity)

      this.entitiesViews.push(entityView)
    })

    const mouse = new Mouse(
      (position, button, shiftPressed) => {
        this.delegate.onPlayerClick(
          {
            x: position.x /* + mapX*/,
            y: position.y /* + mapY*/,
          },
          button,
          shiftPressed
        )
      },
      (bounds) => {
        console.log('bounds')

        // bounds.x += mapX;
        // bounds.y += mapY;

        this.delegate.onPlayerBoundSelect(bounds)
      }
    )

    this.map.addChild(mouse)
  }

  draw(drawInterpolationFactor) {
    for (let view of this.entitiesViews) {
      view.updateView(drawInterpolationFactor)
    }

    this.renderer.render(this)
  }

  get delegate() {
    return this._delegate
  }

  set delegate(delegate) {
    this._delegate = delegate
  }
}
