
import React, {memo} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import type {Doctor} from '../../types/doctor';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: (doctor: Doctor) => void;
  primaryColor?: string;
}

function DoctorCard({
  doctor,
  onPress,
  primaryColor = '#2563EB',
}: DoctorCardProps) {
  return (
    <Pressable
      onPress={() => onPress(doctor)}
      accessibilityRole="button"
      accessibilityLabel={`Book appointment with ${doctor.name}`}
      style={({pressed}) => [
        styles.card,
        pressed && styles.pressed,
      ]}>
      <View style={styles.topRow}>
        <Image
          source={{uri: doctor.photoUrl}}
          style={styles.avatar}
          resizeMode="cover"
          accessibilityLabel={`${doctor.name} profile photo`}
        />

        <View style={styles.info}>
          <Text
            style={styles.doctorName}
            numberOfLines={2}>
            {doctor.name}
          </Text>

          <Text style={styles.specialty}>
            {doctor.specialty}
          </Text>

          <View style={styles.languageRow}>
            <Text style={styles.languageLabel}>
              Languages:
            </Text>

            <Text
              style={styles.languages}
              numberOfLines={2}>
              {doctor.languages.join(', ')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.feeLabel}>
            Consultation Fee
          </Text>

          <Text style={styles.fee}>
            ₹{doctor.feeInr.toLocaleString('en-IN')}
          </Text>
        </View>

        <View
          style={[
            styles.bookButton,
            {backgroundColor: primaryColor},
          ]}>
          <Text style={styles.bookButtonText}>
            Book Appointment
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(DoctorCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  pressed: {
    opacity: 0.85,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 16,
    backgroundColor: '#EEF2F7',
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  doctorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 5,
  },

  specialty: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 9,
  },

  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  languageLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },

  languages: {
    fontSize: 12,
    color: '#334155',
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: '#EDF1F5',
    marginVertical: 15,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  feeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },

  fee: {
    fontSize: 19,
    fontWeight: '700',
    color: '#172033',
  },

  bookButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
