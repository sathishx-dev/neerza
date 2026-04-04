import { Request, Response } from 'express';
import { getDB } from '../config/db';
import { validationResult } from 'express-validator';

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    
    const { totalcustomers } = await db.get(`SELECT COUNT(*) as "totalcustomers" FROM users WHERE role = 'customer'`);
    const { totalorders } = await db.get(`SELECT COUNT(*) as "totalorders" FROM orders`);
    
    // Calculate total revenue from all orders (excluding cancelled)
    const { totalrevenue } = await db.get(`SELECT COALESCE(SUM(total_price), 0) as "totalrevenue" FROM orders WHERE order_status != 'Cancelled'`);

    // Calculate today's orders and revenue
    // Get start of today in local db time (SQLite uses UTC by default, but typically we just match strings starting with today's date)
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const { todayorders } = await db.get(`
        SELECT COUNT(*) as "todayorders" 
        FROM orders 
        WHERE order_time::date = CURRENT_DATE
    `);
    
    const { todayrevenue } = await db.get(`
        SELECT COALESCE(SUM(total_price), 0) as "todayrevenue" 
        FROM orders 
        WHERE order_time::date = CURRENT_DATE AND order_status != 'Cancelled'
    `);

    // Prepare chart data: Daily Orders over the last 7 days
    const dailyOrders = await db.all(`
        SELECT order_time::date as _id, COUNT(*) as count 
        FROM orders 
        WHERE order_time::date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY order_time::date
        ORDER BY _id ASC
    `);

    // Prepare chart data: Monthly Revenue for the current year
    const monthlyRevenueRaw = await db.all(`
        SELECT to_char(order_time, 'MM') as _id, SUM(total_price) as total 
        FROM orders 
        WHERE EXTRACT(YEAR FROM order_time) = EXTRACT(YEAR FROM CURRENT_DATE) AND order_status != 'Cancelled'
        GROUP BY _id
        ORDER BY _id ASC
    `);
    
    // map "_id" strings ("01", "02") to integers for charts to match original Mongoose output
    const monthlyRevenue = monthlyRevenueRaw.map((row: any) => ({
        _id: parseInt(row._id, 10),
        total: row.total
    }));

    res.json({
      totalcustomers: parseInt(totalcustomers, 10) || 0,
      totalorders: parseInt(totalorders, 10) || 0,
      todayorders: parseInt(todayorders, 10) || 0,
      todayrevenue: parseInt(todayrevenue, 10) || 0,
      totalrevenue: parseInt(totalrevenue, 10) || 0,
      dailyOrders,
      monthlyRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    const orders = await db.all(`
        SELECT orders.*, users.email as user_email
        FROM orders 
        LEFT JOIN users ON orders.user_id = users.id 
        ORDER BY orders.order_time DESC
    `);
    
    // Format response to match original mongoose output: user: { email: ... }
    const formattedOrders = orders.map((o: any) => {
        return {
            ...o,
            _id: String(o.id),
            createdAt: o.order_time,
            status: o.order_status,
            phone_number: o.phone,
            user: { _id: o.user_id, email: o.user_email }
        }
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const db = await getDB();
    const customers = await db.all(`
        SELECT users.id, users.name, users.email, users.mobile, users.address, COUNT(orders.id) as total_orders
        FROM users 
        LEFT JOIN orders ON users.id = orders.user_id 
        WHERE users.role = 'customer'
        GROUP BY users.id
    `);
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    const db = await getDB();
    await db.run('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
