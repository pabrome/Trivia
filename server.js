const path = require('path');
const express = require('express');
const mysql = require('mysql');
const axios = require('axios');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mongoose = require("mongoose");

const PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/trivia", { useNewUrlParser: true });

// const Schema = mongoose.Schema;

// const triviaSchema = new Schema({
//     gameID: {
//         type: Number
//     },
//     players: [{
//         type: String,
//         points: Number
//     }],
//     questions: []
// });

// const triviaDB = mongoose.model("trivia", triviaSchema);



// class Database {
//     constructor( config ) {
//         this.connection = mysql.createConnection( config );
//     }
//     query( sql, args ) {
//         return new Promise( ( resolve, reject ) => {
//             this.connection.query( sql, args, ( err, rows ) => {
//                 if ( err )
//                     return reject( err );
//                 resolve( rows );
//             } );
//         } );
//     }
//     close() {
//         return new Promise( ( resolve, reject ) => {
//             this.connection.end( err => {
//                 if ( err )
//                     return reject( err );
//                 resolve();
//             } );
//         } );
//     }
// };
  
// if (process.env.JAWSDB_URL) {
//     db = new Database(process.env.JAWSDB_URL);
// } 
// else {
//     db = new Database
//     ({
//         host: "localhost",
//         port: 3306,
//         user: "root",
//         password: "password",
//         database: "trivia_game_db"
//     });
// };

server.listen(PORT, function() {
    console.log("Server listening on PORT " + PORT);
});

io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`);
    socket.on(`disconnect`, ()=>{
        console.log(`user ${socket.id} disconnected`);
    });

    socket.on('create game', (msg) => {
        console.log(msg);
        socket.join(msg.gameID);
    });

    socket.on('player joined', async function (msg) {
        console.log(msg);
        var reply = {
            playerName: msg.playerName,
            id: socket.id
        }
        try {
            socket.join(msg.gameID);
            io.in(msg.gameID).emit('player joined', reply);
        } catch {
            socket.emit('Room not found');
        };
    });

    socket.on('start game', async function (msg) {
        var questions = await axios("https://opentdb.com/api.php?amount=3&category=9&difficulty=medium&type=multiple");
        socket.emit('question answer', questions.data.results);
        var rooms = socket.rooms;
        var roomID = rooms[Object.keys(socket.rooms)[0]];
        io.in(roomID).emit('game started');
        // triviaDB.collection.insertOne({
        //     players: [{type: 'mytype', number: 2}],
        //     questions: questions.data.results
        // });
    });

    // //optional to keep users in sync with main page
    // socket.on('ready', async function () {
    //     var rooms = socket.rooms;
    //     var roomID = rooms[Object.keys(rooms)[0]];
    //     io.in(roomID).emit('player ready', socket.id)
    // });

    socket.on('submit answer', (msg) => {
        console.log(msg);
        var response = {
            id: socket.id,
            answer: msg.answer,
            timeRemaining: msg.timeRemaining
        };
        console.log(response)
        var rooms = socket.rooms;
        var roomID = rooms[Object.keys(rooms)[0]];
        io.in(roomID).emit('receive answer', response);
    });

    socket.on('send results', (msg) => {
        console.log(msg);
        for (correctID of msg.correct) {
            io.to(`${correctID}`).emit('receive results', 'Answer was correct');
        };
        for (incorrectID of msg.incorrect) { 
            io.to(`${incorrectID}`).emit('receive results', 'Answer was incorrect');
        };
    });

    socket.on('next question', () => {
        var rooms = socket.rooms;
        var roomID = rooms[Object.keys(socket.rooms)[0]];
        io.in(roomID).emit('next question');
    });

    socket.on('game finished', (msg) => {
        console.log(`game finished message ${msg}`);
        console.log(msg.playerlist)
        for ([i,player] of msg.playerlist.entries()) {
            let result = {
                placement: i,
                points: player.points
            };
            console.log(result)
            console.log(player.id)
            io.to(player.id).emit('final score', result);
        };
    });

});




app.get("/", async function (req, res) {
    res.sendFile(path.join(__dirname, "/public/assets/html/main.html"))
});

// app.post("/createGame", async function (req, res) {
    
//     let dbResposne = await db.query(`INSERT INTO games (game_name) VALUES ('${req.body.gameName}');`);
//     db.query(`INSERT INTO players (game_id) VALUES (${dbResposne.insertId}) WHERE id = ${req.body.userID}`);
//     response = {
//         gameName: req.body.gameName,
//         gameID: dbResposne.insertId
//     }
//     res.send(response);
// });

// app.post("/joinGame", async function (req, res) {
//     console.log(req.body);
//     let gameID = await db.query(`SELECT id FROM games WHERE game_name = '${req.body.gameName}'`);
//     db.query(`INSERT INTO players (game_id) VALUES (${gameID}) WHERE id = ${req.body.userID})`);
//     let players = await db.query(`SELECT player_name FROM players WHERE game_id = ${gameID}`);
//     response = {
//         gameID: gameID,
//         players: players
//     };
//     console.log(response);
//     res.send(response);
// });


// app.post("/getgrouplist", async function (req, res) {
//     let players = await db.query (`SELECT player_name FROM players WHERE game_id = (SELECT id FROM games WHERE game_name = '${req.body.gameName}')`);
//     console.log(players);
//     res.send(players);
// });




