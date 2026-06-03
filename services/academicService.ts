import { Attendance, Midmarks } from '../QIK/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.tobioffice.dev/api';

// Simple hash to generate deterministic realistic mock data based on roll number
const getDeterministicValue = (rollNumber: string, key: string, min: number, max: number): number => {
  const seedStr = rollNumber + key;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % (max - min + 1);
  return min + val;
};

export const getMockAttendance = (rollNumber: string): Attendance => {
  const seed = rollNumber.toUpperCase();
  const branchCode = seed.substring(6, 8) || '05'; // e.g., 05 for CSE
  
  let branchName = 'CSE';
  let subjectsList = [
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Machine Learning Lab'
  ];

  // Try to parse branch code
  if (branchCode === '04' || seed.includes('ECE') || seed.includes('A4')) {
    branchName = 'ECE';
    subjectsList = [
      'Microcontrollers & Applications',
      'Digital Signal Processing',
      'Analog Communications',
      'VLSI Design',
      'Control Systems Lab',
      'Antennas & Wave Propagation'
    ];
  } else if (branchCode === '02' || seed.includes('EEE') || seed.includes('A2')) {
    branchName = 'EEE';
    subjectsList = [
      'Power Electronics',
      'Electrical Machines-II',
      'Control Systems',
      'Power System Analysis',
      'Electrical Measurements Lab',
      'Renewable Energy Sources'
    ];
  } else if (branchCode === '03' || seed.includes('ME') || seed.includes('A3')) {
    branchName = 'MECH';
    subjectsList = [
      'Thermodynamics',
      'Fluid Mechanics',
      'Machine Drawing',
      'Kinematics of Machinery',
      'Thermal Engineering Lab',
      'Manufacturing Technology'
    ];
  }

  const overallPercent = getDeterministicValue(seed, 'overall', 65, 93);
  
  let totalAttended = 0;
  let totalConducted = 0;

  const subjects = subjectsList.map((sub, index) => {
    const conducted = getDeterministicValue(seed, `cond_${index}`, 24, 30);
    const subPercent = getDeterministicValue(seed, `percent_${index}`, overallPercent - 8, Math.min(overallPercent + 8, 100));
    const attended = Math.round((subPercent / 100) * conducted);
    
    totalAttended += attended;
    totalConducted += conducted;

    return {
      subject: sub,
      attended,
      conducted,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  });

  const percentage = parseFloat(((totalAttended / totalConducted) * 100).toFixed(1));

  return {
    rollno: seed,
    year_branch_section: `3_${branchName}_A`,
    percentage,
    totalClasses: {
      attended: totalAttended,
      conducted: totalConducted
    },
    subjects
  };
};

export const getMockMidmarks = (rollNumber: string): Midmarks => {
  const seed = rollNumber.toUpperCase();
  const branchCode = seed.substring(6, 8) || '05';
  
  let branchName = 'CSE';
  let subjectsList = [
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Machine Learning Lab'
  ];

  if (branchCode === '04' || seed.includes('ECE') || seed.includes('A4')) {
    branchName = 'ECE';
    subjectsList = [
      'Microcontrollers & Applications',
      'Digital Signal Processing',
      'Analog Communications',
      'VLSI Design',
      'Control Systems Lab',
      'Antennas & Wave Propagation'
    ];
  } else if (branchCode === '02' || seed.includes('EEE') || seed.includes('A2')) {
    branchName = 'EEE';
    subjectsList = [
      'Power Electronics',
      'Electrical Machines-II',
      'Control Systems',
      'Power System Analysis',
      'Electrical Measurements Lab',
      'Renewable Energy Sources'
    ];
  } else if (branchCode === '03' || seed.includes('ME') || seed.includes('A3')) {
    branchName = 'MECH';
    subjectsList = [
      'Thermodynamics',
      'Fluid Mechanics',
      'Machine Drawing',
      'Kinematics of Machinery',
      'Thermal Engineering Lab',
      'Manufacturing Technology'
    ];
  }

  const subjects = subjectsList.map((sub, index) => {
    const hasM2 = getDeterministicValue(seed, `hasM2_${index}`, 0, 1) === 1;
    const m1Value = getDeterministicValue(seed, `m1_${index}`, 15, 29);
    const m1 = getDeterministicValue(seed, `m1_present_${index}`, 1, 10) > 1 ? m1Value : null;
    const m2Value = getDeterministicValue(seed, `m2_${index}`, 17, 30);
    const m2 = hasM2 && m1 !== null ? m2Value : null;
    
    let average = null;
    if (m1 !== null && m2 !== null) {
      average = parseFloat(((m1 + m2) / 2).toFixed(1));
    } else if (m1 !== null) {
      average = m1;
    }

    return {
      subject: sub,
      M1: m1,
      M2: m2,
      average,
      type: sub.endsWith('Lab') ? 'Practical' : 'Theory'
    };
  });

  return {
    rollno: seed,
    year_branch_section: `3_${branchName}_A`,
    subjects
  };
};

export async function fetchAttendance(rollNumber: string): Promise<{ data: Attendance; isMock: boolean }> {
  const formattedRoll = rollNumber.toUpperCase();
  try {
    const response = await fetch(`${API_BASE_URL}/acadamic/attendace/${formattedRoll}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return { data: json.data, isMock: false };
      } else if (json.percentage !== undefined) {
        return { data: json, isMock: false };
      }
    }
  } catch (error) {
    console.warn('[AcademicService] Attendance fetch error, falling back to mock:', error);
  }
  return { data: getMockAttendance(formattedRoll), isMock: true };
}

export async function fetchMidmarks(rollNumber: string): Promise<{ data: Midmarks; isMock: boolean }> {
  const formattedRoll = rollNumber.toUpperCase();
  try {
    const response = await fetch(`${API_BASE_URL}/acadamic/marks/${formattedRoll}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return { data: json.data, isMock: false };
      } else if (json.subjects !== undefined) {
        return { data: json, isMock: false };
      }
    }
  } catch (error) {
    console.warn('[AcademicService] Midmarks fetch error, falling back to mock:', error);
  }
  return { data: getMockMidmarks(formattedRoll), isMock: true };
}
