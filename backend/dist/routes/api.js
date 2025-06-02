"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const io_1 = require("../controllers/io");
const pp_1 = require("../controllers/pp");
const switch_1 = require("../controllers/switch");
const trace_1 = require("../controllers/trace");
const router = express_1.default.Router();
// API-level logger
router.use((req, res, next) => {
    console.log(`[API ROUTER LOG] ${req.method} ${req.originalUrl}`);
    next();
});
router.get('/io-location/:mac', io_1.getIoLocation);
router.get('/io-connectivity/:mac', io_1.getIoConnectivity);
router.get('/pp-location/:serial', pp_1.getPpLocation);
router.get('/pp-connectivity/:serial', pp_1.getPpConnectivity);
router.get('/switch', switch_1.getSwitchConnections);
router.get('/trace/:mac', trace_1.getFullTrace);
exports.default = router;
