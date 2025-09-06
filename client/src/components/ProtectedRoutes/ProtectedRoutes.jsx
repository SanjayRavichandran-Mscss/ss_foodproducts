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
  
  // Check if the current path requires authentication
  const isProtectedPath = 
    location.pathname.startsWith('/customer') || 
    location.pathname.startsWith('/checkout');
  
  // If trying to access protected routes without login, redirect to login
  if (isProtectedPath && (!customerToken || !customerId)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
}