import { Request, Response } from 'express';
import { logAnime, toggleIsFavorite, removeAnime, getUserAnimes } from '../services/userAnimeService';

export const getAnimeController = async (req:Request, res:Response) => {
    const userId = req.user!.id;

    try {
        const data = await getUserAnimes(userId);
        return res.status(200).json({message: "successfully got data", data})
    } catch (error: any) {
        return res.status(400).json({ error: error.message, data: null });
    }

}

export const logAnimeController = async (req:Request, res:Response) => {
    const { anilistId, status, currentEpisode, episodes, score } = req.body;
    const userId = req.user!.id;

    console.log('body', req.body);
    if(!anilistId || !status) {
        return res.status(400).json({error: "anilist and status are required" });
    }

    try {
        await logAnime(userId, anilistId, status, currentEpisode, episodes, score);
        return res.status(200).json({message: 'Anime logged successfully'});
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
    
}

export const toggleIsFavoriteController = async (req:Request, res:Response) => {
    const {anilistId, episodes} = req.body;
    //! means its def not null 
    const userId = req.user!.id;

    if(!anilistId) {
        return res.status(400).json({error: "anilist is required"})
    }

    try {
        await toggleIsFavorite(userId, anilistId, episodes);
        return res.status(200).json({message: 'Is favorite toggled'});
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}

export const removeAnimeController = async (req:Request, res:Response) => {
    const {anilistId} = req.body;
    const userId = req.user!.id;

    if(!anilistId) {
        return res.status(400).json({error: "anilist is required"})
    }

    try {
        await removeAnime(userId, anilistId);
        return res.status(200).json({message: 'Anime removed'});
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}