import express from 'express';
import { getAdminDashboard, getAllOrders, getAllCustomers, updateOrderStatus } from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', getAdminDashboard);
router.get('/orders', getAllOrders);
router.get('/customers', getAllCustomers);
router.put('/order-status/:id', 
  [
    body('status').isIn(['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'])
  ],
  updateOrderStatus
);

export default router;
