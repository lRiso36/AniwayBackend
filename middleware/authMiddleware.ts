import { Request, Response, NextFunction } from 'express';
import supabase from '../supabase';

export const requireAuth = async (req:Request, res:Response, next:NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'No token provided'});
    }

    const token = authHeader.split(' ')[1];

    const {data, error} = await supabase.auth.getUser(token);
    console.log('auth error:', error);
    console.log('auth data:', data);
    
    if (error || !data.user) {
        return res.status(401).json({error: 'Invalid or expired token'});
    }

    req.user = data.user;
    next();
}