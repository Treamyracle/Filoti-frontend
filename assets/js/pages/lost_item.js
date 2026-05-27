// Variabel global untuk menyimpan username dan status admin
let currentUsername = "admin"; // Statis "admin" untuk tampilan kartu item
let currentIsAdmin = false; // Digunakan untuk menentukan apakah tombol "Edit" muncul
let allLostItems = []; // Variabel untuk menyimpan semua item yang hilang dari backend

document.addEventListener("DOMContentLoaded", function () {
    // Mendapatkan referensi ke elemen-elemen DOM yang dibutuhkan
    const filterBtn = document.getElementById('filter-location-btn');
    const dropdown = document.getElementById('location-dropdown');
    const filterLabel = document.getElementById('filter-label');
    const itemsContainerLost = document.getElementById('lost-items-container');
    const loadingMessage = document.getElementById('loading-message-lost');

    // Daftar lokasi unik yang di-hardcode
    const uniqueLocations = [
        "Gedung G", "Gedung F", "Gedung A", "Musholla", "GKM", "Kantin", "Junction", "Edutech", "Area Parkir"
    ];

    // Fungsi untuk membuat satu elemen item yang akan ditampilkan
    function createItemLost(item, isAdminUser) {
        let buttonHTML = '';
        let itemMainText = `<h3 class="text-lg font-bold text-slate-800 line-clamp-1">${item.title}</h3>`; // Default: Hanya judul

        // Logika kondisional: Tampilan berbeda untuk admin vs. guest/non-admin
        if (isAdminUser) {
            // Admin: Tampilkan tombol "View Details" dan "Edit", serta judul + deskripsi lengkap
            buttonHTML = `
                <div class="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100">
                    <a href="details_item?id=${item.id}" class="flex-1 bg-blue-600 text-white text-center font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 transition-all active:scale-[0.98]">View Details</a>
                    <a href="edit_item?id=${item.id}" class="bg-slate-100 text-slate-700 text-center font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-200 transition-all active:scale-[0.98]">Edit</a>
                </div>
            `;
            itemMainText = `<h3 class="text-lg font-bold text-slate-800 mb-1">${item.title}</h3><p class="text-slate-500 text-sm mb-4 line-clamp-2">${item.keterangan}</p>`;
        } else {
            // Guest/Non-Admin: Tidak ada tombol "View Details" atau "Edit", hanya judul
            buttonHTML = ''; // Tombol kosong
        }

        const defaultAvatarColor = "bg-slate-200";
        const usernameDisplay = "admin"; // Selalu tampilkan "admin" di kartu item

        return `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <!-- Image Area -->
                <div class="h-48 w-full bg-slate-100 relative overflow-hidden">
                    <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23f1f5f9\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'14px\\' fill=\\'%2394a3b8\\'>No Image</text></svg>'"/>
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-sm border border-white/50 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        ${item.ruangan}
                    </div>
                </div>
                
                <!-- Content Area -->
                <div class="p-5 flex flex-col flex-1">
                    <div class="flex items-center space-x-2 mb-3">
                        <div class="w-6 h-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                            <span class="text-slate-600 font-bold text-[10px]">A</span>
                        </div>
                        <span class="text-xs font-medium text-slate-600">${usernameDisplay}</span>
                        <span class="text-slate-300">•</span>
                        <span class="text-xs font-medium text-slate-500">${item.timeAgo}</span>
                    </div>
                    
                    ${itemMainText}
                    
                    <div class="mt-auto">
                        ${buttonHTML}
                    </div>
                </div>
            </div>`;
    }

    // Fungsi untuk mengambil detail user yang sedang login dari backend
    async function fetchCurrentUserDetails() {
        try {
            const response = await fetch('https://filoti-backend.vercel.app/api/me', {
                method: 'GET',
                credentials: 'include' 
            });

            if (response.ok) {
                const userData = await response.json();
                currentIsAdmin = userData.is_admin || false; 
                console.log(`User logged in: ${userData.username}, IsAdmin: ${currentIsAdmin}`);
            } else if (response.status === 401 || response.status === 403) {
                console.warn('User is not logged in or session expired. Displaying as Guest.');
                currentIsAdmin = false;
            } else {
                console.error(`Failed to fetch current user details with status: ${response.status}`);
                currentIsAdmin = false;
            }
        } catch (error) {
            console.error('Network error fetching current user details:', error);
            currentIsAdmin = false;
        }
    }

    // Fungsi untuk merender item ke DOM berdasarkan filter
    function renderItems(locationFilter = 'all') {
        itemsContainerLost.innerHTML = ''; // Kosongkan container

        const itemsToRender = locationFilter === 'all'
            ? allLostItems.filter(post => post.item_type === 'lost' && post.status === 1)
            : allLostItems.filter(post =>
                post.item_type === 'lost' && post.status === 1 &&
                post.ruangan.toLowerCase().includes(locationFilter.toLowerCase())
            );

        if (itemsToRender.length === 0) {
            itemsContainerLost.innerHTML = '<div class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 border-dashed"><div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg></div><p class="text-slate-500 font-medium">Tidak ada item yang cocok dengan filter ini.</p></div>';
            return;
        }

        itemsToRender.forEach(post => {
            const item = {
                id: post.id,
                username: post.username, // Username ini tidak digunakan lagi di createItemLost
                timeAgo: new Date(post.created_at).toLocaleDateString("id-ID"),
                ruangan: post.ruangan,
                keterangan: post.keterangan,
                image_url: post.image_url,
                title: post.title,
            };
            // Lewatkan `currentIsAdmin` ke fungsi `createItemLost` untuk menentukan tampilan
            itemsContainerLost.innerHTML += createItemLost(item, currentIsAdmin);
        });
    }

    // Fungsi untuk mengisi dropdown filter dengan lokasi unik
    function populateLocationFilter() {
        if (!dropdown) { // Pastikan elemen dropdown ada sebelum mencoba mengisinya
            console.error("Dropdown element not found for populating locations.");
            return;
        }
        dropdown.innerHTML = ''; // Kosongkan dropdown

        // Tambahkan opsi "Tampilkan Semua Lokasi"
        const allOption = document.createElement('a');
        allOption.href = '#';
        allOption.className = 'block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg mx-1 transition-colors';
        allOption.textContent = 'Tampilkan Semua Lokasi';
        allOption.dataset.location = 'all';
        dropdown.appendChild(allOption);

        const divider = document.createElement('div');
        divider.className = 'border-t border-slate-100 my-1';
        dropdown.appendChild(divider);

        // Isi dropdown dengan lokasi dari array hardcode
        uniqueLocations.forEach(locName => {
            const option = document.createElement('a');
            option.href = '#';
            option.className = 'block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg mx-1 transition-colors';
            option.textContent = locName;
            option.dataset.location = locName;
            dropdown.appendChild(option);
        });
    }

    // Fungsi utama untuk mengambil data post dan filter
    async function fetchAndInitializeLostItems() {
        if (loadingMessage) loadingMessage.classList.remove('hidden');
        if (itemsContainerLost) itemsContainerLost.innerHTML = '';

        try {
            // Panggil fetchCurrentUserDetails dulu untuk mendapatkan status user (termasuk isAdmin)
            await fetchCurrentUserDetails(); 

            const response = await fetch('https://filoti-backend.vercel.app/api/posts', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                if (response.status !== 401 && response.status !== 403) { // Izinkan 401/403 untuk guest melihat daftar
                    throw new Error(`Failed to load items: ${response.status} - ${errorText}`);
                }
            }
            
            let data = [];
            if (response.status === 200) { // Hanya coba parse JSON jika status 200 OK
                data = await response.json();
            } else {
                console.warn(`Attempted to fetch posts, but got status ${response.status}. Displaying empty if no data.`);
            }

            if (!Array.isArray(data)) {
                console.error("Backend response for /posts is not an array:", data);
                throw new Error("Backend response is not an array. Please check API.");
            }

            allLostItems = data; // Simpan semua data post ke variabel global

            if (loadingMessage) loadingMessage.classList.add('hidden');
            
            populateLocationFilter(); // Isi dropdown filter dengan lokasi unik
            renderItems(); // Render item dengan status admin yang sudah diperbarui

        } catch (error) {
            console.error('Error fetching lost items:', error);
            if (itemsContainerLost) {
                itemsContainerLost.innerHTML = `<div class="col-span-full py-12 text-center bg-red-50 rounded-2xl border border-red-100"><p class="text-red-600 font-medium">Gagal memuat item hilang.</p><p class="text-red-400 text-sm mt-1">${error.message}</p></div>`;
            }
            if (loadingMessage) loadingMessage.classList.add('hidden');
        }
    }

    // Panggil fungsi utama saat DOM siap
    fetchAndInitializeLostItems();

    // --- Event Listeners untuk Dropdown Filter ---
    if (filterBtn && dropdown && filterLabel) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            dropdown.classList.toggle('hidden'); 
        });

        window.addEventListener('click', (e) => {
            if (dropdown && !dropdown.classList.contains('hidden') && 
                !dropdown.contains(e.target) && e.target !== filterBtn && 
                !filterBtn.contains(e.target)) { 
                dropdown.classList.add('hidden');
            }
        });

        dropdown.addEventListener('click', (e) => {
            e.preventDefault(); 
            const selectedLocation = e.target.dataset.location; 
            if (selectedLocation) {
                renderItems(selectedLocation); 
                filterLabel.textContent = selectedLocation === 'all' ? 'Filter by Location' : selectedLocation; 
                dropdown.classList.add('hidden'); 
            }
        });
    }

    const navbarContainer = document.querySelector('#navbar-container'); 
    if (typeof NavbarLoader !== 'undefined' && navbarContainer) { 
        const loader = new NavbarLoader({
            navbarPath: "../components/navbar_admin.html", 
            onLoad: function () {
                if (navbarContainer) {
                    navbarContainer.classList.add('loaded'); 
                }
            },
            onError: function (error) {
                console.error('Gagal memuat navbar:', error);
                if (navbarContainer) {
                    navbarContainer.innerHTML = '<div class="bg-red-100 text-red-700 p-4 text-center">Navigation could not be loaded</div>';
                    navbarContainer.classList.add('loaded');
                }
            }
        });
        loader.loadNavbarSimple(); 
    }
});