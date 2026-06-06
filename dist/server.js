"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); //loads .env keys first
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const animeRoutes_1 = __importDefault(require("./routes/animeRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const userAnimeRoutes_1 = __importDefault(require("./routes/userAnimeRoutes"));
const cors_1 = __importDefault(require("cors"));
const animeGroupRoutes_1 = __importDefault(require("./routes/animeGroupRoutes"));
const userListRoutes_1 = __importDefault(require("./routes/userListRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json()); // lets app read JSON from request 
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173'
})); //allow my frontend to requets my backend
app.use('/api/auth', authRoutes_1.default); // register them under /api/auth
app.use('/api/anime', authMiddleware_1.requireAuth, animeRoutes_1.default);
app.use('/api/user', authMiddleware_1.requireAuth, userAnimeRoutes_1.default);
app.use('/api/browse', authMiddleware_1.requireAuth, animeGroupRoutes_1.default);
app.use('/api/lists', authMiddleware_1.requireAuth, userListRoutes_1.default);
const PORT = process.env.PORT || 3000; //checks if .env has PORT, else 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); //keeps it running
