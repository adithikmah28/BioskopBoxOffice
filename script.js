const API_KEY = '8c79e8986ea53efac75026e541207aa3';
const BASE_URL = 'https://api.themoviedb.org/3';
const API_ENDPOINTS = {
    trendingMovies: `/trending/movie/week?api_key=${API_KEY}&language=id-ID`,
    indonesianMovies: `/discover/movie?api_key=${API_KEY}&language=id-ID&sort_by=popularity.desc&with_original_language=id`,
    popularTV: `/tv/popular?api_key=${API_KEY}&language=id-ID`,
    popularMovies: `/movie/popular?api_key=${API_KEY}&language=id-ID`,
    topRatedMovies: `/movie/top_rated?api_key=${API_KEY}&language=id-ID`,
    multiSearch: `/search/multi?api_key=${API_KEY}&language=id-ID&include_adult=false&query=`,
};
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const categoryTitle = document.getElementById('category-title');
const trendingGrid = document.getElementById('trending-grid');
const indonesianMoviesGrid = document.getElementById('indonesian-movies-grid');
const tvSeriesGrid = document.getElementById('tv-series-grid');
const popularMoviesGrid = document.getElementById('popular-movies-grid');
const topRatedMoviesGrid = document.getElementById('top-rated-movies-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const hamburgerMenu = document.getElementById('hamburger-menu');
const navWrapper = document.getElementById('nav-wrapper');
const requestMovieBtn = document.getElementById('request-movie-btn');
const requestModal = document.getElementById('request-modal');
const closeRequestModalBtn = document.getElementById('close-request-modal');
const requestForm = document.getElementById('request-form');
const formStatus = document.getElementById('form-status');

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(BASE_URL + endpoint);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        return data.results;
    } catch (error) { console.error('Error fetching data:', error); return []; }
}

function displayContent(content, container, defaultType = 'movie') {
    container.innerHTML = '';
    content.forEach(item => {
        if ((item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) && item.poster_path) {
            const type = item.media_type || defaultType;
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            const itemLink = document.createElement('a');
            itemLink.href = `detail.html?id=${item.id}&type=${type}`;
            itemLink.classList.add('movie-card');
            const title = item.title || item.name;
            const releaseDate = item.release_date || item.first_air_date;
            const year = releaseDate ? `(${new Date(releaseDate).getFullYear()})` : '';
            itemLink.innerHTML = `<img src="${IMG_URL + item.poster_path}" alt="${title}"><div class="movie-info"><h3>${title} ${year}</h3></div>`;
            slide.appendChild(itemLink);
            container.appendChild(slide);
        }
    });
}

function initializeSwipers() {
    document.querySelectorAll('.swiper-container').forEach(container => {
        new Swiper(container, {
            slidesPerView: 'auto',
            spaceBetween: 15,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: 3, spaceBetween: 10 },
                640: { slidesPerView: 4, spaceBetween: 15 },
                1024: { slidesPerView: 6, spaceBetween: 15 },
                1200: { slidesPerView: 7, spaceBetween: 15 },
            }
        });
    });
}

async function handleSearch(e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        document.querySelectorAll('.movies-category').forEach(section => {
            if (section.querySelector('#trending-grid') === null) { section.style.display = 'none'; }
        });
        document.querySelector('.search-helper-message').style.display = 'none';
        categoryTitle.textContent = `Hasil Pencarian untuk: "${searchTerm}"`;
        const searchResults = await fetchAPI(API_ENDPOINTS.multiSearch + encodeURIComponent(searchTerm));
        
        // Hasil pencarian tidak akan jadi slider, jadi kita butuh kontainer biasa
        const searchGrid = document.querySelector('#trending-grid').parentElement;
        searchGrid.classList.remove('swiper-container');
        searchGrid.querySelector('.swiper-wrapper').classList.add('movie-grid');
        searchGrid.querySelector('.swiper-wrapper').classList.remove('swiper-wrapper');
        searchGrid.querySelector('.swiper-button-next').style.display = 'none';
        searchGrid.querySelector('.swiper-button-prev').style.display = 'none';

        if (searchResults && searchResults.length > 0) {
            displayContentAsGrid(searchResults, document.querySelector('.movie-grid'));
        } else {
            document.querySelector('.movie-grid').innerHTML = `<p style="color: #ccc; font-size: 1.2rem;">Tidak ada hasil ditemukan.</p>`;
        }
    } else {
        window.location.reload(); // Cara paling mudah untuk reset
    }
}

// Fungsi baru untuk hasil pencarian (non-slider)
function displayContentAsGrid(content, container, defaultType = 'movie') {
    container.innerHTML = '';
    content.forEach(item => {
        if ((item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type) && item.poster_path) {
            const type = item.media_type || defaultType;
            const itemLink = document.createElement('a');
            itemLink.href = `detail.html?id=${item.id}&type=${type}`;
            itemLink.classList.add('movie-card');
            itemLink.style.height = 'auto'; // Override tinggi slider
            const title = item.title || item.name;
            const releaseDate = item.release_date || item.first_air_date;
            const year = releaseDate ? `(${new Date(releaseDate).getFullYear()})` : '';
            itemLink.innerHTML = `<img src="${IMG_URL + item.poster_path}" alt="${title}"><div class="movie-info"><h3>${title} ${year}</h3><span><i class="fas fa-star"></i> ${item.vote_average.toFixed(1)}</span></div>`;
            container.appendChild(itemLink);
        }
    });
}

async function loadInitialData() {
    const [trendingMovies, indonesianMovies, popularTV, popularMovies, topRatedMovies] = await Promise.all([
        fetchAPI(API_ENDPOINTS.trendingMovies), 
        fetchAPI(API_ENDPOINTS.indonesianMovies),
        fetchAPI(API_ENDPOINTS.popularTV),
        fetchAPI(API_ENDPOINTS.popularMovies),
        fetchAPI(API_ENDPOINTS.topRatedMovies)
    ]);
    displayContent(trendingMovies, trendingGrid, 'movie');
    displayContent(indonesianMovies, indonesianMoviesGrid, 'movie');
    displayContent(popularTV, tvSeriesGrid, 'tv');
    displayContent(popularMovies, popularMoviesGrid, 'movie');
    displayContent(topRatedMovies, topRatedMoviesGrid, 'movie');
    initializeSwipers();
}

hamburgerMenu.addEventListener('click', () => { navWrapper.classList.toggle('active'); });
requestMovieBtn.addEventListener('click', () => { requestModal.style.display = 'flex'; });
closeRequestModalBtn.addEventListener('click', () => { requestModal.style.display = 'none'; });
requestModal.addEventListener('click', (e) => { if (e.target === requestModal) { requestModal.style.display = 'none'; } });
requestForm.addEventListener('submit', async function(event) { /* ... (fungsi ini sama) ... */ });
searchForm.addEventListener('submit', handleSearch);
document.addEventListener('DOMContentLoaded', loadInitialData);
requestForm.action = 'https://formspree.io/f/xxxxxxxx';
