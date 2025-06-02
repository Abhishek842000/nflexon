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
exports.getIoConnectivity = exports.getIoLocation = void 0;
const db_1 = require("../aws/db");
const getIoLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mac } = req.params;
        console.log('Received MAC:', mac);
        const query = 'SELECT * FROM nflexon_app.io_location WHERE io_mac = $1';
        console.log('Running query:', query, 'with MAC:', mac);
        const result = yield db_1.pool.query(query, [mac]);
        console.log('Query result:', result.rows);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error in getIoLocation:', err);
        if (err instanceof Error) {
            res.status(500).json({
                error: 'Failed to get IO location',
                message: err.message,
                stack: err.stack,
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to get IO location',
                message: 'Unknown error occurred',
            });
        }
    }
});
exports.getIoLocation = getIoLocation;
const getIoConnectivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mac } = req.params;
        console.log('Received MAC for connectivity:', mac);
        const query = 'SELECT * FROM nflexon_app.io_connectivity WHERE io_mac = $1';
        console.log('Running query:', query, 'with MAC:', mac);
        const result = yield db_1.pool.query(query, [mac]);
        console.log('Query result:', result.rows);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error in getIoConnectivity:', err);
        if (err instanceof Error) {
            res.status(500).json({
                error: 'Failed to get IO connectivity',
                message: err.message,
                stack: err.stack,
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to get IO connectivity',
                message: 'Unknown error occurred',
            });
        }
    }
});
exports.getIoConnectivity = getIoConnectivity;
