import supabase from "../supabase";

export const getUserLists = async (userId: string) => {

    const {data: userListData, error} = await supabase
    .from('user_lists')
    .select(`*`)
    .eq('user_id', userId)

    if (error) throw error;
    if (!userListData) return [];

    return userListData.map((row:any) => ({
        id: row.id,
        userId: userId,
        name: row.name,
        description: row.description,
        isPublic: row.is_public,
        coverImage: row.cover_image,
        animeCount: row.anime_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }))
}