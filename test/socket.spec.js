const assert = require('assert'),
      sinon = require('sinon'),
      chai = require('chai').use(require('sinon-chai')),
      expect = chai.expect,
      should = chai.should();

import {LockStepManager}  from './lockstep-manager';
import {Networker} from './networker'

const PORT = 8000,
      io = require('socket.io-client'),
      io_server = require('socket.io').listen(PORT);

const options = {
    'reconnection delay': 0,
    'reopen delay': 0,
    'force new connection': true,
    'transports': ['websocket']
};

const NUMBER_OF_PLAYERS = 2;

const gameUpdate = function (dt) {
    // console.log('GAME UPDATE WITH ' + dt);
};

const processActions = function (actions) {
    for (let i = 0; i < actions.length; ++i) {
        const action = actions[i];
        // action.ProcessAction();
        console.log('PROCESSING ACTION:' + action);
    }
};

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}


describe('Suite of unit tests', () => {

    let clientSideSocket1, clientSideSocket2;
    let client1LSM, client2LSM;

    const clients = {};
    const room = 'room';

    const handlers = {
        disconnect: socket => {

        },

        clientID: (socket, id) => {
            clients[socket.id] = id;
        },

        sendAction: (socket, action, lockStepTurnID, playerID) => {
            socket.to(room).broadcast.emit('receiveAction', action, lockStepTurnID, playerID);
        },

        confirmAction: (socket, lockStepTurn, confirmingPlayerID, confirmedPlayerID) => {

            // получатель confirmedPlayerID

            let receiver = null;

            for (let key in clients) {
                if (clients[key] === confirmedPlayerID) {
                    receiver = key;
                    break;
                }
            }


            // console.log(JSON.stringify(clients));


            if (receiver) {
                // console.log('RECEIVER: ' + receiver);
                socket.to(receiver).emit('confirmAction', lockStepTurn, confirmingPlayerID);
            }

            // socket.to(room).broadcast.emit('confirmAction', lockStepTurn, confirmingPlayerID);
        }
    };




    beforeEach(done => {

        io_server.on('connection', socket => {
            console.log('CLIENT CONNECTED ' + socket.id);

            // clients[socket.id] = null;
            socket.join(room);

            for (let eventName in handlers) {
                socket.on(eventName, handlers[eventName].bind(null, socket))
            }
        });

        // Setup client socket
        clientSideSocket1 = io.connect(`http://localhost:${PORT}`, options);
        clientSideSocket2 = io.connect(`http://localhost:${PORT}`, options);

        client1LSM = new LockStepManager(0, NUMBER_OF_PLAYERS);
        client2LSM = new LockStepManager(1, NUMBER_OF_PLAYERS);

        client1LSM.setNetworker(new Networker(clientSideSocket1));
        client2LSM.setNetworker(new Networker(clientSideSocket2));


        let p1 = new Promise((resolve, reject) => {
            clientSideSocket1.on('connect', () => {
                console.log('[1] connected to server...');

                clientSideSocket1.emit('clientID', client1LSM.playerID);
                resolve();
            });
        });



        clientSideSocket1.on('disconnect', () => {
            console.log('[1] disconnected from server...');
        });

        let p2 = new Promise((resolve, reject) => {
            clientSideSocket2.on('connect', () => {
                console.log('[2] connected to server...');

                clientSideSocket2.emit('clientID', client2LSM.playerID);
                resolve();
            });
        });

        clientSideSocket2.on('disconnect', () => {
            console.log('[2] disconnected from server...');
        });

        Promise.all([p1, p2]).then(() => {
            done();
        });
    });

    afterEach(done => {
        // Cleanup
        if (clientSideSocket1.connected) {
            clientSideSocket1.disconnect();
        }

        if (clientSideSocket2.connected) {
            clientSideSocket2.disconnect();
        }

        io_server.close();

        done();
    });

    describe('First test', () => {

        it(' is first test', done => {

            client1LSM.addAction('TEST_ACTION');

            sleep(100)
                .then(() => {
                    console.log('CALL 1');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 2');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 3');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 4');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 5');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 6');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 7');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 8');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 9');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    return sleep(100);
                })
                .then(() => {
                    console.log('CALL 10');

                    client1LSM.update(0.1, gameUpdate, processActions);
                    client2LSM.update(0.1, gameUpdate, processActions);

                    // return sleep(200);
                    expect(true).to.be.true;
                    done();
                });
                // })
                // .then(() => {
                //     expect(true).to.be.true;
                //     done();
                // });

        });
    });
});