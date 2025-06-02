"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullTrace = void 0;
const db_1 = require("../aws/db");
const getFullTrace = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mac } = req.params;
        const ioConn = yield db_1.pool.query('SELECT * FROM nflexon_app.io_connectivity WHERE io_mac = $1', [mac]);
        const ppConn = yield db_1.pool.query('SELECT * FROM nflexon_app.pp_connectivity WHERE io_mac = $1', [mac]);
        res.json({ ioConnectivity: ioConn.rows, ppConnectivity: ppConn.rows });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to trace connectivity' });
    }
});
exports.getFullTrace = getFullTrace;
