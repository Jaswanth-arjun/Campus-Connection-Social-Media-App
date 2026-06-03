/**
 * Professional DiceBear Cartoon Avatar Engine for Campus Connect.
 * Generates stunning, high-fidelity character avatars in multiple styles.
 */

export interface DiceBearConfig {
  style: 'adventurer' | 'avataaars' | 'lorelei' | 'open-peeps' | 'micah' | 'toon-head' | 'big-ears';
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

// 4. Open Peeps Curated Options (Notion / Hand-Drawn Indie Cartoon Style)
export const OPEN_PEEPS_OPTIONS = {
  skinColors: [
    { name: 'Pale', value: 'ffdbb4' },
    { name: 'Light', value: 'edb98a' },
    { name: 'Tan', value: 'd08b5b' },
    { name: 'Brown', value: 'ae5d29' },
    { name: 'Espresso', value: '694d3d' },
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
    { id: 'short1', name: 'Messy Crop' },
    { id: 'short3', name: 'Curved Part' },
    { id: 'flatTop', name: 'Modern Flat Top' },
    { id: 'mohawk', name: 'Punk Mohawk' },
    { id: 'shaved1', name: 'Sides Shaved' },
    { id: 'hatBeanie', name: 'Cool Beanie' },
  ],
  femaleHair: [
    { id: 'long', name: 'Classic Long' },
    { id: 'longBangs', name: 'Long with Bangs' },
    { id: 'longCurly', name: 'Curly Waves' },
    { id: 'mediumBangs', name: 'Shoulder Bob' },
    { id: 'bun', name: 'Messy Top Bun' },
    { id: 'buns', name: 'Cute Double Buns' },
  ],
  eyes: [
    { id: 'smile', name: 'Content Smile' },
    { id: 'smileBig', name: 'Big Joy' },
    { id: 'smileTeethGap', name: 'Playful Teeth' },
    { id: 'cheeky', name: 'Sassy Cheeky' },
    { id: 'calm', name: 'Calm Relaxed' },
    { id: 'serious', name: 'Serious Calm' },
    { id: 'concerned', name: 'Curious Concerned' },
    { id: 'lovingGrin1', name: 'Heart Eyes' },
  ],
  glasses: [
    { id: 'none', name: 'No Glasses' },
    { id: 'glasses', name: 'Round Glasses' },
    { id: 'glasses2', name: 'Retro Frame' },
    { id: 'glasses3', name: 'Cat-eye Style' },
    { id: 'glasses4', name: 'Thick Circular' },
    { id: 'sunglasses', name: 'Classic Sunglasses' },
    { id: 'sunglasses2', name: 'Cool Aviators' },
    { id: 'eyepatch', name: 'Pirate Eyepatch' },
  ]
};

// 5. Micah Curated Options (Aesthetic Hand-Drawn Geometric Face Art)
export const MICAH_OPTIONS = {
  skinColors: [
    { name: 'Peach', value: 'f9c9b6' },
    { name: 'Clay', value: 'ac6651' },
    { name: 'Terracotta', value: '77311d' },
  ],
  hair: [
    { id: 'fonze', name: 'The Pompadour' },
    { id: 'mrT', name: 'Stylish Mohawk' },
    { id: 'dougFunny', name: 'Classic Part' },
    { id: 'mrClean', name: 'Bald/Clean' },
    { id: 'dannyPhantom', name: 'Anime Shag' },
    { id: 'full', name: 'Voluminous Curly' },
    { id: 'turban', name: 'Elegant Turban' },
    { id: 'pixie', name: 'Chic Pixie' },
  ],
  hairColors: [
    { name: 'Jet Black', value: '000000' },
    { name: 'Clay Brown', value: 'ac6651' },
    { name: 'Golden Apricot', value: 'f4d150' },
    { name: 'Lavender Blush', value: 'e0ddff' },
    { name: 'Sky Mint', value: 'd2eff3' },
    { name: 'Cosmic Violet', value: '9287ff' },
  ],
  eyes: [
    { id: 'eyes', name: 'Default Look' },
    { id: 'round', name: 'Intense Round' },
    { id: 'eyesShadow', name: 'Muted Shadow' },
    { id: 'smiling', name: 'Sweet Smile' },
    { id: 'smilingShadow', name: 'Charming Wink' },
  ],
  mouths: [
    { id: 'smile', name: 'Warm Smile' },
    { id: 'laughing', name: 'Loud Laugh' },
    { id: 'nervous', name: 'Nervous Sweat' },
    { id: 'sad', name: 'Melancholy' },
    { id: 'smirk', name: 'Cocky Smirk' },
    { id: 'surprised', name: 'Gasping Shock' },
  ],
  glasses: [
    { id: 'none', name: 'No Glasses' },
    { id: 'round', name: 'Retro Circle' },
    { id: 'square', name: 'Bold Square' },
  ]
};

// 6. Toon Head Curated Options (Johan Melin Animated Series Style - DiceBear v9+)
export const TOON_HEAD_OPTIONS = {
  skinColors: [
    { name: 'Peach', value: 'f1c3a5' },
    { name: 'Warm Beige', value: 'c68e7a' },
    { name: 'Tanned', value: 'b98e6a' },
    { name: 'Bronze', value: 'a36b4f' },
    { name: 'Espresso', value: '5c3829' },
  ],
  hairColors: [
    { name: 'Black', value: '2c1b18' },
    { name: 'Auburn', value: 'a55728' },
    { name: 'Bronze Gold', value: 'b58143' },
    { name: 'Golden Blonde', value: 'd6b370' },
    { name: 'Warm Brown', value: '724133' },
  ],
  maleHair: [
    { id: 'sideComed', name: 'Side Combed' },
    { id: 'undercut', name: 'Undercut Fade' },
    { id: 'spiky', name: 'Spiky Punk' },
  ],
  femaleHair: [
    { id: 'bun', name: 'Top Bun' },
    { id: 'sideComed', name: 'Side Combed' },
  ],
  eyes: [
    { id: 'happy', name: 'Happy Arc' },
    { id: 'wide', name: 'Wide Open' },
    { id: 'bow', name: 'Gentle Arc' },
    { id: 'humble', name: 'Soft Look' },
    { id: 'wink', name: 'Playful Wink' },
  ],
  eyebrows: [
    { id: 'neutral', name: 'Neutral' },
    { id: 'raised', name: 'Excited Raised' },
    { id: 'happy', name: 'Happy Curve' },
    { id: 'angry', name: 'Angry Flat' },
    { id: 'sad', name: 'Sad Angle' },
  ],
  mouths: [
    { id: 'smile', name: 'Gentle Smile' },
    { id: 'laugh', name: 'Loud Laugh' },
    { id: 'agape', name: 'Agape Surprise' },
    { id: 'sad', name: 'Slight Frown' },
    { id: 'angry', name: 'Angry Line' },
  ],
  clothes: [
    { id: 'tShirt', name: 'Casual T-Shirt' },
    { id: 'shirt', name: 'Buttoned Shirt' },
    { id: 'openJacket', name: 'Open Jacket' },
    { id: 'turtleNeck', name: 'Turtle Neck' },
    { id: 'dress', name: 'Elegant Dress' },
  ],
  clothesColors: [
    { name: 'Royal Indigo', value: '0b3286' },
    { name: 'Crimson Red', value: 'b11f1f' },
    { name: 'Forest Green', value: '147f3c' },
    { name: 'Amber Gold', value: 'eab308' },
    { name: 'Dark Slate', value: '151613' },
  ]
};

// 7. Big Ears Curated Options (Playful Cartoon Face Style - DiceBear v9+)
export const BIG_EARS_OPTIONS = {
  skinColors: [
    { name: 'Peach', value: 'f8b788' },
    { name: 'Warm Beige', value: 'da9969' },
    { name: 'Tanned', value: 'c07f50' },
    { name: 'Bronze', value: 'a66637' },
    { name: 'Espresso', value: '89532c' },
  ],
  hairColors: [
    { name: 'Midnight Black', value: '2c1b18' },
    { name: 'Chestnut Brown', value: '724133' },
    { name: 'Deep Auburn', value: 'a55728' },
    { name: 'Golden Blonde', value: 'd6b370' },
    { name: 'Pastel Pink', value: 'f59797' },
  ],
  maleHair: [
    { id: 'short01', name: 'Side Part' },
    { id: 'short03', name: 'Spiky Top' },
    { id: 'short05', name: 'Buzzcut' },
    { id: 'short08', name: 'Messy Shag' },
    { id: 'short12', name: 'Curly Top' },
  ],
  femaleHair: [
    { id: 'long01', name: 'Sleek Long' },
    { id: 'long05', name: 'Long Waves' },
    { id: 'long10', name: 'Cute Ponytail' },
    { id: 'long12', name: 'Bob Cut' },
    { id: 'long18', name: 'Double Buns' },
  ],
  eyes: [
    { id: 'variant01', name: 'Happy Blink' },
    { id: 'variant05', name: 'Round Open' },
    { id: 'variant08', name: 'Anime Sparkle' },
    { id: 'variant12', name: 'Playful Wink' },
    { id: 'variant18', name: 'Curious Arc' },
    { id: 'variant25', name: 'Muted Sleepy' },
  ],
  mouths: [
    { id: 'variant0101', name: 'Warm Smile' },
    { id: 'variant0301', name: 'Wide Laugh' },
    { id: 'variant0401', name: 'Sassy Smirk' },
    { id: 'variant0501', name: 'Teeth Smile' },
    { id: 'variant0701', name: 'Open Grin' },
  ],
};

/**
 * Returns a valid starting configuration matching the required schema values for a specific style.
 */
export function getDefaultConfigForStyle(
  style: 'adventurer' | 'avataaars' | 'lorelei' | 'open-peeps' | 'micah' | 'toon-head' | 'big-ears',
  gender: 'male' | 'female'
): DiceBearConfig {
  if (style === 'adventurer') {
    return {
      style,
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
      style,
      gender,
      hair: gender === 'male' ? 'shortRound' : 'bob',
      hairColor: '2c1b18',
      skinColor: 'ffdbb4',
      eyes: 'default',
      eyebrows: 'default',
      mouth: 'default',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5',
    };
  } else if (style === 'open-peeps') {
    return {
      style,
      gender,
      hair: gender === 'male' ? 'short1' : 'long',
      hairColor: '2c1b18',
      skinColor: 'ffdbb4',
      eyes: 'smile',
      eyebrows: 'variant01',
      mouth: 'smile',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: 'ea580c',
    };
  } else if (style === 'micah') {
    return {
      style,
      gender,
      hair: 'fonze',
      hairColor: '000000',
      skinColor: 'f9c9b6',
      eyes: 'eyes',
      eyebrows: 'variant01',
      mouth: 'smile',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5',
    };
  } else if (style === 'toon-head') {
    return {
      style,
      gender,
      hair: 'sideComed',
      hairColor: '2c1b18',
      skinColor: 'f1c3a5',
      eyes: 'happy',
      eyebrows: 'neutral',
      mouth: 'smile',
      glasses: 'tShirt', // Toon Head uses glasses to store the clothes style parameter
      bgColor: 'c0aede',
      shirtColor: '0b3286', // Toon Head uses shirtColor to store clothes color hex parameter
    };
  } else if (style === 'big-ears') {
    return {
      style,
      gender,
      hair: gender === 'male' ? 'short01' : 'long01',
      hairColor: '2c1b18',
      skinColor: 'f8b788',
      eyes: 'variant01',
      eyebrows: 'variant01',
      mouth: 'variant0101',
      glasses: 'none',
      bgColor: 'c0aede',
      shirtColor: '4f46e5',
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
  // Use DiceBear 9.x API for maximum capability and style support (including toon-head and big-ears)
  const base = `https://api.dicebear.com/9.x/${config.style}/png`;
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
  } else if (config.style === 'open-peeps') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`head=${config.hair}`);
    params.push(`headContrastColor=${config.hairColor}`);
    params.push(`face=${config.eyes}`);
    if (config.glasses !== 'none') {
      params.push(`accessories=${config.glasses}`);
      params.push(`accessoriesProbability=100`);
    } else {
      params.push(`accessoriesProbability=0`);
    }
    params.push(`backgroundColor=${config.bgColor}`);
    params.push(`clothingColor=${config.shirtColor}`);
  } else if (config.style === 'micah') {
    params.push(`baseColor=${config.skinColor}`);
    params.push(`hair=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`eyes=${config.eyes}`);
    params.push(`mouth=${config.mouth}`);
    if (config.glasses !== 'none') {
      params.push(`glasses=${config.glasses}`);
      params.push(`glassesProbability=100`);
    } else {
      params.push(`glassesProbability=0`);
    }
    params.push(`backgroundColor=${config.bgColor}`);
    params.push(`shirtColor=${config.shirtColor}`);
  } else if (config.style === 'toon-head') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`hair=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`eyes=${config.eyes}`);
    params.push(`eyebrows=${config.eyebrows}`);
    params.push(`mouth=${config.mouth}`);
    params.push(`clothes=${config.glasses}`); // map glasses property (stores clothes style e.g. tShirt)
    params.push(`clothesColor=${config.shirtColor}`); // map shirtColor property (stores clothesColor hex)
    params.push(`backgroundColor=${config.bgColor}`);
    params.push(`rearHairProbability=${config.gender === 'female' ? '100' : '0'}`);
  } else if (config.style === 'big-ears') {
    params.push(`skinColor=${config.skinColor}`);
    params.push(`hair=${config.hair}`);
    params.push(`hairColor=${config.hairColor}`);
    params.push(`eyes=${config.eyes}`);
    params.push(`mouth=${config.mouth}`);
    params.push(`backgroundColor=${config.bgColor}`);
  }

  return `${base}?${params.join('&')}`;
}

/**
 * Fetches the PNG binary from DiceBear and returns it compiled as a base64 Data URI.
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
