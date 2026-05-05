/**
 * theme.config.ts — Configuração de tema dinâmico
 *
 * O cliente pode personalizar aqui as cores, fontes e informações do site
 * sem precisar mexer no código principal.
 */

export const themeConfig = {
  // ── Identidade ──────────────────────────────────────────────────────────
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Karibe N.A',
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Crie produtos personalizados com sua arte',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5544999999999',

  // ── Paleta de cores principal ────────────────────────────────────────────
  // Troque os valores hex para a cor desejada.
  // As variáveis CSS são aplicadas globalmente em globals.css.
  colors: {
    brand: {
      50: '#fef9ec',
      100: '#fdf0c4',
      200: '#fbe18b',
      300: '#f8cc4a',
      400: '#f5b81a',
      500: '#e99c08', // cor principal
      600: '#cc7a04',
      700: '#a85807',
      800: '#89430e',
      900: '#713810',
    },
    // Cor de fundo do site
    background: '#0f0f0f',
    // Cor do texto principal
    foreground: '#f5f5f5',
    // Cor de superfície (cards, modais)
    surface: '#1a1a1a',
    // Cor de borda
    border: '#2a2a2a',
  },

  // ── Fontes ────────────────────────────────────────────────────────────────
  // Para usar fontes do Google, importe em layout.tsx
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
};

export type ThemeConfig = typeof themeConfig;
