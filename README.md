# نور القرآن — NoorQuran

A modern, feature-rich Quran reading and learning application built with React, TypeScript, and Tailwind CSS.

## Features

- **Quran Reader** — Read the Quran with a clean, distraction-free interface. Switch between verse-by-verse and continuous display modes (`display: 'contents'`).
- **Word-by-Word Audio** — Click any word to hear its pronunciation. Full verse and surah audio playback with multiple reciters.
- **Tafsir** — Inline verse-by-verse tafsir (Tafsir Muyassar for Arabic, Tazkirul Quran for English) — toggle per verse.
- **Translations** — Show/hide verse translations (The Clear Quran by Mustafa Khattab).
- **Bookmarks** — Bookmark individual verses for quick access.
- **Multiple Reciters** — Choose from a curated list of renowned reciters with high-quality audio.
- **Themes** — Multiple color themes: Golden Glint, Classic Light, Silver Lining, Vintage Sepia, Mocha Night, Midnight Blue, Forest Green, OLED Black, Dark Luxury.
- **Adhkar** — Morning and evening adhkar with counters.
- **Tasbih** — Digital tasbih counter.
- **Quiz Mode** — Test your Quran knowledge.
- **Verse of the Day** — Daily verse widget.
- **Prayer Times** — Display prayer times based on location.
- **PWA** — Install as a Progressive Web App for offline-capable usage.

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Styling |
| **Framer Motion** | Animations |
| **Vite** | Build tool |
| **React Router** | Client-side routing |
| **Quran.com API** | Verses, audio, translations, tafsir |
| **Supabase** | Authentication & data persistence |
| **Lucide Icons** | UI icons |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/
│   ├── decorative/       # Background patterns, ornaments
│   ├── features/         # Adhkar, Tasbih, Quiz, Prayer times
│   ├── home/             # Home page (verse of the day, prayer times)
│   ├── layout/           # Navbar
│   ├── reader/           # Quran reader, audio player, tafsir
│   └── ui/               # Service worker, banners
├── context/              # App state (settings, bookmarks, audio)
├── data/                 # Surah list, reciters data
├── hooks/                # Custom React hooks
├── services/             # API clients (Quran.com API, Supabase)
├── types.ts              # TypeScript types
└── utils/                # Utility functions
```

## Acknowledgements

- Quran text and audio provided by [Quran.com API](https://quran.com)
- Tafsir Muyassar and Tazkirul Quran via Quran.com

---

Created by **Montassar Ben Fraj**
