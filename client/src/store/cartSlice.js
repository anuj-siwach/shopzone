// client/src/store/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const saved = (() => {
  try { return JSON.parse(localStorage.getItem('sz_cart')) || { items: [], total: 0 }; }
  catch { return { items: [], total: 0 }; }
})();

const calcTotal = items => items.reduce((s, i) => s + i.price * i.qty, 0);

const cartSlice = createSlice({
  name: 'cart',
  initialState: { ...saved, loading: false },
  reducers: {
    addItem(state, { payload }) {
      const ex = state.items.find(i => i.id === payload.id);
      if (ex) ex.qty += 1;
      else state.items.push({ ...payload, qty: 1 });
      state.total = calcTotal(state.items);
      localStorage.setItem('sz_cart', JSON.stringify({ items: state.items, total: state.total }));
    },
    removeItem(state, { payload }) {
      state.items = state.items.filter(i => i.id !== payload);
      state.total = calcTotal(state.items);
      localStorage.setItem('sz_cart', JSON.stringify({ items: state.items, total: state.total }));
    },
    updateQty(state, { payload: { id, qty } }) {
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      if (qty <= 0) state.items = state.items.filter(i => i.id !== id);
      else item.qty = qty;
      state.total = calcTotal(state.items);
      localStorage.setItem('sz_cart', JSON.stringify({ items: state.items, total: state.total }));
    },
    clearCart(state) {
      state.items = []; state.total = 0;
      localStorage.removeItem('sz_cart');
    },
  },
});

export const { addItem, removeItem, updateQty, clearCart } = cartSlice.actions;
export const selectCart  = s => s.cart.items;
export const selectTotal = s => s.cart.total;
export const selectCount = s => s.cart.items.reduce((n, i) => n + i.qty, 0);
export default cartSlice.reducer;
