#!/usr/bin/env node
import http from 'node:http'
import { URL } from 'node:url'
import { google } from 'googleapis'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
// GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-drive-token.mjs
// HARUS sama persis dengan yang kamu daftarkan di GCP
const REDIRECT_URI = 'http://localhost:3000/oauth2callback'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing env: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
})

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '', REDIRECT_URI)

    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404)
      return res.end('Not found')
    }

    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      res.writeHead(400)
      return res.end(`OAuth error: ${error}`)
    }
    if (!code) {
      res.writeHead(400)
      return res.end('Missing code')
    }

    const { tokens } = await oauth2Client.getToken(code)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Success. You can close this tab.\n')

    console.log('\n🎉 Berhasil! Tambahkan ke .env kamu:\n')
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`)
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`)
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token ?? ''}`)

    if (!tokens.refresh_token) {
      console.log('\n⚠️ refresh_token kosong. Biasanya karena kamu sudah pernah consent sebelumnya.')
      console.log('Cabut akses aplikasi di https://myaccount.google.com/permissions lalu jalankan lagi.')
    }

    server.close()
  } catch (e) {
    res.writeHead(500)
    res.end('Internal error')
    console.error('❌ Error:', e)
    server.close()
  }
})

server.listen(3000, () => {
  console.log('Buka URL ini di browser untuk login:')
  console.log(authUrl)
  console.log('\nMenunggu callback di:', REDIRECT_URI)
})
