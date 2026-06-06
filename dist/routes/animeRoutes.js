"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const animeController_1 = require("../controllers/animeController");
const router = (0, express_1.Router)();
//search for anime
router.get("/search", animeController_1.searchAnimeController);
router.get('/:id', animeController_1.getAnimeByIdController);
exports.default = router;
