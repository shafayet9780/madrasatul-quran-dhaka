// Details Page JavaScript
class DetailsPage {
    constructor() {
        this.submission = null;
        this.rowNumber = null;
        this.init();
    }

    init() {
        this.getRowNumberFromURL();
        this.bindEvents();
        this.loadSubmissionDetails();
    }

    /**
     * Load option value to label mappings for display
     */

    getRowNumberFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.rowNumber = urlParams.get('row');
        if (!this.rowNumber) {
            this.showError('No row number specified');
            return;
        }
    }

    bindEvents() {
        // Generate PDF button
        document.getElementById('generatePdfBtn').addEventListener('click', () => {
            this.generatePDF();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('pdfModal').addEventListener('click', (e) => {
            if (e.target.id === 'pdfModal') {
                this.closeModal();
            }
        });
    }

    async loadSubmissionDetails() {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/submissions/${this.rowNumber}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load submission');
            }
            
            this.submission = data.submission;

            this.populateDetails();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading submission:', error);
            this.showError(`Failed to load submission: ${error.message}`);
        }
    }

    populateDetails() {
        if (!this.submission) {
            this.showError('No submission data available');
            return;
        }

        // Student Information
        this.setFieldValue('studentNameBengali', this.submission.studentName);
        this.setFieldValue('studentNameEnglish', this.submission.studentNameEnglish);
        this.setFieldValue('studentGender', this.submission.sections?.student?.student_gender, 'student_gender');
        this.setFieldValue('dateOfBirth', this.submission.sections?.student?.date_of_birth);
        this.setFieldValue('desiredClass', this.submission.sections?.student?.desired_class, 'desired_class');
        this.setFieldValue('lastClassAttended', this.submission.sections?.student?.last_class_attended);
        this.setFieldValue('previousSchool', this.submission.sections?.student?.previous_school);
        this.setFieldValue('studentBirthRegistration', this.submission.sections?.student?.student_birth_registration);

        // Student Photo
        this.setPhoto('studentPhoto', this.submission.sections?.student?.student_photo);

        // Assessment Information
        this.setFieldValue('quranLevel', this.submission.sections?.assessment?.quran_level, 'quran_level');
        this.setFieldValue('arabicLevel', this.submission.sections?.assessment?.arabic_level, 'arabic_level');
        this.setFieldValue('generalSubjectsLevel', this.submission.sections?.assessment?.general_subjects_level, 'general_subjects_level');
        this.setFieldValue('obeyingParents', this.submission.sections?.assessment?.obeying_parents, 'obeying_parents');
        this.setFieldValue('purposeOfStudy', this.submission.sections?.assessment?.purpose_of_study, 'purpose_of_study');

        // Father Information
        this.setFieldValue('fatherNameBengali', this.submission.sections?.father?.father_name);
        this.setFieldValue('fatherNameEnglish', this.submission.sections?.father?.father_name_english);
        this.setFieldValue('fatherOccupation', this.submission.sections?.father?.father_occupation, 'father_occupation');
        this.setFieldValue('fatherOrganization', this.submission.sections?.father?.father_organization);
        this.setFieldValue('fatherDesignation', this.submission.sections?.father?.father_designation);
        this.setFieldValue('fatherMonthlyIncome', this.submission.sections?.father?.father_monthly_income, 'father_monthly_income');
        this.setFieldValue('fatherPrayerLocation', this.submission.sections?.father?.father_prayer_location, 'father_prayer_location');
        this.setFieldValue('fatherPrayerTimes', this.submission.sections?.father?.father_prayer_times, 'father_prayer_times');
        this.setFieldValue('fatherDailyQuran', this.submission.sections?.father?.father_daily_quran);
        this.setFieldValue('fatherTvAtHome', this.submission.sections?.father?.father_tv_at_home, 'father_tv_at_home');
        this.setFieldValue('fatherScreenTime', this.submission.sections?.father?.father_screen_time);
        this.setFieldValue('fatherSmoking', this.submission.sections?.father?.father_smoking, 'father_smoking');
        this.setFieldValue('fatherTimeWithChildren', this.submission.sections?.father?.father_time_with_children);
        this.setFieldValue('fatherIslamicClothing', this.submission.sections?.father?.father_islamic_clothing, 'father_islamic_clothing');
        this.setFieldValue('fatherMahram', this.submission.sections?.father?.father_mahram, 'father_mahram');
        this.setFieldValue('fatherFavoriteScholar', this.submission.sections?.father?.father_favorite_scholar);
        this.setFieldValue('fatherFacebookId', this.submission.sections?.father?.father_facebook_id);

        // Father Photo
        this.setPhoto('fatherPhoto', this.submission.sections?.father?.father_photo);

        // Mother Information
        this.setFieldValue('motherNameBengali', this.submission.sections?.mother?.mother_name);
        this.setFieldValue('motherNameEnglish', this.submission.sections?.mother?.mother_name_english);
        this.setFieldValue('motherOccupation', this.submission.sections?.mother?.mother_occupation, 'mother_occupation');
        this.setFieldValue('motherOrganization', this.submission.sections?.mother?.mother_organization);
        this.setFieldValue('motherDesignation', this.submission.sections?.mother?.mother_designation);
        this.setFieldValue('motherPrayerTimes', this.submission.sections?.mother?.mother_prayer_times, 'mother_prayer_times');
        this.setFieldValue('motherDailyQuran', this.submission.sections?.mother?.mother_daily_quran);
        this.setFieldValue('motherIslamicClothing', this.submission.sections?.mother?.mother_islamic_clothing, 'mother_islamic_clothing');
        this.setFieldValue('motherScreenTime', this.submission.sections?.mother?.mother_screen_time);
        this.setFieldValue('motherMahram', this.submission.sections?.mother?.mother_mahram, 'mother_mahram');
        this.setFieldValue('motherFavoriteScholar', this.submission.sections?.mother?.mother_favorite_scholar);
        this.setFieldValue('motherFacebookId', this.submission.sections?.mother?.mother_facebook_id);

        // Contact Information
        this.setFieldValue('presentAddress', this.submission.sections?.contact?.present_address);
        this.setFieldValue('fatherPhone', this.submission.sections?.contact?.father_phone);
        this.setFieldValue('motherPhone', this.submission.sections?.contact?.mother_phone);
        this.setFieldValue('email', this.submission.sections?.contact?.email);

        // Additional Information
        this.setFieldValue('transportRequirement', this.submission.sections?.additional?.transport_requirement, 'transport_requirement');
        this.setFieldValue('transportLocation', this.submission.sections?.additional?.transport_location);
        this.setFieldValue('comments', this.submission.sections?.additional?.comments);

        // General Information
        this.setFieldValue('howDidYouLearnAboutMadrasa', this.submission.sections?.general?.general_how_did_you_learn_about_madrasatul_quran__0, 'general_how_did_you_learn_about_madrasatul_quran__0');
        this.setFieldValue('submissionDate', this.formatDate(this.submission.timestamp));
        this.setFieldValue('rowNumber', this.submission.rowNumber);

        // Show the details content
        document.getElementById('detailsContent').classList.remove('hidden');
    }

    setFieldValue(fieldId, value, fieldKey = null) {
        const element = document.getElementById(fieldId);
        if (element) {
            let displayValue = value;

            // Convert value to string and check if it's not empty
            const stringValue = displayValue ? String(displayValue).trim() : '';
            if (stringValue !== '') {
                element.textContent = stringValue;
                element.classList.remove('empty');
            } else {
                element.textContent = 'Not provided';
                element.classList.add('empty');
            }
        }
    }

    setPhoto(photoId, photoUrl) {
        const element = document.getElementById(photoId);
        if (element && photoUrl) {
            element.innerHTML = `<img src="${photoUrl}" alt="Photo" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;
        } else {
            element.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    async generatePDF() {
        try {
            this.showPDFModal();
            this.updateProgress(0, 'Preparing PDF generation...');

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rowNumber: parseInt(this.rowNumber)
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to generate PDF');
            }

            this.updateProgress(100, 'PDF generated successfully!');
            
            // Show download link
            setTimeout(() => {
                document.getElementById('pdfResults').classList.remove('hidden');
                document.getElementById('pdfProgress').classList.add('hidden');
                
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = data.downloadUrl;
                downloadLink.download = data.filename;
            }, 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.updateProgress(0, `Error: ${error.message}`);
        }
    }

    showPDFModal() {
        document.getElementById('pdfModal').classList.remove('hidden');
        document.getElementById('pdfProgress').classList.remove('hidden');
        document.getElementById('pdfResults').classList.add('hidden');
    }

    closeModal() {
        document.getElementById('pdfModal').classList.add('hidden');
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = text;
        }
    }

    showLoading() {
        document.getElementById('loadingIndicator').classList.remove('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('detailsContent').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('detailsContent').classList.add('hidden');
        
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Initialize the details page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DetailsPage();
});
