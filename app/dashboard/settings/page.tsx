"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [platformFeePercent, setPlatformFeePercent] = useState(5);
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(50000);
  const [siteName, setSiteName] = useState("Kreasi");
  const [siteTagline, setSiteTagline] = useState("Multi-Seller Digital Product Marketplace");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("Jual & Beli Produk Digital Kreatif");
  const [heroSubheadline, setHeroSubheadline] = useState("Dapatkan template desain, preset Lightroom, motion template, font, dan aset digital terbaik dari para kreator Indonesia.");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [emailFrom, setEmailFrom] = useState("noreply@kreasi.id");
  const [notificationEmail, setNotificationEmail] = useState("admin@kreasi.id");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlatformFeePercent(data.platformFeePercent ?? 5);
          setMinWithdrawalAmount(data.minWithdrawalAmount ?? 50000);
          setSiteName(data.siteName || "");
          setSiteTagline(data.siteTagline || "");
          setLogoUrl(data.logoUrl || "");
          setHeroHeadline(data.heroHeadline || "");
          setHeroSubheadline(data.heroSubheadline || "");
          setInstagram(data.socialLinks?.instagram || "");
          setTiktok(data.socialLinks?.tiktok || "");
          setTwitter(data.socialLinks?.twitter || "");
          setEmailFrom(data.emailFrom || "");
          setNotificationEmail(data.notificationEmail || "");
          setWhatsappNumber(data.whatsappNumber || "");
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await setDoc(doc(db, "settings", "global"), {
        platformFeePercent: Number(platformFeePercent),
        minWithdrawalAmount: Number(minWithdrawalAmount),
        siteName,
        siteTagline,
        logoUrl,
        heroHeadline,
        heroSubheadline,
        socialLinks: {
          instagram,
          tiktok,
          twitter,
        },
        emailFrom,
        notificationEmail,
        whatsappNumber,
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error saving global settings:", err);
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Konfigurasi fee transaksi platform, minimum penarikan dana, dan konten storefront.</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 text-sm font-semibold">
          Pengaturan global berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Financial Config */}
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold border-b border-border pb-3">Parameter Finansial</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">POTONGAN FEE PLATFORM (FEE PERCENT %)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground">*Akan memotong gross_amount untuk platform fee (contoh: 5%)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">MINIMUM PENARIKAN DANA SELLER (IDR)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawalAmount}
                  onChange={(e) => setMinWithdrawalAmount(Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Branding content */}
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold border-b border-border pb-3">Konten & Branding Storefront</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">NAMA SITUS</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">TAGLINE SITUS</label>
                  <input
                    type="text"
                    required
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">URL LOGO UTAMA</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">HERO MAIN HEADLINE</label>
                <input
                  type="text"
                  required
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">HERO SUBHEADLINE</label>
                <textarea
                  rows={3}
                  required
                  value={heroSubheadline}
                  onChange={(e) => setHeroSubheadline(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Social */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-3">Media Sosial & Kontak</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">INSTAGRAM USERNAME</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="e.g. kreasi.id"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">TIKTOK USERNAME</label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="e.g. kreasi_id"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">TWITTER (X) USERNAME</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="e.g. kreasi_id"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">NOMOR WHATSAPP CONTACT (ID)</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 62812345678"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-3">Email Gateway Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">SENDER EMAIL (EMAIL FROM)</label>
                <input
                  type="email"
                  required
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  placeholder="noreply@domain.com"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">NOTIFIKASI EMAIL ADMIN</label>
                <input
                  type="email"
                  required
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </form>
    </div>
  );
}
