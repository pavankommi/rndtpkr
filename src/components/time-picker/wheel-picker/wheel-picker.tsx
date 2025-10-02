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
  Platform,
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
  const selectedIndex = options.findIndex((item) => item.value === value);

  const flatListRef = useRef<FlatList>(null);
  const [scrollY] = useState(new Animated.Value(selectedIndex * itemHeight));

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

    // NEW: Triple the array for seamless looping
    return [...options, ...options, ...options];
  }, [options, visibleRest, enableLooping]);

  const offsets = useMemo(
    () => [...Array(paddedOptions.length)].map((_, i) => i * itemHeight),
    [paddedOptions, itemHeight]
  );

  const currentScrollIndex = useMemo(
    () => Animated.add(Animated.divide(scrollY, itemHeight), visibleRest),
    [visibleRest, scrollY, itemHeight]
  );

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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

      if (index !== selectedIndex) {
        onChange(options[index]?.value || 0);
      }
      return;
    }

    // NEW: Looping behavior
    const offsetY = event.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / itemHeight);

    // Check if we're in first or third segment and need to reposition
    if (index < options.length) {
      // In first segment, jump to middle segment
      const targetIndex = index + options.length;
      flatListRef.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
      });
      index = targetIndex;
    } else if (index >= options.length * 2) {
      // In third segment, jump back to middle
      const targetIndex = index - options.length;
      flatListRef.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
      });
      index = targetIndex;
    }

    // Calculate the actual value index (modulo)
    const valueIndex = index % options.length;
    onChange(options[valueIndex]?.value || 0);
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
    // Capture the offset value immediately
    const offsetY = event.nativeEvent.contentOffset?.y;

    // We'll start a short timer to see if momentum scroll begins
    setTimeout(() => {
      // If momentum scroll hasn't started within the timeout,
      // then it was a slow scroll that won't trigger momentum
      if (!momentumStarted.current && offsetY !== undefined) {
        // Create a synthetic event with just the data we need
        const syntheticEvent = {
          nativeEvent: {
            contentOffset: { y: offsetY },
          },
        };
        handleScrollEnd(syntheticEvent as any);
      }
    }, 50);
  };

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error(
        `Selected index ${selectedIndex} is out of bounds [0, ${
          options.length - 1
        }]`
      );
    }
  }, [selectedIndex, options]);

  /**
   * If selectedIndex is changed from outside (not via onChange) we need to scroll to the specified index.
   * This ensures that what the user sees as selected in the picker always corresponds to the value state.
   */
  useEffect(() => {
    if (!enableLooping) {
      flatListRef.current?.scrollToIndex({
        index: selectedIndex,
        animated: Platform.OS === 'ios',
      });
    } else {
      // For looping, scroll to middle segment
      const middleIndex = selectedIndex + options.length;
      flatListRef.current?.scrollToIndex({
        index: middleIndex,
        animated: Platform.OS === 'ios',
      });
    }
  }, [selectedIndex, itemHeight, enableLooping, options.length]);

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
        initialScrollIndex={
          enableLooping ? selectedIndex + options.length : selectedIndex
        }
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
