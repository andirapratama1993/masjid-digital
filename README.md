# Masjid Digital

Papan Informasi Digital Masjid berbasis web — jadwal sholat realtime, kegiatan masjid, dan laporan keuangan.

## Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Styling**: Tailwind CSS v4

## Fitur

- Jam digital realtime dengan animasi nuansa islami
- Jadwal sholat 5 waktu dari API Kemenag Indonesia
- Notifikasi azan, hitungan mundur iqomah, dan peringatan shaf
- Jadwal kegiatan masjid mingguan + galeri foto
- Laporan keuangan (saldo, pemasukan, pengeluaran) mingguan & bulanan
- Panel admin dengan login (default: admin/admin)
- Semua pengaturan dapat dikonfigurasi via halaman settings

## Setup Lokal

### 1. Clone & Install

```bash
git clone https://github.com/username/masjid-digital.git
cd masjid-digital
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi nilai Supabase & JWT.

### 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan `supabase/schema.sql`
3. Buka **Storage** dan buat 2 bucket:
   - `mosque-assets` (Public)
   - `activity-images` (Public)
4. Salin URL dan keys dari **Settings → API**

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk tampilan utama.
Buka [http://localhost:3000/settings](http://localhost:3000/settings) untuk panel admin.

**Login default**: username `admin`, password `admin`

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "Initial commit: Masjid Digital"
git push origin main
```

### 2. Import di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository GitHub
3. Di **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
4. Klik **Deploy**

## Struktur Halaman

| URL | Deskripsi |
|-----|-----------|
| `/` | Tampilan utama (display board) |
| `/login` | Halaman login admin |
| `/settings` | Panel pengaturan (perlu login) |

## Pengaturan via Panel Admin

- **Umum**: Nama masjid, logo
- **Sholat**: Kota (untuk jadwal sholat), durasi notifikasi/azan/iqomah
- **Kegiatan**: Tambah/edit/hapus kegiatan mingguan, upload foto
- **Keuangan**: Input transaksi, atur saldo awal
- **Tampilan**: Durasi rotasi, warna jam & waktu sholat

## Ganti Password Admin

Edit `lib/auth.ts` baris `ADMIN_PASSWORD`:

```typescript
const ADMIN_PASSWORD = 'password_baru_anda'
```

Atau untuk keamanan lebih, simpan di environment variable.
