import { Request, Response } from 'express';
import { searchAnime, getAnimeById, } from '../services/animeService';

export const searchAnimeController = async (req:Request, res:Response) => {
    const query = req.query.query as string;
    if (!query) {
        return res.status(400).json({error: "no query" });
    }
    if (!query.trim()) {
        return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    try {
        const data = await searchAnime(normalizedQuery);
        return res.status(200).json({message: "sucess!", results: data})
    }catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}

export const getAnimeByIdController = async (req:Request, res: Response ) => {
    const id = Number(req.params.id)

    if(!id) {
        return res.status(400).json({error: 'No id given'})
    }

    try {
        const data = await getAnimeById(id);
        if (!data) {
            return res.status(404).json({error: 'Anime not found'})
        }
        return res.status(200).json({results: data})
    } catch (error: any){
        return res.status(400).json({error: error.message})
    }
}
