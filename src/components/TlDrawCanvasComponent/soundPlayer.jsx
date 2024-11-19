import { mapNoteToSampleNumber, mapColorToInstrumentFolder } from './soundMappings'; // Import both mappings

// List of instruments and the number of sound files for each
const instruments = {
  bass: 25,       // Number of sound files for "bass"
  pianohigh: 25,  // Number of sound files for "pianohigh"
  pianolow: 25,   // Number of sound files for "pianolow"
  marimba: 25,    // Add all instruments and their file counts
  epiano: 25,
  guitar: 25,
  synthflute: 25,
  floom: 25,
  strings: 25
};

// Function to dynamically generate file paths
const generateSoundFiles = () => {
  const soundFiles = [];
  for (const [instrument, count] of Object.entries(instruments)) {
    for (let i = 1; i <= count; i++) {
      const paddedNumber = String(i).padStart(3, '0'); // Ensures numbers are zero-padded (e.g., 001, 002)
      soundFiles.push(`${import.meta.env.BASE_URL}audio/${instrument}/${instrument}-${paddedNumber}.mp3`);
    }
  }
  return soundFiles;
};

// Initialize the Web Audio context globally
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const MAX_CACHE_SIZE = 50; // Set a limit for the cache size
const MAX_ACTIVE_SOURCES = 20;

// Cache for audio buffers to avoid reloading sounds repeatedly
const bufferCache = {};

// Store references to active audio sources
let activeSources = [];

// Master gain node to control overall volume
const masterGainNode = audioCtx.createGain();
masterGainNode.gain.value = 0.8; // Set the initial master volume (adjustable)

// Create a limiter (dynamics compressor) to prevent clipping
const limiterNode = audioCtx.createDynamicsCompressor();
limiterNode.threshold.setValueAtTime(-6, audioCtx.currentTime); // Start limiting at -6 dB
limiterNode.knee.setValueAtTime(0, audioCtx.currentTime); // Hard knee for abrupt limiting
limiterNode.ratio.setValueAtTime(20, audioCtx.currentTime); // High ratio, acts like a limiter
limiterNode.attack.setValueAtTime(0.003, audioCtx.currentTime); // Fast attack to catch peaks
limiterNode.release.setValueAtTime(0.25, audioCtx.currentTime); // Short release

// Connect the master gain to the limiter, and then connect to audio context destination
masterGainNode.connect(limiterNode);
limiterNode.connect(audioCtx.destination);

// Updated Preload Function
export const preloadSounds = async () => {
  const soundFiles = generateSoundFiles(); // Generate all sound file paths dynamically
  try {
    for (const filePath of soundFiles) {
      if (!bufferCache[filePath]) {
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        bufferCache[filePath] = audioBuffer; // Store in cache
        console.log(`Preloaded: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Error preloading sounds:', error);
  }
};

// Function to load an audio buffer for a specific sample
// const loadAudioBuffer = async (filePath) => {
//   if (bufferCache[filePath]) {
//     return bufferCache[filePath]; // Return cached buffer if it exists
//   }

//   if (Object.keys(bufferCache).length >= MAX_CACHE_SIZE) {
//     // Remove the oldest entry in the cache if it exceeds the limit
//     delete bufferCache[Object.keys(bufferCache)[0]];
//   }

//   const response = await fetch(filePath);
//   const arrayBuffer = await response.arrayBuffer();
//   const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

//   bufferCache[filePath] = audioBuffer; // Cache the loaded buffer
//   return audioBuffer;
// };

// Function to load an audio buffer for a specific sample
const loadAudioBuffer = async (filePath) => {
  if (bufferCache[filePath]) {
    return bufferCache[filePath]; // Return cached buffer if it exists
  }

  if (Object.keys(bufferCache).length >= MAX_CACHE_SIZE) {
    // Remove the oldest entry in the cache if it exceeds the limit
    delete bufferCache[Object.keys(bufferCache)[0]];
  }

  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  bufferCache[filePath] = audioBuffer; // Cache the loaded buffer
  return audioBuffer;
};

// Define ADSR, detuning, base volume, and sustain settings for each instrument
const instrumentSettings = {
  bass: { attack: 0, decay: 0.3, sustain: 0.8, release: 0.5, detuneMin: -0.0005, detuneMax: 0.0005, baseVolume: 0.4, sustainMultiplier: 150 },
  epiano: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.4, sustainMultiplier: 200 },
  floom: { attack: 0, decay: 0.2, sustain: 0.9, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 180 },
  guitar: { attack: 0, decay: 0.3, sustain: 0.7, release: 0.5, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.2, sustainMultiplier: 300 },
  marimba: { attack: 0, decay: 0.1, sustain: 0.7, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 300 },
  pianohigh: { attack: 0, decay: 0.3, sustain: 0.6, release: 0.4, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.4, sustainMultiplier: 250 },
  pianolow: { attack: 0, decay: 0.4, sustain: 0.6, release: 0.5, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.3, sustainMultiplier: 200 },
  strings: { attack: 0, decay: 0.5, sustain: 0.4, release: 0.7, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.2, sustainMultiplier: 20 },
  synthflute: { attack: 0, decay: 0.25, sustain: 0.7, release: 0.4, detuneMin: -0.003, detuneMax: 0.003, baseVolume: 0.3, sustainMultiplier: 160 }
};

// Function to generate slight random variations
// const getRandomVariation = (min, max) => Math.random() * (max - min) + min;
const getRandomVariation = (min, max) => {
  const randomValue = Math.random() ** 2; // Squaring biases towards 0
  return randomValue * (max - min) + min;
};

export const playSound = async (color, note, polyphonyCount = 1, playbackSpeed, lineId, colorInstrumentMap, accent = false) => {
  let instrumentFolder = colorInstrumentMap[color] || 'defaultInstrument';

  // If the instrument is 'piano', randomly pick 'pianolow' or 'pianohigh'
  if (instrumentFolder === 'piano') {
    instrumentFolder = Math.random() < 0.5 ? 'pianolow' : 'pianohigh';
  }

  // Set accent volume multiplier (for example, 1.5x the normal volume)
  const accentMultiplier = accent ? 1.5 : 1;

  const sampleNumber = mapNoteToSampleNumber[note];
  if (!sampleNumber) {
    console.error(`No sample number found for note: ${note}`);
    return;
  }

  const sampleFile = `${instrumentFolder}-${sampleNumber}.mp3`;
  // const filePath = `/audio/${instrumentFolder}/${sampleFile}`;
  const filePath = `${import.meta.env.BASE_URL}audio/${instrumentFolder}/${sampleFile}`;
  const audioBuffer = await loadAudioBuffer(filePath);

  const settings = instrumentSettings[instrumentFolder] || {
    attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3, detuneMin: -0.005, detuneMax: 0.005, baseVolume: 0.5, sustainMultiplier: 100
  };

  const randomAmplitudeVariation = getRandomVariation(0.2, 1);

  const adjustedVolume = Math.min((1 / Math.sqrt(polyphonyCount)) * settings.baseVolume * randomAmplitudeVariation * accentMultiplier, 1);

  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  const filterNode = audioCtx.createBiquadFilter();

  const detuneAmount = getRandomVariation(settings.detuneMin, settings.detuneMax);
  source.playbackRate.value = 1 + detuneAmount;

  const baseCutoffFrequency = 11000;
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(baseCutoffFrequency + getRandomVariation(-1000, 1000), audioCtx.currentTime);

  source.buffer = audioBuffer;
  source.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(masterGainNode); // Connect each gainNode to the master gain node

  const attack = settings.attack;
  const decay = settings.decay;
  const sustainLevel = settings.sustain;
  const release = settings.release;
  const sustainDuration = (settings.sustainMultiplier / playbackSpeed);

  const currentTime = audioCtx.currentTime;

  gainNode.gain.setValueAtTime(0, currentTime);
  gainNode.gain.linearRampToValueAtTime(adjustedVolume, currentTime + attack);
  gainNode.gain.linearRampToValueAtTime(sustainLevel * adjustedVolume, currentTime + attack + decay);
  gainNode.gain.setValueAtTime(sustainLevel * adjustedVolume, currentTime + attack + decay + sustainDuration);
  gainNode.gain.linearRampToValueAtTime(0, currentTime + attack + decay + sustainDuration + release);

  source.start(currentTime);
  source.stop(currentTime + attack + decay + sustainDuration + release);

  // Store the active source, associated with its line
  activeSources.push({ source, lineId });
};


// Function to stop any active sounds associated with a particular line
export const stopSoundsForLine = (lineId) => {
  activeSources = activeSources.filter(({ source, lineId: id }) => {
    if (id === lineId) {
      try {
        source.stop();
      } catch (err) {
        console.error('Error stopping sound source:', err);
      }
      return false; // Remove the source from activeSources
    }
    return true; // Keep the other sources
  });
};

// Function to adjust the master volume
export const setMasterVolume = (volume) => {
  masterGainNode.gain.value = Math.max(0, Math.min(volume, 1)); // Volume range: 0 (mute) to 1 (full)
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import { mapNoteToSampleNumber, mapColorToInstrumentFolder } from './soundMappings'; // Import both mappings


// const precalculateEnvelope = (attack, decay, sustain, release, sampleRate = 44100) => {
//   const totalSamples = Math.ceil(sampleRate * (attack + decay + release));
//   const envelope = new Float32Array(totalSamples);

//   const attackSamples = Math.ceil(sampleRate * attack);
//   const decaySamples = Math.ceil(sampleRate * decay);
//   const sustainSamples = Math.ceil(sampleRate * release);

//   for (let i = 0; i < totalSamples; i++) {
//     if (i < attackSamples) {
//       // Attack phase (linear ramp)
//       envelope[i] = i / attackSamples;
//     } else if (i < attackSamples + decaySamples) {
//       // Decay phase
//       const decayProgress = (i - attackSamples) / decaySamples;
//       envelope[i] = 1 - decayProgress * (1 - sustain);
//     } else {
//       // Release phase
//       const releaseProgress = (i - attackSamples - decaySamples) / sustainSamples;
//       envelope[i] = sustain * (1 - releaseProgress);
//     }
//   }

//   return envelope;
// };


// // Initialize the Web Audio context globally
// let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// const MAX_CACHE_SIZE = 50; // Set a limit for the cache size
// const MAX_ACTIVE_SOURCES = 20;

// // Cache for audio buffers to avoid reloading sounds repeatedly
// let bufferCache = new Map();

// // Store references to active audio sources
// let activeSources = [];

// // Master gain node to control overall volume
// const masterGainNode = audioCtx.createGain();
// masterGainNode.gain.value = 0.8; // Set the initial master volume (adjustable)

// // Create a limiter (dynamics compressor) to prevent clipping
// const limiterNode = audioCtx.createDynamicsCompressor();
// limiterNode.threshold.setValueAtTime(-6, audioCtx.currentTime); // Start limiting at -6 dB
// limiterNode.knee.setValueAtTime(0, audioCtx.currentTime); // Hard knee for abrupt limiting
// limiterNode.ratio.setValueAtTime(20, audioCtx.currentTime); // High ratio, acts like a limiter
// limiterNode.attack.setValueAtTime(0.003, audioCtx.currentTime); // Fast attack to catch peaks
// limiterNode.release.setValueAtTime(0.25, audioCtx.currentTime); // Short release

// // Connect the master gain to the limiter, and then connect to audio context destination
// masterGainNode.connect(limiterNode);
// limiterNode.connect(audioCtx.destination);

// // Function to load an audio buffer for a specific sample
// const loadAudioBuffer = async (filePath) => {
//   if (bufferCache.has(filePath)) {
//     // Move the accessed item to the end to mark it as recently used
//     const buffer = bufferCache.get(filePath);
//     bufferCache.delete(filePath);
//     bufferCache.set(filePath, buffer);
//     return buffer;
//   }

//   if (bufferCache.size >= MAX_CACHE_SIZE) {
//     // Evict the least recently used buffer (the first item in the map)
//     const firstKey = bufferCache.keys().next().value;
//     bufferCache.delete(firstKey);
//   }

//   const response = await fetch(filePath);
//   const arrayBuffer = await response.arrayBuffer();
//   const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

//   bufferCache.set(filePath, audioBuffer);
//   return audioBuffer;
// };

// // Define ADSR, detuning, base volume, and sustain settings for each instrument
// const instrumentSettings = {
//   bass: { attack: 0, decay: 0.3, sustain: 0.8, release: 0.5, detuneMin: -0.0005, detuneMax: 0.0005, baseVolume: 0.4, sustainMultiplier: 150 },
//   epiano: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.4, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.4, sustainMultiplier: 200 },
//   floom: { attack: 0, decay: 0.2, sustain: 0.9, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 180 },
//   guitar: { attack: 0, decay: 0.3, sustain: 0.7, release: 0.5, detuneMin: -0.001, detuneMax: 0.001, baseVolume: 0.2, sustainMultiplier: 300 },
//   marimba: { attack: 0, decay: 0.1, sustain: 0.7, release: 0.3, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.4, sustainMultiplier: 300 },
//   pianohigh: { attack: 0, decay: 0.3, sustain: 0.6, release: 0.4, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.4, sustainMultiplier: 250 },
//   pianolow: { attack: 0, decay: 0.4, sustain: 0.6, release: 0.5, detuneMin: -0.0001, detuneMax: 0.0001, baseVolume: 0.3, sustainMultiplier: 200 },
//   strings: { attack: 0, decay: 0.5, sustain: 0.4, release: 0.7, detuneMin: -0.002, detuneMax: 0.002, baseVolume: 0.2, sustainMultiplier: 20 },
//   synthflute: { attack: 0, decay: 0.25, sustain: 0.7, release: 0.4, detuneMin: -0.003, detuneMax: 0.003, baseVolume: 0.3, sustainMultiplier: 160 }
// };

// Object.keys(instrumentSettings).forEach((instrument) => {
//   const { attack, decay, sustain, release } = instrumentSettings[instrument];
//   instrumentSettings[instrument].envelopeCurve = precalculateEnvelope(
//     attack,
//     decay,
//     sustain * 2,
//     release
//   );
// });

// // Function to generate slight random variations
// // const getRandomVariation = (min, max) => Math.random() * (max - min) + min;
// const getRandomVariation = (min, max) => {
//   const randomValue = Math.random() ** 2; // Squaring biases towards 0
//   return randomValue * (max - min) + min;
// };

// const applyEnvelope = (gainNode, envelopeCurve, duration) => {
//   const sampleRate = audioCtx.sampleRate;
//   const scaledDuration = Math.min(envelopeCurve.length / sampleRate, duration);

//   for (let i = 0; i < envelopeCurve.length; i++) {
//     const time = i / sampleRate;
//     if (time > scaledDuration) break; // Stop applying after the sound's duration
//     gainNode.gain.setValueAtTime(envelopeCurve[i], audioCtx.currentTime + time);
//   }
// };

// export const playSound = async (color, note, polyphonyCount = 1, playbackSpeed, lineId, colorInstrumentMap, accent = false) => {
//   let instrumentFolder = colorInstrumentMap[color] || 'defaultInstrument';

//   // If the instrument is 'piano', randomly pick 'pianolow' or 'pianohigh'
//   if (instrumentFolder === 'piano') {
//     instrumentFolder = Math.random() < 0.5 ? 'pianolow' : 'pianohigh';
//   }

//   // Set accent volume multiplier (for example, 1.5x the normal volume)
//   const accentMultiplier = accent ? 1.5 : 1;

//   const sampleNumber = mapNoteToSampleNumber[note];
//   if (!sampleNumber) {
//     console.error(`No sample number found for note: ${note}`);
//     return;
//   }

//   const sampleFile = `${instrumentFolder}-${sampleNumber}.mp3`;
//   const filePath = `/audio/${instrumentFolder}/${sampleFile}`;
//   const audioBuffer = await loadAudioBuffer(filePath);

//   const settings = instrumentSettings[instrumentFolder] || {
//     attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3, detuneMin: -0.005, detuneMax: 0.005, baseVolume: 0.5, sustainMultiplier: 100
//   };

//   const randomAmplitudeVariation = getRandomVariation(0.2, 1);

//   const adjustedVolume = Math.min((1 / Math.sqrt(polyphonyCount)) * settings.baseVolume * randomAmplitudeVariation * accentMultiplier, 1);

//   const source = audioCtx.createBufferSource();
//   const gainNode = audioCtx.createGain();
//   const filterNode = audioCtx.createBiquadFilter();

//   const detuneAmount = getRandomVariation(settings.detuneMin, settings.detuneMax);
//   source.playbackRate.value = 1 + detuneAmount;

//   const baseCutoffFrequency = 11000;
//   filterNode.type = 'lowpass';
//   filterNode.frequency.setValueAtTime(baseCutoffFrequency + getRandomVariation(-1000, 1000), audioCtx.currentTime);

//   source.buffer = audioBuffer;
//   source.connect(filterNode);
//   filterNode.connect(gainNode);
//   gainNode.connect(masterGainNode); // Connect each gainNode to the master gain node

//   const attack = settings.attack;
//   const decay = settings.decay;
//   const sustainLevel = settings.sustain;
//   const release = settings.release;
//   const sustainDuration = (settings.sustainMultiplier / playbackSpeed);

//   const currentTime = audioCtx.currentTime;

//   const envelopeCurve = settings.envelopeCurve;
//   applyEnvelope(gainNode, envelopeCurve, attack + decay + sustainDuration + release);

//   source.start(currentTime);
//   source.stop(currentTime + attack + decay + sustainDuration + release);

//   // Store the active source, associated with its line
//   activeSources.push({ source, lineId });
// };


// // Function to stop any active sounds associated with a particular line
// export const stopSoundsForLine = (lineId) => {
//   activeSources = activeSources.filter(({ source, lineId: id }) => {
//     if (id === lineId) {
//       try {
//         source.stop();
//       } catch (err) {
//         console.error('Error stopping sound source:', err);
//       }
//       return false; // Remove the source from activeSources
//     }
//     return true; // Keep the other sources
//   });
// };

// // Function to adjust the master volume
// export const setMasterVolume = (volume) => {
//   masterGainNode.gain.value = Math.max(0, Math.min(volume, 1)); // Volume range: 0 (mute) to 1 (full)
// };