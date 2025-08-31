import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-200 py-3 px-6 text-center mt-8 rounded">
      &copy; {new Date().getFullYear()} Our Store. All rights reserved.
    </footer>
  );
}
