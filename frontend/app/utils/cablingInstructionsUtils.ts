import { StyleSheet, Dimensions } from 'react-native';

const BUTTON_WIDTH = 315;
const BUTTON_HEIGHT = 56;

// Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
export function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export const cablingInstructionsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  instructionsText: {
    fontSize: 18,
    color: '#222',
    marginBottom: 40,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  bulletList: {
    marginLeft: 0,
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  bullet: {
    fontSize: 32,
    color: '#222',
    lineHeight: 32,
    marginRight: 12,
    marginTop: 2,
    width: 28,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 17,
    color: '#222',
    lineHeight: 28,
    textAlign: 'justify',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
    backgroundColor: 'transparent',
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    backgroundColor: '#F7A800',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F7A800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 