function getMultiplayerGameInfo() {
    return {
        map: 'level1.tmx',
        players: ['red', 'blue'],
        startConditions: [
            {
                type:'unit',
                team: 'red',
                position: {x:10, y:20}
            },
            {
                type:'unit',
                team: 'blue',
                position: {x:20, y:10}
            },
        ]
    };
}