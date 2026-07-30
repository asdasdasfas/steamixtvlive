import { TelegramClient } from 'gramjs'
import { StringSession } from 'gramjs/sessions/index.js'
import readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const q = (s) => new Promise(r => rl.question(s, r))

async function main() {
  console.log('=== TELEGRAM GRUP KURULUMU ===')
  const apiId = Number(await q('API ID: '))
  const apiHash = await q('API Hash: '))
  const phone = await q('Telefon (Orn: +905551234567): ')

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 })
  await client.start({
    phoneNumber: () => phone,
    password: async () => {
      const pw = await q('Varsa 2 adimli sifre (yoksa bos gec): ')
      return pw
    },
    phoneCode: async () => await q('Telegrama gelen kodu gir: '),
    onError: e => console.log('Hata:', e.message)
  })
  console.log('\nGiris basarili!\n')

  // Get groups
  const dialogs = await client.getDialogs({})
  const groups = dialogs.filter(d => d.isGroup)
  console.log('Gruplarin:')
  groups.forEach((g, i) => console.log(`${i+1}. ${g.name}`))

  const idx = Number(await q('\nHangi grup? (sayi): ')) - 1
  const chat = groups[idx]?.entity
  if (!chat) { console.log('Grup secilmedi!'); rl.close(); return }

  console.log(`\nSecilen: ${chat.title}\n`)

  // Delete username to make private
  try {
    await client.invoke({
      _: 'channels.updateUsername',
      channel: chat.id,
      username: ''
    })
    console.log('[OK] Gizli grup yapildi')
  } catch(e) { console.log('[!] Gizli yapilamadi:', e.message) }

  // Ban bots from sending
  try {
    await client.invoke({
      _: 'channels.editBanned',
      channel: chat.id,
      participant: {
        _: 'inputChannel',
        channelId: chat.id?.channelId || chat.id,
        accessHash: chat.accessHash || BigInt(0)
      },
      bannedRights: {
        _: 'chatBannedRights',
        untilDate: 0,
        viewMessages: false,
        sendMessages: false,
        sendMedia: false,
        sendStickers: false,
        sendGifs: false,
        sendGames: false,
        sendInline: false,
        embedLinks: false,
        sendPolls: false,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true
      }
    })
    console.log('[OK] Bot kisitlamasi yapildi')
  } catch(e) { console.log('[!] Bot kisitlamasi basarisiz:', e.message) }

  // Enable join requests
  try {
    await client.invoke({
      _: 'messages.editChatDefaultBannedRights',
      peer: chat.id,
      bannedRights: {
        _: 'chatBannedRights',
        untilDate: 0,
        viewMessages: false,
        sendMessages: false,
        sendMedia: false,
        sendStickers: false,
        sendGifs: false,
        sendGames: false,
        sendInline: false,
        embedLinks: false,
        sendPolls: false,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true
      }
    })
    console.log('[OK] Katilma onayi etkin')
  } catch(e) { console.log('[!] Katilma onayi basarisiz:', e.message) }

  console.log('\n=== TAMAM! ===')
  rl.close()
}

main().catch(e => { console.log('HATA:', e.message); rl.close() })
