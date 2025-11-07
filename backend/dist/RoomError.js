"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomError = void 0;
class RoomError extends Error {
    constructor(message, code = 400) {
        super(message);
        this.name = 'RoomError';
        this.code = code;
    }
}
exports.RoomError = RoomError;
