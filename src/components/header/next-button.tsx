import React, { memo, useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import { YEAR_PAGE_SIZE } from '../../utils';
import { ClassNames, Styles } from '../../types';
import { UI } from '../../ui';
import { dequal as isEqual } from 'dequal';
import { COLORS } from '../../theme';

type NextButtonProps = {
  style?: Styles[UI.button_next];
  imageStyle?: Styles[UI.button_next_image];
  className?: ClassNames[UI.button_next];
  imageClassName?: ClassNames[UI.button_next_image];
};

const NextButton = ({ style, className }: NextButtonProps) => {
  const {
    currentYear,
    onChangeMonth,
    onChangeYear,
    calendarView,
    components = {},
    isRTL,
  } = useCalendarContext();

  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const defaultStyles = useMemo(() => createDefaultStyles(isRTL), [isRTL]);

  const onPress = useCallback(() => {
    switch (calendarView) {
      case 'day':
        return onChangeMonth(1);
      case 'month':
        return onChangeYear(currentYear + 1);
      case 'year':
        return onChangeYear(currentYear + YEAR_PAGE_SIZE);
      default:
        return {};
    }
  }, [calendarView, currentYear, onChangeMonth, onChangeYear]);

  return (
    <Pressable
      disabled={calendarView === 'time'}
      onPress={onPress}
      testID="btn-next"
      accessibilityRole="button"
      accessibilityLabel="Next"
    >
      <View
        style={[defaultStyles.iconContainer, defaultStyles.next, style]}
        className={className}
      >
        {components.IconNext || (
          <Text style={{ color: COLORS[theme].foreground, fontSize: 20 }}>
            ›
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const customComparator = (
  prev: Readonly<NextButtonProps>,
  next: Readonly<NextButtonProps>
) => {
  const areEqual =
    prev.className === next.className &&
    isEqual(prev.style, next.style) &&
    isEqual(prev.imageStyle, next.imageStyle) &&
    isEqual(prev.imageClassName, next.imageClassName);

  return areEqual;
};

export default memo(NextButton, customComparator);

const createDefaultStyles = (isRTL: boolean) =>
  StyleSheet.create({
    iconContainer: {
      padding: 4,
    },
    next: {
      marginLeft: isRTL ? 0 : 3,
      marginRight: isRTL ? 3 : 0,
    },
    icon: {
      width: 14,
      height: 14,
      transform: [{ rotate: isRTL ? '180deg' : '0deg' }],
    },
  });
