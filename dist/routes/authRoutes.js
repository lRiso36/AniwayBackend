"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
//create account
router.post('/signup', authController_1.signUpController);
//login and retreive session
router.post('/login', authController_1.logInController);
exports.default = router;
