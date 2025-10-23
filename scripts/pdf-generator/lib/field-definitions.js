/**
 * Field definitions for each section of the PDF
 * Centralizes field configuration to avoid duplication
 */

/**
 * Get student information fields
 * @param {Object} studentData - Student section data
 * @param {Object} submission - Full submission object
 * @returns {Array} Field definitions
 */
function getStudentFields(studentData, submission) {
  return [
    {
      key: 'student_name_bengali',
      label: 'Name (Bengali)',
      value: studentData.student_name_bengali || submission.studentName,
    },
    {
      key: 'student_name_english',
      label: 'Name (English)',
      value: studentData.student_name_english || submission.studentNameEnglish,
    },
    {
      key: 'student_gender',
      label: 'Gender',
      value: studentData.student_gender,
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      value: studentData.date_of_birth,
    },
    {
      key: 'desired_class',
      label: 'Desired Class',
      value: studentData.desired_class || submission.desiredClass,
    },
    {
      key: 'last_class_attended',
      label: 'Last Class Attended',
      value: studentData.last_class_attended,
    },
    {
      key: 'previous_school',
      label: 'Previous School',
      value: studentData.previous_school,
    },
  ];
}

/**
 * Get assessment fields
 * @param {Object} assessmentData - Assessment section data
 * @returns {Array} Field definitions
 */
function getAssessmentFields(assessmentData) {
  return [
    {
      key: 'quran_level',
      label: 'Quran Reading Level',
      value: assessmentData.quran_level,
    },
    {
      key: 'arabic_level',
      label: 'Arabic Language Level',
      value: assessmentData.arabic_level,
    },
    {
      key: 'general_subjects_level',
      label: 'General Subjects Level',
      value: assessmentData.general_subjects_level,
    },
    {
      key: 'obeying_parents',
      label: 'Obeying Parents',
      value: assessmentData.obeying_parents,
    },
    {
      key: 'purpose_of_study',
      label: 'Purpose of Study',
      value: assessmentData.purpose_of_study,
    },
  ];
}

/**
 * Get father information fields
 * @param {Object} fatherData - Father section data
 * @param {Object} submission - Full submission object
 * @returns {Array} Field definitions
 */
function getFatherFields(fatherData, submission) {
  return [
    {
      key: 'father_name',
      label: 'Father Name',
      value: fatherData.father_name || submission.fatherName,
    },
    {
      key: 'father_name_english',
      label: "Father's Name (English)",
      value: fatherData.father_name_english,
    },
    {
      key: 'father_occupation',
      label: 'Occupation',
      value: fatherData.father_occupation,
    },
    {
      key: 'father_organization',
      label: 'Organization',
      value: fatherData.father_organization,
    },
    {
      key: 'father_designation',
      label: 'Designation',
      value: fatherData.father_designation,
    },
    {
      key: 'father_monthly_income',
      label: 'Monthly Income',
      value: fatherData.father_monthly_income,
    },
    {
      key: 'father_prayer_location',
      label: 'Prayer Location',
      value: fatherData.father_prayer_location,
    },
    {
      key: 'father_prayer_times',
      label: 'Prayer Times',
      value: fatherData.father_prayer_times,
    },
    {
      key: 'father_daily_quran',
      label: 'Daily Quran',
      value: fatherData.father_daily_quran,
    },
    {
      key: 'father_tv_at_home',
      label: 'TV at Home',
      value: fatherData.father_tv_at_home,
    },
    {
      key: 'father_screen_time',
      label: 'Screen Time',
      value: fatherData.father_screen_time,
    },
    {
      key: 'father_smoking',
      label: 'Smoking Habit',
      value: fatherData.father_smoking,
    },
    {
      key: 'father_time_with_children',
      label: 'Time with Children',
      value: fatherData.father_time_with_children,
    },
    {
      key: 'father_islamic_clothing',
      label: 'Islamic Clothing',
      value: fatherData.father_islamic_clothing,
    },
    {
      key: 'father_mahram',
      label: 'Follows Mahram Rules',
      value: fatherData.father_mahram,
    },
    {
      key: 'father_favorite_scholar',
      label: 'Favorite Scholar',
      value: fatherData.father_favorite_scholar,
    },
  ];
}

/**
 * Get mother information fields
 * @param {Object} motherData - Mother section data
 * @param {Object} submission - Full submission object
 * @returns {Array} Field definitions
 */
function getMotherFields(motherData, submission) {
  return [
    {
      key: 'mother_name',
      label: 'Mother Name',
      value: motherData.mother_name || submission.motherName,
    },
    {
      key: 'mother_name_english',
      label: "Mother's Name (English)",
      value: motherData.mother_name_english,
    },
    {
      key: 'mother_occupation',
      label: 'Occupation',
      value: motherData.mother_occupation,
    },
    {
      key: 'mother_organization',
      label: 'Organization',
      value: motherData.mother_organization,
    },
    {
      key: 'mother_designation',
      label: 'Designation',
      value: motherData.mother_designation,
    },
    {
      key: 'mother_prayer_times',
      label: 'Prayer Times',
      value: motherData.mother_prayer_times,
    },
    {
      key: 'mother_daily_quran',
      label: 'Daily Quran',
      value: motherData.mother_daily_quran,
    },
    {
      key: 'mother_islamic_clothing',
      label: 'Islamic Clothing (Purdah)',
      value: motherData.mother_islamic_clothing,
    },
    {
      key: 'mother_screen_time',
      label: 'Screen Time',
      value: motherData.mother_screen_time,
    },
    {
      key: 'mother_mahram',
      label: 'Follows Mahram Rules',
      value: motherData.mother_mahram,
    },
    {
      key: 'mother_favorite_scholar',
      label: 'Favorite Scholar',
      value: motherData.mother_favorite_scholar,
    },
  ];
}

/**
 * Get additional information fields
 * @param {Object} additionalData - Additional section data
 * @returns {Array} Field definitions
 */
function getAdditionalFields(additionalData) {
  return [
    {
      key: 'transport_requirement',
      label: 'Transport Requirement',
      value: additionalData.transport_requirement,
    },
    {
      key: 'transport_location',
      label: 'Transport Location',
      value: additionalData.transport_location,
    },
    {
      key: 'comments',
      label: 'Comments',
      value: additionalData.comments,
    },
  ];
}

/**
 * Get contact information fields
 * @param {Object} contactData - Contact section data
 * @returns {Array} Field definitions
 */
function getContactFields(contactData) {
  return [
    {
      key: 'present_address',
      label: 'Present Address',
      value: contactData.present_address,
    },
    {
      key: 'father_phone',
      label: 'Father Phone',
      value: contactData.father_phone,
    },
    {
      key: 'mother_phone',
      label: 'Mother Phone',
      value: contactData.mother_phone,
    },
    {
      key: 'email',
      label: 'Email',
      value: contactData.email,
    },
  ];
}

module.exports = {
  getStudentFields,
  getAssessmentFields,
  getFatherFields,
  getMotherFields,
  getAdditionalFields,
  getContactFields,
};

