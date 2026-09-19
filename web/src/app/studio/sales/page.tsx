"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Sale } from "@/lib/types";

export default function StudioSalesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [total, setTotal] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .sales()
      .then((data) => {
        setTotal(data.total_earnings_inr);
        setSales(data.results);
      })
      .catch(() => undefined);
  }, [user]);

  if (!ready || !user) return null;

  return (
    <div>
      <h1 className="font-serif text-4xl">Sales</h1>
      <p className="mt-2 text-muted">Your earnings after the platform fee. Razorpay Route settlements come later.</p>
      <p className="mt-6 font-serif text-3xl text-gold">₹{total.toLocaleString("en-IN")}</p>
      <ul className="mt-8 space-y-3">
        {sales.map((sale) => (
          <li key={sale.id} className="flex justify-between gap-4 border-b border-line py-3 text-sm">
            <span>
              {sale.track_title}
              <span className="block text-muted">₹{sale.amount_inr} sale · ₹{sale.platform_fee_inr} fee</span>
            </span>
            <span>₹{sale.artist_earnings_inr.toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
