import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LogOut, User, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import axios from "axios";
import WishList from "./WishList"; // Assuming WishList.jsx is in the same directory or adjust the path accordingly

export default function Header({
  customerData,
  onLoginClick,
  onRegisterClick,
  cartItems,
  customerId,
  fetchCart,
  onCartClick,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerId");
    setShowDropdown(false);
    window.location.reload();
  };

  const handleAddToCart = (productId) => {
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    axios
      .post(
        "http://localhost:5000/api/customer/cart",
        { customerId, productId, quantity: 1 },
        { headers: { "Origin": "http://localhost:5173" } }
      )
      .then(() => fetchCart())
      .catch((err) => console.error("Failed to add to cart:", err));
  };

  const updateQuantity = (productId, change) => {
    const item = cartItems.find((item) => item.product_id === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      axios
        .put(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId, quantity: newQuantity },
          { headers: { "Origin": "http://localhost:5173" } }
        )
        .then(() => fetchCart())
        .catch((err) => console.error("Failed to update quantity:", err));
    }
  };

  const handleRemoveItem = (productId) => {
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    console.log("Removing item", { customerId, productId });
    axios
      .delete(
        `http://localhost:5000/api/customer/cart?customerId=${customerId}&productId=${productId}`,
        { headers: { "Origin": "http://localhost:5173" } }
      )
      .then((response) => {
        console.log("Item removed", response.data);
        fetchCart(); // Refresh cart after successful deletion
      })
      .catch((err) => {
        console.error("Failed to remove item:", err);
        // Optional: Notify user (e.g., alert("Failed to remove item"));
      });
  };

  return (
    <>
      <header className="bg-white py-3 px-4 md:px-6 shadow-sm flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-3 p-1 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="flex items-center">
            <img
              src="/Assets/Suyambu_Eng_logo.png"
              alt="Suyambu Stores Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button
              onClick={() => {
                console.log("Cart clicked, navigating to cart page");
                onCartClick();
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-2 md:px-4 md:py-2 rounded-full flex items-center gap-1 md:gap-2 transition-colors relative"
            >
              <ShoppingCart size={18} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
          
          {!customerData ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onLoginClick}
                className="bg-white border border-green-600 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={onRegisterClick}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors hidden sm:block"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium">
                  {customerData.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  Hi, {customerData.full_name.split(" ")[0]}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <div className="font-medium text-gray-900">{customerData.full_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{customerData.email}</div>
                  </div>
                  
                  <div className="p-2">
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowWishlist(true);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      My Wishlist
                    </button>
                  </div>
                  
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 md:hidden">
            <div className="p-4">
              {!customerData ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={onLoginClick}
                    className="w-full bg-white border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-full font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-medium"
                  >
                    Register
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200">
                  <div className="mb-3">
                    <div className="font-medium text-gray-900">{customerData.full_name}</div>
                    <div className="text-xs text-gray-500">{customerData.email}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/profile"
                      className="text-center block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      to="/orders"
                      className="text-center block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowWishlist(true);
                      }}
                      className="text-center block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      My Wishlist
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      {showWishlist && <WishList customerId={customerId} onClose={() => setShowWishlist(false)} />}
    </>
  );
}