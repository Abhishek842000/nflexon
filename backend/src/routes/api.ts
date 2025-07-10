import express, { RequestHandler } from 'express';
import { getIoLocation, getIoConnectivity, saveIoLocation } from '../controllers/io';
import { getPpLocation, getPpConnectivity, savePpLocation, autoConnectPPs, getPpConnectivityByIoMac } from '../controllers/pp';
import { getSwitchConnections } from '../controllers/switch';
import { getFullTrace } from '../controllers/trace';
import { getConnectivityMap } from '../controllers/connectivityMap';
import { getAllIoLocations, getAllPpLocations } from '../controllers/io';

const router = express.Router();

// API-level logger
router.use((req, res, next) => {
  console.log(`[API ROUTER LOG] ${req.method} ${req.originalUrl}`);
  next();
});

// IO routes
router.get('/io-location/all', getAllIoLocations as RequestHandler);
router.get('/io-location/:mac', getIoLocation as RequestHandler);
router.get('/io-connectivity/:mac', getIoConnectivity as RequestHandler);
router.post('/io-location', saveIoLocation as RequestHandler);

// PP routes
router.get('/pp-location/all', getAllPpLocations as RequestHandler);
router.get('/pp-location/:serial', getPpLocation as RequestHandler);
router.get('/pp-connectivity/serial/:serial', getPpConnectivity as RequestHandler);
router.get('/pp-connectivity/io_mac/:io_mac', getPpConnectivityByIoMac as RequestHandler);
router.post('/pp-location', savePpLocation as RequestHandler);

// Auto-connectivity route
router.post('/auto-connectivity', autoConnectPPs as RequestHandler);

// Other routes
router.get('/switch', getSwitchConnections as RequestHandler);
router.get('/trace/:mac', getFullTrace as RequestHandler);
router.get('/connectivity-map', getConnectivityMap as RequestHandler);

export default router;