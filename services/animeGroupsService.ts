import { cache } from 'react';
import supabase from '../supabase';

type AnimeType = {
    anilistId: number
    idMal: number | null
    title: {
        english: string | null
        romaji: string
    }
    coverImage: {
        large: string
        extraLarge: string | null
    }
    bannerImage: string | null
    year: number | null
    episodes: number | null
    genres: string[]
    description: string | null
}

type VoiceActor = {
    id: number
    name: string
    language: string
    image: string | null
}

type Character = {
    id: number
    name: string
    role: string
    image: string | null
    voiceActors: VoiceActor[]
}

type AnimeDetailType = AnimeType & {
    characters: Character[]
}

const TRENDING_QUERY = `
    query {
        Page(perPage: 25) {
            media(type: ANIME, sort: TRENDING_DESC) {
                id
                idMal
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                startDate {
                    year
                }
                episodes
                genres
                description
            }
        }
    }
`

const TOP_RATED_QUERY = `
    query {
        Page(perPage: 25) {
            media(type: ANIME, sort: SCORE_DESC) {
                id
                idMal
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                startDate {
                    year
                }
                episodes
                genres
                description
            }
        }
    }
`
const TRENDING_MOVIES_QUERY = `
    query {
        Page(perPage: 30) {
            media(type: ANIME, format: MOVIE, sort: TRENDING_DESC) {
                id
                idMal
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                startDate {
                    year
                }
                episodes
                genres
                description
            }
        }
    }
`

const HIDDEN_GEMS_QUERY = `
    query {
        Page(perPage: 50) {
            media(type: ANIME, averageScore_greater: 80, popularity_lesser: 30000, sort: SCORE_DESC) {
                id
                idMal
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                startDate {
                    year
                }
                episodes
                genres
                description
            }
        }
    }
`

export const getTrending = async () => {

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    //get one entry that was less than one day ago
    const {data: cachedTrendingCheck, error: cachedTrendingCheckError} = await supabase
    .from('trending_cache')
    .select('cached_at')
    .gte('cached_at', oneDayAgo)
    .limit(1)

    if (cachedTrendingCheckError) console.error(cachedTrendingCheckError);

    if (cachedTrendingCheck && cachedTrendingCheck.length > 0) {
        const {data: cachedTrending, error: cachedTrendingError} = await supabase
        .from('trending_cache')
        .select('anilist_id')
        .order('rank', {ascending: true})

        if (cachedTrendingError) console.error(cachedTrendingError);

        if (cachedTrending && cachedTrending.length > 0) {
        const anilistIds = cachedTrending.map(row => row.anilist_id)

        const { data: animeData, error: animeDataError } = await supabase
        .from('anime')
        .select('*')
        .in('anilist_id', anilistIds)

        if (animeDataError) throw animeDataError;

        if (animeData && animeData.length > 0) {
            const {data: genreData, error: genreError} = await supabase
            .from('anime_genres')
            .select('anilist_id, genre')
            .in('anilist_id', anilistIds)

            if (genreError) console.error(genreError);

            return animeData.map((anime:any) => ({
                anilistId: anime.anilist_id,
                idMal: anime.mal_id,
                title: {
                    english: anime.title_english,
                    romaji: anime.title_romaji,
                },
                coverImage: {
                    large: anime.cover_large,
                    extraLarge: anime.cover_extra_large,
                },
                bannerImage: anime.banner_image,
                year: anime.year,
                episodes: anime.episodes,
                genres: genreData?.filter(g => g.anilist_id === anime.anilist_id).map(g => g.genre) ?? [],
                description: anime.description,
            }))
        } // end of animData if
        }//end of cachedTrending if
    } //end of chachedTrendingcheck if

    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({query: TRENDING_QUERY})
        }

        const response = await fetch('https://graphql.anilist.co', options);

        if (!response.ok) {
            throw new Error("Anilist request failed");
        }

        const data = await response.json();

        if(!data?.data?.Page?.media) {
            throw new Error ('Invalid Anilist response');
        }

       const results: AnimeType[] = data.data.Page.media.map((anime: any) => ({
            anilistId: anime.id,
            idMal: anime.idMal,
            title: {
                english: anime.title.english,
                romaji: anime.title.romaji,
            },
            coverImage: {
                large: anime.coverImage.large,
                extraLarge: anime.coverImage.extraLarge,
            },
            bannerImage: anime.bannerImage,
            year: anime.startDate.year,
            episodes: anime.episodes,
            genres: anime.genres,
            description: anime.description,
            })); 

        //insert all new animes to anime table
        const toInsertAnimes = results.map(anime => ({
            anilist_id: anime.anilistId,
            mal_id: anime.idMal,
            title_english: anime.title.english,
            title_romaji: anime.title.romaji,
            cover_large: anime.coverImage.large,
            cover_extra_large: anime.coverImage.extraLarge,
            banner_image: anime.bannerImage,
            year: anime.year,
            episodes: anime.episodes,
            description: anime.description,
            cached_at: new Date().toISOString(),
        }))

        const {error: animeUpsertError } = await supabase
        .from('anime')
        .upsert(toInsertAnimes, {onConflict: 'anilist_id'})

        //if you cant upsert animes, no point in anything after
        if(animeUpsertError) {
            throw animeUpsertError;
        }

        const toInsertGenres = results.flatMap(anime => ( 
            anime.genres.map(genre => ({
            anilist_id: anime.anilistId,
            genre: genre
            }))
        ));

        await supabase
        .from('anime_genres')
        .upsert(
        toInsertGenres,
        {onConflict: 'anilist_id,genre'}
        )

       const {error: deleteError} =  await supabase
        .from('trending_cache')
        .delete()
        .neq('id', 0)

        if (deleteError) throw deleteError

        const toInsertTrendingCache = results.map((anime, index) => ({
            anilist_id: anime.anilistId,
            rank: index + 1, 
        }))

        const {error: insertTrendiingError} = await supabase
        .from('trending_cache').insert(toInsertTrendingCache)

        if (insertTrendiingError) console.error(insertTrendiingError)

        return results;
    } catch (err) {
        console.error('Failed trending', err)
        return [];
    }

}

export const getTopRated = async () => {

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    //get one entry that was less than one week ago
    const {data: cachedTopRatedCheck, error: cachedTopRatedCheckError} = await supabase
    .from('top_rated_cache')
    .select('cached_at')
    .gte('cached_at', oneWeekAgo)
    .limit(1)

    if (cachedTopRatedCheckError) console.error(cachedTopRatedCheckError);

    if (cachedTopRatedCheck && cachedTopRatedCheck.length > 0) {
        const {data: cachedTopRated, error: cachedTopRatedError} = await supabase
        .from('top_rated_cache')
        .select('anilist_id')
        .order('rank', {ascending: true})

        if (cachedTopRatedError) console.error(cachedTopRatedError);

        if (cachedTopRated && cachedTopRated.length > 0) {
        const anilistIds = cachedTopRated.map(row => row.anilist_id)

        const { data: animeData, error: animeDataError } = await supabase
        .from('anime')
        .select('*')
        .in('anilist_id', anilistIds)

        if (animeDataError) throw animeDataError;

        if (animeData && animeData.length > 0) {
            const {data: genreData, error: genreError} = await supabase
            .from('anime_genres')
            .select('anilist_id, genre')
            .in('anilist_id', anilistIds)

            if (genreError) console.error(genreError);

            return animeData.map((anime:any) => ({
                anilistId: anime.anilist_id,
                idMal:anime.mal_id,
                title: {
                    english: anime.title_english,
                    romaji: anime.title_romaji,
                },
                coverImage: {
                    large: anime.cover_large,
                    extraLarge: anime.cover_extra_large,
                },
                bannerImage: anime.banner_image,
                year: anime.year,
                episodes: anime.episodes,
                genres: genreData?.filter(g => g.anilist_id === anime.anilist_id).map(g => g.genre) ?? [],
                description: anime.description,
            }))
        } // end of animData if
        }//end of cachedTrending if
    } //end of chachedTrendingcheck if

    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({query: TOP_RATED_QUERY})
        }

        const response = await fetch('https://graphql.anilist.co', options);

        if (!response.ok) {
            throw new Error("Anilist request failed");
        }

        const data = await response.json();

        if(!data?.data?.Page?.media) {
            throw new Error ('Invalid Anilist response');
        }

       const results: AnimeType[] = data.data.Page.media.map((anime: any) => ({
            anilistId: anime.id,
            idMal: anime.idMal,
            title: {
                english: anime.title.english,
                romaji: anime.title.romaji,
            },
            coverImage: {
                large: anime.coverImage.large,
                extraLarge: anime.coverImage.extraLarge,
            },
            bannerImage: anime.bannerImage,
            year: anime.startDate.year,
            episodes: anime.episodes,
            genres: anime.genres,
            description: anime.description,
            })); 

        //insert all new animes to anime table
        const toInsertAnimes = results.map(anime => ({
            anilist_id: anime.anilistId,
            mal_id: anime.idMal,
            title_english: anime.title.english,
            title_romaji: anime.title.romaji,
            cover_large: anime.coverImage.large,
            cover_extra_large: anime.coverImage.extraLarge,
            banner_image: anime.bannerImage,
            year: anime.year,
            episodes: anime.episodes,
            description: anime.description,
            cached_at: new Date().toISOString(),
        }))

        const {error: animeUpsertError } = await supabase
        .from('anime')
        .upsert(toInsertAnimes, {onConflict: 'anilist_id'})

        //if you cant upsert animes, no point in anything after
        if(animeUpsertError) {
            throw animeUpsertError;
        }

        const toInsertGenres = results.flatMap(anime => ( 
            anime.genres.map(genre => ({
            anilist_id: anime.anilistId,
            genre: genre
            }))
        ));

        await supabase
        .from('anime_genres')
        .upsert(
        toInsertGenres,
        {onConflict: 'anilist_id,genre'}
        )

       const {error: deleteError} =  await supabase
        .from('top_rated_cache')
        .delete()
        .neq('id', 0)

        if (deleteError) throw deleteError

        const toInsertTopRatedCache = results.map((anime, index) => ({
            anilist_id: anime.anilistId,
            rank: index + 1, 
        }))

        const {error: insertTopRatedError} = await supabase
        .from('top_rated_cache').insert(toInsertTopRatedCache)

        if (insertTopRatedError) console.error(insertTopRatedError);
        return results;
    } catch (err) {
        console.error('Failed top rated', err)
        return [];
    }

}

export const getTrendingMovies = async () => {

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    //get one entry that was less than one week ago
    const {data: cachedTrendingMoviesCheck, error: cachedTrendingMoviesCheckError} = await supabase
    .from('trending_movies_cache')
    .select('cached_at')
    .gte('cached_at', oneWeekAgo)
    .limit(1)

    if (cachedTrendingMoviesCheckError) console.error(cachedTrendingMoviesCheckError);

    if (cachedTrendingMoviesCheck && cachedTrendingMoviesCheck.length > 0) {
        const {data: cachedTrendingMovies, error: cachedTrendingMoviesError} = await supabase
        .from('trending_movies_cache')
        .select('anilist_id')
        .order('rank', {ascending: true})

        if (cachedTrendingMoviesError) console.error(cachedTrendingMoviesError);

        if (cachedTrendingMovies && cachedTrendingMovies.length > 0) {
        const anilistIds = cachedTrendingMovies.map(row => row.anilist_id)

        const { data: animeData, error: animeDataError } = await supabase
        .from('anime')
        .select('*')
        .in('anilist_id', anilistIds)

        if (animeDataError) throw animeDataError;

        if (animeData && animeData.length > 0) {
            const {data: genreData, error: genreError} = await supabase
            .from('anime_genres')
            .select('anilist_id, genre')
            .in('anilist_id', anilistIds)

            if (genreError) console.error(genreError);

            return animeData.map((anime:any) => ({
                anilistId: anime.anilist_id,
                idMal: anime.mal_id,
                title: {
                    english: anime.title_english,
                    romaji: anime.title_romaji,
                },
                coverImage: {
                    large: anime.cover_large,
                    extraLarge: anime.cover_extra_large,
                },
                bannerImage: anime.banner_image,
                year: anime.year,
                episodes: anime.episodes,
                genres: genreData?.filter(g => g.anilist_id === anime.anilist_id).map(g => g.genre) ?? [],
                description: anime.description,
            }))
        } // end of animData if
        }//end of cachedTrending if
    } //end of chachedTrendingcheck if

    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({query: TRENDING_MOVIES_QUERY})
        }

        const response = await fetch('https://graphql.anilist.co', options);

        if (!response.ok) {
            throw new Error("Anilist request failed");
        }

        const data = await response.json();

        if(!data?.data?.Page?.media) {
            throw new Error ('Invalid Anilist response');
        }

       const results: AnimeType[] = data.data.Page.media.map((anime: any) => ({
            anilistId: anime.id,
            idMal:anime.idMal,
            title: {
                english: anime.title.english,
                romaji: anime.title.romaji,
            },
            coverImage: {
                large: anime.coverImage.large,
                extraLarge: anime.coverImage.extraLarge,
            },
            bannerImage: anime.bannerImage,
            year: anime.startDate.year,
            episodes: anime.episodes,
            genres: anime.genres,
            description: anime.description,
            })); 

        //insert all new animes to anime table
        const toInsertAnimes = results.map(anime => ({
            anilist_id: anime.anilistId,
            mal_id: anime.idMal,
            title_english: anime.title.english,
            title_romaji: anime.title.romaji,
            cover_large: anime.coverImage.large,
            cover_extra_large: anime.coverImage.extraLarge,
            banner_image: anime.bannerImage,
            year: anime.year,
            episodes: anime.episodes,
            description: anime.description,
            cached_at: new Date().toISOString(),
        }))

        const {error: animeUpsertError } = await supabase
        .from('anime')
        .upsert(toInsertAnimes, {onConflict: 'anilist_id'})

        //if you cant upsert animes, no point in anything after
        if(animeUpsertError) {
            throw animeUpsertError;
        }

        const toInsertGenres = results.flatMap(anime => ( 
            anime.genres.map(genre => ({
            anilist_id: anime.anilistId,
            genre: genre
            }))
        ));

        await supabase
        .from('anime_genres')
        .upsert(
        toInsertGenres,
        {onConflict: 'anilist_id,genre'}
        )

       const {error: deleteError} =  await supabase
        .from('trending_movies_cache')
        .delete()
        .neq('id', 0)

        if (deleteError) throw deleteError

        const toInsertTrendingMoviesCache = results.map((anime, index) => ({
            anilist_id: anime.anilistId,
            rank: index + 1, 
        }))

        const {error: cacheInsertMoviesError} = await supabase
        .from('trending_movies_cache').insert(toInsertTrendingMoviesCache)

        if (cacheInsertMoviesError) console.error(cacheInsertMoviesError);

        return results;
    } catch (err) {
        console.error('Failed trending movies', err)
        return [];
    }

}

export const getHiddenGems = async () => {

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    //get one entry that was less than one week ago
    const {data: cachedHiddenGemsCheck, error: cachedHiddenGemsCheckError} = await supabase
    .from('hidden_gems_cache')
    .select('cached_at')
    .gte('cached_at', oneWeekAgo)
    .limit(1)

    if (cachedHiddenGemsCheckError) console.error(cachedHiddenGemsCheckError);

    if (cachedHiddenGemsCheck && cachedHiddenGemsCheck.length > 0) {
        const {data: cachedHiddenGems, error: cachedHiddenGemsError} = await supabase
        .from('hidden_gems_cache')
        .select('anilist_id')
        .order('rank', {ascending: true})

        if (cachedHiddenGemsError) console.error(cachedHiddenGemsError);

        if (cachedHiddenGems && cachedHiddenGems.length > 0) {
        const anilistIds = cachedHiddenGems.map(row => row.anilist_id)

        const { data: animeData, error: animeDataError } = await supabase
        .from('anime')
        .select('*')
        .in('anilist_id', anilistIds)

        if (animeDataError) throw animeDataError;

        if (animeData && animeData.length > 0) {
            const {data: genreData, error: genreError} = await supabase
            .from('anime_genres')
            .select('anilist_id, genre')
            .in('anilist_id', anilistIds)

            if (genreError) console.error(genreError);

            return animeData.map((anime:any) => ({
                anilistId: anime.anilist_id,
                idMal: anime.mal_id,
                title: {
                    english: anime.title_english,
                    romaji: anime.title_romaji,
                },
                coverImage: {
                    large: anime.cover_large,
                    extraLarge: anime.cover_extra_large,
                },
                bannerImage: anime.banner_image,
                year: anime.year,
                episodes: anime.episodes,
                genres: genreData?.filter(g => g.anilist_id === anime.anilist_id).map(g => g.genre) ?? [],
                description: anime.description,
            }))
        } // end of animData if
        }//end of cachedTrending if
    } //end of chachedTrendingcheck if

    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({query: HIDDEN_GEMS_QUERY})
        }

        const response = await fetch('https://graphql.anilist.co', options);

        if (!response.ok) {
            throw new Error("Anilist request failed");
        }

        const data = await response.json();

        if(!data?.data?.Page?.media) {
            throw new Error ('Invalid Anilist response');
        }

        // figure out shuffle

       const results: AnimeType[] = data.data.Page.media.map((anime: any) => ({
            anilistId: anime.id,
            idMal: anime.idMal,
            title: {
                english: anime.title.english,
                romaji: anime.title.romaji,
            },
            coverImage: {
                large: anime.coverImage.large,
                extraLarge: anime.coverImage.extraLarge,
            },
            bannerImage: anime.bannerImage,
            year: anime.startDate.year,
            episodes: anime.episodes,
            genres: anime.genres,
            description: anime.description,
            })); 

        // shuffle gems
            results.sort(() => Math.random() - 0.5);
            const selectedResults = results.slice(0, 20);

        //insert all new animes to anime table
        const toInsertAnimes = selectedResults.map(anime => ({
            anilist_id: anime.anilistId,
            mal_id: anime.idMal,
            title_english: anime.title.english,
            title_romaji: anime.title.romaji,
            cover_large: anime.coverImage.large,
            cover_extra_large: anime.coverImage.extraLarge,
            banner_image: anime.bannerImage,
            year: anime.year,
            episodes: anime.episodes,
            description: anime.description,
            cached_at: new Date().toISOString(),
        }))

        const {error: animeUpsertError } = await supabase
        .from('anime')
        .upsert(toInsertAnimes, {onConflict: 'anilist_id'})

        //if you cant upsert animes, no point in anything after
        if(animeUpsertError) {
            throw animeUpsertError;
        }

        const toInsertGenres = selectedResults.flatMap(anime => ( 
            anime.genres.map(genre => ({
            anilist_id: anime.anilistId,
            genre: genre
            }))
        ));

        await supabase
        .from('anime_genres')
        .upsert(
        toInsertGenres,
        {onConflict: 'anilist_id,genre'}
        )

       const {error: deleteError} =  await supabase
        .from('hidden_gems_cache')
        .delete()
        .neq('id', 0)

        if (deleteError) throw deleteError

        const toInsertHiddenGemsCache = selectedResults.map((anime, index) => ({
            anilist_id: anime.anilistId,
            rank: index + 1, 
        }))

        const { error: cacheInsertError }= await supabase
        .from('hidden_gems_cache').insert(toInsertHiddenGemsCache)

        if (cacheInsertError) console.error(cacheInsertError);

        return selectedResults;
    } catch (err) {
        console.error('Failed hidden gems ', err)
        return [];
    }

}