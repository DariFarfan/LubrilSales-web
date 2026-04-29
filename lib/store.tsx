'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Order, Notification, Advisor, OrderStatus, StatusEntry } from './types';
import { INITIAL_ORDERS, MOCK_ADVISOR } from './mock-data';

interface StoreState {
  orders: Order[];
  notifications: Notification[];
  currentAdvisor: Advisor | null;
  isAuthenticated: boolean;
  loginEmail: string;
}

type Action =
  | { type: 'HYDRATE'; payload: Partial<StoreState> }
  | { type: 'LOGIN'; payload: Advisor }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOGIN_EMAIL'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus; note?: string; extra?: Partial<Order> } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_READ' };

const initialState: StoreState = {
  orders: INITIAL_ORDERS,
  notifications: [
    {
      id: 'notif-001',
      orderId: 'ord-001',
      orderShortId: 'ORD-001',
      title: 'Pedido en camino',
      body: 'Los Pinos — pedido ORD-001 fue despachado.',
      timestamp: new Date('2026-04-28T10:00:00').toISOString(),
      read: false,
      type: 'dispatched',
    },
    {
      id: 'notif-002',
      orderId: 'ord-006',
      orderShortId: 'ORD-006',
      title: 'Pedido rechazado',
      body: 'Los Pinos — ORD-006 fue rechazado por ADV.',
      timestamp: new Date('2026-04-24T15:30:00').toISOString(),
      read: true,
      type: 'rejected',
    },
    {
      id: 'notif-003',
      orderId: 'ord-004',
      orderShortId: 'ORD-004',
      title: 'Pedido entregado',
      body: 'Lubri Express — ORD-004 fue entregado.',
      timestamp: new Date('2026-04-25T09:00:00').toISOString(),
      read: true,
      type: 'delivered',
    },
  ],
  currentAdvisor: MOCK_ADVISOR,
  isAuthenticated: false,
  loginEmail: '',
};

function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    draft: 'Borrador',
    pending_sync: 'Pendiente de sync',
    synced: 'Recibido',
    validated: 'Validado',
    processing_sap: 'Procesando SAP',
    in_sap: 'En preparación',
    dispatched: 'En camino',
    delivered: 'Entregado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

function addStatusEntry(order: Order, status: OrderStatus, note?: string): Order {
  const entry: StatusEntry = {
    status,
    label: statusLabel(status),
    timestamp: new Date().toISOString(),
    note,
  };
  return {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    statusHistory: [...order.statusHistory, entry],
  };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };
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
        orders: state.orders.map((o) => {
          if (o.id !== action.payload.id) return o;
          return {
            ...addStatusEntry(o, action.payload.status, action.payload.note),
            ...action.payload.extra,
          };
        }),
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
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
}

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = 'lubrisales_state';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StoreState>;
        dispatch({ type: 'HYDRATE', payload: saved });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const login = useCallback((email: string) => {
    const advisor = { ...MOCK_ADVISOR, email };
    dispatch({ type: 'LOGIN', payload: advisor });
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const setLoginEmail = useCallback((email: string) =>
    dispatch({ type: 'SET_LOGIN_EMAIL', payload: email }), []);

  const createOrder = useCallback((partial: Omit<Order, 'id' | 'shortId' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'>): string => {
    const id = `ord-${Date.now()}`;
    const num = Math.floor(Math.random() * 900) + 100;
    const shortId = `ORD-${num}`;
    const now = new Date().toISOString();
    const order: Order = {
      ...partial,
      id,
      shortId,
      createdAt: now,
      updatedAt: now,
      status: 'pending_sync',
      statusHistory: [{ status: 'pending_sync', label: 'Pendiente de sync', timestamp: now }],
    };
    dispatch({ type: 'ADD_ORDER', payload: order });

    // Simulate network sync after 1.5s
    setTimeout(() => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'synced' } });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `notif-${Date.now()}`,
          orderId: id,
          orderShortId: shortId,
          title: 'Pedido recibido',
          body: `${partial.clientName} — ${shortId} fue sincronizado.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'synced',
        },
      });
    }, 1500);

    return id;
  }, []);

  const validateOrder = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'validated' } });
    setTimeout(() => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'processing_sap' } });
      setTimeout(() => {
        const sapNum = `450008${Math.floor(Math.random() * 9000) + 1000}`;
        dispatch({
          type: 'UPDATE_ORDER_STATUS',
          payload: { id, status: 'in_sap', note: `SAP #${sapNum}`, extra: { sapOrderNumber: sapNum } },
        });
      }, 3000);
    }, 2000);
  }, []);

  const rejectOrder = useCallback((id: string, reason: string) => {
    dispatch({
      type: 'UPDATE_ORDER_STATUS',
      payload: { id, status: 'rejected', note: reason, extra: { rejectionReason: reason } },
    });
  }, []);

  const markDispatched = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'dispatched' } });
  }, []);

  const markDelivered = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status: 'delivered' } });
  }, []);

  const markNotificationRead = useCallback((id: string) =>
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }), []);

  const markAllRead = useCallback(() => dispatch({ type: 'MARK_ALL_READ' }), []);

  return (
    <Ctx.Provider value={{ state, login, logout, setLoginEmail, createOrder, validateOrder, rejectOrder, markDispatched, markDelivered, markNotificationRead, markAllRead }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
