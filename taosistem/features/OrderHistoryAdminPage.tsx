"use client";

import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { OrdersHistoryPanel } from '../components/OrdersHistoryPanel';

export const OrderHistoryAdminPage: React.FC = () => (
  <AdminLayout>
    <OrdersHistoryPanel />
  </AdminLayout>
);

export default OrderHistoryAdminPage;
