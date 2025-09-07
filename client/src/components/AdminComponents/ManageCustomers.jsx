import React, { useState, useEffect } from "react";
import { Filter, Search, ArrowUpAZ, ArrowDownZA, Clock, MapPin, Package, DollarSign, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [customMonth, setCustomMonth] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState(null);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/customers");
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let result = [...customers];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(customer =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    // Apply date filter
    const now = new Date();
    if (filterType === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(customer => new Date(customer.created_at) >= oneWeekAgo);
    } else if (filterType === "month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      result = result.filter(customer => {
        const date = new Date(customer.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (filterType === "custom" && customMonth) {
      const [year, month] = customMonth.split("-").map(Number);
      result = result.filter(customer => {
        const date = new Date(customer.created_at);
        return date.getMonth() === month - 1 && date.getFullYear() === year;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const nameA = a.username.toLowerCase();
      const nameB = b.username.toLowerCase();
      return sortOrder === "asc" ? (nameA < nameB ? -1 : 1) : (nameA > nameB ? -1 : 1);
    });

    setFilteredCustomers(result);
  }, [searchTerm, sortOrder, filterType, customMonth, customers]);

  // Fetch orders for selected customer
  const fetchOrders = async (customerId) => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const response = await fetch(`http://localhost:5000/api/customer/orders?customerId=${customerId}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
      setOrderStatuses(
        data.reduce((acc, order) => ({
          ...acc,
          [order.order_id]: order.order_status
        }), {})
      );
      setLoadingOrders(false);
    } catch (error) {
      setErrorOrders(error.message);
      setLoadingOrders(false);
    }
  };

  // Handle status change
  const handleStatusChange = (orderId, newStatus) => {
    setOrderStatuses(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  // Toggle filter options
  const toggleFilterOptions = () => {
    setShowFilterOptions(!showFilterOptions);
  };

  // Handle sort change
  const handleSortChange = (order) => {
    setSortOrder(order);
    setShowFilterOptions(false);
  };

  // Handle filter type change
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type !== "custom") {
      setCustomMonth("");
    }
    setShowFilterOptions(false);
  };

  // Handle view order history
  const handleViewOrderHistory = (customerId) => {
    setSelectedCustomerId(customerId);
    fetchOrders(customerId);
  };

  // Close side panel
  const closeSidePanel = () => {
    setSelectedCustomerId(null);
    setOrders([]);
    setOrderStatuses({});
  };

  // Sort orders by date (most recent first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-green-800 mb-8">Manage Customers</h1>

      {/* Filter and Search Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        
        <div className="relative">
          <button
            onClick={toggleFilterOptions}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 rounded-lg hover:bg-green-50 text-green-700"
          >
            <Filter size={20} />
            <span>Filter</span>
          </button>
          
          {showFilterOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-48 bg-white border border-green-200 rounded-lg shadow-lg p-2"
            >
              <button
                onClick={() => handleSortChange("asc")}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-green-50 text-green-700"
              >
                <ArrowUpAZ size={18} />
                Sort A-Z
              </button>
              <button
                onClick={() => handleSortChange("desc")}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-green-50 text-green-700"
              >
                <ArrowDownZA size={18} />
                Sort Z-A
              </button>
              <button
                onClick={() => handleFilterTypeChange("all")}
                className="w-full text-left px-2 py-1 hover:bg-green-50 text-green-700"
              >
                All
              </button>
              <button
                onClick={() => handleFilterTypeChange("week")}
                className="w-full text-left px-2 py-1 hover:bg-green-50 text-green-700"
              >
                Current Week
              </button>
              <button
                onClick={() => handleFilterTypeChange("month")}
                className="w-full text-left px-2 py-1 hover:bg-green-50 text-green-700"
              >
                Current Month
              </button>
              <div className="px-2 py-1">
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => {
                    setCustomMonth(e.target.value);
                    setFilterType("custom");
                  }}
                  className="w-full px-2 py-1 border border-green-300 rounded"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse border border-green-200">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">ID</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Username</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Email</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Full Name</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Phone</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Registered At</th>
              <th className="border border-green-200 px-4 py-2 text-left text-green-800">Order History</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-green-50">
                <td className="border border-green-200 px-4 py-2">{customer.id}</td>
                <td className="border border-green-200 px-4 py-2">{customer.username}</td>
                <td className="border border-green-200 px-4 py-2">{customer.email}</td>
                <td className="border border-green-200 px-4 py-2">{customer.full_name}</td>
                <td className="border border-green-200 px-4 py-2">{customer.phone}</td>
                <td className="border border-green-200 px-4 py-2">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="border border-green-200 px-4 py-2">
                  <button
                    onClick={() => handleViewOrderHistory(customer.id)}
                    className="text-green-600 hover:underline"
                  >
                    View Order History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order History Side Panel */}
      <AnimatePresence>
        {selectedCustomerId && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed top-0 right-0 h-full w-[60%] bg-white shadow-2xl p-6 overflow-y-auto z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-800">Order History (Customer #{selectedCustomerId})</h2>
              <button onClick={closeSidePanel} className="text-green-600 hover:text-green-800">
                <X size={24} />
              </button>
            </div>

            {loadingOrders ? (
              <div className="text-center text-green-700 text-xl font-semibold">Loading orders...</div>
            ) : errorOrders ? (
              <div className="text-center text-red-600 text-xl font-semibold">Error: {errorOrders}</div>
            ) : orders.length === 0 ? (
              <div className="text-center text-gray-600">No orders found for this customer.</div>
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
                        <h3 className="text-xl font-semibold text-green-700 mb-4">
                          Order #{order.order_id}
                        </h3>
                        <div className="space-y-2">
                          <p className="flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-2 text-green-600" />
                            <span>Ordered on: {new Date(order.order_date).toLocaleString()}</span>
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
                                  {status.replace(/_/g, " ").toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-green-700 mb-3">Items</h4>
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCustomers;