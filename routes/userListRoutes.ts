import { Router } from 'express';
import { getUserListsController } from '../controllers/userListController';

const router = Router();


router.get("/userlists", getUserListsController);

export default router;