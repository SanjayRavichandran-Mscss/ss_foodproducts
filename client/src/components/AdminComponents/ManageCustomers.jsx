import React, { useState, useEffect } from 'react';
import { Filter, Search, ArrowUpAZ, ArrowDownZA } from 'lucide-react';

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [filterType, setFilterType] = useState('all'); // 'all', 'week', 'month', 'custom'
  const [customMonth, setCustomMonth] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/customers');
        const data = await response.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
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
    if (filterType === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(customer => new Date(customer.created_at) >= oneWeekAgo);
    } else if (filterType === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      result = result.filter(customer => {
        const date = new Date(customer.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (filterType === 'custom' && customMonth) {
      const [year, month] = customMonth.split('-').map(Number);
      result = result.filter(customer => {
        const date = new Date(customer.created_at);
        return date.getMonth() === month - 1 && date.getFullYear() === year;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const nameA = a.username.toLowerCase();
      const nameB = b.username.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA < nameB ? -1 : 1;
      }
      return nameA > nameB ? -1 : 1;
    });

    setFilteredCustomers(result);
  }, [searchTerm, sortOrder, filterType, customMonth, customers]);

  // Toggle filter options visibility
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
    if (type !== 'custom') {
      setCustomMonth('');
    }
    setShowFilterOptions(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Customers</h1>
      
      {/* Filter and Search Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        
        <div className="relative">
          <button
            onClick={toggleFilterOptions}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <Filter size={20} />
            <span>Filter</span>
          </button>
          
          {showFilterOptions && (
            <div className="absolute z-10 mt-2 w-48 bg-white border rounded-lg shadow-lg p-2">
              <button
                onClick={() => handleSortChange('asc')}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100"
              >
                <ArrowUpAZ size={18} />
                Sort A-Z
              </button>
              <button
                onClick={() => handleSortChange('desc')}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-100"
              >
                <ArrowDownZA size={18} />
                Sort Z-A
              </button>
              <button
                onClick={() => handleFilterTypeChange('all')}
                className="w-full text-left px-2 py-1 hover:bg-gray-100"
              >
                All
              </button>
              <button
                onClick={() => handleFilterTypeChange('week')}
                className="w-full text-left px-2 py-1 hover:bg-gray-100"
              >
                Current Week
              </button>
              <button
                onClick={() => handleFilterTypeChange('month')}
                className="w-full text-left px-2 py-1 hover:bg-gray-100"
              >
                Current Month
              </button>
              <div className="px-2 py-1">
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => {
                    setCustomMonth(e.target.value);
                    setFilterType('custom');
                  }}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">ID</th>
              <th className="border px-4 py-2 text-left">Username</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Full Name</th>
              <th className="border px-4 py-2 text-left">Phone</th>
              <th className="border px-4 py-2 text-left">Registered At</th>
              <th className="border px-4 py-2 text-left">Order History</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{customer.id}</td>
                <td className="border px-4 py-2">{customer.username}</td>
                <td className="border px-4 py-2">{customer.email}</td>
                <td className="border px-4 py-2">{customer.full_name}</td>
                <td className="border px-4 py-2">{customer.phone}</td>
                <td className="border px-4 py-2">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">
                  <span className="text-blue-500 hover:underline cursor-pointer">
                    View Order History
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCustomers;