import React from "react";
import { Minus, Plus, SquareX, X, ShoppingCart } from "lucide-react";

const Cart = ({
  customerId,
  cartItems,
  updateQuantity,
  handleRemoveItem,
  handleCloseCart,
  showCartModal,
  cartAnimation,
}) => {
  const baseUrl = "http://localhost:5000";
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex z-50 transition-opacity duration-300 ${
        cartAnimation.includes("in") ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleCloseCart}
    >
      <div
        className="ml-auto h-full w-full sm:w-[420px] bg-white shadow-xl relative transition-transform duration-300 p-0 pt-0 overflow-y-auto"
        style={{
          transform:
            cartAnimation === "slide-in"
              ? "translateX(0)"
              : "translateX(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 pt-6 pb-4 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingCart size={24} className="text-green-600 mr-3" />
            <div className="flex flex-col">
              <h2 className="font-bold text-xl text-gray-900">Shopping Cart</h2>
              <span className="text-gray-500 text-sm mt-1">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
          <button
            onClick={handleCloseCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
            aria-label="Close Cart"
          >
            <SquareX size={22} />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="pt-1 pb-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base">Your cart is empty</p>
              <button
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                onClick={handleCloseCart}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => {
                const remainingStock = item.stock_quantity - item.quantity;
                const isLowStock = remainingStock <= 3 && remainingStock > 0;
                const isOutOfStock = remainingStock === 0;
                
                return (
                  <div
                    key={item.product_id}
                    className="flex items-start px-6 py-5 bg-white group"
                  >
                    {/* Product Image */}
                    <div className="relative">
                      <img
                        src={`${baseUrl}${item.thumbnail_url}`}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg mr-4 border border-gray-100"
                        onError={(e) => {
                          e.target.src = "/fallback-image.png";
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-gray-200/70 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 bg-white/90 px-1.5 py-0.5 rounded">Out of stock</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info and Controls */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="pr-2">
                          <h3 className="text-base font-medium text-gray-900 line-clamp-2 leading-tight">{item.product_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{`₹${Number(item.price).toFixed(2)} per ${item.unit || "item"}`}</p>
                          
                          {/* Stock indicator */}
                          {!isOutOfStock && (
                            <div className={`text-xs mt-1 font-medium ${isLowStock ? 'text-amber-600' : 'text-gray-500'}`}>
                              {remainingStock} {remainingStock === 1 ? 'left' : 'left'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          aria-label="Remove Item"
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200 ml-2 mt-0.5"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, -1)}
                            className={`w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-700
                              hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease Quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-1 w-6 text-center text-sm font-medium text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, 1)}
                            className={`w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-700
                              hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`}
                            disabled={isOutOfStock}
                            aria-label="Increase Quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <span className="text-base font-semibold text-green-600">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total & Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-5 pb-6 px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center text-base font-medium mb-4">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-green-600 text-lg font-semibold">
                    ₹{cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200 text-base shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout
                </button>
                <button
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 py-2.5 rounded-lg transition-all text-base font-medium"
                  onClick={handleCloseCart}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;