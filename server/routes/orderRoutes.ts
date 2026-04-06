import express from 'express';
import { createOrder, getMyOrders, reorder, cancelOrder } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/create', 
  authMiddleware, 
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone_number').notEmpty().withMessage('Phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('cans').notEmpty().withMessage('Number of cans is required'),
    body('payment_method').notEmpty().withMessage('Payment method is required')
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
