import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Heart, ShoppingCart, Plus, Minus } from "lucide-react";

export default function WishList({ customerId, onClose }) {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cartItems, setCartItems] = useState([]); // Assuming cartItems are passed or fetched if needed

  useEffect(() => {
    if (!customerId) {
      setErr("No customer ID available");
      setLoading(false);
      return;
    }

    // Fetch wishlist
    axios
      .get(`http://localhost:5000/api/customer/wishlist?customerId=${customerId}`, {
        headers: { "Origin": "http://localhost:5173" },
      })
      .then((res) => {
        const likedItems = res.data.filter((item) => item.is_liked === 1);
        const productIds = likedItems.map((item) => item.product_id);

        // Fetch all products
        axios
          .get("http://localhost:5000/api/admin/products", {
            headers: { "Origin": "http://localhost:5173" },
          })
          .then((prodRes) => {
            const products = prodRes.data.filter((p) => productIds.includes(p.id));
            setWishlistProducts(products);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Products fetch error", error);
            setErr("Failed to load products");
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error("Wishlist fetch error", error);
        setErr("Failed to load wishlist");
        setLoading(false);
      });
  }, [customerId]);

  const handleToggleWishlist = (productId) => {
    axios
      .post(
        "http://localhost:5000/api/customer/wishlist",
        { customerId, productId },
        { headers: { "Origin": "http://localhost:5173" } }
      )
      .then((res) => {
        if (res.data.is_liked === 0) {
          setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
        }
      })
      .catch((err) => console.error("Failed to toggle wishlist:", err));
  };

  const handleAddToCart = (productId, quantity = 1) => {
    // Implement add to cart logic if needed, similar to Products.jsx
    console.log("Add to cart from wishlist", productId);
  };

  const updateQuantity = (productId, change) => {
    // Implement quantity update if cart integration is needed
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full h-full flex items-center justify-center">
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full overflow-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold p-4 border-b">My Wishlist</h2>
        {err ? (
          <p className="text-red-500 text-center mt-8">{err}</p>
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {wishlistProducts.map((product) => (
              <WishlistCard
                key={product.id}
                product={product}
                handleToggleWishlist={handleToggleWishlist}
                handleAddToCart={handleAddToCart}
                updateQuantity={updateQuantity}
                cartItems={cartItems}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 mt-8">Your wishlist is empty</p>
        )}
      </div>
    </div>
  );
}

function WishlistCard({ product, handleToggleWishlist, handleAddToCart, updateQuantity, cartItems }) {
  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const [quantity, setQuantity] = useState(cartItem ? cartItem.quantity : 0);

  useEffect(() => {
    setQuantity(cartItem ? cartItem.quantity : 0);
  }, [cartItem]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      <div className="relative">
        <img
          src={product.thumbnail_url || "https://via.placeholder.com/300"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={() => handleToggleWishlist(product.id)}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
          title="Remove from wishlist"
        >
          <Heart size={16} className="text-red-500 fill-red-500" />
        </button>
      </div>
      <div className="p-4">
        <p className="uppercase text-xs text-gray-500 font-semibold">
          {product.category_name || "Category"}
        </p>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
        <span className="font-bold text-green-600 text-xl mb-1 block">
          ₹{product.price}
        </span>
        <span className="text-xs text-gray-500 block mb-2">
          {product.description || "per item"}
        </span>
        {product.stock_quantity > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(product.id, -1)}
              disabled={quantity <= 0}
              className={`px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 ${quantity <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, 1)}
              disabled={quantity >= product.stock_quantity}
              className={`px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 ${quantity >= product.stock_quantity ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Plus size={16} />
            </button>
            <span className="ml-2 font-bold">
              ₹{(product.price * quantity).toFixed(2)}
            </span>
          </div>
        ) : (
          <button
            disabled={product.stock_quantity === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors mt-2
              ${product.stock_quantity === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            <ShoppingCart size={16} />
            {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
}