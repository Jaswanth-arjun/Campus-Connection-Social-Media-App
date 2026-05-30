import React, { useEffect, useRef } from 'react';
import { View, Animated, ScrollView, Dimensions } from 'react-native';

interface SkeletonLoaderProps {
  type: 'post' | 'event' | 'notification' | 'profile';
  count?: number;
}

const { width } = Dimensions.get('window');

export function SkeletonLoader({ type, count = 3 }: SkeletonLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const renderPostSkeleton = (index: number) => (
    <Animated.View
      key={`post-skel-${index}`}
      style={{ opacity: pulseAnim }}
      className="bg-white/70 border border-white/40 rounded-3xl p-5 mb-4 shadow-sm shadow-purple-950/5"
    >
      {/* Header Slot (Avatar + Name lines) */}
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-purple-200/50" />
        <View className="ml-3.5 flex-1 space-y-2">
          <View className="h-4 bg-purple-200/70 rounded-full w-28" />
          <View className="h-3 bg-purple-100/60 rounded-full w-20" />
        </View>
      </View>

      {/* Content Lines */}
      <View className="space-y-2.5 mb-4">
        <View className="h-4 bg-purple-200/60 rounded-full w-full" />
        <View className="h-4 bg-purple-200/60 rounded-full w-11/12" />
        <View className="h-4 bg-purple-100/50 rounded-full w-8/12" />
      </View>

      {/* Image slot */}
      <View className="h-44 bg-purple-100/40 rounded-2xl w-full mb-4" />

      {/* Footer Actions */}
      <View className="flex-row items-center justify-between border-t border-purple-50/50 pt-3">
        <View className="flex-row space-x-4">
          <View className="w-16 h-7 bg-purple-100/50 rounded-full" />
          <View className="w-16 h-7 bg-purple-100/50 rounded-full" />
        </View>
        <View className="w-8 h-8 bg-purple-100/60 rounded-full" />
      </View>
    </Animated.View>
  );

  const renderEventSkeleton = (index: number) => (
    <Animated.View
      key={`event-skel-${index}`}
      style={{ opacity: pulseAnim }}
      className="bg-white/70 border border-white/40 rounded-3xl p-5 mb-4 shadow-sm shadow-purple-950/5"
    >
      {/* Banner */}
      <View className="h-40 bg-purple-100/50 rounded-2xl w-full mb-4" />

      {/* Event Details */}
      <View className="space-y-3">
        <View className="flex-row items-center space-x-2">
          <View className="w-10 h-10 bg-purple-200/60 rounded-xl items-center justify-center" />
          <View className="space-y-1.5 flex-1">
            <View className="h-4 bg-purple-200/80 rounded-full w-3/4" />
            <View className="h-3 bg-purple-100/70 rounded-full w-1/2" />
          </View>
        </View>

        {/* Multi Lines description */}
        <View className="space-y-2 pt-2">
          <View className="h-3 bg-purple-100/50 rounded-full w-full" />
          <View className="h-3 bg-purple-100/50 rounded-full w-5/6" />
        </View>

        {/* Footer info pill */}
        <View className="flex-row items-center justify-between pt-3 border-t border-purple-50/50">
          <View className="h-6 bg-purple-100/60 rounded-full w-24" />
          <View className="h-9 bg-purple-200/70 rounded-full w-28" />
        </View>
      </View>
    </Animated.View>
  );

  const renderNotificationSkeleton = (index: number) => (
    <Animated.View
      key={`notif-skel-${index}`}
      style={{ opacity: pulseAnim }}
      className="bg-white/70 border border-white/30 rounded-2xl p-4 mb-3 flex-row items-center shadow-sm shadow-purple-950/5"
    >
      {/* Left Icon Wrapper */}
      <View className="w-11 h-11 bg-purple-100/70 rounded-full" />

      {/* Middle Text details */}
      <View className="ml-3.5 flex-1 space-y-2">
        <View className="h-4 bg-purple-200/60 rounded-full w-11/12" />
        <View className="h-3 bg-purple-100/50 rounded-full w-1/4" />
      </View>

      {/* Right dot indicators */}
      <View className="w-2.5 h-2.5 bg-purple-300 rounded-full ml-2" />
    </Animated.View>
  );

  const renderProfileSkeleton = () => (
    <Animated.View style={{ opacity: pulseAnim }} className="w-full">
      {/* Hero Card Skeleton */}
      <View className="bg-white/70 border border-white/30 rounded-3xl p-6 items-center shadow-sm shadow-purple-950/5 mb-6">
        <View className="w-24 h-24 rounded-full bg-purple-200/50 mb-4" />
        <View className="h-5 bg-purple-200/80 rounded-full w-36 mb-2" />
        <View className="h-3 bg-purple-100/70 rounded-full w-24 mb-4" />
        <View className="flex-row space-x-3.5 mb-5">
          <View className="w-20 h-7 bg-purple-100/70 rounded-full" />
          <View className="w-20 h-7 bg-purple-100/70 rounded-full" />
        </View>
        <View className="space-y-2 w-full pt-2">
          <View className="h-3 bg-purple-100/50 rounded-full w-3/4 self-center" />
          <View className="h-3 bg-purple-100/50 rounded-full w-1/2 self-center" />
        </View>
      </View>

      {/* Options Group */}
      <View className="bg-white/70 border border-white/30 rounded-3xl p-5 space-y-4 shadow-sm shadow-purple-950/5">
        {[1, 2, 3].map((item) => (
          <View key={`prof-row-${item}`} className="flex-row items-center py-2">
            <View className="w-10 h-10 bg-purple-100/60 rounded-xl" />
            <View className="h-4 bg-purple-200/60 rounded-full w-32 ml-4" />
            <View className="ml-auto w-5 h-5 bg-purple-100/60 rounded-full" />
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderSkeletons = () => {
    switch (type) {
      case 'post':
        return Array.from({ length: count }).map((_, i) => renderPostSkeleton(i));
      case 'event':
        return Array.from({ length: count }).map((_, i) => renderEventSkeleton(i));
      case 'notification':
        return Array.from({ length: count }).map((_, i) => renderNotificationSkeleton(i));
      case 'profile':
        return renderProfileSkeleton();
      default:
        return null;
    }
  };

  return (
    <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false}>
      <View className="py-2">{renderSkeletons()}</View>
    </ScrollView>
  );
}
