
var socket = io();

var gameName = "Best Game"

socket.on(gameName, (msg) => {
    console.log(`${msg} joined the game`);
});

async function setPlayerName() {
    var playerName = $("#playerName").val();

    $(".button").hide();
    $(".input").hide();

    info = {playerName: playerName, gameName: gameName}
    socket.emit('player joined', info);
};

$("#setPlayerName").click(setPlayerName);


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





async function createGame() {
    $("#game").remove();
    $("#join").remove();
    $("<p>").text("Enter your player name:").appendTo("#content");
    $("<input>").attr({
        type: "text",
        class: "form-control",
        width: "4px",
        id: "playerInput"
    }).appendTo("#content");
    $("<button>").attr("id","confirmName").addClass("btn btn-success mt-2").text("Confirm").appendTo("#content");
    $("#confirmName").click(loadGame);
};

async function loadGame() {
    var playerName = $("#playerInput").val();
    localStorage.setItem("playerName", playerName);
    $("#content").empty();
    $(".spacer").css("height","20vh");
    $("<div>").attr("id","userBox").css("height","10vh").insertAfter("#content");
    var gameID = Math.round(Math.random()*1000000);
    $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(`Your token is:`).appendTo("#content");
    $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(gameID).appendTo("#content");
    $("<div>").css("width", "100vw").addClass("d-flex justify-content-center").text(`Share it with your friends!`).appendTo("#content");
    $("<div>").css("width", "10vw").addClass("d-flex justify-content-center").text(playerName).appendTo("#userBox");
    localStorage.setItem("gameID", gameID);
    data = {playerName: playerName, gameID: gameID};
    let response = await $.ajax({
        method: "POST",
        url: "/createGame",
        data: data
    });
    localStorage.setItem("playerID", response.playerID);
    console.log(response);
};

async function joinGame() {
    data = {userID: localStorage.getItem("userID"), gameName: $("#joinGameInput").val()};
    var response = await $.ajax({
        method: "POST",
        url: "/joinGame",
        data: data
    });
    console.log(response);
    userList = "";
    for (user of response) {
        userList = userList + `${user.username}  `
    };
    console.log(userList);
    $("button").remove();
    $("input").remove();
    $("#userList").remove();
    $("<p>").text(`Current Session: ${response[0].sessionName}`).appendTo("#game");
    $("<p>").text(`Users: ${userList}`).attr("id","userList").appendTo("#game");
    // setInterval(updateUsers, 1000);
};

async function updateUsers() {
    console.log("users updated");
    data = {sessionName: localStorage.getItem("sessionName")}
    var response = await $.ajax({
        method: "POST",
        url: "/getgrouplist",
        data: data
    });
    console.log(response)
    userList = "";
    for (user of response) {
        userList = userList + `${user.username}  `
    };
    $("#userList").remove();
    $("<p>").text(`Users: ${userList}`).attr("id","userList").appendTo("#game");
};

$("#createGameButton").click(createGame);
$("#joinGameButton").click(joinGame);


async function mainLoad() {
    if (localStorage.getItem("username") !== null) {
        $("button").remove()
        $("input").remove()
        updateUsers();
    };
};

mainLoad();

