"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Wallet, ShoppingBag, Users, Package, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFeeCollected: 0,
    totalOrders: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        // Fetch orders
        const ordersSnap = await getDocs(collection(db, "orders"));
        const paidOrders = ordersSnap.docs.map((doc) => doc.data()).filter((o) => o.paymentStatus === "paid");
        
        const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const platformFeeCollected = paidOrders.reduce((acc, curr) => acc + (curr.totalPlatformFee || 0), 0);
        const totalOrders = paidOrders.length;

        // Fetch sellers
        const sellersSnap = await getDocs(collection(db, "sellers"));
        const totalSellers = sellersSnap.size;

        // Fetch products
        const productsSnap = await getDocs(collection(db, "products"));
        const totalProducts = productsSnap.docs.map((doc) => doc.data()).filter((p) => p.reviewStatus === "approved").length;

        // Fetch customers
        const customersSnap = await getDocs(collection(db, "customers"));
        const totalCustomers = customersSnap.size;

        // Fetch pending products
        const pendingQuery = query(
          collection(db, "products"),
          where("reviewStatus", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const pendingSnap = await getDocs(pendingQuery);
        const pendingProducts = pendingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        setStats({
          totalRevenue,
          platformFeeCollected,
          totalOrders,
          totalSellers,
          totalProducts,
          totalCustomers,
        });
        setPendingProducts(pendingProducts);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformStats();
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-border"></div>
          ))}
        </div>
        <div className="h-64 bg-surface rounded-xl border border-border"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Status performa finansial dan operasional pasar digital Kreasi.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Volume (GMV)</p>
          <p className="text-xl font-bold truncate">{formatIDR(stats.totalRevenue)}</p>
          <div className="text-[10px] text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Akumulasi transaksi
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Fee (5%)</p>
          <p className="text-xl font-bold text-accent truncate">{formatIDR(stats.platformFeeCollected)}</p>
          <div className="text-[10px] text-muted-foreground">Pendapatan Platform</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Penjualan</p>
          <p className="text-xl font-bold">{stats.totalOrders} unit</p>
          <div className="text-[10px] text-muted-foreground">Transaksi sukses</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Seller</p>
          <p className="text-xl font-bold">{stats.totalSellers} user</p>
          <div className="text-[10px] text-muted-foreground">Mitra kreator</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produk Aktif</p>
          <p className="text-xl font-bold">{stats.totalProducts} item</p>
          <div className="text-[10px] text-muted-foreground">Telah di-approve</div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Buyer</p>
          <p className="text-xl font-bold">{stats.totalCustomers} customer</p>
          <div className="text-[10px] text-muted-foreground">Unik per email</div>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Curation Queue Alerts */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Antrian Moderasi Produk Baru
            </h3>
            <Link href="/dashboard/products" className="text-xs text-accent hover:underline">
              Buka Semua
            </Link>
          </div>

          {pendingProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Antrian bersih. Tidak ada produk baru yang menunggu kurasi.</p>
          ) : (
            <div className="divide-y divide-border">
              {pendingProducts.map((p) => (
                <div key={p.id} className="py-4 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-10 h-10 rounded border border-border object-cover bg-surface-2"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Oleh: {p.sellerName} • Kategori: {p.category}
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/dashboard/products?reviewId=${p.id}`}
                    className="bg-accent hover:bg-accent-hover text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Tinjau File
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Controls Info Card */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Platform Configuration</h3>
            <p className="text-xs text-muted-foreground">
              Sebagai Owner/Administrator, Anda dapat mengatur parameter bisnis platform Kreasi secara langsung melalui menu pengaturan global.
            </p>
            <ul className="text-xs text-foreground space-y-2 list-disc pl-4">
              <li>Ubah % platform fee potongan owner (default 5%)</li>
              <li>Atur nilai batas penarikan dana seller</li>
              <li>Modifikasi tagline & headline hero utama storefront</li>
            </ul>
          </div>

          <Link
            href="/dashboard/settings"
            className="w-full text-center border border-border hover:bg-surface-2 text-foreground py-2.5 rounded-lg text-xs font-bold transition-colors block mt-6"
          >
            Buka Pengaturan
          </Link>
        </div>
      </div>
    </div>
  );
}
