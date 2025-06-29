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
exports.storeAsset = storeAsset;
exports.loadAsset = loadAsset;
const promises_1 = require("fs/promises");
const path_1 = require("path");
// We are just using the filesystem to store assets
const DIR = (0, path_1.resolve)('./rooms');
function storeAsset(id, roomId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, promises_1.mkdir)(`${DIR}/${roomId}/assets`, { recursive: true });
            yield (0, promises_1.writeFile)((0, path_1.join)(`${DIR}/${roomId}/assets`, id), data);
        }
        catch (error) {
            console.error(`Failed to store asset ${id}:`, error);
            throw error;
        }
    });
}
function loadAsset(id, roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield (0, promises_1.readFile)((0, path_1.join)(`${DIR}/${roomId}/assets`, id));
        }
        catch (error) {
            console.error(`Failed to load asset ${id}:`, error);
            throw error;
        }
    });
}
