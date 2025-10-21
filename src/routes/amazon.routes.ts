import { Router } from 'express';
import { AmazonController } from '../controllers/amazon.controllers';
import { authenticateUser } from '../middleware';

const router = Router();
const amazonController = new AmazonController();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Products routes
router.get('/products', amazonController.getProducts);
router.get('/products/next', amazonController.getNextPage);
router.get('/products/previous', amazonController.getPreviousPage);

// Single product routes
router.get('/product/:asin', amazonController.getProduct);
router.get('/product/:asin/offers', amazonController.getProductOffers);
router.get('/product/:asin/fees', amazonController.getFeesEstimate);

// Authentication routes
router.post('/auth/validate', amazonController.validateCredentials);

export { router as amazonRoutes };