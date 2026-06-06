"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAnimeController = exports.toggleIsFavoriteController = exports.logAnimeController = exports.getAnimeController = void 0;
const userAnimeService_1 = require("../services/userAnimeService");
const getAnimeController = async (req, res) => {
    const userId = req.user.id;
    try {
        const data = await (0, userAnimeService_1.getUserAnimes)(userId);
        return res.status(200).json({ message: "successfully got data", data });
    }
    catch (error) {
        return res.status(400).json({ error: error.message, data: null });
    }
};
exports.getAnimeController = getAnimeController;
const logAnimeController = async (req, res) => {
    const { anilistId, status, currentEpisode, episodes, score } = req.body;
    const userId = req.user.id;
    console.log('body', req.body);
    if (!anilistId || !status) {
        return res.status(400).json({ error: "anilist and status are required" });
    }
    try {
        await (0, userAnimeService_1.logAnime)(userId, anilistId, status, currentEpisode, episodes, score);
        return res.status(200).json({ message: 'Anime logged successfully' });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.logAnimeController = logAnimeController;
const toggleIsFavoriteController = async (req, res) => {
    const { anilistId, episodes } = req.body;
    //! means its def not null 
    const userId = req.user.id;
    if (!anilistId) {
        return res.status(400).json({ error: "anilist is required" });
    }
    try {
        await (0, userAnimeService_1.toggleIsFavorite)(userId, anilistId, episodes);
        return res.status(200).json({ message: 'Is favorite toggled' });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.toggleIsFavoriteController = toggleIsFavoriteController;
const removeAnimeController = async (req, res) => {
    const { anilistId } = req.body;
    const userId = req.user.id;
    if (!anilistId) {
        return res.status(400).json({ error: "anilist is required" });
    }
    try {
        await (0, userAnimeService_1.removeAnime)(userId, anilistId);
        return res.status(200).json({ message: 'Anime removed' });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.removeAnimeController = removeAnimeController;
