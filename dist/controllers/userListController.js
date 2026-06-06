"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserListsController = void 0;
const userListsService_1 = require("../services/userListsService");
const getUserListsController = async (req, res) => {
    const userId = req.user.id;
    console.log("hit controller");
    try {
        const data = await (0, userListsService_1.getUserLists)(userId);
        return res.status(200).json({ message: "successfully got data", data });
    }
    catch (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message, data: null });
    }
};
exports.getUserListsController = getUserListsController;
