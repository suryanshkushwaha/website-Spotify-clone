console.log("JS Working...");

let currentSong = new Audio();
let songs;
let currentFolder;
let currentPlayingLi = null;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currentFolder = folder;
    let temp = await fetch(`/${folder}/`);
    let response = await temp.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let anchors = div.getElementsByTagName('a');
    songs = [];

    for (let index = 0; index < anchors.length; index++) {
        const element = anchors[index];
        if (element.href.endsWith('.mp3')) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show songs in the playlist
    let songOL = document.querySelector(".song-list").getElementsByTagName('ol')[0];
    songOL.innerHTML = "";
    for (const song of songs) {
        songOL.innerHTML += `<li>
            <img src="images/music.svg" alt="" class="invert">
            <div class="info">
                <p class="song-name">${song.replaceAll("%20", " ")}</p>
                <p class="artist">Suryansh</p>
            </div>
            <div class="play-now flex justify-center items-center">
                <p>Play Now</p>
                <img width="15" src="images/play.svg" alt="Play Now" class="invert">
            </div>
        </li>`;
    }

    // Event Listener to each song
    Array.from(document.querySelector('.song-list').getElementsByTagName('li')).forEach(li => {
        li.addEventListener('click', () => {
            playPauseSong(li);
        });
    });

    return songs;
}

const playPauseSong = (li) => {
    const playButton = li.querySelector('.play-now img');
    const playText = li.querySelector('.play-now p');

    if (currentPlayingLi && currentPlayingLi !== li) {
        const prevPlayButton = currentPlayingLi.querySelector('.play-now img');
        const prevPlayText = currentPlayingLi.querySelector('.play-now p');
        prevPlayButton.src = "images/play.svg";
        prevPlayText.textContent = "Play Now";
        currentPlayingLi.classList.remove('playing');
    }

    if (li.classList.contains('playing')) {
        currentSong.pause();
        playButton.src = "images/play.svg";
        playText.textContent = "Play Now";
        li.classList.remove('playing');
    } else {
        currentSong.src = `/${currentFolder}/` + li.querySelector(".info .song-name").innerHTML.trim();
        currentSong.play();
        playButton.src = "images/pause.svg";
        playText.textContent = "Pause";
        li.classList.add('playing');
        currentPlayingLi = li;
    }

    syncPlayPauseButtons();
    updateMainPlayPauseButton();
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currentFolder}/` + track;
    if (!pause) {
        currentSong.play();
    }
    document.querySelector(".song-info").innerHTML = decodeURI(track);
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    let temp = await fetch(`/songs/`);
    let response = await temp.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-container");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];
            // Get the metadata of the folder
            let a = await fetch(`songs/${folder}/info.json`);
            let response = await a.json();
            cardContainer.innerHTML += `<div data-folder="${folder}" class="card flex">
                <img src="/songs/${folder}/cover.jpg" alt="Album cover image">
                <img class="play" src="images/playhover.svg" alt="">
                <h4>${response.title}</h4>
                <p>${response.description}</p>
            </div>`;
        }
    }

    let previousCard = null;

    // Load playlist when clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching Songs");
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);

            // Reset the previous card's play image
            if (previousCard && previousCard !== e) {
                let previousPlayImage = previousCard.querySelector('.play');
                if (previousPlayImage) {
                    previousPlayImage.style.opacity = 0;
                    previousPlayImage.src = "images/playhover.svg";
                }
            }

            // Update the current card's play imagef
            let playImage = e.querySelector('.play');
            if (playImage) {
                playImage.style.opacity = 1;
                playImage.src = "images/pausehover.svg";
            }

            // Set the current card as the previous card
            previousCard = e;
        });
    });
}

function syncPlayPauseButtons() {
    const isPlaying = !currentSong.paused;

    if (isPlaying) {
        document.querySelectorAll(".play").forEach(playImage => {
            playImage.src = "images/pausehover.svg";
        });
        if (currentPlayingLi) {
            currentPlayingLi.querySelector(".play-now p").textContent = "Pause";
        }
    } else {
        document.querySelectorAll(".play").forEach(playImage => {
            playImage.src = "images/playhover.svg";
        });
        if (currentPlayingLi) {
            currentPlayingLi.querySelector(".play-now p").textContent = "Play Now";
        }
    }
}


function updateMainPlayPauseButton() {
    const mainPlayButton = document.getElementById('play');
    const isPlaying = !currentSong.paused;

    mainPlayButton.src = isPlaying ? "images/pause.svg" : "images/play.svg";
}

function togglePlayPause() {
    if (currentSong.paused) {
        currentSong.play();
    } else {
        currentSong.pause();
    }
    syncPlayPauseButtons();
    updateMainPlayPauseButton();
}


async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all the albums on the page
    await displayAlbums();

    // Attach event listener to play button in the main player controls
    const mainPlayButton = document.getElementById('play');
    mainPlayButton.addEventListener("click", togglePlayPause);

    // Attach event listener to play buttons in the album display
    document.querySelectorAll(".play").forEach(playImage => {
        playImage.addEventListener("click", async (event) => {
            // Prevent the event from bubbling up
            event.stopPropagation();

            // Toggle play/pause
            togglePlayPause();
        });
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add an event listener for hamburger
    document.querySelector("#hamburger").addEventListener("click", () => {
        document.querySelector("#left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector("#close").addEventListener("click", () => {
        document.querySelector("#left").style.left = "-120%";
    });

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Add event listener to mute the track
    let prevVolume = currentSong.volume;

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            prevVolume = currentSong.volume;
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = prevVolume;
            document.querySelector(".range input").value = prevVolume * 100;
        }
    });
}

main();
