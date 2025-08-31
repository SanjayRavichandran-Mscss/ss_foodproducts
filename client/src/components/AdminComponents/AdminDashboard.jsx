import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    visitors: 0,
    customers: 0,
    products: 0,
    orders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    deliveredOrders: 0,
    revenue: 0
  });

  // State for charts
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [visitorData, setVisitorData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('visitors');
  const [revenueFilter, setRevenueFilter] = useState('month');

  // Static product data
  const products = [
    { id: 1, name: 'Groundnut oil', likes: 124, sales: 342, price: 180 },
    { id: 2, name: 'Coconut Oil', likes: 98, sales: 278, price: 220 },
    { id: 3, name: 'Sesame Oil', likes: 87, sales: 195, price: 250 },
    { id: 4, name: 'Castor Oil', likes: 65, sales: 132, price: 150 },
    { id: 5, name: 'Arisi Murukku', likes: 156, sales: 420, price: 90 },
    { id: 6, name: 'Raagi Murukku', likes: 142, sales: 380, price: 110 },
    { id: 7, name: 'Ellu Urundai', likes: 132, sales: 325, price: 120 },
    { id: 8, name: 'Thinai Laddu', likes: 121, sales: 310, price: 100 },
    { id: 9, name: 'Kambu Laddu', likes: 115, sales: 290, price: 100 },
    { id: 10, name: 'Raagi Laddu', likes: 135, sales: 345, price: 110 },
    { id: 11, name: 'Karuppu Kavuni Laddu', likes: 95, sales: 210, price: 140 },
    { id: 12, name: 'Athirasam', likes: 165, sales: 450, price: 80 },
    { id: 13, name: 'Badam', likes: 145, sales: 320, price: 380 },
    { id: 14, name: 'Pista', likes: 138, sales: 290, price: 450 },
    { id: 15, name: 'Cashewnut', likes: 152, sales: 330, price: 420 },
    { id: 16, name: 'Walnut', likes: 125, sales: 280, price: 350 },
    { id: 17, name: 'Fig', likes: 118, sales: 260, price: 280 },
    { id: 18, name: 'Honey Amla', likes: 105, sales: 230, price: 160 },
    { id: 19, name: 'Dry Grapes', likes: 148, sales: 370, price: 200 },
    { id: 20, name: 'Dates', likes: 162, sales: 410, price: 180 }
  ];

  // Generate dates from Aug 1, 2025 to today
  const generateDateRange = () => {
    const dates = [];
    const startDate = new Date(2025, 7, 1); // Aug 1, 2025 (months are 0-indexed)
    const endDate = new Date();
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    
    return dates;
  };

  // Initialize dashboard data
  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      const updatedData = {
        visitors: Math.floor(Math.random() * 1000) + 5000,
        customers: Math.floor(Math.random() * 200) + 800,
        products: products.length,
        orders: Math.floor(Math.random() * 100) + 450,
        pendingOrders: Math.floor(Math.random() * 20) + 15,
        shippingOrders: Math.floor(Math.random() * 15) + 10,
        deliveredOrders: Math.floor(Math.random() * 80) + 370,
        revenue: Math.floor(Math.random() * 50000) + 150000
      };
      setDashboardData(updatedData);
    }, 5000); // Update every 5 seconds

    // Initial data
    const initialData = {
      visitors: 5243,
      customers: 923,
      products: products.length,
      orders: 487,
      pendingOrders: 23,
      shippingOrders: 14,
      deliveredOrders: 450,
      revenue: 187432
    };
    setDashboardData(initialData);

    // Set top 5 liked products
    const sortedByLikes = [...products].sort((a, b) => b.likes - a.likes).slice(0, 5);
    setTopProducts(sortedByLikes);

    // Set sales data for bar chart
    const sortedBySales = [...products].sort((a, b) => b.sales - a.sales);
    setSalesData({
      labels: sortedBySales.map(product => product.name),
      datasets: [
        {
          label: 'Units Sold',
          data: sortedBySales.map(product => product.sales),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Revenue (₹)',
          data: sortedBySales.map(product => product.sales * product.price),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    });

    // Generate visitor/customer data
    const dates = generateDateRange();
    const visitorCounts = dates.map(() => Math.floor(Math.random() * 100) + 150);
    const customerCounts = dates.map(() => Math.floor(Math.random() * 30) + 40);
    
    setVisitorData({
      labels: dates.map(date => date.toLocaleDateString()),
      datasets: [
        {
          label: 'Visitors',
          data: visitorCounts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1
        },
        {
          label: 'Customers',
          data: customerCounts,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.1
        }
      ]
    });

    return () => clearInterval(interval);
  }, []);

  // Filter visitor data based on selected metric
  const filteredVisitorData = {
    labels: visitorData.labels,
    datasets: visitorData.datasets ? 
      [visitorData.datasets.find(dataset => dataset.label.toLowerCase() === selectedMetric)] : []
  };

  // Options for charts
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Product Sales Performance',
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Over Time`,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Visitors</h2>
          <p className="text-3xl font-bold text-green-700">{dashboardData.visitors}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Customers</h2>
          <p className="text-3xl font-bold text-blue-700">{dashboardData.customers}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-purple-700">{dashboardData.products}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Orders</h2>
          <p className="text-3xl font-bold text-yellow-700">{dashboardData.orders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Pending Orders</h2>
          <p className="text-3xl font-bold text-orange-700">{dashboardData.pendingOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Shipping Orders</h2>
          <p className="text-3xl font-bold text-indigo-700">{dashboardData.shippingOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Delivered Orders</h2>
          <p className="text-3xl font-bold text-teal-700">{dashboardData.deliveredOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-red-700">₹{dashboardData.revenue.toLocaleString()}</p>
          <div className="mt-2">
            <select 
              className="text-sm border rounded p-1"
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products by Likes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Top 5 Liked Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center">
                  <span className="text-white bg-green-600 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm font-semibold">
                  {product.likes} likes
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Visitor/Customer Graph */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-800">Traffic Analytics</h2>
            <select 
              className="border rounded p-2 text-sm"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="visitors">Visitors</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          <div className="h-80">
            {visitorData.labels && <Line data={filteredVisitorData} options={lineOptions} />}
          </div>
        </div>
      </div>
      
      {/* Sales Performance Graph */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-4">Sales Performance</h2>
        <div className="h-96">
          {salesData.labels && <Bar data={salesData} options={barOptions} />}
        </div>
      </div>
    </div>
  );
}