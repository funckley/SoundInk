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
};

// Function to determine the direction of the melody
export const getDirection = (notes) => {
  if (notes.length < 2) return null; // Not enough notes to determine direction
  return notes[1] > notes[0] ? 'ascending' : 'descending';
};


export function getScaleForDirection(direction) {
  if (direction === "ascending") {
    return scales.melodicMinor; // Use melodic minor for ascending
  } else if (direction === "descending") {
    return scales.naturalMinor; // Use natural minor for descending
  } else if (direction === "tension") {
    return scales.harmonicMinor; // Use harmonic minor for
  } else if (direction === "release") {
    return scales.major; // Use major for release
  }
  return null; // Default case (shouldn't happen)
}

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
// export const mapNoteToSampleNumber = {
//   'C2': '00',
//   'C#2': '01',
//   'D2': '02',
//   'D#2': '03',
//   'E2': '04',
//   'F2': '05',
//   'F#2': '06',
//   'G2': '07',
//   'G#2': '08',
//   'A2': '09',
//   'A#2': '10',
//   'B2': '11',
//   'C3': '12',
//   'C#3': '13',
//   'D3': '14',
//   'D#3': '15',
//   'E3': '16',
//   'F3': '17',
//   'F#3': '18',
//   'G3': '19',
//   'G#3': '20',
//   'A3': '21',
//   'A#3': '22',
//   'B3': '23',
//   'C4': '24'
// };

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
  // '#ffb703': 'epiano', // Yellow mapped to epiano folder
  // '#fb8500': 'floom', // Orange mapped to floom folder
  '#023047': 'guitar',  // Dark blue mapped to guitar folder
  '#219ebc': 'marimba', // Light blue mapped to marimba folder
  '#d62828': 'pianohigh', // Red mapped to pianohigh folder
  '#9a031e': 'pianolow', // Dark red mapped to pianolow folder
  '#5f0f40': 'strings', // Dark purple mapped to strings folder
  // '#006400': 'synthflute', // Green mapped to synthflute folder
  '#8ac926': 'marimba',  // Light green mapped to marimba folder (reuse if desired)
  '#f28482': 'guitar', // Light pink mapped to guitar folder (reuse if desired)
  '#000000': 'guitar' // Add black if used as a color
};