# rndtpkr

Fork of [react-native-ui-datepicker](https://github.com/farhoudshapouran/react-native-ui-datepicker) - does everything it does, except lighter and better.

**~49% smaller bundle size**

## Added (to make it better)

- **Auto system time format** - Automatically detects 12h/24h from device settings
- **Minute stepping** - Snap to 5/10/15/30 minute intervals
- **Looping time wheels** - Infinite scrolling (23→00→01, 59→00→01)

## Removed (to keep it lightweight)

- Jalali calendar support
- Multiple numeral systems (kept only Latin)
- Custom component props
- Unused locales

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
