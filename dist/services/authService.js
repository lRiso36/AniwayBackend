"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logIn = exports.signUp = void 0;
const supabase_1 = __importDefault(require("../supabase"));
const signUp = async (username, email, password) => {
    const { data, error } = await supabase_1.default.auth.signUp({
        email, password
    });
    if (error)
        throw error;
    const { error: userError } = await supabase_1.default
        .from('users')
        .insert({ id: data.user?.id, username });
    if (userError)
        throw userError;
    return data;
};
exports.signUp = signUp;
const logIn = async (email, password) => {
    //tells supa to check if email and password match an existing user
    const { data, error } = await supabase_1.default.auth.signInWithPassword({ email, password });
    if (error)
        throw error;
    return data;
};
exports.logIn = logIn;
