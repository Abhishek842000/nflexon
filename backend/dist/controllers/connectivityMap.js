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
exports.getConnectivityMap = void 0;
const db_1 = require("../aws/db");
const getConnectivityMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        let query = `
      SELECT 
        pp_serial_no,
        ru,
        pp_port,
        io_mac,
        io_port,
        io_type,
        device,
        device_mac,
        switch_name,
        switch_port
      FROM nflexon_app.connectivity_map
      WHERE 1=1
    `;
        const params = [];
        if (type === 'PP') {
            const { pp_serial_no, ru, port } = req.query;
            query += ` AND pp_serial_no = $1 AND ru = $2 AND pp_port = $3`;
            params.push(pp_serial_no, ru, port);
        }
        else if (type === 'IO') {
            const { io_mac, io_port } = req.query;
            query += ` AND io_mac = $1 AND io_port = $2`;
            params.push(io_mac, io_port);
        }
        const result = yield db_1.pool.query(query, params);
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No connectivity information found'
            });
            return;
        }
        res.json({
            success: true,
            data: result.rows
        });
        return;
    }
    catch (error) {
        console.error('Error fetching connectivity map:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }
});
exports.getConnectivityMap = getConnectivityMap;
