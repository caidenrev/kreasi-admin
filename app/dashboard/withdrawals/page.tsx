"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, orderBy, where } from "firebase/firestore";
import { CreditCard, CheckCircle2, Clock, XCircle, ArrowUpRight, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "withdrawals"), orderBy("requestedAt", "desc"));
      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, nextStatus: "processing" | "completed", amount: number, sellerId: string) => {
    if (!confirm(`Apakah Anda yakin ingin memproses status penarikan menjadi "${nextStatus}"?`)) return;
    setSubmitting(true);
    try {
      const docRef = doc(db, "withdrawals", id);
      await updateDoc(docRef, {
        status: nextStatus,
        processedAt: serverTimestamp(),
      });
      toast.success(`Status penarikan dana berhasil diperbarui menjadi ${nextStatus}.`);
      fetchRequests();
    } catch (err) {
      console.error("Error updating withdrawal status:", err);
      toast.error("Gagal memperbarui status penarikan dana.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !adminNote.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "withdrawals", selectedReq.id), {
        status: "rejected",
        adminNote: adminNote.trim(),
        processedAt: serverTimestamp(),
      });
      toast.success("Permintaan penarikan berhasil ditolak.");
      setShowRejectModal(false);
      setAdminNote("");
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting withdrawal:", err);
      toast.error("Gagal menolak penarikan dana.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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
        <h1 className="text-3xl font-extrabold tracking-tight">Withdrawal Queue (Antrian Payout)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Proses permintaan pencairan dana seller. Transfer nominal dana secara manual ke rekening tujuan lalu tandai transaksi sebagai Selesai.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {["pending", "processing", "completed", "rejected", "all"].map((t) => (
          <Button
            key={t}
            onClick={() => setFilter(t)}
            variant="ghost"
            className={`capitalize rounded-none border-b-2 px-4 py-2 h-auto ${
              filter === t
                ? "border-accent text-accent font-bold hover:bg-transparent hover:text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {t === "all" ? "Semua" : t === "pending" ? "Menunggu Konfirmasi" : t}
          </Button>
        ))}
      </div>

      {/* Requests Grid */}
      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Tidak ada permintaan penarikan dana ditemukan.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-surface-2">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Seller</TableHead>
                  <TableHead className="text-muted-foreground">Jumlah Penarikan</TableHead>
                  <TableHead className="text-muted-foreground">Info Rekening Tujuan</TableHead>
                  <TableHead className="text-muted-foreground">Tanggal Pengajuan</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="border-border hover:bg-surface-2">
                    <TableCell className="font-semibold text-foreground">{req.sellerName}</TableCell>
                    <TableCell className="font-bold text-accent">{formatIDR(req.amount)}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5 text-foreground">
                        <p className="font-semibold">{req.bankInfo?.bankName}</p>
                        <p className="font-mono text-zinc-400">{req.bankInfo?.accountNumber}</p>
                        <p className="text-muted-foreground">A/N {req.bankInfo?.accountName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {req.requestedAt?.toDate().toLocaleString("id-ID") || "-"}
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Pending
                        </Badge>
                      )}
                      {req.status === "processing" && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Diproses
                        </Badge>
                      )}
                      {req.status === "completed" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai
                        </Badge>
                      )}
                      {req.status === "rejected" && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Ditolak
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(req.id, "processing", req.amount, req.sellerId)}
                            className="bg-blue-600 hover:bg-blue-700 text-foreground font-bold h-7 px-2 text-xs"
                          >
                            Proses Payout
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setShowRejectModal(true);
                            }}
                            className="bg-surface-3 hover:bg-red-500/20 hover:text-red-400 text-foreground font-bold h-7 px-2 text-xs"
                          >
                            Tolak
                          </Button>
                        </>
                      )}
                      {req.status === "processing" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(req.id, "completed", req.amount, req.sellerId)}
                            className="bg-green-600 hover:bg-green-700 text-foreground font-bold h-7 px-2 text-xs"
                          >
                            Selesai Transfer
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setShowRejectModal(true);
                            }}
                            className="bg-surface-3 hover:bg-red-500/20 hover:text-red-400 text-foreground font-bold h-7 px-2 text-xs"
                          >
                            Tolak
                          </Button>
                        </>
                      )}
                      {(req.status === "completed" || req.status === "rejected") && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-surface border-border text-foreground">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle className="text-red-500">Tolak Permintaan Penarikan</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label className="text-muted-foreground">ALASAN PENOLAKAN</Label>
              <Textarea
                required
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Berikan alasan mengapa penarikan dana ditolak (misal: nomor rekening salah)..."
                className="bg-surface-2 border-border text-foreground focus-visible:ring-red-500"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="bg-surface-3 border-border hover:bg-[#3A3A3A] text-foreground"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                variant="destructive"
              >
                {submitting ? "Memproses..." : "Tolak Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
