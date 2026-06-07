"use client";

import { useEffect, useState, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { Check, X, ExternalLink, AlertTriangle, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ProductCurationContent() {
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("reviewId");

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filter, setFilter] = useState("pending");
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);

      // Auto-select product if reviewId is present
      if (reviewId) {
        const item = list.find((p) => p.id === reviewId);
        if (item) {
          setSelectedProduct(item);
        }
      }
    } catch (err) {
      console.error("Error fetching products for curation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [reviewId]);

  const handleApprove = async (product: any) => {
    if (!confirm(`Apakah Anda yakin ingin menyetujui produk "${product.title}"?`)) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "products", product.id), {
        reviewStatus: "approved",
        reviewNote: "",
        reviewedAt: serverTimestamp(),
      });
      toast.success("Produk berhasil disetujui!");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Error approving product:", err);
      toast.error("Gagal menyetujui produk.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !rejectNote.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "products", selectedProduct.id), {
        reviewStatus: "rejected",
        reviewNote: rejectNote.trim(),
        reviewedAt: serverTimestamp(),
      });
      toast.success("Produk telah ditolak dengan catatan.");
      setShowRejectModal(false);
      setRejectNote("");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Error rejecting product:", err);
      toast.error("Gagal menolak produk.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = products.filter((p) => {
    if (filter === "all") return true;
    return p.reviewStatus === filter;
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
        <h1 className="text-3xl font-extrabold tracking-tight">Curation Queue (Review Produk)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tinjau metadata, detail gambar, dan link Google Drive produk seller sebelum dirilis ke publik.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {["pending", "approved", "rejected", "all"].map((t) => (
          <Button
            key={t}
            onClick={() => {
              setFilter(t);
              setSelectedProduct(null);
            }}
            variant="ghost"
            className={`capitalize rounded-none border-b-2 px-4 py-2 h-auto ${
              filter === t
                ? "border-accent text-accent font-bold hover:bg-transparent hover:text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {t === "all" ? "Semua" : t === "pending" ? "Menunggu Review" : t}
          </Button>
        ))}
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Product List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daftar Produk ({filteredList.length})</h3>
          
          {filteredList.length === 0 ? (
            <Card className="bg-surface border-border">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground">Tidak ada produk dalam antrian ini.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredList.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`cursor-pointer transition-colors ${
                    selectedProduct?.id === p.id 
                      ? "bg-surface-2 border-accent" 
                      : "bg-surface border-border hover:border-accent/50"
                  }`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-10 h-10 rounded border border-border object-cover bg-black"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Oleh: {p.sellerName} • {formatIDR(p.price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Inspection View */}
        <div className="lg:col-span-2">
          {!selectedProduct ? (
            <Card className="bg-surface border-border h-full">
              <CardContent className="p-12 text-center text-muted-foreground text-sm h-full flex flex-col justify-center items-center">
                <Check className="w-10 h-10 text-accent mb-4 stroke-1" />
                Pilih produk dari daftar sebelah kiri untuk memulai pemeriksaan kualitas.
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-surface border-border">
              <CardContent className="p-6 md:p-8 space-y-6">
                {/* Product Header */}
                <div className="flex justify-between items-start gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedProduct.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seller: <span className="text-foreground font-semibold">{selectedProduct.sellerName}</span> • 
                      ID: <span className="font-mono">{selectedProduct.id}</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedProduct)}
                      disabled={submitting || selectedProduct.reviewStatus === "approved"}
                      className="bg-green-600 hover:bg-green-700 text-foreground font-bold h-8 text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      disabled={submitting || selectedProduct.reviewStatus === "rejected"}
                      variant="destructive"
                      className="font-bold h-8 text-xs"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>

              {/* GDrive Link Curation Card */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> LINK FILES (GOOGLE DRIVE)
                </h4>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={selectedProduct.driveLink || ""}
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                  />
                  <a
                    href={selectedProduct.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-yellow-500 text-black p-2 rounded-lg hover:bg-yellow-400 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  *PENTING: Sebagai admin, klik tombol eksternal untuk memeriksa isi folder Google Drive tersebut dan pastikan file lengkap.
                </p>
              </div>

              {/* Images Preview Curation */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview Gambar</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <img
                    src={selectedProduct.thumbnail}
                    alt="Thumbnail"
                    className="aspect-video rounded border border-border object-cover bg-black"
                  />
                  {selectedProduct.previewImages?.map((url: string, i: number) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preview ${i}`}
                      className="aspect-video rounded border border-border object-cover bg-black"
                    />
                  ))}
                </div>
              </div>

              {/* Details specs */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Harga Jual</p>
                  <p className="font-bold text-foreground mt-0.5">{formatIDR(selectedProduct.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kategori</p>
                  <p className="font-bold text-foreground mt-0.5 capitalize">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ukuran File</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedProduct.fileSize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Software Diperlukan</p>
                  <p className="font-bold text-foreground mt-0.5">
                    {selectedProduct.softwareRequired?.join(", ") || "-"}
                  </p>
                </div>
              </div>

              {/* Description Curation */}
              <div className="border-t border-border pt-4 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deskripsi Singkat</h4>
                <p className="text-sm text-foreground">{selectedProduct.shortDescription}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deskripsi Lengkap</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{selectedProduct.description}</p>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-surface border-border text-foreground">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <MessageSquare className="w-5 h-5" /> Tolak Produk & Minta Revisi
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label className="text-muted-foreground">ALASAN PENOLAKAN / PANDUAN REVISI</Label>
              <Textarea
                required
                rows={4}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Tuliskan catatan mengapa produk ditolak agar seller mengetahui apa yang harus direvisi..."
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
                {submitting ? "Mengirim..." : "Kirim Catatan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProductCurationPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Memuat parameter...</div>}>
      <ProductCurationContent />
    </Suspense>
  );
}
