const path = require('path');
const express = require('express');
const mysql = require('mysql');
const axios = require('axios');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

class Database {
    constructor( config ) {
        this.connection = mysql.createConnection( config );
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );
                resolve( rows );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
};
  
if (process.env.JAWSDB_URL) {
    db = new Database(process.env.JAWSDB_URL);
} 
else {
    db = new Database
    ({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        database: "trivia_game_db"
    });
};

socketClients = 0

server.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
});

io.on('connection', (socket)=>{
    socketClients++;
    socket.on('disconnect', ()=>{
      socketClients--;
      console.log('user disconnected');
    });
});

io.on('connection', function(socket){
    socket.on('player joined', (msg) =>{
      io.emit(msg.gameName, msg.playerName);
    });
  });

app.get("/", async function (req, res) {
    res.sendFile(path.join(__dirname, "/public/assets/html/main.html"))
});

app.post("/createGame", async function (req, res) {
    
    let dbResposne = await db.query(`INSERT INTO games (game_name) VALUES ('${req.body.gameName}');`);
    db.query(`INSERT INTO players (game_id) VALUES (${dbResposne.insertId}) WHERE id = ${req.body.userID}`);
    response = {
        gameName: req.body.gameName,
        gameID: dbResposne.insertId
    }
    res.send(response);
});

app.post("/joinGame", async function (req, res) {
    console.log(req.body);
    let gameID = await db.query(`SELECT id FROM games WHERE game_name = '${req.body.gameName}'`);
    db.query(`INSERT INTO players (game_id) VALUES (${gameID}) WHERE id = ${req.body.userID})`);
    let players = await db.query(`SELECT player_name FROM players WHERE game_id = ${gameID}`);
    response = {
        gameID: gameID,
        players: players
    };
    console.log(response);
    res.send(response);
});


app.post("/getgrouplist", async function (req, res) {
    let players = await db.query (`SELECT player_name FROM players WHERE game_id = (SELECT id FROM games WHERE game_name = '${req.body.gameName}')`);
    console.log(players);
    res.send(players);
});




