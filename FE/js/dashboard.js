/* ==========================================================================
   CINEKEEP PREMIUM ROUTING, DATA STREAMING & RENDERING ARCHITECTURE ENGINE
   ========================================================================== */

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
const LIVE_BACKEND_URL = "https://cinekeep.onrender.com";

const apiOptions = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjdlMjViZGUyOTE1MTFhNDJhYzBhMzQ2YWZiY2U2YSIsIm5iZiI6MTc4MDU5NzQwNS40MDgsInN1YiI6IjZhMjFjMjlkNTRhZTc0NTdjZTgwMDBmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I4W1JWV3DPIVUAv0WHD-iGMnBoa_c9ntxlyhGosZCV4'
    }
};

// Global DOM Anchors
let drawer, dTitle, dYear, dRating, dDesc, dCast;
let searchInput, movieGrid, seriesGrid, trendingHeader, upcomingSection;
let mainMovieHeaderTitle, mainSeriesHeaderTitle;
let carouselContainer, carouselDots, ambientBg;
let activeMenuTab = 'discover'; 

// Carousel State Engine Variables
let carouselMovies = [];
let currentSlideIndex = 0;
let carouselTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Core DOM Element Anchors
    drawer = document.getElementById('detailDrawer');
    dTitle = document.getElementById('drawerTitle');
    dYear = document.getElementById('drawerYear');
    dRating = document.getElementById('drawerRating');
    dDesc = document.getElementById('drawerDesc');
    dCast = document.getElementById('drawerCast');
    
    searchInput = document.getElementById('searchInput');
    movieGrid = document.getElementById('movieGrid');
    seriesGrid = document.getElementById('seriesGrid');
    mainMovieHeaderTitle = document.getElementById('mainMovieHeaderTitle');
    mainSeriesHeaderTitle = document.getElementById('mainSeriesHeaderTitle');
    
    carouselContainer = document.getElementById('carouselSlidesContainer');
    carouselDots = document.getElementById('carouselDots');
    ambientBg = document.getElementById('carouselAmbientBg');
    
    // Smooth Transitions Configuration Canvas
    if (movieGrid) movieGrid.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    if (seriesGrid) seriesGrid.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    
    const sliderContainer = document.getElementById('upcomingSlider');
    if (sliderContainer) {
        upcomingSection = sliderContainer.closest('section');
        if (upcomingSection) {
            upcomingSection.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
        }
    }
    
    const trendSection = document.getElementById('movieGrid')?.parentElement;
    if (trendSection) {
        trendingHeader = trendSection.querySelector('h3');
    }

    // ==========================================================================
    // SIDEBAR & GENRE DIRECTORY CLICK LINK LISTENERS
    // ==========================================================================
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.id === 'ambientToggleBtn' || item.id === 'util-news') return;
        
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.genre-row').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            clearGenreButtonsUI();
            
            const componentId = item.id.replace('menu-', '');
            switchMenuTab(componentId, true);
        });
    });

    document.querySelectorAll('.genre-row').forEach(row => {
        row.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            updateGenreButtonsUI(row);
            
            const genreId = row.getAttribute('data-genre-id');
            const genreName = row.querySelector('span:not(.genre-icon-box)').innerText;
            
            if (upcomingSection) {
                upcomingSection.style.opacity = '0';
                upcomingSection.style.transform = 'translateY(-10px)';
                setTimeout(() => upcomingSection.classList.add('hidden'), 300);
            }
            
            fetchGenreMovies(genreId, genreName);
        });
    });

    // ==========================================================================
    // DYNAMIC AMBIENT LIGHT CONTROLLER
    // ==========================================================================
    const ambientBtn = document.getElementById('ambientToggleBtn');
    const ambientIcon = document.getElementById('ambientToggleIcon');
    const ambientText = document.getElementById('ambientToggleText');

    if (ambientBtn) {
        ambientBtn.addEventListener('click', () => {
            const isEnabled = ambientText.innerText.includes('On');
            if (isEnabled) {
                ambientText.innerText = "Ambient Glow: Off";
                ambientIcon.className = "fa-solid fa-moon-slash text-sm text-slate-500";
                if (ambientBg) {
                    ambientBg.style.opacity = "0";
                    ambientBg.style.transition = "opacity 0.5s ease";
                }
            } else {
                ambientText.innerText = "Ambient Glow: On";
                ambientIcon.className = "fa-solid fa-moon text-sm text-violet-400 filter drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]";
                if (ambientBg) {
                    ambientBg.style.opacity = "0.2";
                    ambientBg.style.transition = "opacity 0.5s ease";
                }
            }
        });
    }

    // Initialize System Core Lifecycle Hooks
    switchMenuTab('discover', false); 
    if (sliderContainer) {
        fetchUpcomingMovies();
    }
    fetchCarouselShowcases();
    setupSearchEngine(); 
    initializeUserSession();
    setupKeyboardShortcuts();
});

// ==========================================================================
// LIVE DROPDOWN SUGGESTIONS + ENTER KEY REDIRECT
// ==========================================================================
function setupSearchEngine() {
    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('searchDropdown');
    const dropdownContent = document.getElementById('searchDropdownContent');
    const spinner = document.getElementById('searchSpinner');
    let searchDebounceTimeout = null;

    if (!input || !dropdown || !dropdownContent) return;

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearTimeout(searchDebounceTimeout);

        if (query.length < 2) {
            hideSearchDropdownUI();
            return;
        }

        if (spinner) spinner.classList.remove('hidden');

        searchDebounceTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`, apiOptions);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    dropdownContent.innerHTML = '';
                    data.results.slice(0, 5).forEach(item => {
                        if (item.media_type !== 'movie' && item.media_type !== 'tv') return;
                        
                        const title = item.name || item.title || item.original_name || "Unknown Title";
                        const dateSource = item.release_date || item.first_air_date;
                        const year = dateSource ? dateSource.split('-')[0] : "Coming Soon";
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
                        const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200';
                        const cleanOverview = item.overview ? item.overview.replace(/'/g, "\\'").replace(/"/g, '\\"') : "No description.";
                        const cleanTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

                        const rowHTML = `
                            <div class="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all group/searchItem"
                                 onclick="openDetailDrawer('${item.id}', '${cleanTitle}', '${year}', '${rating}', '${cleanOverview}', '${poster}', '${item.media_type}'); hideSearchDropdownUI();">
                                <div class="flex items-center gap-3 min-w-0">
                                    <img src="${poster}" class="w-8 h-11 object-cover rounded-lg bg-slate-900 flex-shrink-0" alt="">
                                    <div class="min-w-0">
                                        <p class="text-xs font-bold text-slate-200 truncate group-hover/searchItem:text-indigo-400 transition-colors">${title}</p>
                                        <p class="text-[10px] text-slate-500 font-bold mt-0.5">${year} • ${item.media_type === 'tv' ? 'TV Series' : 'Movie'}</p>
                                    </div>
                                </div>
                                <div class="px-2 py-1 bg-white/[0.02] border border-white/5 rounded-lg text-amber-400 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                                    <i class="fa-solid fa-star text-[8px]"></i> ${rating}
                                </div>
                            </div>`;
                        dropdownContent.insertAdjacentHTML('beforeend', rowHTML);
                    });
                    dropdown.classList.remove('hidden');
                    setTimeout(() => dropdown.classList.remove('opacity-0', 'translate-y-2'), 10);
                } else {
                    dropdownContent.innerHTML = `<div class="p-4 text-xs text-slate-500 text-center font-semibold">No results found for "${query}"</div>`;
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (spinner) spinner.classList.add('hidden');
            }
        }, 300);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query.length >= 2) {
                clearTimeout(searchDebounceTimeout);
                dropdown.classList.add('hidden');
                window.location.href = `search.html?query=${encodeURIComponent(query)}`;
            }
        }
    });

    window.hideSearchDropdownUI = function() {
        dropdown.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => dropdown.classList.add('hidden'), 200);
    };

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) hideSearchDropdownUI();
    });
}

// ==========================================
// PREMIUM LIVE CAROUSEL ENGINE PIPELINE
// ==========================================
async function fetchCarouselShowcases() {
    try {
        const response = await fetch(`${BASE_URL}/trending/all/week?language=en-US`, apiOptions);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            carouselMovies = data.results.slice(0, 5);
            renderCarouselSlides();
            startCarouselTimer();
        }
    } catch (error) {
        console.error("Carousel system streaming failure:", error);
    }
}

function renderCarouselSlides() {
    if (!carouselContainer || !carouselDots) return;
    carouselContainer.innerHTML = '';
    carouselDots.innerHTML = '';

    carouselMovies.forEach((movie, index) => {
        const title = movie.name || movie.title || movie.original_name || movie.original_title;
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
        const backdrop = movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600';
        const cleanOverview = movie.overview ? movie.overview.replace(/'/g, "\\'").replace(/"/g, '\\"') : "No synopsis loaded.";
        const dateSource = movie.release_date || movie.first_air_date;
        const year = dateSource ? dateSource.split('-')[0] : '2026';
        const poster = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : backdrop;
        const mediaType = movie.title ? 'movie' : 'tv';

        const slideHTML = `
            <div class="carousel-slide absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${index === 0 ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-[0.99] pointer-events-none'}" data-slide-index="${index}" data-backdrop-src="${backdrop}">
                <div class="absolute top-0 right-0 w-full lg:w-[60%] h-full">
                    <img src="${backdrop}" alt="${title}" class="w-full h-full object-cover opacity-90 transition-all duration-700">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#040711] via-transparent to-transparent z-1"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#040711] via-[#040711]/80 via-35% to-transparent to-70% z-1"></div>
                <div class="absolute bottom-0 left-0 p-6 lg:p-10 max-w-xl md:max-w-2xl space-y-4 z-10">
                    <div class="flex items-center gap-2.5">
                        <span class="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-md">Featured Preview</span>
                        <span class="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-md"><i class="fa-solid fa-star mr-1"></i> ${rating} Rating</span>
                    </div>
                    <h2 class="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-none drop-shadow-md">${title}</h2>
                    <p class="text-slate-300 text-xs lg:text-sm font-normal leading-relaxed line-clamp-2 drop-shadow-sm max-w-md">${movie.overview || 'No overview summary parameters mapped over API hooks.'}</p>
                    <div class="flex items-center gap-3 pt-1">
                        <button onclick="openDetailDrawer('${movie.id}', '${title.replace(/'/g, "\\'")}', '${year}', '${rating}', '${cleanOverview}', '${poster}', '${mediaType}')" class="px-5 py-3 bg-white text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xl hover:bg-slate-200 transition-all duration-200 cursor-pointer">
                            <i class="fa-solid fa-play text-[10px]"></i> Stream Showcase
                        </button>
                    </div>
                </div>
            </div>`;
        carouselContainer.appendChild(document.createRange().createContextualFragment(slideHTML));

        const dotHTML = `<button onclick="goToSlide(${index})" class="carousel-dot h-1.5 rounded-full transition-all duration-300 ${index === 0 ? 'w-6 bg-indigo-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}" data-dot-index="${index}"></button>`;
        carouselDots.appendChild(document.createRange().createContextualFragment(dotHTML));
    });
}

function updateCarouselView() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    slides.forEach((slide, idx) => {
        if (idx === currentSlideIndex) {
            slide.classList.remove('opacity-0', 'z-0', 'scale-[0.99]', 'pointer-events-none');
            slide.classList.add('opacity-100', 'z-10', 'scale-100');
            
            if (ambientBg) {
                const currentBackdropUrl = slide.getAttribute('data-backdrop-src');
                ambientBg.innerHTML = `<img src="${currentBackdropUrl}" class="w-full h-full object-cover">`;
            }
        } else {
            slide.classList.remove('opacity-100', 'z-10', 'scale-100');
            slide.classList.add('opacity-0', 'z-0', 'scale-[0.99]', 'pointer-events-none');
        }
    });

    dots.forEach((dot, idx) => {
        if (idx === currentSlideIndex) {
            dot.className = "carousel-dot h-1.5 rounded-full transition-all duration-300 w-6 bg-indigo-500";
        } else {
            dot.className = "carousel-dot h-1.5 rounded-full transition-all duration-300 w-1.5 bg-white/20 hover:bg-white/40";
        }
    });
}

function startCarouselTimer() {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % carouselMovies.length;
        updateCarouselView();
    }, 5000);
}

window.goToSlide = function(index) {
    currentSlideIndex = index;
    updateCarouselView();
    startCarouselTimer();
};

// ==========================================
// DUAL-FETCH GENRE ARCHITECTURE PIPELINE
// ==========================================
async function fetchGenreMovies(genreId, genreName) {
    if (!movieGrid || !seriesGrid) return;
    
    movieGrid.style.opacity = '0'; seriesGrid.style.opacity = '0';
    if (mainMovieHeaderTitle) mainMovieHeaderTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(async () => {
        movieGrid.innerHTML = `<div class="col-span-full py-6 text-center text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading ${genreName} Movies...</div>`;
        seriesGrid.innerHTML = `<div class="col-span-full py-6 text-center text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading ${genreName} Series...</div>`;
        movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
        
        try {
            const tvGenreMap = {
                '28': '10759', // Action -> Action & Adventure
                '878': '10765', // Sci-Fi -> Sci-Fi & Fantasy
                '18': '18',    // Drama -> Drama (Matches)
                '53': '9638',  // Thriller -> Mystery (Closest TV equivalent)
                '14': '10765'  // Fantasy -> Sci-Fi & Fantasy
            };
            
            const tvGenreId = tvGenreMap[String(genreId)] || genreId;

            const [movieRes, tvRes] = await Promise.all([
                fetch(`${BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&language=en-US`, apiOptions),
                fetch(`${BASE_URL}/discover/tv?with_genres=${tvGenreId}&sort_by=popularity.desc&language=en-US`, apiOptions)
            ]);
            
            const movieData = await movieRes.json();
            const tvData = await tvRes.json();
            
            movieGrid.style.opacity = '0'; seriesGrid.style.opacity = '0';
            setTimeout(() => {
                if (mainMovieHeaderTitle) mainMovieHeaderTitle.innerText = `${genreName} Movies`;
                if (mainSeriesHeaderTitle) mainSeriesHeaderTitle.innerText = `${genreName} TV Series`;
                
                movieGrid.innerHTML = '';
                if (movieData.results) {
                    movieData.results.slice(0, 12).forEach(item => appendSingleMediaCard(item, 'movie', movieGrid));
                }
                
                seriesGrid.innerHTML = '';
                if (tvData.results) {
                    tvData.results.slice(0, 12).forEach(item => appendSingleMediaCard(item, 'tv', seriesGrid));
                }
                
                movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
            }, 150);
            
        } catch (error) { console.error(error); }
    }, 300);
}

function updateGenreButtonsUI(activeRow) {
    document.querySelectorAll('.genre-row').forEach(row => { row.classList.remove('active'); });
    activeRow.classList.add('active');
}

function clearGenreButtonsUI() {
    document.querySelectorAll('.genre-row').forEach(row => { row.classList.remove('active'); });
}

function updateMenuTabUI(activeTab) {
    ['discover', 'trending', 'top-rated', 'favorites', 'watchlist'].forEach(tab => {
        const element = document.getElementById(`menu-${tab}`);
        if (!element) return;
        
        if (tab === activeTab) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
}

// ==========================================
// VIEW TAB NAVIGATION RENDERING ACTIONS
// ==========================================
async function switchMenuTab(targetTab, shouldScroll = true) {
    activeMenuTab = targetTab;
    if (searchInput) searchInput.value = '';
    updateMenuTabUI(targetTab);
    if (!movieGrid || !seriesGrid) return;

    if (upcomingSection) {
        if (targetTab === 'discover') {
            upcomingSection.classList.remove('hidden');
            setTimeout(() => {
                upcomingSection.style.opacity = '1';
                upcomingSection.style.transform = 'translateY(0)';
            }, 50);
        } else {
            upcomingSection.style.opacity = '0';
            upcomingSection.style.transform = 'translateY(-10px)';
            setTimeout(() => upcomingSection.classList.add('hidden'), 300);
        }
    }

    movieGrid.style.opacity = '0'; seriesGrid.style.opacity = '0';
    if (shouldScroll && mainMovieHeaderTitle) mainMovieHeaderTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(async () => {
        try {
            if (targetTab === 'favorites') {
                if (mainMovieHeaderTitle) mainMovieHeaderTitle.innerText = "Favorite Movies";
                if (mainSeriesHeaderTitle) mainSeriesHeaderTitle.innerText = "Favorite TV Series";
                
                const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
                movieGrid.innerHTML = ''; seriesGrid.innerHTML = '';

                if (localFavs.length === 0) {
                    const fallbackHTML = `<div class="col-span-full py-12 text-center text-slate-500 text-xs font-semibold">Your catalog layer is empty.</div>`;
                    movieGrid.innerHTML = fallbackHTML; seriesGrid.innerHTML = fallbackHTML;
                    movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
                    return;
                }

                for (const id of localFavs) {
                    try {
                        let res = await fetch(`${BASE_URL}/movie/${id}?language=en-US`, apiOptions);
                        if (res.ok) { appendSingleMediaCard(await res.json(), 'movie', movieGrid); continue; }
                        
                        res = await fetch(`${BASE_URL}/tv/${id}?language=en-US`, apiOptions);
                        if (res.ok) { appendSingleMediaCard(await res.json(), 'tv', seriesGrid); }
                    } catch (err) { console.error(err); }
                }
                if(movieGrid.innerHTML === '') movieGrid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-600 text-xs">No saved movies.</div>`;
                if(seriesGrid.innerHTML === '') seriesGrid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-600 text-xs">No saved series.</div>`;
                movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
                return;
            }

            if (targetTab === 'watchlist') {
                if (mainMovieHeaderTitle) mainMovieHeaderTitle.innerText = "Watch Later Movies";
                if (mainSeriesHeaderTitle) mainSeriesHeaderTitle.innerText = "Watch Later TV Series";
                
                const localWatchlist = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
                movieGrid.innerHTML = ''; seriesGrid.innerHTML = '';

                if (localWatchlist.length === 0) {
                    const fallbackHTML = `<div class="col-span-full py-12 text-center text-slate-500 text-xs font-semibold">Your bookmark layer is empty.</div>`;
                    movieGrid.innerHTML = fallbackHTML; seriesGrid.innerHTML = fallbackHTML;
                    movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
                    return;
                }

                for (const id of localWatchlist) {
                    try {
                        let res = await fetch(`${BASE_URL}/movie/${id}?language=en-US`, apiOptions);
                        if (res.ok) { appendSingleMediaCard(await res.json(), 'movie', movieGrid); continue; }
                        
                        res = await fetch(`${BASE_URL}/tv/${id}?language=en-US`, apiOptions);
                        if (res.ok) { appendSingleMediaCard(await res.json(), 'tv', seriesGrid); }
                    } catch (err) { console.error(err); }
                }
                if(movieGrid.innerHTML === '') movieGrid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-600 text-xs">No bookmarked movies.</div>`;
                if(seriesGrid.innerHTML === '') seriesGrid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-600 text-xs">No bookmarked series.</div>`;
                movieGrid.style.opacity = '1'; seriesGrid.style.opacity = '1';
                return;
            }

            let mEndpoint, tEndpoint;
            if (targetTab === 'discover') {
                mEndpoint = `${BASE_URL}/movie/popular?language=en-US`;
                tEndpoint = `${BASE_URL}/tv/popular?language=en-US`;
            } else if (targetTab === 'trending') {
                mEndpoint = `${BASE_URL}/trending/movie/day?language=en-US`;
                tEndpoint = `${BASE_URL}/trending/tv/day?language=en-US`;
            } else if (targetTab === 'top-rated') {
                mEndpoint = `${BASE_URL}/movie/top_rated?language=en-US`;
                tEndpoint = `${BASE_URL}/tv/top_rated?language=en-US`;
            }

            const [movieResponse, tvResponse] = await Promise.all([
                fetch(mEndpoint, apiOptions),
                fetch(tEndpoint, apiOptions)
            ]);
            
            const movieData = await movieResponse.json();
            const tvData = await tvResponse.json();
            
            if (mainMovieHeaderTitle && mainSeriesHeaderTitle) {
                if (targetTab === 'discover') { mainMovieHeaderTitle.innerText = "Discover Movies"; mainSeriesHeaderTitle.innerText = "Discover TV Series"; }
                if (targetTab === 'trending') { mainMovieHeaderTitle.innerText = "Trending Movies Pack"; mainSeriesHeaderTitle.innerText = "Trending TV Series"; }
                if (targetTab === 'top-rated') { mainMovieHeaderTitle.innerText = "Top Rated Movies"; mainSeriesHeaderTitle.innerText = "Top Rated TV Series"; }
            }
            
            movieGrid.innerHTML = '';
            movieData.results.slice(0, 12).forEach(item => appendSingleMediaCard(item, 'movie', movieGrid));
            
            seriesGrid.innerHTML = '';
            tvData.results.slice(0, 12).forEach(item => appendSingleMediaCard(item, 'tv', seriesGrid));
            
            setTimeout(() => {
                movieGrid.style.opacity = '1';
                seriesGrid.style.opacity = '1';
                movieGrid.style.transform = 'scale(1) translateY(0)';
                seriesGrid.style.transform = 'scale(1) translateY(0)';
            }, 50);

        } catch (error) { 
            console.error("Tab execution broken: ", error);
        }
    }, 300);
}

function appendSingleMediaCard(item, type, targetGrid) {
    const title = item.name || item.title || item.original_name || "Unknown Title";
    
    let dateSource = item.release_date || item.first_air_date;
    let year = "Coming Soon";
    if (dateSource) year = dateSource.split('-')[0];
    
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';
    const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500';
    
    const cleanTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');
    let cleanOverview = item.overview ? item.overview.replace(/'/g, "\\'").replace(/"/g, '\\"') : "No description.";

    const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    const isFavorited = localFavs.includes(String(item.id));
    const favBtnAccentClass = isFavorited ? 'is-favorite text-rose-500' : 'text-slate-400';

    const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    const isWatchlisted = localWatch.includes(String(item.id));
    const watchBtnAccentClass = isWatchlisted ? 'text-indigo-400' : 'text-slate-400';
    const watchIconClass = isWatchlisted ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';

    const cardHTML = `
        <div class="group relative bg-white/[0.01] border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.02] flex flex-col justify-between cursor-pointer shadow-xl" 
             onclick="openDetailDrawer('${item.id}', '${cleanTitle}', '${year}', '${rating}', '${cleanOverview}', '${poster}', '${type}')">
            
            <div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 m-1.5">
                <img src="${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="">
                
                <div class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 rounded-lg text-[9px] font-bold text-indigo-300 uppercase">${type === 'tv' ? 'Series' : 'Movie'}</div>

                <button 
                    onclick="handleWatchlistClick(event, '${item.id}')" 
                    class="absolute top-2.5 left-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:text-indigo-400 hover:scale-110 flex items-center justify-center transition-all duration-300 z-20 group/watchBtn ${watchBtnAccentClass}"
                >
                    <i class="${watchIconClass} text-xs transition-transform duration-300 group-hover/watchBtn:scale-110"></i>
                </button>

                <button 
                    onclick="toggleFavoriteState(event, '${item.id}')" 
                    class="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:text-rose-400 hover:scale-110 flex items-center justify-center transition-all duration-300 z-20 group/favBtn ${favBtnAccentClass}"
                    data-fav-id="${item.id}"
                >
                    <i class="fa-solid fa-heart text-xs transition-transform duration-300 group-hover/favBtn:scale-110"></i>
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
    
    if (targetGrid) {
        targetGrid.insertAdjacentHTML('beforeend', cardHTML);
    }
}

async function fetchUpcomingMovies() {
    try {
        const [movieRes, tvRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/upcoming?language=en-US&page=1`, apiOptions),
            fetch(`${BASE_URL}/tv/on_the_air?language=en-US&page=1`, apiOptions)
        ]);
        const mData = await movieRes.json();
        const tData = await tvRes.json();
        
        let combined = [...(mData.results || []), ...(tData.results || [])];
        combined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
        renderUpcomingSlider(combined);
    } catch (error) { console.error(error); }
}

function renderUpcomingSlider(movies) {
    const slider = document.getElementById('upcomingSlider');
    if (!slider) return;
    slider.innerHTML = '';
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

    movies.slice(0, 10).forEach(movie => {
        const title = movie.title || movie.name || movie.original_title || movie.original_name;
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'Coming Soon';
        const cleanOverview = movie.overview ? movie.overview.replace(/'/g, "\\'") : 'No overview.';
        let displayDate = "COMING SOON", displayYear = "2026";
        
        let dateSource = movie.release_date || movie.first_air_date;
        if(dateSource) {
            const dateParts = dateSource.split('-');
            if(dateParts.length === 3) {
                displayDate = `${months[parseInt(dateParts[1], 10) - 1]} ${dateParts[2]}`;
                displayYear = dateParts[0];
            }
        }
        const imageSrc = movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : `${IMAGE_BASE_URL}${movie.poster_path}`;
        const mediaType = movie.title ? 'movie' : 'tv';

        const sliderItemHTML = `
            <div class="flex-shrink-0 w-72 group cursor-pointer" onclick="openDetailDrawer('${movie.id}', '${title.replace(/'/g, "\\'")}', '${displayYear}', '${rating}', '${cleanOverview}', '${imageSrc}', '${mediaType}')">
                <div class="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 mb-2 shadow-lg">
                    <img src="${imageSrc}" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" alt="">
                    <div class="absolute top-3 left-3 px-2 py-0.5 bg-black/60 rounded-md text-[10px] font-bold text-indigo-300 border border-white/5 tracking-wider uppercase">${displayDate}</div>
                </div>
                <h4 class="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors duration-300">${title}</h4>
                <p class="text-xs text-slate-500 font-medium"><i class="fa-regular fa-clock mr-1"></i> Preview Slate</p>
            </div>`;
        slider.appendChild(document.createRange().createContextualFragment(sliderItemHTML));
    });
}

// ==========================================
// AUXILIARY CREDIT DETAILS & TRAILER UTILITIES
// ==========================================
async function fetchMovieTrailerKey(movieId, currentType = 'movie') {
    try {
        const response = await fetch(`${BASE_URL}/${currentType}/${movieId}/videos?language=en-US`, apiOptions);
        const data = await response.json();
        const trailer = data.results && data.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        return trailer ? trailer.key : null;
    } catch (error) {
        console.error("Trailer parameter lookup error:", error);
        return null;
    }
}

async function fetchAndRenderCast(movieId, currentType = 'movie') {
    if (!dCast) return;
    dCast.innerHTML = `<div class="text-xs text-indigo-400/60 font-semibold"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Assembling credits...</div>`;
    
    try {
        const response = await fetch(`${BASE_URL}/${currentType}/${movieId}/credits?language=en-US`, apiOptions);
        const data = await response.json();
        dCast.innerHTML = '';
        
        if (!data.cast || data.cast.length === 0) {
            dCast.innerHTML = `<div class="text-xs text-slate-500 font-medium">Cast data unavailable.</div>`;
            return;
        }

        data.cast.slice(0, 3).forEach(actor => {
            const actorName = actor.name || "Unknown Actor";
            const initials = actorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            
            const colors = ['bg-indigo-600/20 text-indigo-400', 'bg-purple-600/20 text-purple-400', 'bg-pink-600/20 text-pink-400'];
            const chosenColor = colors[actor.id % colors.length];

            const badgeHTML = `
                <div class="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] p-1.5 pr-3 rounded-xl shadow-sm hover:border-white/10 transition-colors duration-200">
                    <div class="w-6 h-6 rounded-lg ${chosenColor} flex items-center justify-center text-[10px] font-black tracking-wider">
                        ${initials}
                    </div>
                    <span class="text-xs font-semibold text-slate-300">${actorName}</span>
                </div>`;
            dCast.appendChild(document.createRange().createContextualFragment(badgeHTML));
        });
        
    } catch (error) {
        console.error("Live cast loading fault:", error);
        dCast.innerHTML = `<div class="text-xs text-rose-500/60 font-semibold">Failed to stream cast.</div>`;
    }
}

// --- NEW UTILITY: FETCH AND RENDER STREAMING PLATFORMS ---
async function fetchAndRenderProviders(mediaId, currentType = 'movie') {
    const dProviders = document.getElementById('drawerProviders');
    if (!dProviders) return;
    dProviders.innerHTML = `<div class="text-xs text-indigo-400/60 font-semibold"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Finding streaming platforms...</div>`;
    
    try {
        const response = await fetch(`${BASE_URL}/${currentType}/${mediaId}/watch/providers?language=en-US`, apiOptions);
        const data = await response.json();
        dProviders.innerHTML = '';
        
        const regionData = data.results && (data.results['US'] || data.results['IN'] || Object.values(data.results)[0]);
        
        if (!regionData || (!regionData.flatrate && !regionData.link)) {
            dProviders.innerHTML = `<div class="text-xs text-slate-500 font-medium">Currently unavailable to stream.</div>`;
            return;
        }

        if (regionData.flatrate && regionData.flatrate.length > 0) {
            regionData.flatrate.slice(0, 4).forEach(provider => {
                const logoUrl = `${IMAGE_BASE_URL}${provider.logo_path}`;
                const providerHTML = `
                    <a href="${regionData.link}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] p-1.5 pr-3 rounded-xl shadow-sm hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-colors duration-200" title="Watch on ${provider.provider_name}">
                        <img src="${logoUrl}" alt="${provider.provider_name}" class="w-6 h-6 rounded-lg object-cover">
                        <span class="text-xs font-semibold text-slate-300">${provider.provider_name}</span>
                    </a>`;
                dProviders.insertAdjacentHTML('beforeend', providerHTML);
            });
        } else if (regionData.link) {
            dProviders.innerHTML = `
                 <a href="${regionData.link}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 p-2 px-3 rounded-xl shadow-sm hover:bg-indigo-500/20 transition-colors duration-200">
                     <i class="fa-solid fa-arrow-up-right-from-square text-indigo-400 text-[10px]"></i>
                     <span class="text-xs font-semibold text-indigo-300">View Streaming Options</span>
                 </a>`;
        }
        
    } catch (error) {
        console.error("Live provider loading fault:", error);
        dProviders.innerHTML = `<div class="text-xs text-rose-500/60 font-semibold">Failed to load platforms.</div>`;
    }
}

// ==========================================
// CORE DETAIL DRAWER OVERLAY MOUNT SYSTEM
// ==========================================
window.openDetailDrawer = function(id, title, year, rating, description, image, mediaType = 'movie') {
    if (!drawer) return;
    
    const mediaContainer = document.getElementById('drawerMediaContainer');
    const drawerWatchlistBtn = document.getElementById('drawerWatchlistBtn');
    
    dTitle.innerText = title;
    dYear.innerText = `${year} • ${mediaType === 'tv' ? 'TV Network Show' : 'Cinema Feature'}`;
    dRating.innerText = rating;
    dDesc.innerText = description;
    
    if (drawerWatchlistBtn) {
        drawerWatchlistBtn.setAttribute('data-active-movie-id', id);
        
        const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
        const isSaved = localWatch.includes(String(id));
        drawerWatchlistBtn.innerHTML = isSaved 
            ? `<i class="fa-solid fa-bookmark text-indigo-400"></i> Bookmarked`
            : `<i class="fa-regular fa-bookmark"></i> Add to Watchlist`;
    }
    
    if (mediaContainer) {
        mediaContainer.innerHTML = `
            <img id="drawerImage" src="${image}" class="w-full h-full object-cover" alt="">
            <div class="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/30"></div>
            <button id="explicitPlayBtn" class="absolute inset-0 m-auto w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-110 transition-all duration-300 group/play cursor-pointer border border-white/20 z-25">
                <i class="fa-solid fa-play text-lg pl-0.5 group-hover/play:scale-110 transition-transform"></i>
            </button>`;
        
        const playBtn = document.getElementById('explicitPlayBtn');
        if (playBtn && id) {
            playBtn.addEventListener('click', async () => {
                playBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-lg"></i>`;
                playBtn.style.pointerEvents = 'none';
                
                const trailerKey = await fetchMovieTrailerKey(id, mediaType);
                
                if (trailerKey) {
                    mediaContainer.innerHTML = `
                        <iframe 
                            class="w-full h-full border-0 rounded-2xl shadow-2xl" 
                            src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&modestbranding=1&rel=0" 
                            title="${title} Official Trailer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>`;
                } else {
                    playBtn.className = "absolute inset-x-4 bottom-4 mx-auto py-2 px-4 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl text-center z-20 backdrop-blur-md";
                    playBtn.style.width = 'auto';
                    playBtn.style.height = 'auto';
                    playBtn.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1.5"></i> Live Trailer Stream Unavailable`;
                }
            });
        }
    }
    
    drawer.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
    
    if (id) {
        fetchAndRenderCast(id, mediaType);
        fetchAndRenderProviders(id, mediaType);
    }
};

window.closeDetailDrawer = function() {
    if (!drawer) return;
    drawer.classList.add('translate-x-full');
    
    setTimeout(() => {
        drawer.classList.add('hidden');
        const mediaContainer = document.getElementById('drawerMediaContainer');
        if (mediaContainer) mediaContainer.innerHTML = '';
    }, 300);
};

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });
}

// ==========================================
// SESSION STATE SYNCING HOOKS
// ==========================================
function initializeUserSession() {
    const token = localStorage.getItem('cinekeep_auth_token');
    const currentUserName = localStorage.getItem('cinekeep_user_name') || 'Guest Explorer';
    const userInitial = currentUserName.trim().charAt(0).toUpperCase();

    const avatarBadge = document.getElementById('sidebarUserAvatar');
    const nameLabel = document.getElementById('sidebarUserName');
    const statusLabel = document.getElementById('sidebarUserStatus');
    const actionBtn = document.getElementById('sidebarAuthActionBtn');
    
    const favHeaderCount = document.getElementById('headerFavoriteCount');
    const localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    if (favHeaderCount) favHeaderCount.innerText = localFavs.length;

    const watchHeaderBadge = document.querySelector('.group\\/watch span') || document.getElementById('headerWatchlistCount');
    const localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    if (watchHeaderBadge) watchHeaderBadge.innerText = localWatch.length;

    if (avatarBadge) avatarBadge.innerText = userInitial;
    if (nameLabel) nameLabel.innerText = currentUserName;
    if (statusLabel) statusLabel.innerText = token ? 'Premium Member' : 'Limited Access';

    if (actionBtn) {
        if (token) {
            actionBtn.title = "Sign Out Securely";
            actionBtn.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket text-sm hover:text-rose-400 transition-colors"></i>`;
            actionBtn.onclick = function(e) {
                e.preventDefault();
                localStorage.clear(); 
                window.location.reload(); 
            };
        } else {
            actionBtn.title = "Sign In / Register";
            actionBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket text-sm text-indigo-400 hover:text-indigo-300 transition-colors"></i>`;
            actionBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'login.html';
            };
        }
    }
}

/// ==========================================
// REAL-TIME BACKEND SYNC PIPELINES
// ==========================================

window.toggleFavoriteState = async function(event, movieId) {
    if (event) event.stopPropagation(); 
    
    // 1. HARD LOGIN GATE: Prevent unauthorized data processing
    const token = localStorage.getItem('cinekeep_auth_token');
    if (!token) {
        alert("Authentication Required: Please sign in to save your favorite media items!");
        window.location.href = 'login.html';
        return; 
    }

    const stringMovieId = String(movieId);
    const button = document.querySelector(`[data-fav-id="${movieId}"]`);
    const headerCountLabel = document.getElementById('headerFavoriteCount');
    
    let localFavs = JSON.parse(localStorage.getItem('cinekeep_local_favs')) || [];
    const index = localFavs.indexOf(stringMovieId);

    // Update local state immediately for UI responsiveness
    if (index === -1) {
        localFavs.push(stringMovieId);
        if (button) button.classList.add('is-favorite', 'text-rose-500');
        if (typeof window.pushNotificationAlert === 'function') {
            window.pushNotificationAlert('fa-heart text-rose-400 bg-rose-500/10', 'Added to Favorites', 'Saved title down directly into your curated room collection.');
        }
    } else {
        localFavs.splice(index, 1);
        if (button) button.classList.remove('is-favorite', 'text-rose-500');
    }
    
    localStorage.setItem('cinekeep_local_favs', JSON.stringify(localFavs));
    if (headerCountLabel) headerCountLabel.innerText = localFavs.length;

    // Refresh view if user is currently on the Favorites tab
    if (activeMenuTab === 'favorites') {
        switchMenuTab('favorites', false);
    }

    // 2. BACKEND SYNC: Securely POST the update to your live production Render node
    try {
        const response = await fetch(`${LIVE_BACKEND_URL}/api/media/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ movieId: stringMovieId })
        });
        
        if (response.ok) {
            const serverFavs = await response.json();
            localStorage.setItem('cinekeep_local_favs', JSON.stringify(serverFavs));
            if (headerCountLabel) headerCountLabel.innerText = serverFavs.length;
        }
    } catch (error) {
        console.error("Failed syncing collection state change to backend:", error);
    }
};

window.handleWatchlistClick = async function(event, movieId) {
    if (event) event.stopPropagation(); 
    
    // 1. HARD LOGIN GATE: Prevent unauthorized data processing
    const token = localStorage.getItem('cinekeep_auth_token');
    if (!token) {
        alert("Authentication Required: Please sign in to curate your Watchlist!");
        window.location.href = 'login.html';
        return; 
    }

    const stringMovieId = String(movieId);
    const watchHeaderBadge = document.querySelector('.group\\/watch span') || document.getElementById('headerWatchlistCount');
    
    let localWatch = JSON.parse(localStorage.getItem('cinekeep_local_watchlist')) || [];
    const index = localWatch.indexOf(stringMovieId);

    // Update local state immediately for UI responsiveness
    if (index === -1) {
        localWatch.push(stringMovieId);
        if (typeof window.pushNotificationAlert === 'function') {
            window.pushNotificationAlert('fa-bookmark text-indigo-400 bg-indigo-500/10', 'Watch Later Updated', 'Media bookmark indices written successfully inside your workspace.');
        }
    } else {
        localWatch.splice(index, 1);
    }
    
    localStorage.setItem('cinekeep_local_watchlist', JSON.stringify(localWatch));
    if (watchHeaderBadge) watchHeaderBadge.innerText = localWatch.length;

    // 2. BACKEND SYNC: Securely POST the update to your live production Render node
    try {
        const response = await fetch(`${LIVE_BACKEND_URL}/api/media/watchlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ movieId: stringMovieId })
        });

        if (response.ok) {
            const serverWatch = await response.json();
            localStorage.setItem('cinekeep_local_watchlist', JSON.stringify(serverWatch));
            if (watchHeaderBadge) watchHeaderBadge.innerText = serverWatch.length;
        }
    } catch (error) {
        console.error("Failed syncing watchlist state change to backend:", error);
    }
    
    // Refresh UI
    switchMenuTab(activeMenuTab, false);
};