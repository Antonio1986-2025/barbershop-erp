'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  service: string;
};

export default function Home() {
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">Barbershop ERP</h1>
      <div className="rounded-lg border p-6 text-center">
        <h2 className="text-lg font-semibold">API Status</h2>
        {data ? (
          <div className="mt-4 space-y-2">
            <p>
              Status: <span className="font-medium text-green-600">{data.status}</span>
            </p>
            <p>
              Service: <span className="font-medium">{data.service}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-zinc-500">Conectando...</p>
        )}
      </div>
    </div>
  );
}
