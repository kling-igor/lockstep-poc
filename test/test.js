// var events = require('events');

import {LockStepManager}  from './lockstep-manager';

const PORT = 8000,
    io = require('socket.io-client'),
    io_server = require('socket.io').listen(PORT);

const clients = {};
const room = 'room';

const handlers = {
    disconnect: (socket) => {

    },

    sendAction: (socket, action, lockStepTurnID, playerID) => {
        console.log('DEBUG SEND ACTION!!!');

        io.to(room).emit('receiveAction', action, lockStepTurnID, playerID);
    }
};

io_server.on('connection', (socket) => {
    console.log('CLIENT CONNECTED ' + socket.id);

    clients[socket.id] = socket.id;
    socket.join(room);

    for (let eventName in handlers) {
        socket.on(eventName, handlers[eventName].bind(null, socket))
    }
});

const options = {
    'reconnection delay': 0,
    'reopen delay': 0,
    'force new connection': true,
    'transports': ['websocket']
};


const clientSideSocket1 = io.connect(`http://localhost:${PORT}`, options);
const clientSideSocket2 = io.connect(`http://localhost:${PORT}`, options);

const NUMBER_OF_PLAYERS = 2;
// let serverLSM = new LockStepManager(0, NUMBER_OF_PLAYERS);
let client1LSM = new LockStepManager(1, NUMBER_OF_PLAYERS);
let client2LSM = new LockStepManager(2, NUMBER_OF_PLAYERS);

// const serverSocket = new events.EventEmitter();
// const dummySocket1 = new events.EventEmitter();
// const dummySocket2 = new events.EventEmitter();

/*
dummySocket1.on('sendAction', (action, lockStepTurnID, playerID) => {
    serverSocket.emit('receiveAction', action, lockStepTurnID, playerID);
});

dummySocket2.on('sendAction', (action, lockStepTurnID, playerID) => {
    serverSocket.emit('receiveAction', action, lockStepTurnID, playerID);
});

dummySocket1.on('confirmActionServer', (lockStepTurn, confirmingPlayerID) => {
    serverSocket.emit('confirmActionServer', lockStepTurn, confirmingPlayerID);
});

dummySocket2.on('confirmActionServer', (lockStepTurn, confirmingPlayerID) => {
    serverSocket.emit('confirmActionServer', lockStepTurn, confirmingPlayerID);
});
*/
class Networker {
    constructor (socket) {
        this.socket = socket;
    }
    
    sendAction(action, lockStepTurnID, playerID, ) {
        console.log('SEND ACTION:' + action);
        this.socket.emit('sendAction', action, lockStepTurnID, playerID);
    }

    confirmAction(lockStepTurn, confirmingPlayerID, confirmedPlayerID) {
        this.socket.emit('confirmActionServer', lockStepTurn, confirmingPlayerID); // получатель - confirmedPlayerID
    }

    setLockStepManager (lsm) {
        this.socket.on('receiveAction', (action, lockStepTurn, playerID) => {
            console.log('RECEIVED ACTION: ' + JSON.stringify(action));
            lsm.receiveAction(action, lockStepTurn, playerID);
        });

        // this.socket.on('confirmAction', (lockStepTurn, confirmingPlayerID) => {
        //     lsm.confirmAction(lockStepTurn, confirmingPlayerID);
        // });
    }
}

// serverLSM.setNetworker(new Networker(serverSocket));
client1LSM.setNetworker(new Networker(clientSideSocket1));
client2LSM.setNetworker(new Networker(clientSideSocket2));


const gameUpdate = function (dt) {
    // console.log('GAME UPDATE WITH ' + dt);
};


// console.log('------------ 0 ---------------');
//
// client1LSM.addAction('TEST_ACTION');
//
// client1LSM.update(0.2, gameUpdate);
// client2LSM.update(0.2, gameUpdate);
//
// client1LSM.dump();
// console.log('');
// client2LSM.dump();
//
// console.log('------------ 1 ---------------');
// // dummySocket1.emit('receiveAction', 1/*lockStepTurnID*/, 0/*networkPlayerID*/, {msg:'test'});
//
// client1LSM.addAction('TEST_ACTION');
// client1LSM.update(0.2, gameUpdate);
// client2LSM.update(0.2, gameUpdate);
//
// client1LSM.dump();
// console.log('');
// client2LSM.dump();
//
// console.log('------------ 2 ---------------');
// client1LSM.update(0.2, gameUpdate);
// client2LSM.update(0.2, gameUpdate);
//
// client1LSM.dump();
// console.log('');
// client2LSM.dump();
//
// console.log('------------ 3 ---------------');
// client1LSM.update(0.2, gameUpdate);
// client2LSM.update(0.2, gameUpdate);
//
// client1LSM.dump();
// console.log('');
// client2LSM.dump();
//
// console.log('------------ 4 ---------------');
// client1LSM.update(0.2, gameUpdate);
// client2LSM.update(0.2, gameUpdate);
//
// client1LSM.dump();
// console.log('');
// client2LSM.dump();





if (clientSideSocket1.connected) {
    clientSideSocket1.disconnect();
}

if (clientSideSocket2.connected) {
    clientSideSocket2.disconnect();
}

io_server.close();


