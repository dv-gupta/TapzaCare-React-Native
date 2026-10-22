
import type {LayoutConfig} from '../types/config';
import type {Doctor, Slot, Booking} from '../types/doctor';
import type {Prescription} from '../types/prescription';

import {mockSettings, simulateNetwork} from './mockSettings';

import normalConfig from '../config/normal.json';
import diwaliConfig from '../config/diwali.json';

export type ConfigMode = 'normal' | 'diwali';

const doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ananya Reddy',
    specialty: 'General Physician',
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    feeInr: 499,
    languages: ['English', 'Hindi', 'Telugu'],
  },
  {
    id: 'doc-2',
    name: 'Dr. Rahul Sharma',
    specialty: 'Cardiologist',
    photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    feeInr: 799,
    languages: ['English', 'Hindi'],
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    feeInr: 599,
    languages: ['English', 'Telugu'],
  },
];

const prescriptions: Prescription[] = [
  {
    id: 'rx-1001',
    issuedAt: '2026-10-18',
    doctorName: 'Dr. Ananya Reddy',
    clinicName: 'Tapza Family Clinic, Hyderabad',
    medicines: [
      {
        id: 'med-1',
        name: 'Paracetamol 500mg',
        dose: '1 tablet after food',
        days: 5,
        timing: ['morning', 'night'],
      },
      {
        id: 'med-2',
        name: 'Vitamin D3',
        dose: '1 capsule after lunch',
        days: 10,
        timing: ['afternoon'],
      },
    ],
  },
  {
    id: 'rx-1002',
    issuedAt: '2026-10-12',
    doctorName: 'Dr. Rahul Sharma',
    clinicName: 'Tapza Heart Care, Hyderabad',
    medicines: [
      {
        id: 'med-3',
        name: 'Pantoprazole 40mg',
        dose: '1 tablet before breakfast',
        days: 7,
        timing: ['morning'],
      },
    ],
  },
];

const bookedSlotIds = new Set<string>();
const bookings: Booking[] = [];

export class MockApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'MockApiError';
  }
}

function findDoctor(doctorId: string): Doctor {
  const doctor = doctors.find(item => item.id === doctorId);

  if (!doctor) {
    throw new MockApiError(404, 'Doctor not found.');
  }

  return doctor;
}

function validateDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new MockApiError(
      400,
      'Invalid date. Expected YYYY-MM-DD.',
    );
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(date.slice(0, 4)) ||
    parsed.getMonth() + 1 !== Number(date.slice(5, 7)) ||
    parsed.getDate() !== Number(date.slice(8, 10))
  ) {
    throw new MockApiError(400, 'Invalid calendar date.');
  }
}

function buildSlots(
  doctorId: string,
  date: string,
): Slot[] {
  const hours = [9, 10, 11, 14, 15, 16];

  return hours.map(hour => {
    const startsAt =
      `${date}T${String(hour).padStart(2, '0')}:00:00`;

    const endsAt =
      `${date}T${String(hour + 1).padStart(2, '0')}:00:00`;

    const id = `${doctorId}-${date}-${hour}`;

    return {
      id,
      doctorId,
      startsAt,
      endsAt,
      available: !bookedSlotIds.has(id),
    };
  });
}

export const mockApi = {
  async getConfig(
    mode: ConfigMode = 'normal',
  ): Promise<LayoutConfig> {
    await simulateNetwork();

    if (mode !== 'normal' && mode !== 'diwali') {
      throw new MockApiError(
        400,
        'Invalid configuration mode.',
      );
    }

    const selectedConfig =
      mode === 'diwali' ? diwaliConfig : normalConfig;

    return JSON.parse(
      JSON.stringify(selectedConfig),
    ) as LayoutConfig;
  },

  async getDoctors(): Promise<Doctor[]> {
    await simulateNetwork();

    return mockSettings.emptyLists
      ? []
      : doctors.map(doctor => ({
          ...doctor,
          languages: [...doctor.languages],
        }));
  },

  async getSlots(
    doctorId: string,
    date: string,
  ): Promise<Slot[]> {
    await simulateNetwork();

    findDoctor(doctorId);
    validateDate(date);

    if (mockSettings.emptyLists) {
      return [];
    }

    return buildSlots(doctorId, date);
  },

  async createBooking(
    doctorId: string,
    slotId: string,
  ): Promise<Booking> {
    await simulateNetwork();

    findDoctor(doctorId);

    if (mockSettings.forceBookingConflict) {
      throw new MockApiError(
        409,
        'This slot has already been booked.',
      );
    }

    // Slot format: doc-1-YYYY-MM-DD-HH
    const slotPrefix = `${doctorId}-`;

    if (!slotId.startsWith(slotPrefix)) {
      throw new MockApiError(
        400,
        'This slot does not belong to the selected doctor.',
      );
    }

    const slotDetails = slotId.slice(slotPrefix.length);
    const match = /^(\d{4}-\d{2}-\d{2})-(\d{1,2})$/.exec(
      slotDetails,
    );

    if (!match) {
      throw new MockApiError(400, 'Invalid slot ID.');
    }

    const date = match[1];
    validateDate(date);

    const validSlot = buildSlots(doctorId, date).find(
      slot => slot.id === slotId,
    );

    if (!validSlot) {
      throw new MockApiError(
        400,
        'Selected slot is invalid.',
      );
    }

    if (!validSlot.available) {
      throw new MockApiError(
        409,
        'This slot has already been booked.',
      );
    }

    const booking: Booking = {
      id: `booking-${Date.now()}-${bookings.length + 1}`,
      doctorId,
      slotId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    bookedSlotIds.add(slotId);
    bookings.unshift(booking);

    return {...booking};
  },

  async getBookings(): Promise<Booking[]> {
    await simulateNetwork();

    return bookings.map(booking => ({...booking}));
  },

  async getPrescriptions(): Promise<Prescription[]> {
    await simulateNetwork();

    if (mockSettings.emptyLists) {
      return [];
    }

    return JSON.parse(
      JSON.stringify(prescriptions),
    ) as Prescription[];
  },
};
