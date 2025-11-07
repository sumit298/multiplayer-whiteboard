"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutexes = exports.rooms = void 0;
exports.cleanupRooms = cleanupRooms;
exports.makeOrLoadRoom = makeOrLoadRoom;
const sync_core_1 = require("@tldraw/sync-core");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const DIR = './rooms';
function cleanupRooms(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // try {
            // 	await access(`${DIR}/${roomId}`, constants.F_OK)
            // } catch {
            // 	return
            // }
            if (roomId) {
                try {
                    (0, promises_1.rm)((0, path_1.join)(`${DIR}/`, roomId), {
                        force: true,
                        recursive: true
                    }).catch((error) => console.error(error));
                }
                catch (err) {
                    // Only log as error if it's not a "file not found" error
                    if (err.code !== 'ENOENT') {
                        console.error(`Failed to delete room ${roomId}:`, err);
                    }
                }
            }
            else {
                // Clean all rooms
                const files = yield (0, promises_1.readdir)(`${DIR}/`);
                if (files.length === 0) {
                    return;
                }
                yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Check if file still exists before trying to delete
                        // try {
                        // 	await access(join(`${DIR}/${roomId}`, file), constants.F_OK)
                        // } catch {
                        // 	return // Skip if file doesn't exist
                        // }
                        (0, promises_1.unlink)((0, path_1.join)(`${DIR}/`, file)).catch((error) => console.error(error));
                    }
                    catch (err) {
                        // Only log as error if it's not a "file not found" error
                        if (err.code !== 'ENOENT') {
                            console.error(`Failed to delete room ${file}:`, err);
                        }
                    }
                })));
            }
        }
        catch (error) {
            console.error('Error during rooms cleanup:', error);
        }
    });
}
// Function to clean assets folder
function readSnapshotIfExists(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const data = yield (0, promises_1.readFile)((0, path_1.join)(`${DIR}/${roomId}`, roomId));
            return (_a = JSON.parse(data.toString())) !== null && _a !== void 0 ? _a : undefined;
        }
        catch (e) {
            return undefined;
        }
    });
}
function saveSnapshot(roomId, snapshot) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, promises_1.mkdir)(`${DIR}/${roomId}`, { recursive: true, });
        yield (0, promises_1.writeFile)((0, path_1.join)(`${DIR}/${roomId}`, roomId), JSON.stringify(snapshot));
    });
}
const rooms = new Map();
exports.rooms = rooms;
// Replace the single mutex with a map of mutexes per room
const mutexes = new Map();
exports.mutexes = mutexes;
function makeOrLoadRoom(roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize mutex for this room if it doesn't exist
        if (!mutexes.has(roomId)) {
            mutexes.set(roomId, Promise.resolve(null));
        }
        // Get the mutex for this specific room
        let roomMutex = mutexes.get(roomId);
        // Chain the new operation to this room's mutex
        roomMutex = roomMutex
            .then(() => __awaiter(this, void 0, void 0, function* () {
            if (rooms.has(roomId)) {
                const roomState = rooms.get(roomId);
                if (!roomState.room.isClosed()) {
                    return null;
                }
                // Remove from memory but don't cleanup files
                rooms.delete(roomId);
            }
            const initialSnapshot = yield readSnapshotIfExists(roomId);
            const roomState = {
                needsPersist: false,
                id: roomId,
                room: new sync_core_1.TLSocketRoom({
                    initialSnapshot,
                    onSessionRemoved(room, args) {
                        return __awaiter(this, void 0, void 0, function* () {
                            console.log(`Session removed from room ${roomId}. Sessions remaining: ${args.numSessionsRemaining}`);
                            // Clean up room when all participants leave
                            if (args.numSessionsRemaining === 0) {
                                console.log(`All participants left room ${roomId}. Scheduling cleanup...`);
                                // Wait 5 minutes before cleanup in case someone rejoins
                                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                    if (room.getNumActiveSessions() === 0) {
                                        console.log(`Cleaning up empty room ${roomId}`);
                                        room.close();
                                        rooms.delete(roomId);
                                        mutexes.delete(roomId);
                                        try {
                                            yield (0, promises_1.rm)((0, path_1.join)('./rooms', roomId), { force: true, recursive: true });
                                            console.log(`Room folder ${roomId} deleted successfully`);
                                        }
                                        catch (error) {
                                            console.error(`Failed to delete room folder ${roomId}:`, error);
                                        }
                                    }
                                }), 1 * 60 * 1000); // 5 minutes
                            }
                        });
                    },
                    onDataChange() {
                        roomState.needsPersist = true;
                    },
                }),
            };
            rooms.set(roomId, roomState);
            return null;
        }))
            .catch((error) => {
            console.error('Error in mutex:', error);
            return error;
        });
        // Update the mutex in the map
        mutexes.set(roomId, roomMutex);
        const err = yield roomMutex;
        if (err)
            throw err;
        return rooms.get(roomId).room;
    });
}
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    // Persist rooms that need saving
    for (const roomState of rooms.values()) {
        if (roomState.needsPersist) {
            roomState.needsPersist = false;
            yield saveSnapshot(roomState.id, roomState.room.getCurrentSnapshot());
        }
    }
    // Collect active room IDs
    const activeRoomIds = [];
    for (const roomId of rooms.keys()) {
        const roomState = rooms.get(roomId);
        if (roomState && !roomState.room.isClosed()) {
            activeRoomIds.push(roomId);
        }
    }
    if (activeRoomIds.length === 0) {
        console.log('No active rooms found!');
    }
    else {
        console.log(`${activeRoomIds.length},`, activeRoomIds);
    }
}), 1000);
