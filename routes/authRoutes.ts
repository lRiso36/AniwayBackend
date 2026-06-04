import { Router } from 'express';
import { signUpController, logInController } from '../controllers/authController';

const router = Router();

//create account
router.post('/signup', signUpController);

//login and retreive session
router.post('/login', logInController);

export default router;