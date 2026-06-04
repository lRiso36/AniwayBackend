import supabase from '../supabase';

export const signUp = async (username: string, email: string, password: string) => {
    
    const {data, error} = await supabase.auth.signUp({
        email, password
    });
    if (error) throw error;

    const {error: userError} = await supabase
    .from('users')
    .insert({ id:data.user?.id, username});

    if (userError) throw userError;

    return data;
}

export const logIn = async (email: string, password: string) => {
   //tells supa to check if email and password match an existing user
    const { data, error } = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;

    return data;
}
