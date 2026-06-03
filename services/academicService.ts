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

interface AcademicInfo {
  yearOfStudy: number; // 1, 2, 3, 4
  semText: string;     // "II Sem", "IV Sem", etc.
  yearText: string;    // "1st Year", etc.
  branchName: string;  // "CSE", "ECE", "EEE", "MECH"
  subjects: string[];
  yearBranchSection: string;
}

export const getAcademicInfo = (rollNumber: string): AcademicInfo => {
  const seed = rollNumber.toUpperCase();
  
  // Extract joining year (first 2 digits, e.g. "23")
  const joinYearShort = parseInt(seed.substring(0, 2), 10);
  
  // Current year is 2026. Join year short is 23.
  // 26 - 23 = 3 (3rd year).
  // If joinYearShort is invalid, fallback to 23 (3rd year).
  let yearOfStudy = 3;
  if (!isNaN(joinYearShort)) {
    yearOfStudy = 26 - joinYearShort;
    // Bounds check
    if (yearOfStudy < 1) yearOfStudy = 1;
    if (yearOfStudy > 4) yearOfStudy = 4;
  }

  // Extract branch code (indices 6 and 7, e.g., "05")
  const branchCode = seed.substring(6, 8) || '05';
  let branchName = 'CSE';
  if (branchCode === '04' || seed.includes('ECE') || seed.includes('A4')) {
    branchName = 'ECE';
  } else if (branchCode === '02' || seed.includes('EEE') || seed.includes('A2')) {
    branchName = 'EEE';
  } else if (branchCode === '03' || seed.includes('ME') || seed.includes('A3')) {
    branchName = 'MECH';
  } else if (branchCode === '12' || seed.includes('IT') || seed.includes('A12')) {
    branchName = 'IT';
  } else if (branchCode === '33' || seed.includes('AIDS') || seed.includes('A33')) {
    branchName = 'AIDS';
  } else if (branchCode === '35' || seed.includes('AIML') || seed.includes('A35')) {
    branchName = 'AIML';
  } else if (branchCode === '37' || seed.includes('DS') || seed.includes('A37')) {
    branchName = 'DS';
  }

  // Determine semester text (Assuming June is end of even semester, i.e., Sem II / IV / VI / VIII)
  const semText = yearOfStudy === 1 ? 'II Sem' : yearOfStudy === 2 ? 'IV Sem' : yearOfStudy === 3 ? 'VI Sem' : 'VIII Sem';
  const yearText = yearOfStudy === 1 ? '1st Year' : yearOfStudy === 2 ? '2nd Year' : yearOfStudy === 3 ? '3rd Year' : '4th Year';

  // Map subjects based on branch and year of study
  let subjects: string[] = [];
  if (branchName === 'CSE') {
    if (yearOfStudy === 1) {
      subjects = [
        'Engineering Chemistry',
        'Differential Equations & Vector Calculus',
        'Basic Electrical & Electronics Eng.',
        'Engineering Drawing',
        'Introduction to Python Programming',
        'IT Workshop Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Discrete Mathematics & Graph Theory',
        'Design and Analysis of Algorithms',
        'Operating Systems',
        'Software Engineering',
        'Java Programming',
        'Java & OS Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'TPW.IPR',
        'SPM',
        'ML',
        'CS_',
        'CNS'
      ];
    } else {
      subjects = [
        'Cloud Computing',
        'Cyber Security & Forensics',
        'Big Data Analytics',
        'Professional Ethics & Human Values',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'ECE') {
    if (yearOfStudy === 1) {
      subjects = [
        'Applied Physics',
        'Linear Algebra & Multivariable Calculus',
        'Basic Civil & Mechanical Eng.',
        'Engineering Graphics',
        'C Programming for Problem Solving',
        'Engineering Physics Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Electromagnetic Waves & Transmission Lines',
        'Analog Circuits',
        'Signals & Systems',
        'Digital System Design',
        'Random Variables & Stochastic Processes',
        'Analog & Digital Circuits Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Microprocessors & Microcontrollers',
        'Digital Signal Processing',
        'Antennas & Wave Propagation',
        'Control Systems',
        'VLSI Design',
        'MPMC & DSP Lab'
      ];
    } else {
      subjects = [
        'Cellular & Mobile Communications',
        'Optical Fiber Communications',
        'Embedded Systems',
        'Professional Elective - IoT',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'EEE') {
    if (yearOfStudy === 1) {
      subjects = [
        'Engineering Chemistry',
        'Differential Equations & Vector Calculus',
        'Basic Electrical & Electronics Eng.',
        'Engineering Drawing',
        'Python Programming',
        'Electrical Engineering Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Electrical Circuit Analysis',
        'DC Machines & Transformers',
        'Electromagnetic Fields',
        'Analog Electronic Circuits',
        'Fluid Mechanics & Hydraulic Machinery',
        'DC Machines Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'AC Machines',
        'Power Electronics',
        'Power System Analysis',
        'Control Systems',
        'Linear & Digital Integrated Circuits',
        'AC Machines & Power Electronics Lab'
      ];
    } else {
      subjects = [
        'Power System Operation & Control',
        'High Voltage Engineering',
        'Utilization of Electrical Energy',
        'Smart Grid Technologies',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'MECH') {
    if (yearOfStudy === 1) {
      subjects = [
        'Applied Physics',
        'Linear Algebra & Multivariable Calculus',
        'Basic Electrical & Electronics Eng.',
        'Engineering Graphics',
        'C Programming for Problem Solving',
        'Engineering Workshop Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Thermodynamics',
        'Fluid Mechanics & Hydraulic Machines',
        'Mechanics of Solids',
        'Kinematics of Machinery',
        'Manufacturing Technology-I',
        'Fluid Mechanics Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Dynamics of Machinery',
        'Design of Machine Members-II',
        'Heat Transfer',
        'CAD/CAM',
        'Operations Research',
        'Heat Transfer Lab'
      ];
    } else {
      subjects = [
        'Power Plant Engineering',
        'Production & Operations Management',
        'Automobile Engineering',
        'Additive Manufacturing',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'AIDS') {
    if (yearOfStudy === 1) {
      subjects = [
        'Engineering Chemistry',
        'Differential Equations & Vector Calculus',
        'Basic Electrical & Electronics Eng.',
        'Engineering Drawing',
        'Python Programming',
        'IT Workshop Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Discrete Mathematics',
        'Operating Systems',
        'Database Management Systems',
        'R Programming for Data Science',
        'Object Oriented Programming (Java)',
        'DBMS & Java Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Artificial Intelligence',
        'Data Mining & Warehousing',
        'Deep Learning',
        'Natural Language Processing',
        'Big Data Technologies',
        'AI & NLP Lab'
      ];
    } else {
      subjects = [
        'Reinforcement Learning',
        'Business Intelligence & Analytics',
        'Data Science Case Studies',
        'Professional Ethics',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'AIML') {
    if (yearOfStudy === 1) {
      subjects = [
        'Applied Physics',
        'Linear Algebra & Calculus',
        'Engineering Graphics',
        'Problem Solving using Python',
        'Data Structures',
        'Python & DS Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Design & Analysis of Algorithms',
        'Database Management Systems',
        'Theory of Computation',
        'Foundations of Machine Learning',
        'Computer Organization & Architecture',
        'Machine Learning Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Deep Learning & Neural Networks',
        'Computer Vision',
        'Natural Language Processing',
        'Software Engineering & Agile',
        'Reinforcement Learning',
        'Deep Learning & Computer Vision Lab'
      ];
    } else {
      subjects = [
        'Generative AI & Large Language Models',
        'AI in Healthcare & IoT',
        'Robotics & Intelligent Systems',
        'Cloud Computing & MLOps',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'IT') {
    if (yearOfStudy === 1) {
      subjects = [
        'Engineering Chemistry',
        'Linear Algebra & Vector Calculus',
        'Basic Electrical Engineering',
        'Computer Programming (C)',
        'Engineering Graphics',
        'Programming Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Discrete Mathematics',
        'Object Oriented Programming',
        'Database Management Systems',
        'Computer Networks',
        'Software Engineering',
        'Java & DBMS Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Web Technologies',
        'Cryptography & Network Security',
        'Mobile Application Development',
        'Cloud Computing',
        'Data Warehousing & Data Mining',
        'Web & Mobile App Lab'
      ];
    } else {
      subjects = [
        'Internet of Things (IoT)',
        'Information Security',
        'Enterprise Resource Planning',
        'Cloud Security & Privacy',
        'Major Project Work'
      ];
    }
  } else if (branchName === 'DS') {
    if (yearOfStudy === 1) {
      subjects = [
        'Applied Physics',
        'Mathematical Foundations of Data Science',
        'Python Programming',
        'Engineering Drawing',
        'Data Structures & Algorithms',
        'Python & DS Lab'
      ];
    } else if (yearOfStudy === 2) {
      subjects = [
        'Linear Algebra & Optimization',
        'Probability & Statistics for Data Science',
        'Database Management Systems',
        'Exploratory Data Analysis',
        'Java Programming',
        'Data Analytics Lab'
      ];
    } else if (yearOfStudy === 3) {
      subjects = [
        'Machine Learning',
        'Business Analytics & Visualization',
        'Big Data Analytics',
        'Predictive Modeling',
        'Cloud Computing for Data Science',
        'Data Visualization Lab'
      ];
    } else {
      subjects = [
        'Deep Learning for Data Science',
        'Cognitive Computing',
        'Social Media Analytics',
        'Professional Ethics & Data Privacy',
        'Major Project Work'
      ];
    }
  }

  return {
    yearOfStudy,
    semText,
    yearText,
    branchName,
    subjects,
    yearBranchSection: `${yearOfStudy}_${branchName}_A`
  };
};

export const getMockAttendance = (rollNumber: string): Attendance => {
  const seed = rollNumber.toUpperCase();
  const info = getAcademicInfo(seed);

  const overallPercent = getDeterministicValue(seed, 'overall', 65, 93);
  
  let totalAttended = 0;
  let totalConducted = 0;

  const subjects = info.subjects.map((sub, index) => {
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
    year_branch_section: info.yearBranchSection,
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
  const info = getAcademicInfo(seed);

  const subjects = info.subjects.map((sub, index) => {
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
      type: sub.toLowerCase().includes('lab') || sub.toLowerCase().includes('project') || sub.toLowerCase().includes('workshop') ? 'Practical' : 'Theory'
    };
  });

  return {
    rollno: seed,
    year_branch_section: info.yearBranchSection,
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
