import fs from 'fs/promises';
import path from 'path';

const SRC_DIR = 'c:/PRPDETO/taosistem_backend/frontend/src';
const DEST_DIR = 'c:/PRPDETO/taosistem_backend/taosistem';

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      let content = await fs.readFile(srcPath, 'utf8');

      // Modificaciones generales
      
      // 1. react-router-dom -> next/navigation
      // Next JS 'useRouter' is from 'next/navigation' but uses .push() instead of .navigate().
      // React router's useNavigate returns a function. So: const navigate = useNavigate() => navigate('/path').
      // In Next.js: const router = useRouter() => router.push('/path'). We can auto-shim this!
      content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
        let newImports = imports;
        newImports = newImports.replace('useNavigate', 'useRouter');
        newImports = newImports.replace('Link', 'NextLink'); // Will need to define NextLink if used
        return `import { ${newImports} } from 'next/navigation';\nimport NextLink from 'next/link';`;
      });

      // Navigate function replacement shim in body
      content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();\n  const navigate = (path) => router.push(path);');
      content = content.replace(/import\s+NextLink\s+from\s+'next\/link';/g, "import Link from 'next/link';");
      content = content.replace(/NextLink/g, "Link");
      
      // 2. Services base URL
      // Change 'http://localhost:8000/api' or similar to '/api'
      if (srcPath.includes('utils\\api.ts') || srcPath.includes('utils/api.ts')) {
        content = content.replace(/baseURL:\s*['"`][^'"`]+['"`]/, 'baseURL: "/api"');
        content = content.replace(/import\.meta\.env\.VITE_API_URL/, '"/api"');
      }

      await fs.writeFile(destPath, content);
    }
  }
}

async function main() {
  console.log("Copiando y adaptando componentes y servicios...");
  
  await copyDir(path.join(SRC_DIR, 'components'), path.join(DEST_DIR, 'components'));
  await copyDir(path.join(SRC_DIR, 'types'), path.join(DEST_DIR, 'types'));
  await copyDir(path.join(SRC_DIR, 'utils'), path.join(DEST_DIR, 'utils'));
  await copyDir(path.join(SRC_DIR, 'services'), path.join(DEST_DIR, 'services'));
  await copyDir(path.join(SRC_DIR, 'hooks'), path.join(DEST_DIR, 'hooks'));

  // Create pages structure mapping
  const routeMap = {
    'login': 'LoginPage.tsx',
    'admin': 'DashboardPage.tsx',
    'admin/usuarios': 'UsuariosPage.tsx',
    'admin/productos': 'ProductosPage.tsx',
    'admin/descuentos': 'DescuentosPage.tsx',
    'admin/configuracion': 'ConfiguracionPage.tsx',
    'admin/historial': 'OrderHistoryAdminPage.tsx',
    'cocina/pedidos': 'cocina/PedidosCocinaPage.tsx',
    'cocina/historial': 'cocina/HistorialCocinaPage.tsx',
    'cajero': 'cajero/CajaPage.tsx',
    'mesero/pedidos': 'mesero/PedidosPage.tsx',
    'mesero/pedidos/nuevo': 'mesero/NuevoPedidoPage.tsx',
    'mesero/domicilios': 'mesero/DomiciliosPage.tsx',
    'mesero/pedidos/[id]/editar': 'mesero/NuevoPedidoPage.tsx' // Dynamic route
  };

  console.log("Generando rutas en app/ ...");
  
  for (const [routePath, componentFile] of Object.entries(routeMap)) {
    const fullDestDir = path.join(DEST_DIR, 'app', routePath);
    await fs.mkdir(fullDestDir, { recursive: true });
    
    // Page wrapper content
    const componentName = componentFile.split('/').pop().replace('.tsx', '');
    const wrapper = `
"use client";
import ${componentName} from '@/features/${componentFile.replace('.tsx', '')}';
export default function Page() {
  return <${componentName} />;
}
    `.trim();

    await fs.writeFile(path.join(fullDestDir, 'page.tsx'), wrapper);
  }

  // Copy pages for imports
  await copyDir(path.join(SRC_DIR, 'pages'), path.join(DEST_DIR, 'pages'));
  
  // Create middleware.ts at root for redirects if needed, but we already have api-helpers for API.
  // We'll let Next.js handle protected routes in client for speed (like React did).

  console.log("Migracion de archivos finalizada.");
}

main().catch(console.error);
