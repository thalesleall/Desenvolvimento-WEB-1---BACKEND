"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
async function registerRoutes(app) {
    app.get('/', async () => {
        return { message: 'API protegida e rodando ✅' };
    });
}
