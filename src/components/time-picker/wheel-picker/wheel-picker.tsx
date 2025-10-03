import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  StyleProp,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ViewStyle,
  View,
  ViewProps,
  FlatListProps,
  FlatList,
} from 'react-native';
import styles from './wheel-picker.style';
import WheelPickerItem from './wheel-picker-item';
import { PickerOption } from '../../../types';

interface Props {
  value: number | string;
  options: PickerOption[];
  onChange: (index: number | string) => void;
  selectedIndicatorStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: TextStyle;
  itemTextClassName?: string;
  itemStyle?: ViewStyle;
  selectedIndicatorClassName?: string;
  itemHeight?: number;
  containerStyle?: ViewStyle;
  containerProps?: Omit<ViewProps, 'style'>;
  scaleFunction?: (x: number) => number;
  rotationFunction?: (x: number) => number;
  opacityFunction?: (x: number) => number;
  visibleRest?: number;
  decelerationRate?: 'normal' | 'fast' | number;
  flatListProps?: Omit<FlatListProps<string | null>, 'data' | 'renderItem'>;
  enableLooping?: boolean;
}

const REPEAT = 7; // Odd number ensures middle block exists
const MID_BLOCK = Math.floor(REPEAT / 2);

// Wrap index into valid range [0, len-1]
const wrap = (i: number, len: number) => (len ? ((i % len) + len) % len : 0);

const WheelPicker: React.FC<Props> = ({
  value,
  options,
  onChange,
  selectedIndicatorStyle = {},
  containerStyle = {},
  itemStyle = {},
  itemTextStyle = {},
  selectedIndicatorClassName = '',
  itemTextClassName = '',
  itemHeight = 40,
  scaleFunction = (x: number) => 1.0 ** x,
  rotationFunction = (x: number) => 1 - Math.pow(1 / 2, x),
  opacityFunction = (x: number) => Math.pow(1 / 3, x),
  visibleRest = 2,
  decelerationRate = 'normal',
  containerProps = {},
  flatListProps = {},
  enableLooping = false,
}) => {
  const momentumStarted = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const hasEmittedRef = useRef(false); // Prevent mount-time emission

  // Find selected index, with ceiling rounding for non-exact matches
  // Use numeric comparison to handle mixed types (e.g., "00" vs 0)
  const foundIndex = options.findIndex(
    (item) => Number(item.value) === Number(value)
  );
  let baseSelectedIndex = foundIndex;
  if (foundIndex < 0) {
    const nextIndex = options.findIndex(
      (item) => Number(item.value) >= Number(value)
    );
    baseSelectedIndex = nextIndex >= 0 ? nextIndex : 0;
  }

  const containerHeight = (1 + visibleRest * 2) * itemHeight;

  const paddedOptions = useMemo(() => {
    if (!enableLooping) {
      // Original behavior: add null padding
      const array: (PickerOption | null)[] = [...options];
      for (let i = 0; i < visibleRest; i++) {
        array.unshift(null);
        array.push(null);
      }
      return array;
    }

    // Looping: repeat 7 times for scroll room in both directions
    const core: (PickerOption | null)[] = [];
    for (let b = 0; b < REPEAT; b++) {
      core.push(...options);
    }
    // Add null padding
    for (let i = 0; i < visibleRest; i++) {
      core.unshift(null);
      core.push(null);
    }
    return core;
  }, [options, visibleRest, enableLooping]);

  const offsets = useMemo(
    () => [...Array(paddedOptions.length)].map((_, i) => i * itemHeight),
    [paddedOptions, itemHeight]
  );

  const [scrollY] = useState(new Animated.Value(0));
  const currentScrollIndex = useMemo(
    () => Animated.add(Animated.divide(scrollY, itemHeight), visibleRest),
    [visibleRest, scrollY, itemHeight]
  );

  // Calculate initial offset for looping mode (middle block)
  const baseLen = options.length;
  const initialTopIndex = enableLooping
    ? MID_BLOCK * baseLen + baseSelectedIndex
    : baseSelectedIndex;
  const initialOffset = initialTopIndex * itemHeight;

  // Seed position on mount using offset (more reliable than initialScrollIndex)
  useEffect(() => {
    // Small delay to ensure FlatList is fully mounted
    const timer = setTimeout(() => {
      if (enableLooping) {
        flatListRef.current?.scrollToOffset({
          offset: initialOffset,
          animated: false,
        });
      } else {
        flatListRef.current?.scrollToIndex({
          index: baseSelectedIndex,
          animated: false,
        });
      }
      // Mark as emitted after initial scroll to prevent onChange on mount
      setTimeout(() => {
        hasEmittedRef.current = true;
      }, 100);
    }, 10);

    return () => clearTimeout(timer);
  }, [initialOffset, baseSelectedIndex, enableLooping]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignore first settle to prevent mount-time emission
    if (!hasEmittedRef.current) return;

    if (!enableLooping) {
      // Original non-looping behavior
      const offsetY = Math.min(
        itemHeight * (options.length - 1),
        Math.max(event.nativeEvent.contentOffset.y, 0)
      );

      let index = Math.floor(offsetY / itemHeight);
      const remainder = offsetY % itemHeight;
      if (remainder > itemHeight / 2) {
        index++;
      }

      if (index !== baseSelectedIndex) {
        const option = options[index];
        if (option?.value != null) onChange(Number(option.value));
      }
      return;
    }

    // Looping: wrap index mathematically, no recentering needed
    const offsetY = Math.max(0, event.nativeEvent.contentOffset.y);
    let topIdx = Math.floor(offsetY / itemHeight);
    if (offsetY % itemHeight > itemHeight / 2) {
      topIdx++;
    }

    const baseIdx = wrap(topIdx, baseLen);
    if (baseIdx !== baseSelectedIndex) {
      const option = options[baseIdx];
      if (option?.value != null) onChange(Number(option.value));
    }
  };

  const handleMomentumScrollBegin = () => {
    momentumStarted.current = true;
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    momentumStarted.current = false;
    handleScrollEnd(event);
  };

  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetY = event.nativeEvent.contentOffset?.y;
    setTimeout(() => {
      if (!momentumStarted.current && offsetY !== undefined) {
        const syntheticEvent = {
          nativeEvent: { contentOffset: { y: offsetY } },
        };
        handleScrollEnd(syntheticEvent as any);
      }
    }, 50);
  };

  return (
    <View
      style={[styles.container, { height: containerHeight }, containerStyle]}
      {...containerProps}
    >
      <View
        style={[
          styles.selectedIndicator,
          selectedIndicatorStyle,
          {
            transform: [{ translateY: -itemHeight / 2 }],
            height: itemHeight,
          },
        ]}
        className={selectedIndicatorClassName}
      />
      <Animated.FlatList
        {...flatListProps}
        ref={flatListRef}
        nestedScrollEnabled
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        snapToOffsets={offsets}
        decelerationRate={decelerationRate}
        initialScrollIndex={enableLooping ? initialTopIndex : baseSelectedIndex}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        data={paddedOptions}
        keyExtractor={(item, index) =>
          item ? `${item.value}-${item.text}-${index}` : `null-${index}`
        }
        renderItem={({ item: option, index }) => (
          <WheelPickerItem
            key={`option-${index}`}
            index={index}
            option={option}
            style={itemStyle}
            textStyle={itemTextStyle}
            textClassName={itemTextClassName}
            height={itemHeight}
            currentScrollIndex={currentScrollIndex}
            scaleFunction={scaleFunction}
            rotationFunction={rotationFunction}
            opacityFunction={opacityFunction}
            visibleRest={visibleRest}
          />
        )}
      />
    </View>
  );
};

export default memo(WheelPicker);
