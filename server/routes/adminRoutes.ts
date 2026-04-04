import express from 'express';
import { getAdminDashboard, getAllOrders, getAllCustomers, updateOrderStatus } from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
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
