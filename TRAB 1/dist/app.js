"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const security_1 = require("./plugins/security");
const index_1 = require("@routes/index");
function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    // Plugins de segurança
    (0, security_1.registerSecurity)(app);
    // Rotas
    (0, index_1.registerRoutes)(app);
    return app;
}
