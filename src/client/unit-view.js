import Game from '../common/game';

export default class UnitView extends PIXI.Container {
    
    constructor(team) {
        super();
        
        this.selectFrame = new PIXI.Graphics();
        this.selectFrame.clear();
        this.selectFrame.lineStyle(1, 0x000000, 1);
        this.selectFrame.drawRect(-16,-16,32,32);
        
        this.addChild(this.selectFrame);
    
        this.unitView = new PIXI.Graphics();
        this.unitView.clear();
    
        
        switch (team) {
            case 'red':
                this.unitView.lineStyle(1, 0xFF0000, 1);
                this.unitView.beginFill(0xFF0000);
                break;

            case 'blue':
                this.unitView.lineStyle(1, 0x0000FF, 1);
                this.unitView.beginFill(0x0000FF);
                break;

            case 'green':
                this.unitView.lineStyle(1, 0x10FF10, 1);
                this.unitView.beginFill(0x10FF10);
                break;

            default:
                this.unitView.lineStyle(1, 0xFFFFFF, 1);
                break;
        }
    
        this.unitView.drawRect(-13,-13,27,26);
        this.addChild(this.unitView);
        
        this.unit = null;
    }
    
    linkTo (unit) {
        this.unit = unit;
        this.unit.linkToView(this);
        this.selectFrame.visible = this.unit.selected;

        this.updateView();
    }
    
    unlink () {
        if (this.unit) {
            this.unit.unlinkFromView();
            this.unit = null;
        }
    }
    
    update (dt) {
        if (this.unit) {

            // обновляем состояния представления


            this.updateView();
        }
    }
    
    updateView (interpolationFactor) {
        this.position.set(this.unit.position.x * Game.CELL_SIZE + Game.CELL_SIZE / 2 + this.unit.lastMovementX * interpolationFactor,
                          this.unit.position.y * Game.CELL_SIZE + Game.CELL_SIZE / 2 + this.unit.lastMovementX * interpolationFactor);
    }
    
    selectionChanged () {
        this.selectFrame.visible = this.unit.selected;
    }
    
    positionChanged () {
        this.position.set(this.unit.position.x * Game.CELL_SIZE + Game.CELL_SIZE / 2, this.unit.position.y * Game.CELL_SIZE + Game.CELL_SIZE / 2);
    }
    
    directionChanged () {
        // this.updateView();
    }
    
    stateChanged () {

        // this.updateView();
    }
}