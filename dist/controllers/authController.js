"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInController = exports.signUpController = void 0;
const authService_1 = require("../services/authService");
const signUpController = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    try {
        const data = await (0, authService_1.signUp)(username, email, password);
        return res.status(201).json({ message: 'User created successfully', user: data.user });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.signUpController = signUpController;
const logInController = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const data = await (0, authService_1.logIn)(email, password);
        return res.status(200).json({
            message: 'Logged in successfully',
            user: data.user,
            session: data.session
        });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.logInController = logInController;
