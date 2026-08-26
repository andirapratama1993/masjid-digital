// =============================================
// Hadith Collection — Keutamaan Sholat & Hari Jumat
// All hadiths are sahih, presented in Indonesian
// No Arabic text — just translation + source
// =============================================

export interface Hadith {
  text: string        // Indonesian translation
  source: string      // e.g. "HR. Bukhari No. 527"
  topic: string       // e.g. "Keutamaan Sholat Berjamaah"
}

// =============================================
// Hadiths about prayer (general)
// Rotated during normal weekdays
// =============================================
export const PRAYER_HADITHS: Hadith[] = [
  {
    text: "Sholat berjamaah lebih utama daripada sholat sendirian dengan dua puluh tujuh derajat.",
    source: "HR. Bukhari No. 645 & Muslim No. 650",
    topic: "Keutamaan Sholat Berjamaah",
  },
  {
    text: "Amal yang paling dicintai Allah adalah sholat pada waktunya, kemudian berbakti kepada orang tua, kemudian jihad di jalan Allah.",
    source: "HR. Bukhari No. 527 & Muslim No. 85",
    topic: "Sholat Tepat Waktu",
  },
  {
    text: "Perbedaan antara seseorang dengan kemusyrikan dan kekafiran adalah meninggalkan sholat.",
    source: "HR. Muslim No. 82",
    topic: "Kewajiban Sholat",
  },
  {
    text: "Barangsiapa yang menjaga sholat lima waktu — wudhunya, waktunya, rukuknya, dan sujudnya — maka sholatnya akan menjadi cahaya, bukti, dan keselamatan baginya pada hari kiamat.",
    source: "HR. Ahmad No. 6590",
    topic: "Menjaga Sholat Lima Waktu",
  },
  {
    text: "Tidakkah kalian mau aku beritahu tentang sesuatu yang dengannya Allah menghapus dosa-dosa dan mengangkat derajat? Para sahabat menjawab: Tentu, ya Rasulullah. Beliau bersabda: Menyempurnakan wudhu dalam keadaan tidak menyukainya, banyak melangkah ke masjid, dan menunggu sholat setelah sholat. Itulah ribath (penjagaan).",
    source: "HR. Muslim No. 251",
    topic: "Keutamaan Menunggu Sholat",
  },
  {
    text: "Sesungguhnya sholat yang paling berat bagi orang munafik adalah sholat Isya dan sholat Subuh. Seandainya mereka mengetahui apa yang ada di dalamnya, niscaya mereka akan mendatanginya meskipun dengan merangkak.",
    source: "HR. Bukhari No. 657 & Muslim No. 651",
    topic: "Keutamaan Sholat Subuh dan Isya",
  },
  {
    text: "Barangsiapa yang sholat Subuh maka ia berada dalam jaminan Allah. Maka janganlah sampai Allah menuntut kalian dalam jaminan-Nya dengan sesuatu.",
    source: "HR. Muslim No. 657",
    topic: "Keutamaan Sholat Subuh",
  },
  {
    text: "Dua rakaat sholat Subuh lebih baik daripada dunia dan seisinya.",
    source: "HR. Muslim No. 725",
    topic: "Keutamaan Sholat Subuh",
  },
  {
    text: "Barangsiapa yang sholat Ashar maka ia tidak akan kehilangan (pahala) sama sekali, dan barangsiapa yang meninggalkan sholat Ashar maka amalnya akan terhapus.",
    source: "HR. Bukhari No. 553",
    topic: "Keutamaan Sholat Ashar",
  },
  {
    text: "Hendaklah kalian melakukan sholat Subuh dan Ashar karena sesungguhnya malaikat berkumpul pada waktu sholat Subuh dan waktu sholat Ashar.",
    source: "HR. Bukhari No. 555 & Muslim No. 632",
    topic: "Waktu Berkumpulnya Malaikat",
  },
  {
    text: "Sesungguhnya pertama kali yang akan dihisab dari seorang hamba pada hari kiamat adalah sholatnya. Apabila baik sholatnya maka baik pula seluruh amalnya, dan apabila buruk sholatnya maka buruk pula seluruh amalnya.",
    source: "HR. Tirmidzi No. 413",
    topic: "Sholat Amalan Pertama Dihisab",
  },
  {
    text: "Sholat adalah tiang agama. Barangsiapa yang mendirikannya maka ia telah menegakkan agama, dan barangsiapa yang meninggalkannya maka ia telah merobohkan agama.",
    source: "HR. Baihaqi dalam Syu'ab al-Iman",
    topic: "Sholat Tiang Agama",
  },
  {
    text: "Apabila engkau sholat maka sholatlah seperti sholatnya orang yang sedang berpamitan (tidak akan kembali).",
    source: "HR. Ibnu Majah No. 4171",
    topic: "Khusyu dalam Sholat",
  },
  {
    text: "Sedekat-dekatnya seorang hamba kepada Rabb-nya adalah ketika ia sedang bersujud, maka perbanyaklah doa.",
    source: "HR. Muslim No. 482",
    topic: "Keutamaan Sujud",
  },
  {
    text: "Sesungguhnya seorang hamba apabila berdiri untuk sholat maka semua dosanya dihadirkan dan diletakkan di atas kepalanya dan bahunya. Setiap kali ia ruku atau sujud maka gugurlah dosa-dosa tersebut.",
    source: "HR. Baihaqi dalam As-Sunan Al-Kubra",
    topic: "Sholat Menghapus Dosa",
  },
]

// =============================================
// Hadiths about Friday (Jumat)
// Displayed every Friday
// =============================================
export const FRIDAY_HADITHS: Hadith[] = [
  {
    text: "Hari terbaik yang matahari terbit padanya adalah hari Jumat. Pada hari itu Adam diciptakan, pada hari itu ia dimasukkan ke surga, dan pada hari itu ia dikeluarkan dari surga. Kiamat tidak akan terjadi kecuali pada hari Jumat.",
    source: "HR. Muslim No. 854",
    topic: "Keutamaan Hari Jumat",
  },
  {
    text: "Pada hari Jumat terdapat satu waktu yang tidaklah seorang muslim berdiri sholat memohon sesuatu kepada Allah melainkan Allah akan memberinya.",
    source: "HR. Bukhari No. 935 & Muslim No. 852",
    topic: "Waktu Mustajab di Hari Jumat",
  },
  {
    text: "Sholat Jumat itu wajib bagi setiap muslim dalam berjamaah kecuali empat orang: budak yang dimiliki, wanita, anak kecil, dan orang yang sakit.",
    source: "HR. Abu Dawud No. 1067",
    topic: "Kewajiban Sholat Jumat",
  },
  {
    text: "Orang yang mandi pada hari Jumat, kemudian berangkat di awal waktu atau awal waktu kedua, kemudian duduk mendengarkan khutbah dan tidak bermain-main, maka baginya pahala seperti orang yang berqurban seekor unta.",
    source: "HR. Bukhari No. 881",
    topic: "Keutamaan Menyegerakan Sholat Jumat",
  },
  {
    text: "Barangsiapa yang berwudhu kemudian menyempurnakan wudhunya, lalu pergi ke Jumat, kemudian mendengar dan diam, maka diampunkan dosa-dosanya antara hari Jumat tersebut dengan Jumat berikutnya ditambah tiga hari.",
    source: "HR. Muslim No. 857",
    topic: "Ampunan Dosa di Hari Jumat",
  },
  {
    text: "Perbanyaklah membaca shalawat kepadaku pada hari Jumat karena shalawat kalian disampaikan kepadaku.",
    source: "HR. Abu Dawud No. 1047",
    topic: "Memperbanyak Shalawat di Hari Jumat",
  },
  {
    text: "Barangsiapa yang meninggalkan tiga Jumat karena meremehkannya maka Allah akan menutup hatinya.",
    source: "HR. Abu Dawud No. 1052 & Tirmidzi No. 500",
    topic: "Larangan Meninggalkan Sholat Jumat",
  },
  {
    text: "Hari Jumat adalah penghulu segala hari dan hari yang paling agung di sisi Allah. Ia lebih agung di sisi Allah daripada hari Idul Adha dan Idul Fitri.",
    source: "HR. Ibnu Majah No. 1084",
    topic: "Keagungan Hari Jumat",
  },
]

// =============================================
// Get hadith based on current day and index
// =============================================
export function getHadith(date: Date, index: number): Hadith {
  const isFriday = date.getDay() === 5 // 5 = Friday
  const list = isFriday ? FRIDAY_HADITHS : PRAYER_HADITHS
  return list[index % list.length]
}

export function getHadithCount(date: Date): number {
  return date.getDay() === 5 ? FRIDAY_HADITHS.length : PRAYER_HADITHS.length
}
