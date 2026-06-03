/**
 * Professional DiceBear Cartoon Avatar Engine for Campus Connect.
 * Generates stunning, high-fidelity Disney/Snapchat/Instagram style character avatars.
 */

export interface DiceBearConfig {
  style: 'adventurer' | 'avataaars' | 'lorelei';
  gender: 'male' | 'female';
  hair: string;
  hairColor: string;
  skinColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  glasses: string;
  bgColor: string;
  shirtColor: string;
}

// 1. Adventurer Curated Options (Snapchat Cartoon Style)
export const ADVENTURER_OPTIONS = {
  skinColors: [
    { name: 'Fair', value: 'f5c0b1' },
    { name: 'Peach', value: 'ecad9a' },
    { name: 'Tan', value: 'cf8d73' },
    { name: 'Warm Brown', value: 'b16a50' },
    { name: 'Dark Cocoa', value: '824831' },
    { name: 'Rich Charcoal', value: '542a18' },
  ],
  hairColors: [
    { name: 'Midnight Black', value: '09090b' },
    { name: 'Chestnut Brown', value: '4e2406' },
    { name: 'Golden Blonde', value: 'b45309' },
    { name: 'Sunset Red', value: 'b91c1c' },
    { name: 'Cyber Purple', value: '6d28d9' },
    { name: 'Neon Teal', value: '0891b2' },
  ],
  maleHair: [
    { id: 'short01', name: 'Classic Crop' },
    { id: 'short02', name: 'Wavy Side Sweep' },
    { id: 'short03', name: 'Cool Buzzcut' },
    { id: 'short04', name: 'Spiky Fade' },
    { id: 'short05', name: 'Curly Top' },
    { id: 'short06', name: 'Hipster Dreadlocks' },
  ],
  femaleHair: [
    { id: 'long01', name: 'Straight Bangs' },
    { id: 'long02', name: 'Long Wave' },
    { id: 'long03', name: 'Cute Ponytail' },
    { id: 'long04', name: 'Aesthetic Bob' },
    { id: 'long05', name: 'Curly Afro' },
    { id: 'long06', name: 'Braided Locks' },
  ],
  eyes: [
    { id: 'default', name: 'Friendly' },
    { id: 'happy', name: 'Starry Happy' },
    { id: 'wink', name: 'Playful Wink' },
    { id: 'winkWacky', name: 'Wacky Wink' },
    { id: 'xd', name: 'Laughing XD' },
    { id: 'eyeRoll', name: 'Cool Roll' },
  ],
  eyebrows: [
    { id: 'default', name: 'Normal' },
    { id: 'defaultNatural', name: 'Soft Curve' },
    { id: 'flatNatural', name: 'Bold Flat' },
    { id: 'raisedExcited', name: 'Curious' },
  ],
  mouths: [
    { id: 'smile', name: 'Gentle Smile' },
    { id: 'happy', name: 'Happy Laugh' },
    { id: 'grin', name: 'Big Grin' },
    { id: 'smirk', name: 'Sassy Smirk' },
    { id: 'tongueOut', name: 'Silly Tongue' },
    { id: 'carefree', name: 'Carefree Open' },
  ],
  glasses: [
    { id: 'none', name: 'No Glasses' },
    { id: 'variant01', name: 'Sleek Aviators' },
    { id: 'variant02', name: 'Circular Hipster' },
    { id: 'variant03', name: 'Retro Rectangular' },
    { id: 'variant04', name: 'Sporty Shades' },
  ],
  bgColors: [
    { id: 'c0aede', name: 'Soft Lavender' },
    { id: 'b1e5d9', name: 'Mint Breeze' },
    { id: 'ffd5b8', name: 'Warm Peach' },
    { id: 'ffb8d1', name: 'Blush Pink' },
    { id: 'b8e1ff', name: 'Sky Blue' },
    { id: '0f172a', name: 'Cosmic Slate' },
  ],
  shirtColors: [
    { name: 'Royal Indigo', value: '4f46e5' },
    { name: 'Crimson Rose', value: 'db2777' },
    { name: 'Emerald Forest', value: '059669' },
    { name: 'Cyber Orange', value: 'ea580c' },
    { name: 'Modern Charcoal', value: '374151' },
  ]
};

// 2. Avataaars Curated Options (Instagram / Facebook Flat Style)
export const AVATAAARS_OPTIONS = {
  skinColors: [
    { name: 'Pale', value: 'Pale' },
    { name: 'Light', value: 'Light' },
    { name: 'Tanned', value: 'Tanned' },
    { name: 'Brown', value: 'Brown' },
    { name: 'Dark Brown', value: 'DarkBrown' },
    { name: 'Black', value: 'Black' },
  ],
  hairColors: [
    { name: 'Black', value: 'Black' },
    { name: 'Auburn', value: 'Auburn' },
    { name: 'Blonde', value: 'Blonde' },
    { name: 'Brown', value: 'Brown' },
    { name: 'Red', value: 'Red' },
    { name: 'Silver Gray', value: 'SilverGray' },
  ],
  maleHair: [
    { id: 'ShortHairShortCurly', name: 'Short Curly' },
    { id: 'ShortHairShortFlat', name: 'Short Flat' },
    { id: 'ShortHairShortRound', name: 'Short Crop' },
    { id: 'ShortHairSides', name: 'Undercut Fade' },
    { id: 'ShortHairDreads01', name: 'Textured Dreads' },
  ],
  femaleHair: [
    { id: 'LongHairBigHair', name: 'Voluminous Locks' },
    { id: 'LongHairBob', name: 'Classic Bob' },
    { id: 'LongHairCurly', name: 'Curly Wave' },
    { id: 'LongHairStraight', name: 'Sleek Straight' },
    { id: 'LongHairBun', name: 'High Top Bun' },
  ],
  eyes: [
    { id: 'Default', name: 'Regular' },
    { id: 'Happy', name: 'Happy Arc' },
    { id: 'Wink', name: 'Friendly Wink' },
    { id: 'Surprised', name: 'Shocked' },
  ],
  mouths: [
    { id: 'Smile', name: 'Warm Smile' },
    { id: 'Default', name: 'Happy Open' },
    { id: 'Grin', name: 'Cheerful Grin' },
    { id: 'Serious', name: 'Calm Serious' },
  ],
  glasses: [
    { id: 'none', name: 'No Glasses' },
    { id: 'Kurt', name: 'Grunge Shades' },
    { id: 'Prescription01', name: 'Classic Frame' },
    { id: 'Round', name: 'Hipster Circle' },
    { id: 'Sunglasses', name: 'Cool Aviators' },
  ],
};

// 3. Lorelei Curated Options (Cute Kawaii Anime Style)
export const LORELEI_OPTIONS = {
  skinColors: [
    { name: 'Porcelain', value: 'ffdbac' },
    { name: 'Warm Sand', value: 'f1c27d' },
    { name: 'Tan', value: 'e0ac69' },
    { name: 'Bronze', value: 'c68642' },
  ],
  hair: [
    { id: 'hair01', name: 'Aesthetic Bangs' },
    { id: 'hair02', name: 'Anime Spikes' },
    { id: 'hair03', name: 'Taper Fade' },
    { id: 'hair04', name: 'Long Wave' },
    { id: 'hair05', name: 'Twin Tails' },
    { id: 'hair06', name: 'Messy Bun' },
  ],
  hairColors: [
    { name: 'Jet Black', value: '2c3e50' },
    { name: 'Light Blonde', value: 'f1c40f' },
    { name: 'Pastel Pink', value: 'e84393' },
    { name: 'Ocean Teal', value: '00cec9' },
    { name: 'Warm Brown', value: 'd35400' },
  ],
};

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
 * Builds a customizable DiceBear API endpoint URL with specific query parameters.
 */
export function getDiceBearUrl(config: DiceBearConfig): string {
  const base = `https://api.dicebear.com/7.x/${config.style}/png`;
  const params: string[] = [];

  // Seed randomized base name to keep unique styling
  params.push(`seed=${config.gender === 'male' ? 'John' : 'Sara'}`);

  if (config.style === 'adventurer') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`hair=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`eyes=${config.eyes}`);
    params.push(`eyebrows=${config.eyebrows}`);
    params.push(`mouth=${config.mouth}`);
    if (config.glasses !== 'none') {
      params.push(`features=${config.glasses}`);
    }
    params.push(`backgroundColor=${config.bgColor}`);
    params.push(`clothingColor=${config.shirtColor}`);
  } else if (config.style === 'avataaars') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`top=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`eyes=${config.eyes}`);
    params.push(`mouth=${config.mouth}`);
    if (config.glasses !== 'none') {
      params.push(`accessories=${config.glasses}`);
    }
    params.push(`backgroundColor=${config.bgColor}`);
  } else if (config.style === 'lorelei') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`hair=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`backgroundColor=${config.bgColor}`);
  }

  return `${base}?${params.join('&')}`;
}

/**
 * Fetches the PNG binary from DiceBear and returns it compiled as a high-performance offline base64 Data URI.
 */
export async function compileDiceBearAvatar(config: DiceBearConfig): Promise<string> {
  const url = getDiceBearUrl(config);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch avatar from DiceBear server');
    
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read binary PNG blob'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error compiling DiceBear PNG, returning fallback URL', error);
    return url;
  }
}
