"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const auth_1 = __importDefault(require("./auth"));
const users_1 = __importDefault(require("./users"));
const characters_1 = __importDefault(require("./characters"));
const games_1 = __importDefault(require("./games"));
const maps_1 = __importDefault(require("./maps"));
const errorHandler_1 = require("../middleware/errorHandler");
function setupRoutes(app) {
    const apiVersion = '/api/v1';
    app.use(`${apiVersion}/auth`, auth_1.default);
    app.use(`${apiVersion}/users`, users_1.default);
    app.use(`${apiVersion}/characters`, characters_1.default);
    app.use(`${apiVersion}/games`, games_1.default);
    app.use(`${apiVersion}/maps`, maps_1.default);
    app.use('*', errorHandler_1.notFoundHandler);
}
exports.default = setupRoutes;
//# sourceMappingURL=index.js.map