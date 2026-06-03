/**
 * Snap Camera Kit SDK Configuration and Credentials
 * 
 * To use the Snap Camera Kit SDK in a production mobile app (iOS/Android):
 * 1. Register your app on the Snapchat Developer Portal (https://docs.snap.com/camera-kit)
 * 2. Obtain your Client ID, API Token, and create a Lens Group.
 * 3. Add your custom or licensed lenses to the Lens Group.
 * 4. Replace the placeholder credentials below with your active Snap credentials.
 */

export const SNAP_CAMERA_KIT_CONFIG = {
  // Snapchat Developer Platform Client ID
  clientId: "6a059d40-5df6-49c6-9548-95e2c3567aa7",

  // Camera Kit API / Client Token used for authenticating with Snap's CDN and services
  apiToken: "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzgwNDA0MDczLCJzdWIiOiI5OTViZjZkYi0yZWRlLTRhMmUtYjAyZi03ZjJlOWJkMzRiOGV-U1RBR0lOR35mNjJmMDE3NS00MTZlLTQ4NDUtODJlOC02ZmVkNmM5MTgyMmMifQ.SWqL9lCHsH3uf0Nf03G5S5sEfEy_L7Y001b23NGDnFc",

  // Lens Group ID containing public or custom lenses configured in the Snap Console
  lensGroupId: "10829622-5ed8-417a-87c6-8294c4b1c8b9",

  // Optional: Endpoint for dynamic token rotation/validation
  apiTokenUrl: "",

  // Environment mode: "sandbox", "staging", or "production"
  environment: "sandbox",
};

/**
 * Filter Categories definition
 */
export type FilterCategory =
  | 'basic'
  | 'beauty'
  | 'fun_face'
  | 'ar_effect'
  | 'background'
  | 'creative'
  | 'text_sticker';

/**
 * Filter Metadata structure
 */
export interface FilterMetadata {
  id: string;
  name: string;
  category: FilterCategory;
  icon: string; // Ionicons or Emoji representation
  lensId?: string; // Snap Camera Kit Lens ID (used when SDK is fully bound)
  fallbackType: 'color_gel' | 'beauty_glow' | 'ar_sticker' | 'particle_effect' | 'background_frame' | 'creative_fx' | 'sticker_tool';
  // Fallback visual properties
  overlayColor?: string; // For color gels
  brightness?: number; // For beauty/color adjustments
  contrast?: number;
  saturation?: number;
  stickerEmoji?: string; // For emoji face overlays
  stickerPath?: string; // For PNG fallback graphic overlays
  particles?: 'hearts' | 'stars' | 'sparkles' | 'fire' | 'snow' | 'rain' | 'confetti';
  frameImage?: string; // For background frames
  fxStyle?: 'glitch' | 'vhs' | 'retro' | 'cyberpunk' | 'neon' | 'sketch' | 'pixel' | 'mirror' | 'kaleidoscope';
}

/**
 * 📸 Extensive list of Snap Lenses & fallback MVP filters across all categories.
 * This makes it incredibly easy to add, remove, or modify lenses later.
 */
export const CAMERA_FILTERS: FilterMetadata[] = [
  // ==========================================
  // BASIC FILTERS
  // ==========================================
  { id: 'normal', name: 'Normal', category: 'basic', icon: 'camera-outline', fallbackType: 'color_gel', overlayColor: 'transparent' },
  { id: 'bright', name: 'Bright', category: 'basic', icon: 'sunny-outline', fallbackType: 'color_gel', overlayColor: 'rgba(255, 255, 255, 0.12)', brightness: 1.2 },
  { id: 'contrast', name: 'Contrast', category: 'basic', icon: 'contrast-outline', fallbackType: 'color_gel', overlayColor: 'rgba(0, 0, 0, 0.08)', contrast: 1.3 },
  { id: 'warm', name: 'Warm', category: 'basic', icon: 'flame-outline', fallbackType: 'color_gel', overlayColor: 'rgba(255, 140, 0, 0.15)', lensId: 'snap_lens_warm_gold_101' },
  { id: 'cool', name: 'Cool', category: 'basic', icon: 'snow-outline', fallbackType: 'color_gel', overlayColor: 'rgba(0, 191, 255, 0.15)', lensId: 'snap_lens_ice_cool_102' },
  { id: 'b_w', name: 'Black & White', category: 'basic', icon: 'color-palette-outline', fallbackType: 'color_gel', overlayColor: 'rgba(100, 100, 100, 0.35)', saturation: 0, lensId: 'snap_lens_mono_103' },
  { id: 'sepia', name: 'Sepia', category: 'basic', icon: 'leaf-outline', fallbackType: 'color_gel', overlayColor: 'rgba(112, 66, 20, 0.25)' },
  { id: 'vintage', name: 'Vintage', category: 'basic', icon: 'hourglass-outline', fallbackType: 'color_gel', overlayColor: 'rgba(139, 69, 19, 0.22)', lensId: 'snap_lens_vintage_104' },
  { id: 'film', name: 'Film', category: 'basic', icon: 'film-outline', fallbackType: 'color_gel', overlayColor: 'rgba(80, 50, 120, 0.15)' },
  { id: 'fade', name: 'Fade', category: 'basic', icon: 'git-commit-outline', fallbackType: 'color_gel', overlayColor: 'rgba(255, 255, 255, 0.25)', contrast: 0.8 },
  { id: 'matte', name: 'Matte', category: 'basic', icon: 'square-outline', fallbackType: 'color_gel', overlayColor: 'rgba(240, 240, 240, 0.15)', saturation: 0.7 },
  { id: 'cinematic', name: 'Cinematic', category: 'basic', icon: 'videocam-outline', fallbackType: 'color_gel', overlayColor: 'rgba(20, 30, 48, 0.18)', lensId: 'snap_lens_cinema_105' },
  { id: 'golden_hour', name: 'Golden Hour', category: 'basic', icon: 'sunny', fallbackType: 'color_gel', overlayColor: 'rgba(255, 179, 71, 0.25)', lensId: 'snap_lens_golden_106' },
  { id: 'night_mode', name: 'Night Mode', category: 'basic', icon: 'moon-outline', fallbackType: 'color_gel', overlayColor: 'rgba(15, 23, 42, 0.3)', brightness: 0.8 },
  { id: 'soft_glow', name: 'Soft Glow', category: 'basic', icon: 'sparkles-outline', fallbackType: 'color_gel', overlayColor: 'rgba(255, 240, 245, 0.15)' },

  // ==========================================
  // BEAUTY FILTERS
  // ==========================================
  { id: 'smooth_skin', name: 'Smooth Skin', category: 'beauty', icon: 'sparkles', fallbackType: 'beauty_glow', brightness: 1.05, lensId: 'snap_lens_smooth_201' },
  { id: 'face_glow', name: 'Face Glow', category: 'beauty', icon: 'color-wand-outline', fallbackType: 'beauty_glow', brightness: 1.15, lensId: 'snap_lens_faceglow_202' },
  { id: 'natural_beauty', name: 'Natural Beauty', category: 'beauty', icon: 'flower-outline', fallbackType: 'beauty_glow', brightness: 1.08, overlayColor: 'rgba(255, 240, 230, 0.05)', lensId: 'snap_lens_natural_203' },
  { id: 'soft_beauty', name: 'Soft Beauty', category: 'beauty', icon: 'heart-half-outline', fallbackType: 'beauty_glow', brightness: 1.1, overlayColor: 'rgba(255, 220, 220, 0.08)' },
  { id: 'bright_face', name: 'Bright Face', category: 'beauty', icon: 'eye-outline', fallbackType: 'beauty_glow', brightness: 1.2 },
  { id: 'eye_enhance', name: 'Eye Enhance', category: 'beauty', icon: 'eye', fallbackType: 'beauty_glow', brightness: 1.05, lensId: 'snap_lens_eye_enhance_204' },
  { id: 'teeth_whitening', name: 'Teeth Whitening', category: 'beauty', icon: 'happy-outline', fallbackType: 'beauty_glow', brightness: 1.07 },
  { id: 'light_makeup', name: 'Light Makeup', category: 'beauty', icon: 'brush-outline', fallbackType: 'beauty_glow', overlayColor: 'rgba(255, 192, 203, 0.08)', lensId: 'snap_lens_makeup_light_205' },
  { id: 'glam_makeup', name: 'Glam Makeup', category: 'beauty', icon: 'star-half-outline', fallbackType: 'beauty_glow', overlayColor: 'rgba(219, 112, 147, 0.12)', lensId: 'snap_lens_makeup_glam_206' },

  // ==========================================
  // FUN FACE FILTERS
  // ==========================================
  { id: 'dog_ears', name: 'Dog Ears', category: 'fun_face', icon: '🐶', fallbackType: 'ar_sticker', stickerEmoji: '🐶', lensId: 'snap_lens_dog_ears_301' },
  { id: 'cat_ears', name: 'Cat Ears', category: 'fun_face', icon: '🐱', fallbackType: 'ar_sticker', stickerEmoji: '🐱', lensId: 'snap_lens_cat_ears_302' },
  { id: 'bunny_ears', name: 'Bunny Ears', category: 'fun_face', icon: '🐰', fallbackType: 'ar_sticker', stickerEmoji: '🐰', lensId: 'snap_lens_bunny_303' },
  { id: 'crown', name: 'Crown', category: 'fun_face', icon: '👑', fallbackType: 'ar_sticker', stickerEmoji: '👑', lensId: 'snap_lens_crown_304' },
  { id: 'flower_crown', name: 'Flower Crown', category: 'fun_face', icon: '🌸', fallbackType: 'ar_sticker', stickerEmoji: '🌸', lensId: 'snap_lens_flowercrown_305' },
  { id: 'sunglasses', name: 'Sunglasses', category: 'fun_face', icon: '🕶️', fallbackType: 'ar_sticker', stickerEmoji: '🕶️', lensId: 'snap_lens_sunglasses_306' },
  { id: 'heart_eyes', name: 'Heart Eyes', category: 'fun_face', icon: '😍', fallbackType: 'ar_sticker', stickerEmoji: '❤️', lensId: 'snap_lens_hearteyes_307' },
  { id: 'funny_nose', name: 'Funny Nose', category: 'fun_face', icon: '👃', fallbackType: 'ar_sticker', stickerEmoji: '🤡' },
  { id: 'mustache', name: 'Mustache', category: 'fun_face', icon: '👨', fallbackType: 'ar_sticker', stickerEmoji: '👨🏻‍🦰', lensId: 'snap_lens_mustache_308' },
  { id: 'beard', name: 'Beard', category: 'fun_face', icon: '🧔', fallbackType: 'ar_sticker', stickerEmoji: '🧔', lensId: 'snap_lens_beard_309' },
  { id: 'anime_face', name: 'Anime Face', category: 'fun_face', icon: '👁️‍🗨️', fallbackType: 'ar_sticker', stickerEmoji: '✨', lensId: 'snap_lens_anime_310' },
  { id: 'cartoon_face', name: 'Cartoon Face', category: 'fun_face', icon: '🎨', fallbackType: 'ar_sticker', stickerEmoji: '🤡', lensId: 'snap_lens_cartoon_311' },

  // ==========================================
  // AR EFFECTS (PARTICLE OVERLAYS)
  // ==========================================
  { id: 'floating_hearts', name: 'Floating Hearts', category: 'ar_effect', icon: '❤️', fallbackType: 'particle_effect', particles: 'hearts', lensId: 'snap_lens_hearts_401' },
  { id: 'stars', name: 'Stars', category: 'ar_effect', icon: '⭐', fallbackType: 'particle_effect', particles: 'stars', lensId: 'snap_lens_stars_402' },
  { id: 'sparkles', name: 'Sparkles', category: 'ar_effect', icon: '✨', fallbackType: 'particle_effect', particles: 'sparkles', lensId: 'snap_lens_sparkles_403' },
  { id: 'fire_effect', name: 'Fire Effect', category: 'ar_effect', icon: '🔥', fallbackType: 'particle_effect', particles: 'fire', lensId: 'snap_lens_fire_404' },
  { id: 'snow_effect', name: 'Snow Effect', category: 'ar_effect', icon: '❄️', fallbackType: 'particle_effect', particles: 'snow', lensId: 'snap_lens_snow_405' },
  { id: 'rain_effect', name: 'Rain Effect', category: 'ar_effect', icon: '🌧️', fallbackType: 'particle_effect', particles: 'rain', lensId: 'snap_lens_rain_406' },
  { id: 'confetti', name: 'Confetti', category: 'ar_effect', icon: '🎉', fallbackType: 'particle_effect', particles: 'confetti', lensId: 'snap_lens_confetti_407' },
  { id: 'neon_glow', name: 'Neon Glow', category: 'ar_effect', icon: '🌟', fallbackType: 'particle_effect', particles: 'sparkles', overlayColor: 'rgba(255, 20, 147, 0.1)', lensId: 'snap_lens_neonglow_408' },
  { id: 'butterfly_effect', name: 'Butterfly Effect', category: 'ar_effect', icon: '🦋', fallbackType: 'particle_effect', particles: 'stars', lensId: 'snap_lens_butterflies_409' },
  { id: 'angel_halo', name: 'Angel Halo', category: 'ar_effect', icon: '😇', fallbackType: 'ar_sticker', stickerEmoji: '😇', lensId: 'snap_lens_angel_410' },
  { id: 'devil_horns', name: 'Devil Horns', category: 'ar_effect', icon: '😈', fallbackType: 'ar_sticker', stickerEmoji: '😈', lensId: 'snap_lens_devil_411' },
  { id: 'lightning_effect', name: 'Lightning Effect', category: 'ar_effect', icon: '⚡', fallbackType: 'particle_effect', particles: 'sparkles', overlayColor: 'rgba(138, 43, 226, 0.15)', lensId: 'snap_lens_lightning_412' },

  // ==========================================
  // BACKGROUND EFFECTS
  // ==========================================
  { id: 'blur_bg', name: 'Blur Background', category: 'background', icon: 'cube-outline', fallbackType: 'background_frame', frameImage: 'blur', lensId: 'snap_lens_blur_bg_501' },
  { id: 'replace_bg', name: 'Replace Background', category: 'background', icon: 'image-outline', fallbackType: 'background_frame', frameImage: 'gradient', lensId: 'snap_lens_bg_replace_502' },
  { id: 'beach_bg', name: 'Beach Background', category: 'background', icon: '🏖️', fallbackType: 'background_frame', frameImage: 'beach', lensId: 'snap_lens_beach_503' },
  { id: 'city_bg', name: 'City Background', category: 'background', icon: '🏙️', fallbackType: 'background_frame', frameImage: 'city', lensId: 'snap_lens_city_504' },
  { id: 'nature_bg', name: 'Nature Background', category: 'background', icon: '🌲', fallbackType: 'background_frame', frameImage: 'nature', lensId: 'snap_lens_nature_505' },
  { id: 'college_bg', name: 'College Background', category: 'background', icon: '🎓', fallbackType: 'background_frame', frameImage: 'college', lensId: 'snap_lens_college_506' },
  { id: 'party_bg', name: 'Party Background', category: 'background', icon: '🥳', fallbackType: 'background_frame', frameImage: 'party', lensId: 'snap_lens_party_507' },
  { id: 'gradient_bg', name: 'Gradient Background', category: 'background', icon: 'color-fill-outline', fallbackType: 'background_frame', frameImage: 'gradient', lensId: 'snap_lens_gradient_508' },

  // ==========================================
  // CREATIVE FILTERS
  // ==========================================
  { id: 'glitch', name: 'Glitch', category: 'creative', icon: 'pulse-outline', fallbackType: 'creative_fx', fxStyle: 'glitch', lensId: 'snap_lens_glitch_601' },
  { id: 'vhs', name: 'VHS', category: 'creative', icon: 'videocam', fallbackType: 'creative_fx', fxStyle: 'vhs', lensId: 'snap_lens_vhs_602' },
  { id: 'retro_camera', name: 'Retro Camera', category: 'creative', icon: 'camera', fallbackType: 'creative_fx', fxStyle: 'retro', lensId: 'snap_lens_retro_603' },
  { id: 'cyberpunk', name: 'Cyberpunk', category: 'creative', icon: 'terminal-outline', fallbackType: 'creative_fx', fxStyle: 'cyberpunk', lensId: 'snap_lens_cyberpunk_604' },
  { id: 'neon', name: 'Neon', category: 'creative', icon: 'bulb-outline', fallbackType: 'creative_fx', fxStyle: 'neon', lensId: 'snap_lens_neon_605' },
  { id: 'sketch', name: 'Sketch', category: 'creative', icon: 'brush', fallbackType: 'creative_fx', fxStyle: 'sketch', lensId: 'snap_lens_sketch_606' },
  { id: 'pencil', name: 'Pencil Drawing', category: 'creative', icon: 'pencil-outline', fallbackType: 'creative_fx', fxStyle: 'sketch' },
  { id: 'oil_painting', name: 'Oil Painting', category: 'creative', icon: 'color-palette', fallbackType: 'creative_fx', fxStyle: 'retro' },
  { id: '3d_cartoon', name: '3D Cartoon', category: 'creative', icon: 'shapes-outline', fallbackType: 'creative_fx', fxStyle: 'pixel', lensId: 'snap_lens_3d_cartoon_607' },
  { id: 'pixel_art', name: 'Pixel Art', category: 'creative', icon: 'grid-outline', fallbackType: 'creative_fx', fxStyle: 'pixel', lensId: 'snap_lens_pixel_608' },
  { id: 'mirror_effect', name: 'Mirror Effect', category: 'creative', icon: 'repeat-outline', fallbackType: 'creative_fx', fxStyle: 'mirror', lensId: 'snap_lens_mirror_609' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', category: 'creative', icon: 'telescope-outline', fallbackType: 'creative_fx', fxStyle: 'kaleidoscope', lensId: 'snap_lens_kscope_610' },

  // ==========================================
  // TEXT & STICKER TOOLS
  // ==========================================
  { id: 'add_text', name: 'Add Text', category: 'text_sticker', icon: 'text-outline', fallbackType: 'sticker_tool' },
  { id: 'emoji_sticker', name: 'Emoji Stickers', category: 'text_sticker', icon: 'happy-outline', fallbackType: 'sticker_tool' },
  { id: 'gif_sticker', name: 'GIF Stickers', category: 'text_sticker', icon: 'images-outline', fallbackType: 'sticker_tool' },
  { id: 'location_sticker', name: 'Location Sticker', category: 'text_sticker', icon: 'location-outline', fallbackType: 'sticker_tool' },
  { id: 'time_sticker', name: 'Time Sticker', category: 'text_sticker', icon: 'time-outline', fallbackType: 'sticker_tool' },
  { id: 'date_sticker', name: 'Date Sticker', category: 'text_sticker', icon: 'calendar-outline', fallbackType: 'sticker_tool' },
  { id: 'hashtag_sticker', name: 'Hashtag Sticker', category: 'text_sticker', icon: 'pricetag-outline', fallbackType: 'sticker_tool' },
  { id: 'mention_sticker', name: 'Mention Sticker', category: 'text_sticker', icon: 'at-outline', fallbackType: 'sticker_tool' },
];

/**
 * Helper to get fallback overlay styles based on selected filter
 */
export const getFilterOverlayStyle = (filter: FilterMetadata) => {
  if (!filter || filter.id === 'normal') return {};

  const styles: any = {};

  if (filter.overlayColor && filter.overlayColor !== 'transparent') {
    styles.backgroundColor = filter.overlayColor;
  }

  return styles;
};
