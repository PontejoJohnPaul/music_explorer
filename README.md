# 🎶 Music Explorer

A dark-themed, Spotify-inspired web app for discovering songs, viewing lyrics, and building your own playlist — all in the browser.

## Features

- **Search** — Look up any song or artist using the Spotify Web API. Results appear as a grid of track cards with album art.
- **Persistent Player** — A bottom player bar embeds the actual Spotify track and stays visible as you browse, even after navigating to other pages.
- **My Playlist** — Add tracks to a personal playlist from the Now Playing modal; view and manage it on a dedicated page.
- **Recent Search History** — Every search you make is saved and viewable on its own page, along with the last played track.
- **Persistent Data** — Playlist, search history, and the currently playing track are all saved in `localStorage`, so nothing resets when you reload or switch pages.

## Pages

| Page | Description |
|---|---|
| `index.html` | Home page — search bar, track results grid, Now Playing modal, persistent player |
| `history.html` | Shows your recent search terms and the last track you played |
| `playlist.html` | Shows all songs you've added to your playlist |

## How It Works

1. On load, the app requests an access token from Spotify using the Client Credentials flow.
2. When you search, it queries the Spotify Search API and displays matching tracks as cards.
3. Clicking a track opens the Now Playing modal, fetches lyrics from the `lyrics.ovh` API, and loads the track into the embedded Spotify player at the bottom.
4. Adding a track to your playlist, or searching, updates `localStorage`, which the History and Playlist pages read from directly.

## Tech Stack

- Plain HTML, CSS, and JavaScript (no frameworks)
- Spotify Web API (search + track embeds)
- lyrics.ovh API (lyrics lookup)
- Browser `localStorage` for persistence

## Running the Project

The easiest way to run this locally is with the **Live Server** VS Code extension:

1. Install the **Live Server** extension (by Ritwick Dey).
2. Right-click `index.html` → **"Open with Live Server"**.

You can also just double-click `index.html` to open it directly in your browser — it works the same way since there's no backend server involved.

## File Structure

```
music_explorer/
├── index.html       # Home page
├── style.css         # Styling for home page (grid, modal, player)
├── script.js          # Search, modal, lyrics, playlist/history logic
├── history.html      # Recent search history page
├── history.css        # Styling for history page
├── playlist.html      # My playlist page
└── playlist.css        # Styling for playlist page
```

