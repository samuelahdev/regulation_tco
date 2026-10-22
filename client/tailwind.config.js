export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { lagon: { 900: '#0A2F3C', 800: '#0E4152', 700: '#13566B', 100: '#DCEBEF', 50: '#F1F6F7' }, soleil: '#F2B84B' },
    fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'] }
  } }
}
