const clientId = "e171a509869a4302ae809bfd115eaf51";
const clientSecret = "7a631abba6eb49cfa74a13596287d5e6";

let accessToken = "";

async function getToken() {
  try {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`)
      },
      body: "grant_type=client_credentials"
    });

    if (!result.ok) {
      const text = await result.text();
      throw new Error(`Failed to get token: ${result.status} ${text}`);
    }

    const data = await result.json();
    if (!data.access_token) {
      throw new Error("Spotify returned no access token");
    }

    accessToken = data.access_token;
  } catch (error) {
    console.error("Token Error:", error);
    document.getElementById("error").textContent = error.message;
  }
}

async function spotifyFetch(path, options = {}) {
  if (!accessToken) {
    await getToken();
  }

  if (!accessToken) {
    throw new Error("No Spotify access token available");
  }

  const response = await fetch(`https://api.spotify.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify request failed with status ${response.status}: ${text}`);
  }

  return response.json();
}

function toggleArtistsSection(show) {
  const section = document.getElementById("topArtists");
  if (section) {
    section.style.display = show ? "block" : "none";
  }
}

// Search Track
async function searchTrack(query) {
  try {
    const data = await spotifyFetch(`/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`);
    toggleArtistsSection(false);
    displayTracks(data.tracks.items);
    saveHistory(query);
  } catch (error) {
    console.error("Search Error:", error);
    document.getElementById("error").textContent = "Error fetching tracks!";
  }
}

// Display Tracks
function displayTracks(tracks) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!tracks.length) {
    container.innerHTML = "<p>No tracks found.</p>";
    return;
  }

  tracks.forEach(track => {
    const div = document.createElement("div");
    div.className = "track";
    div.innerHTML = `
      <h3>${track.name} - ${track.artists[0].name}</h3>
      <img src="${track.album.images[0]?.url || ''}" alt="Album Art"
           onclick="playTrack('${track.id}','${track.name}','${track.artists[0].name}')">
    `;
    container.appendChild(div);
  });
}

// Play Track + Show Lyrics + Add to Playlist Button
async function playTrack(trackId, trackName, artistName) {
  localStorage.setItem("currentTrack", trackId);

  document.getElementById("player").innerHTML = `
    <iframe style="border-radius:12px"
      src="https://open.spotify.com/embed/track/${trackId}"
      width="300" height="80" frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"></iframe>
    <button onclick="addToPlaylist('${trackName} - ${artistName}')">Add to Playlist</button>
  `;

  // Fetch lyrics
  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${artistName}/${trackName}`);
    const data = await res.json();
    document.getElementById("lyrics").innerHTML =
      `<pre>${data.lyrics || "Lyrics not available"}</pre>`;
  } catch {
    document.getElementById("lyrics").innerHTML = "<p>Lyrics not available</p>";
  }
}

// Save history in localStorage
function saveHistory(query) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.push(query);
  localStorage.setItem("history", JSON.stringify(history));
}

// Add to Playlist
function addToPlaylist(song) {
  let playlist = JSON.parse(localStorage.getItem("playlist")) || [];
  playlist.push(song);
  localStorage.setItem("playlist", JSON.stringify(playlist));
  alert(`${song} added to playlist!`);
}

// ================== ARTIST SUGGESTIONS ==================

// Suggested Artists
async function loadTopArtists() {
  const container = document.getElementById("artistsList");
  container.innerHTML = "";

  const genres = ["pop", "opm", "hiphop"];

  for (const genre of genres) {
    try {
      const data = await spotifyFetch(`/v1/search?q=genre:${genre}&type=artist&limit=3`);
      (data.artists?.items || []).forEach(artist => {
        const div = document.createElement("div");
        div.className = "track";
        div.innerHTML = `
          <h3 onclick="loadArtistTracks('${artist.id}', '${artist.name}')">${artist.name}</h3>
          <img src="${artist.images[0]?.url || ''}" alt="Artist" onclick="loadArtistTracks('${artist.id}', '${artist.name}')">
        `;
        container.appendChild(div);
      });
    } catch (error) {
      console.error("Artist Suggestion Error:", error);
      container.innerHTML += `<p>${error.message}</p>`;
    }
  }
}




// Search Button
document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("search").value.trim();
  if (!query) {
    document.getElementById("error").textContent = "Please enter a search term.";
    return;
  }
  document.getElementById("error").textContent = "";
  await searchTrack(query);
});

document.getElementById("search").addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const query = document.getElementById("search").value.trim();
    if (!query) {
      document.getElementById("error").textContent = "Please enter a search term.";
      return;
    }
    document.getElementById("error").textContent = "";
    await searchTrack(query);
  }
});

// Show artist suggestions again when the page is reloaded or the search box is cleared
window.addEventListener("DOMContentLoaded", () => {
  toggleArtistsSection(true);
});


// Init
(async () => {
  await getToken();
  await loadTopArtists();
})();

// Load persistent track if exists
window.onload = () => {
  const currentTrack = localStorage.getItem("currentTrack");
  if (currentTrack) {
    document.getElementById("player").innerHTML = `
      <iframe src="https://open.spotify.com/embed/track/${currentTrack}"
        width="300" height="80" frameborder="0" allow="encrypted-media"></iframe>`;
  }
};
