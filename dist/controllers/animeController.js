"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnimeByIdController = exports.searchAnimeController = void 0;
const animeService_1 = require("../services/animeService");
const searchAnimeController = async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: "no query" });
    }
    if (!query.trim()) {
        return [];
    }
    const normalizedQuery = query.trim().toLowerCase();
    try {
        const data = await (0, animeService_1.searchAnime)(normalizedQuery);
        return res.status(200).json({ message: "sucess!", results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.searchAnimeController = searchAnimeController;
const getAnimeByIdController = async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'No id given' });
    }
    try {
        const data = await (0, animeService_1.getAnimeById)(id);
        if (!data) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        return res.status(200).json({ results: data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.getAnimeByIdController = getAnimeByIdController;
