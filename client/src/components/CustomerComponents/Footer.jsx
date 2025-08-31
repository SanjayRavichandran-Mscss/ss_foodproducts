import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-200 py-6 px-6 text-center mt-8">
      <p>&copy; {new Date().getFullYear()} Suyambu Stores. All rights reserved.</p>
    </footer>
  );
}