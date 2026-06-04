import { Router } from 'express';
import { getTrendingController, getTopRatedController, getTrendingMoviesController, getHiddenGemsController } from '../controllers/animeGroupController';

const router = Router();

router.get("/trending", getTrendingController)
router.get("/top-rated", getTopRatedController)
router.get("/trending-movies", getTrendingMoviesController)
router.get("/hidden-gems", getHiddenGemsController);

export default router;

