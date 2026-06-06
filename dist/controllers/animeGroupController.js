"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHiddenGemsController = exports.getTrendingMoviesController = exports.getTopRatedController = exports.getTrendingController = void 0;
const animeGroupsService_1 = require("../services/animeGroupsService");
const getTrendingController = async (req, res) => {
    try {
        const data = await (0, animeGroupsService_1.getTrending)();
        if (!data) {
            return res.status(404).json({ error: 'Trending anime not found' });
        }
        return res.status(200).json({ results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.getTrendingController = getTrendingController;
const getTopRatedController = async (req, res) => {
    try {
        const data = await (0, animeGroupsService_1.getTopRated)();
        if (!data) {
            return res.status(404).json({ error: 'Top rated anime not found' });
        }
        return res.status(200).json({ results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.getTopRatedController = getTopRatedController;
const getTrendingMoviesController = async (req, res) => {
    try {
        const data = await (0, animeGroupsService_1.getTrendingMovies)();
        if (!data) {
            return res.status(404).json({ error: 'Trending Movies not found' });
        }
        return res.status(200).json({ results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.getTrendingMoviesController = getTrendingMoviesController;
const getHiddenGemsController = async (req, res) => {
    try {
        const data = await (0, animeGroupsService_1.getHiddenGems)();
        if (!data) {
            return res.status(404).json({ error: 'Hidden gems not found' });
        }
        return res.status(200).json({ results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.getHiddenGemsController = getHiddenGemsController;
