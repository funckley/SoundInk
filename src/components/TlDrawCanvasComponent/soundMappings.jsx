// Define all scales
export const scales = {
  major: {
    0: 'C4', 1: 'B3', 2: 'A3', 3: 'G3', 4: 'F3', 5: 'E3', 6: 'D3', 7: 'C3',
    8: 'B2', 9: 'A2', 10: 'G2', 11: 'F2', 12: 'E2', 13: 'D2', 14: 'C2',
  },
  harmonicMinor: {
    0: 'C4', 1: 'B3', 2: 'G#3', 3: 'G3', 4: 'F3', 5: 'D#3', 6: 'D3', 7: 'C3',
    8: 'B2', 9: 'G#2', 10: 'G2', 11: 'F2', 12: 'D#2', 13: 'D2', 14: 'C2',
  },
  melodicMinor: {
    0: 'C4', 1: 'B3', 2: 'A3', 3: 'G3', 4: 'F3', 5: 'D#3', 6: 'D3', 7: 'C3',
    8: 'B2', 9: 'A2', 10: 'G2', 11: 'F2', 12: 'D#2', 13: 'D2', 14: 'C2',
  },
  naturalMinor: {
    0: 'C4', 1: 'A#3', 2: 'G#3', 3: 'G3', 4: 'F3', 5: 'D#3', 6: 'D3', 7: 'C3',
    8: 'A#2', 9: 'G#2', 10: 'G2', 11: 'F2', 12: 'D#2', 13: 'D2', 14: 'C2',
  },
  pentatonicMajor: {
    0: 'C4', 1: 'A3', 2: 'G3', 3: 'E3', 4: 'D3', 5: 'C3',
    6: 'A2', 7: 'G2', 8: 'E2', 9: 'D2', 10: 'C2', 11: 'E2', 12: 'D2', 13: 'G2', 14: 'C2',
  },
  pentatonicMinor: {
    0: 'C4', 1: 'A#3', 2: 'G3', 3: 'F3', 4: 'D#3',
    5: 'C3', 6: 'A#2', 7: 'G2', 8: 'F2', 9: 'D#2', 10: 'C2', 11: 'G2', 12: 'D#2', 13: 'F2', 14: 'C2',
  },
};

// Export a default scale
let selectedScale = 'harmonicMinor';
export const getMapRowToNote = () => scales[selectedScale];

// Function to set the current scale dynamically
export const setScale = (scaleName) => {
  if (scales[scaleName]) {
    selectedScale = scaleName;
  } else {
    console.error(`Scale "${scaleName}" does not exist.`);
  }
};

// Generalized mapping of notes to sample numbers
export const mapNoteToSampleNumber = {
  'C2': '001',  // Update to match the MP3 naming
  'C#2': '002',
  'D2': '003',
  'D#2': '004',
  'E2': '005',
  'F2': '006',
  'F#2': '007',
  'G2': '008',
  'G#2': '009',
  'A2': '010',
  'A#2': '011',
  'B2': '012',
  'C3': '013',
  'C#3': '014',
  'D3': '015',
  'D#3': '016',
  'E3': '017',
  'F3': '018',
  'F#3': '019',
  'G3': '020',
  'G#3': '021',
  'A3': '022',
  'A#3': '023',
  'B3': '024',
  'C4': '025'
};

// Mapping of colors to instrument folders (used for sample playback)
export const mapColorToInstrumentFolder = {
  '#161a1d': 'bass', // Dark color mapped to bass folder
  '#023047': 'guitar',  // Dark blue mapped to guitar folder
  '#219ebc': 'marimba', // Light blue mapped to marimba folder
  '#d62828': 'pianohigh', // Red mapped to pianohigh folder
  '#9a031e': 'pianolow', // Dark red mapped to pianolow folder
  '#5f0f40': 'strings', // Dark purple mapped to strings folder
  '#8ac926': 'marimba',  // Light green mapped to marimba folder (reuse if desired)
  '#f28482': 'guitar', // Light pink mapped to guitar folder (reuse if desired)
  '#000000': 'guitar' // Add black if used as a color
};