import { Router } from 'express';
import { getAnimeController, logAnimeController, toggleIsFavoriteController, removeAnimeController } from '../controllers/userAnimeController';

const router = Router();

router.post("/log", logAnimeController);
router.patch("/favorite", toggleIsFavoriteController);
router.delete("/remove", removeAnimeController);
router.get("/useranimes", getAnimeController);

export default router;