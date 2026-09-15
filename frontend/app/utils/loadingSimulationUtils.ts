import { StyleSheet } from 'react-native';

// Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
export function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export const loadingSimulationStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 36,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '90%',
    height: 24,
    backgroundColor: '#eee',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#F7A800',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F7A800',
    borderRadius: 16,
  },
  percent: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7A800',
    marginBottom: 18,
    marginTop: 2,
  },
  status: {
    fontSize: 18,
    color: '#111',
    marginBottom: 32,
    textAlign: 'center',
    minHeight: 48,
  },
  proceedButton: {
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
    width: '75%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  proceedButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
}); 