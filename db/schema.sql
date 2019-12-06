DROP DATABASE IF EXISTS trivia_game_db;
CREATE database trivia_game_db;
USE trivia_game_db;

 CREATE TABLE accounts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(100),
    username VARCHAR(100),
    password VARCHAR(100) NOT NULL
);

CREATE TABLE games (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    game_name VARCHAR(100)
);

CREATE TABLE players(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(100),
    game_id INT NOT NULL
);


INSERT INTO games (game_name) VALUES ('Know it alls');
INSERT INTO players (player_name, game_id, companyId, email, username, password, points) VALUES 
('Idris', 'Adebisi', 1, 'idrisadebisi@lipservice.com', 'idrisxa', 'talktome',100 ),


