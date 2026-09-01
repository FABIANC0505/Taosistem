import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Minus, Plus, Trash2, Save, ArrowLeft, ShoppingCart, Bike, Store } from 'lucide-react';
import { MeseroLayout } from '../../components/MeseroLayout';
import { OrderType, Product } from '../../types';
import { productService } from '../../services/productService';
import { OrderItemPayload, ordersService } from '../../services/orders';
import { resolveMediaUrl } from '../../utils/media';

interface CartItem extends OrderItemPayload {}

const mesasRapidas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const NuevoPedidoPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(orderId);
  const initialType = searchParams.get('tipo') === OrderType.DOMICILIO ? OrderType.DOMICILIO : OrderType.MESA;

  const [products, setProducts] = useState<Product[]>([]);
  const [tipoPedido, setTipoPedido] = useState<OrderType>(initialType);
  const [mesaNumero, setMesaNumero] = useState<number>(1);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0),
    [cart]
  );

  const categoryEmoji = (cat?: string) => {
    const map: Record<string, string> = {
      pizzas: '🍕', burgers: '🍔', ensaladas: '🥗',
      bebidas: '🥤', postres: '🍰', pastas: '🍝', carnes: '🥩', otros: '🍽️'
    };
    return map[(cat ?? '').toLowerCase()] ?? '🍽️';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productData] = await Promise.all([productService.getAll()]);
      setProducts(productData.filter((p) => p.disponible));

      if (orderId) {
        const order = await ordersService.getById(orderId);
        setTipoPedido(order.tipo_pedido);
        setMesaNumero(order.mesa_numero || 1);
        setClienteNombre(order.cliente_nombre || '');
        setClienteTelefono(order.cliente_telefono || '');
        setDireccionEntrega(order.direccion_entrega || '');
        setNotas(order.notas || '');
        setCart(
          order.items.map((item) => ({
            product_id: item.product_id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos del pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.product_id === product.id);

      if (found) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      return [
        ...prev,
        {
          product_id: product.id,
          nombre: product.nombre,
          cantidad: 1,
          precio_unitario: Number(product.precio),
        },
      ];
    });
  };

  const updateQuantity = (productId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product_id !== productId));
      return;
    }

    setCart((prev) => prev.map((item) => (item.product_id === productId ? { ...item, cantidad: nextQty } : item)));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const validateForm = () => {
    if (tipoPedido === OrderType.MESA && (!mesaNumero || mesaNumero < 1)) {
      setError('Selecciona una mesa válida');
      return false;
    }

    if (tipoPedido === OrderType.DOMICILIO) {
      if (!clienteNombre.trim() || !clienteTelefono.trim() || !direccionEntrega.trim()) {
        setError('Para domicilios debes completar cliente, teléfono y dirección');
        return false;
      }
    }

    if (cart.length === 0) {
      setError('Agrega al menos un producto al pedido');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

      const payload = {
        tipo_pedido: tipoPedido,
        mesa_numero: tipoPedido === OrderType.MESA ? mesaNumero : undefined,
        cliente_nombre: tipoPedido === OrderType.DOMICILIO ? clienteNombre.trim() : undefined,
        cliente_telefono: tipoPedido === OrderType.DOMICILIO ? clienteTelefono.trim() : undefined,
        direccion_entrega: tipoPedido === OrderType.DOMICILIO ? direccionEntrega.trim() : undefined,
        items: cart,
        notas: notas || undefined,
      };

      if (isEditing && orderId) {
        await ordersService.update(orderId, payload);
      } else {
        await ordersService.create(payload);
      }

      navigate(tipoPedido === OrderType.DOMICILIO ? '/mesero/domicilios' : '/mesero/pedidos');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo guardar el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!orderId) return;

    const confirmed = window.confirm('¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      setSaving(true);
      await ordersService.delete(orderId);
      navigate(tipoPedido === OrderType.DOMICILIO ? '/mesero/domicilios' : '/mesero/pedidos');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo eliminar el pedido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MeseroLayout>
        <div className="flex h-56 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-400"></div>
        </div>
      </MeseroLayout>
    );
  }

  return (
    <MeseroLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(tipoPedido === OrderType.DOMICILIO ? '/mesero/domicilios' : '/mesero/pedidos')}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {isEditing ? 'Editar pedido' : 'Nuevo pedido'}
          </h1>
        </div>

        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-200">{error}</div>}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTipoPedido(OrderType.MESA)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${
                  tipoPedido === OrderType.MESA ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-950/40 text-slate-300'
                }`}
              >
                <Store size={16} />
                Mesa
              </button>
              <button
                onClick={() => setTipoPedido(OrderType.DOMICILIO)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${
                  tipoPedido === OrderType.DOMICILIO ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-950/40 text-slate-300'
                }`}
              >
                <Bike size={16} />
                Domicilio
              </button>
            </div>

            {tipoPedido === OrderType.MESA ? (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-300">Mesa</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {mesasRapidas.map((mesa) => (
                    <button
                      key={mesa}
                      onClick={() => setMesaNumero(mesa)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        mesaNumero === mesa
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : 'border-slate-700 bg-slate-950/40 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      Mesa {mesa}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  value={mesaNumero}
                  onChange={(event) => setMesaNumero(Number(event.target.value || 1))}
                  className="field-input w-full md:w-44"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-300">Cliente</label>
                  <input
                    value={clienteNombre}
                    onChange={(event) => setClienteNombre(event.target.value)}
                    className="field-input mt-1"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Teléfono</label>
                  <input
                    value={clienteTelefono}
                    onChange={(event) => setClienteTelefono(event.target.value)}
                    className="field-input mt-1"
                    placeholder="3001234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Dirección</label>
                  <textarea
                    value={direccionEntrega}
                    onChange={(event) => setDireccionEntrega(event.target.value)}
                    rows={3}
                    className="field-input mt-1"
                    placeholder="Barrio, referencia, apartamento, etc."
                  />
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-300">Menú disponible</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => {
                  const inCart = cart.find((c) => c.product_id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                        inCart
                          ? 'border-emerald-400/70 shadow-md shadow-emerald-500/10'
                          : 'border-slate-700 hover:border-emerald-400/60'
                      }`}
                    >
                      {product.imagen_url ? (
                        <img
                          src={resolveMediaUrl(product.imagen_url)}
                          alt={product.nombre}
                          className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-5xl">
                          {categoryEmoji(product.categoria)}
                        </div>
                      )}

                      {inCart && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                          x{inCart.cantidad}
                        </span>
                      )}

                      <div className="p-2.5">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-100">{product.nombre}</p>
                        <p className="mt-0.5 text-sm font-bold text-emerald-300">${Number(product.precio).toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="h-fit space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-slate-100">
              <ShoppingCart size={18} />
              <h2 className="font-semibold">Resumen del pedido</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-slate-400">Aún no agregas productos.</p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product_id} className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                    <p className="text-sm font-medium text-slate-100">{item.nombre}</p>
                    <p className="text-xs text-slate-400">${item.precio_unitario.toFixed(2)} c/u</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.cantidad - 1)}
                          className="rounded border border-slate-600 bg-slate-800 p-1 text-slate-200 hover:bg-slate-700"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-6 text-center text-sm text-slate-100">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.cantidad + 1)}
                          className="rounded border border-slate-600 bg-slate-800 p-1 text-slate-200 hover:bg-slate-700"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-300 hover:text-red-200"
                        title="Quitar del pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-300">Notas especiales</label>
              <textarea
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                rows={3}
                placeholder="Sin cebolla, término medio, referencia de entrega, etc."
                className="field-input mt-1 w-full"
              />
            </div>

            <div className="border-t border-slate-700 pt-2">
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-2xl font-bold text-emerald-300">${total.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                <Save size={16} />
                {isEditing ? 'Guardar cambios' : 'Guardar pedido'}
              </button>

              {isEditing ? (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Eliminar pedido
                </button>
              ) : (
                <button
                  onClick={() => navigate(tipoPedido === OrderType.DOMICILIO ? '/mesero/domicilios' : '/mesero/pedidos')}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </MeseroLayout>
  );
};
