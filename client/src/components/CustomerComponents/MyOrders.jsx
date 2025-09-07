import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, X, SquareX } from "lucide-react";
// import "./MyOrders.css"; // Import custom CSS

const MyOrders = ({
  customerId,
  handleCloseOrders,
  showOrdersModal,
  ordersAnimation,
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = "http://localhost:5000";

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customerId) {
        setError("No customer ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/customer/orders?customerId=${customerId}`, {
          headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:5173",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (showOrdersModal) {
      fetchOrders();
    }
  }, [customerId, showOrdersModal]);

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex z-50 transition-opacity duration-300 ${
        ordersAnimation.includes("in") ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleCloseOrders}
    >
      <div
        className="ml-auto h-full w-full sm:w-1/2 bg-white shadow-xl relative transition-transform duration-300 p-0 pt-0 overflow-y-auto custom-scrollbar"
        style={{
          transform: ordersAnimation === "slide-in" ? "translateX(0)" : "translateX(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 pt-6 pb-4 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Package size={24} className="text-green-600 mr-3" />
            <div className="flex flex-col">
              <h2 className="font-bold text-xl text-gray-900">My Orders</h2>
              <span className="text-gray-500 text-sm mt-1">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            </div>
          </div>
          <button
            onClick={handleCloseOrders}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Close Orders"
          >
            <SquareX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="pt-1 pb-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 px-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <p className="text-red-600 text-base mb-4">{error}</p>
              <button
                className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer"
                onClick={handleCloseOrders}
              >
                Close
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-base mb-2">No orders yet</p>
              <p className="text-gray-400 text-sm mb-4">Start shopping to see your orders here</p>
              <button
                className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer"
                onClick={handleCloseOrders}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4 px-6 pb-6">
              {orders.map((order) => (
                <div key={order.order_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">
                        Order #{order.order_id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Payment: <span className="font-medium">{order.payment_method}</span></p>
                      <p className="text-gray-600">Method: <span className="font-medium">{order.order_method}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total: <span className="font-semibold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</span></p>
                      {order.tracking_number && (
                        <p className="text-gray-600">Tracking: <span className="font-medium">{order.tracking_number}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={`${item.product_id}-${index}`} className="flex items-center gap-3">
                          <img
                            src={item.thumbnail_url ? `${baseUrl}${item.thumbnail_url}` : "/fallback-image.png"}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                            onError={(e) => {
                              e.target.src = "/fallback-image.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              <p className="text-sm font-medium text-gray-700">₹{parseFloat(item.subtotal).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Delivery Address:</h4>
                    <p className="text-xs text-gray-600">
                      {order.address.street}, {order.address.city}, {order.address.state} {order.address.zip_code}, {order.address.country}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
