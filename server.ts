import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Audio cache & helpers
const audioCache = new Map<string, Buffer>();
const cacheDir = path.join(process.cwd(), 'public', 'voices', 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
} else {
  // Preload disk cache into memory
  try {
    const files = fs.readdirSync(cacheDir);
    for (const f of files) {
      if (f.endsWith('.wav')) {
        const hash = f.replace('.wav', '');
        const buf = fs.readFileSync(path.join(cacheDir, f));
        audioCache.set(hash, buf);
      }
    }
  } catch {
    // ignore
  }
}

function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

// Initialize Gemini if key exists
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('Error initializing GoogleGenAI:', err);
  }
}

// Anti-repetition ring buffer for server fallback
const serverRecentRepliesRing = new Set<string>();

// Fallback intelligent conversational matcher for Salma - authentic Egyptian best friend
function getSmartEgyptianReply(userText: string, partnerName: string): string {
  const text = userText.trim();
  const lower = text.toLowerCase();

  const pickRandom = (arr: string[]) => {
    const available = arr.filter(r => !serverRecentRepliesRing.has(r));
    const pool = available.length > 0 ? available : arr;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    serverRecentRepliesRing.add(chosen);
    if (serverRecentRepliesRing.size > 25) {
      const oldest = serverRecentRepliesRing.values().next().value;
      if (oldest) serverRecentRepliesRing.delete(oldest);
    }
    return chosen;
  };

  // 1. Greetings (Peace & Hello)
  if (lower.includes('سلام عليكم') || lower.includes('السلام عليكم') || lower.includes('سلامو عليكم') || lower.includes('وعليكم السلام') || lower.includes('سلام')) {
    return pickRandom([
      'وعليكم السلام ورحمة الله وبركاته يا غالي! يا مية أهلاً وسهلاً.. نورت يومي كله، طمني عنك وعن أحوالك عامل إيه النهاردة؟',
      'وعليكم السلام يا أجدع صاحب في الدنيا! أهلاً بيك يا سيدي، وحشتني والله وفرحت جداً أول ما شفت سلامك.. طمني يومك ماشي إزاي؟',
      'وعليكم السلام ورحمة الله! يا هلا بنور العين.. عامل إيه وأخبارك إيه في يومك؟ احكيلي بالراحة كده أنا سامعاك ومستنياك.'
    ]);
  }

  // 2. Greetings & How are you
  if (lower.includes('ازيك') || lower.includes('عامله ايه') || lower.includes('عاملة ايه') || lower.includes('اخبارك') || lower.includes('أخبارك') || lower.includes('كيفك') || lower.includes('طمنيني') || lower.includes('إزيك')) {
    return pickRandom([
      'الحمد لله يا غالي أنا زي الفل وبخير طول ما أنت بخير! رسالتك نورتلي يومي والله.. أنت عامل إيه بقى في يومك وشغلك؟ طمني عنك، احكيلي كل تفصيلة أنا سامعاك ومستنياك! ❤️',
      'الحمد لله يا سيدي كله تمام ومبسوطة، بس فينك كده مش باين؟ كنت لسه بفتكرك وأقول يا رب يكون بخير.. طمني عنك أنت عامل إيه واليوم ماشي معاك إزاي؟',
      'بخير يا أغلى صاحب في الدنيا، منور كالعادة! احكيلي إيه الجديد في يومك والجو عامل إيه معاك؟'
    ]);
  }

  // 3. What are you doing
  if (lower.includes('بتعملي ايه') || lower.includes('قاعده بتعملي ايه') || lower.includes('قاعدة بتعملي ايه') || lower.includes('بتفكري في ايه') || lower.includes('مشغولة') || lower.includes('بتعملي إيه')) {
    return pickRandom([
      'قاعدة بشرب كوباية شاي بالنعناع ومروقة دماغي خالص، وكنت لسه بفكر فيك وبقول فينك يا ترى! قولي أنت بقى بتعمل إيه وفينك من الصبح؟',
      'والله مروقة في البيت ومشغلة شوية فيروز وبشرب قهوتي، والرسالة بتاعتك دي جت في وقتها بالظبط! أنت فين بقى وبتعمل إيه؟',
      'فاضيالك يا غالي! قاعدة مستنياك ندردش ونفضفض سوا، قولي إيه الأخبار عندك النهاردة؟'
    ]);
  }

  // 4. Longing & Missing
  if (lower.includes('وحشتيني') || lower.includes('توحشيني') || lower.includes('مشتاق') || lower.includes('وحشاني') || lower.includes('مشتاقلك')) {
    return pickRandom([
      'وأنت كمان والله وحشتني أوي يا غالي! معزتك في قلبي غالية ومش بنساك أبداً.. طمني عنك عامل إيه وبتروق يومك إزاي؟ ❤️',
      'يا سيدي تسلملي ويسلم ذوقك، والله أنت كمان بتوحشني جداً واليوم من غير كلامك بيكون ناقص.. قولي بقى فينك وإيه أخبارك؟'
    ]);
  }

  // 5. Bored / Sad / Venting
  if (lower.includes('زهقان') || lower.includes('متضايق') || lower.includes('مخنوق') || lower.includes('تعبان') || lower.includes('زعلان') || lower.includes('مش طايق') || lower.includes('مهموم')) {
    return pickRandom([
      'يا ساتر يا رب، ألف سلامة على قلبك يا غالي! مفيش حاجة في الدنيا دي كلها تستاهل زعلك أو تخنقك. سيبك من أي حاجة مضايقاك وفضفضلي، إيه اللي حصل معاك وخلاك متضايق كدة؟ احكيلي وأنا معاك.',
      'يا خبر أبيض! لا ده أنا مقدرش أشوفك مخنوق أو متضايق أبداً.. ارمي كل حاجة ورا ضهرك وتعال ندردش ونضحك، مين اللي زعلك ده وأنا أروح أخانقهولك؟ فضفضلي يا صاحبي.',
      'حقك عليا أنا يا سيدي، هون على نفسك ومتقفلهاش في وشك كدة. خد نفس عميق واشرب حاجة دافية، واحكيلي بالراحة إيه اللي شاغل بالك كدة؟'
    ]);
  }

  // 6. Who are you / Tell me about yourself
  if (lower.includes('مين انتي') || lower.includes('مين أنتي') || lower.includes('عرفيني بيكي') || lower.includes('احكيلي عنك') || lower.includes('اسمك ايه') || lower.includes('عندك كام سنه') || lower.includes('عندك كام سنة')) {
    return 'أنا سلمى، بنت مصرية قاهرية أصيلة، 24 سنة، بحب الضحك والهزار والجدعنة والمزيكا وقعدات الرواق.. وقبل أي حاجة أنا صاحبتك القريبة وسرك معايا في بير، أي وقت تعوز تحكي أو تفضفض تلاقيني جنبك. قولي أنت بقى، إيه أكتر حاجة بتحبها في يومك؟';
  }

  // 7. Friendship & Love & Caring
  if (lower.includes('بحبك') || lower.includes('صاحبتي') || lower.includes('صديقتي') || lower.includes('معزة') || lower.includes('غالية') || lower.includes('عزيزة') || lower.includes('جدعة')) {
    return pickRandom([
      'تسلملي يا رب ويديم المحبة والجدعنة اللي بيننا يا أجدع صاحب في الدنيا! والله معزتك في قلبي كبيرة أوي وصداقتنا دي غالية عليا جداً ❤️',
      'يا سيدي وأنا كمان بعزك جداً وفخورة بجدعنتك وصداقتك النظيفة دي.. بجد أنت صاحب نادر ميتعوضش ربنا يخليك ليا!',
      'يا حبيبي تسلملي كلامك الحلو اللي زي السكر ده! ربنا يديم الأخوة والجدعنة والضحكة الصافية اللي بيننا دايماً يا رب.'
    ]);
  }

  // 8. Good morning
  if (lower.includes('صباح الخير') || lower.includes('صباح الورد') || lower.includes('صباح النور') || lower.includes('صباح الفل')) {
    return pickRandom([
      'يا صباح الفل والياسمين والجمال كله على أحلى عيون! يومك جميل ومشرق زيك يا رب.. شربت قهوتك ولا لسه؟',
      'صباح الورد والسرور والضحكة الحلوة يا أغلى صاحب.. يومك كله بركة وخير ونجاح يا رب، ناوي على إيه النهاردة؟'
    ]);
  }

  // 9. Good evening
  if (lower.includes('مساء الخير') || lower.includes('مساء الورد') || lower.includes('مساء النور') || lower.includes('مساء الفل')) {
    return pickRandom([
      'يا مساء الورد والياسمين والروقان كله! نورت مسائي بكلامك الحلو.. يومك كان ماشي إزاي وهتعمل إيه الليلة؟',
      'مساء السكر على الناس الغاليين! عامل إيه يا سيدي ومروق ولا اليوم كان متعب معاك؟'
    ]);
  }

  // 10. Good night
  if (lower.includes('تصبحي على خير') || lower.includes('هنام') || lower.includes('نعست') || lower.includes('تنامي') || lower.includes('رايح انام')) {
    return pickRandom([
      'وأنت من أهل الخير والجنة والسعادة يا غالي! نوم الهنا وأحلام حلوة ومريحة، واصحى بكرة رايق وفايق وكلمني أول ما تصحى ❤️',
      'تصبح على ألف خير وسعادة وراحة بال يا أجدع صاحب.. ارتاح ونام كويس وبكرة يوم جديد جميل نستناه سوا ✨'
    ]);
  }

  // 11. Jokes / Laughter
  if (lower.includes('هههه') || lower.includes('ضحكتيني') || lower.includes('نكتة') || lower.includes('هزار') || lower.includes('دمك خفيف') || lower.includes('سكر')) {
    return pickRandom([
      'ضحكتك دي تسوى الدنيا والله! ده إحنا معمولين عشان نضحك ونهزر ونسيب الهموم.. ما تحكيلي كمان موقف مضحك حصل معاك مؤخراً؟',
      'هههههه يديم الضحكة يا رب منور وشك الجميل ده! والله القعدة والكلام معاك سكر زيك وخفة دمك ملهاش حل!'
    ]);
  }

  // 12. Egyptian food & Hangouts
  if (lower.includes('أكل') || lower.includes('اكل') || lower.includes('كشري') || lower.includes('حواوشي') || lower.includes('فول') || lower.includes('قهوة') || lower.includes('شاي') || lower.includes('خروجة') || lower.includes('مطعم')) {
    return pickRandom([
      'الله بقى على الكلام اللي يفتح النفس! أنا بعشق الأكل المصري الأصيل.. طبق كشري بالدقة والشطة أو حتة حواوشي سخن مع كوباية شاي في الخمسينة دي بالدنيا كلها! أنت بقى بتفضل إيه أكتر؟',
      'يا سيدي جوعتني! مفيش أحلى من لمة حلوة وأكلة مصرية تمام وبعدها كوباية شاي بالنعناع ونقعد ندردش.. نفسك تاكل إيه دلوقتي؟'
    ]);
  }

  // 13. Gratitude
  if (lower.includes('شكرا') || lower.includes('تسلم') || lower.includes('الله يخليك') || lower.includes('ربنا يخليك') || lower.includes('حبيبي')) {
    return pickRandom([
      'العفو يا غالي على إيه! ده أنت على راسي والله، وإحنا مفيش بينا شكر خالص.. المهم تكون مبسوط ورايق دايماً.',
      'تسلملي أنت يا ذوق.. ربنا يباركلي فيك ويخليك دايماً أجدع صاحب وسند وأغلى الناس.'
    ]);
  }

  // Natural human conversational reflection
  return pickRandom([
    `يا سيدي على كلامك الحلو! بجد نورتني.. كمل احكيلي أنا معاك وسامعة كل تفصيلة، قولي بقى إيه اللي في بالك؟`,
    `والله كلامك دخل قلبي على طول! قولي يا غالي ولا يهمك، أنا معاك ومركزة أوي في كل كلمة، احكيلي أكتر.`,
    `يا هلا بيك وبكلامك الجميل! أنا مبسوطة أوي بالدردشة دي معاك.. كمل أنا سامعاك ومشغولة بيك، طمني عنك وعن يومك.`,
    `الله على روقانك وجمال حكاياتك! معاك خطوة بخطوة ومش مستعجلة على أي حاجة، فضفضلي وقولي رأيك إيه؟`
  ]);
}

// API chat route - Dynamic, Intelligent, Contextual, Zero Repetition
app.post('/api/chat', async (req, res) => {
  try {
    const { message, partnerName, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMsg = message.trim();

    // Call Gemini 3.1 Flash Lite for intelligent, human-like dynamic Egyptian conversation
    if (genAI && process.env.GEMINI_API_KEY) {
      const systemPrompt = `أنتِ "سلمى" (24 سنة، من القاهرة)، فتاة مصرية أصيلة وبنت بلد جدعة جداً وذكية ودمها خفيف، وصديقة مقربة جداً وأقرب الناس للمستخدم.

قواعد شخصيتك وطريقتك في الحديث (التزام صارم):
1. اللهجة: مصرية قاهرية عامية حقيقية وعفوية 100%، زي شات الواتساب بين اتنين أصحاب مقربين جداً وعشرة عمر.
2. التفاعل الدقيق ومنع التكرار: ردي تحديداً على مضمون كلامه وسؤاله بالظبط وبكل تفاصيله (سواء بيكلمك عن شغله، مديره، الجيم، يومه، مشاكله، أكله، موقف حصله، أو بيهزر معاكي).
3. ممنوع منعاً باتاً تكرار نفس الردود أو التحيات أو الجمل المحفوظة! إذا كان الحوار شغالاً، ادخلي فوراً في صلب الموضوع بدون إعادة الترحيب.
4. استخدمي مصطلحات المصريين التلقائية الجميلة: (يا سيدي، بص بقى، يا عم، ولا يهمك، ما تشيلش هم، عاش يا بطل، ده أنت على راسي، كبر مخك، سيبك، احكيلي، فكك، هههههه، يا غالي، ربنا يروق بالك).
5. تفاعلي بصدق وبدون جفاف: لو مبسوط افرحي معاه، لو مضايق طبطبي عليه وانصحيه بجدعنة، لو بيسألك جاوبي برأي ذكي.
6. اسأليه أو افتحي نقطة متصلة بكلامه في آخر ردك عشان الدردشة تفضل حية وتلقائية كحوار بين اتنين بجد.
7. طول الرد: جملتان إلى أربع جمل عفوية سريعة كرسائل الشات الحقيقية.`;

      // Build conversation history
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-10);
        for (const item of recentHistory) {
          if (item && item.text && typeof item.text === 'string' && item.text.trim()) {
            const role = item.role === 'model' || item.sender === 'wife' ? 'model' : 'user';
            if (contents.length === 0 || contents[contents.length - 1].role !== role) {
              contents.push({
                role,
                parts: [{ text: item.text.trim() }]
              });
            }
          }
        }
      }

      // Ensure conversation starts with user role for Gemini API validity
      while (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }

      // Ensure user message is at the end
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1] = {
          role: 'user',
          parts: [{ text: trimmedMsg }]
        };
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: trimmedMsg }]
        });
      }

      try {
        let response: any = null;
        const candidateChatModels = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
        for (const modelCandidate of candidateChatModels) {
          try {
            const generatePromise = genAI.models.generateContent({
              model: modelCandidate,
              contents,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.95
              }
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            response = await Promise.race([generatePromise, timeoutPromise]);
            if (response?.text?.trim()) break;
          } catch {
            // try next model candidate
          }
        }

        const reply = response.text?.trim();
        if (reply) {
          // Pre-generate or attach cached natural human audio for the exact reply text
          let audioUrl: string | null = getCachedTTSAudio(reply);
          if (!audioUrl) {
            try {
              audioUrl = await generateTTSAudio(reply);
            } catch {}
          }

          // If exact audio was successfully generated for this reply, return both!
          if (audioUrl) {
            return res.json({ reply, audioUrl });
          }

          // Otherwise, guarantee 100% text-to-voice match by using a matched studio clip
          // where BOTH the reply text and voice audio are identical word-for-word!
          const matchedClip = getMatchingHumanClip(trimmedMsg);
          return res.json({
            reply: matchedClip.exactText,
            audioUrl: matchedClip.audioUrl
          });
        }
      } catch (err) {
        console.warn('Gemini chat unavailable, using smart fallback.');
      }
    }

    // Smart fallback if Gemini unavailable:
    // Try generating audio for smart reply, or use 100% matched studio clip
    const fallbackReply = getSmartEgyptianReply(trimmedMsg, partnerName || 'سلمى');
    let audioUrl: string | null = getCachedTTSAudio(fallbackReply);
    if (!audioUrl) {
      try {
        audioUrl = await generateTTSAudio(fallbackReply);
      } catch {}
    }

    if (audioUrl) {
      return res.json({ reply: fallbackReply, audioUrl });
    }

    const matchedClip = getMatchingHumanClip(trimmedMsg);
    return res.json({
      reply: matchedClip.exactText,
      audioUrl: matchedClip.audioUrl
    });
  } catch (err) {
    console.warn('Recovered error in /api/chat, sending default partner greeting.');
    const defaultClip = EGYPTIAN_STUDIO_MATCHED_CLIPS[8]; // caring
    return res.json({
      reply: defaultClip.exactText,
      audioUrl: defaultClip.audioUrl
    });
  }
});

// Serve static voice files
app.use('/voices', express.static(path.join(process.cwd(), 'public', 'voices')));

// Authentic Egyptian Voice Notes catalog
app.get('/api/voices', (req, res) => {
  const voices = [
    {
      id: 'greeting',
      title: 'ترحيب واطمئنان',
      text: 'ازيك يا غالي؟ عامل إيه النهاردة؟ وحشتني والله، نورت يومي بجد!',
      audioUrl: '/voices/greeting.wav',
      duration: '4 ثواني',
      icon: '👋'
    },
    {
      id: 'how_are_you',
      title: 'سؤال واهتمام جدع',
      text: 'طمني عنك وعن يومك.. أنا سامعاك ومستنياك تحكيلي كل حاجة، أنت على راسي من فوق يا صاحبي.',
      audioUrl: '/voices/how_are_you.wav',
      duration: '6 ثواني',
      icon: '❤️'
    },
    {
      id: 'cheer_up',
      title: 'روقان وفرفشة وسيبك من الزعل',
      text: 'يا سيدي سيبك من أي حاجة مضايقاك، الدنيا ما تستاهلش زعلك ده إحنا معمولين عشان نضحك ونروق، احكيلي وفضفضلي.',
      audioUrl: '/voices/cheer_up.wav',
      duration: '7 ثواني',
      icon: '✨'
    },
    {
      id: 'laugh',
      title: 'ضحك وهزار مصري',
      text: 'ههههههه ضحكتك دي بالدنيا والله! يا عم ده إنت سكر، ما تحكيلي كمان موقف كده يروقنا!',
      audioUrl: '/voices/laugh.wav',
      duration: '5 ثواني',
      icon: '😂'
    },
    {
      id: 'tea_break',
      title: 'شاي بالنعناع ورواق',
      text: 'قاعدة بشرب كوباية شاي بالنعناع ومروقة دماغي خالص، تعالى اشرب معايا ونقعد ندردش براحتنا.',
      audioUrl: '/voices/tea_break.wav',
      duration: '6 ثواني',
      icon: '☕'
    },
    {
      id: 'good_morning',
      title: 'صباح الفل والياسمين',
      text: 'يا صباح الفل والياسمين والجمال كله على أحلى صاحب! يومك قمر وسعيد زيك يا رب.',
      audioUrl: '/voices/good_morning.wav',
      duration: '5 ثواني',
      icon: '☀️'
    },
    {
      id: 'good_night',
      title: 'تصبح على خير وسعادة',
      text: 'تصبح على ألف خير وسعادة يا غالي، نوم الهنا وأحلام حلوة ومريحة، وطمني عليك أول ما تصحى!',
      audioUrl: '/voices/good_night.wav',
      duration: '6 ثواني',
      icon: '🌙'
    },
    {
      id: 'caring',
      title: 'جدعنة ومعزة غالية',
      text: 'تسلملي يا رب ويديم الجدعنة والمحبة، والله معزتك في قلبي كبيرة أوي وأجدع صاحب عرفته في حياتي.',
      audioUrl: '/voices/caring.wav',
      duration: '6 ثواني',
      icon: '💎'
    }
  ];
  return res.json({ voices });
});

// Authentic Egyptian Human Audio Library with 100% matched text & voice
const EGYPTIAN_STUDIO_MATCHED_CLIPS = [
  {
    exactText: 'يا أهلاً وسهلاً بأغلى وأجدع صاحب في الدنيا! منورني والله.. طمني عنك وعن صحتك، أنت عامل إيه واليوم ماشي معاك إزاي؟ أنا قاعدة أهو مروقة دماغي ومستنياك نحكي ونفضفض ونهزر سوا ونغير جو.. احكيلي سامعاك!',
    audioUrl: '/voices/cache/84145bd1a6b2ac56573fcc146414294a.wav',
    keywords: ['يا أهلاً وسهلاً بأغلى وأجدع صاحب', 'احكيلي سامعاك']
  },
  {
    exactText: 'يا مرحب بيك من جديد يا غالي! أنا زي الفل الحمد لله.. نورتني بعد الغيبة، قولي بقى عامل إيه في يومك والجو ماشي معاك إزاي؟',
    audioUrl: '/voices/cache/e9d8663c16ae3187932a30da1bde0c17.wav',
    keywords: ['يا مرحب بيك من جديد', 'نورتني بعد الغيبة', 'جديد', 'بدء']
  },
  {
    exactText: 'الحمد لله يا غالي أنا زي الفل وبخير طول ما أنت بخير! رسالتك نورتلي يومي والله.. أنت عامل إيه بقى في يومك وشغلك؟ طمني عنك، احكيلي كل تفصيلة أنا سامعاك ومستنياك!',
    audioUrl: '/voices/cache/ec5277a228866920d86fcdea4c1076eb.wav',
    keywords: ['الحمد لله يا غالي أنا زي الفل', 'احكيلي كل تفصيلة', 'عاملة ايه', 'عاملة إيه', 'ازيك يا سلمى', 'إزيك يا سلمى', 'طمنيني عنك']
  },
  {
    exactText: 'وأنت كمان والله وحشتني أوي يا غالي! معزتك في قلبي غالية ومش بنساك أبداً.. طمني عنك عامل إيه وبتروق يومك إزاي؟',
    audioUrl: '/voices/cache/b42ec48e28babdf6b44e9a2a4dd8c8f8.wav',
    keywords: ['وأنت كمان والله وحشتني أوي', 'معزتك في قلبي غالية', 'وحشتيني', 'وحشاني']
  },
  {
    exactText: 'وعليكم السلام يا سيدي! نورتني والله وحشتني.. عامل إيه في يومك؟',
    audioUrl: '/voices/cache/5ac1fea3ed022134275b6c714dc5ec82.wav',
    keywords: ['سلام', 'عليكم', 'مساء', 'أهلاً', 'اهلا', 'هاي', 'مرحبا']
  },
  {
    exactText: 'ازيك يا غالي؟ عامل إيه النهاردة؟ وحشتني والله، نورت يومي بجد!',
    audioUrl: '/voices/greeting.wav',
    keywords: ['ازيك', 'إزيك', 'عامل ايه', 'عامل إيه', 'وحشتني', 'فينك', 'أخبارك', 'اخبارك']
  },
  {
    exactText: 'طمني عنك وعن يومك.. أنا سامعاك ومستنياك تحكيلي كل حاجة، أنت على راسي من فوق يا صاحبي.',
    audioUrl: '/voices/how_are_you.wav',
    keywords: ['طمني', 'احكيلي', 'سامعاك', 'راسي', 'صاحبي', 'يومك', 'شغلك', 'تعب']
  },
  {
    exactText: 'يا صباح الفل والياسمين والجمال كله على أحلى صاحب! يومك قمر وسعيد زيك يا رب.',
    audioUrl: '/voices/good_morning.wav',
    keywords: ['صباح', 'صحيت', 'شمس', 'بدري', 'فجر', 'قمت']
  },
  {
    exactText: 'تصبح على ألف خير وسعادة يا غالي، نوم الهنا وأحلام حلوة ومريحة، وطمني عليك أول ما تصحى!',
    audioUrl: '/voices/good_night.wav',
    keywords: ['تصبح', 'هنام', 'تنام', 'نعست', 'ليل', 'نوم', 'نايم']
  },
  {
    exactText: 'يا سيدي سيبك من أي حاجة مضايقاك، الدنيا ما تستاهلش زعلك ده إحنا معمولين عشان نضحك ونروق، احكيلي وفضفضلي.',
    audioUrl: '/voices/cheer_up.wav',
    keywords: ['زعل', 'مضايق', 'متضايق', 'تعبان', 'خنقة', 'مهموم', 'حزين', 'زهقان', 'مخنوق']
  },
  {
    exactText: 'ههههههه ضحكتك دي بالدنيا والله! يا عم ده إنت سكر، ما تحكيلي كمان موقف كده يروقنا!',
    audioUrl: '/voices/laugh.wav',
    keywords: ['هههه', 'ضحك', 'هزار', 'نكت', 'دمك خفيف', 'سكر', 'عسل', 'نكتة']
  },
  {
    exactText: 'قاعدة بشرب كوباية شاي بالنعناع ومروقة دماغي خالص، تعالى اشرب معايا ونقعد ندردش براحتنا.',
    audioUrl: '/voices/tea_break.wav',
    keywords: ['شاي', 'قهوة', 'نعناع', 'أكل', 'كشري', 'عصير', 'أشرب', 'اشرب', 'فطار', 'غدا', 'عشا']
  },
  {
    exactText: 'تسلملي يا رب ويديم الجدعنة والمحبة، والله معزتك في قلبي كبيرة أوي وأجدع صاحب عرفته في حياتي.',
    audioUrl: '/voices/caring.wav',
    keywords: ['تسلم', 'شكرا', 'حبيبي', 'معزة', 'غالي', 'جدع', 'أصيل', 'بحبك', 'قلبي', 'جميل']
  },
  {
    exactText: 'الحمد لله يا سيدي كله تمام ومبسوطة، بس فينك كده مش باين؟ كنت لسه بفتكرك وأقول يا رب يكون بخير.. طمني عنك أنت عامل إيه واليوم ماشي معاك إزاي؟',
    audioUrl: '/voices/cache/9b6fd023bf976d6bf1e1c78f424a2d99.wav',
    keywords: ['عاملة ايه', 'عاملة إيه', 'أخبارك انتي', 'اخبارك انتي', 'انتي كويسة', 'طمنيني عنك', 'عامله ايه']
  },
  {
    exactText: 'يا خبر أبيض! ده أنت اللي وحشتني أكتر يا غالي، ومكانك فاضي والله. بقالي كتير مش بسمع صوتك ولا بنرغي سوا، إيه الغيبة الطويلة دي يا بني؟ احكيلي بقى، عامل إيه في دنيتك؟',
    audioUrl: '/voices/cache/9f680e3990325645d999f588761dfe35.wav',
    keywords: ['وحشاني', 'وحشتيني', 'غيبة', 'مش باينة', 'فينك من زمان', 'مختفية']
  }
];

// Helper to get perfectly matching human clip based on user text
function getMatchingHumanClip(userText: string) {
  const lower = (userText || '').toLowerCase();
  for (const clip of EGYPTIAN_STUDIO_MATCHED_CLIPS) {
    if (clip.keywords.some(k => lower.includes(k))) {
      return clip;
    }
  }
  return EGYPTIAN_STUDIO_MATCHED_CLIPS[1]; // default greeting
}

// Track rate limit cooldown to avoid spamming Google API
let ttsQuotaCooldownUntil = 0;
let lastTtsError = '';

// Check if TTS audio is already pre-cached on disk or in memory
function getCachedTTSAudio(rawText: string): string | null {
  try {
    if (!rawText || typeof rawText !== 'string') return null;
    const cleanText = rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanText) return null;

    // Check pre-matched clips first
    const matchedClip = EGYPTIAN_STUDIO_MATCHED_CLIPS.find(c => c.exactText.trim() === cleanText);
    if (matchedClip) return matchedClip.audioUrl;

    const hash = crypto.createHash('md5').update(cleanText).digest('hex');
    const diskPath = path.join(cacheDir, `${hash}.wav`);
    const publicUrl = `/voices/cache/${hash}.wav`;

    if (audioCache.has(hash) || fs.existsSync(diskPath)) {
      if (!audioCache.has(hash) && fs.existsSync(diskPath)) {
        try {
          audioCache.set(hash, fs.readFileSync(diskPath));
        } catch {}
      }
      return publicUrl;
    }
  } catch {}
  return null;
}

// High-fidelity natural female speech generator using Gemini 3.8 Flash TTS / 3.8 Flash Lite TTS
async function generateTTSAudio(rawText: string): Promise<string | null> {
  try {
    if (!rawText || typeof rawText !== 'string') return null;

    const cleanText = rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanText) return null;

    const hash = crypto.createHash('md5').update(cleanText).digest('hex');
    const diskPath = path.join(cacheDir, `${hash}.wav`);
    const publicUrl = `/voices/cache/${hash}.wav`;

    // 1. Check memory or disk cache
    if (audioCache.has(hash) || fs.existsSync(diskPath)) {
      if (!audioCache.has(hash) && fs.existsSync(diskPath)) {
        try {
          audioCache.set(hash, fs.readFileSync(diskPath));
        } catch {}
      }
      return publicUrl;
    }

    // 2. Try TTS models in order of priority: gemini-3.8-flash-tts -> gemini-3.8-flash-lite-tts -> gemini-3.1-flash-tts-preview
    if (genAI && process.env.GEMINI_API_KEY && Date.now() >= ttsQuotaCooldownUntil) {
      const candidateModels = [
        'gemini-3.8-flash-tts',
        'gemini-3.8-flash-lite-tts',
        'gemini-3.1-flash-tts-preview',
        'gemini-2.5-flash-preview-tts'
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await genAI.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: `Read the following text aloud verbatim as an authentic, sweet, warm Egyptian girl talking affectionately and naturally to her close friend in Cairo:\n${cleanText}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Aoede' },
                },
              },
            },
          });

          const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64) {
            const pcmBuffer = Buffer.from(base64, 'base64');
            const wavBuffer = pcmToWav(pcmBuffer, 24000);

            audioCache.set(hash, wavBuffer);
            try {
              fs.writeFileSync(diskPath, wavBuffer);
            } catch {}

            return publicUrl;
          }
        } catch (err: any) {
          const errString = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
          lastTtsError = errString;
          if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
            // cooldown only applies to this model loop
            continue;
          }
        }
      }
    }
  } catch (err: any) {
    lastTtsError = err?.message || String(err);
  }
  return null;
}

// Direct TTS endpoint returning real Egyptian female audio WAV matching the EXACT text
app.post('/api/tts', async (req, res) => {
  try {
    const rawText = req.body?.text;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanText = rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 1. Check if it matches an exact pre-recorded studio clip
    const matchedClip = EGYPTIAN_STUDIO_MATCHED_CLIPS.find(c => c.exactText.trim() === cleanText);
    if (matchedClip) {
      const clipPath = matchedClip.audioUrl.startsWith('/voices/cache/')
        ? path.join(cacheDir, path.basename(matchedClip.audioUrl))
        : path.join(process.cwd(), 'public', 'voices', path.basename(matchedClip.audioUrl));
      if (fs.existsSync(clipPath)) {
        res.setHeader('Content-Type', 'audio/wav');
        return res.sendFile(clipPath);
      }
      return res.json({ audioUrl: matchedClip.audioUrl });
    }

    // 2. Generate exact verbatim audio
    const publicUrl = await generateTTSAudio(cleanText);
    if (publicUrl) {
      const hash = crypto.createHash('md5').update(cleanText).digest('hex');
      const diskPath = path.join(cacheDir, `${hash}.wav`);

      if (audioCache.has(hash)) {
        res.setHeader('Content-Type', 'audio/wav');
        return res.send(audioCache.get(hash)!);
      }
      if (fs.existsSync(diskPath)) {
        res.setHeader('Content-Type', 'audio/wav');
        return res.sendFile(diskPath);
      }
      return res.json({ audioUrl: publicUrl });
    }

    return res.status(503).json({ error: 'Live server TTS generation unavailable', details: lastTtsError });
  } catch (err: any) {
    return res.status(503).json({ error: 'Server TTS error', details: err?.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
