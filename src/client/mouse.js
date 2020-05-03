const PANNING_THRESHOLD = 15;

export default class Mouse extends PIXI.Container {
    constructor (onClick, onBoundSelect, onDragging, onPanning) {
        super();
    
        this.interactive = true;
        this.buttonMode = true;
        
        this.onClick = onClick;
        this.onBoundSelect = onBoundSelect;
        this.onDragging = onDragging;
        this.onPanning = onPanning;
        
        this.dragging = false;
    
        this.pointerInitialPosition = null;

        this.parentSize = null;
    
        this.mouseSelection = new PIXI.Graphics();
        this.mouseSelection.visible = false;
        this.addChild(this.mouseSelection);
        
        this.on('added', function () {
            this.parentSize = {w:this.parent.width, h:this.parent.height};
           
            this.parent.on('pointerdown', this.pointerDown.bind(this));
            this.parent.on('pointerup', this.pointerUp.bind(this));
            this.parent.on('pointermove', this.pointerMove.bind(this));
            this.parent.on('pointerupoutside', this.pointerUpOutside.bind(this));
        }.bind(this));
    }
    
    pointerDown(event) {
        
        if (event.data.originalEvent.button === 0) {
            if (this.onBoundSelect) {
                this.mouseSelection.visible = true;
                this.mouseSelection.clear();
            }
    
            this.dragging = true;
            this.pointerInitialPosition = event.data.getLocalPosition(this.parent);
    
            if (this.onDragging) {
                this.onDragging({x:this.pointerInitialPosition.x, y:this.pointerInitialPosition.y});
            }
        }
    }
    
    pointerUp (event) {
    
        let position = event.data.getLocalPosition(this.parent);
        
        if (event.data.originalEvent.button === 0) {
            if (this.onBoundSelect) {
                this.mouseSelection.visible = false;
            }
    
            this.dragging = false;
    
            if (Math.abs(position.x - this.pointerInitialPosition.x) >= 4 && Math.abs(position.y - this.pointerInitialPosition.y) >= 4) {
                if (this.onBoundSelect) {
                    let x_min = Math.min(this.pointerInitialPosition.x, position.x);
                    let x_max = Math.max(this.pointerInitialPosition.x, position.x);
            
                    let y_min = Math.min(this.pointerInitialPosition.y, position.y);
                    let y_max = Math.max(this.pointerInitialPosition.y, position.y);
            
                    this.onBoundSelect({x:x_min, y:y_min, w: x_max - x_min , h:y_max - y_min});
                }
            }
            else {
                if (this.onClick) {
                    this.onClick({x: position.x, y: position.y}, event.data.originalEvent.button, event.data.originalEvent.shiftKey);
                }
            }
        }
        else {
            if (this.onClick) {
                this.onClick({x: position.x, y: position.y}, event.data.originalEvent.button, event.data.originalEvent.shiftKey);
            }
        }
    }
    
    pointerMove (event) {
        let position = event.data.getLocalPosition(this.parent);
    
        if (position.x < 0 || position.x > this.parentSize.w || position.y < 0 || position.y > this.parentSize.h) {
            return;
        }
        
        if (this.dragging) {

            if (this.onBoundSelect) {
                this.mouseSelection.clear();
                this.mouseSelection.lineStyle(1, 0x00FF00, 1);
                this.mouseSelection.drawRect(this.pointerInitialPosition.x, this.pointerInitialPosition.y, position.x - this.pointerInitialPosition.x, position.y - this.pointerInitialPosition.y);
            }
    
            if (this.onDragging) {
                this.onDragging({x:position.x, y:position.y});
            }
        }
        else {
            if (this.onPanning) {
                let horizontalPanning = 0;
                if (position.x < PANNING_THRESHOLD) {
                    horizontalPanning = -1;
                }
                else if (position.x > this.parentSize.w - PANNING_THRESHOLD) {
                    horizontalPanning = 1;
                }
    
                let verticalPanning = 0;
                if (position.y < PANNING_THRESHOLD) {
                    verticalPanning = -1;
                }
                else if (position.y > this.parentSize.h - PANNING_THRESHOLD) {
                    verticalPanning = 1;
                }
                
                this.onPanning(horizontalPanning, verticalPanning);
            }
        }
    }
    
    pointerUpOutside (event) {
        if (this.onBoundSelect) {
            this.mouseSelection.visible = false;
            this.mouseSelection.clear();
        }
        
        this.dragging = false;
    }
}