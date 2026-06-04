import { Request, Response } from 'express';
import { getTrending, getTopRated, getTrendingMovies, getHiddenGems } from '../services/animeGroupsService';

export const getTrendingController = async (req:Request, res: Response ) => {
    try {
        const data = await getTrending();
        if(!data) {
            return res.status(404).json({error: 'Trending anime not found'})
        }
        return res.status(200).json({results: data})
    } catch (error: any) {
        return res.status(400).json({error: error.message})
    }
}

export const getTopRatedController = async (req:Request, res: Response ) => {
    try {
        const data = await getTopRated();
        if(!data) {
            return res.status(404).json({error: 'Top rated anime not found'})
        }
        return res.status(200).json({results: data})
    } catch (error: any) {
        return res.status(400).json({error: error.message})
    }
}

export const getTrendingMoviesController = async (req:Request, res: Response ) => {
    try {
        const data = await getTrendingMovies();
        if(!data) {
            return res.status(404).json({error: 'Trending Movies not found'})
        }
        return res.status(200).json({results: data})
    } catch (error: any) {
        return res.status(400).json({error: error.message})
    }
}

export const getHiddenGemsController = async (req:Request, res: Response ) => {
    try {
        const data = await getHiddenGems();
        if(!data) {
            return res.status(404).json({error: 'Hidden gems not found'})
        }
        return res.status(200).json({results: data})
    } catch (error: any) {
        return res.status(400).json({error: error.message})
    }
}