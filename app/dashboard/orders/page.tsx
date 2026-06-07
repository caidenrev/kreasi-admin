"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { RefreshCw, Mail, CheckCircle2, AlertTriangle, Clock, Download } from "lucide-react";
import Papa from "papaparse";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleResendEmail = async (orderId: string) => {
    toast.success(`Memicu pengiriman ulang email backup untuk Order #${orderId}.`);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        deliveryStatus: "pending", // Cloud function will re-trigger
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order for email resend:", err);
      toast.error("Gagal mengirim ulang email");
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = orders.map((o) => ({
      "Order ID": o.id,
      "Tanggal": o.createdAt?.toDate().toLocaleString("id-ID") || "-",
      "Buyer Name": o.buyer?.name || "-",
      "Buyer Email": o.buyer?.email || "-",
      "Produk": o.items?.map((i: any) => `${i.productTitle} (by ${i.sellerName})`).join("; ") || "-",
      "Total Bayar": o.totalAmount || 0,
      "Platform Fee": o.totalPlatformFee || 0,
      "Status Bayar": o.paymentStatus || "-",
      "Status Kirim": o.deliveryStatus || "pending",
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Berhasil mengekspor data ke CSV");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Semua Transaksi Pesanan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar riwayat seluruh pesanan buyer dari semua seller di platform Kreasi.
          </p>
        </div>
        <Button 
          onClick={handleExportCSV} 
          disabled={orders.length === 0}
          className="bg-accent text-black hover:bg-accent-hover font-bold"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Belum ada transaksi di platform.</div>
          ) : (
            <Table>
              <TableHeader className="bg-surface-2">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Tanggal</TableHead>
                  <TableHead className="text-muted-foreground">Buyer</TableHead>
                  <TableHead className="text-muted-foreground">Produk & Seller</TableHead>
                  <TableHead className="text-muted-foreground">Total Bayar</TableHead>
                  <TableHead className="text-muted-foreground">Platform Fee (5%)</TableHead>
                  <TableHead className="text-muted-foreground">Status Bayar</TableHead>
                  <TableHead className="text-muted-foreground">Status Kirim</TableHead>
                  <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="border-border hover:bg-surface-2">
                    <TableCell className="font-mono text-xs text-foreground">{o.id}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {o.createdAt?.toDate().toLocaleString("id-ID") || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-foreground">{o.buyer?.name}</p>
                        <p className="text-muted-foreground font-mono">{o.buyer?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {o.items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-foreground">{item.productTitle}</span>{" "}
                            <span className="text-muted-foreground">by {item.sellerName}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{formatIDR(o.totalAmount)}</TableCell>
                    <TableCell className="font-bold text-accent">{formatIDR(o.totalPlatformFee)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          o.paymentStatus === "paid"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : o.paymentStatus === "pending"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {o.deliveryStatus === "delivered" ? (
                        <Badge variant="outline" className="bg-transparent border-transparent text-green-400 hover:bg-transparent">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Terkirim
                        </Badge>
                      ) : o.deliveryStatus === "failed" ? (
                        <Badge variant="outline" className="bg-transparent border-transparent text-red-400 hover:bg-transparent">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Gagal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-transparent border-transparent text-yellow-400 animate-pulse hover:bg-transparent">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.paymentStatus === "paid" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleResendEmail(o.id)}
                          className="bg-surface-3 hover:bg-accent hover:text-black text-foreground h-8 w-8"
                          title="Kirim Ulang Email Backup"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
