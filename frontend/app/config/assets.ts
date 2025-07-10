// IO Images
export const IO_IMAGES: Record<string, string> = {
  FP2: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP2.png',
  FP4: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP4.png',
  FP6: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP6.png',
  SB1: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB1.png',
  SB2: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB2.png',
  SB4: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB4.png',
};

// Patch Panel Image
export const PP_IMAGE = 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/pp/PP+-+Node.png';

export const SWITCH_IMAGE = 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/switch.png';

export const LOGO_IMAGE = 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/logo.png';
// Port positions as fractions of width/height for each IO type
export const IO_PORT_POSITIONS: { [key: string]: { x: number; y: number }[] } = {
  FP2: [
    { x: 0.5, y: 0.32 },
    { x: 0.5, y: 0.62 },
  ],
  FP4: [
    { x: 0.32, y: 0.32 },
    { x: 0.68, y: 0.32 },
    { x: 0.32, y: 0.62 },
    { x: 0.68, y: 0.62 },
  ],
  FP6: [
    { x: 0.32, y: 0.23 },
    { x: 0.68, y: 0.23 },
    { x: 0.32, y: 0.45 },
    { x: 0.68, y: 0.45 },
    { x: 0.32, y: 0.67 },
    { x: 0.68, y: 0.67 },
  ],
  SB1: [
    { x: 0.5, y: 0.5 },
  ],
  SB2: [
    { x: 0.32, y: 0.5 },
    { x: 0.68, y: 0.5 },
  ],
  SB4: [
    { x: 0.32, y: 0.32 },
    { x: 0.68, y: 0.32 },
    { x: 0.32, y: 0.62 },
    { x: 0.68, y: 0.62 },
  ],
};

// Image dimensions
export const getImageDimensions = (windowWidth: number) => ({
  IO_IMAGE_WIDTHS: {
    FP2: windowWidth * 0.7,
    FP4: windowWidth * 0.7,
    FP6: windowWidth * 0.7,
    SB1: windowWidth * 0.75,
    SB2: windowWidth * 0.75,
    SB4: windowWidth * 0.75,
  },
  IO_IMAGE_HEIGHTS: {
    FP2: windowWidth * 1.1,
    FP4: windowWidth * 1.1,
    FP6: windowWidth * 1.1,
    SB1: windowWidth * 1.2,
    SB2: windowWidth * 1.2,
    SB4: windowWidth * 1.2,
  }
}); 