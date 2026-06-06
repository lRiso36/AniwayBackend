"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLists = void 0;
const supabase_1 = __importDefault(require("../supabase"));
const getUserLists = async (userId) => {
    const { data: userListData, error } = await supabase_1.default
        .from('user_lists')
        .select(`*`)
        .eq('user_id', userId);
    if (error)
        throw error;
    if (!userListData)
        return [];
    return userListData.map((row) => ({
        id: row.id,
        userId: userId,
        name: row.name,
        description: row.description,
        isPublic: row.is_public,
        coverImage: row.cover_image,
        animeCount: row.anime_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
};
exports.getUserLists = getUserLists;
