// PDF Generator Frontend Application
class PDFGeneratorApp {
    constructor() {
        this.submissions = [];
        this.filteredSubmissions = [];
        this.selectedRows = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSubmissions();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterSubmissions();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterSubmissions();
            });
        });

        // Action buttons
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadSubmissions();
        });

        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.toggleSelectAll();
        });

        document.getElementById('generateBulkBtn').addEventListener('click', () => {
            this.generateBulkPDFs();
        });

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            this.nextPage();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('pdfModal'));
        });

        document.getElementById('closeBulkModalBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('bulkModal'));
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    async loadSubmissions() {
        try {
            this.showLoading(true);
            this.hideMessages();

            const response = await fetch('/api/submissions');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load submissions');
            }

            this.submissions = data.submissions;
            this.filteredSubmissions = [...this.submissions];
            this.selectedRows.clear();
            this.currentPage = 1;

            this.updateStats();
            this.renderTable();
            this.updatePagination();

        } catch (error) {
            console.error('Error loading submissions:', error);
            this.showError('Failed to load submissions: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    filterSubmissions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        this.filteredSubmissions = this.submissions.filter(submission => {
            // Search filter
            const matchesSearch = !searchTerm || 
                submission.studentName.toLowerCase().includes(searchTerm) ||
                submission.studentNameEnglish.toLowerCase().includes(searchTerm) ||
                submission.fatherName.toLowerCase().includes(searchTerm) ||
                submission.motherName.toLowerCase().includes(searchTerm) ||
                submission.email.toLowerCase().includes(searchTerm);

            // Class filter
            let matchesClass = true;
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === 'class') {
                    matchesClass = submission.desiredClass && 
                        (submission.desiredClass.includes('১ম') || 
                         submission.desiredClass.includes('২য়') || 
                         submission.desiredClass.includes('৩য়') ||
                         submission.desiredClass.includes('৪র্থ') ||
                         submission.desiredClass.includes('৫ম') ||
                         submission.desiredClass.includes('৬ষ্ঠ'));
                } else {
                    matchesClass = submission.desiredClass && 
                        submission.desiredClass.toLowerCase().includes(this.currentFilter);
                }
            }

            return matchesSearch && matchesClass;
        });

        this.selectedRows.clear();
        this.currentPage = 1;
        this.updateStats();
        this.renderTable();
        this.updatePagination();
    }

    renderTable() {
        const tbody = document.getElementById('submissionsTableBody');
        tbody.innerHTML = '';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageSubmissions = this.filteredSubmissions.slice(startIndex, endIndex);

        pageSubmissions.forEach(submission => {
            const row = this.createTableRow(submission);
            tbody.appendChild(row);
        });

        this.updateSelectAllCheckbox();
    }

    createTableRow(submission) {
        const row = document.createElement('tr');
        row.dataset.rowNumber = submission.rowNumber;
        
        if (this.selectedRows.has(submission.rowNumber)) {
            row.classList.add('selected');
        }

        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" 
                       data-row="${submission.rowNumber}" 
                       ${this.selectedRows.has(submission.rowNumber) ? 'checked' : ''}>
            </td>
            <td>${submission.rowNumber}</td>
            <td>
                <div class="student-info">
                    <div class="name-bengali">${submission.studentName || '-'}</div>
                    <div class="name-english">${submission.studentNameEnglish || '-'}</div>
                </div>
            </td>
            <td>${submission.desiredClass || '-'}</td>
            <td>${submission.fatherName || '-'}</td>
            <td>${submission.motherName || '-'}</td>
            <td>${submission.email || '-'}</td>
            <td>${submission.phone || '-'}</td>
            <td>${this.formatDate(submission.timestamp)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary action-btn view-details-btn" 
                            data-row="${submission.rowNumber}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-primary action-btn generate-single-btn" 
                            data-row="${submission.rowNumber}">
                        <i class="fas fa-file-pdf"></i> Generate PDF
                    </button>
                </div>
            </td>
        `;

        // Bind events for this row
        const checkbox = row.querySelector('.row-checkbox');
        checkbox.addEventListener('change', (e) => {
            this.toggleRowSelection(submission.rowNumber, e.target.checked);
        });

        const viewDetailsBtn = row.querySelector('.view-details-btn');
        viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewDetails(submission.rowNumber);
        });

        const generateBtn = row.querySelector('.generate-single-btn');
        generateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.generateSinglePDF(submission.rowNumber);
        });

        return row;
    }

    toggleRowSelection(rowNumber, selected) {
        if (selected) {
            this.selectedRows.add(rowNumber);
        } else {
            this.selectedRows.delete(rowNumber);
        }

        this.updateSelectedCount();
        this.updateBulkButton();
        this.updateRowSelection(rowNumber, selected);
    }

    updateRowSelection(rowNumber, selected) {
        const row = document.querySelector(`tr[data-row-number="${rowNumber}"]`);
        if (row) {
            if (selected) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        }
    }

    toggleSelectAll() {
        const allSelected = this.selectedRows.size === this.filteredSubmissions.length;
        
        if (allSelected) {
            this.selectedRows.clear();
        } else {
            this.filteredSubmissions.forEach(submission => {
                this.selectedRows.add(submission.rowNumber);
            });
        }

        this.renderTable();
        this.updateSelectedCount();
        this.updateBulkButton();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const totalFiltered = this.filteredSubmissions.length;
        const selectedCount = this.selectedRows.size;

        if (selectedCount === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (selectedCount === totalFiltered) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.indeterminate = true;
            selectAllCheckbox.checked = false;
        }
    }

    viewDetails(rowNumber) {
        // Navigate to details page with row number
        window.location.href = `details.html?row=${rowNumber}`;
    }

    async generateSinglePDF(rowNumber) {
        try {
            this.showPDFModal();
            this.updateProgress(0, 'Preparing PDF...');

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rowNumber })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate PDF');
            }

            this.updateProgress(100, 'PDF generated successfully!');
            this.showPDFResults(data);

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.updateProgress(0, 'Error: ' + error.message);
        }
    }

    async generateBulkPDFs() {
        if (this.selectedRows.size === 0) {
            this.showError('Please select at least one submission');
            return;
        }

        try {
            this.showBulkModal();
            this.updateBulkProgress(0, 'Preparing bulk generation...');

            const rowNumbers = Array.from(this.selectedRows);
            const response = await fetch('/api/generate-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rowNumbers })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate PDFs');
            }

            this.updateBulkProgress(100, 'Bulk generation complete!');
            this.showBulkResults(data);

        } catch (error) {
            console.error('Error generating bulk PDFs:', error);
            this.updateBulkProgress(0, 'Error: ' + error.message);
        }
    }

    showPDFModal() {
        document.getElementById('pdfModal').classList.remove('hidden');
        document.getElementById('pdfProgress').classList.remove('hidden');
        document.getElementById('pdfResults').classList.add('hidden');
    }

    showBulkModal() {
        document.getElementById('bulkModal').classList.remove('hidden');
        document.getElementById('bulkProgress').classList.remove('hidden');
        document.getElementById('bulkResults').classList.add('hidden');
    }

    updateProgress(percentage, text) {
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = text;
    }

    updateBulkProgress(percentage, text) {
        document.getElementById('bulkProgressFill').style.width = percentage + '%';
        document.getElementById('bulkProgressText').textContent = text;
    }

    showPDFResults(data) {
        document.getElementById('pdfProgress').classList.add('hidden');
        document.getElementById('pdfResults').classList.remove('hidden');
        
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = data.downloadUrl;
        downloadLink.download = data.filename;
    }

    showBulkResults(data) {
        document.getElementById('bulkProgress').classList.add('hidden');
        document.getElementById('bulkResults').classList.remove('hidden');
        
        document.getElementById('successCount').textContent = data.summary.successful;
        document.getElementById('errorCount').textContent = data.summary.failed;
        
        const downloadsContainer = document.getElementById('bulkDownloads');
        downloadsContainer.innerHTML = '';
        
        data.results.forEach(result => {
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = result.filename;
            link.className = 'download-link';
            link.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                ${result.submission.studentName} - ${result.filename}
            `;
            downloadsContainer.appendChild(link);
        });
    }

    closeModal(modal) {
        modal.classList.add('hidden');
    }

    updateStats() {
        document.getElementById('totalCount').textContent = this.submissions.length;
        document.getElementById('filteredCount').textContent = this.filteredSubmissions.length;
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        document.getElementById('selectedCount').textContent = this.selectedRows.size;
    }

    updateBulkButton() {
        const bulkBtn = document.getElementById('generateBulkBtn');
        bulkBtn.disabled = this.selectedRows.size === 0;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredSubmissions.length / this.itemsPerPage);
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredSubmissions.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
            this.updatePagination();
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loadingIndicator');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        successText.textContent = message;
        successDiv.classList.remove('hidden');
        
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 3000);
    }

    hideMessages() {
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('successMessage').classList.add('hidden');
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFGeneratorApp();
});
