"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAnime = exports.toggleIsFavorite = exports.logAnime = exports.getUserAnimes = void 0;
const supabase_1 = __importDefault(require("../supabase"));
//with userId, get userAnimes and their correspondng anime data
const getUserAnimes = async (userId) => {
    const { data: userAnimeData, error } = await supabase_1.default
        .from('user_anime')
        .select(`*,
        anime (
            anilist_id,
            mal_id,
            title_english,
            title_romaji,
            cover_large,
            cover_extra_large,
            banner_image,
            year,
            episodes,
            description
        )
        `)
        .eq('user_id', userId);
    if (error)
        throw error;
    if (!userAnimeData)
        return [];
    return userAnimeData.map((row) => ({
        entry: {
            anilistId: row.anilist_id,
            status: row.status,
            currentEpisode: row.current_episode,
            score: row.score,
            startDate: row.start_date,
            finishDate: row.finish_date,
            isFavorite: row.is_favorite,
        },
        anime: {
            anilistId: row.anime.anilist_id,
            idMal: row.anime.mal_id,
            title: {
                english: row.anime.title_english,
                romaji: row.anime.title_romaji,
            },
            coverImage: {
                large: row.anime.cover_large,
                extraLarge: row.anime.cover_extra_large,
            },
            bannerImage: row.anime.banner_image,
            year: row.anime.year,
            episodes: row.anime.episodes,
            genres: [],
            description: row.anime.description,
        }
    }));
};
exports.getUserAnimes = getUserAnimes;
//when user clicks log, they can pick status and current episode if status is watching
const logAnime = async (userId, anilistId, status, currentEpisode, episodes, score) => {
    const insertEpisode = currentEpisode ?? (status === 'completed' ? (episodes ?? 0) : 0);
    const { error } = await supabase_1.default
        .from('user_anime')
        .upsert({
        user_id: userId,
        anilist_id: anilistId,
        status: status,
        current_episode: insertEpisode,
        score: score,
    }, { onConflict: 'user_id,anilist_id' });
    if (error) {
        throw error;
    }
};
exports.logAnime = logAnime;
//give episodes so that if you add to favorites and not in list yet,
//it adds it as completed with current episdoe as last episode
const toggleIsFavorite = async (userId, anilistId, episodes) => {
    const { data, error } = await supabase_1.default
        .from('user_anime')
        .select('is_favorite')
        .eq('anilist_id', anilistId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error)
        throw error;
    if (!data) {
        const { error: upsertError } = await supabase_1.default
            .from('user_anime')
            .upsert({
            user_id: userId,
            anilist_id: anilistId,
            status: 'completed',
            is_favorite: true,
            current_episode: episodes ?? 0
        }, { onConflict: 'user_id,anilist_id' });
        if (upsertError)
            throw upsertError;
        return;
    }
    const toInsert = !data.is_favorite;
    const { error: insertError } = await supabase_1.default
        .from('user_anime')
        .update({ is_favorite: toInsert })
        .eq('user_id', userId)
        .eq('anilist_id', anilistId);
    if (insertError)
        throw insertError;
};
exports.toggleIsFavorite = toggleIsFavorite;
const removeAnime = async (userId, anilistId) => {
    const { error } = await supabase_1.default
        .from('user_anime')
        .delete()
        .eq('user_id', userId)
        .eq('anilist_id', anilistId);
    if (error)
        throw error;
};
exports.removeAnime = removeAnime;
