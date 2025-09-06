import React, { useState, useEffect } from "react";
import { Truck, Plus, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const DeliveryAddress = ({ selectedAddressId, setSelectedAddressId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const customerIdBase64 = searchParams.get("customerId") || "";
  const [decodedCustomerId, setDecodedCustomerId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({ full_name: "", email: "", phone: "" });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    is_default: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decode customerId from base64
  useEffect(() => {
    if (customerIdBase64) {
      try {
        const decodedId = atob(customerIdBase64);
        console.log("Decoded customerId:", decodedId);
        setDecodedCustomerId(decodedId);
      } catch (error) {
        console.error("Error decoding customerId:", error);
        setError("Invalid customer ID");
        setLoading(false);
      }
    }
  }, [customerIdBase64]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const storedCustomerId = localStorage.getItem("customerId");
    
    if (!token || !storedCustomerId) {
      navigate("/customerlogin");
      return;
    }
  }, [navigate]);

  // Fetch addresses and customer details when decodedCustomerId is available
  useEffect(() => {
    const fetchData = async () => {
      if (!decodedCustomerId) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem("customerToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching addresses for customerId:", decodedCustomerId);
        
        const addressResponse = await axios.get(`http://localhost:5000/api/customer/addresses`, {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddresses(addressResponse.data);

        const profileResponse = await axios.get(`http://localhost:5000/api/customer/profile`, {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCustomerDetails(prev => ({...prev, ...profileResponse.data}));

        const detailsResponse = await axios.get(`http://localhost:5000/api/customer/customer-details`, {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCustomerDetails(prev => ({...prev, phone: detailsResponse.data.phone}));

        const defaultAddress = addressResponse.data.find((addr) => addr.is_default);
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress.id);
        }
        setLoading(false);
      } catch (err) {
        console.error("Fetch data error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("customerToken");
          localStorage.removeItem("customerId");
          navigate("/customerlogin");
        }
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    
    if (decodedCustomerId) {
      fetchData();
    }
  }, [decodedCustomerId, selectedAddressId, setSelectedAddressId, navigate]);

  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      street: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
      is_default: false,
    });
    setShowAddAddress(false);
    setEditingAddressId(null);
    setError(null);
  };

  const validateForm = () => {
    if (!formData.street || formData.street.length > 255) {
      return "Street is required and must be 255 characters or less";
    }
    if (!formData.city || formData.city.length > 100) {
      return "City is required and must be 100 characters or less";
    }
    if (!formData.state || formData.state.length > 100) {
      return "State is required and must be 100 characters or less";
    }
    if (!formData.zip_code || formData.zip_code.length > 20) {
      return "Zip code is required and must be 20 characters or less";
    }
    if (!formData.country || formData.country.length > 100) {
      return "Country is required and must be 100 characters or less";
    }
    return null;
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("customerToken");
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/customer/addresses",
        { ...formData },
        {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      resetForm();
      const response = await axios.get(`http://localhost:5000/api/customer/addresses`, {
        params: { customerId: decodedCustomerId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(response.data);
    } catch (err) {
      console.error("Add address error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        navigate("/customerlogin");
      }
      setError(err.response?.data?.message || "Failed to add address");
    }
  };

  const handleEditAddress = (address) => {
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      country: address.country,
      is_default: Boolean(address.is_default),
    });
    setEditingAddressId(address.id);
    setShowAddAddress(true);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("customerToken");
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      await axios.put(
        "http://localhost:5000/api/customer/addresses",
        { id: editingAddressId, ...formData },
        {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      resetForm();
      const response = await axios.get(`http://localhost:5000/api/customer/addresses`, {
        params: { customerId: decodedCustomerId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(response.data);
    } catch (err) {
      console.error("Update address error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        navigate("/customerlogin");
      }
      setError(err.response?.data?.message || "Failed to update address");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    const token = localStorage.getItem("customerToken");
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      await axios.delete("http://localhost:5000/api/customer/addresses", {
        params: { id, customerId: decodedCustomerId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      const response = await axios.get(`http://localhost:5000/api/customer/addresses`, {
        params: { customerId: decodedCustomerId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(response.data);
    } catch (err) {
      console.error("Delete address error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        navigate("/customerlogin");
      }
      setError(err.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      setError("Authentication required");
      return;
    }

    try {
      const address = addresses.find(addr => addr.id === id);
      await axios.put(
        "http://localhost:5000/api/customer/addresses",
        { 
          id, 
          street: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country,
          is_default: true 
        },
        {
          params: { customerId: decodedCustomerId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response = await axios.get(`http://localhost:5000/api/customer/addresses`, {
        params: { customerId: decodedCustomerId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(response.data);
    } catch (err) {
      console.error("Set default address error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        navigate("/customerlogin");
      }
      setError(err.response?.data?.message || "Failed to set default address");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Truck size={24} className="text-green-600" />
        Delivery Address
      </h2>
      <div className="mb-4">
        <p className="font-medium text-gray-900">{customerDetails.full_name}</p>
        <p className="text-sm text-gray-600">{customerDetails.phone}</p>
      </div>
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-gray-600">No addresses found. Add a new address below.</p>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedAddressId === address.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleSelectAddress(address.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">{address.street}</p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.zip_code}, {address.country}
                  </p>
                  {address.is_default ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                      Default
                    </span>
                  ) : (
                    <button
                      className="text-xs text-green-600 hover:text-green-800 mt-1 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(address.id);
                      }}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-green-600 hover:text-green-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAddress(address);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(address.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <button
          className="w-full py-3 text-green-600 hover:text-green-800 font-medium flex items-center justify-center gap-2 transition-all hover:bg-gray-50 rounded-lg"
          onClick={() => {
            setShowAddAddress(!showAddAddress);
            setEditingAddressId(null);
            setFormData({
              street: "",
              city: "",
              state: "",
              zip_code: "",
              country: "",
              is_default: false,
            });
            setError(null);
          }}
        >
          <Plus size={16} />
          Add New Address
        </button>
        {showAddAddress && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  required
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  required
                />
                <input
                  type="text"
                  name="zip_code"
                  placeholder="Zip Code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  required
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-600">Set as default address</label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
                >
                  {editingAddressId ? "Update Address" : "Save Address"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAddress;