/* ==========================================================================
   CINEKEEP DEDICATED FULL-PAGE SEARCH CONTROLLER WITH COLLECTION ACTIONS
   ========================================================================== */

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const LIVE_BACKEND_URL = "https://cinekeep.onrender.com";

const apiOptions = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjdlMjViZGUyOTE1MTFhNDJhYzBhMzQ2YWZiY2U2YSIsIm5iZiI6MTc4MDU5NzQwNS40MDgsInN1YiI6IjZhMjFjMjlkNTRhZTc0NTdjZTgwMDBmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I4W1JWV3DPIVUAv0WHD-iGMnBoa_c9ntxlyhGosZCV4'
    }
};

// Global DOM references for the sliding preview drawer layers
let drawer, dTitle, dYear, dRating, dDesc, drawerWatchlistBtn, drawerFavoriteBtn;

document.addEventListener('DOMContentLoaded', async () => {
    drawer = document.getElementById('detailDrawer');
    dTitle = document.getElementById('drawerTitle');
    dYear = document.getElementById('drawerYear');
    dRating = document.getElementById('drawerRating');
    dDesc = document.getElementById('drawerDesc');
    drawerWatchlistBtn = document.getElementById('drawerWatchlistBtn');
    drawerFavoriteBtn = document.getElementById('drawerFavoriteBtn');

    const grid = document.getElementById('searchGrid') || document.getElementById('movieGrid');
    const headerTitle = document.getElementById('searchQueryHeaderTarget') || document.getElementById('searchHeaderTitle');
    const input = document.getElementById('searchInput');

    // Parse URL input criteria metrics
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('query');

    // Refresh display badge status numbers
    updateNavbarBadgesUI();

    // Refinement search text input management
    if (input) {
        if (initialQuery) input.value = initialQuery;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const refinement = input.value.trim();
                if (refinement.length >= 2) {
                    window.location.href = `search.html?query=${encodeURIComponent(refinement)}`;
                }
            }
        });
    }

    if (!initialQuery) {
        if (headerTitle) headerTitle.innerText = 'Search Queries';
        if (grid) grid.innerHTML = `<div class="col-span-full text-center text-slate-500 text-xs py-12">Please input search criteria to find contents.</div>`;
        return;
    }

    if (headerTitle) headerTitle.innerText = `Search Results for: "${initialQuery}"`;
    if (!grid) return;

    try {
        // Optimized to multi-search to pull both matching Movies and TV show nodes down together
        const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(initialQuery)}&language=en-US&page=1`, apiOptions);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500 text-xs">No entries matching your parameters were found.</div>`;
            return;
        }

        grid.innerHTML = '';
        data.results.forEach(item => {
            if (item.media_type === 'movie' || item.media_type === 'tv') {
                appendMovieResultCard(grid, item);
            }
        });

    } catch (error) {
        console.error("Search processing connection break:", error);
        grid.innerHTML = `<div class="col-span-full text-center text-rose-400 text-xs py-12">Unable to complete data operations.</div>`;
    }

    // Set up interactive toggle click handlers inside drawer preview layout
    setupDrawerActionListeners();
});

// --- RENDER CARD COMPONENTS WITH OVERLAY ACTION SHORTCUT BUTTONS ---
function appendMovieResultCard(container, item) {
    const type = item.media_type || 'movie';
    const title = item.title || item.name || item.original_title || "Unknown Title";
    const dateSource = item.release_date || item.first_air_date;
    const year = dateSource ? dateSource.split('-')[0] : "Coming Soon";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';
    const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500';
    let cleanOverview = item.overview ? item.overview.replace(/'/g, "\\'").replace(/"/g, '\\"') : "No description listed.";

    // Sync individual active styling metrics from state sets
    const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    const isFavorited = localFavs.includes(String(item.id));
    const favClass = isFavorited ? 'text-rose-500' : 'text-slate-400';

    const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    const isWatchlisted = localWatch.includes(String(item.id));
    const watchClass = isWatchlisted ? 'text-indigo-400 fa-solid' : 'text-slate-400 fa-regular';

    const cardHTML = `
        <div class="group relative bg-white/[0.01] border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.02] flex flex-col justify-between cursor-pointer shadow-xl"
             onclick="openSearchDetailDrawer('${item.id}', '${title.replace(/'/g, "\\'")}', '${year}', '${rating}', '${cleanOverview}', '${poster}', '${type}')">
            
            <div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 m-1.5">
                <img src="${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="">
                
                <button onclick="toggleWatchlistStateFromSearch(event, '${item.id}')" 
                        class="absolute top-2.5 left-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:text-indigo-400 hover:scale-110 flex items-center justify-center transition-all duration-300 z-20 group/wBtn ${watchClass}"
                        data-watchlist-id="${item.id}">
                    <i class="fa-bookmark text-xs transition-transform duration-300 group-hover/wBtn:scale-110"></i>
                </button>

                <button onclick="toggleFavoriteStateFromSearch(event, '${item.id}')" 
                        class="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:text-rose-400 hover:scale-110 flex items-center justify-center transition-all duration-300 z-20 group/fBtn ${favClass}"
                        data-favorite-id="${item.id}">
                    <i class="fa-solid fa-heart text-xs transition-transform duration-300 group-hover/fBtn:scale-110"></i>
                </button>
            </div>
            <div class="p-3.5 pt-1 space-y-1">
                <h4 class="font-bold text-sm text-slate-200 truncate group-hover:text-indigo-400 transition-colors duration-300">${title}</h4>
                <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>${year}</span>
                    <span class="text-amber-400 flex items-center gap-1"><i class="fa-solid fa-star text-[10px]"></i> ${rating}</span>
                </div>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', cardHTML);
}

// --- CORE DROPDOWN SELECTION REFRESH HANDLERS ---
function updateNavbarBadgesUI() {
    const favCount = document.getElementById('headerFavoriteCount');
    const watchCount = document.getElementById('headerWatchlistCount');

    const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];

    if (favCount) favCount.innerText = localFavs.length;
    if (watchCount) watchCount.innerText = localWatch.length;
}

// --- DYNAMIC CONTROL METHODS ---
window.toggleFavoriteStateFromSearch = function(event, movieId) {
    if (event) event.stopPropagation();
    const token = localStorage.getItem('cinekeep_auth_token');
    if (!token) { alert("Please sign in to manage favorites."); return; }

    const stringId = String(movieId);
    let localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    const index = localFavs.indexOf(stringId);

    const buttons = document.querySelectorAll(`[data-favorite-id="${movieId}"]`);

    if (index === -1) {
        localFavs.push(stringId);
        buttons.forEach(btn => btn.className = btn.className.replace('text-slate-400', 'text-rose-500'));
    } else {
        localFavs.splice(index, 1);
        buttons.forEach(btn => btn.className = btn.className.replace('text-rose-500', 'text-slate-400'));
    }

    localStorage.setItem('cinekeep_local_favs', JSON.stringify(localFavs));
    updateNavbarBadgesUI();
    syncSearchActionToBackend('favorite', stringId, token);
};

window.toggleWatchlistStateFromSearch = function(event, movieId) {
    if (event) event.stopPropagation();
    const token = localStorage.getItem('cinekeep_auth_token');
    if (!token) { alert("Please sign in to manage watchlist items."); return; }

    const stringId = String(movieId);
    let localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    const index = localWatch.indexOf(stringId);

    const buttons = document.querySelectorAll(`[data-watchlist-id="${movieId}"]`);

    if (index === -1) {
        localWatch.push(stringId);
        buttons.forEach(btn => {
            btn.className = btn.className.replace('text-slate-400 fa-regular', 'text-indigo-400 fa-solid');
        });
    } else {
        localWatch.splice(index, 1);
        buttons.forEach(btn => {
            btn.className = btn.className.replace('text-indigo-400 fa-solid', 'text-slate-400 fa-regular');
        });
    }

    localStorage.setItem('cinekeep_local_watchlist', JSON.stringify(localWatch));
    updateNavbarBadgesUI();
    syncSearchActionToBackend('watchlist', stringId, token);
};

async function syncSearchActionToBackend(endpointType, movieId, token) {
    try {
        // Updated from localhost to production Render cluster mapping
        await fetch(`${LIVE_BACKEND_URL}/api/media/${endpointType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ movieId: movieId })
        });
    } catch (err) { console.error("Database status replication missing: ", err); }
}

// --- OVERLAY PREVIEW MANAGEMENT canvas ---
window.openSearchDetailDrawer = function(id, title, year, rating, description, image, type = 'movie') {
    if (!drawer) return;
    
    document.getElementById('drawerImage').src = image;
    dTitle.innerText = title;
    dYear.innerText = `${year} • ${type === 'tv' ? 'TV Network Show' : 'Cinema Feature'}`;
    dRating.innerText = rating;
    dDesc.innerText = description;

    // Bind item identities directly to layout DOM references
    if (drawerWatchlistBtn) {
        drawerWatchlistBtn.setAttribute('data-active-id', id);
        const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
        drawerWatchlistBtn.innerHTML = localWatch.includes(String(id))
            ? `<i class="fa-solid fa-bookmark text-indigo-400"></i> Bookmarked`
            : `<i class="fa-regular fa-bookmark"></i> Add to Watchlist`;
    }

    if (drawerFavoriteBtn) {
        drawerFavoriteBtn.setAttribute('data-active-id', id);
        const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
        drawerFavoriteBtn.innerHTML = localFavs.includes(String(id))
            ? `<i class="fa-solid fa-heart text-rose-500"></i> Favorited`
            : `<i class="fa-regular fa-heart"></i> Add to Favorites`;
    }

    drawer.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 50);
};

window.closeDetailDrawer = function() {
    if (!drawer) return;
    drawer.classList.add('translate-x-full');
    setTimeout(() => drawer.classList.add('hidden'), 300);
};

function setupDrawerActionListeners() {
    if (drawerWatchlistBtn) {
        drawerWatchlistBtn.addEventListener('click', (e) => {
            const activeId = drawerWatchlistBtn.getAttribute('data-active-id');
            if (activeId) {
                toggleWatchlistStateFromSearch(e, activeId);
                const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
                drawerWatchlistBtn.innerHTML = localWatch.includes(String(activeId))
                    ? `<i class="fa-solid fa-bookmark text-indigo-400"></i> Bookmarked`
                    : `<i class="fa-regular fa-bookmark"></i> Add to Watchlist`;
            }
        });
    }

    if (drawerFavoriteBtn) {
        drawerFavoriteBtn.addEventListener('click', (e) => {
            const activeId = drawerFavoriteBtn.getAttribute('data-active-id');
            if (activeId) {
                toggleFavoriteStateFromSearch(e, activeId);
                const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
                drawerFavoriteBtn.innerHTML = localFavs.includes(String(activeId))
                    ? `<i class="fa-solid fa-heart text-rose-500"></i> Favorited`
                    : `<i class="fa-regular fa-heart"></i> Add to Favorites`;
            }
        });
    }
}