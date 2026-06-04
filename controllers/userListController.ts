import { Request, Response } from 'express';
import { getUserLists } from '../services/userListsService';


export const getUserListsController = async (req:Request, res:Response) => {
    const userId = req.user!.id;
    console.log("hit controller")
    try {
        const data = await getUserLists(userId);
        return res.status(200).json({message: "successfully got data", data})
    } catch (error: any) {
        console.log(error.message);
        return res.status(400).json({ error: error.message, data: null });
    }

}
