import Unit from './unit';

export default class Game {
    constructor(levelInfo, players, playerColor) {

        this.levelInfo = levelInfo;
        
        this.teams = [];
        this.units = [];
        this.player = playerColor; // от чьего лица совершаются действия (важно на клиенте)
        this.networkId = null;
        this.selectedUnits = [];

        for (let i = 0; i < players.length; i++) {
            let player = players[i];

             this.teams.push(player.color); // TODO: пока просто идентификатор, а нужно объект в котором будет вестись учет всего всего

            if (player.color === playerColor) {
                this.networkId = i;
           }
        }
        
        for (let entity of levelInfo.startConditions) {
            this.createEntity(entity.type, entity.position, entity.team);
        }
    }

    createEntity (typeID, position, team) {
        
        let entity = null;
        
        switch(typeID) {
            case 'unit':
                entity = new Unit({
                    position: position,
                    size: {w: 32, h: 32},
                    moveSpeed: 1
                });
                
                this.units.push(entity);
                entity.joinToTeam(team);
                return entity;
        }
    }

    getEntity (uid) {
        for (let i = 0; i < this.units.length; i++) {
            if (this.units[i].uid === uid) {
                return this.units[i];
            }
        }

        return null;
    }

    
    eachEntity (cb) {
        for (let entity of this.units) {
            cb(entity);
        }
    }
    
    update (dt) {
        for (let i = 0; i < this.units.length; i++) {
            let unit = this.units[i];
            unit.processOrders();
        }
    
        const toBeRemoved = [];
        
        for (let i = 0; i < this.units.length; i++) {
            let unit = this.units[i];
            unit.live(dt);

            if (unit.state === Unit.DIE) {
                toBeRemoved.push(i);
            }
        }
        
        for (let i in toBeRemoved) {
            let unit = this.units[i];
            unit.unlinkFromView();
            this.units.splice(i, 1);
        }
    }
    
    sendCommand (uids, command) {
        console.log('should be overridden');
    }

    processCommands (commands) {
        for (let i = 0; i < commands.length; i++) {

            const command = commands[i].command;
            const uids = commands[i].uids;

            if (uids !== null && uids !== undefined) {
                for (let j = 0; j < uids.length; j++) {
                    const entity = this.getEntity(uids[j]);
                    if (entity) {
                        entity.acceptOrder(command, commands[i].details);
                    }
                    else {
                        console.error('ENTITY NOT FOUND');
                    }
                }
            }
        }
    }
}

Game.CELL_SIZE = 32;