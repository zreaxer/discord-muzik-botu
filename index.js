const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YouTubePlugin()]
});

const PREFIX = '!'; // Komut ön eki (Örn: !play)

client.on('ready', () => {
    console.log(`🤖 ${client.user.tag} başarıyla aktif oldu!`);
    client.user.setActivity('🎶 Müziğin Ritmini | !play', { type: 3 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !play <şarkı adı veya link>
    if (command === 'play' || command === 'p') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Önce bir ses kanalına katılmalısın!');
        }
        
        const query = args.join(' ');
        if (!query) return message.reply('❌ Lütfen bir şarkı adı veya linki girin! (Örn: `!play reynmen`)');

        message.channel.send(`🔍 **${query}** aranıyor...`);
        distube.play(voiceChannel, query, {
            textChannel: message.channel,
            member: message.member
        });
    }

    // !stop
    if (command === 'stop' || command === 's') {
        distube.stop(message);
        message.channel.send('⏹️ Müzik durduruldu ve kanaldan ayrıldım.');
    }

    // !skip
    if (command === 'skip' || command === 'geç') {
        distube.skip(message).catch(err => message.channel.send('❌ Sırada atlanacak başka şarkı yok!'));
        message.channel.send('⏭️ Şarkı atlandı!');
    }

    // !queue
    if (command === 'queue' || command === 'sıra') {
        const queue = distube.getQueue(message);
        if (!queue) return message.channel.send('❌ Şu an çalan bir şarkı yok.');
        
        const q = queue.songs
            .map((song, i) => `${i === 0 ? '▶️ **Çalan:**' : `**${i}.**`} ${song.name} - \`${song.formattedDuration}\``)
            .slice(0, 10)
            .join('\n');

        message.channel.send(`🎶 **Şarkı Sırası:**\n${q}`);
    }
});

// Şarkı başladığında mesaj atma
distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎵 Şimdi Çalıyor: **${song.name}** - \`${song.formattedDuration}\``);
});

distube.on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ Sıraya eklendi: **${song.name}** - \`${song.formattedDuration}\``);
});

distube.on('error', (channel, e) => {
    if (channel) channel.send(`❌ Bir hata oluştu: ${e.message.slice(0, 200)}`);
    console.error(e);
});

client.login(process.env.TOKEN);
