"use strict";
require('dotenv').config(); // ✅ Load environment variables

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const api_1 = __importDefault(require("./routes/api"));

const app = (0, express_1.default)();

// Global request logger
app.use((req, res, next) => {
    console.log(`[APP LOG] ${req.method} ${req.originalUrl}`);
    next();
});

app.use((0, cors_1.default)());
app.use(express_1.default.json());

// Mount API routes
app.use('/api', api_1.default);

// Basic health check route
app.get('/ping', (req, res) => {
    res.send('pong');
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


