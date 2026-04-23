"use client";

import React, { useEffect, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  DoorOpen,
  Landmark,
  Loader2,
  ReceiptText,
  Send,
  Wallet,
} from 'lucide-react';
import { CajeroLayout } from '../../components/CajeroLayout';
import { cashierService } from '../../services/cashierService';
import {
  CashMovement,
  CashMovementType,
  CashPayment,
  CashSession,
  CashierSummary,
  PaymentMethod,
  PaymentMethodSummary,
} from '../../types';

const movementLabels: Record<CashMovementType, string> = {
  [CashMovementType.SALIDA]: 'Salida de caja',
  [CashMovementType.SERVICIO_CANCELADO]: 'Servicio cancelado',
  [CashMovementType.PAGO_PRODUCTO]: 'Pago de producto',
  [CashMovementType.OTRO]: 'Otro movimiento',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.EFECTIVO]: 'Efectivo',
  [PaymentMethod.TRANSFERENCIA]: 'Transferencia',
  [PaymentMethod.TARJETA]: 'Tarjeta',
  [PaymentMethod.NEQUI]: 'Nequi',
  [PaymentMethod.DAVIPLATA]: 'Daviplata',
  [PaymentMethod.OTRO]: 'Otro',
};

const paymentMethodStyles: Record<PaymentMethod, string> = {
  [PaymentMethod.EFECTIVO]: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  [PaymentMethod.TRANSFERENCIA]: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
  [PaymentMethod.TARJETA]: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
  [PaymentMethod.NEQUI]: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200',
  [PaymentMethod.DAVIPLATA]: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  [PaymentMethod.OTRO]: 'border-slate-700 bg-slate-800/70 text-slate-200',
};

const formatCurrency = (value?: number | null) => `$${Number(value || 0).toFixed(2)}`;

const renderPaymentSummary = (items: PaymentMethodSummary[]) => {
  if (!items.length) {
    return <p className="text-sm text-slate-400">Aun no hay pagos registrados en esta caja.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.payment_method}
          className={`rounded-xl border p-4 ${paymentMethodStyles[item.payment_method]}`}
        >
          <p className="text-sm font-semibold">{paymentMethodLabels[item.payment_method]}</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(item.total_amount)}</p>
          <p className="mt-1 text-xs opacity-80">{item.transactions} transacciones</p>
        </article>
      ))}
    </div>
  );
};

export const CajaPage: React.FC = () => {
  const [summary, setSummary] = useState<CashierSummary | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingNote, setOpeningNote] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [movementType, setMovementType] = useState<CashMovementType>(CashMovementType.SALIDA);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [movementOrderId, setMovementOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const [paymentTable, setPaymentTable] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [summaryData, currentSession, movementData, paymentData] = await Promise.all([
        cashierService.getSummary(),
        cashierService.getCurrentSession(),
        cashierService.getMovements(),
        cashierService.getPayments(),
      ]);
      setSummary(summaryData);
      setSession(currentSession);
      setMovements(movementData);
      setPayments(paymentData);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo cargar la informacion de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenSession = async () => {
    try {
      setError('');
      await cashierService.openSession(Number(openingAmount || 0), openingNote || undefined);
      setOpeningAmount('');
      setOpeningNote('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo abrir la caja');
    }
  };

  const handleCloseSession = async () => {
    try {
      setError('');
      await cashierService.closeSession(Number(closingAmount || 0), closingNote || undefined);
      setClosingAmount('');
      setClosingNote('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo cerrar la caja');
    }
  };

  const handleCreateMovement = async () => {
    try {
      setError('');
      await cashierService.createMovement({
        movement_type: movementType,
        amount: Number(movementAmount),
        description: movementDescription,
        related_order_id: movementOrderId || undefined,
      });
      setMovementAmount('');
      setMovementDescription('');
      setMovementOrderId('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo registrar el movimiento');
    }
  };

  const handleCreatePayment = async () => {
    try {
      setError('');
      await cashierService.createPayment({
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        order_id: paymentOrderId || undefined,
        mesa_numero: paymentTable ? Number(paymentTable) : undefined,
        reference_note: paymentNote || undefined,
      });
      setPaymentAmount('');
      setPaymentOrderId('');
      setPaymentTable('');
      setPaymentNote('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo registrar el pago');
    }
  };

  const handleCreateAlert = async (mesaNumero: number) => {
    const message = window.prompt(
      `Mensaje para el mesero de la mesa ${mesaNumero}:`,
      'Cliente solicita cuenta o atencion',
    );
    if (!message) return;
    try {
      setError('');
      await cashierService.createAlert(mesaNumero, message);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo crear el aviso');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await cashierService.resolveAlert(alertId);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo cerrar el aviso');
    }
  };

  const activePaymentSummary = summary?.payment_summary || [];

  return (
    <CajeroLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Caja y control de mesas</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Registra apertura, pagos por metodo, salidas y cierre ciego sin exponer el monto esperado de cierre.
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            className="icon-button inline-flex items-center gap-2"
          >
            <Loader2 size={16} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-3">
              <article className="panel-surface p-5">
                <div className="flex items-center gap-3 text-emerald-300">
                  <Wallet size={20} />
                  <h2 className="font-semibold text-slate-100">Apertura de caja</h2>
                </div>
                {session?.is_open ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    <p>
                      Monto base registrado: <strong>{formatCurrency(session.opening_amount)}</strong>
                    </p>
                    <p className="mt-2">
                      Apertura: {session.opened_at ? new Date(session.opened_at).toLocaleString() : 'Sin fecha'}
                    </p>
                    <p className="mt-3 text-xs text-emerald-200/80">
                      La caja ya esta abierta. Mientras permanezca abierta, registra pagos y salidas aqui.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      className="field-input"
                      placeholder="Monto base de apertura"
                    />
                    <textarea
                      value={openingNote}
                      onChange={(e) => setOpeningNote(e.target.value)}
                      className="field-input"
                      rows={3}
                      placeholder="Observacion inicial"
                    />
                    <button
                      onClick={() => void handleOpenSession()}
                      disabled={!openingAmount || Number(openingAmount) < 0}
                      className="primary-button inline-flex items-center gap-2 disabled:opacity-60"
                    >
                      <DoorOpen size={16} />
                      Abrir caja
                    </button>
                  </div>
                )}
              </article>

              <article className="panel-surface p-5">
                <div className="flex items-center gap-3 text-cyan-300">
                  <Landmark size={20} />
                  <h2 className="font-semibold text-slate-100">Registrar pago</h2>
                </div>
                <div className="mt-4 space-y-3">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="field-input"
                    disabled={!session?.is_open}
                  >
                    {Object.values(PaymentMethod).map((item) => (
                      <option key={item} value={item}>
                        {paymentMethodLabels[item]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="field-input"
                    placeholder="Monto pagado"
                    disabled={!session?.is_open}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={paymentOrderId}
                      onChange={(e) => setPaymentOrderId(e.target.value)}
                      className="field-input"
                      placeholder="Pedido relacionado"
                      disabled={!session?.is_open}
                    />
                    <input
                      type="number"
                      min="1"
                      value={paymentTable}
                      onChange={(e) => setPaymentTable(e.target.value)}
                      className="field-input"
                      placeholder="Mesa"
                      disabled={!session?.is_open}
                    />
                  </div>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="field-input"
                    rows={3}
                    placeholder="Referencia, banco, ultimos digitos o nota del pago"
                    disabled={!session?.is_open}
                  />
                  <button
                    onClick={() => void handleCreatePayment()}
                    disabled={!session?.is_open || !paymentAmount}
                    className="primary-button inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <CreditCard size={16} />
                    Registrar pago
                  </button>
                </div>
              </article>

              <article className="panel-surface p-5">
                <div className="flex items-center gap-3 text-amber-300">
                  <CheckCircle2 size={20} />
                  <h2 className="font-semibold text-slate-100">Cierre ciego</h2>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="field-input"
                    placeholder="Conteo final en caja"
                    disabled={!session?.is_open}
                  />
                  <textarea
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    className="field-input"
                    rows={3}
                    placeholder="Observaciones del cierre"
                    disabled={!session?.is_open}
                  />
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                    El sistema auditara el resultado internamente, pero no mostrara al cajero el monto esperado.
                  </div>
                  <button
                    onClick={() => void handleCloseSession()}
                    disabled={!session?.is_open || !closingAmount}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} />
                    Cerrar caja
                  </button>
                </div>
              </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
              <article className="panel-surface p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText size={18} className="text-slate-300" />
                  <h2 className="text-lg font-semibold text-slate-100">Salida de caja</h2>
                </div>
                <div className="space-y-3">
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as CashMovementType)}
                    className="field-input"
                    disabled={!session?.is_open}
                  >
                    {Object.values(CashMovementType).map((item) => (
                      <option key={item} value={item}>
                        {movementLabels[item]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    className="field-input"
                    placeholder="Monto de salida"
                    disabled={!session?.is_open}
                  />
                  <input
                    type="text"
                    value={movementDescription}
                    onChange={(e) => setMovementDescription(e.target.value)}
                    className="field-input"
                    placeholder="Descripcion del movimiento"
                    disabled={!session?.is_open}
                  />
                  <input
                    type="text"
                    value={movementOrderId}
                    onChange={(e) => setMovementOrderId(e.target.value)}
                    className="field-input"
                    placeholder="Pedido relacionado (opcional)"
                    disabled={!session?.is_open}
                  />
                  <button
                    onClick={() => void handleCreateMovement()}
                    disabled={!session?.is_open || !movementAmount || !movementDescription}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:opacity-60"
                  >
                    <ReceiptText size={16} />
                    Registrar salida
                  </button>
                </div>
              </article>

              <article className="panel-surface p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-cyan-300" />
                  <h2 className="text-lg font-semibold text-slate-100">Resumen de pagos</h2>
                </div>
                {renderPaymentSummary(activePaymentSummary)}
              </article>

              <article className="panel-surface p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BellRing size={18} className="text-amber-300" />
                  <h2 className="text-lg font-semibold text-slate-100">Avisos activos</h2>
                </div>
                <div className="space-y-3">
                  {summary?.active_alerts.length ? (
                    summary.active_alerts.map((alert) => (
                      <article key={alert.id} className="panel-muted p-3">
                        <p className="font-medium text-slate-100">Mesa {alert.mesa_numero}</p>
                        <p className="mt-1 text-sm text-slate-300">{alert.message}</p>
                        <button
                          onClick={() => void handleResolveAlert(alert.id)}
                          className="mt-3 rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-white"
                        >
                          Marcar resuelto
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No hay avisos pendientes.</p>
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <BellRing size={18} className="text-slate-300" />
                    <h2 className="text-lg font-semibold text-slate-100">Mesas ocupadas y libres</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {summary?.mesas_ocupadas.map((mesa) => (
                      <article
                        key={`ocupada-${mesa.mesa_numero}`}
                        className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
                              Ocupada
                            </p>
                            <h3 className="text-xl font-bold text-slate-100">Mesa {mesa.mesa_numero}</h3>
                            <p className="text-sm text-slate-300">
                              Mesero: {mesa.mesero_nombre || 'Sin asignar'}
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-950/60 px-3 py-1 text-xs font-medium text-rose-200">
                            {mesa.status}
                          </span>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-slate-200">
                          <p>Total pedido: {formatCurrency(mesa.total_amount)}</p>
                          <p>Pedido: #{mesa.order_id?.slice(0, 8) || 'N/A'}</p>
                        </div>
                        <button
                          onClick={() => void handleCreateAlert(mesa.mesa_numero)}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
                        >
                          <Send size={16} />
                          Avisar al mesero
                        </button>
                      </article>
                    ))}

                    {summary?.mesas_libres.map((mesa) => (
                      <article
                        key={`libre-${mesa.mesa_numero}`}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          Libre
                        </p>
                        <h3 className="text-xl font-bold text-slate-100">Mesa {mesa.mesa_numero}</h3>
                        <p className="mt-2 text-sm text-slate-200">
                          Disponible para recibir clientes o apoyar atencion.
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <section className="panel-surface p-5">
                  <h2 className="text-lg font-semibold text-slate-100">Pagos recientes</h2>
                  <div className="mt-4 space-y-3">
                    {payments.length ? (
                      payments.slice(0, 8).map((payment) => (
                        <article key={payment.id} className="panel-muted p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-100">
                              {paymentMethodLabels[payment.payment_method]}
                            </p>
                            <p className="text-sm font-bold text-slate-100">
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">
                            {payment.reference_note || 'Sin referencia adicional'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.mesa_numero ? `Mesa ${payment.mesa_numero}` : 'Sin mesa'}
                            {payment.order_id ? ` · Pedido ${payment.order_id.slice(0, 8)}` : ''}
                          </p>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">Aun no hay pagos registrados.</p>
                    )}
                  </div>
                </section>

                <section className="panel-surface p-5">
                  <h2 className="text-lg font-semibold text-slate-100">Movimientos recientes</h2>
                  <div className="mt-4 space-y-3">
                    {movements.length ? (
                      movements.slice(0, 8).map((movement) => (
                        <article key={movement.id} className="panel-muted p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-100">
                              {movementLabels[movement.movement_type]}
                            </p>
                            <p className="text-sm font-bold text-slate-100">
                              {formatCurrency(movement.amount)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{movement.description}</p>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">Aun no hay movimientos registrados.</p>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </>
        )}
      </div>
    </CajeroLayout>
  );
};

export default CajaPage;
