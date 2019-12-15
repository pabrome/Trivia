
var socket = io();

//Host functions

var game = {
    playerlist: [{
        name: "",
        points: "",
        id: "",
        ready: true
    }],
    questions: [],
};

var currentQuestion = 0

async function createGame() {
    var info = {};
    var gameID = Math.round(Math.random()*100000);
    info.gameID = gameID;
    $("button, input").remove();
    $("<div>").attr("id","gameID").text(`Game ID: ${gameID}`).appendTo("#container");
    $("<button>").attr("id","startButton").text("Start Game").appendTo("#container");
    $("<div>").attr("id","playerlist").appendTo("#container");
    $("#startButton").click(startGame);
    
    socket.emit('create game', info);

    socket.on('player joined', (msg) => {
        console.log(msg)
        game.playerlist.push({
            name: msg.playerName, 
            points: 0,
            id: msg.id,
            ready: false
        });
        console.log(game)
        $("#playerlist").empty();
        for (player of game.playerlist) {
            $("<div>").addClass("col-1").text(player.name).appendTo("#playerlist");
        };
    });
};

async function startGame() {
    $("#container").empty();
    console.log("game started")
    var questions = await $.get("https://opentdb.com/api.php?amount=3&category=9&difficulty=medium&type=multiple");
    console.log(questions)
    game.questions = questions.results;
    console.log(game);
    socket.emit('start game');
    socket.on('next question', showQuestion());
    // //waiting for all players to be ready
    // var onePlayerNotReady = true
    // socket.on('player ready', (msg) => {
    //     console.log(`player ${msg} is ready`);
    //     onePlayerNotReady = false
    //     for (player of game.playerlist) {
    //         if (player.id == msg) {
    //             player.ready = true;
    //         };
    //         if (player.ready == false) {
    //             onePlayerNotReady = true;
    //         };
    //     };
    // })
    // while (onePlayerNotReady == true) {
    //     console.log("waiting on players");
    //     await resolveAfter2Seconds();
    //     console.log("checking again");
    //     console.log(game);
    // };
    console.log("All players are ready");
};

async function showQuestion() {
    if (currentQuestion < game.questions.length) {
        console.log(`Question number ${currentQuestion}`);
        var question = game.questions[currentQuestion];
        var correctPlayers = [];
        var incorrectPlayers = [];
        var playerIDs = {
            correct: [],
            incorrect: []
        }
        socket.on('receive answer', (msg) => {
            var answerComponent = 0;
            console.log(msg);
            console.log(msg.answer.charCodeAt(0)-65);
            if (msg.answer == "D") {
                answer = question.correct_answer;
            }
            else {
                x = msg.answer.charCodeAt(0)-65;
                answer = question.incorrect_answers[x];
            };
            var pointsThisRound = 0;
            if (answer == question.correct_answer) {
                console.log("correct answer");
                answerComponent = 1000;
            };
            timeComponent = msg.timeRemaining * 10;
            pointsThisRound = answerComponent + timeComponent;
            for (player of game.playerlist) {
                if (player.id == msg.id) {
                    player.points = player.points + pointsThisRound;
                    if (answerComponent == 1000) {
                        console.log("correct");
                        correctPlayers.push(player.name);
                        playerIDs.correct.push(player.id);
                        console.log(correctPlayers);
                    }
                    else {
                        incorrectPlayers.push(player.name);
                        playerIDs.incorrect.push(player.id);
                    };
                };
            };
            console.log(game);
        });
        await presentQuestion(question);
        console.log(playerIDs);
        socket.emit('send results', playerIDs);
        console.log(correctPlayers);
        $("#container").empty();
        $("#nextQuestion").unbind('click');
        $("<p>").text("Who got the question right?").appendTo("#container");
        $("<p>").text(`Correct players: ${correctPlayers}`).appendTo("#container");
        $("<p>").text(`Wrong players: ${incorrectPlayers}`).appendTo("#container");
        $("<button>").attr("id","nextQuestion").text("Next Question").appendTo("#container");
        $("#nextQuestion").click( () => {
            console.log("next question");
            currentQuestion++;
            socket.emit('next question');
            socket.on('next question', showQuestion());
        });
    }
    else {
        gameFinished();
    };
};

function resolveAfter2Seconds(x) { 
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, 5000);
    });
};

async function presentQuestion(question) {
    $("#container").empty();
    var timeRemaining = 10;
    $("<div>").attr("id","timer").text(timeRemaining).appendTo("#container");
    $("<div>").text(question.question).appendTo("#container");
    $("<p>").text(`A: ${question.incorrect_answers[0]}`).appendTo("#container");
    $("<p>").text(`B: ${question.incorrect_answers[1]}`).appendTo("#container");
    $("<p>").text(`C: ${question.incorrect_answers[2]}`).appendTo("#container");
    $("<p>").text(`D: ${question.correct_answer}`).appendTo("#container");
    var x = setInterval( () => {
        timeRemaining--;
        $("#timer").text(timeRemaining);
        if (timeRemaining <= 0) {
            clearInterval(x);
        };
    }, 1000);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, 10000);
    });
};

// function nextQuestion() {
//     return new Promise(resolve => {
//         $("#nextQuestion").click( () => {
//             resolve();
//         });
//     });
// };

async function gameFinished() {
    console.log("game finished");
    //sorting by highest points
    console.log(game);

    game.playerlist.sort(function(a, b){
        return b.points-a.points;
    });
    console.log(game);

    socket.emit('game finished', game);
    $("#container").empty();
    $("<ul>").attr("id","standings").appendTo("#container");
    for (player of game.playerlist) {
        $("<li>").text(`${player.name}: ${player.points} points`).appendTo("#standings");
    };
};


//Player functions

async function joinGame() {
    $("button, input").remove();
    console.log("appending");
    $("<p>").text("Room ID:").appendTo("#container");
    $("<input>").attr("id","roomInput").appendTo("#container");
    $("<p>").text("Player Name:").appendTo("#container");
    $("<input>").attr("id","playerName").appendTo("#container");
    $("<button>").attr("id","joinRoom").text("joinRoom").appendTo("#container");
    $("#joinRoom").click(joinRoom);
};

function joinRoom() {
    var info = {};
    info.playerName = $("#playerName").val();
    info.gameID = $("#roomInput").val();
    socket.emit('player joined', info);
    //catch error if room doesn't exist
    $("button, input").remove();
    $("#container").empty();
    $("<p>").text(info.gameID).appendTo("#container");
    $("<p>").text(info.playerName).appendTo("#container");
    $("<p>").text("Waiting for game to start...").appendTo("#container");
    socket.on('game started', loadAnswers);
};

var playerTimeRemaining

function loadAnswers() {
    $("#container").empty();
    $(".answer").unbind('click');
    let answers = ["A","B","C","D"];
    for (letter of answers) {
        $("<button>").addClass("answer").text(letter).appendTo("#container");
    };
    playerTimeRemaining = 10;
    var x = setInterval( () => {
        playerTimeRemaining--;
        if (playerTimeRemaining <= 0) {
            clearInterval(x);
        };
    }, 1000);
    $(".answer").unbind('click');
    $(".answer").click(submitAnswer);
    socket.on('next question', loadAnswers);
};

function submitAnswer() {
    console.log(playerTimeRemaining);
    let answer = $(this).text();
    let package = {
        answer: answer,
        timeRemaining: playerTimeRemaining
    };
    socket.emit('submit answer', package);
    $("#container").empty();
    $("<p>").text(`Answer chosen: ${answer}`).appendTo("#container");
    socket.on('receive results', (msg) => {
        $("#container").empty();
        if (msg == "Answer was correct") {
            $("<p>").text(`You were correct!`).css("color","green").appendTo("#container");
        } else if (msg == "Answer was incorrect") {
            $("<p>").text(`You were wrong...`).css("color","red").appendTo("#container");
        };
    });
    socket.on('next question', loadAnswers);
};

socket.on('final score', (msg) => {
    console.log("final score");
    $("#container").empty();
    $("<p>").text(`Placed #${msg.placement + 1} with ${msg.points} points!`).appendTo("#container");
});





$("#createGame").click(createGame);
$("#joinGame").click(joinGame);



// $(function () {
//     var socket = io();
//     $('form').submit(function(e){
//         e.preventDefault(); // prevents page reloading
//         socket.emit('chat message', $('#m').val());
//         $('#m').val('');
//         return false;
//     });
//     socket.on('chat message', function(msg){
//         $('#joinGameButton').append($('<li>').text(msg));
//     });
// });
// 
// 
// async function createGame() {
//     $("#game").remove();
//     $("#join").remove();
//     $("<p>").text("Enter your player name:").appendTo("#content");
//     $("<input>").attr({
//         type: "text",
//         class: "form-control",
//         width: "4px",
//         id: "playerInput"
//     }).appendTo("#content");
//     $("<button>").attr("id","confirmName").addClass("btn btn-success mt-2").text("Confirm").appendTo("#content");
//     $("#confirmName").click(loadGame);
// };

// async function loadGame() {
//     var playerName = $("#playerInput").val();
//     localStorage.setItem("playerName", playerName);
//     $("#content").empty();
//     $(".spacer").css("height","20vh");
//     $("<div>").attr("id","userBox").css("height","10vh").insertAfter("#content");
//     var gameID = Math.round(Math.random()*1000000);
//     $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(`Your token is:`).appendTo("#content");
//     $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(gameID).appendTo("#content");
//     $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(`Share it with your friends!`).appendTo("#content");
//     $("<div>").css("width", "10vw").addClass("d-flex justify-content-center").text(playerName).appendTo("#userBox");
//     localStorage.setItem("gameID", gameID);
//     data = {playerName: playerName, gameID: gameID};
//     let response = await $.ajax({
//         method: "POST",
//         url: "/createGame",
//         data: data
//     });
//     localStorage.setItem("playerID", response.playerID);
//     console.log(response);
// };

// async function joinGame() {
//     data = {userID: localStorage.getItem("userID"), gameName: $("#joinGameInput").val()};
//     var response = await $.ajax({
//         method: "POST",
//         url: "/joinGame",
//         data: data
//     });
//     console.log(response);
//     userList = "";
//     for (user of response) {
//         userList = userList + `${user.username}  `
//     };
//     console.log(userList);
//     $("button").remove();
//     $("input").remove();
//     $("#userList").remove();
//     $("<p>").text(`Current Session: ${response[0].sessionName}`).appendTo("#game");
//     $("<p>").text(`Users: ${userList}`).attr("id","userList").appendTo("#game");
//     // setInterval(updateUsers, 1000);
// };

// async function updateUsers() {
//     console.log("users updated");
//     data = {sessionName: localStorage.getItem("sessionName")}
//     var response = await $.ajax({
//         method: "POST",
//         url: "/getgrouplist",
//         data: data
//     });
//     console.log(response)
//     userList = "";
//     for (user of response) {
//         userList = userList + `${user.username}  `
//     };
//     $("#userList").remove();
//     $("<p>").text(`Users: ${userList}`).attr("id","userList").appendTo("#game");
// };

// $("#createGameButton").click(createGame);
// $("#joinGameButton").click(joinGame);


// async function mainLoad() {
//     if (localStorage.getItem("username") !== null) {
//         $("button").remove()
//         $("input").remove()
//         updateUsers();
//     };
// };

// mainLoad();

