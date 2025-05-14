"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSecurity = registerSecurity;
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
async function registerSecurity(app) {
    await app.register(helmet_1.default); // 👈 CORRETO
    await app.register(cors_1.default, {
        origin: true,
        credentials: true,
    });
    await app.register(rate_limit_1.default, {
        max: 100,
        timeWindow: '1 minute',
    });
}
