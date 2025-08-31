import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import AdminMenus from "../components/AdminComponents/AdminMenus";
import AdminDashboard from "../components/AdminComponents/AdminDashboard";
import ManageOrders from "../components/AdminComponents/ManageOrders";
import ManageCustomers from "../components/AdminComponents/ManageCustomers";
import ManageCategories from "../components/AdminComponents/ManageCategories";
import ManageProducts from "../components/AdminComponents/ManageProducts";

function decodeAdminId(encodedId) {
  try { return atob(encodedId); } catch { return null; }
}

export default function AdminPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const encodedAdminId = searchParams.get("adminId");
  const adminId = decodeAdminId(encodedAdminId);
  const storedAdminId = localStorage.getItem("adminId");
  const token = localStorage.getItem("adminToken");

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminId");
      navigate("/adminlogin", { replace: true });
      return;
    }

    // If adminId in URL doesn't match stored adminId, redirect to correct adminId
    if (adminId && adminId !== storedAdminId) {
      navigate(`${location.pathname}?adminId=${btoa(storedAdminId)}`, { replace: true });
      return;
    }

    const verifyAdmin = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/verify", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setVerified(true);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminId");
          navigate("/adminlogin", { replace: true });
        }
      } catch (error) {
        console.error("Verification error:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminId");
        navigate("/adminlogin", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [navigate, token, adminId, storedAdminId, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="text-gray-700 text-xl animate-pulse">Verifying admin...</div>
      </div>
    );
  }

  if (!verified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col">
      <AdminMenus adminId={btoa(storedAdminId)} />
      <main className="flex-1 pt-20 p-2">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<ManageCustomers />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="/" element={<Navigate to={`dashboard?adminId=${btoa(storedAdminId)}`} replace />} />
            <Route path="*" element={<Navigate to={`dashboard?adminId=${btoa(storedAdminId)}`} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}