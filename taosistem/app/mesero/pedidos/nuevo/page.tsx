import NuevoPedidoPage from '@/features/mesero/NuevoPedidoPage';

interface PageProps {
  searchParams?: Promise<{ tipo?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <NuevoPedidoPage initialTipo={resolvedSearchParams?.tipo} />;
}
