import { Request, Response } from 'express';
import { signUp, logIn } from '../services/authService';

export const signUpController = async (req: Request, res: Response) => {
    const {username, email, password} = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    try {
        const data = await signUp(username, email, password);
        return res.status(201).json({ message: 'User created successfully', user: data.user });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

export const logInController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try { 
        const data = await logIn(email, password);
        return res.status(200).json({ 
            message: 'Logged in successfully', 
            user: data.user,
            session: data.session 
        });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}