const options = {
    cors: true
};
const io = require("socket.io")(options);

let rooms = {};
const emptyBoard = [
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
]

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
        rooms[roomID] = { "players": [socket.id], "turn": 0, board: emptyBoard };
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
        console.log('Client clicked on ' + tableID + '-' + cellID + ' in room ' + roomID);
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
        if (rooms[roomID].board[tableID][cellID] != "") {
            socket.emit('invalid', 'Cell already taken');
            return;
        }
        rooms[roomID].board[tableID][cellID] = playerChar;
        rooms[roomID].turn = (rooms[roomID].turn + 1) % 2;
        socket.emit('cellClicked', { roomID: roomID, tableID: tableID, cellID: cellID, playerChar: playerChar });
        socket.broadcast.to(rooms[roomID].players[rooms[roomID].turn]).emit('cellClicked', { roomID: roomID, tableID: tableID, cellID: cellID, playerChar: playerChar });
        console.log('Client clicked on ' + tableID + '-' + cellID + ' in room ' + roomID);
    });

    //disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


io.listen(3000);

var connect = require('connect');
var serveStatic = require('serve-static');

connect()
    .use(serveStatic("./cli"))
    .listen(8080, () => console.log('Server running on 8080...'));