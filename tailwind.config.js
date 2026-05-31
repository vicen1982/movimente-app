/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Movimente (naranja + negro)
        primary: {
          DEFAULT: '#E85A0C',      // Naranja Movimente — botones, acciones, acentos
          light: '#FDE4D2',        // Naranja claro — fondos suaves, highlights
          dark: '#B8430A',         // Naranja oscuro — hover states
        },
        secondary: {
          DEFAULT: '#0F0F0F',      // Negro Movimente — fondos de portada, headers
          soft: '#1F1F1F',         // Negro suave — cards oscuras
        },
        accent: {
          DEFAULT: '#0F6E56',      // Verde teal — PRs, logros, destacados
          light: '#E1F5EE',        // Verde claro — badges de logros
        },
        bg: '#FAFAF7',             // Off-white cálido — fondo general
        surface: '#FFFFFF',        // Blanco — cards, inputs
        text: {
          DEFAULT: '#1A1A1A',      // Texto principal
          muted: '#6B6B6B',        // Texto secundario
          inverse: '#FAFAF7',      // Texto sobre fondos oscuros
        },
        border: '#D6D6D0',         // Bordes
        // Grupos musculares (sin cambios — son de uso semántico)
        pecho: '#F5C4B3',
        espalda: '#B5D4F4',
        piernas: '#9FE1CB',
        hombros: '#FAC775',
        brazos: '#CECBF6',
        core: '#F4C0D1',
        cardio: '#FFD4A3',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}