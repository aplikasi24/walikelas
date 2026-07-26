const fs = require('fs');
const path = require('path');

const menus = [
    { name: "Dashboard", file: "index.html", icon: "fa-home", title: "Dashboard", desc: "Ringkasan aktivitas dan data kelas hari ini." },
    { name: "Data Siswa", file: "siswa.html", icon: "fa-users", title: "Data Siswa", desc: "Kelola data profil siswa kelas Anda." },
    { name: "Mata Pelajaran", file: "mapel.html", icon: "fa-book-open", title: "Mata Pelajaran", desc: "Daftar mata pelajaran yang Anda ampu." },
    { name: "Jadwal Mengajar", file: "jadwal.html", icon: "fa-calendar-alt", title: "Jadwal Mengajar", desc: "Jadwal mengajar harian Anda." },
    { name: "Absensi Siswa", file: "absensi.html", icon: "fa-user-check", title: "Absensi Siswa", desc: "Kelola kehadiran siswa (Hadir, Izin, Sakit, Alpa)." },
    { name: "Nilai Siswa", file: "nilai.html", icon: "fa-chart-bar", title: "Nilai Siswa", desc: "Rekapitulasi dan input nilai akademik." },
    { name: "Jurnal Mengajar", file: "jurnal.html", icon: "fa-edit", title: "Jurnal Mengajar", desc: "Catat jurnal kegiatan belajar mengajar harian." },
    { name: "Tugas Siswa", file: "tugas.html", icon: "fa-tasks", title: "Tugas Siswa", desc: "Manajemen tugas dan penilaian siswa." },
    { name: "Catatan Siswa", file: "catatan.html", icon: "fa-comments", title: "Catatan Siswa", desc: "Catatan anekdotal dan perkembangan siswa." },
    { name: "Jadwal Piket", file: "piket.html", icon: "fa-broom", title: "Jadwal Piket", desc: "Jadwal regu kerja piket kebersihan kelas." },
    { name: "Refleksi Mingguan", file: "refleksi.html", icon: "fa-lightbulb", title: "Refleksi Mingguan", desc: "Catatan refleksi kinerja guru setiap akhir pekan." },
    { name: "Inventaris", file: "inventaris.html", icon: "fa-box-open", title: "Inventaris", desc: "Data sarana dan prasarana di dalam kelas." },
    { name: "Rekap dan Cetak", file: "rekap.html", icon: "fa-print", title: "Rekap dan Cetak", desc: "Cetak laporan absensi, nilai, dan dokumen kelas lainnya." },
    { name: "Pengaturan", file: "pengaturan.html", icon: "fa-cog", title: "Pengaturan", desc: "Konfigurasi profil guru dan identitas kelas." }
];

const template = (pageTitle, pageDesc, pageIcon, navItemsStr, extraContent) => `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} | Manajemen Wali Kelas</title>
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome via CDN for Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3b82f6; border-radius: 4px; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 flex flex-col md:flex-row min-h-screen overflow-hidden font-sans">

    <!-- Mobile Header & Toggle Button -->
    <div class="md:hidden flex items-center justify-between bg-blue-900 text-white p-4">
        <h1 class="text-xl font-bold truncate">SDN 1 Cintaraja</h1>
        <button id="mobile-menu-btn" class="focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded">
            <i class="fas fa-bars text-2xl"></i>
        </button>
    </div>

    <!-- Sidebar Overlay (Mobile) -->
    <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden transition-opacity"></div>

    <!-- Sidebar Navigation -->
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-72 bg-blue-900 text-white shadow-xl transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto">
        <div class="flex items-center justify-between p-6 border-b border-blue-800">
            <div class="flex flex-col">
                <span class="text-2xl font-bold tracking-wider text-yellow-400">Wali Kelas</span>
                <span class="text-sm font-light text-blue-200">SDN 1 Cintaraja</span>
            </div>
            <button id="close-sidebar-btn" class="md:hidden text-white hover:text-yellow-400 focus:outline-none">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>

        <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-5rem)] pb-20 custom-scrollbar">
${navItemsStr}
        </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div class="p-6 md:p-10 w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
            <header class="mb-8 border-b border-gray-200 pb-4">
                <h1 class="text-3xl font-bold text-gray-800">${pageTitle}</h1>
                <p class="text-gray-500 mt-1">${pageDesc}</p>
            </header>

            <!-- Placeholder Content -->
            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div class="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <i class="fas ${pageIcon} text-4xl text-blue-400"></i>
                </div>
                <h2 class="text-2xl font-semibold text-gray-700 mb-2">Halaman ${pageTitle}</h2>
                <p class="text-gray-500 max-w-md">
                    Ini adalah kerangka halaman untuk fitur ${pageTitle}. Anda dapat mengganti bagian ini dengan tabel data, form input, atau laporan grafis yang sesuai.
                </p>
                
                ${extraContent}
            </div>
        </div>
    </main>

    <script>
        const sidebar = document.getElementById('sidebar');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        const overlay = document.getElementById('sidebar-overlay');

        function toggleSidebar() {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }

        mobileMenuBtn.addEventListener('click', toggleSidebar);
        closeSidebarBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    </script>
</body>
</html>`;

const navTemplateActive = (href, icon, name) => `            <a href="${href}" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 bg-blue-800 border-l-4 border-yellow-400 text-yellow-400 shadow-md group">
                <i class="fas ${icon} w-5 text-center text-yellow-400"></i>
                <span class="font-medium text-sm">${name}</span>
            </a>`;

const navTemplateInactive = (href, icon, name) => `            <a href="${href}" class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-blue-100 hover:bg-blue-800 hover:text-white border-l-4 border-transparent group">
                <i class="fas ${icon} w-5 text-center text-blue-300 group-hover:text-white transition-colors"></i>
                <span class="font-medium text-sm">${name}</span>
            </a>`;

const dashboardExtra = `
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-10 text-left">
    <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <span class="text-xs font-semibold text-blue-600 uppercase">Total Siswa</span>
        <div class="text-2xl font-bold text-gray-800 mt-1">32</div>
    </div>
    <div class="bg-green-50 rounded-xl p-4 border border-green-100">
        <span class="text-xs font-semibold text-green-600 uppercase">Hadir</span>
        <div class="text-2xl font-bold text-gray-800 mt-1">30</div>
    </div>
    <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
        <span class="text-xs font-semibold text-yellow-600 uppercase">Izin/Sakit</span>
        <div class="text-2xl font-bold text-gray-800 mt-1">2</div>
    </div>
    <div class="bg-red-50 rounded-xl p-4 border border-red-100">
        <span class="text-xs font-semibold text-red-600 uppercase">Tugas Pending</span>
        <div class="text-2xl font-bold text-gray-800 mt-1">15</div>
    </div>
</div>
`;

const outputDir = __dirname;

menus.forEach(page => {
    const navItemsStr = menus.map(item => {
        if (item.file === page.file) {
            return navTemplateActive(item.file, item.icon, item.name);
        } else {
            return navTemplateInactive(item.file, item.icon, item.name);
        }
    }).join('\n');

    const extraContent = page.file === 'index.html' ? dashboardExtra : '';

    const htmlContent = template(page.title, page.desc, page.icon, navItemsStr, extraContent);

    fs.writeFileSync(path.join(outputDir, page.file), htmlContent, 'utf-8');
});

console.log('Semua 14 halaman HTML berhasil dibuat!');
