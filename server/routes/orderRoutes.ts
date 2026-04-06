import express from 'express';
import { createOrder, getMyOrders, reorder, cancelOrder } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/create', 
  authMiddleware, 
  [
    body('name').notEmpty(),
    body('phone_number').isString().isLength({ min: 10 }),
    body('address').notEmpty(),
    body('cans').isInt({ min: 1 }),
    body('payment_method').isIn(['Cash on Delivery', 'Online', 'Online Payment'])
  ],
  createOrder
);
router.get('/my-orders', authMiddleware, getMyOrders);
router.post('/reorder', 
  authMiddleware, 
  [
    body('orderId').notEmpty()
  ],
  reorder
);
router.put('/cancel/:id', authMiddleware, cancelOrder);

export default router;
