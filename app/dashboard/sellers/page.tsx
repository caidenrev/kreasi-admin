"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sellerToToggle, setSellerToToggle] = useState<{ id: string; name: string; currentStatus: string } | null>(null);

  const fetchSellers = async () => {
    try {
      const q = query(collection(db, "sellers"), orderBy("joinedAt", "desc"));
      const snap = await getDocs(q);
      setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching sellers list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleToggleStatus = (id: string, name: string, currentStatus: string) => {
    setSellerToToggle({ id, name, currentStatus });
    setShowStatusModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!sellerToToggle) return;
    const { id, currentStatus } = sellerToToggle;
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    
    try {
      await updateDoc(doc(db, "sellers", id), { status: nextStatus });
      setSellers(sellers.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)));
      setShowStatusModal(false);
      setSellerToToggle(null);
    } catch (err) {
      console.error("Error toggling seller status:", err);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Daftar Seller Mitra</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola status akun seller dan pantau saldo earnings yang mereka miliki di platform.
        </p>
      </div>

      {/* Sellers Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {sellers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Belum ada seller terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-surface-2">
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Total Penjualan</th>
                  <th className="px-6 py-4">Saldo Wallet</th>
                  <th className="px-6 py-4">Bergabung</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center font-bold text-accent">
                          {s.displayName ? s.displayName[0].toUpperCase() : "S"}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{s.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{s.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{s.email}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{s.totalSales || 0} unit</td>
                    <td className="px-6 py-4 font-bold text-accent">{formatIDR(s.walletBalance)}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {s.joinedAt?.toDate().toLocaleDateString("id-ID") || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          s.status === "active"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {s.status === "active" ? "Aktif" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.displayName || s.username, s.status)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                          s.status === "active"
                            ? "bg-surface-3 text-red-400 border-red-500/15 hover:bg-red-500/10"
                            : "bg-green-600 text-foreground border-green-700 hover:bg-green-700"
                        }`}
                      >
                        {s.status === "active" ? "Suspend Account" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="status-dialog-description">
          <DialogHeader>
            <DialogTitle>Konfirmasi Ubah Status</DialogTitle>
            <DialogDescription id="status-dialog-description" className="py-4 text-sm text-muted-foreground">
              Apakah Anda yakin ingin mengubah status seller <strong>"{sellerToToggle?.name}"</strong> menjadi{" "}
              <strong className="text-foreground">{sellerToToggle?.currentStatus === "active" ? "Suspended" : "Active"}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Batal
            </Button>
            <Button 
              variant={sellerToToggle?.currentStatus === "active" ? "destructive" : "default"} 
              onClick={confirmToggleStatus}
            >
              Ya, Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
