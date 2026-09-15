import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IO_IMAGES, PP_IMAGE } from '../config/assets';
import type { KeyboardTypeOptions } from 'react-native';
import LocationTopBar from '../components/LocationTopBar';
import { useLocationForm, submitPPLocation, submitIOLocation, ioPortCount } from '../utils/locationFormUtils';
import { locationStyles } from '../utils/locationStyles';

export default function LocationDetails() {
  const { apparatusType } = useLocalSearchParams();
  const {
    formData,
    setFormData,
    loading,
    setLoading,
    isPP,
    isExistingPP,
    fieldsLocked,
    error,
    setError,
    ppSerial,
    ppMac,
    ioType,
    ioMac,
    pps,
    ios,
    addPP,
    addIO,
    clearSession,
    firstApparatusLocation,
    setFirstApparatusLocation,
    handleChange,
  } = useLocationForm(apparatusType);



  // Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
  function ioPortCount(type: string): number {
    const match = type.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  // Submit handler
  const handleSubmit = async (proceed: boolean) => {
    setLoading(true);
    setError('');
    try {
      if (isPP) {
        await submitPPLocation(ppSerial, ppMac, formData, isExistingPP, firstApparatusLocation, setFirstApparatusLocation);
        addPP({ pp_serial_no: ppSerial });
        // Use the up-to-date array for navigation/API
        var allPPs = [...pps, { pp_serial_no: ppSerial }];
        var allIOs = ios;
      } else {
        await submitIOLocation(ioType, ioMac, formData);
        addIO({ io_type: ioType, io_mac: ioMac });
        // Use the up-to-date array for navigation/API
        var allPPs = pps;
        var allIOs = [...ios, { io_type: ioType, io_mac: ioMac }];
      }

      if (proceed) {
        // Calculate total ports for progress tracking
        const totalPorts = isPP ? 0 : ioPortCount(ioType);
        const ppsParam = JSON.stringify(allPPs);
        const iosParam = JSON.stringify(allIOs);
        router.push({ pathname: '/installation/cabling-instructions', params: { totalPorts: String(totalPorts), pps: ppsParam, ios: iosParam } });
      } else {
        // Clear session and go back to main menu
        clearSession();
        router.replace('/main-menu');
      }
    } catch (e) {
      setError('Failed to save location data');
    } finally {
      setLoading(false);
    }
  };

  // Apparatus image
  let apparatusImage = '';
  let apparatusLabel = '';
  if (isPP) {
    apparatusImage = PP_IMAGE;
    apparatusLabel = 'Patch Panel';
  } else if (ioType && IO_IMAGES[ioType]) {
    apparatusImage = IO_IMAGES[ioType];
    apparatusLabel = ioType;
  }

  return (
    <View style={locationStyles.container}>
      <LocationTopBar title="Location Details" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={locationStyles.scrollContent} keyboardShouldPersistTaps="handled">
          {apparatusImage ? (
            <View style={locationStyles.imageContainer}>
              <Image
                source={{ uri: apparatusImage }}
                style={locationStyles.apparatusImage}
                resizeMode="contain"
              />
            </View>
          ) : null}
          {/* Apparatus Info (below image) */}
          <Text style={locationStyles.infoText}>
            {isPP
              ? `24-Port Patch Panel\nSerial No: ${ppSerial}, MAC: ${ppMac}`
              : ioType && ioMac
                ? `Type: ${ioType}\nMAC: ${ioMac}`
                : ''}
          </Text>
          {/* Form */}
          {loading ? (
            <View style={locationStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#F7A800" />
            </View>
          ) : (
            <View style={locationStyles.formContainer}>
              <FormField
                label="Site/Campus"
                value={formData.site}
                onChangeText={(v: string) => handleChange('site', v)}
                editable={!fieldsLocked}
                required
              />
              <FormField
                label="Building"
                value={formData.building}
                onChangeText={(v: string) => handleChange('building', v)}
                editable={!fieldsLocked}
                required
              />
              <FormField
                label="Floor #"
                value={formData.floor}
                onChangeText={v => handleChange('floor', v)}
                editable={!fieldsLocked}
                keyboardType="numeric"
                required
              />
              <FormField
                label="Room"
                value={formData.room}
                onChangeText={(v: string) => handleChange('room', v)}
                editable={!fieldsLocked}
                required
              />
              {isPP ? (
                <FormField
                  label="Rack"
                  value={formData.rack}
                  onChangeText={(v: string) => handleChange('rack', v)}
                  editable={!fieldsLocked}
                  required
                />
              ) : (
                <FormField
                  label="Additional Description"
                  value={formData.additional_description}
                  onChangeText={(v: string) => handleChange('additional_description', v)}
                  editable={!fieldsLocked}
                  required
                  multiline
                />
              )}
              {error ? <Text style={locationStyles.errorText}>{error}</Text> : null}
              <View style={locationStyles.buttonContainer}>
                <TouchableOpacity
                  style={[locationStyles.button, locationStyles.clearButton]}
                  onPress={() => handleSubmit(false)}
                  disabled={loading}
                >
                  <Text style={locationStyles.buttonText}>Submit & Scan More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={locationStyles.button}
                  onPress={() => handleSubmit(true)}
                  disabled={loading}
                >
                  <Text style={locationStyles.buttonText}>Submit & Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  editable = true,
  required = false,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={locationStyles.fieldContainer}>
      <Text style={locationStyles.label}>
        {label}
        {required && <Text style={locationStyles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          locationStyles.input,
          !editable && locationStyles.inputDisabled,
          multiline && { height: 80, textAlignVertical: 'top' }
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </View>
  );
}





