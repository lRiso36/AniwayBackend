"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userListController_1 = require("../controllers/userListController");
const router = (0, express_1.Router)();
router.get("/userlists", userListController_1.getUserListsController);
exports.default = router;
