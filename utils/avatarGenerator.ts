/**
 * Premium 2D Vector Avatar Engine for Campus Connect
 * Generates modular, scalable, high-resolution custom SVG avatars.
 */

export interface AvatarConfig {
  gender: 'male' | 'female';
  faceShape: 'oval' | 'round' | 'square' | 'heart';
  hairStyle: string; // male: spiky, dreads, classic, bald | female: curly, ponytail, bob, bangs
  glasses: 'none' | 'classic' | 'round' | 'sunglasses';
  hat: 'none' | 'cap' | 'beanie' | 'cowboy';
  skinColor: string;
  hairColor: string;
  hatColor: string;
  shirtColor: string;
  bgColor: string; // gradient ID
}

export const SKIN_COLORS = [
  { name: 'Fair', value: '#FFD1B3' },
  { name: 'Peach', value: '#FCD5B5' },
  { name: 'Warm Tan', value: '#E6A15C' },
  { name: 'Rich Brown', value: '#8A5229' },
  { name: 'Dark Cocoa', value: '#4A2A10' },
];

export const HAIR_COLORS = [
  { name: 'Midnight Black', value: '#1E293B' },
  { name: 'Chestnut Brown', value: '#582F0E' },
  { name: 'Golden Blonde', value: '#F59E0B' },
  { name: 'Sunset Red', value: '#DC2626' },
  { name: 'Cyber Purple', value: '#8B5CF6' },
  { name: 'Neon Teal', value: '#06B6D4' },
];

export const THEME_COLORS = [
  { name: 'Royal Purple', value: '#6A2FF9' },
  { name: 'Neon Rose', value: '#EC4899' },
  { name: 'Ocean Cyan', value: '#0EA5E9' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Tangerine', value: '#F97316' },
  { name: 'Dark Slate', value: '#334155' },
];

export const BG_GRADIENTS = [
  { id: 'gradPurple', name: 'Cyber Indigo', start: '#6A2FF9', end: '#EC4899' },
  { id: 'gradOcean', name: 'Aqua Surf', start: '#0EA5E9', end: '#10B981' },
  { id: 'gradSunset', name: 'Golden Hour', start: '#F97316', end: '#EF4444' },
  { id: 'gradMidnight', name: 'Cosmic Dark', start: '#1E1B4B', end: '#311042' },
  { id: 'gradMint', name: 'Tropical Mint', start: '#115E59', end: '#4ade80' },
];

/**
 * Encodes a string in base64 safely in all JavaScript runtimes including Hermes.
 */
export function base64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  const utf8Str = unescape(encodeURIComponent(str));
  for (let i = 0; i < utf8Str.length; i += 3) {
    const c1 = utf8Str.charCodeAt(i);
    const c2 = i + 1 < utf8Str.length ? utf8Str.charCodeAt(i + 1) : NaN;
    const c3 = i + 2 < utf8Str.length ? utf8Str.charCodeAt(i + 2) : NaN;
    const byte1 = c1 >> 2;
    const byte2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const byte3 = isNaN(c2) ? 64 : (((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6));
    const byte4 = isNaN(c3) ? 64 : (c3 & 63);
    output += chars.charAt(byte1) + chars.charAt(byte2) + chars.charAt(byte3) + chars.charAt(byte4);
  }
  return output;
}

/**
 * Generates full visual SVG paths for the chosen avatar components.
 */
export function generateAvatarSvg(config: AvatarConfig): string {
  const grad = BG_GRADIENTS.find((g) => g.id === config.bgColor) || BG_GRADIENTS[0];

  // Face Geometry Math
  let facePath = '';
  switch (config.faceShape) {
    case 'round':
      facePath = `<path d="M32 42 C 32 27, 68 27, 68 42 C 68 56, 50 68, 50 68 C 50 68, 32 56, 32 42 Z" fill="${config.skinColor}" />`;
      break;
    case 'square':
      facePath = `<path d="M32 38 C 32 24, 68 24, 68 38 C 68 52, 61 64, 50 64 C 39 64, 32 52, 32 38 Z" fill="${config.skinColor}" />`;
      break;
    case 'heart':
      facePath = `<path d="M32 38 C 32 21, 68 21, 68 38 C 68 51, 54 66, 50 66 C 46 66, 32 51, 32 38 Z" fill="${config.skinColor}" />`;
      break;
    case 'oval':
    default:
      facePath = `<path d="M32 40 C 32 23, 68 23, 68 40 C 68 56, 57 66, 50 66 C 43 66, 32 56, 32 40 Z" fill="${config.skinColor}" />`;
      break;
  }

  // Neck Geometry
  const neckWidth = config.gender === 'male' ? 10 : 8;
  const neckX = 50 - neckWidth / 2;
  const neckPath = `<rect x="${neckX}" y="${60}" width="${neckWidth}" height="17" fill="${config.skinColor}" rx="2" />`;

  // Ears
  const earsPath = `
    <circle cx="30" cy="42" r="4.5" fill="${config.skinColor}" />
    <circle cx="30" cy="42" r="2" fill="rgba(0,0,0,0.08)" />
    <circle cx="70" cy="42" r="4.5" fill="${config.skinColor}" />
    <circle cx="70" cy="42" r="2" fill="rgba(0,0,0,0.08)" />
  `;

  // Eyebrows
  const eyebrowPath = `
    <path d="M38 35 Q 43 33 47 36" fill="none" stroke="${config.hairColor}" stroke-width="2.2" stroke-linecap="round" />
    <path d="M53 36 Q 57 33 62 35" fill="none" stroke="${config.hairColor}" stroke-width="2.2" stroke-linecap="round" />
  `;

  // Friendly Eyes
  const eyesPath = `
    <circle cx="43" cy="41" r="3.2" fill="#0F172A" />
    <circle cx="44.2" cy="39.8" r="1.1" fill="#FFFFFF" />
    <circle cx="57" cy="41" r="3.2" fill="#0F172A" />
    <circle cx="58.2" cy="39.8" r="1.1" fill="#FFFFFF" />
  `;

  // Simple Nose
  const nosePath = `<path d="M48 48 Q 50 51 52 48" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2" stroke-linecap="round" />`;

  // Happy Expression Mouth
  const mouthPath = `<path d="M43 54 Q 50 61 57 54 Z" fill="#F43F5E" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round" />`;

  // Cute Blushing Cheeks
  const blushPath = `
    <ellipse cx="36" cy="47" rx="3.5" ry="2.2" fill="#EC4899" opacity="0.25" />
    <ellipse cx="64" cy="47" rx="3.5" ry="2.2" fill="#EC4899" opacity="0.25" />
  `;

  // Hairstyles compilation
  let hairPath = '';
  if (config.gender === 'male') {
    switch (config.hairStyle) {
      case 'spiky':
        hairPath = `<path d="M29 32 L 31 19 L 36 24 L 41 15 L 47 21 L 53 14 L 59 22 L 64 16 L 68 23 L 71 32 C 73 35, 71 43, 69 45 C 67 42, 65 35, 62 35 C 50 35, 38 35, 34 35 C 31 35, 29 42, 27 41 C 25 40, 27 34, 29 32 Z" fill="${config.hairColor}" />`;
        break;
      case 'dreads':
        hairPath = `
          <!-- Left side dreadlocks -->
          <path d="M25 30 Q 22 45 23 55" fill="none" stroke="${config.hairColor}" stroke-width="4.5" stroke-linecap="round" />
          <path d="M28 28 Q 25 42 27 50" fill="none" stroke="${config.hairColor}" stroke-width="4.5" stroke-linecap="round" />
          <!-- Right side dreadlocks -->
          <path d="M75 30 Q 78 45 77 55" fill="none" stroke="${config.hairColor}" stroke-width="4.5" stroke-linecap="round" />
          <path d="M72 28 Q 75 42 73 50" fill="none" stroke="${config.hairColor}" stroke-width="4.5" stroke-linecap="round" />
          <!-- Top textured crown -->
          <path d="M30 30 C 30 16, 70 16, 70 30 C 72 32, 68 34, 65 32 C 60 35, 40 35, 35 32 Z" fill="${config.hairColor}" />
        `;
        break;
      case 'classic':
        hairPath = `<path d="M28 32 C 28 17, 72 17, 72 30 C 73 34, 71 42, 69 42 C 67 36, 62 32, 52 30 C 42 28, 33 34, 30 35 C 27 36, 28 32, 28 32 Z" fill="${config.hairColor}" />`;
        break;
      case 'bald':
      default:
        hairPath = ``;
        break;
    }
  } else {
    // Female hairstyles
    switch (config.hairStyle) {
      case 'curly':
        hairPath = `
          <!-- Massive background hair volume -->
          <path d="M22 45 C 10 35, 15 15, 50 15 C 85 15, 90 35, 78 45 C 92 65, 80 85, 74 80 C 65 72, 72 50, 70 45 C 65 32, 35 32, 30 45 C 28 50, 35 72, 26 80 C 20 85, 8 65, 22 45 Z" fill="${config.hairColor}" />
          <!-- Front small cute curls -->
          <circle cx="34" cy="24" r="5" fill="${config.hairColor}" />
          <circle cx="42" cy="21" r="5.5" fill="${config.hairColor}" />
          <circle cx="50" cy="20" r="5" fill="${config.hairColor}" />
          <circle cx="58" cy="21" r="5.5" fill="${config.hairColor}" />
          <circle cx="66" cy="24" r="5" fill="${config.hairColor}" />
        `;
        break;
      case 'ponytail':
        hairPath = `
          <!-- High ponytail background projection -->
          <path d="M68 25 C 75 15, 88 20, 85 38 C 82 50, 74 55, 70 45 Z" fill="${config.hairColor}" />
          <!-- Ponytail elastic band -->
          <ellipse cx="68" cy="26" rx="2" ry="3.5" fill="#EF4444" />
          <!-- Sleek head hair -->
          <path d="M29 34 C 29 18, 71 18, 71 30 C 72 32, 69 35, 65 33 C 58 30, 42 30, 35 33 Z" fill="${config.hairColor}" />
        `;
        break;
      case 'bob':
        hairPath = `<path d="M30 26 C 30 16, 70 16, 70 26 C 72 35, 73 55, 70 56 C 68 57, 66 42, 65 40 C 62 32, 38 32, 35 40 C 34 42, 32 57, 30 56 C 27 55, 28 35, 30 26 Z" fill="${config.hairColor}" />`;
        break;
      case 'bangs':
      default:
        hairPath = `
          <!-- Outer side strands dropping long -->
          <path d="M28 30 C 28 20, 72 20, 72 30 C 74 42, 75 66, 72 66 C 70 66, 68 55, 68 45 C 68 35, 32 35, 32 45 C 32 55, 30 66, 28 66 C 25 66, 26 42, 28 30 Z" fill="${config.hairColor}" />
          <!-- Blunt straight bangs over forehead -->
          <rect x="33" y="24" width="34" height="9" rx="1.5" fill="${config.hairColor}" />
        `;
        break;
    }
  }

  // Glasses Options
  let glassesPath = '';
  switch (config.glasses) {
    case 'classic':
      glassesPath = `
        <rect x="35" y="37" width="12" height="9" rx="2" fill="none" stroke="${config.hatColor}" stroke-width="2.2" />
        <rect x="53" y="37" width="12" height="9" rx="2" fill="none" stroke="${config.hatColor}" stroke-width="2.2" />
        <line x1="47" y1="41" x2="53" y2="41" stroke="${config.hatColor}" stroke-width="2.2" />
        <line x1="35" y1="40" x2="29" y2="42" stroke="${config.hatColor}" stroke-width="1.8" />
        <line x1="65" y1="40" x2="71" y2="42" stroke="${config.hatColor}" stroke-width="1.8" />
      `;
      break;
    case 'round':
      glassesPath = `
        <circle cx="40" cy="41" r="6" fill="none" stroke="${config.hatColor}" stroke-width="2" />
        <circle cx="60" cy="41" r="6" fill="none" stroke="${config.hatColor}" stroke-width="2" />
        <path d="M46 40 Q 50 37 54 40" fill="none" stroke="${config.hatColor}" stroke-width="2" stroke-linecap="round" />
        <line x1="34" y1="40" x2="29" y2="42" stroke="${config.hatColor}" stroke-width="1.5" />
        <line x1="66" y1="40" x2="71" y2="42" stroke="${config.hatColor}" stroke-width="1.5" />
      `;
      break;
    case 'sunglasses':
      glassesPath = `
        <rect x="34" y="36" width="14" height="10" rx="3" fill="#1E293B" stroke="${config.hatColor}" stroke-width="1.5" />
        <ellipse cx="40" cy="40" rx="2" ry="3" fill="#FFFFFF" opacity="0.25" />
        <rect x="52" y="36" width="14" height="10" rx="3" fill="#1E293B" stroke="${config.hatColor}" stroke-width="1.5" />
        <ellipse cx="58" cy="40" rx="2" ry="3" fill="#FFFFFF" opacity="0.25" />
        <line x1="48" y1="39" x2="52" y2="39" stroke="${config.hatColor}" stroke-width="2.5" />
        <line x1="34" y1="39" x2="29" y2="41" stroke="${config.hatColor}" stroke-width="2" />
        <line x1="66" y1="39" x2="71" y2="41" stroke="${config.hatColor}" stroke-width="2" />
      `;
      break;
    case 'none':
    default:
      break;
  }

  // Hats Options
  let hatPath = '';
  switch (config.hat) {
    case 'cap':
      hatPath = `
        <!-- Cap dome -->
        <path d="M30 29 C 30 12, 70 12, 70 29 Z" fill="${config.hatColor}" />
        <!-- Front logo badge -->
        <circle cx="50" cy="20" r="3.5" fill="#FFFFFF" />
        <path d="M49 20 L 51 20 M 50 19 L 50 21" stroke="#6A2FF9" stroke-width="1" />
        <!-- Cap Visor/Brim -->
        <path d="M68 28 C 76 28, 80 33, 72 36 C 66 38, 56 32, 56 32" fill="${config.hatColor}" opacity="0.95" />
      `;
      break;
    case 'beanie':
      hatPath = `
        <!-- Main folded beanie body -->
        <path d="M31 29 C 31 10, 69 10, 69 29 C 69 31, 31 31, 31 29 Z" fill="${config.hatColor}" />
        <!-- Folded brim rim -->
        <rect x="29" y="27" width="42" height="6.5" rx="3.2" fill="${config.hatColor}" stroke="rgba(255,255,255,0.18)" stroke-width="1.2" />
        <!-- Cute top pom-pom -->
        <circle cx="50" cy="9" r="4.2" fill="${config.hatColor}" stroke="rgba(0,0,0,0.1)" stroke-width="1" />
      `;
      break;
    case 'cowboy':
      hatPath = `
        <!-- Cowboy crown -->
        <path d="M33 21 C 36 12, 42 16, 50 14 C 58 16, 64 12, 67 21 Z" fill="${config.hatColor}" />
        <!-- Cowboy ribbon decoration -->
        <path d="M33 20 C 40 22, 60 22, 67 20 L 67 22 C 60 24, 40 24, 33 22 Z" fill="#EF4444" />
        <!-- Massive curved brim -->
        <path d="M21 21 Q 50 29 79 21 C 82 25, 75 27, 72 26 C 60 29, 40 29, 28 26 C 25 27, 18 25, 21 21 Z" fill="${config.hatColor}" />
      `;
      break;
    case 'none':
    default:
      break;
  }

  // Shirt/Clothing & Crew-neck collar
  const shirtPath = `
    <path d="M22 84 C 22 72, 78 72, 78 84 L 78 100 L 22 100 Z" fill="${config.shirtColor}" />
    <path d="M43 78 Q 50 84 57 78" fill="none" stroke="${config.skinColor}" stroke-width="2.5" stroke-linecap="round" />
  `;

  // Assemble full SVG Document with linear gradients
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad.start}" />
          <stop offset="100%" stop-color="${grad.end}" />
        </linearGradient>
      </defs>
      <!-- Vibrant Gradient Background -->
      <rect width="100" height="100" rx="50" fill="url(#bgGrad)" />
      
      <!-- Stacking Layers -->
      ${neckPath}
      ${shirtPath}
      ${earsPath}
      ${facePath}
      ${blushPath}
      ${eyebrowPath}
      ${eyesPath}
      ${nosePath}
      ${mouthPath}
      ${hairPath}
      ${glassesPath}
      ${hatPath}
    </svg>
  `.trim();

  return svg;
}

/**
 * Compiles a configuration object into a ready-to-render Base64 Data URI.
 */
export function generateAvatarDataUri(config: AvatarConfig): string {
  const svg = generateAvatarSvg(config);
  return `data:image/svg+xml;base64,${base64Encode(svg)}`;
}
