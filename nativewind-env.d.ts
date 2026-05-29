/// <reference types="nativewind/types" />

import { ScrollViewProps as RNScrollViewProps, FlatListProps as RNFlatListProps } from 'react-native';

declare module 'react-native' {
  interface ScrollViewProps extends RNScrollViewProps {
    contentContainerClassName?: string;
  }
  interface FlatListProps<ItemT> extends RNFlatListProps<ItemT> {
    contentContainerClassName?: string;
  }
}

declare module '*.css';
