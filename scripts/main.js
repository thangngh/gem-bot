// REQUEST command
const SWAP_GEM = 'Battle.SWAP_GEM';
const USE_SKILL = 'Battle.USE_SKILL';
const SURRENDER = 'Battle.SURRENDER';
const FINISH_TURN = 'Battle.FINISH_TURN';
const I_AM_READY = 'Battle.I_AM_READY';

const LOBBY_FIND_GAME = 'LOBBY_FIND_GAME';
const PLAYER_JOINED_GAME = 'PLAYER_JOINED_GAME';

// RESPONSE command
const LEAVE_ROOM = 'LEAVE_ROOM';
const START_GAME = 'START_GAME';
const END_GAME = 'END_GAME';
const START_TURN = 'START_TURN';
const END_TURN = 'END_TURN';

const ON_SWAP_GEM = 'ON_SWAP_GEM';
const ON_PLAYER_USE_SKILL = 'ON_PLAYER_USE_SKILL';

const BATTLE_MODE = 'BATTLE_MODE';

const ENEMY_PLAYER_ID = 0;
const BOT_PLAYER_ID = 2;

const delaySwapGem = 2000;
const delayFindGame = 5000;

var sfs;
var room;

var botPlayer;
var enemyPlayer;
var currentPlayerId;
var grid;

var SEA_SPIRIT_BOT;
var FIRE_SPRIT_BOT;
var SEA_GOD;

const username = 'thang.nguyenhong';
const token =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0aGFuZy5uZ3V5ZW5ob25nIiwiYXV0aCI6IlJPTEVfVVNFUiIsIkxBU1RfTE9HSU5fVElNRSI6MTY1Mjk2NzkyNDA3MCwiZXhwIjoxNjU0NzY3OTI0fQ.DOV1Q_fu0lsNY4KBgqpEpGU-dxmxUHXw4iZPobDzTIgtgQRX88NwuUC7RveQN7zbYSN414j3Vuh2K56XvO8oMw';
var visualizer = new Visualizer({ el: '#visual' });
var params = window.params;
var strategy = window.strategy;
visualizer.start();

// Connect to Game server
initConnection();

// const params = new Proxy(new URLSearchParams(window.location.search), {
// 	get: (searchParams, prop) => searchParams.get(prop),
// });

if (params.username) {
    document.querySelector('#accountIn').value = params.username;
}

function initConnection() {
    document.getElementById('log').innerHTML = '';

    trace('Connecting...');

    // Create configuration object
    var config = {};
    config.host = '172.16.100.112';
    config.port = 8080;
    // config.host = "10.10.10.18";
    // config.port = 8888;
    //config.debug = true;
    config.useSSL = false;

    // Create SmartFox client instance
    sfs = new SFS2X.SmartFox(config);

    // Set logging
    sfs.logger.level = SFS2X.LogLevel.INFO;
    sfs.logger.enableConsoleOutput = true;
    sfs.logger.enableEventDispatching = true;

    sfs.logger.addEventListener(SFS2X.LoggerEvent.DEBUG, onDebugLogged, this);
    sfs.logger.addEventListener(SFS2X.LoggerEvent.INFO, onInfoLogged, this);
    sfs.logger.addEventListener(
        SFS2X.LoggerEvent.WARNING,
        onWarningLogged,
        this,
    );
    sfs.logger.addEventListener(SFS2X.LoggerEvent.ERROR, onErrorLogged, this);

    sfs.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
    sfs.addEventListener(
        SFS2X.SFSEvent.CONNECTION_LOST,
        onConnectionLost,
        this,
    );

    sfs.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError, this);
    sfs.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin, this);

    sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, OnRoomJoin, this);
    sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, OnRoomJoinError, this);
    sfs.addEventListener(
        SFS2X.SFSEvent.EXTENSION_RESPONSE,
        OnExtensionResponse,
        this,
    );

    // Attempt connection
    sfs.connect();
}

function onDisconnectBtClick() {
    // Log message
    trace('Disconnecting...');

    // Disconnect
    sfs.disconnect();
}

//------------------------------------
// LOGGER EVENT HANDLERS
//------------------------------------

function onDebugLogged(event) {
    trace(event.message, 'DEBUG', true);
}

function onInfoLogged(event) {
    trace(event.message, 'INFO', true);
}

function onWarningLogged(event) {
    trace(event.message, 'WARN', true);
}

function onErrorLogged(event) {
    trace(event.message, 'ERROR', true);
}

//------------------------------------
// SFS EVENT HANDLERS
//------------------------------------

function onConnection(event) {
    if (event.success) {
        trace(
            'Connected to SmartFoxServer 2X!<br>SFS2X API version: ' +
                sfs.version +
                '<br> IP: ' +
                sfs.config.host,
        );
    } else {
        trace(
            'Connection failed: ' +
                (event.errorMessage
                    ? event.errorMessage + ' (' + event.errorCode + ')'
                    : 'Is the server running at all?'),
        );

        // Reset
        reset();
    }
}

function onConnectionLost(event) {
    trace('Disconnection occurred; reason is: ' + event.reason);

    reset();
}

//------------------------------------
// OTHER METHODS
//------------------------------------

function trace(message, prefix, isDebug) {
    var text = document.getElementById('log').innerHTML;

    var open =
        '<div' +
        (isDebug ? " class='debug'" : '') +
        '>' +
        (prefix ? '<strong>[SFS2X ' + prefix + ']</strong><br>' : '');
    var close = '</div>';

    if (isDebug)
        message =
            '<pre>' + message.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</pre>';

    const log = text + open + message + close;
    document.getElementById('log').innerHTML = log;
    visualizer.log(log);
}

function reset() {
    // Remove SFS2X listeners
    sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
    sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);

    sfs.logger.removeEventListener(SFS2X.LoggerEvent.DEBUG, onDebugLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.INFO, onInfoLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.WARNING, onWarningLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.ERROR, onErrorLogged);

    sfs = null;
}

function onLoginBtnClick() {
    let uName = username || document.querySelector('#accountIn').value;
    trace('Try login as ' + uName);

    let data = new SFS2X.SFSObject();
    data.putUtfString('BATTLE_MODE', 'NORMAL');
    data.putUtfString('ID_TOKEN', token);
    data.putUtfString('NICK_NAME', uName);

    var isSent = sfs.send(new SFS2X.LoginRequest(uName, '', data, 'gmm'));

    if (isSent) trace('Sent');
}

function onLoginError(event) {
    var error =
        'Login error: ' +
        event.errorMessage +
        ' (code ' +
        event.errorCode +
        ')';
    trace(error);
}

function onLogin(event) {
    trace(
        'Login successful!' +
            '\n\tZone: ' +
            event.zone +
            '\n\tUser: ' +
            event.user,
    );

    document.getElementById('loginBtn').style.visibility = 'hidden';
    document.getElementById('findBtn').style.visibility = 'visible';
}

function findGame() {
    var data = new SFS2X.SFSObject();
    data.putUtfString('type', '');
    data.putUtfString('adventureId', '');
    sfs.send(new SFS2X.ExtensionRequest('LOBBY_FIND_GAME', data));
}

function OnRoomJoin(event) {
    trace('OnRoomJoin ' + event.room.name);

    room = event.room;
}

function OnRoomJoinError(event) {
    trace('OnRoomJoinError');
    console.error(event);
}

function OnExtensionResponse(event) {
    let evtParam = event.params;
    var cmd = event.cmd;
    trace('OnExtensionResponse ' + cmd);

    switch (cmd) {
        case 'START_GAME':
            let gameSession = evtParam.getSFSObject('gameSession');
            StartGame(gameSession, room);
            break;
        case 'END_GAME':
            EndGame();
            break;
        case 'START_TURN':
            StartTurn(evtParam);
            break;
        case 'ON_SWAP_GEM':
            SwapGem(evtParam);
            break;
        case 'ON_PLAYER_USE_SKILL':
            HandleGems(evtParam);
            break;
        case 'PLAYER_JOINED_GAME':
            sfs.send(
                new SFS2X.ExtensionRequest(
                    I_AM_READY,
                    new SFS2X.SFSObject(),
                    room,
                ),
            );
            break;
    }
}

function StartGame(gameSession, room) {
    // Assign Bot player & enemy player
    AssignPlayers(room);

    // Player & Heroes
    let objBotPlayer = gameSession.getSFSObject(botPlayer.displayName);
    let objEnemyPlayer = gameSession.getSFSObject(enemyPlayer.displayName);

    let botPlayerHero = objBotPlayer.getSFSArray('heroes');
    let enemyPlayerHero = objEnemyPlayer.getSFSArray('heroes');

    for (let i = 0; i < botPlayerHero.size(); i++) {
        botPlayer.heroes.push(new Hero(botPlayerHero.getSFSObject(i)));
    }

    for (let i = 0; i < enemyPlayerHero.size(); i++) {
        enemyPlayer.heroes.push(new Hero(enemyPlayerHero.getSFSObject(i)));
    }

    // Gems
    grid = new Grid(
        gameSession.getSFSArray('gems'),
        null,
        botPlayer.getRecommendGemType(),
    );
    currentPlayerId = gameSession.getInt('currentPlayerId');
    trace('StartGame ');

    // log("grid :" , grid);

    // SendFinishTurn(true);
    //taskScheduler.schedule(new FinishTurn(true), new Date(System.currentTimeMillis() + delaySwapGem));
    //TaskSchedule(delaySwapGem, _ => SendFinishTurn(true));

    setTimeout(function () {
        SendFinishTurn(true);
    }, delaySwapGem);
    visualizer.setGame({
        game: gameSession,
        grid,
        botPlayer,
        enemyPlayer,
    });

    if (strategy) {
        strategy.setGame({
            game: gameSession,
            grid,
            botPlayer,
            enemyPlayer,
        });

        strategy.addSwapGemHandle(SendSwapGem);
        strategy.addCastSkillHandle(SendCastSkill);
    }
}

function AssignPlayers(room) {
    let user1 = room.getPlayerList()[0];
    trace('id user1: ' + user1.name);

    if (user1.isItMe) {
        let playerId = Array.from(user1._playerIdByRoomId).map(
            ([name, value]) => value,
        )[1];

        botPlayer = new Player(playerId, 'player1');
        enemyPlayer = new Player(ENEMY_PLAYER_ID, 'player2');
    } else {
        botPlayer = new Player(BOT_PLAYER_ID, 'player2');
        enemyPlayer = new Player(ENEMY_PLAYER_ID, 'player1');
    }
}

function EndGame() {
    isJoinGameRoom = false;

    document.getElementById('log').innerHTML = '';
    visualizer.snapShot();
}

function SendFinishTurn(isFirstTurn) {
    let data = new SFS2X.SFSObject();
    data.putBool('isFirstTurn', isFirstTurn);
    log(
        'sendExtensionRequest()|room:' +
            room.name +
            '|extCmd:' +
            FINISH_TURN +
            ' first turn ' +
            isFirstTurn,
    );
    trace(
        'sendExtensionRequest()|room:' +
            room.name +
            '|extCmd:' +
            FINISH_TURN +
            ' first turn ' +
            isFirstTurn,
    );

    SendExtensionRequest(FINISH_TURN, data);
}

// log('Bot| ' + this.botPlayerHero.heroes.name);

function StartTurn(param) {
    currentPlayerId = param.getInt('currentPlayerId');
    visualizer.snapShot();

    SEA_SPIRIT_BOT = this.botPlayer.heroes[0];
    FIRE_SPRIT_BOT = this.botPlayer.heroes[1];
    SEA_GOD = this.botPlayer.heroes[2];

    Object.keys(this.botPlayer.heroes).forEach(function (key) {
        console.log(key, this.botPlayer.heroes[key]);
    });

    Object.keys(this.enemyPlayer.heroes).forEach(function (key) {
        console.log(this.enemyPlayer.heroes[key].id);
        if (
            FIRE_SPRIT_BOT.isAlive() &&
            FIRE_SPRIT_BOT.isFullMana() &&
            (this.enemyPlayer.heroes[key].id === 'CERBERUS' ||
                this.enemyPlayer.heroes[key].id === 'THUNDER_GOD' ||
                this.enemyPlayer.heroes[key].id === 'SEA_GOD')
        ) {
            SendCastSkill(FIRE_SPRIT_BOT, {
                targetId: this.enemyPlayer.heroes[key].id.toString(),
            });
        }
    });

    setTimeout(function () {
        if (!isBotTurn()) {
            trace('not isBotTurn');
            return;
        }

        if (strategy) {
            strategy.playTurn();
            return;
        }
        let heroFullMana = botPlayer.anyHeroFullMana();

        if (SEA_SPIRIT_BOT.isFullMana() && SEA_GOD.isAlive()) {
            SendCastSkill(SEA_SPIRIT_BOT, { targetId: SEA_GOD.id.toString() });
        }

        if (heroFullMana != null) {
            SendCastSkill(heroFullMana);
        } else {
            SendSwapGem();
        }
    }, delaySwapGem);
}

function isBotTurn() {
    return botPlayer.playerId == currentPlayerId;
}

function SendCastSkill(
    heroCastSkill,
    { targetId, selectedGem, gemIndex, isTargetAllyOrNot } = {},
) {
    var data = new SFS2X.SFSObject();

    data.putUtfString('casterId', heroCastSkill.id.toString());
    if (targetId) {
        data.putUtfString('targetId', targetId);
    } else if (heroCastSkill.isHeroSelfSkill()) {
        data.putUtfString('targetId', botPlayer.firstHeroAlive().id.toString());
    } else {
        data.putUtfString(
            'targetId',
            enemyPlayer.firstHeroAlive().id.toString(),
        );
    }
    console.log('selectedGem:  ', SelectGem());
    if (selectedGem) {
        data.putUtfString('selectedGem', selectedGem);
    }
    {
        data.putUtfString('selectedGem', SelectGem().toString());
    }
    if (gemIndex) {
        data.putUtfString('gemIndex', gemIndex);
    }
    {
        data.putUtfString('gemIndex', GetRandomInt(64).toString());
    }

    if (isTargetAllyOrNot) {
        data.putBool('isTargetAllyOrNot', isTargetAllyOrNot);
    } else {
        data.putBool('isTargetAllyOrNot', false);
    }
    log(
        'sendExtensionRequest()|room:' +
            room.Name +
            '|extCmd:' +
            USE_SKILL +
            '|Hero cast skill: ' +
            heroCastSkill.name,
    );
    trace(
        'sendExtensionRequest()|room:' +
            room.Name +
            '|extCmd:' +
            USE_SKILL +
            '|Hero cast skill: ' +
            heroCastSkill.name,
    );

    SendExtensionRequest(USE_SKILL, data);
}

function SendSwapGem(swap) {
    let indexSwap = swap ? swap.getIndexSwapGem() : grid.recommendSwapGem();

    log(
        'sendExtensionRequest()|room:' +
            room.Name +
            '|extCmd:' +
            SWAP_GEM +
            '|index1: ' +
            indexSwap[0] +
            ' index2: ' +
            indexSwap[1],
    );
    trace(
        'sendExtensionRequest()|room:' +
            room.Name +
            '|extCmd:' +
            SWAP_GEM +
            '|index1: ' +
            indexSwap[0] +
            ' index2: ' +
            indexSwap[1],
    );

    var data = new SFS2X.SFSObject();

    data.putInt('index1', parseInt(indexSwap[0]));
    data.putInt('index2', parseInt(indexSwap[1]));

    SendExtensionRequest(SWAP_GEM, data);
}

function SwapGem(param) {
    let isValidSwap = param.getBool('validSwap');
    if (!isValidSwap) {
        return;
    }

    HandleGems(param);
}

function HandleGems(paramz) {
    let gameSession = paramz.getSFSObject('gameSession');
    currentPlayerId = gameSession.getInt('currentPlayerId');
    //get last snapshot
    let snapshotSfsArray = paramz.getSFSArray('snapshots');
    let lastSnapshot = snapshotSfsArray.getSFSObject(
        snapshotSfsArray.size() - 1,
    );
    let needRenewBoard = paramz.containsKey('renewBoard');
    // update information of hero
    HandleHeroes(lastSnapshot);
    if (needRenewBoard) {
        grid.updateGems(paramz.getSFSArray('renewBoard'), null);
        // TaskSchedule(delaySwapGem, _ => SendFinishTurn(false));
        setTimeout(function () {
            SendFinishTurn(false);
        }, delaySwapGem);
        return;
    }
    // update gem
    grid.gemTypes = botPlayer.getRecommendGemType();

    let gemCode = lastSnapshot.getSFSArray('gems');
    let gemModifiers = lastSnapshot.getSFSArray('gemModifiers');

    console.log('gemModifiers : ', gemModifiers);

    grid.updateGems(gemCode, gemModifiers);

    setTimeout(function () {
        SendFinishTurn(false);
    }, delaySwapGem);
}

function HandleHeroes(paramz) {
    let heroesBotPlayer = paramz.getSFSArray(botPlayer.displayName);
    for (let i = 0; i < botPlayer.heroes.length; i++) {
        botPlayer.heroes[i].updateHero(heroesBotPlayer.getSFSObject(i));
    }

    let heroesEnemyPlayer = paramz.getSFSArray(enemyPlayer.displayName);
    for (let i = 0; i < enemyPlayer.heroes.length; i++) {
        enemyPlayer.heroes[i].updateHero(heroesEnemyPlayer.getSFSObject(i));
    }
}

var log = function (msg) {
    console.log('trường : ' + '|' + msg);
};

function SendExtensionRequest(extCmd, paramz) {
    sfs.send(new SFS2X.ExtensionRequest(extCmd, paramz, room));
}

function GetRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function SelectGem() {
    let recommendGemType = botPlayer.getRecommendGemType();

    console.log('recommendGemType: ', recommendGemType);
    console.log('grid.gemType : ', grid.gemTypes);

    let gemSelect = Array.from(recommendGemType).find((gemType) =>
        Array.from(grid.gemTypes).includes(gemType),
    );

    console.log('gemSelect : ', gemSelect);

    return gemSelect;
}
