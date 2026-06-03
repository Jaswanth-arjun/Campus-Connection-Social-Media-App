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
    { name: 'Midnight Black', value: '0e0e0e' },
    { name: 'Chestnut Brown', value: '6a4e35' },
    { name: 'Golden Blonde', value: 'b9a05f' },
    { name: 'Sunset Red', value: 'ab2a18' },
    { name: 'Cyber Purple', value: '592454' },
    { name: 'Neon Teal', value: '85c2c6' },
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
    { id: 'variant01', name: 'Friendly' },
    { id: 'variant02', name: 'Starry Happy' },
    { id: 'variant03', name: 'Playful Wink' },
    { id: 'variant04', name: 'Wacky Wink' },
    { id: 'variant05', name: 'Laughing XD' },
    { id: 'variant06', name: 'Cool Roll' },
  ],
  eyebrows: [
    { id: 'variant01', name: 'Normal' },
    { id: 'variant02', name: 'Soft Curve' },
    { id: 'variant03', name: 'Bold Flat' },
    { id: 'variant04', name: 'Curious' },
  ],
  mouths: [
    { id: 'variant01', name: 'Gentle Smile' },
    { id: 'variant02', name: 'Happy Laugh' },
    { id: 'variant03', name: 'Big Grin' },
    { id: 'variant04', name: 'Sassy Smirk' },
    { id: 'variant05', name: 'Silly Tongue' },
    { id: 'variant06', name: 'Carefree Open' },
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
    { name: 'Pale', value: 'ffdbb4' },
    { name: 'Light', value: 'edb98a' },
    { name: 'Tanned', value: 'fd9841' },
    { name: 'Brown', value: 'd08b5b' },
    { name: 'Dark Brown', value: 'ae5d29' },
    { name: 'Black', value: '614335' },
  ],
  hairColors: [
    { name: 'Black', value: '2c1b18' },
    { name: 'Auburn', value: 'a55728' },
    { name: 'Blonde', value: 'd6b370' },
    { name: 'Brown', value: '724133' },
    { name: 'Red', value: 'c93305' },
    { name: 'Silver Gray', value: 'e8e1e1' },
  ],
  maleHair: [
    { id: 'shortRound', name: 'Short Crop' },
    { id: 'shortCurly', name: 'Short Curly' },
    { id: 'shortFlat', name: 'Short Flat' },
    { id: 'sides', name: 'Undercut Fade' },
    { id: 'dreads01', name: 'Textured Dreads' },
  ],
  femaleHair: [
    { id: 'bob', name: 'Classic Bob' },
    { id: 'bigHair', name: 'Voluminous Locks' },
    { id: 'curly', name: 'Curly Wave' },
    { id: 'straight01', name: 'Sleek Straight' },
    { id: 'bun', name: 'High Top Bun' },
  ],
  eyes: [
    { id: 'default', name: 'Regular' },
    { id: 'happy', name: 'Happy Arc' },
    { id: 'wink', name: 'Friendly Wink' },
    { id: 'surprised', name: 'Shocked' },
  ],
  mouths: [
    { id: 'default', name: 'Happy Open' },
    { id: 'smile', name: 'Warm Smile' },
    { id: 'serious', name: 'Calm Serious' },
    { id: 'twinkle', name: 'Cheerful Grin' },
  ],
  glasses: [
    { id: 'none', name: 'No Glasses' },
    { id: 'kurt', name: 'Grunge Shades' },
    { id: 'prescription01', name: 'Classic Frame' },
    { id: 'round', name: 'Hipster Circle' },
    { id: 'sunglasses', name: 'Cool Aviators' },
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
    { id: 'variant01', name: 'Aesthetic Bangs' },
    { id: 'variant02', name: 'Anime Spikes' },
    { id: 'variant03', name: 'Taper Fade' },
    { id: 'variant04', name: 'Long Wave' },
    { id: 'variant05', name: 'Twin Tails' },
    { id: 'variant06', name: 'Messy Bun' },
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
 * Returns a valid starting configuration matching the required schema values for a specific style.
 */
export function getDefaultConfigForStyle(style: 'adventurer' | 'avataaars' | 'lorelei', gender: 'male' | 'female'): DiceBearConfig {
  if (style === 'adventurer') {
    return {
      style: 'adventurer',
      gender,
      hair: gender === 'male' ? 'short01' : 'long01',
      hairColor: '0e0e0e',
      skinColor: 'f5c0b1',
      eyes: 'variant01',
      eyebrows: 'variant01',
      mouth: 'variant01',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5',
    };
  } else if (style === 'avataaars') {
    return {
      style: 'avataaars',
      gender,
      hair: gender === 'male' ? 'shortRound' : 'bob',
      hairColor: '2c1b18',
      skinColor: 'ffdbb4',
      eyes: 'default',
      eyebrows: 'default',
      mouth: 'default',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5', // not used by avataaars in URL, but kept for interface consistency
    };
  } else {
    // lorelei
    return {
      style: 'lorelei',
      gender,
      hair: 'variant01',
      hairColor: '2c3e50',
      skinColor: 'ffdbac',
      eyes: 'variant01',
      eyebrows: 'variant01',
      mouth: 'variant01',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5',
    };
  }
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
      params.push(`glasses=${config.glasses}`);
      params.push(`glassesProbability=100`);
    } else {
      params.push(`glassesProbability=0`);
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
      params.push(`accessoriesProbability=100`);
    } else {
      params.push(`accessoriesProbability=0`);
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
