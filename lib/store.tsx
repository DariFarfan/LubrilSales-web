'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Order, Notification, Advisor, OrderStatus, StatusEntry } from './types';
import { MOCK_ADVISOR } from './mock-data';
import {
  getOrders, getNotifications,
  insertOrder, pushStatus, insertNotification,
  setNotificationRead, setAllNotificationsRead,
} from './db';

interface StoreState {
  orders: Order[];
  notifications: Notification[];
  currentAdvisor: Advisor | null;
  isAuthenticated: boolean;
  loginEmail: string;
  isLoading: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOADED'; payload: { orders: Order[]; notifications: Notification[] } }
  | { type: 'LOGIN'; payload: Advisor }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOGIN_EMAIL'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus; note?: string; extra?: Partial<Order> } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_READ' };

const initialState: StoreState = {
  orders: [],
  notifications: [],
  currentAdvisor: MOCK_ADVISOR,
  isAuthenticated: false,
  loginEmail: '',
  isLoading: true,
};

function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    draft: 'Borrador', pending_sync: 'Pendiente de sync', synced: 'Recibido',
    validated: 'Validado', processing_sap: 'Procesando SAP', in_sap: 'En preparación',
    dispatched: 'En camino', delivered: 'Entregado', rejected: 'Rechazado', cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

function addStatusEntry(order: Order, status: OrderStatus, note?: string): Order {
  const entry: StatusEntry = { status, label: statusLabel(status), timestamp: new Date().toISOString(), note };
  return { ...order, status, updatedAt: new Date().toISOString(), statusHistory: [...order.statusHistory, entry] };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOADED':
      return { ...state, isLoading: false, orders: action.payload.orders, notifications: action.payload.notifications };
    case 'LOGIN':
      return { ...state, currentAdvisor: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false };
    case 'SET_LOGIN_EMAIL':
      return { ...state, loginEmail: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id !== action.payload.id ? o : { ...addStatusEntry(o, action.payload.status, action.payload.note), ...action.payload.extra }
        ),
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map((n) => n.id === action.payload ? { ...n, read: true } : n) };
    case 'MARK_ALL_READ':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    default:
      return state;
  }
}

interface StoreContext {
  state: StoreState;
  login: (email: string) => void;
  logout: () => void;
  setLoginEmail: (email: string) => void;
  createOrder: (partial: Omit<Order, 'id' | 'shortId' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>) => string;
  validateOrder: (id: string) => void;
  rejectOrder: (id: string, reason: string) => void;
  markDispatched: (id: string) => void;
  markDelivered: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  reload: () => void;
}

const Ctx = createContext<StoreContext | null>(null);
const AUTH_KEY = 'lubrisales_auth';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist auth only
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const { isAuthenticated } = JSON.parse(raw);
        if (isAuthenticated) dispatch({ type: 'LOGIN', payload: MOCK_ADVISOR });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated: state.isAuthenticated }));
    } catch {}
  }, [state.isAuthenticated]);

  const loadFromDB = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [orders, notifications] = await Promise.all([getOrders(), getNotifications()]);
      dispatch({ type: 'LOADED', payload: { orders, notifications } });
    } catch (err) {
      console.error('Error loading from Supabase:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => { loadFromDB(); }, [loadFromDB]);

  const login = useCallback((email: string) => {
    dispatch({ type: 'LOGIN', payload: { ...MOCK_ADVISOR, email } });
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const setLoginEmail = useCallback((email: string) =>
    dispatch({ type: 'SET_LOGIN_EMAIL', payload: email }), []);

  const createOrder = useCallback((partial: Omit<Order, 'id' | 'shortId' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>): string => {
    const id = crypto.randomUUID();
    const shortId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const order: Order = {
      ...partial,
      id, shortId,
      createdAt: now, updatedAt: now,
      status: 'pending_sync',
      statusHistory: [{ status: 'pending_sync', label: 'Pendiente de sync', timestamp: now }],
    };
    dispatch({ type: 'ADD_ORDER', payload: order });

    // Write to Supabase async
    insertOrder(order)
      .then(() => {
        // Mark as synced
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'synced' } });
        pushStatus(id, 'synced', 'Recibido');

        const notif = {
          id: crypto.randomUUID(),
          orderId: id,
          orderShortId: shortId,
          title: 'Pedido recibido',
          body: `${partial.clientName} — ${shortId} fue sincronizado.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'synced' as const,
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: notif });
        insertNotification(id, 'synced', notif.title, notif.body);
      })
      .catch((err) => console.error('Error syncing order:', err));

    return id;
  }, []);

  const validateOrder = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'validated' } });
    pushStatus(id, 'validated', 'Validado por ADV');

    setTimeout(() => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'processing_sap' } });
      pushStatus(id, 'processing_sap', 'Procesando SAP');

      setTimeout(() => {
        const sapNum = `450008${Math.floor(Math.random() * 9000) + 1000}`;
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'in_sap', extra: { sapOrderNumber: sapNum } } });
        pushStatus(id, 'in_sap', 'En preparación SAP', `SAP #${sapNum}`, { sap_order_number: sapNum });
      }, 3000);
    }, 2000);
  }, []);

  const rejectOrder = useCallback((id: string, reason: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'rejected', note: reason, extra: { rejectionReason: reason } } });
    pushStatus(id, 'rejected', 'Rechazado por ADV', reason, { rejection_reason: reason });
  }, []);

  const markDispatched = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'dispatched' } });
    pushStatus(id, 'dispatched', 'En camino');
  }, []);

  const markDelivered = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'delivered' } });
    pushStatus(id, 'delivered', 'Entregado');
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    setNotificationRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
    setAllNotificationsRead();
  }, []);

  return (
    <Ctx.Provider value={{ state, login, logout, setLoginEmail, createOrder, validateOrder, rejectOrder, markDispatched, markDelivered, markNotificationRead, markAllRead, reload: loadFromDB }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
