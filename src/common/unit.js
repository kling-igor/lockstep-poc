import Entity from './entity';
import Game from './game';
import * as utils from './utils';

const CELL_SIZE = utils.CELL_SIZE;

const IDLE_STATE = 'idle';
const WALK_STATE = 'walk';
const DIE_STATE = 'die';

export default class Unit extends Entity {
    constructor (description) {
        description.type = Entity.UNIT;
        description.directions = 8;
        super(description);

        this._state = description.state === undefined ? Unit.IDLE : description.state;
    
        this._stateTick = 0;
        this._currentStateTicks = 1;
        
        this._targetPosition = null;
        this._targetPositionInPixels = null;
        
        this._speed = description.moveSpeed === undefined ? 0 : description.moveSpeed; // 1, 2, 4, 8, 16, 32
        
        this._order = null;
        this._orderDetails = null;

        this._path = null;
        this._movePointId = 0;

        this.lastMovementX = 0;
        this.lastMovementY = 0;

    }

    get state () {
        return this._state;
    }

    set state (state) {

        const oldState = this._state;
        this._state = state;

        if (oldState !== state && this._view) {
            this._view.stateChanged();
        }
    }

    get stateTick () {
        return this._stateTick;
    }
    
    acceptOrder (order, orderDetails) {

        this._order = order;
        this._orderDetails = orderDetails;
        
        switch (order) {
            case 'move':
                this.moveTo(orderDetails.position);
                break;
            
            default:
                console.log(`Unknown order: ${JSON.stringify(order)}`);
                console.trace();
                break;
        }
    }
    
    processOrders () {
        if (!this._order) {
            return;
        }
        switch (this._order) {
            case 'move':
                this.moveTo(this._orderDetails.position);
                break;
        }
        
    }
    
    moveTo (targetPosition) {
        this.state = Unit.WALK;
        this.targetPosition = targetPosition;
        this.lastMovementX = 0;
        this.lastMovementY = 0;
        
        
        // let sourcePosition = {
        //     x: this.position.x,
        //     y: this.position.y
        // };
        
        
        // Game.instance().findPath(sourcePosition, destinationPosition, (path) => {
        //     // console.log("SEARCH DONE WITH PATH: " + JSON.stringify(path));
        //
        //     this._path = path;
        //     if (path !== null && path.length > 0) {
        //         this.state = Unit.WALK;
        //         this._movePointId = 0;
        //     }
        // });
    }

    
    live (dt) {

        switch (this._state) {
            case Unit.WALK:
    
                let dx = this.targetPosition.x - this.position.x,
                    dy = this.targetPosition.y - this.position.y;

                dx = (Math.abs(dx) < 0.01) ? 0 : dx;
                dy = (Math.abs(dy) < 0.01) ? 0 : dy;

                const speedX = dx !== 0 ? Math.sign(dx) * this._speed : 0,
                      speedY = dy !== 0 ? Math.sign(dy) * this._speed : 0;

                this.lastMovementX = speedX * dt;
                this.lastMovementY = speedY * dt;
    
                this.position.x += this.lastMovementX;
                this.position.y += this.lastMovementY;
                

                if (Math.abs(this.position.x - this.targetPosition.x) < 0.01 &&
                    Math.abs(this.position.y - this.targetPosition.y) < 0.01) {
                    this.position.x = this.targetPosition.x;
                    this.position.y = this.targetPosition.y;
                    this.state = Unit.IDLE;
                    this.lastMovementX = 0;
                    this.lastMovementY = 0;
                }
               
/*
                const targetPosition = this._path[this._movePointId]; // cells
                const targetPositionInPixels = {x: (targetPosition.x + 0.5) * CELL_SIZE,
                                                y: (targetPosition.y + 0.5) * CELL_SIZE};

                let newDirection = utils.findAngle(this.position, targetPositionInPixels, this.directions);

                // Calculate turn amount for new direction
                var difference = utils.angleDiff(this.direction, newDirection, this.directions);

                this.direction = newDirection | 0;


                // 0.5 to enter middle of the cell
                let dx = targetPositionInPixels.x - this.position.x,
                    dy = targetPositionInPixels.y - this.position.y;
                
                let speedX = Math.round(Math.sign(dx) * this._speed),
                    speedY = Math.round(Math.sign(dy) * this._speed);
                
                let position = this.position;
                position.x += speedX;
                position.y += speedY;
    
                this.position = position;

                if (Math.abs(this.position.x - targetPositionInPixels.x) < 0.1 &&
                    Math.abs(this.position.y - targetPositionInPixels.y) < 0.1) {
                    this.position = targetPositionInPixels;

                    this._movePointId++;
                    if (this._movePointId >= this._path.length) {
                        this.state = Unit.IDLE;
                    }
                }
*/
                break;
        
            default:
                break;
        }

        super.live(dt);
    }
}

Unit.IDLE = IDLE_STATE;
Unit.WALK = WALK_STATE;
Unit.DIE = DIE_STATE;