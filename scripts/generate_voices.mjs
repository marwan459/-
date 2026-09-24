import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function pcmToWav(pcmBuffer, sampleRate = 24000) {
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

const clips = [
  {
    name: 'greeting.wav',
    text: 'ازيك يا غالي؟ عامل إيه النهاردة؟ وحشتني والله، نورت يومي بجد!'
  },
  {
    name: 'how_are_you.wav',
    text: 'طمني عنك وعن يومك.. أنا سامعاك ومستنياك تحكيلي كل حاجة، أنت على راسي من فوق يا صاحبي.'
  },
  {
    name: 'cheer_up.wav',
    text: 'يا سيدي سيبك من أي حاجة مضايقاك، الدنيا ما تستاهلش زعلك ده إحنا معمولين عشان نضحك ونروق، احكيلي وفضفضلي.'
  },
  {
    name: 'laugh.wav',
    text: 'ههههههه ضحكتك دي بالدنيا والله! يا عم ده إنت سكر، ما تحكيلي كمان موقف كده يروقنا!'
  },
  {
    name: 'tea_break.wav',
    text: 'قاعدة بشرب كوباية شاي بالنعناع ومروقة دماغي خالص، تعالى اشرب معايا ونقعد ندردش براحتنا.'
  },
  {
    name: 'good_morning.wav',
    text: 'يا صباح الفل والياسمين والجمال كله على أحلى صاحب! يومك قمر وسعيد زيك يا رب.'
  },
  {
    name: 'good_night.wav',
    text: 'تصبح على ألف خير وسعادة يا غالي، نوم الهنا وأحلام حلوة ومريحة، وطمني عليك أول ما تصحى!'
  },
  {
    name: 'caring.wav',
    text: 'تسلملي يا رب ويديم الجدعنة والمحبة، والله معزتك في قلبي كبيرة أوي وأجدع صاحب عرفته في حياتي.'
  }
];

const voicesDir = path.resolve('public/voices');
if (!fs.existsSync(voicesDir)) {
  fs.mkdirSync(voicesDir, { recursive: true });
}

// Check if test_voice.wav exists and copy to greeting.wav if valid
if (fs.existsSync('public/test_voice.wav') && !fs.existsSync(path.join(voicesDir, 'greeting.wav'))) {
  fs.copyFileSync('public/test_voice.wav', path.join(voicesDir, 'greeting.wav'));
  console.log('Copied test_voice.wav to greeting.wav');
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  for (const clip of clips) {
    const targetFile = path.join(voicesDir, clip.name);
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000) {
      console.log(`Already exists: ${clip.name}`);
      continue;
    }

    console.log(`Generating ${clip.name}: "${clip.text}"...`);
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: clip.text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' }
              }
            }
          }
        });

        const base64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
          const pcm = Buffer.from(base64, 'base64');
          const wav = pcmToWav(pcm, 24000);
          fs.writeFileSync(targetFile, wav);
          console.log(`Saved ${clip.name} (${wav.length} bytes)`);
          success = true;
          // Rate limit protection: 22s between successful calls
          await sleep(22000);
          break;
        }
      } catch (err) {
        console.error(`Attempt ${attempt} error for ${clip.name}:`, err.message);
        console.log('Waiting 25s before retry...');
        await sleep(25000);
      }
    }
  }
  console.log('Voice generation finished!');
}

run();
