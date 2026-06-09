/* ==========================================================================
   CINEKEEP PREMIUM WATCHLIST LAYER CORE FETCH & RENDER ENGINE
   ========================================================================== */

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const apiOptions = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjdlMjViZGUyOTE1MTFhNDJhYzBhMzQ2YWZiY2U2YSIsIm5iZiI6MTc4MDU5NzQwNS40MDgsInN1YiI6IjZhMjFjMjlkNTRhZTc0NTdjZTgwMDBmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I4W1JWV3DPIVUAv0WHD-iGMnBoa_c9ntxlyhGosZCV4'
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('watchlistGrid');
    const countLabel = document.getElementById('watchlistCount');
    
    const localWatchlist = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    
    if (countLabel) countLabel.innerText = localWatchlist.length;
    if (!grid) return;

    if (localWatchlist.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center text-slate-500 text-xs font-semibold">
                <i class="fa-regular fa-folder-open mb-3 text-2xl text-slate-600 block"></i> Your Watch Later shelf is completely empty.
            </div>`;
        grid.classList.remove('opacity-0', 'translate-y-4');
        return;
    }

    grid.innerHTML = '';

    // Fetch rich data details asynchronously from TMDB for each user-bookmarked id
    for (const movieId of localWatchlist) {
        try {
            const response = await fetch(`${BASE_URL}/movie/${movieId}?language=en-US`, apiOptions);
            if (response.ok) {
                const movie = await response.json();
                renderWatchlistCard(grid, movie);
            }
        } catch (error) {
            console.error(`Error loading movie detail metrics for item reference [${movieId}]:`, error);
        }
    }

    // Trigger smooth fade-in reveal transition layout
    grid.classList.remove('opacity-0', 'translate-y-4');
});

function renderWatchlistCard(container, movie) {
    const title = movie.title || movie.original_title || "Unknown Title";
    const year = movie.release_date ? movie.release_date.split('-')[0] : "Coming Soon";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
    const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500';

    const cardHTML = `
        <div class="group relative bg-white/[0.01] border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.02] flex flex-col justify-between shadow-xl">
            <div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 m-1">
                <img src="${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="">
                <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-amber-400 border border-white/5 flex items-center gap-1">
                    <i class="fa-solid fa-star text-[8px]"></i> ${rating}
                </div>
            </div>
            <div class="p-3 space-y-1">
                <h4 class="font-bold text-xs text-slate-200 truncate group-hover:text-indigo-400 transition-colors duration-300">${title}</h4>
                <p class="text-[10px] font-semibold text-slate-500">${year}</p>
            </div>
        </div>`;
        
    container.insertAdjacentHTML('beforeend', cardHTML);
}