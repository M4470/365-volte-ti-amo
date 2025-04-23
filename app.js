// Global variables
const START_DATE = new Date(Date.UTC(2025, 3, 24)); // April 24, 2025
let currentLanguage = 'pt'; // Default language
let contentData = null;
let currentDayIndex = 0;
let audioPlayer = null;
let isPlaying = false;

// Calculate days since start date using UTC to avoid timezone issues
function getDaysSinceStart() {
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const startUTC = Date.UTC(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
    
    const timeDiff = todayUTC - startUTC;
    const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Ensure we don't get negative days or exceed 364
    return Math.max(0, Math.min(364, dayDiff));
}

// Fetch the content from the JSON file
async function fetchContent() {
    try {
        const response = await fetch('/content.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        contentData = await response.json();
        return contentData;
    } catch (error) {
        showError("Couldn't load today's content. Please try refreshing the page.");
        console.error('Error fetching content:', error);
        return null;
    }
}

// Show error message
function showError(message) {
    const phraseElement = document.getElementById('phrase');
    phraseElement.innerHTML = `<div class="error-message">${message}</div>`;
}

// Get content for specific day
function getContentForDay(dayIndex) {
    if (!contentData) return null;
    
    // Check if we have content for this day, otherwise use fallbacks
    return {
        phrase: contentData.phrases[dayIndex] || {
            en: "Content for this day is coming soon...",
            pt: "O conteúdo para este dia está chegando em breve...",
            it: "Il contenuto per questo giorno arriverà presto..."
        },
        track: contentData.tracks[dayIndex] || {
            url: "silence.mp3", // A silent audio file
            title: {
                en: "Track coming soon",
                pt: "Faixa em breve",
                it: "Traccia in arrivo"
            }
        }
    };
}

// Update UI with content
function updateContent(dayIndex) {
    const content = getContentForDay(dayIndex);
    if (!content) return;
    
    // Update phrase
    document.getElementById('phrase').textContent = content.phrase[currentLanguage];
    
    // Update track title
    document.getElementById('track-title').textContent = content.track.title[currentLanguage];
    
    // Update audio source
    audioPlayer.src = content.track.url;
    
    // Try to autoplay (will work if user has interacted with page already)
    tryAutoplay();
}

// Try to autoplay audio
function tryAutoplay() {
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Autoplay started successfully
            isPlaying = true;
            updatePlayButton();
        }).catch(error => {
            // Autoplay was prevented
            isPlaying = false;
            updatePlayButton();
            console.log("Autoplay prevented:", error);
        });
    }
}

// Update play/pause button appearance
function updatePlayButton() {
    const playBtn = document.getElementById('play-btn');
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
}

// Handle play/pause
function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        isPlaying = true;
    } else {
        audioPlayer.pause();
        isPlaying = false;
    }
    updatePlayButton();
}

// Skip to next track
function nextTrack() {
    currentDayIndex = (currentDayIndex + 1) % 365;
    updateContent(currentDayIndex);
    updateDayCounter(currentDayIndex);
}

// Skip to previous track
function prevTrack() {
    currentDayIndex = (currentDayIndex - 1 + 365) % 365;
    updateContent(currentDayIndex);
    updateDayCounter(currentDayIndex);
}

// Update day counter
function updateDayCounter(dayIndex) {
    const dayNumberElement = document.getElementById('day-number');
    const dayLabel = {
        en: `Day ${dayIndex}`,
        pt: `Dia ${dayIndex}`,
        it: `Giorno ${dayIndex}`
    };
    dayNumberElement.textContent = dayLabel[currentLanguage];
}

// Handle language switching
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Update active button
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update translations for static elements
    updateTranslations();
    
    // Update dynamic content
    updateContent(currentDayIndex);
    updateDayCounter(currentDayIndex);
}

// Update all translatable elements
function updateTranslations() {
    document.querySelectorAll('[data-' + currentLanguage + ']').forEach(element => {
        if (element.dataset[currentLanguage]) {
            if (element.tagName === 'INPUT') {
                element.value = element.dataset[currentLanguage];
            } else {
                element.textContent = element.dataset[currentLanguage];
            }
        }
    });
}

// Initialize everything
async function init() {
    // Get references to elements
    audioPlayer = document.getElementById('audio-player');
    
    // Calculate the current day index
    currentDayIndex = getDaysSinceStart();
    
    // Fetch content
    await fetchContent();
    
    // Update day counter
    updateDayCounter(currentDayIndex);
    
    // Update content with the current day's content
    updateContent(currentDayIndex);
    
    // Set up event listeners for audio player
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
    });
    
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
    });
    
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
    });
    
    // Set up control buttons
    document.getElementById('play-btn').addEventListener('click', togglePlay);
    document.getElementById('next-btn').addEventListener('click', nextTrack);
    document.getElementById('prev-btn').addEventListener('click', prevTrack);
    
    // Set up language switchers
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchLanguage(btn.dataset.lang);
        });
    });
    
    // Set default language
    switchLanguage('pt');
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);