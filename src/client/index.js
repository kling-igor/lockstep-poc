// var socket = io('http://localhost:8080');

import ClientGame from './client-game'

import GameController from './game-controller'

import GameView from './game-view'

// модель игры
let game = null

// контроллер игры
let gameController = null

// графическое представление игры
let gameView = null

// PIXI renderer
let renderer = null

let socket = io()

let playerNickname = null

// описание игры (назваие комнаты и файл уровня который нужно загрузить)
let gameInfo = null

// цвет, выбранный игроком
let color = null

/**
 * Создание игры (связки модели, вида и контроллера)
 * */
function createGame(players) {
  const multiplayerGameInfo = getMultiplayerGameInfo()
  console.log('GAME INFO:', multiplayerGameInfo)
  game = new ClientGame(multiplayerGameInfo, players, color)
  gameView = new GameView(game, renderer)
  gameController = new GameController(game, gameView, socket, gameInfo.gameName)
  gameView.delegate = gameController
}

function showWarning(message) {
  $('#warningMessage').text(message)
  $('#warningBanner').prop('hidden', false)
}

function hideWarningMessage() {
  $('#warningBanner').prop('hidden', true)
}

function linkSocketEvents() {
  /**
   * обрабочитк отключения от сервера
   * */
  socket.on('disconnect', function () {
    showWarning('Server connection is lost...')
  })

  /**
   * обрабочитк восстановления подключения к серверу
   * */
  socket.on('reconnect', function () {
    hideWarningMessage()
  })

  /**
   * обаработчик события поступления сообщения в общем чате игры
   * */
  socket.on('lobbyChatMessage', function (msg) {
    $('#lobbyMessages').append($('<li>').text(msg))
  })

  /**
   * обработчик события обновления состава комнат для отображения его лобби игры
   * */
  socket.on('roomsUpdated', function (rooms) {
    $('#gameList').empty()

    console.log(JSON.stringify(rooms))

    for (let i = 0; i < rooms.length; ++i) {
      const room = rooms[i]
      const gameName = room.gameInfo.gameName
      const gameCapacity = room.gameInfo.capacity
      const playersCount = room.players.length
      const optionDisabled = playersCount >= gameCapacity ? 'disabled' : ''

      if (!room.inGame) {
        $('#gameList').append(
          $(
            `<option value="${gameName}" ${optionDisabled}>${gameName} (players: ${playersCount}/${gameCapacity})</option>`
          )
        )
      }
    }
  })

  /**
   * обаработчик события поступления сообщения в чате комнаты
   * */
  socket.on('gameLobbyChatMessage', function (msg) {
    $('#gameLobbyMessages').append($('<li>').text(msg))
  })

  /**
   * обаработчик события изменения состава участников комнаты
   * */
  socket.on('usersUpdated', function (users) {
    $('#startGameButton').prop('disabled', users.length < 2)
  })

  /**
   * переход в ожидание начала игры
   * */
  socket.on('waitForGameStart', function () {
    // показываем таймер 5 сек
    countDown(5)
  })

  /**
   * игра началась - клиенты загружают игру и в дальнейшем поток управления со стороны клиета
   * переходит под управлением игрового контроллера
   * */
  socket.on('gameStart', function (players) {
    $('#gameLobby').hide()

    try {
      $.getScript(gameInfo.level, function () {
        PIXI.Loader.shared.add(['test_map.png']).load((loader, resources) => {
          createGame(players)
          $('#canvas').show()

          // представляемся серверу (номер игрока в комнате - для связки с соккетом на сервере для адресных сообщений)
          // вдобавок это сообщение о том что игра на клиенте загрузилась)
          socket.emit('readyToPlay', gameInfo.gameName, game.networkId)
        })
      })
    } catch (e) {
      console.log(`ERROR: ${e}`)
    }
  })

  socket.on('startPlay', function () {
    gameController.start()
  })

  /**
   * выбор игроком своего цвета
   * */
  socket.on('colorSelected', function (color, oldColor) {
    var radiobutton = $('#' + color)

    if (!radiobutton.prop('checked')) {
      radiobutton.prop('disabled', true)
    }

    if (oldColor) {
      $('#' + oldColor).prop('disabled', false)
    }
  })
}

function linkDOMEvents() {
  /**
   * Вход игрока в систему с предоставлением логина
   * */
  $('#submissionForm').submit(function () {
    const nickname = $('#nickname').val()
    if (nickname != '') {
      socket.emit('apply', nickname, function (success, error) {
        if (success) {
          $('#submission').hide()
          $('#lobby').show()

          playerNickname = nickname

          hideWarningMessage()

          return true
        } else {
          showWarning(error)
        }
      })
    }

    return false
  })

  /**
   * отправка сообщения в лобби
   * */
  $('#lobbyChatForm').submit(function () {
    const msg = $('#lobbyChatInput').val()
    if (msg == null || msg == undefined || msg == '') return

    socket.emit('lobbyChatMessage', msg)
    $('#lobbyChatInput').val('')
  })

  /**
   * переход на экран создания новой игры
   * */
  $('#createGameButton').click(function () {
    $('#lobby').hide()
    $('#createGame').show()
  })

  /**
   * уведомление серврера о создание новой игры
   * */
  $('#createGameForm').submit(function () {
    const gameName = $('#gamename').val()
    if (gameName != '') {
      gameInfo = {
        gameName: gameName,
        capacity: 2, // максимальное кол-во игроков
        level: '/levels/level_1.js',
      }
      // TODO: файл уровня как бы был выбран из списка!!!

      socket.emit('createGame', gameInfo, function (success, error) {
        if (success) {
          $('#createGame').hide()
          $('#gameLobby').show()

          color = 'red'
          // создатель игры по умолчанию выбирает красный (также определено на серврере)
          $('#' + color).prop('checked', true)

          $('#backCountTimer').text('')
        } else {
          console.log(error)

          gameInfo = null
        }
      })
    }

    return false
  })

  /**
   * присоединение к игровой комнате
   * */
  $('#joinGameButton').click(function () {
    const selectedGame = $('#gameList option:selected')

    const gameName = selectedGame.val()

    console.log('JOIN GAME: ' + gameName + ' val = ' + selectedGame.text())

    socket.emit('joinGame', gameName, function (_gameInfo, _players, error) {
      if (error) {
        showWarning(error)
      } else {
        $('#lobby').hide()
        $('#gameLobby').show()

        // get rid of old messages
        $('#gameMessages').empty()

        $('#backCountTimer').text('')

        gameInfo = _gameInfo

        console.log(JSON.stringify(_players))

        // отключаем все кнопки которые были выбраны ранее
        for (let i = 0; i < _players.length; i++) {
          if (_players[i].nick !== playerNickname && _players[i].color) {
            console.log(`Disabling '${_players[i].color} button'`)
            $('#' + _players[i].color).prop('disabled', true)
          }
        }

        const colors = ['red', 'blue', 'green']

        for (let i = 0; i < colors.length; ++i) {
          const _color = colors[i]
          if (!$('#' + _color).prop('disabled')) {
            $('#' + _color).prop('checked', true)
            color = _color
            console.log('COLOR ' + color)
            socket.emit('colorSelected', gameInfo.gameName, color)
            break
          }
        }
      }
    })
  })

  /**
   * активирование кнопки JOIN как только выбрана любая игровая комната
   * */
  $('#gameList').change(function () {
    console.log(`selected option ${$(this).val()}`)
    $('#joinGameButton').prop('disabled', false)
  })

  /**
   * отправка сообщения внутри игровой комнаты
   * */
  $('#gamelobbyChatForm').submit(function () {
    const msg = $('#gameLobbyMessage').val()
    if (msg == null || msg == undefined || msg == '') return

    socket.emit('gameLobbyChatMessage', { room: gameInfo.gameName, message: msg })
    $('#gameLobbyMessage').val('')
  })

  /**
   * выход из игровой комнаты
   * */
  $('#leaveGameButton').click(function () {
    socket.emit('gameLobbyLeave', gameInfo.gameName, function (success) {
      if (success) {
        $('#lobby').show()
        $('#gameLobby').hide()
        gameInfo = null
      } else {
        console.log(error)
      }
    })
  })

  // запуск игры (всем приготовиться)
  $('#startGameButton').click(function () {
    $('#startGameButton').prop('disabled', true)

    // уведомляем сервер что начинает игру
    socket.emit('startGame', gameInfo.gameName)
  })

  // выбор цвета игрока
  $('input[type=radio][name=sideSelect]').change(function () {
    socket.emit('colorSelected', gameInfo.gameName, this.value, color)

    color = this.value
  })

  $(window).on('load', function () {
    renderer = PIXI.autoDetectRenderer({
      width: 1024,
      height: 768,
      view: $('#canvas')[0],
      antialias: false,
      transparent: false,
      resolution: 1,
    })

    $(document)[0].oncontextmenu = function () {
      return false
    }

    $('#submission').show()
    /*
        color = 'blue';
        let players =[
            {
                nick:'1',
                color:'red'},
            {
                nick:'2',
                color:'blue'
            }];
        
        $.getScript('/levels/level_1.js', function () {
            PIXI.loader
                .add([
                    'test_map.png',
                ])
                .load((loader, resources) => {

                    createGame(players);
                    $('#canvas').show();
                    gameController.start();
                });
        });
     //*/
  })
}

// счетчик времени перез запуском игры
function countDown(time) {
  $('#backCountTimer').text('Game will start in ' + time + ' sec.')

  var counter = setInterval(timer, 1000)
  function timer() {
    time -= 1
    if (time <= 0) {
      clearInterval(counter)
      $('#backCountTimer').text('Start!')
      return
    }
    $('#backCountTimer').text('Game will start in ' + time + ' sec.')
  }
}

linkSocketEvents()

linkDOMEvents()
