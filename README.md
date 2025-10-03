# rndtpkr

Fork of [react-native-ui-datepicker](https://github.com/farhoudshapouran/react-native-ui-datepicker).
Everything it does, just lighter and better.

**~49% smaller** (4.85 MB lighter) 🎉

## What's New

- **Auto time format** (`autoSystemFormat`)
  Auto 12h/24h detection

- **Minute stepping** (`minuteStep`)
  5/10/15/30 min intervals

- **Looping wheels** (`enableLooping`)
  23→00→01, 59→00→01
  Smart: only loops when 10+ options

- **Smart rounding**
  Next interval up

- **Type safety**
  "00" vs 0 fixed

## How We Made It Lighter

- **Dependencies**
  `lodash` (4.9 MB) → `dequal` (489 bytes)
  99% smaller!

- **Assets**
  PNG/SVG → Unicode `‹` `›`
  Zero bytes

- **Removed**
  Jalali calendar, extra numerals

- **Build**
  Tree-shaking + provenance

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
