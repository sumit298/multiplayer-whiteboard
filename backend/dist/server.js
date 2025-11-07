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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("@fastify/cors"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const fastify_1 = __importDefault(require("fastify"));
const assets_1 = require("./assets");
const rooms_1 = require("./rooms");
const RoomError_1 = require("./RoomError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { unfurl } from './unfurl'
const PORT = 5959;
const app = (0, fastify_1.default)({
    bodyLimit: 1024 * 1024 * 10, // 10mb,
    maxParamLength: 1024,
});
app.register(websocket_1.default);
app.register(cors_1.default, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
});
// Room credentials storage - in production, use a database
const roomCredentials = new Map();
// Function to validate room credentials
function validateRoomCredentials(roomId, roomPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        // For development, we'll use some predefined rooms
        // In production, this should check against a database
        // Check if room already exists with credentials
        if (roomCredentials.has(roomId)) {
            return roomCredentials.get(roomId) === roomPassword;
        }
        // For new rooms, accept any password and store it
        // This allows dynamic room creation
        roomCredentials.set(roomId, roomPassword);
        console.log(`New room created: ${roomId}`);
        return true;
    });
}
// Custom verification function for your own authentication
function validateCustomAuth(token, roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            console.error('No token provided');
            throw new RoomError_1.RoomError('Authentication token is required', 401);
        }
        // JWT verification
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            console.log('JWT token verified successfully for user:', decoded.userId || 'unknown');
            // Optional: Additional validation logic based on decoded payload
            // For example, check if the token is for the correct room:
            // if (decoded.roomId && decoded.roomId !== roomId) {
            //   throw new Error('Token is not valid for this room');
            // }
            return true;
        }
        catch (error) {
            console.error('JWT verification failed:', error);
            throw new RoomError_1.RoomError('Invalid token', 401);
        }
    });
}
// Simplified validation function that uses your custom auth
function validateTokenAndRoom(_a) {
    return __awaiter(this, arguments, void 0, function* ({ token, roomId, }) {
        return validateCustomAuth(token, roomId);
    });
}
// VideoSDK specific functions removed - no longer needed
// You can add your own helper functions here if needed
function validateTokenAndRoomWebSocketMiddleware(req, reply, done) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const roomId = (_a = req.query) === null || _a === void 0 ? void 0 : _a['roomId'];
        const token = (_b = req.query) === null || _b === void 0 ? void 0 : _b['token'];
        try {
            yield validateTokenAndRoom({ token, roomId });
            done();
        }
        catch (error) {
            console.error('WebSocket token validation failed:', error);
            reply.code(401).send({ error: 'Unauthorized' });
            done(new Error('Unauthorized'));
        }
    });
}
// Create middleware function for REST API (using Authorization header)
function validateTokenAndRoomApiMiddleware(req, reply, done) {
    return __awaiter(this, void 0, void 0, function* () {
        const roomId = req.params.roomId;
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (authHeader && authHeader.startsWith('Basic ')) {
            token = authHeader.substring(6);
        }
        try {
            yield validateCustomAuth(token, roomId);
            done();
        }
        catch (error) {
            console.error('API token validation failed:', error);
            reply.code(401).send({ error: 'Unauthorized' });
            done(new Error('Unauthorized'));
        }
    });
}
app.register((app) => __awaiter(void 0, void 0, void 0, function* () {
    // This is the main entrypoint for the multiplayer sync
    app.get('/', {
        websocket: true,
        preHandler: validateTokenAndRoomWebSocketMiddleware // Use WebSocket middleware
    }, (socket, req) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const roomId = (_a = req.query) === null || _a === void 0 ? void 0 : _a['roomId'];
            const sessionId = (_b = req.query) === null || _b === void 0 ? void 0 : _b['sessionId'];
            const drawOnWhiteboard = (_c = req.query) === null || _c === void 0 ? void 0 : _c['drawOnWhiteboard'];
            const isReadonly = drawOnWhiteboard === 'false' ? false : true;
            const room = yield (0, rooms_1.makeOrLoadRoom)(roomId);
            room.handleSocketConnect({ sessionId, socket, isReadonly: !isReadonly });
        }
        catch (error) {
            console.error('Connection failed:', error);
            socket.terminate();
        }
    }));
    // To enable blob storage for assets, we add a simple endpoint supporting PUT and GET requests
    // But first we need to allow all content types with no parsing, so we can handle raw data
    app.addContentTypeParser('*', (_, __, done) => done(null));
    app.put('/uploads/:roomId/:id', {
        config: {
            bodyLimit: 10 * 1024 * 1024 // 10MB
        },
        handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const id = req.params.id;
            const roomId = req.params.roomId;
            try {
                // Create a buffer from the entire stream
                const chunks = [];
                try {
                    for (var _d = true, _e = __asyncValues(req.raw), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const chunk = _c;
                        chunks.push(chunk);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const buffer = Buffer.concat(chunks);
                yield (0, assets_1.storeAsset)(id, roomId, buffer);
                return res.send({ ok: true });
            }
            catch (error) {
                console.error('Upload error:', error);
                return res.status(500).send({ error: 'Upload failed' });
            }
        })
    });
    app.get('/uploads/:roomId/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const id = req.params.id;
        const roomId = req.params.roomId;
        try {
            const data = yield (0, assets_1.loadAsset)(id, roomId);
            if (!data) {
                return res.status(404).send({ error: 'File not found' });
            }
            // Set proper content type for SVG
            const extension = (_a = id.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (extension === 'svg') {
                res.type('image/svg+xml');
            }
            else if (extension === 'png') {
                res.type('image/png');
            }
            else if (extension === 'jpg' || extension === 'jpeg') {
                res.type('image/jpeg');
            }
            else {
                res.type('application/octet-stream');
            }
            return res.send(data);
        }
        catch (error) {
            console.error(`Get asset error for ${id}:`, error);
            return res.status(500).send({ error: 'Internal server error' });
        }
    }));
    // Health check endpoint for Docker health checks
    app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        return res.send({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.version,
            activeRooms: rooms_1.rooms.size
        });
    }));
    // Room authentication endpoint - validates room credentials and returns JWT
    app.post('/auth/room', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const body = req.body || {};
            const { username, roomId, roomPassword } = body;
            if (!roomId || !roomPassword) {
                return res.status(400).send({ error: 'Room ID and room password are required' });
            }
            // Validate room credentials
            const isValidRoom = yield validateRoomCredentials(roomId, roomPassword);
            if (!isValidRoom) {
                return res.status(401).send({ error: 'Invalid room credentials' });
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return res.status(500).send({ error: 'JWT_SECRET not configured' });
            }
            const payload = {
                userId: username || `user_${Math.random().toString(36).substring(2, 8)}`,
                roomId: roomId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours expiration
            };
            const token = jsonwebtoken_1.default.sign(payload, secret);
            return res.send({
                token,
                payload,
                expiresIn: '8 hours'
            });
        }
        catch (error) {
            console.error('Room authentication failed:', error);
            return res.status(500).send({ error: 'Authentication failed' });
        }
    }));
    // Leave room endpoint - deletes room contents and closes room
    app.delete('/rooms/:roomId/leave', {
        preHandler: validateTokenAndRoomApiMiddleware,
        handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const roomId = req.params.roomId;
            try {
                console.log(`User leaving room: ${roomId}`);
                const roomExists = rooms_1.rooms.has(roomId);
                if (roomExists) {
                    const roomState = rooms_1.rooms.get(roomId);
                    if (!roomState.room.isClosed()) {
                        roomState.room.close();
                    }
                    rooms_1.rooms.delete(roomId);
                    rooms_1.mutexes.delete(roomId);
                }
                // Remove room credentials from memory
                roomCredentials.delete(roomId);
                // Delete room files and folders
                yield (0, rooms_1.cleanupRooms)(roomId);
                console.log(`Room ${roomId} deleted successfully`);
                return res.send({ success: true, message: `Room ${roomId} and all its contents deleted successfully` });
            }
            catch (error) {
                console.error(`Error deleting room ${roomId}:`, error);
                return res.status(500).send({ success: false, error: 'Failed to delete room' });
            }
        })
    });
    app.delete('/rooms/:roomId', {
        preHandler: validateTokenAndRoomApiMiddleware,
        handler: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const roomId = req.params.roomId;
            try {
                const roomExists = rooms_1.rooms.has(roomId);
                if (roomExists) {
                    const roomState = rooms_1.rooms.get(roomId);
                    if (!roomState.room.isClosed()) {
                        roomState.room.close();
                    }
                    rooms_1.rooms.delete(roomId);
                    rooms_1.mutexes.delete(roomId);
                }
                yield (0, rooms_1.cleanupRooms)(roomId);
                return res.send({ success: true, message: `Room ${roomId} deleted successfully` });
            }
            catch (error) {
                console.error(`Error deleting room ${roomId}:`, error);
                return res.status(500).send({ success: false, error: 'Failed to delete room' });
            }
        })
    });
    // To enable unfurling of bookmarks, we add a simple endpoint that takes a URL query param
    // app.get('/unfurl', async (req, res) => {
    // 	const url = (req.query as any).url as string
    // 	res.send(await unfurl(url))
    // })
}));
app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server started on port ${PORT}`);
});
