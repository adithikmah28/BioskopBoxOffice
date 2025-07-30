const API_KEY = '8c79e8986ea53efac75026e541207aa3'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const DOWNLOAD_SOURCE_URL_MOVIE = 'https://dl.vidsrc.vip/movie/';
const DOWNLOAD_SOURCE_URL_TV = 'https://dl.vidsrc.vip/tv/';

const downloadContentWrapper = document.getElementById('download-content-wrapper');

async function loadDownloadPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('id');
    const contentType = urlParams.get('type') || 'movie';
    if (!contentId) { displayError("ID konten tidak ditemukan."); return; }
    try {
        const endpoint = `/${contentType}/${contentId}`;
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=id-ID`);
        if (!response.ok) throw new Error("Konten tidak ditemukan di TMDB.");
        const content = await response.json();
        const title = content.title || content.name;
        document.title = `Download ${title} - CineBro`;
        document.querySelector('meta[name="description"]').setAttribute('content', `Halaman download untuk ${title}. Unduh sekarang dengan kualitas terbaik hanya di CineBro.`);
        displayDownloadInfo(content, contentType);
    } catch (error) { console.error("Error:", error); displayError(error.message); }
}

function displayDownloadInfo(content, type) {
    const downloadLink = type === 'tv' ? `${DOWNLOAD_SOURCE_URL_TV}${content.id}` : `${DOWNLOAD_SOURCE_URL_MOVIE}${content.id}`;
    const title = content.title || content.name;
    const overview = content.overview && content.overview.length > 150 ? content.overview.substring(0, 150) + '...' : content.overview || "Sinopsis tidak tersedia.";
    const buttonText = type === 'tv' ? 'Download Semua Season (ZIP)' : 'Download Film';
    const html = `<div class="download-card"><div class="download-header"><div class="download-poster"><img src="${IMG_URL + content.poster_path}" alt="${title}"></div><div class="download-info"><h1>${title}</h1><p>${overview}</p></div></div><div class="download-buttons"><a href="${downloadLink}" class="download-button-item" target="_blank"><i class="fas fa-cloud-download-alt"></i> ${buttonText}</a></div></div>`;
    downloadContentWrapper.innerHTML = html;
}

function displayError(message) {
    const html = `<div class="download-card"><h2><i class="fas fa-exclamation-triangle"></i> Error</h2><p>${message}</p></div>`;
    downloadContentWrapper.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadDownloadPage);
