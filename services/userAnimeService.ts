import { use } from 'react';
import supabase from '../supabase';

type UserAnimeStatus = "watching" | "completed" | "plan-to-watch";

//with userId, get userAnimes and their correspondng anime data
export const getUserAnimes = async(
    userId: string
) => {
    const {data: userAnimeData, error} = await supabase
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
    .eq('user_id', userId)

    if (error) throw error;
    if (!userAnimeData) return [];

    return userAnimeData.map((row: any) => ({
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
}



//when user clicks log, they can pick status and current episode if status is watching

export const logAnime = async (
    userId: string,
    anilistId: number,
    status: UserAnimeStatus,
    currentEpisode?: number,
    episodes?: number | null,
    score?: number | null,
): Promise<void> => {
const insertEpisode = currentEpisode ?? (status === 'completed' ? (episodes ?? 0) : 0)
    const {error} = await supabase
    .from('user_anime')
    .upsert({
        user_id: userId,
        anilist_id: anilistId,
        status: status,
        current_episode: insertEpisode,
        score: score,
    },{onConflict: 'user_id,anilist_id'})

    if(error) {
        throw error; 
    }
}
//give episodes so that if you add to favorites and not in list yet,
//it adds it as completed with current episdoe as last episode
export const toggleIsFavorite = async (userId: string, anilistId:number, episodes: number | null) => {
    const {data, error} = await supabase
    .from('user_anime')
    .select('is_favorite')
    .eq('anilist_id', anilistId)
    .eq('user_id', userId)
    .maybeSingle()

    if (error) throw error;
    if (!data) {
        const {error: upsertError} = await supabase
        .from('user_anime')
        .upsert({
            user_id: userId,
            anilist_id: anilistId,
            status: 'completed',
            is_favorite: true,
            current_episode: episodes ?? 0
        }, {onConflict: 'user_id,anilist_id'})
        
        if (upsertError) throw upsertError;
        return;
    }


    const toInsert = !data.is_favorite;

    const {error: insertError} = await supabase
    .from('user_anime')
    .update({is_favorite: toInsert})
    .eq('user_id', userId)
    .eq('anilist_id', anilistId)

    if (insertError) throw insertError;
}

export const removeAnime = async (userId:string, anilistId:number) => {
    const {error} = await supabase
    .from('user_anime')
    .delete()
    .eq('user_id', userId)
    .eq('anilist_id', anilistId)

    if (error) throw error;
}