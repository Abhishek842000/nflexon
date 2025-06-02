import express from 'express';
import { getIoLocation, getIoConnectivity } from '../controllers/io';
import { getPpLocation, getPpConnectivity } from '../controllers/pp';
import { getSwitchConnections } from '../controllers/switch';
import { getFullTrace } from '../controllers/trace';

const router = express.Router();

// API-level logger
router.use((req, res, next) => {
  console.log(`[API ROUTER LOG] ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/io-location/:mac', getIoLocation);
router.get('/io-connectivity/:mac', getIoConnectivity);
router.get('/pp-location/:serial', getPpLocation);
router.get('/pp-connectivity/:serial', getPpConnectivity);
router.get('/switch', getSwitchConnections);
router.get('/trace/:mac', getFullTrace);

export default router;