import { Router } from 'express';
import { searchAnimeController, getAnimeByIdController} from '../controllers/animeController';

const router = Router();

//search for anime
router.get("/search", searchAnimeController);

router.get('/:id', getAnimeByIdController)

export default router;