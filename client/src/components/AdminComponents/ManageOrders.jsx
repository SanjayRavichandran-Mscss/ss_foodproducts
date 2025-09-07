import React, { useState, useEffect } from "react";
import { Clock, MapPin, Package, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const statusOptions = [
  "order_placed",
  "confirmed",
  "processing",
  "ready_to_ship",
  "dispatched",
  "shipping",
  "out_for_delivery",
  "delivered"
];

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/customer/orders?customerId=1");
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
        setOrderStatuses(
          data.reduce((acc, order) => ({
            ...acc,
            [order.order_id]: order.order_status
          }), {})
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setOrderStatuses(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.order_date) - new Date(a.order_date)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-700 text-xl font-semibold"
        >
          Loading orders...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-600 text-xl font-semibold"
        >
          Error: {error}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-green-800 mb-8 text-center">
          Manage Orders
        </h1>
        {sortedOrders.length === 0 ? (
          <div className="text-center text-gray-600">No orders found.</div>
        ) : (
          <div className="space-y-6">
            {sortedOrders.map(order => (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white shadow-lg rounded-lg p-6 border border-green-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-semibold text-green-700 mb-4">
                      Order #{order.order_id}
                    </h2>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700">
                        <Clock className="w-5 h-5 mr-2 text-green-600" />
                        <span>
                          Ordered on: {new Date(order.order_date).toLocaleString()}
                        </span>
                      </p>
                      <p className="flex items-center text-gray-700">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        <span>Total: ₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </p>
                      <p className="flex items-center text-gray-700">
                        <Package className="w-5 h-5 mr-2 text-green-600" />
                        <span>Payment: {order.payment_method}</span>
                      </p>
                      <p className="flex items-center text-gray-700">
                        <MapPin className="w-5 h-5 mr-2 text-green-600" />
                        <span>
                          Address: {order.address.street}, {order.address.city}, 
                          {order.address.state}, {order.address.zip_code}, 
                          {order.address.country}
                        </span>
                      </p>
                      <div>
                        <label className="text-gray-700 font-medium">Status:</label>
                        <select
                          value={orderStatuses[order.order_id]}
                          onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                          className="ml-2 p-1 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {status.replace(/_/g, ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-700 mb-3">Items</h3>
                    <div className="space-y-4">
                      {order.items.map(item => (
                        <div key={item.product_id} className="flex items-center space-x-4">
                          <img
                            src={`http://localhost:5000${item.thumbnail_url}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/64";
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-600">
                              Price: ₹{parseFloat(item.price_at_purchase).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Subtotal: ₹{parseFloat(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageOrders;