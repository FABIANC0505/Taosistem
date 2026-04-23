"use client";

import React from 'react';
import { CocinaLayout } from '../../components/CocinaLayout';
import { OrdersHistoryPanel } from '../../components/OrdersHistoryPanel';

export const HistorialCocinaPage: React.FC = () => (
  <CocinaLayout>
    <OrdersHistoryPanel />
  </CocinaLayout>
);

export default HistorialCocinaPage;
