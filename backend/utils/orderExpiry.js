const cron = require('node-cron');
const Order = require('../models/Order');
const Event = require('../models/Event');

const PENDING_ORDER_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Release reserved stock for a cancelled/expired order
 */
const releaseOrderStock = async (order) => {
  try {
    const event = await Event.findById(order.event);
    if (!event) return;

    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const ticketType = event.tiketTersedia.id(item.tipeTiket);
        if (ticketType) {
          ticketType.stokTersisa += item.jumlah; // Return stock
          ticketType.stokPending = Math.max(0, (ticketType.stokPending || 0) - item.jumlah); // Remove from pending
        }
      }
      await event.save();
      console.log(`✓ Released stock for order ${order._id}`);
    }
  } catch (error) {
    console.error(`✗ Error releasing stock for order ${order._id}:`, error.message);
  }
};

/**
 * Expire pending orders that are older than PENDING_ORDER_EXPIRY
 */
const expirePendingOrders = async () => {
  try {
    const expiryTime = new Date(Date.now() - PENDING_ORDER_EXPIRY);
    
    const expiredOrders = await Order.find({
      status: 'pending',
      createdAt: { $lt: expiryTime }
    });

    if (expiredOrders.length === 0) {
      console.log('No expired orders found');
      return;
    }

    console.log(`Found ${expiredOrders.length} expired orders to process`);

    for (const order of expiredOrders) {
      // Release reserved stock
      await releaseOrderStock(order);
      
      // Update order status
      order.status = 'expired';
      await order.save();
      
      console.log(`Order ${order._id} marked as expired`);
    }

    console.log(`✓ Successfully processed ${expiredOrders.length} expired orders`);
  } catch (error) {
    console.error('Error expiring pending orders:', error);
  }
};

/**
 * Initialize cron job to run every 10 minutes
 */
const initializeOrderExpiryJob = () => {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    console.log('Running order expiry check...');
    expirePendingOrders();
  });

  console.log('✓ Order expiry cron job initialized (runs every 10 minutes)');
};

module.exports = {
  initializeOrderExpiryJob,
  expirePendingOrders,
  releaseOrderStock,
};
