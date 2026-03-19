import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Minus, Plus, Trash2, Save, ArrowLeft, ShoppingCart, Bike, Store } from 'lucide-react';
import { MeseroLayout } from '../../components/MeseroLayout';
import { OrderType, Product } from '../../types';
import { productService } from '../../services/productService';
import { OrderItemPayload, ordersService } from '../../services/orders';

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

  const imageSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('/img/')) return url;   // served from frontend /public/img
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${base}${url}`;
  };

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
        <div className="h-56 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
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
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar pedido' : 'Nuevo pedido'}
          </h1>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTipoPedido(OrderType.MESA)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  tipoPedido === OrderType.MESA ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-300 text-gray-700'
                }`}
              >
                <Store size={16} />
                Mesa
              </button>
              <button
                onClick={() => setTipoPedido(OrderType.DOMICILIO)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  tipoPedido === OrderType.DOMICILIO ? 'bg-primary-100 text-primary-700 border-primary-200' : 'border-gray-300 text-gray-700'
                }`}
              >
                <Bike size={16} />
                Domicilio
              </button>
            </div>

            {tipoPedido === OrderType.MESA ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Mesa</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {mesasRapidas.map((mesa) => (
                    <button
                      key={mesa}
                      onClick={() => setMesaNumero(mesa)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        mesaNumero === mesa
                          ? 'bg-primary-100 text-primary-700 border-primary-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
                  className="w-full md:w-44 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <input
                    value={clienteNombre}
                    onChange={(event) => setClienteNombre(event.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    value={clienteTelefono}
                    onChange={(event) => setClienteTelefono(event.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="3001234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Dirección</label>
                  <textarea
                    value={direccionEntrega}
                    onChange={(event) => setDireccionEntrega(event.target.value)}
                    rows={3}
                    className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="Barrio, referencia, apartamento, etc."
                  />
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Menú disponible</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => {
                  const inCart = cart.find((c) => c.product_id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                        inCart
                          ? 'border-primary-400 shadow-md shadow-primary-100'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {/* Image or emoji fallback */}
                      {product.imagen_url ? (
                        <img
                          src={imageSrc(product.imagen_url)}
                          alt={product.nombre}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl">
                          {categoryEmoji(product.categoria)}
                        </div>
                      )}

                      {/* In-cart badge */}
                      {inCart && (
                        <span className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                          x{inCart.cantidad}
                        </span>
                      )}

                      <div className="p-2.5">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.nombre}</p>
                        <p className="text-sm text-primary-700 font-bold mt-0.5">${Number(product.precio).toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <h2 className="font-semibold text-gray-900">Resumen del pedido</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no agregas productos.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product_id} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-xs text-gray-500">${item.precio_unitario.toFixed(2)} c/u</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.cantidad - 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-6 text-center text-sm">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.cantidad + 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-600 hover:text-red-700"
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
              <label className="text-sm font-medium text-gray-700">Notas especiales</label>
              <textarea
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                rows={3}
                placeholder="Sin cebolla, término medio, referencia de entrega, etc."
                className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-primary-700">${total.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              >
                <Save size={16} />
                {isEditing ? 'Guardar cambios' : 'Guardar pedido'}
              </button>

              {isEditing ? (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Eliminar pedido
                </button>
              ) : (
                <button
                  onClick={() => navigate(tipoPedido === OrderType.DOMICILIO ? '/mesero/domicilios' : '/mesero/pedidos')}
                  className="rounded-lg px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
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
