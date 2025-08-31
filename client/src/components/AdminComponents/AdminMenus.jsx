import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Boxes, Archive, ShoppingCart, LogOut } from 'lucide-react';

const menus = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { key: "customers", label: "Customers", icon: Users, path: "customers" },
  { key: "categories", label: "Categories", icon: Boxes, path: "categories" },
  { key: "products", label: "Products", icon: Archive, path: "products" },
  { key: "orders", label: "Orders", icon: ShoppingCart, path: "orders" },
];

const menuActive = "bg-[#69D84F] text-white shadow font-semibold";
const menuDefault = "text-gray-700 hover:bg-[#E3E8EE] hover:text-[#69D84F]";

export default function AdminMenus({ adminId }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ id: '', full_name: '', email: '' });
  const [showLogout, setShowLogout] = useState(false);

  // Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/profile/${adminId}`);
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
        } else {
          console.error('Error fetching profile:', data.error);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [adminId]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    navigate("/adminlogin", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white flex items-center justify-between px-6 py-4 border-b border-[#E3E8EE] z-50">
      <div className="flex items-center">
        <img
          src="/Assets/Suyambu_Eng_logo.png"
          alt="Suyambu Stores Logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      <div className="flex items-center justify-center gap-6 flex-1">
        {menus.map(({ key, label, icon: Icon, path }) => (
          <NavLink
            key={key}
            to={`/admin/${path}?adminId=${adminId}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-base ${
                isActive ? menuActive : menuDefault
              }`
            }
            end
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="absolute right-6">
        <div
          className="flex flex-col items-end cursor-pointer"
          onClick={() => setShowLogout(!showLogout)}
        >
          <span className="text-gray-700 font-semibold">{profile.full_name || 'Admin'}</span>
          <span className="text-gray-500 text-sm">{profile.email || 'email@example.com'}</span>
        </div>
        {showLogout && (
          <button
            onClick={handleLogout}
            className="absolute right-0 mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 text-white border border-red-700 rounded-md shadow-sm hover:bg-red-700 hover:border-red-800 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
};