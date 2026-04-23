import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const products = await query<any[]>('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json(products.map(p => ({
        ...p,
        precio: parseFloat(p.precio)
    })));
  } catch (error) {
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const nombre = formData.get('nombre') as string;
    const precio = parseFloat(formData.get('precio') as string);
    const categoria = formData.get('categoria') as string;
    const descripcion = formData.get('descripcion') as string;
    const imagen = formData.get('imagen') as File;

    if (!nombre || isNaN(precio) || !categoria) {
      return NextResponse.json({ detail: 'Faltan datos' }, { status: 422 });
    }

    let imagen_url = null;

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

    const newId = crypto.randomUUID();
    const now = new Date();

    await query(
      'INSERT INTO products (id, nombre, precio, descripcion, categoria, disponible, imagen_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, nombre, precio, descripcion || null, categoria, true, imagen_url, now, now]
    );

    return NextResponse.json({
      id: newId,
      nombre,
      precio,
      descripcion: descripcion || null,
      categoria,
      disponible: true,
      imagen_url,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ detail: 'Error interno' }, { status: 500 });
  }
}
