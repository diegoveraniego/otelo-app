'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateHeader() {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    // We format the date on the client to avoid hydration mismatch and ensure local timezone
    const today = new Date();
    // Example: "lunes, 4 de mayo"
    const formatted = format(today, "EEEE, d 'de' MMMM", { locale: es });
    setDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  if (!dateStr) return <div className="h-8 mb-4"></div>;

  return (
    <div className="mb-6 px-1">
      <h2 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hoy</h2>
      <p className="text-2xl font-bold text-[#1E1E1E] dark:text-white">{dateStr}</p>
    </div>
  );
}
