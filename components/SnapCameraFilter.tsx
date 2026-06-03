import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Easing,
  Modal,
  TextInput,
  PanResponder,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';
import { CAMERA_FILTERS, FilterMetadata, FilterCategory, SNAP_CAMERA_KIT_CONFIG } from '../config/snapCameraKit';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Interface for interactive placed items (Text, Emojis, Badges)
interface ActiveItem {
  id: string;
  type: 'emoji' | 'text' | 'badge';
  content: string;
  x: Animated.Value;
  y: Animated.Value;
  scale: number;
  color?: string;
  bgColor?: string;
}

interface SnapCameraFilterProps {
  visible: boolean;
  onClose: () => void;
  onPost: (imageUri: string, filterId: string) => Promise<void>;
}

export default function SnapCameraFilter({ visible, onClose, onPost }: SnapCameraFilterProps) {
  // Camera Permissions and Toggle
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  // Active filter state
  const [selectedFilter, setSelectedFilter] = useState<FilterMetadata>(CAMERA_FILTERS[0]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('basic');

  // Interactive items state (Draggable Stickers and Texts)
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [currentTextValue, setCurrentTextValue] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textStyle, setTextStyle] = useState<'normal' | 'badge'>('badge');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Capturing and Preview Flow
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Live Animated Particles
  const [particles, setParticles] = useState<{ id: number; x: number; y: Animated.Value; size: number; opacity: Animated.Value }[]>([]);
  const particleIdCounter = useRef(0);
  const particleInterval = useRef<any>(null);

  // VHS Glitch and Scanline timers
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [vhsTime, setVhsTime] = useState('');

  // ----------------------------------------------------
  // CAMERA PERMISSIONS CHECKS
  // ----------------------------------------------------
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission?.granted, requestPermission]);

  // Update VHS Watermark Time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setVhsTime(
        `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      );
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  // VHS Glitch Generator
  useEffect(() => {
    if (selectedFilter.id === 'glitch' || selectedFilter.id === 'cyberpunk') {
      const timer = setInterval(() => {
        setGlitchOffset({
          x: Math.random() > 0.8 ? (Math.random() - 0.5) * 12 : 0,
          y: Math.random() > 0.85 ? (Math.random() - 0.5) * 6 : 0,
        });
      }, 100);
      return () => clearInterval(timer);
    } else {
      setGlitchOffset({ x: 0, y: 0 });
    }
  }, [selectedFilter]);

  // ----------------------------------------------------
  // AR EFFECTS: LIVE PARTICLE GENERATOR & ANIMATION
  // ----------------------------------------------------
  useEffect(() => {
    if (particleInterval.current) clearInterval(particleInterval.current);
    setParticles([]);

    const activeParticles = selectedFilter.particles;
    if (!activeParticles) return;

    // Start generator interval
    particleInterval.current = setInterval(() => {
      // Limit total particles to 20 for maximum rendering performance
      setParticles((prev) => {
        if (prev.length > 20) return prev;

        const id = particleIdCounter.current++;
        const size = Math.random() * 20 + 10;
        const startX = Math.random() * SCREEN_WIDTH;

        // Animate Y position depending on particle type
        const startYVal = selectedFilter.particles === 'rain' || selectedFilter.particles === 'snow' || selectedFilter.particles === 'confetti'
          ? -40 // start off screen top
          : SCREEN_HEIGHT - 120; // start off screen bottom (rising fire/hearts)

        const endYVal = selectedFilter.particles === 'rain' || selectedFilter.particles === 'snow' || selectedFilter.particles === 'confetti'
          ? SCREEN_HEIGHT // fall off bottom
          : -40; // rise off top

        const yAnim = new Animated.Value(startYVal);
        const opacityAnim = new Animated.Value(0.8);

        const duration = selectedFilter.particles === 'rain'
          ? 1200
          : selectedFilter.particles === 'fire' || selectedFilter.particles === 'hearts'
            ? 3500
            : 4500;

        // Float Animation
        Animated.parallel([
          Animated.timing(yAnim, {
            toValue: endYVal,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration,
            delay: duration * 0.7,
            useNativeDriver: false,
          })
        ]).start(() => {
          // Remove particle once animation completes
          setParticles((current) => current.filter((p) => p.id !== id));
        });

        return [...prev, { id, x: startX, y: yAnim, size, opacity: opacityAnim }];
      });
    }, selectedFilter.particles === 'rain' ? 80 : 350);

    return () => {
      if (particleInterval.current) clearInterval(particleInterval.current);
    };
  }, [selectedFilter]);

  // Add automated Fun Face stickers when user selects face filters
  useEffect(() => {
    // When a fun face filter is selected, inject it in the middle of the screen
    if (selectedFilter.category === 'fun_face' && selectedFilter.stickerEmoji) {
      // Clear old fun face stickers to avoid cluttering
      setActiveItems(prev => prev.filter(item => item.id !== 'auto_face_sticker'));
      
      const newSticker: ActiveItem = {
        id: 'auto_face_sticker',
        type: 'emoji',
        content: selectedFilter.stickerEmoji,
        x: new Animated.Value(SCREEN_WIDTH / 2 - 35),
        y: new Animated.Value(SCREEN_HEIGHT * 0.3),
        scale: 2.2,
      };
      
      setActiveItems(prev => [...prev, newSticker]);
      Toast.show({
        type: 'info',
        text1: `${selectedFilter.name} Lens applied`,
        text2: 'Drag and scale the emoji to fit your face!',
        position: 'bottom',
      });
    } else if (selectedFilter.category === 'ar_effect' && selectedFilter.fallbackType === 'ar_sticker' && selectedFilter.stickerEmoji) {
      // Auto place angel halo or devil horns
      setActiveItems(prev => prev.filter(item => item.id !== 'auto_face_sticker'));
      
      const newSticker: ActiveItem = {
        id: 'auto_face_sticker',
        type: 'emoji',
        content: selectedFilter.stickerEmoji,
        x: new Animated.Value(SCREEN_WIDTH / 2 - 35),
        y: new Animated.Value(SCREEN_HEIGHT * 0.22),
        scale: 2.0,
      };
      
      setActiveItems(prev => [...prev, newSticker]);
    }
  }, [selectedFilter]);

  // ----------------------------------------------------
  // DRAGGING LOGIC (PAN RESPONDER FOR STICKERS & TEXT)
  // ----------------------------------------------------
  const createPanResponder = (item: ActiveItem) => {
    let lastX = (item.x as any)._value || 0;
    let lastY = (item.y as any)._value || 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastX = (item.x as any)._value;
        lastY = (item.y as any)._value;
      },
      onPanResponderMove: (evt, gestureState) => {
        item.x.setValue(lastX + gestureState.dx);
        item.y.setValue(lastY + gestureState.dy);
      },
      onPanResponderRelease: () => {
        // Snap boundary constraints
        const currentX = (item.x as any)._value;
        const currentY = (item.y as any)._value;
        if (currentX < 0) item.x.setValue(10);
        if (currentX > SCREEN_WIDTH - 60) item.x.setValue(SCREEN_WIDTH - 70);
        if (currentY < 60) item.y.setValue(80);
        if (currentY > SCREEN_HEIGHT - 220) item.y.setValue(SCREEN_HEIGHT - 240);
      },
    });
  };

  // ----------------------------------------------------
  // TEXT & STICKER UTILS
  // ----------------------------------------------------
  const handleOpenTextTool = () => {
    setEditingItemId(null);
    setCurrentTextValue('');
    setTextInputVisible(true);
  };

  const handleEditTextItem = (item: ActiveItem) => {
    if (item.type !== 'text' && item.type !== 'badge') return;
    setEditingItemId(item.id);
    setCurrentTextValue(item.content);
    setTextColor(item.color || '#FFFFFF');
    setTextStyle(item.type === 'badge' ? 'badge' : 'normal');
    setTextInputVisible(true);
  };

  const handleSaveText = () => {
    if (!currentTextValue.trim()) {
      setTextInputVisible(false);
      return;
    }

    if (editingItemId) {
      // Edit existing
      setActiveItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                content: currentTextValue,
                type: textStyle === 'badge' ? 'badge' : 'text',
                color: textColor,
                bgColor: textStyle === 'badge' ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
              }
            : item
        )
      );
    } else {
      // Add new
      const newItem: ActiveItem = {
        id: `text_${Date.now()}`,
        type: textStyle === 'badge' ? 'badge' : 'text',
        content: currentTextValue,
        x: new Animated.Value(SCREEN_WIDTH / 2 - 100),
        y: new Animated.Value(SCREEN_HEIGHT / 2 - 30),
        scale: 1.0,
        color: textColor,
        bgColor: textStyle === 'badge' ? 'rgba(0, 0, 0, 0.75)' : 'transparent',
      };
      setActiveItems((prev) => [...prev, newItem]);
    }

    setTextInputVisible(false);
    setCurrentTextValue('');
    setEditingItemId(null);
  };

  const handleAddEmojiSticker = (emoji: string) => {
    const newItem: ActiveItem = {
      id: `emoji_${Date.now()}`,
      type: 'emoji',
      content: emoji,
      x: new Animated.Value(SCREEN_WIDTH / 2 - 30),
      y: new Animated.Value(SCREEN_HEIGHT / 2 - 30),
      scale: 1.5,
    };
    setActiveItems((prev) => [...prev, newItem]);
    Toast.show({
      type: 'success',
      text1: 'Emoji Sticker Added',
      text2: 'Drag it anywhere on the camera screen!',
      position: 'bottom',
    });
  };

  const handleAddBadgeSticker = (stickerType: string) => {
    let content = '';
    let bgColor = '#6A2FF9'; // Premium purple brand color

    const now = new Date();

    switch (stickerType) {
      case 'location':
        content = '📍 Campus Connect';
        bgColor = '#8B5CF6';
        break;
      case 'time':
        content = `⏰ ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        bgColor = '#10B981';
        break;
      case 'date':
        content = `📅 ${now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
        bgColor = '#3B82F6';
        break;
      case 'hashtag':
        Alert.prompt('Hashtag Sticker', 'Enter hashtag text:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (text) => {
              const cleaned = text && text.startsWith('#') ? text : `#${text || 'CampusLife'}`;
              const newItem: ActiveItem = {
                id: `badge_${Date.now()}`,
                type: 'badge',
                content: cleaned,
                x: new Animated.Value(SCREEN_WIDTH / 2 - 80),
                y: new Animated.Value(SCREEN_HEIGHT / 2 - 20),
                scale: 1.0,
                color: '#FFFFFF',
                bgColor: '#EC4899',
              };
              setActiveItems((prev) => [...prev, newItem]);
            },
          },
        ]);
        return;
      case 'mention':
        Alert.prompt('Mention Sticker', 'Enter username to mention:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (text) => {
              const cleaned = text && text.startsWith('@') ? text : `@${text || 'student'}`;
              const newItem: ActiveItem = {
                id: `badge_${Date.now()}`,
                type: 'badge',
                content: cleaned,
                x: new Animated.Value(SCREEN_WIDTH / 2 - 80),
                y: new Animated.Value(SCREEN_HEIGHT / 2 - 20),
                scale: 1.0,
                color: '#FFFFFF',
                bgColor: '#F59E0B',
              };
              setActiveItems((prev) => [...prev, newItem]);
            },
          },
        ]);
        return;
      default:
        content = '✨ STICKER';
        break;
    }

    if (content) {
      const newItem: ActiveItem = {
        id: `badge_${Date.now()}`,
        type: 'badge',
        content: content,
        x: new Animated.Value(SCREEN_WIDTH / 2 - 90),
        y: new Animated.Value(SCREEN_HEIGHT / 2 - 20),
        scale: 1.0,
        color: '#FFFFFF',
        bgColor: bgColor,
      };
      setActiveItems((prev) => [...prev, newItem]);
    }
  };

  const handleAdjustItemScale = (id: string, increase: boolean) => {
    setActiveItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newScale = increase ? item.scale + 0.15 : Math.max(0.6, item.scale - 0.15);
          return { ...item, scale: parseFloat(newScale.toFixed(2)) };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setActiveItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ----------------------------------------------------
  // CAPTURE FLOW (TAKING THE SNAP)
  // ----------------------------------------------------
  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const options = { quality: 0.22, base64: true, skipProcessing: false };
      const photo = await cameraRef.current.takePictureAsync(options);
      
      let base64Uri = '';
      if (photo.base64) {
        base64Uri = `data:image/jpeg;base64,${photo.base64}`;
      } else {
        base64Uri = photo.uri;
      }
      
      setCapturedImage(base64Uri);
      Toast.show({
        type: 'success',
        text1: 'Snap Captured! 📸',
        text2: 'Tap Post to share or Save to gallery!',
        position: 'top',
      });
    } catch (e: any) {
      console.error('Error capturing photo:', e);
      Alert.alert('Capture Failed', 'Could not take snap. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Keep filter but reset auto placed face stickers
    setActiveItems((prev) => prev.filter((item) => item.id !== 'auto_face_sticker'));
  };

  // ----------------------------------------------------
  // SAVE & POST ACTIONS
  // ----------------------------------------------------
  const handleSaveSnap = async () => {
    if (!capturedImage || isSaving) return;

    try {
      setIsSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to save photos.');
        setIsSaving(false);
        return;
      }

      let localUri = capturedImage;
      if (capturedImage.startsWith('data:')) {
        const parts = capturedImage.split(';base64,');
        const base64Data = parts[1];
        const filename = `cc_snap_${Date.now()}.jpg`;
        const tempUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(tempUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        localUri = tempUri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      Toast.show({
        type: 'success',
        text1: 'Saved to Gallery! 💾',
        text2: 'Snap saved with active filters.',
      });
    } catch (e: any) {
      console.error('Failed to save snap:', e);
      Alert.alert('Save Failed', e.message || 'Could not save snap.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostSnap = async () => {
    if (!capturedImage || isPosting) return;

    try {
      setIsPosting(true);
      
      // Call parenting post story function
      await onPost(capturedImage, selectedFilter.id);
      
      // Success, cleanup states and close
      setCapturedImage(null);
      setActiveItems([]);
      setSelectedFilter(CAMERA_FILTERS[0]);
      onClose();
    } catch (e: any) {
      console.error('Failed to upload story:', e);
      Alert.alert('Upload Failed', e.message || 'Could not share snap.');
    } finally {
      setIsPosting(false);
    }
  };

  // ----------------------------------------------------
  // CATEGORIES DEFINITION & METADATA FILTERING
  // ----------------------------------------------------
  const categories: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'basic', label: 'Basic', icon: 'color-filter-outline' },
    { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' },
    { id: 'fun_face', label: 'Fun Face', icon: 'happy-outline' },
    { id: 'ar_effect', label: 'AR Effects', icon: 'star-outline' },
    { id: 'background', label: 'Background', icon: 'image-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
    { id: 'text_sticker', label: 'Stickers', icon: 'text-outline' },
  ];

  const filteredFilters = useMemo(() => {
    return CAMERA_FILTERS.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  // ----------------------------------------------------
  // CONDITIONAL RENDERING OF PERMISSIONS
  // ----------------------------------------------------
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View className="flex-1 bg-slate-950 items-center justify-center">
          <ActivityIndicator size="large" color="#6A2FF9" />
          <Text className="text-white mt-4 font-bold">Initializing Snap Camera...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 bg-slate-950 items-center justify-center p-6">
          <View className="bg-slate-900 border border-purple-500/30 p-8 rounded-3xl items-center shadow-2xl">
            <Ionicons name="camera" size={64} color="#6A2FF9" />
            <Text className="text-white text-2xl font-black text-center mt-4">Camera Access Required</Text>
            <Text className="text-slate-400 text-sm text-center mt-2 mb-6 leading-5">
              Campus Connect Snap Filters require camera access to overlay Snapchat lenses and high-fidelity effects in real time.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="bg-[#6A2FF9] px-8 py-3.5 rounded-full shadow-lg active:opacity-90 w-full"
            >
              <Text className="text-white text-center font-extrabold">Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="mt-4">
              <Text className="text-slate-500 font-bold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View className="flex-1 bg-black relative">
        {/* =======================================================================
            TOP STATUS HEADERS AND CONTROLS
            ======================================================================= */}
        <View className="absolute top-12 left-0 right-0 px-4 flex-row justify-between items-center z-50">
          {/* Trash or Cancel Button */}
          {!capturedImage ? (
            <TouchableOpacity
              onPress={onClose}
              className="bg-black/40 w-10 h-10 rounded-full items-center justify-center border border-white/10 active:opacity-80"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleRetake}
              disabled={isPosting}
              className="bg-black/50 px-4 py-2.5 rounded-full flex-row items-center justify-center border border-red-500/20 active:opacity-85"
            >
              <Ionicons name="arrow-back-outline" size={16} color="#EF4444" />
              <Text className="text-red-500 font-extrabold text-xs ml-1.5 uppercase tracking-wider">Retake</Text>
            </TouchableOpacity>
          )}

          {/* Dynamic Category/Lens Info Title */}
          <View className="items-center">
            <Text className="text-white font-extrabold text-xs tracking-wider uppercase opacity-60">
              {!capturedImage ? "Snap Camera Kit" : "Captured Preview"}
            </Text>
            <Text className="text-white font-black text-sm tracking-tight bg-black/30 px-3 py-1 rounded-full border border-white/5 mt-0.5 shadow-sm">
              {selectedFilter.name} {selectedFilter.lensId ? "⚡ Lens" : "🎨 Filter"}
            </Text>
          </View>

          {/* Flash / Swap Toggle OR Post Button */}
          {!capturedImage ? (
            <View className="flex-row space-x-2">
              {/* Flash Button */}
              <TouchableOpacity
                onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
                className="bg-black/40 w-10 h-10 rounded-full items-center justify-center border border-white/10 active:opacity-80"
              >
                <Ionicons
                  name={flash === 'on' ? 'flash' : 'flash-off-outline'}
                  size={20}
                  color={flash === 'on' ? '#F59E0B' : '#FFFFFF'}
                />
              </TouchableOpacity>

              {/* Front/Back Swapper */}
              <TouchableOpacity
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                className="bg-black/40 w-10 h-10 rounded-full items-center justify-center border border-white/10 active:opacity-80"
              >
                <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              disabled={isPosting}
              onPress={handlePostSnap}
              className="bg-[#6A2FF9] px-6 py-2.5 rounded-full flex-row items-center justify-center shadow-lg border border-purple-500/20 active:opacity-90"
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-black text-xs uppercase tracking-widest mr-1.5">Share</Text>
                  <Ionicons name="paper-plane" size={13} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Right quick tools panel for stickers & text (Only in Camera view) */}
        {!capturedImage && (
          <View className="absolute top-28 right-4 flex-col space-y-3 z-50">
            <TouchableOpacity
              onPress={handleOpenTextTool}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="text" size={20} color="#FFFFFF" />
              <Text className="text-[8px] text-white/70 font-bold -mt-0.5">Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddBadgeSticker('location')}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="location" size={19} color="#8B5CF6" />
              <Text className="text-[7px] text-white/70 font-bold -mt-0.5">Loc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddBadgeSticker('time')}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="time" size={20} color="#10B981" />
              <Text className="text-[7px] text-white/70 font-bold -mt-0.5">Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddBadgeSticker('date')}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="calendar" size={18} color="#3B82F6" />
              <Text className="text-[7px] text-white/70 font-bold -mt-0.5">Date</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddBadgeSticker('hashtag')}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="pricetag" size={17} color="#EC4899" />
              <Text className="text-[7px] text-white/70 font-bold -mt-0.5">Tag</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAddBadgeSticker('mention')}
              className="bg-black/40 w-10 h-10 rounded-xl items-center justify-center border border-white/10"
            >
              <Ionicons name="at" size={19} color="#F59E0B" />
              <Text className="text-[7px] text-white/70 font-bold -mt-0.5">User</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =======================================================================
            MAIN CAMERA / PREVIEW CONTAINER
            ======================================================================= */}
        <View className="flex-1 w-full h-full relative overflow-hidden bg-black">
          {!capturedImage ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing={facing}
              enableTorch={flash === 'on'}
              ref={cameraRef}
              onCameraReady={() => setIsCameraReady(true)}
            />
          ) : (
            <Image
              source={{ uri: capturedImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}

          {/* ----------------------------------------------------
              LIVE RENDERED EFFECTS OVERLAY
              ---------------------------------------------------- */}

          {/* 1. Basic Color Gel Overlays */}
          {selectedFilter.id !== 'normal' && selectedFilter.overlayColor && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: selectedFilter.overlayColor, zIndex: 10 },
              ]}
            />
          )}

          {/* 2. Interactive VHS and Glitch Scanline Effects */}
          {(selectedFilter.id === 'glitch' || selectedFilter.id === 'vhs' || selectedFilter.id === 'cyberpunk') && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 15 }]}>
              {/* Scanlines overlay */}
              <View style={styles.scanlines} />
              
              {/* Retro VHS Timer and Blinking REC Watermark */}
              <View className="absolute top-28 left-4 bg-black/30 px-3 py-1.5 rounded-lg border border-red-500/20">
                <View className="flex-row items-center mb-0.5">
                  <View className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping mr-1.5" />
                  <Text className="text-white font-mono text-[10px] uppercase font-bold tracking-widest text-red-500">REC</Text>
                </View>
                <Text className="text-white font-mono text-[9px] font-bold">{vhsTime}</Text>
                <Text className="text-emerald-400 font-mono text-[8px] font-bold mt-0.5">SP  0:00:24</Text>
              </View>

              {/* simulated horizontal glitch lines */}
              <View
                style={[
                  styles.glitchLine,
                  {
                    top: '40%',
                    transform: [{ translateX: glitchOffset.x }, { translateY: glitchOffset.y }],
                    opacity: selectedFilter.id === 'glitch' ? 0.45 : 0.15,
                  },
                ]}
              />
              <View
                style={[
                  styles.glitchLineSecondary,
                  {
                    top: '75%',
                    transform: [{ translateX: -glitchOffset.x * 1.5 }, { translateY: -glitchOffset.y * 0.8 }],
                    opacity: selectedFilter.id === 'glitch' ? 0.35 : 0.1,
                  },
                ]}
              />
            </View>
          )}

          {/* 3. Cyber Grid Effect */}
          {selectedFilter.id === 'cyberpunk' && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 12 }]}>
              {/* Horizontal line grid style overlay */}
              <View className="absolute bottom-32 left-0 right-0 h-44 border-b border-pink-500/40 border-t border-cyan-500/20 flex flex-col justify-between">
                <View className="h-[1px] w-full bg-pink-500/30 opacity-70" />
                <View className="h-[1px] w-full bg-cyan-500/30 opacity-50" />
                <View className="h-[1px] w-full bg-pink-500/20 opacity-30" />
              </View>
            </View>
          )}

          {/* 4. Background Scenic Framed Overlay */}
          {selectedFilter.category === 'background' && selectedFilter.frameImage && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 18, justifyContent: 'space-between' }]}>
              {/* High-fidelity border masks that create gorgeous themed layouts */}
              <View className="h-28 w-full bg-slate-950/80 border-b border-purple-500/20 items-center justify-center pt-8">
                <Text className="text-white/60 font-black text-[9px] uppercase tracking-widest">
                  CAMPUS CONNECT OVERLAY
                </Text>
              </View>
              
              {/* Background Theme elements */}
              {selectedFilter.id === 'college_bg' && (
                <View className="absolute bottom-52 left-4 bg-[#6A2FF9]/90 border border-purple-300 px-4 py-2 rounded-2xl shadow-xl z-20">
                  <Text className="text-white font-black text-xs">🎓 QUAD LIVE</Text>
                  <Text className="text-purple-200 text-[8px] font-bold mt-0.5">Campus Connections Social</Text>
                </View>
              )}

              {selectedFilter.id === 'beach_bg' && (
                <View className="absolute bottom-52 right-4 bg-orange-400/90 border border-yellow-200 px-4 py-2 rounded-2xl shadow-xl z-20">
                  <Text className="text-white font-black text-xs">🏖️ SUNSET SHORES</Text>
                  <Text className="text-orange-100 text-[8px] font-bold mt-0.5">Vacation Mode Active</Text>
                </View>
              )}

              {selectedFilter.id === 'party_bg' && (
                <View className="absolute bottom-52 left-4 right-4 bg-fuchsia-600/85 border border-fuchsia-300 px-4 py-2 rounded-2xl shadow-xl z-20 items-center">
                  <Text className="text-white font-black text-xs uppercase tracking-wider">🎉 WEEKEND BEATS 🎉</Text>
                  <Text className="text-fuchsia-100 text-[8px] font-bold mt-0.5">Student Social Festivity</Text>
                </View>
              )}

              <View className="h-44 w-full bg-slate-950/85 border-t border-purple-500/20 items-center justify-center pb-24">
                <Text className="text-white/30 font-bold text-[8px]">
                  Powered by Snap Camera Kit Fallbacks
                </Text>
              </View>
            </View>
          )}

          {/* 5. Particle Effects (Hearts, Stars, Snow, Rain, Fire, Confetti) */}
          {particles.map((p) => {
            let symbol = '✨';
            let color = '#FFF';

            if (selectedFilter.particles === 'hearts') {
              symbol = '❤️';
            } else if (selectedFilter.particles === 'stars') {
              symbol = '⭐';
            } else if (selectedFilter.particles === 'snow') {
              symbol = '❄️';
              color = '#E2E8F0';
            } else if (selectedFilter.particles === 'rain') {
              symbol = '💧';
              color = '#38BDF8';
            } else if (selectedFilter.particles === 'fire') {
              symbol = '🔥';
            } else if (selectedFilter.particles === 'confetti') {
              const confettiSymbols = ['🟩', '🟦', '🟥', '🟨', '🟪', '🟫', '🟧'];
              symbol = confettiSymbols[p.id % confettiSymbols.length];
            }

            return (
              <Animated.View
                key={p.id}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  opacity: p.opacity,
                  zIndex: 22,
                }}
              >
                <Text style={{ fontSize: p.size, color: color }}>{symbol}</Text>
              </Animated.View>
            );
          })}

          {/* 6. Live Draggable & Scalable Items (Stickers, Custom Text) */}
          {activeItems.map((item) => {
            const responder = createPanResponder(item);

            return (
              <Animated.View
                key={item.id}
                {...responder.panHandlers}
                style={[
                  styles.draggableItem,
                  {
                    left: item.x,
                    top: item.y,
                    transform: [{ scale: item.scale }],
                    zIndex: 40,
                  },
                ]}
              >
                <View className="relative group">
                  {/* Sticker or badge content wrapper */}
                  {item.type === 'emoji' ? (
                    <Text style={{ fontSize: 44 }}>{item.content}</Text>
                  ) : item.type === 'badge' ? (
                    <View
                      className="px-3.5 py-1.5 rounded-full border border-white/20 shadow-md flex-row items-center"
                      style={{ backgroundColor: item.bgColor || '#6A2FF9' }}
                    >
                      <Text className="text-white text-xs font-black tracking-tight uppercase">
                        {item.content}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onLongPress={() => handleEditTextItem(item)}
                      activeOpacity={0.8}
                    >
                      <View
                        className="px-4 py-2 rounded-2xl shadow-md border border-white/10"
                        style={{ backgroundColor: item.bgColor || 'transparent' }}
                      >
                        <Text
                          style={{
                            color: item.color || '#FFFFFF',
                            fontSize: 22,
                            fontWeight: '900',
                            textAlign: 'center',
                          }}
                        >
                          {item.content}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Tiny Quick Controls around item for scaling/removing (Don't show on auto placement unless hovered/tapped) */}
                  <View className="absolute -top-7 -right-7 flex-row bg-black/60 rounded-full px-1.5 py-0.5 border border-white/10 z-50">
                    <TouchableOpacity
                      onPress={() => handleAdjustItemScale(item.id, true)}
                      className="p-1"
                    >
                      <Ionicons name="add-circle" size={13} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAdjustItemScale(item.id, false)}
                      className="p-1"
                    >
                      <Ionicons name="remove-circle" size={13} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.id)}
                      className="p-1"
                    >
                      <Ionicons name="trash" size={12} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* =======================================================================
            BOTTOM CAMERA CONTROLS AND CAROUSEL BAR (Only in Capture view)
            ======================================================================= */}
        {!capturedImage ? (
          <View className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-6 pt-10 px-4">
            
            {/* 1. Category Switch Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ paddingHorizontal: 10 }}
            >
              <View className="flex-row space-x-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full flex-row items-center border ${
                        isSelected
                          ? 'bg-[#6A2FF9] border-purple-400 shadow-md shadow-purple-950/20'
                          : 'bg-white/10 border-white/5'
                      }`}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                      />
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ml-1.5 ${
                          isSelected ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* 2. Filter Carousel List */}
            <View className="flex-row items-center justify-between mb-4">
              {/* Outer Scroll representing snap filter rings */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH / 2 - 46, alignItems: 'center' }}
              >
                <View className="flex-row space-x-3.5 items-center">
                  {selectedCategory === 'text_sticker' ? (
                    // Specialized stickers insertion carousel
                    <>
                      {['😃', '😂', '👍', '🔥', '👑', '💯', '❤️', '🌟', '🦄', '🍿', '🎓', '📚'].map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => handleAddEmojiSticker(emoji)}
                          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 items-center justify-center shadow-lg active:scale-95"
                        >
                          <Text style={{ fontSize: 26 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    // Regular Snap filters rings selection list
                    filteredFilters.map((item) => {
                      const isSelected = selectedFilter.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedFilter(item)}
                          className="items-center"
                        >
                          <View
                            className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center relative shadow-lg"
                            style={{
                              borderColor: isSelected ? '#6A2FF9' : 'rgba(255,255,255,0.25)',
                              backgroundColor: '#111827',
                              transform: [{ scale: isSelected ? 1.12 : 1.0 }],
                            }}
                          >
                            {/* Inner tint representation */}
                            {item.overlayColor && item.overlayColor !== 'transparent' && (
                              <View
                                style={[
                                  StyleSheet.absoluteFillObject,
                                  { backgroundColor: item.overlayColor, opacity: 0.6 },
                                ]}
                              />
                            )}

                            {/* Render Category Emoji or Ionicons inside filter bubble */}
                            {(!item.icon || !/^[a-z0-9\-]+$/.test(item.icon)) ? (
                              <Text style={{ fontSize: 22, zIndex: 10 }}>{item.icon || '✨'}</Text>
                            ) : (
                              <Ionicons
                                name={item.icon as any}
                                size={20}
                                color={isSelected ? '#6A2FF9' : '#FFFFFF'}
                                style={{ zIndex: 10 }}
                              />
                            )}

                            {/* Neon glow effect badge for active Snap Lenses */}
                            {item.lensId && (
                              <View className="absolute bottom-0 bg-[#6A2FF9] w-full py-0.5 items-center justify-center z-25 border-t border-purple-400">
                                <Text className="text-[6px] text-white font-extrabold tracking-widest uppercase">SNAP</Text>
                              </View>
                            )}
                          </View>
                          <Text
                            className="text-[9px] font-black mt-2 text-center"
                            style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>

            {/* 3. Capturing Photo Button Trigger */}
            <View className="items-center mt-2.5">
              <TouchableOpacity
                disabled={isCapturing}
                onPress={handleCapturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center p-1 active:scale-95"
              >
                <View className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg">
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#6A2FF9" />
                  ) : (
                    <View className="w-8 h-8 rounded-full border border-purple-300" style={{ backgroundColor: '#6A2FF9' }} />
                  )}
                </View>
              </TouchableOpacity>
              <Text className="text-white/40 text-[9px] font-extrabold uppercase tracking-widest mt-2">
                Tap to snap photo
              </Text>
            </View>
          </View>
        ) : (
          // =======================================================================
          // PREVIEW BUTTONS: SAVE & RETAKE FLOW BAR (Only in Preview mode)
          // =======================================================================
          <View className="absolute bottom-12 left-0 right-0 px-8 flex-row justify-between items-center z-40">
            {/* Gallery Save Button */}
            <TouchableOpacity
              onPress={handleSaveSnap}
              disabled={isSaving}
              className="bg-slate-900 border border-white/10 px-6 py-3.5 rounded-full flex-row items-center justify-center flex-1 mr-4 shadow-xl active:opacity-85"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={17} color="#FFFFFF" />
                  <Text className="text-white font-extrabold text-xs ml-2 uppercase tracking-wider">Save Snap</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Post button for story submission */}
            <TouchableOpacity
              onPress={handlePostSnap}
              disabled={isPosting}
              className="bg-[#6A2FF9] border border-purple-400/20 px-8 py-3.5 rounded-full flex-row items-center justify-center flex-1 shadow-xl active:opacity-90"
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-black text-xs uppercase tracking-widest mr-2">Post Pulse</Text>
                  <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* =======================================================================
            STICKER / CUSTOM TEXT COMPOSITION TOOL INPUT MODAL
            ======================================================================= */}
        <Modal
          visible={textInputVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setTextInputVisible(false)}
        >
          <View className="flex-1 bg-black/85 justify-center p-6">
            <View className="bg-slate-900 border border-purple-500/35 rounded-3xl p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-black text-base">
                  {editingItemId ? 'Edit Text Sticker' : 'Create Text Sticker'}
                </Text>
                <TouchableOpacity onPress={() => setTextInputVisible(false)}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TextInput
                autoFocus
                className="bg-slate-800 text-white font-extrabold rounded-2xl px-4 py-3.5 border border-purple-500/10 mb-4 text-base"
                style={{ color: textColor }}
                placeholder="Type your snap caption..."
                placeholderTextColor="#64748B"
                value={currentTextValue}
                onChangeText={setCurrentTextValue}
              />

              {/* Style selector: Plain or Badge style */}
              <View className="flex-row items-center mb-5 justify-between">
                <Text className="text-slate-400 font-bold text-xs">Sticker Background Style</Text>
                <View className="flex-row space-x-2 bg-slate-800 p-1 rounded-xl">
                  <TouchableOpacity
                    onPress={() => setTextStyle('normal')}
                    className={`px-3 py-1.5 rounded-lg ${textStyle === 'normal' ? 'bg-[#6A2FF9]' : ''}`}
                  >
                    <Text className="text-white text-[10px] font-black uppercase">Plain</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTextStyle('badge')}
                    className={`px-3 py-1.5 rounded-lg ${textStyle === 'badge' ? 'bg-[#6A2FF9]' : ''}`}
                  >
                    <Text className="text-white text-[10px] font-black uppercase">Badge</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Color Swatch Selector */}
              <View className="flex-row items-center mb-6 space-x-2.5 justify-center">
                {['#FFFFFF', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#111827'].map(
                  (c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setTextColor(c)}
                      className="w-8 h-8 rounded-full border-2 items-center justify-center"
                      style={{
                        backgroundColor: c,
                        borderColor: textColor === c ? '#6A2FF9' : 'transparent',
                      }}
                    >
                      {textColor === c && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Action Trigger Buttons */}
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setTextInputVisible(false)}
                  className="flex-1 bg-slate-800 py-3 rounded-xl border border-white/5 active:opacity-85"
                >
                  <Text className="text-slate-400 text-center font-bold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveText}
                  className="flex-1 bg-[#6A2FF9] py-3 rounded-xl shadow-md active:opacity-90"
                >
                  <Text className="text-white text-center font-black">Apply Sticker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  draggableItem: {
    position: 'absolute',
    alignSelf: 'flex-start',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    backgroundImage: 'repeating-linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
    backgroundSize: '100% 4px, 6px 100%',
    zIndex: 15,
  },
  glitchLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#F43F5E',
  },
  glitchLineSecondary: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.8,
    backgroundColor: '#06B6D4',
  },
});
