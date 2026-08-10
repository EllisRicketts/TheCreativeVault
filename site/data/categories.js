const vaultMeta = {
  title: "The Creative Vault",
  curator: "Ellis Ricketts",
  contactEmail: "ellisricketts3d@gmail.com",
  lastUpdated: "July 2026",
  version: "4.0 Modular Architecture"
};

const vaultCategories = [
  {
    id: "digital-art",
    label: "Digital Art",
    icon: "✐",
    description: "Drawing, painting, illustration, comics, vector art, and image creation tools."
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    icon: "⚙",
    description: "AI image, video, writing, voice, music, prompt, automation, and coding tools."
  },
  {
    id: "video",
    label: "Video",
    icon: "▷",
    description: "Editing, screen recording, captioning, color, VFX, motion graphics, and creator tools."
  },
  {
    id: "animation",
    label: "Animation",
    icon: "◌",
    description: "2D animation, rigging, motion graphics, character animation, and interactive animation tools."
  },
  {
    id: "3d-cad",
    label: "3D / CAD",
    icon: "⬡",
    description: "3D modeling, sculpting, animation, CAD, rendering, game engines, and 3D printing tools."
  },
  {
    id: "photo",
    label: "Photography",
    icon: "▣",
    description: "Photo editing, RAW processing, stock photography, presets, restoration, and image tools."
  },
  {
    id: "music",
    label: "Music",
    icon: "♫",
    description: "Music production, distribution, royalties, plugins, mixing, mastering, and artist tools."
  },
  {
    id: "audio",
    label: "Audio",
    icon: "◍",
    description: "Voice, podcasting, audio cleanup, sound effects, sample packs, mastering, and sound design."
  },
  {
    id: "web-dev",
    label: "Web & Dev",
    icon: "▤",
    description: "Website builders, hosting, domains, code tools, no-code, templates, and development resources."
  },
  {
    id: "learning",
    label: "Learning",
    icon: "▣",
    description: "Courses, tutorials, schools, YouTube channels, workshops, books, and education platforms."
  },
  {
    id: "business",
    label: "Business",
    icon: "♜",
    description: "Contracts, invoices, accounting, pricing, CRM, freelancing, legal, marketing, and operations."
  },
  {
    id: "grants",
    label: "Grants",
    icon: "♕",
    description: "Funding, grants, artist opportunities, government programs, and creative support."
  },
  {
    id: "assets",
    label: "Assets",
    icon: "▧",
    description: "Textures, brushes, fonts, mockups, stock assets, 3D models, icons, and marketplaces."
  },
  {
    id: "reference",
    label: "Reference",
    icon: "♡",
    description: "Pose references, anatomy, color, inspiration, moodboards, and visual libraries."
  },
  {
    id: "content-creation",
    label: "Content Creation",
    icon: "▶",
    description: "Tools for creators, social media, thumbnails, streaming, planning, and publishing."
  },
  {
    id: "game-dev",
    label: "Game Dev",
    icon: "◇",
    description: "Game engines, asset stores, shaders, sprites, tools, plugins, and development resources."
  },
  {
    id: "marketplaces",
    label: "Marketplaces",
    icon: "▰",
    description: "Platforms to sell art, merch, assets, music, products, templates, and creative services."
  },
  {
    id: "freelancing",
    label: "Freelancing",
    icon: "✦",
    description: "Freelance platforms, job boards, portfolio opportunities, remote work, and client systems."
  },
  {
    id: "3d-printing",
    label: "3D Printing",
    icon: "⌘",
    description: "3D print models, slicers, printers, materials, file libraries, and maker resources."
  }
];

const categoryIcons = Object.fromEntries(
  vaultCategories.map(category => [category.label, category.icon])
);
