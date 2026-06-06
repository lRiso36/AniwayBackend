"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnimeById = exports.searchAnime = void 0;
const supabase_1 = __importDefault(require("../supabase"));
const SEARCH_QUERY = `
    query ($search: String) {
        Page(perPage: 20) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
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
`;
const ANIME_DETAIL_QUERY = `
    query ($id: Int) {
    Media(id: $id, type: ANIME) {
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
        characters(sort: ROLE) {
            edges {
                role
                node {
                    id
                    name {
                        full
                    }
                    image {
                        large
                    }
                }
                voiceActors {
                    id
                    name {
                        full
                    }
                    language
                    image {
                        large
                    }
                }
            }
        }
    }
}
`;
//query search_cache table, if query matches any query in table get its id back
const searchAnime = async (query) => {
    const { data: cachedSearch, error: cachedSearchError } = await supabase_1.default
        .from('search_cache')
        .select('id')
        .eq('query', query)
        .maybeSingle();
    // if theres an error, log but dont throw bc it might just go to API search next
    if (cachedSearchError) {
        console.error(cachedSearchError);
    }
    //if cached search, get any anilist_id with the matching search_cache id
    if (cachedSearch) {
        const { data: cachedAnimes, error: cachedAnimesError } = await supabase_1.default
            .from('search_cache_anime')
            .select('anilist_id')
            .eq('search_cache_id', cachedSearch.id);
        //if error, dont throw yet might fallback on API still
        if (cachedAnimesError) {
            console.error(cachedAnimesError);
        }
        if (cachedAnimes && cachedAnimes.length > 0) {
            //anilistIds should be array of cachedAnimes anilist_ids
            const anilistIds = cachedAnimes.map((row) => row.anilist_id);
            //animeData is array of anime of anime objects with ids that match anilistId
            const { data: animeData, error: animeDataError } = await supabase_1.default
                .from('anime')
                .select('*')
                .in('anilist_id', anilistIds);
            //its a problem if theres corresponding anilist_ids to cache but they have no anime data
            if (animeDataError) {
                throw animeDataError;
            }
            //if there is animeData, return an array of anime objects with all data correctly mapped
            if (animeData && animeData.length > 0) {
                const { data: genreData, error: genreError } = await supabase_1.default
                    .from('anime_genres')
                    .select('anilist_id, genre')
                    .in('anilist_id', anilistIds);
                if (genreError)
                    throw genreError;
                const results = animeData.map((anime) => ({
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
                }));
                return results;
            } /// end of animeData if
        } //end of cachedAnime if
    } // end of cachedSearch if
    //IF THERES NO STORED QUERIES
    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: query } })
        };
        const response = await fetch('https://graphql.anilist.co', options);
        if (!response.ok) {
            throw new Error("Anilist request failed");
        }
        const data = await response.json();
        if (!data?.data?.Page?.media) {
            throw new Error('Invalid Anilist response');
        }
        const results = data.data.Page.media.map((anime) => ({
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
        }));
        const { error: animeUpsertError } = await supabase_1.default
            .from('anime')
            .upsert(toInsertAnimes, { onConflict: 'anilist_id' });
        //if you cant upsert animes, no point in anything after
        if (animeUpsertError) {
            throw animeUpsertError;
        }
        // insert query into search query and store it so you can get id
        const { data: searchCacheData, error: searchCacheError } = await supabase_1.default
            .from('search_cache')
            .upsert({ query: query }, { onConflict: 'query' })
            .select()
            .single();
        //if search cache fails to create new row, stop 
        if (searchCacheError) {
            throw searchCacheError;
        }
        if (!searchCacheData) {
            throw new Error('Failed to create search cache');
        }
        //insert animes into search cache animes so you can get query and animes response
        const toInsertSearchCacheAnimes = results.map((anime) => ({
            search_cache_id: searchCacheData.id,
            anilist_id: anime.anilistId,
        }));
        await supabase_1.default
            .from('search_cache_anime')
            .upsert(toInsertSearchCacheAnimes, { onConflict: 'search_cache_id,anilist_id' });
        const toInsertGenres = results.flatMap(anime => (anime.genres.map(genre => ({
            anilist_id: anime.anilistId,
            genre: genre
        }))));
        await supabase_1.default
            .from('anime_genres')
            .upsert(toInsertGenres, { onConflict: 'anilist_id,genre' });
        return results;
    }
    catch (err) {
        console.error('Failed to search anime:', err);
        return [];
    }
};
exports.searchAnime = searchAnime;
//get anime by id and all infor for details page. check cache first them api call
const getAnimeById = async (id) => {
    //get cached anime data for corresponding anilist id
    const { data: cachedAnimeData, error: cachedAnimeDataError } = await supabase_1.default
        .from('anime')
        .select('*')
        .eq('anilist_id', id)
        .maybeSingle();
    //log but fall through to anilist
    if (cachedAnimeDataError) {
        console.error(cachedAnimeDataError);
    }
    if (cachedAnimeData) {
        // get genre data for anime
        const { data: genreData, error: genreError } = await supabase_1.default
            .from('anime_genres')
            .select('anilist_id, genre')
            .eq('anilist_id', id);
        if (genreError)
            throw genreError;
        //returns array of character objects
        const { data: cachedCharacters, error: cachedCharactersError } = await supabase_1.default
            .from('characters')
            .select('*')
            .eq('anime_anilist_id', cachedAnimeData.anilist_id);
        //if error dont throw we can handle it
        if (cachedCharactersError) {
            console.error(cachedCharactersError);
        }
        //get array of characterIds
        const characterIds = cachedCharacters?.map((character) => character.id) ?? [];
        //get voice actors if theres a list of character ids
        const { data: cachedVoiceActors, error: cachedVoiceActorsError } = characterIds.length > 0
            ? await supabase_1.default.from('voice_actors')
                .select('*')
                .in('character_id', characterIds)
            : { data: [], error: null };
        if (cachedVoiceActorsError) {
            console.error(cachedVoiceActorsError);
        }
        //get characters if theres cached Characters
        const characters = (cachedCharacters ?? []).map((character) => ({
            id: character.character_anilist_id,
            name: character.name,
            role: character.role,
            image: character.image,
            voiceActors: (cachedVoiceActors ?? [])
                .filter((actor) => actor.character_id === character.id)
                .map((a) => ({
                id: a.voice_actor_anilist_id,
                name: a.name,
                language: a.language,
                image: a.image,
            }))
        }));
        return {
            anilistId: cachedAnimeData.anilist_id,
            idMal: cachedAnimeData.mal_id,
            title: {
                english: cachedAnimeData.title_english,
                romaji: cachedAnimeData.title_romaji,
            },
            coverImage: {
                large: cachedAnimeData.cover_large,
                extraLarge: cachedAnimeData.cover_extra_large,
            },
            bannerImage: cachedAnimeData.banner_image,
            year: cachedAnimeData.year,
            episodes: cachedAnimeData.episodes,
            genres: genreData?.map(g => g.genre) ?? [],
            description: cachedAnimeData.description,
            characters,
        }; // end of return
    } // end of data if
    //if no t cached, fetch from anilist
    try {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: ANIME_DETAIL_QUERY, variables: { id: id } })
        };
        const response = await fetch('https://graphql.anilist.co', options);
        if (!response.ok) {
            throw new Error("ANilist request failed");
        }
        const data = await response.json();
        if (!data?.data?.Media) {
            throw new Error('Invalid Anilist response');
        }
        const anime = data.data.Media;
        const result = {
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
            characters: anime.characters.edges.map((edge) => ({
                id: edge.node.id,
                name: edge.node.name.full,
                role: edge.role,
                image: edge.node.image.large,
                voiceActors: edge.voiceActors
                    .filter((actor) => actor.language === 'JAPANESE' || actor.language === 'ENGLISH')
                    .map((actor) => ({
                    id: actor.id,
                    name: actor.name.full,
                    language: actor.language,
                    image: actor.image.large,
                }))
            }))
        };
        const toInsertAnime = {
            anilist_id: result.anilistId,
            mal_id: anime.idMal,
            title_english: result.title.english,
            title_romaji: result.title.romaji,
            cover_large: result.coverImage.large,
            cover_extra_large: result.coverImage.extraLarge,
            banner_image: result.bannerImage,
            year: result.year,
            episodes: result.episodes,
            description: result.description,
            cached_at: new Date().toISOString(),
        };
        const { error: animeUpsertError } = await supabase_1.default
            .from('anime')
            .upsert(toInsertAnime, { onConflict: 'anilist_id' });
        //if you cant upsert animes, no point in anything after
        if (animeUpsertError) {
            throw animeUpsertError;
        }
        const toInsertGenres = result.genres.map(genre => ({
            anilist_id: result.anilistId,
            genre: genre
        }));
        await supabase_1.default
            .from('anime_genres')
            .upsert(toInsertGenres, { onConflict: 'anilist_id,genre' });
        const toInsertCharacters = result.characters.map((character) => ({
            character_anilist_id: character.id,
            anime_anilist_id: result.anilistId,
            name: character.name,
            role: character.role,
            image: character.image,
        }));
        const { error: characterUpsertError } = await supabase_1.default
            .from('characters')
            .upsert(toInsertCharacters, { onConflict: 'character_anilist_id,anime_anilist_id' });
        if (characterUpsertError) {
            throw characterUpsertError;
        }
        //we need to get gay uuid from characters table
        const characterIds = result.characters.map(c => c.id);
        const { data: insertedCharacters, error: insertedCharactersError } = await supabase_1.default
            .from('characters')
            .select('id, character_anilist_id')
            .in('character_anilist_id', characterIds);
        if (insertedCharactersError) {
            throw insertedCharactersError;
        }
        if (insertedCharacters) {
            //insert voice actors into cache
            //need flat map because several voice actors per character possibly
            const toInsertVoiceActors = result.characters.flatMap((character) => {
                const newCharacterId = insertedCharacters.find((c) => (c.character_anilist_id === character.id));
                if (!newCharacterId)
                    return [];
                return character.voiceActors.map((actor) => ({
                    voice_actor_anilist_id: actor.id,
                    character_id: newCharacterId.id,
                    name: actor.name,
                    language: actor.language,
                    image: actor.image,
                }));
            }); // end of insert voiceactors flat map
            const { error: upsertVoiceActorsError } = await supabase_1.default
                .from('voice_actors')
                .upsert(toInsertVoiceActors, { onConflict: 'character_id,voice_actor_anilist_id' });
            if (upsertVoiceActorsError) {
                throw upsertVoiceActorsError;
            }
        } // end of inserted characters if
        return result;
    }
    catch (error) {
        console.error('Failed to search anime:', error);
        return null;
    }
};
exports.getAnimeById = getAnimeById;
