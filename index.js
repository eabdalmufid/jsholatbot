// Telegram Bot

const { Telegraf } = require("telegraf");
const axios = require("axios");
const moment = require("moment-timezone");
require("dotenv").config();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const db = require("./lib/db");
const bot = new Telegraf(BOT_TOKEN, { telegram: { apiRoot: "https://api.telegram.org" } });
const client = bot.telegram;
const users = db.get("sholat");

bot.on("message", async (ctx) => {
  let chatId = ctx.message.chat.id;
  let msgId = ctx.message.message_id;
  let userId = ctx.message.from.id;
  let username = ctx.message.from.username || ctx.message.from.first_name;
  let isOwner = process.env.ID_TELEGRAM.includes(userId);
  let text = ctx.message.text || ctx.message.caption || "";
  let command = text.split(" ")[0];
  let args = text.split(" ").slice(1);

  if (ctx.message.location) {
    let userondb = await users.findOne({ id: userId });
    if (!userondb) {
      // get timezone
      let { data } = await axios.get(`https://api.aladhan.com/v1/timings/${moment.tz("Asia/Jakarta").format("DD-MM-yyyy")}?` + new URLSearchParams({
          latitude: ctx.message.location.latitude,
          longitude: ctx.message.location.longitude,
          method: 15,
        })
      );
      let { meta } = data.data;
      let { timezone } = meta;
      await users.insert({
        id: userId,
        username: username,
        latitude: ctx.message.location.latitude,
        longitude: ctx.message.location.longitude,
        timezone: timezone,
      });
      ctx.reply(`Yeyy, lokasi kamu berhasil disimpan. Ketik /jadwal untuk melihat jadwal sholat hari ini.`, { 
        reply_to_message_id: msgId, reply_markup: { remove_keyboard: true } 
      });
    } else {
      // get timezone
      let { data } = await axios.get(`https://api.aladhan.com/v1/timings/${moment.tz("Asia/Jakarta").format("DD-MM-yyyy")}?` + new URLSearchParams({
          latitude: ctx.message.location.latitude,
          longitude: ctx.message.location.longitude,
          method: 15,
        })
      );
      let { meta } = data.data;
      let { timezone } = meta;
      await users.update({ id: userId },{
          $set: {
            latitude: ctx.message.location.latitude,
            longitude: ctx.message.location.longitude,
            timezone: timezone,
          },
        }
      );
      await ctx.reply(`Yeyy, lokasi kamu berhasil diperbarui. Ketik /jadwal untuk melihat jadwal sholat hari ini.`,
        { reply_to_message_id: msgId, reply_markup: { remove_keyboard: true } }
      );
    }
  }

  switch (command) {
    case "/start":
      if (args[0] == "help") {
        let help = `Halo, <b><a href="tg://user?id=${userId}">${ctx.message.from.first_name}</a></b>! Ini adalah daftar perintah yang tersedia.\n\n<b>/jadwal</b> - Melihat jadwal sholat hari ini.\n<b>/quran</b> - Melihat ayat-ayat al-quran.\n<b>/listsurah</b> - Melihat list surah al-quran.\n<b>/tafsir</b> - Melihat tafsir ayat al-quran.\n<b>/hadits</b> - Melihat hadits-hadits nabi.\n<b>/kisahnabi</b> - Melihat kisah-kisah para nabi.\n<b>/help</b> - Melihat daftar perintah yang tersedia.`;
        return ctx.reply(help, {
          parse_mode: "HTML",
          reply_to_message_id: msgId,
        });
      }
      textshare = `Halo saya menggunakan bot jadwal sholat yang sangat mudah untuk digunakan.\nKamu juga bisa menggunakannya di https://t.me/${bot.options.username} 😍\n\nJangan lupa share ke teman-teman kamu ya!`;
      client.sendMessage(chatId, `Assalamualaikum <b><a href="tg://user?id=${userId}">${username}</a></b>.\nSelamat datang di ${bot.botInfo.first_name}!\n\nKirim lokasi kamu untuk menyimpan lokasi kamu.\nKetik /help untuk melihat daftar perintah yang tersedia.`, {
          parse_mode: "HTML",
          reply_to_message_id: msgId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `Contact`, url: `https://t.me/eabdalmufid` },
                { text: `Source Code`,url: `https://github.com/eabdalmufid/jsholatbot` },
              ],
              [
                { text: `Share`, url: `https://t.me/share/url?url=${encodeURIComponent(textshare)}` },
              ],
            ],
          },
        }
      );
      break;

    case "/jadwal":
      let user = await users.findOne({ id: userId });
      console.log(user);
      if (!user)
        return ctx.reply(`Kayaknya kamu belum menyimpan lokasi kamu. Kirim lokasi kamu terlebih dahulu.`, {
            reply_to_message_id: msgId,
            reply_markup: {
              keyboard: [[{ text: "Kirim Lokasi", request_location: true }]],
              resize_keyboard: true,
            },
          }
        );
      let { latitude, longitude } = user;
      let { data } = await axios.get(`https://api.aladhan.com/v1/timings/${moment.tz("Asia/Jakarta").format("DD-MM-yyyy")}?` + new URLSearchParams({ latitude, longitude, method: 15 }));
      let { timings } = data.data;
      let { Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha } = timings;
      let jadwal = `Halo, <b><a href="tg://user?id=${userId}">${username}</a></b>! Ini adalah jadwal sholat hari ini berdasarkan lokasi kamu.\n\n<b>Tanggal</b> : ${data.data.date.readable} (${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year})\n<b>Imsak</b> : ${Imsak}\n<b>Subuh</b> : ${Fajr}\n<b>Terbit</b> : ${Sunrise}\n<b>Dzuhur</b> : ${Dhuhr}\n<b>Ashar</b> : ${Asr}\n<b>Maghrib</b> : ${Maghrib}\n<b>Isya</b> : ${Isha}`;
      ctx.reply(jadwal, { parse_mode: "HTML", reply_to_message_id: msgId });
      break;

    case "/quran": {
      try {
        if (!(args[0] || args[1])) return ctx.reply(`Contoh Penggunaan:\n/quran 1 2\n\nMaka hasilnya adalah surah Al-Fatihah ayat 2 beserta audionya, dan ayatnya 1 aja`, { reply_to_message_id: msgId })
        if (isNaN(args[0]) || isNaN(args[1])) return ctx.reply(`Contoh Penggunaan:\n/quran 1 2\n\nMaka hasilnya adalah surah Al-Fatihah ayat 2 beserta audionya, dan ayatnya 1 aja`, { reply_to_message_id: msgId })
        let { data } = await axios.get("https://raw.githubusercontent.com/eabdalmufid/scrape/master/islami/quran.json")
        let mes = `\n` +
          `${data.data[args[0] - 1].verses[args[1] - 1].text.arab}\n\n` +
          `${data.data[args[0] - 1].verses[args[1] - 1].translation.id}\n` +
          `( Q.S ${data.data[args[0] - 1].name.transliteration.id} : ${data.data[args[0] - 1].verses[args[1] - 1].number.inSurah} )\n`.trim()
        ctx.reply(mes, { reply_to_message_id: msgId })
        ctx.replyWithAudio({ url: data.data[args[0] - 1].verses[args[1] - 1].audio.primary, filename: `${data.data[args[0] - 1].name.transliteration.id} - ${data.data[args[0] - 1].verses[args[1] - 1].number.inSurah}.mp3` })
      } catch {
        ctx.reply(`Data yang diinput tidak valid`, { reply_to_message_id: msgId })
      }
    }
      break;

    case "/listsurah": {
      let { data } = await axios.get("https://raw.githubusercontent.com/eabdalmufid/scrape/master/islami/quran.json")
      let list = "List Surah:\n"
      for (let i = 0; i < 114; i++) {
        list += `${i + 1}. ${data.data[i].name.transliteration.id}\n`
      }
      ctx.reply(list, { reply_to_message_id: msgId })
    }
      break;

    case "/tafsir": {
      try {
        if (!(args[0] || args[1])) return ctx.reply(`Contoh Penggunaan:\n/tafsir 1 2\n\nMaka hasilnya adalah tafsir surah Al-Fatihah ayat 2`, { reply_to_message_id: msgId })
        if (isNaN(args[0]) || isNaN(args[1])) return ctx.reply(`Contoh Penggunaan:\n/tafsir 1 2\n\nMaka hasilnya adalah tafsir surah Al-Fatihah ayat 2`, { reply_to_message_id: msgId })
        let { data } = await axios.get("https://raw.githubusercontent.com/eabdalmufid/scrape/master/islami/quran.json")
        ctx.reply(data.data[args[0] - 1].verses[args[1] - 1].tafsir.id.short, { reply_to_message_id: msgId })
      } catch {
        ctx.reply(`Data yang diinput tidak valid`, { reply_to_message_id: msgId })
      }
    }
      break;

    case "/hadits": {
      if (!(args[0] || args[1])) return ctx.reply(`Contoh Penggunaan:\n/hadits 1 2\n\nMaka hasilnya adalah hadits Abu Dawud ke 2`, { reply_to_message_id: msgId })
      if (isNaN(args[0]) || isNaN(args[1])) return ctx.reply(`Contoh Penggunaan:\n/hadits 1 2\n\nMaka hasilnya adalah hadits Abu Dawud ke 2`, { reply_to_message_id: msgId })
      let url = "https://raw.githubusercontent.com/eabdalmufid/scrape/master/islami/hadits/"

      const listResponse = await axios.get(url + "list.json")
      const listData = listResponse.data;
      let list = "Data yang diinput tidak valid!\n\n"
      for (let i = 0; i < listData.length; i++) {
        list += `${i + 1}. ${listData[i].name}, total ${listData[i].total} hadits\n`
      }

      try {
        const { data } = await axios.get(url + listData[args[0] - 1].slug + ".json")
        let result = ` Hadist ${listData[args[0] - 1].name} ke - ${data[args[1] - 1].number}\n\n` +
          `${data[args[1] - 1].arab}\n\n` +
          `Artinya:\n${data[args[1] - 1].id}`
        ctx.reply(result)
      } catch {
        ctx.reply(list, { reply_to_message_id: msgId })
      }
    }
      break

    case "/kisahnabi": {
      if (!args[0]) return ctx.reply("Contoh Penggunaan:\n/kisahnabi adam\n/kisahnabi 1", { reply_to_message_id: msgId });
      if (args[1]) return ctx.reply("Contoh Penggunaan:\n/kisahnabi adam\n/kisahnabi 1", { reply_to_message_id: msgId });
      const { data } = await axios.get("https://raw.githubusercontent.com/eabdalmufid/scrape/master/islami/kisahnabi.json")

      let list = "Data yang diinput tidak valid!\n\n"
      for (let i = 0; i < 25; i++) {
        list += `${i + 1}. ${data.data[i].nama}\n`
      }

      try {
        if (isNaN(args[0])) {
          const lowercase = args[0].toLowerCase();
          const nonLetterRegex = /[^a-z]/g;
          const cleaned = lowercase.replace(nonLetterRegex, "");

          for (let i = 0; i < data.data.length; i++) {
            if (data.data[i].key === cleaned) {
              let mes = `<b>${data.data[i].nama}</b>\n\n` +
                `${data.data[i].kisah}\n\n` +
                `<i>Pesan Penting: ${data.data[i].pesan_penting}</i>\n\n` +
                `Tempat Kelahiran: ${data.data[i].tempat_kelahiran}\n` +
                `Tanggal Kelahiran: ${data.data[i].tanggal_kelahiran}\n` +
                `Tempat Wafat: ${data.data[i].tempat_wafat}\n` +
                `Tanggal Wafat: ${data.data[i].tanggal_wafat}\n`.trim()
              return ctx.replyWithPhoto({ url: data.data[i].image_url }, { caption: mes, parse_mode: "HTML", reply_to_message_id: msgId })
            }
          }
          ctx.reply(list, { reply_to_message_id: msgId })
        } else {
          let mes = `<b>${data.data[args[0] - 1].nama}</b>\n\n` +
            `${data.data[args[0] - 1].kisah}\n\n` +
            `<i>Pesan Penting: ${data.data[args[0] - 1].pesan_penting}</i>\n\n` +
            `Tempat Kelahiran: ${data.data[args[0] - 1].tempat_kelahiran}\n` +
            `Tanggal Kelahiran: ${data.data[args[0] - 1].tanggal_kelahiran}\n` +
            `Tempat Wafat: ${data.data[args[0] - 1].tempat_wafat}\n` +
            `Tanggal Wafat: ${data.data[args[0] - 1].tanggal_wafat}\n`.trim()
          ctx.replyWithPhoto({ url: data.data[args[0] - 1].image_url }, { caption: mes, parse_mode: "HTML", reply_to_message_id: msgId })
        }
      } catch {
        ctx.reply(list, { reply_to_message_id: msgId })
      }
    }
      break

    case "/help":
      let help = `Halo, <b><a href="tg://user?id=${userId}">${username}</a></b>! Ini adalah daftar perintah yang tersedia.\n\n<b>/jadwal</b> - Melihat jadwal sholat hari ini.\n<b>/quran</b> - Melihat ayat-ayat al-quran.\n<b>/listsurah</b> - Melihat list surah al-quran.\n<b>/tafsir</b> - Melihat tafsir ayat al-quran.\n<b>/hadits</b> - Melihat hadits-hadits nabi.\n<b>/kisahnabi</b> - Melihat kisah-kisah para nabi.\n<b>/help</b> - Melihat daftar perintah yang tersedia.`;
      ctx.reply(help, { parse_mode: "HTML", reply_to_message_id: msgId });
      break;

    case "/eval": case ">":
      if (!isOwner) return ctx.reply("You are not my owner.", { reply_to_message_id: msgId });
      if (args.length == 0) return ctx.reply("Send me a code for execute.", { reply_to_message_id: msgId });
      let code = args.join(" ");
      try {
        let evaled = await eval(`(async () => { ${code} })()`);
        if (typeof evaled !== "string") evaled = require("util").inspect(evaled, { depth: 7 });
        ctx.reply(evaled, { reply_to_message_id: msgId });
      } catch (err) {
        ctx.reply(err, { reply_to_message_id: msgId });
      }
      break;

    default:
      // Show button url help
      if (!text) return;
      if (ctx.message.chat.type !== "private") return;
      ctx.reply(`Maaf, perintah yang kamu masukkan tidak valid. Silahkan cek daftar perintah yang tersedia.`, {
          reply_to_message_id: msgId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Bantuan", url: `https://t.me/${bot.botInfo.username}?start=help` },
              ],
            ],
          },
        }
      );
  }
});

//   console.log("Connected correctly to server database");
db.then(() => {
  bot.launch();
  client.getMe().then((botInfo) => {
      bot.options.username = botInfo.username;
      console.log(`Bot ${botInfo.username} is running...`);
    }).catch((err) => console.log(err));
}).catch((err) => console.log(err));
