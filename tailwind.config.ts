import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(217 20% 85%)',
				input: 'hsl(217 20% 85%)',
				ring: 'hsl(217 10% 45%)',
				background: 'hsl(220 15% 98%)',
				foreground: 'hsl(220 15% 20%)',
				primary: {
					DEFAULT: 'hsl(217 10% 35%)',
					foreground: 'hsl(0 0% 98%)'
				},
				secondary: {
					DEFAULT: 'hsl(220 10% 96%)',
					foreground: 'hsl(220 10% 30%)'
				},
				muted: {
					DEFAULT: 'hsl(220 10% 96%)',
					foreground: 'hsl(220 10% 50%)'
				},
				accent: {
					DEFAULT: 'hsl(220 15% 92%)',
					foreground: 'hsl(220 10% 25%)'
				},
				destructive: {
					DEFAULT: 'hsl(0 70% 50%)',
					foreground: 'hsl(210 40% 98%)'
				},
				sidebar: {
					DEFAULT: 'hsl(220 10% 98%)',
					foreground: 'hsl(220 10% 30%)',
					primary: 'hsl(217 10% 35%)',
					'primary-foreground': 'hsl(0 0% 98%)',
					accent: 'hsl(220 10% 94%)',
					'accent-foreground': 'hsl(220 10% 35%)',
					border: 'hsl(220 10% 90%)',
					ring: 'hsl(220 10% 60%)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
