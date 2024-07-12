# JSOLAT-BOT
Bot telegram buat ngecek jadwal sholat

## Cara Install
1. Clone repo ini
```bash	
git clone https://github.com/eabdalmufid/jsholatbot
```	
2. Install dependensi
```bash
npm install
```
3. Copy fie .env.example
```
cp .env.example .env
```
4. Isi .env
- Untuk `MONGO_URI` bisa diisi dengan mongo uri dari [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) atau mongo uri lokal
- Untuk `TELEGRAM_BOT_TOKEN` bisa diisi dengan token bot telegram dari [@BotFather](https://t.me/BotFather), ketik dengan perintah `/newbot` lalu ikuti petunjuknya
- Untuk `ID_TELEGRAM` bisa diisi dengan id telegram anda dari [@getmyid_bot](https://t.me/getmyid_bot), ketik dengan perintah `/start`
5. Jalankan bot
```bash
npm start
```

## Cara Pakai
1. Chat ke bot telegram
2. Ketik `/start` untuk memulai
3. Ketik `/help` untuk bantuan

## Kontak
Jika mengalami kesulitan, silahkan kontak saya di 
- [Telegram](https://t.me/eabdalmufid)
- [Instagram](https://instagram.com/eabdlmufid)

## Lisensi
[Apache License 2.0](LICENSE)