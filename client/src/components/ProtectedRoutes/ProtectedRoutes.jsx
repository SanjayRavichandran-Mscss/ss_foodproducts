import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function AdminProtectedRoute() {
  const adminToken = localStorage.getItem("adminToken");
  const adminId = localStorage.getItem("adminId");
  const location = useLocation();
  
  if (!adminToken || !adminId) {
    return <Navigate to="/adminlogin" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
}

export function CustomerProtectedRoute() {
  const customerToken = localStorage.getItem("customerToken");
  const customerId = localStorage.getItem("customerId");
  const location = useLocation();
  
  // If trying to access /customer/* without login, redirect to root
  if (location.pathname.startsWith('/customer') && (!customerToken || !customerId)) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}