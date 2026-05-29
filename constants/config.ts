export const Config = {
  app: {
    name: 'Campus Connect',
    version: '1.0.0',
  },
  
  pagination: {
    postsPerPage: 10,
    eventsPerPage: 20,
    notificationsPerPage: 20,
  },
  
  storage: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  eventCategories: ['All', 'Academic', 'Cultural', 'Sports', 'Workshop', 'Other'],
  
  years: ['1st', '2nd', '3rd', '4th'],
  
  departments: [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Economics',
    'Psychology',
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics',
    'English',
    'History',
    'Other',
  ],
};
