import { User } from '@supabase/supabase-js'

//saying that express might have a user value attatched to it as well 
declare global {
    //express already exists but we want to add user to it
    namespace Express {
        interface Request {
            user?: import('@supabase/supabase-js').User;
        }
    }
}
