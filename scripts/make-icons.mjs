// One-time icon generator: renders public/favicon.svg to PWA icon PNGs.
// Run: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('public/favicon.svg')

// Squared icon (favicon artwork already has its own rounded-rect background)
await sharp(svg, { density: 600 }).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg, { density: 600 }).resize(512, 512).png().toFile('public/icon-512.png')

// Maskable: artwork must occupy the inner ~80% safe zone on a filled background
const pad = Math.round(512 * 0.1)
const inner = 512 - pad * 2
const innerPng = await sharp(svg, { density: 600 }).resize(inner, inner).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0e2a26' },
})
  .composite([{ input: innerPng, left: Math.round(pad), top: Math.round(pad) }])
  .png()
  .toFile('public/icon-maskable-512.png')

console.log('icons written: icon-192.png, icon-512.png, icon-maskable-512.png')