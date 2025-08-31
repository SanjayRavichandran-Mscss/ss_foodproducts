// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import { LogOut, User, ShoppingCart, ChevronDown, Search } from "lucide-react";

// export default function Header({ customerData, onLoginClick, onRegisterClick }) {
//   const [showDropdown, setShowDropdown] = useState(false);

//   const handleLogout = () => {
//     localStorage.removeItem("customerToken");
//     localStorage.removeItem("customerId");
//     setShowDropdown(false);
//     window.location.reload(); // Refresh to reset state in CustomerPage
//   };

//   return (
//     <header className="bg-white py-4 px-6 shadow flex items-center justify-between fixed top-0 left-0 right-0 z-50">
//       <div className="flex items-center">
//         <img
//           src="/Assets/Suyambu_Eng_logo.png"
//           alt="Suyambu Stores Logo"
//           className="h-12 w-auto object-contain"
//         />
//       </div>

//       <div className="w-[400px] flex items-center">
//         <span className="px-3 text-gray-400">
//           <Search size={18} />
//         </span>
//         <input
//           className="w-full px-4 py-2 rounded border border-gray-200 focus:outline-none focus:ring"
//           type="text"
//           placeholder="Search for fresh groceries..."
//         />
//       </div>

//       <div className="flex items-center gap-4">
//         <Link
//           to="/cart"
//           className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
//         >
//           <ShoppingCart size={18} />
//           <span className="font-semibold">Cart</span>
//         </Link>
//         {!customerData ? (
//           <button
//             onClick={onLoginClick}
//             className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
//           >
//             <User size={18} />
//             <span className="font-semibold">Login</span>
//           </button>
//         ) : (
//           <div className="relative">
//             <button
//               onClick={() => setShowDropdown(!showDropdown)}
//               className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
//             >
//               <User size={18} />
//               <span className="font-semibold">Hi, {customerData.full_name}</span>
//               <ChevronDown size={16} />
//             </button>
//             {showDropdown && (
//               <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 p-4">
//                 <div className="mb-3">
//                   <div className="font-bold text-gray-900">{customerData.full_name}</div>
//                   <div className="text-xs text-gray-600">{customerData.username}</div>
//                   <div className="text-xs text-gray-600">{customerData.email}</div>
//                 </div>
//                 <button
//                   onClick={handleLogout}
//                   className="w-full flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
//                 >
//                   <LogOut size={16} />
//                   Logout
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </header>
//   );
// }












// Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogOut, User, ShoppingCart, ChevronDown, Search, Menu, X } from "lucide-react";

export default function Header({ customerData, onLoginClick, onRegisterClick }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  return (
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
          <span className="hidden md:block ml-2 text-xl font-bold text-green-700">Suyambu Stores</span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 max-w-2xl mx-6 lg:mx-10">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            type="text"
            placeholder="Search for fresh groceries..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link
          to="/cart"
          className="bg-green-600 hover:bg-green-700 text-white p-2 md:px-4 md:py-2 rounded-full flex items-center gap-1 md:gap-2 transition-colors"
        >
          <ShoppingCart size={18} />
          <span className="hidden md:block font-medium">Cart</span>
        </Link>
        
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
                Hi, {customerData.full_name.split(' ')[0]}
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

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 md:hidden">
          <div className="p-4">
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={18} className="text-gray-400" />
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                type="text"
                placeholder="Search for fresh groceries..."
              />
            </div>
            
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
  );
}