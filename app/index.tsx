import React, { useState, useEffect, useRef } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

const ENABLE_VIDEO_SPLASH = true;

export default function Index() {
  const [isVideoFinished, setIsVideoFinished] = useState(!ENABLE_VIDEO_SPLASH);
  const [hasVideoError, setHasVideoError] = useState(!ENABLE_VIDEO_SPLASH);
  const videoRef = useRef<Video>(null);

  // Fallback timeout in case the video fails to load, play, or is 0-bytes
  useEffect(() => {
    if (!ENABLE_VIDEO_SPLASH) return;
    const timer = setTimeout(() => {
      setIsVideoFinished(true);
    }, 30000); // generous fallback so the intro is not cut off early
    return () => clearTimeout(timer);
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsVideoFinished(true);
    }
  };

  const handleVideoError = () => {
    setHasVideoError(true);
    setIsVideoFinished(true);
  };

  // Wait until either the video finishes playing or it fails.
  const isSplashDone = isVideoFinished;

  if (!isSplashDone) {
    return (
      <View style={styles.container}>
        {ENABLE_VIDEO_SPLASH && !hasVideoError ? (
          <Video
            ref={videoRef}
            source={require('../assets/videos/splash.mp4')}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={handleVideoError}
          />
        ) : (
          <ActivityIndicator size="large" color="#6A2FF9" />
        )}
      </View>
    );
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D6C7FF', // Beautiful soft lavender theme background
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
