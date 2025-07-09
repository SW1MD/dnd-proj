"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dice_1 = require("../controllers/dice");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/roll', dice_1.diceController.rollDice);
router.get('/history', auth_1.authenticate, dice_1.diceController.getDiceHistory);
exports.default = router;
//# sourceMappingURL=dice.js.map