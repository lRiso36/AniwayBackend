"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = __importDefault(require("../supabase"));
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase_1.default.auth.getUser(token);
    console.log('auth error:', error);
    console.log('auth data:', data);
    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
};
exports.requireAuth = requireAuth;
