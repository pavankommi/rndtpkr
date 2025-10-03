# rndtpkr

Fork of [react-native-ui-datepicker](https://github.com/farhoudshapouran/react-native-ui-datepicker) - does everything it does, just lighter and better.

**~49% smaller bundle** (4.85 MB lighter `node_modules`) 🎉

## What's New

- **Auto system time format** (`autoSystemFormat`) - Automatically detects 12h/24h from device settings
- **Minute stepping** (`minuteStep: 5 | 10 | 15 | 30`) - Snap to 5/10/15/30 minute intervals
- **Looping time wheels** (`enableLooping`) - Infinite scrolling (23→00→01, 59→00→01)
- **Smart rounding** - Non-exact times round up to next available interval
- **Type safety** - Fixed "00" vs 0 handling in time wheels

## How We Made It Lighter

- **Dependencies**: Swapped `lodash` (4.9 MB) for `dequal` (489 bytes) - **99% smaller!**
- **Assets**: Replaced PNG/SVG icons with Unicode chevrons (`‹` `›`) - **zero bytes**
- **Calendar**: Removed Jalali calendar support
- **Numerals**: Kept only Latin numerals
- **Build**: Added tree-shaking and npm provenance

## Installation

```bash
npm install rndtpkr
```

## Usage

```tsx
import DatePicker from 'rndtpkr';

<DatePicker
  mode="single"
  date={date}
  onChange={({ date }) => setDate(date)}
  timePicker={true}
  autoSystemFormat={true}  // NEW
  minuteStep={15}          // NEW
  enableLooping={true}     // NEW (default)
/>
```

## Contributing

PRs welcome!

## License

MIT
