const vm = require('vm');
const fs = require('fs');

import ServerGame from './server-game';

const express = require('express');

const app = express();

const server = require('http').Server(app);
server.listen(8080);

const io = require('socket.io')(server);

app.use(express.static(__dirname + '/'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});




// const data = fs.readFileSync(__dirname + '/levels/level_1.js');
// vm.runInThisContext(data);
// var gameInfo = getMultiplayerGameInfo();
// console.log('GAME INFO:', gameInfo);



/* room object
{
    gameInfo: {
        gameName:'a string',
        level:'/levels/level_1.js',
        capacity: Number
    },
    players:[
        {
            nick:'nickname',
            color:'color'
        },
    {...},
    ],
    owner:'owner nickname'
    inGame: Bool
}
*/
const rooms = [];
const users = [];
const games = {};

function getUserNick (socketId) {
    for (let i = 0; i < users.length; i++){
        if (users[i].id === socketId) {
            return users[i].nick;
        }
    }
    
    return 'anonymous';
}

function getUserId (nickname) {
    for (let i = 0; i < users.length; i++){
        if (users[i].nick === nickname) {
            return users[i].id;
        }
    }
    
    return null;
}

function getRoom (gameName) {
    for (const room of rooms) {
        if (room.gameInfo.gameName === gameName) {
            return room;
        }
    }

    return null;
}

function createGame (gameName, level, players) {

    const data = fs.readFileSync(__dirname + level);
    vm.runInThisContext(data);

    var gameInfo = getMultiplayerGameInfo();
    console.log('GAME INFO:', gameInfo);

    const game = {
        game: new ServerGame(gameInfo, players),
        clients:{},
        PLAYERS_COUNT: players.length
    };

    games[gameName] = game;
}

const handlers = {
    disconnect: (socket) => {
        
        let roomsChanged = false;
        
        for (let i = 0; i < users.length; i++){
        
            const user = users[i];
            let newOwner = null;
    
            if (user.id === socket.id) {
    
                console.log(`user '${user.nick}' has been disconnected`);
                
                let k = rooms.length;
                while (k--) {
                    const room = rooms[k];
   
                    for (let j = 0; j < room.players.length; ++j) {
                        if (room.players[j].nick == user.nick) {
                            room.players.splice(j, 1);
                            roomsChanged = true;
    
                            io.to(room.gameInfo.gameName).emit('gameLobbyChatMessage', `<${user.nick}> has left the game`);
                            
                            if (room.players.length == 0) {
                                console.log(`Game "${room.gameInfo.gameName}" has no players and should be deleted !!!`);
                                rooms.splice(k, 1);
                                roomsChanged = true;
                            }
                            else {
                                // если комнату покинул содатель и в комнает кто-то остался то первому попавшемуся передаем права создателя
                                if (room.owner === user.nick) {
                                    newOwner = room.players[0];
                                    room.owner = newOwner;
                                }
                            }
            
                            break;
                        }
                    }
                }
                
                users.splice(i, 1);
                break;
            }
        }
    
        if (roomsChanged) {
            io.emit('roomsUpdated', rooms);
        }
        
        
        // ищем в играх
    
        // games[gameName].clients[socket.id] = id;
        
        for (let gameName in games) {
            let game = games[gameName];
            let id = game.clients[socket.id];
            if (id !== undefined) {
    
                io.to(gameName).emit('dropUser', id);
                delete game.clients[socket.id];
                break;
            }
        }
        
        // тут обычно отсылают всем обновленный список пользователей
    },

    // обработчики в состоянии нахождения в лобби

    apply: (socket, nickname, callback) => {
        console.log('A new client submitted with nick:' + nickname);
    
        // looking for existent user
        for (let i = 0; i < users.length; i++) {
            if (users[i].nickname === nickname) {
                
                console.log(`User '${nickname}' exists!!!`);
                
                try {
                    callback(false, `User with nickname '${nickname}' already exists. Try another name.`);
                }
                catch (e) {
                    console.log('erroneous callback');
                }
                
                return;
            }
        }
        
        // add a new user
        users.push({
            id: socket.id,
            nick: nickname
        });
    
        try {
            callback(true);
        }
        catch (e) {
            console.log('erroneous callback');
        }
    
        // тут обычно отсылают всем обновленный список пользователей
    
        socket.emit('roomsUpdated', rooms);
    },
    
    lobbyChatMessage: (socket, msg) => {
        io.emit('lobbyChatMessage', `<${getUserNick(socket.id)}>: ${msg}`);
    },
    
    createGame: (socket, gameInfo, callback) => {

        console.log(`CREATING GAME WITH INFO: ${JSON.stringify(gameInfo)}`);

        if (gameInfo.gameName === null || gameInfo.gameName === undefined) {
            callback(false, `Invalid gamename`);
            return;
        }

        // looking for existent rooms
        const room = getRoom(gameInfo.gameName);

        if (room) {
            try {
                callback(false, `Game with ${gameInfo.gameName} already exists.`);
            }
            catch (e) {
                console.log('erroneous callback');
            }

            return;
        }

        const owner = getUserNick(socket.id);
        
        // add a new room
        rooms.push({
            gameInfo:gameInfo,
            players:[
                {
                    nick:owner,
                    color:'red'
                }
            ],
            owner:owner});

        io.emit('roomsUpdated', rooms);
    
        socket.join(gameInfo.gameName);

        try {
            callback(true);
        }
        catch (e) {
            console.log('erroneous callback');
        }
    },
    
    joinGame: (socket, gameName, callback) => {
        for (let i = 0; i < rooms.length; i++){
            const room = rooms[i];

            if (room.gameInfo.gameName === gameName) {
                try {
                    callback(room.gameInfo, room.players);
                    
                    room.players.push({
                        nick:getUserNick(socket.id),
                        color:undefined
                    });
                    
                    socket.join(gameName);
                    
                    io.emit('roomsUpdated', rooms);

                    const ownerId = getUserId(room.owner);
                    if (ownerId) {
                        socket.to(ownerId).emit('usersUpdated', room.players);
                    }
                }
                catch (e) {
                    console.log('erroneous callback');
                }
                return;
            }
        }
    
        try {
            callback(null, null, `Game with ${gameName} doesn't exist.`);
        }
        catch (e) {
            console.log('erroneous callback');
        }
    },

    // обработчики в сосотоянии нахождения в игровой комнате

    gameLobbyChatMessage: (socket, data) => {
        io.to(data.room).emit('gameLobbyChatMessage', `<${getUserNick(socket.id)}>: ${data.message}`);
    },
    
    gameLobbyLeave: (socket, gameName, callback) => {
    
        // TODO: нужно различать когда игрок покидает лобби, лобби игры, или игру (особенно в disconnect чтобы знать куда слать уведомления)
   
        for (let i = 0; i < rooms.length; i++){
        
            const room = rooms[i];
            
            if (room.gameInfo.gameName === gameName) {
                socket.leave(gameName);
            
                const nick = getUserNick(socket.id);
                
                console.log(`User '${nick}' leaving the room '${gameName}'`);
                
                let newOwner = null;
            
                for (let j = 0; j < room.players.length; ++j) {
                    if (room.players[j].nick == nick) {
                        room.players.splice(j, 1);
    
                        if (room.players.length == 0) {
                            console.log(`Game "${room.gameName}" has no players and should be deleted !!!`);
                            rooms.splice(i, 1);
                        }
                        else {
                            // если комнату покинул содатель и в комнает кто-то остался то первому попавшемуся передаем права создателся
                            if (room.owner === nick) {
                                newOwner = room.players[0];
                                room.owner = newOwner;
                            }
                        }
    
                        io.emit('roomsUpdated', rooms);
                        
                        break;
                    }
                }
            
                try {
                    callback(true);
                }
                catch (e) {
                    console.log('erroneous callback');
                }
            
                io.to(gameName).emit('gameLobbyChatMessage', `<${getUserNick(socket.id)}> has left the game`);
                if (newOwner) {
                    io.to(gameName).emit('gameLobbyChatMessage', `<${newOwner}> now is room master`);
                    const ownerId = getUserId(room.owner);
                    if (ownerId) {
                        socket.to(ownerId).emit('usersUpdated', room.players);
                    }
                }
                
                return;
            }
        }
    
        try {
            callback(false, `Game with ${gameName} doesn't exist.`);
        }
        catch (e) {
            console.log('erroneous callback');
        }
    },
    
    startGame: (socket, gameName) => {
        io.to(gameName).emit('waitForGameStart');
        
        setTimeout(() => {
           
            for (let i = 0; i < rooms.length; i++) {
                
                const room = rooms[i];
                
                if (room.gameInfo.gameName === gameName) {
                    io.to(gameName).emit('gameStart', room.players);
    
                    createGame(gameName, room.gameInfo.level, room.players);
    
                    room.inGame = true; // помечаем комнату чтобы она удалилась в списках
    
                    io.emit('roomsUpdated', rooms);
                    return;
                }
            }
        }, 5500);
    },
    
    colorSelected: (socket, gameName, color, oldColor) => {
        // сообщаем участникам что была выбран цвет одной из сторон
        io.to(gameName).emit('colorSelected', color, oldColor);
    
        const room = getRoom(gameName);
        if (room) {
    
            const nick = getUserNick(socket.id);
            
            console.log(`User [${nick}] select '${color}' color`);
            
            for (let i = 0; i < room.players.length; i++) {
                if (room.players[i].nick === nick) {
                    room.players[i].color = color;
                    
                    io.to(gameName).emit('gameLobbyChatMessage', `Player '${getUserNick(socket.id)}' select '${color}' side`);
                    break;
                }
            }
        }
    },

    // обработчики в состоянии игры

    readyToPlay: (socket, gameName, id) => {
        games[gameName].clients[socket.id] = id;

        if (Object.keys(games[gameName].clients).length === games[gameName].PLAYERS_COUNT) {
            io.to(gameName).emit('startPlay');
        }
    },

    sendCommand: (socket, gameName, command, lockStepTurnID, playerID) => {

        // console.log(gameName + ': SEND COMMAND ' + JSON.stringify(command));

        socket.to(gameName).broadcast.emit('receiveCommand', command, lockStepTurnID, playerID);
    },

    confirmCommand: (socket, gameName, lockStepTurn, confirmingPlayerID, confirmedPlayerID) => {
        // получатель confirmedPlayerID
        let receiver = null;

        for (let key in games[gameName].clients) {
            if (games[gameName].clients[key] === confirmedPlayerID) {
                receiver = key;
                break;
            }
        }

        if (receiver) {
            socket.to(receiver).emit('confirmCommand', lockStepTurn, confirmingPlayerID);
        }
    }
};

const socketHandler = (socket) => {
    console.log('CLIENT CONNECTED ' + socket.id);

    for (let eventName in handlers) {
        socket.on(eventName, handlers[eventName].bind(null, socket))
    }
};


io.on('connection', socketHandler);