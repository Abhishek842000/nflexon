import { StyleSheet, Dimensions } from 'react-native';

const ICON_SIZE = 36;
const TOP_BAR_HEIGHT = 64;
const TOP_BAR_TOP_SPACING = 52;
const PORT_LEFT_OFFSET = 26;

export const apparatusViewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#222',
  },
  panelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  panelImage: {
    width: 304,
    height: 174,
    resizeMode: 'contain',
  },
  portButton: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F7A800',
    borderWidth: 1,
    borderColor: '#222',
  },
  activePort: {
    backgroundColor: '#28a745',
  },
  selectedPort: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  connectedPort: {
    backgroundColor: '#17a2b8',
    borderColor: '#138496',
  },
  portButtonText: {
    position: 'absolute',
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 20,
    left: -6,
    top: -2,
  },
  ioContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ioImage: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
  },
  ioPortButton: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F7A800',
    borderWidth: 1,
    borderColor: '#222',
  },
  ioActivePort: {
    backgroundColor: '#28a745',
  },
  ioSelectedPort: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  ioConnectedPort: {
    backgroundColor: '#17a2b8',
    borderColor: '#138496',
  },
  ioPortButtonText: {
    position: 'absolute',
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 24,
    left: -6,
    top: 0,
  },
  connectionInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  connectionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  noConnection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noConnectionText: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
  },
}); 