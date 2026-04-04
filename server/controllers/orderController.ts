import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getDB } from '../config/db';
import { sendOrderEmail } from '../services/emailService';
// import { io } from '../../server';
import { validationResult } from 'express-validator';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user_id = req.user?.id;
  const email = req.user?.email;

  if (!user_id || !email) return res.status(401).json({ message: 'Unauthorized' });

  // Prevent ordering on Sundays
  if (new Date().getDay() === 0) {
    return res.status(400).json({ message: 'Ordering is not available on Sundays.' });
  }

  const { name, phone_number, address, cans, payment_method } = req.body;

  const total_price = cans * 45;

  try {
    const db = await getDB();
    const result = await db.run(
      'INSERT INTO orders (user_id, email, name, phone, address, cans, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, email, name, phone_number, address, cans, payment_method, total_price]
    );

    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [result.lastID]);

    // Send email notification (asynchronous)
    sendOrderEmail({
      name,
      phone_number,
      email: req.user?.email,
      address,
      cans,
      total_price,
      payment_method,
      order_time: new Date().toLocaleString()
    });

    // Emit live order notification to admin (Now handled by Supabase Realtime)
    /*
    if (io) {
      io.emit('new_order', {
         message: 'New Order Received',
         order: { ...newOrder, _id: String(newOrder.id) }
      });
    }
    */

    res.status(201).json({
      message: 'Your order is confirmed. Water cans will be delivered within 7 hours.',
      orderId: result.lastID
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  const email = req.user?.email;

  if (!email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const db = await getDB();
    const orders = await db.all('SELECT * FROM orders WHERE email = ? ORDER BY order_time DESC', [email]);
    
    const formattedOrders = orders.map((o: any) => ({
      id: o.id,
      cans: o.cans,
      total_price: o.total_price,
      payment_method: o.payment_method,
      order_time: o.order_time,
      address: o.address,
      status: o.order_status
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const reorder = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId } = req.body;
  const user_id = req.user?.id;

  if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

  // Prevent reordering on Sundays
  if (new Date().getDay() === 0) {
    return res.status(400).json({ message: 'Reordering is not available on Sundays.' });
  }

  try {
     const db = await getDB();
     const previousOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
     
     if (!previousOrder) {
         return res.status(404).json({ message: 'Previous order not found' });
     }

     const email = req.user?.email;

     const result = await db.run(
       'INSERT INTO orders (user_id, email, name, phone, address, cans, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
       [user_id, email, previousOrder.name, previousOrder.phone, previousOrder.address, previousOrder.cans, previousOrder.payment_method, previousOrder.total_price]
     );

     const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [result.lastID]);

      // Send email notification (asynchronous)
      sendOrderEmail({
        name: newOrder.name,
        phone_number: newOrder.phone,
        email: req.user?.email,
        address: newOrder.address,
        cans: newOrder.cans,
        total_price: newOrder.total_price,
        payment_method: newOrder.payment_method,
        order_time: new Date().toLocaleString()
      });

      // Emit live order notification (Now handled by Supabase Realtime)
      /*
      if (io) {
        io.emit('new_order', {
           message: 'New Order Received (Reorder)',
           order: { ...newOrder, _id: String(newOrder.id) }
        });
      }
      */

      res.status(201).json({
        message: 'Your order is confirmed. Water cans will be delivered within 7 hours.',
        orderId: result.lastID
      });
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Server error '});
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  const email = req.user?.email;

  if (!user_id || !email) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const db = await getDB();
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND email = ?', [id, email]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.order_status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    await db.run('UPDATE orders SET order_status = ? WHERE id = ?', ['Cancelled', id]);

    // Emit live update to admin (Now handled by Supabase Realtime)
    /*
    if (io) {
      io.emit('order_status_update', {
        orderId: id,
        status: 'Cancelled'
      });
    }
    */

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
