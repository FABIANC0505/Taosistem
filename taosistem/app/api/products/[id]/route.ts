import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: ProductRouteContext) {
  const { id } = await context.params;
  try {
    const products = await query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) return NextResponse.json({ detail: 'Producto no encontrado' }, { status: 404 });
    const product = products[0];
    product.precio = parseFloat(product.precio);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: ProductRouteContext) {
  const { id } = await context.params;
  try {
    const products = await query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) return NextResponse.json({ detail: 'Producto no encontrado' }, { status: 404 });
    const product = products[0];

    const formData = await req.formData();
    const nombre = formData.get('nombre') as string;
    const precio = formData.get('precio') as string;
    const categoria = formData.get('categoria') as string;
    const descripcion = formData.get('descripcion') as string;
    const disponibleStr = formData.get('disponible') as string;
    const imagen = formData.get('imagen') as File;

    let imagen_url = product.imagen_url;

    if (imagen && imagen.size > 0) {
      const buffer = Buffer.from(await imagen.arrayBuffer());
      const ext = imagen.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
      
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      await writeFile(join(uploadDir, filename), buffer);
      imagen_url = `/uploads/products/${filename}`;
    }

    const updates = [];
    const values = [];

    if (nombre) { updates.push('nombre = ?'); values.push(nombre); product.nombre = nombre; }
    if (precio) { updates.push('precio = ?'); values.push(parseFloat(precio)); product.precio = parseFloat(precio); }
    if (categoria) { updates.push('categoria = ?'); values.push(categoria); product.categoria = categoria; }
    if (descripcion !== null && descripcion !== undefined) { updates.push('descripcion = ?'); values.push(descripcion); product.descripcion = descripcion; }
    if (disponibleStr) { 
        const isDisponible = disponibleStr === 'true';
        updates.push('disponible = ?'); values.push(isDisponible); product.disponible = isDisponible; 
    }
    if (imagen_url !== product.imagen_url) { updates.push('imagen_url = ?'); values.push(imagen_url); product.imagen_url = imagen_url; }

    const now = new Date();
    updates.push('updated_at = ?');
    values.push(now);
    product.updated_at = now;

    values.push(id);

    if (updates.length > 1) { // includes updated_at
        await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    product.precio = parseFloat(product.precio);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: ProductRouteContext) {
  const { id } = await context.params;
  try {
    const products = await query<any[]>('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) return NextResponse.json({ detail: 'Producto no encontrado' }, { status: 404 });

    await query('DELETE FROM products WHERE id = ?', [id]);
    return NextResponse.json({ detail: 'Producto eliminado' });
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
