"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
let io = null;
function initSocket(server) {
    if (!io) {
        io = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
            },
        });
        io.on("connection", (socket) => {
            console.log("🟢 Socket connected:", socket.id);
        });
    }
    return io;
}
function getIO() {
    return io;
}
