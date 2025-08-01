const API_KEY = '8c79e8986ea53efac75026e541207aa3';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';
const LOGO_URL = 'https://image.tmdb.org/t/p/w500';
const STREAMING_URL_MOVIE = 'https://vidfast.pro/movie/';
const STREAMING_URL_TV = 'https://vidfast.pro/tv/';
const ADSTERRA_DIRECT_LINKS = [
    'GANTI_DENGAN_DIRECT_LINK_1',
    'GANTI_DENGAN_DIRECT_LINK_2',
    'GANTI_DENGAN_DIRECT_LINK_3',
    'GANTI_DENGAN_DIRECT_LINK_4',
    'GANTI_DENGAN_DIRECT_LINK_5'
];
const COUNTDOWN_SECONDS = 3;

const customData = {
    '624566': { videoUrl: '...' } // Contoh data kustom
};

const movieDetailHero = document.getElementById('movie-detail-hero');
const detailMainContent = document.getElementById('detail-main-content');
const videoModal = document.getElementById('video-modal');
const closeModalBtn = document.getElementById('close-video-modal');
const movieIframe = document.getElementById('movie-iframe');
const adTimerModal = document.getElementById('ad-timer-modal');
const adTimerCountdown = document.getElementById('ad-timer-countdown');
const adTimerContinueBtn = document.getElementById('ad-timer-continue-btn');

let countdownInterval;
let onContinueAction;

function startAdCountdown(actionAfterAd) {
    onContinueAction = actionAfterAd;
    const randomIndex = Math.floor(Math.random() * ADSTERRA_DIRECT_LINKS.length);
    const selectedDirectLink = ADSTERRA_DIRECT_LINKS[randomIndex];
    window.open(selectedDirectLink, '_blank');
    adTimerModal.style.display = 'flex';
    adTimerContinueBtn.style.display = 'none';
    adTimerCountdown.style.display = 'block';
    let secondsLeft = COUNTDOWN_SECONDS;
    adTimerCountdown.innerHTML = `Link akan terbuka dalam <span>${secondsLeft}</span> detik...`;
    countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            adTimerCountdown.querySelector('span').textContent = secondsLeft;
        } else {
            clearInterval(countdownInterval);
            adTimerCountdown.style.display = 'none';
            adTimerContinueBtn.style.display = 'inline-block';
        }
    }, 1000);
}

adTimerContinueBtn.addEventListener('click', () => {
    adTimerModal.style.display = 'none';
    clearInterval(countdownInterval);
    if (typeof onContinueAction === 'function') { onContinueAction(); }
});

function getWatchlist() { return JSON.parse(localStorage.getItem('cinebroWatchlist')) || []; }
function saveWatchlist(watchlist) { localStorage.setItem('cinebroWatchlist', JSON.stringify(watchlist)); }

function updateMetaTags(content) {
    const title = `${content.title || content.name} - Nonton di CineBro`;
    const description = content.overview ? content.overview.substring(0, 155).trim() + '...' : `Nonton atau download ${title} dengan subtitle Indonesia gratis hanya di CineBro.`;
    const imageUrl = content.backdrop_path ? BACKDROP_URL + content.backdrop_path : IMG_URL + content.poster_path;
    document.title = title;
    document.querySelector('meta[name="description"]').setAttribute('content', description);
    document.querySelector('meta[property="og:title"]').setAttribute('content', title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', description);
    document.querySelector('meta[property="og:image"]').setAttribute('content', imageUrl);
    document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
    document.querySelector('meta[property="twitter:title"]').setAttribute('content', title);
    document.querySelector('meta[property="twitter:description"]').setAttribute('content', description);
    document.querySelector('meta[property="twitter:image"]').setAttribute('content', imageUrl);
}

async function loadDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('id');
    const contentType = urlParams.get('type') || 'movie';
    if (!contentId) { movieDetailHero.innerHTML = '<h1>Konten tidak ditemukan.</h1>'; return; }
    try {
        const endpoint = `/${contentType}/${contentId}`;
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=id-ID&append_to_response=videos,credits,recommendations`);
        if (!response.ok) throw new Error('Konten tidak ditemukan.');
        let data = await response.json();

        // Ambil data gambar/logo secara terpisah dengan pengecekan
        try {
            const imageResponse = await fetch(`${BASE_URL}${endpoint}/images?api_key=${API_KEY}&include_image_language=en,null`);
            if(imageResponse.ok) {
                data.images = await imageResponse.json();
            } else {
                data.images = { logos: [] };
            }
        } catch (imgError) {
            console.warn("Gagal memuat data logo:", imgError);
            data.images = { logos: [] };
        }

        if (!data.overview) {
            const englishResponse = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US`);
            const englishData = await englishResponse.json();
            data.overview = englishData.overview || "Sinopsis untuk film ini belum tersedia.";
        }
        
        data.videos = data.videos || { results: [] };
        data.credits = data.credits || { cast: [] };
        data.recommendations = data.recommendations || { results: [] };

        const finalContent = { ...data, type: contentType };
        updateMetaTags(finalContent);
        displayHeroDetail(finalContent);
        detailMainContent.innerHTML = '';
        displayTrailer(finalContent.videos.results);
        displayActors(finalContent.credits.cast);
        displayRecommendations(finalContent.recommendations.results, contentType);
    } catch (error) {
        console.error("Error:", error);
        movieDetailHero.innerHTML = `<h1>Error memuat data. Periksa koneksi atau ID konten.</h1>`;
        detailMainContent.innerHTML = '';
    }
}

function displayHeroDetail(content) {
    if (content.backdrop_path) {
        movieDetailHero.style.backgroundImage = `url(${BACKDROP_URL + content.backdrop_path})`;
    }
    const title = content.title || content.name;
    const releaseDate = content.release_date || content.first_air_date;
    const formattedDate = releaseDate ? new Date(releaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }) : 'N/A';
    const runtimeInfo = content.type === 'tv' ? (content.number_of_seasons ? `${content.number_of_seasons} Seasons` : 'Info N/A') : (content.runtime ? `${Math.floor(content.runtime / 60)}h ${content.runtime % 60}m` : 'Info N/A');
    const isInWatchlist = getWatchlist().includes(content.id.toString());
    let titleHTML;
    const englishLogo = content.images?.logos?.find(logo => logo.iso_639_1 === 'en');
    if (englishLogo) {
        titleHTML = `<div class="title-logo"><img src="${LOGO_URL + englishLogo.file_path}" alt="${title} Logo"></div>`;
    } else {
        titleHTML = `<h1 class="fallback-title">${title}</h1>`;
    }
    movieDetailHero.innerHTML = `
        <div class="poster-box"><img src="${IMG_URL + content.poster_path}" alt="${title}"></div>
        <div class="detail-box">
            ${titleHTML}
            <div class="meta-info">
                <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                <span><i class="fas fa-star"></i> ${content.vote_average.toFixed(1)}</span>
                ${runtimeInfo ? `<span><i class="fas fa-clock"></i> ${runtimeInfo}</span>` : ''}
            </div>
            <div class="genres">${content.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')}</div>
            <p class="overview">${content.overview}</p>
            <div class="action-buttons">
                <a href="#" class="action-btn play-btn" id="play-btn" data-id="${content.id}" data-type="${content.type}"><i class="fas fa-play"></i></a>
                <a href="#" class="action-btn watchlist-btn ${isInWatchlist ? 'active' : ''}" id="watchlist-btn" data-content-id="${content.id}">
                    <i class="fas fa-plus"></i> Add to watchlist
                </a>
                <a href="download.html?id=${content.id}&type=${content.type}" class="action-btn download-btn"><i class="fas fa-download"></i></a>
            </div>
        </div>
    `;
    document.getElementById('play-btn').addEventListener('click', handlePlayClick);
    document.getElementById('watchlist-btn').addEventListener('click', handleWatchlistClick);
}

function handlePlayClick(e) {
    e.preventDefault();
    const { id, type } = e.currentTarget.dataset;
    let streamUrl;
    if (typeof customData !== 'undefined' && customData[id] && customData[id].videoUrl) {
        streamUrl = customData[id].videoUrl;
    } else {
        if (type === 'tv') { streamUrl = `${STREAMING_URL_TV}${id}/1/1`; } else { streamUrl = `${STREAMING_URL_MOVIE}${id}`; }
    }
    startAdCountdown(() => {
        movieIframe.src = streamUrl;
        videoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
}

function handleWatchlistClick(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const contentId = button.dataset.contentId;
    let watchlist = getWatchlist();
    if (watchlist.includes(contentId)) { watchlist = watchlist.filter(id => id !== contentId); button.classList.remove('active'); button.innerHTML = `<i class="fas fa-plus"></i> Add to watchlist`;
    } else { watchlist.push(contentId); button.classList.add('active'); button.innerHTML = `<i class="fas fa-check"></i> In Watchlist`; }
    saveWatchlist(watchlist);
}

function displayTrailer(videos) {
    if (!videos || videos.length === 0) return;
    const trailerSection = document.createElement('section');
    trailerSection.className = 'content-section';
    const officialTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const teaser = videos.find(v => v.type === 'Teaser' && v.site === 'YouTube');
    const firstVideo = videos.find(v => v.site === 'YouTube');
    const trailer = officialTrailer || teaser || firstVideo;
    if (trailer) {
        trailerSection.innerHTML = `<h2>Trailer</h2><div id="trailer-container"><iframe src="https://www.youtube.com/embed/${trailer.key}" title="YouTube video player" allowfullscreen></iframe></div>`;
        detailMainContent.appendChild(trailerSection);
    }
}

function displayActors(cast) {
    if (!cast || cast.filter(actor => actor.profile_path).length === 0) return;
    const actorsSection = document.createElement('section');
    actorsSection.className = 'content-section';
    let actorsHTML = '';
    cast.filter(actor => actor.profile_path).slice(0, 12).forEach(actor => {
        actorsHTML += `<div class="actor-card"><img src="${IMG_URL + actor.profile_path}" alt="${actor.name}"><h3>${actor.name}</h3><p>${actor.character}</p></div>`;
    });
    actorsSection.innerHTML = `<h2>Pemeran Utama</h2><div class="actors-grid">${actorsHTML}</div>`;
    detailMainContent.appendChild(actorsSection);
}

function displayRecommendations(recommendations, type) {
    if (!recommendations || recommendations.length === 0) return;
    const recommendationsSection = document.createElement('section');
    recommendationsSection.className = 'content-section';
    let recHTML = '';
    recommendations.slice(0, 10).forEach(item => {
        if (item.poster_path) {
            recHTML += `<a href="detail.html?id=${item.id}&type=${type}" class="movie-card"><img src="${IMG_URL + item.poster_path}" alt="${item.title || item.name}"><div class="movie-info"><h3>${item.title || item.name}</h3></div></a>`;
        }
    });
    recommendationsSection.innerHTML = `<h2>Rekomendasi Serupa</h2><div class="movie-grid">${recHTML}</div>`;
    detailMainContent.appendChild(recommendationsSection);
}

closeModalBtn.addEventListener('click', () => {
    movieIframe.src = ''; 
    videoModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

document.addEventListener('DOMContentLoaded', loadDetailPage);
