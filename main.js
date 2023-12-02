const options = {
    cors: true
};
const io = require("socket.io")(options);

let rooms = {};

const createRoomID = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 5; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    if (Object.keys(rooms).includes(id)) {
        return createRoomID();
    }
    return id;
}

io.on('connection', (socket) => {
    console.log("New client connected");

    //create
    socket.on('create', () => {
        const roomID = createRoomID();
        rooms[roomID] = { "players": [socket.id], "turn": 0, board: [[], [], [], [], [], [], [], [], []] };
        socket.emit('created', { roomID: roomID });
        console.log('Client created a room: ' + roomID);
    });

    //join
    socket.on('join', ({ roomID }) => {
        if (!Object.keys(rooms).includes(roomID)) {
            socket.emit('invalid', 'Invalid roomID');
            return;
        }
        rooms[roomID].players.push(socket.id);
        socket.emit('joined', { roomID: roomID });
        console.log('Client joined a room: ' + roomID);
    });

    //cellClick
    socket.on('cellClick', ({ roomID, tableID, cellID, playerChar }) => {
        console.log('Player ' + playerChar + ' clicked on ' + tableID + '-' + cellID + ' in room ' + roomID);
        if (!Object.keys(rooms).includes(roomID)) {
            socket.emit('invalid', 'Invalid roomID');
            return;
        }
        if (rooms[roomID].players.length != 2) {
            socket.emit('invalid', 'Not enough players');
            return;
        }
        if (rooms[roomID].turn != rooms[roomID].players.indexOf(socket.id)) {
            socket.emit('invalid', 'Not your turn');
            return;
        }
        if (rooms[roomID].board[tableID][cellID] != null) {
            socket.emit('invalid', 'Cell already taken');
            return;
        }
        rooms[roomID].board[tableID][cellID] = playerChar;
        rooms[roomID].turn = (rooms[roomID].turn + 1) % 2;
        socket.emit('cellClicked', { roomID: roomID, tableID: tableID, cellID: cellID, playerChar: playerChar });
        socket.broadcast.to(rooms[roomID].players[rooms[roomID].turn]).emit('cellClicked', { roomID: roomID, tableID: tableID, cellID: cellID, playerChar: playerChar });

        if (checkTable(rooms[roomID].board[tableID])) {
            socket.emit('winTable', { roomID: roomID, tableID: tableID, winner: playerChar });
            socket.broadcast.to(rooms[roomID].players[rooms[roomID].turn]).emit('winTable', { roomID: roomID, tableID: tableID, winner: playerChar });
            console.log('Client won the table ' + tableID + ' in room ' + roomID);
        }
    });

    //disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

function checkTable(table) {
    if (table[0] == table[1] && table[1] == table[2] && table[0] != null) return true;
    if (table[3] == table[4] && table[4] == table[5] && table[3] != null) return true;
    if (table[6] == table[7] && table[7] == table[8] && table[6] != null) return true;

    if (table[0] == table[3] && table[3] == table[6] && table[0] != null) return true;
    if (table[1] == table[4] && table[4] == table[7] && table[1] != null) return true;
    if (table[2] == table[5] && table[5] == table[8] && table[2] != null) return true;

    if (table[0] == table[4] && table[4] == table[8] && table[0] != null) return true;
    if (table[2] == table[4] && table[4] == table[6] && table[2] != null) return true;

    return false;
}


io.listen(8080);

var connect = require('connect');
var serveStatic = require('serve-static');

connect()
    .use(serveStatic("./cli"))
    .listen(8080, () => console.log('Server running on 8080...'));