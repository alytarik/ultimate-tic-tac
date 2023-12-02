const socket = io({ transports: ['websocket'] });
let roomID = null;
let myPlayerChar = null;

document.getElementById("btn-create").onclick = () => {
    socket.emit("create");
}
socket.on("created", (data) => {
    roomID = data.roomID;
    myPlayerChar = "X";
    document.getElementById("btn-join").disabled = true;
    document.getElementById("btn-create").disabled = true;
    document.getElementById("room-number").innerHTML = "Room ID: " + roomID;
});

document.getElementById("btn-join").onclick = () => {
    const roomIDInput = prompt("Enter a RoomID:");
    if (roomIDInput.length != 5) {
        alert("Invalid RoomID");
        return;
    }
    socket.emit("join", { roomID: roomIDInput });
    socket.on("joined", (data) => {
        roomID = data.roomID;
        myPlayerChar = "O";
        document.getElementById("btn-join").disabled = true;
        document.getElementById("btn-create").disabled = true;
        document.getElementById("room-number").innerHTML = "Room ID: " + roomID;
    });
}

socket.on("invalid", (message) => {
    alert(message);
});

socket.on("cellClicked", ({ tableID, cellID, playerChar }) => {
    console.log("cellClicked");
    const cell = document.getElementById("table-" + tableID + "-" + cellID);
    cell.innerHTML = playerChar;
    cell.style.color = playerChar == "X" ? "red" : "blue";
});

socket.on("winTable", ({ tableID, winner }) => {
    console.log("winTable");
    const table = document.getElementById("table-" + tableID);
    table.style.backgroundColor = winner == "X" ? "red" : "blue";
});

socket.on("winGame", ({ winner }) => {
    console.log("winGame " + winner);
    alert("Player " + winner + " won the game!");
});


Array.from(document.getElementsByClassName("cell")).forEach(element => {
    element.onclick = () => {
        cellClick(element.id.split("-")[1], element.id.split("-")[2]);
    }
});


function cellClick(tableID, cellID) {
    console.log("clicked on " + tableID + " " + cellID);
    if (roomID == null) return;
    socket.emit("cellClick", { roomID: roomID, tableID: tableID, cellID: cellID, playerChar: myPlayerChar });
}
