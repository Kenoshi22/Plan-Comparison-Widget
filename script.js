// Sync Benefit Comparison Widget JavaScript

class SyncBenefitComparison {
    constructor() {
        this.selectedPlans = [];
        this.usageScenario = {
            primaryVisits: 2,
            specialistVisits: 1,
            urgentCareVisits: 0,
            erVisits: 0,
            labTests: 3,
            imagingTests: 0,
            prescriptionRefills: 2,
            surgeryVisits: 0
        };
        this.comparisonResults = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsageScenario();
        this.updateSelectedPlansSummary();
    }

    bindEvents() {
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
        
        // Add custom plan button
        document.getElementById('addPlanBtn').addEventListener('click', () => this.showCustomPlanModal());
        
        // Load sample plans button
        document.getElementById('loadSamplePlansBtn').addEventListener('click', () => this.showPdfUploadModal());
        
        // Usage scenario inputs
        const usageInputs = document.querySelectorAll('.usage-inputs input');
        usageInputs.forEach(input => {
            input.addEventListener('input', () => this.updateUsageScenario());
        });
        
        // Modal events
        this.bindModalEvents();
        
        // Export buttons
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportToExcel());
    }

    bindModalEvents() {
        // Custom plan modal
        const customPlanModal = document.getElementById('customPlanModal');
        const modalClose = document.getElementById('modalClose');
        const cancelPlan = document.getElementById('cancelPlan');
        const savePlan = document.getElementById('savePlan');
        
        modalClose.addEventListener('click', () => this.hideModal(customPlanModal));
        cancelPlan.addEventListener('click', () => this.hideModal(customPlanModal));
        savePlan.addEventListener('click', () => this.saveCustomPlan());
        
        // PDF upload modal
        const pdfModal = document.getElementById('pdfUploadModal');
        const pdfModalClose = document.getElementById('pdfModalClose');
        const uploadZone = document.getElementById('uploadZone');
        const pdfFile = document.getElementById('pdfFile');
        
        pdfModalClose.addEventListener('click', () => this.hideModal(pdfModal));
        uploadZone.addEventListener('click', () => pdfFile.click());
        pdfFile.addEventListener('change', (e) => this.handlePdfUpload(e));
        
        // Benefit type changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('benefit-type') || e.target.classList.contains('tier-type')) {
                this.togglePercentageInput(e.target);
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target);
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showCustomPlanModal() {
        this.showModal('customPlanModal');
        document.getElementById('customPlanForm').reset();
    }

    showPdfUploadModal() {
        this.showModal('pdfUploadModal');
    }

    togglePercentageInput(selectElement) {
        const row = selectElement.closest('.benefit-item, .tier-item');
        const percentageInput = row.querySelector('.benefit-percentage, .tier-percentage');
        
        if (selectElement.value === 'deductible+coinsurance') {
            percentageInput.style.display = 'block';
            percentageInput.required = true;
        } else {
            percentageInput.style.display = 'none';
            percentageInput.required = false;
            percentageInput.value = '';
        }
    }

    saveCustomPlan() {
        const form = document.getElementById('customPlanForm');
        const formData = new FormData(form);
        
        const plan = {
            id: Date.now().toString(),
            name: document.getElementById('planName').value,
            type: document.getElementById('planType').value,
            annualDeductible: parseInt(document.getElementById('annualDeductible').value) || 0,
            annualOOPMax: parseInt(document.getElementById('annualOOPMax').value) || 0,
            prescriptionDeductible: parseInt(document.getElementById('prescriptionDeductible').value) || 0,
            benefits: this.extractBenefits(),
            premium: 0 // Will be asked when plan is selected
        };
        
        if (!plan.name) {
            alert('Please enter a plan name');
            return;
        }
        
        this.addPlanToGrid(plan);
        this.hideModal(document.getElementById('customPlanModal'));
    }

    extractBenefits() {
        const benefits = {};
        const benefitItems = document.querySelectorAll('.benefit-item');
        
        benefitItems.forEach(item => {
            const label = item.querySelector('label').textContent;
            const type = item.querySelector('.benefit-type').value;
            const amount = parseFloat(item.querySelector('.benefit-amount').value) || 0;
            const percentage = parseFloat(item.querySelector('.benefit-percentage').value) || 0;
            
            benefits[label] = {
                type: type,
                amount: amount,
                percentage: percentage
            };
        });
        
        // Extract prescription benefits
        const prescriptionBenefits = {};
        const tierItems = document.querySelectorAll('.tier-item');
        
        tierItems.forEach(item => {
            const label = item.querySelector('label').textContent;
            const type = item.querySelector('.tier-type').value;
            const amount = parseFloat(item.querySelector('.tier-amount').value) || 0;
            const percentage = parseFloat(item.querySelector('.tier-percentage').value) || 0;
            
            prescriptionBenefits[label] = {
                type: type,
                amount: amount,
                percentage: percentage
            };
        });
        
        benefits.prescription = prescriptionBenefits;
        return benefits;
    }

    addPlanToGrid(plan) {
        const planGrid = document.getElementById('planGrid');
        const planCard = this.createPlanCard(plan);
        planGrid.appendChild(planCard);
    }

    createPlanCard(plan) {
        const card = document.createElement('div');
        card.className = 'plan-card';
        card.dataset.planId = plan.id;
        
        card.innerHTML = `
            <div class="plan-name">${plan.name}</div>
            <div class="plan-type">${plan.type}</div>
            <div class="plan-details">
                <div class="plan-detail">
                    <span class="plan-detail-label">Deductible:</span>
                    <span class="plan-detail-value">$${plan.annualDeductible.toLocaleString()}</span>
                </div>
                <div class="plan-detail">
                    <span class="plan-detail-label">OOP Max:</span>
                    <span class="plan-detail-value">$${plan.annualOOPMax.toLocaleString()}</span>
                </div>
                <div class="plan-detail">
                    <span class="plan-detail-label">Premium:</span>
                    <span class="plan-detail-value">Enter when selected</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => this.selectPlan(plan));
        return card;
    }

    selectPlan(plan) {
        if (this.selectedPlans.length >= 6) {
            alert('You can select up to 6 plans for comparison');
            return;
        }
        
        // Ask for premium
        const premium = prompt(`Enter the annual premium for ${plan.name}:`);
        if (premium === null) return;
        
        const premiumAmount = parseFloat(premium);
        if (isNaN(premiumAmount) || premiumAmount < 0) {
            alert('Please enter a valid premium amount');
            return;
        }
        
        plan.premium = premiumAmount;
        
        if (!this.selectedPlans.find(p => p.id === plan.id)) {
            this.selectedPlans.push(plan);
            this.updatePlanCardSelection(plan.id, true);
            this.updateSelectedPlansSummary();
            this.performComparison();
        }
    }

    updatePlanCardSelection(planId, selected) {
        const card = document.querySelector(`[data-plan-id="${planId}"]`);
        if (card) {
            card.classList.toggle('selected', selected);
        }
    }

    removeSelectedPlan(planId) {
        this.selectedPlans = this.selectedPlans.filter(p => p.id !== planId);
        this.updatePlanCardSelection(planId, false);
        this.updateSelectedPlansSummary();
        this.performComparison();
    }

    updateSelectedPlansSummary() {
        const summary = document.getElementById('selectedPlansSummary');
        const count = document.getElementById('selectedCount');
        const list = document.getElementById('selectedPlansList');
        
        if (this.selectedPlans.length === 0) {
            summary.style.display = 'none';
            return;
        }
        
        summary.style.display = 'block';
        count.textContent = this.selectedPlans.length;
        
        list.innerHTML = this.selectedPlans.map(plan => `
            <div class="selected-plan-tag">
                <span>${plan.name}</span>
                <button class="remove-plan" onclick="syncWidget.removeSelectedPlan('${plan.id}')">&times;</button>
            </div>
        `).join('');
    }

    updateUsageScenario() {
        this.usageScenario = {
            primaryVisits: parseInt(document.getElementById('primaryVisits').value) || 0,
            specialistVisits: parseInt(document.getElementById('specialistVisits').value) || 0,
            urgentCareVisits: parseInt(document.getElementById('urgentCareVisits').value) || 0,
            erVisits: parseInt(document.getElementById('erVisits').value) || 0,
            labTests: parseInt(document.getElementById('labTests').value) || 0,
            imagingTests: parseInt(document.getElementById('imagingTests').value) || 0,
            prescriptionRefills: parseInt(document.getElementById('prescriptionRefills').value) || 0,
            surgeryVisits: parseInt(document.getElementById('surgeryVisits').value) || 0
        };
        
        this.performComparison();
    }

    loadUsageScenario() {
        Object.keys(this.usageScenario).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = this.usageScenario[key];
            }
        });
    }

    performComparison() {
        if (this.selectedPlans.length < 2) {
            this.hideComparisonResults();
            return;
        }
        
        this.comparisonResults = this.selectedPlans.map(plan => {
            const costs = this.calculatePlanCosts(plan);
            return {
                ...plan,
                ...costs,
                totalCost: costs.basicMedical + costs.majorMedical + costs.drugCosts + plan.premium
            };
        });
        
        this.displayComparisonResults();
    }

    calculatePlanCosts(plan) {
        const costs = {
            basicMedical: 0,
            majorMedical: 0,
            drugCosts: 0,
            totalOOP: 0
        };
        
        // Calculate basic medical costs
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Primary Care Visit'], this.usageScenario.primaryVisits, 150);
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Specialist Visit'], this.usageScenario.specialistVisits, 200);
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Urgent Care'], this.usageScenario.urgentCareVisits, 100);
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Lab Tests'], this.usageScenario.labTests, 50);
        
        // Calculate major medical costs
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Emergency Room'], this.usageScenario.erVisits, 1000);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Imaging (MRI, CT, etc.)'], this.usageScenario.imagingTests, 500);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Imaging (MRI, CT, etc.)'], this.usageScenario.surgeryVisits, 2000);
        
        // Calculate drug costs
        const monthlyDrugCosts = this.calculateDrugCosts(plan.benefits.prescription, this.usageScenario.prescriptionRefills);
        costs.drugCosts = monthlyDrugCosts * 12;
        
        // Calculate total out-of-pocket
        costs.totalOOP = costs.basicMedical + costs.majorMedical + costs.drugCosts;
        
        // Apply deductible and OOP max
        if (costs.totalOOP > plan.annualDeductible) {
            costs.totalOOP = Math.min(costs.totalOOP, plan.annualOOPMax);
        }
        
        return costs;
    }

    calculateBenefitCost(benefit, visits, defaultCost) {
        if (!benefit || visits === 0) return 0;
        
        const totalCost = visits * defaultCost;
        
        switch (benefit.type) {
            case 'copay':
                return visits * benefit.amount;
            case 'deductible':
                return Math.min(totalCost, benefit.amount);
            case 'deductible+coinsurance':
                const deductibleAmount = Math.min(totalCost, benefit.amount);
                const remainingCost = Math.max(0, totalCost - benefit.amount);
                const coinsuranceAmount = remainingCost * (benefit.percentage / 100);
                return deductibleAmount + coinsuranceAmount;
            default:
                return totalCost;
        }
    }

    calculateDrugCosts(prescriptionBenefits, monthlyRefills) {
        if (!prescriptionBenefits || monthlyRefills === 0) return 0;
        
        // Simplified calculation - in reality, this would be more complex
        const tier1Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 1-2 (Generic)'], monthlyRefills * 0.6, 20);
        const tier2Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 3-4 (Preferred Brand)'], monthlyRefills * 0.3, 50);
        const tier3Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 5-7 (Non-Preferred/Specialty)'], monthlyRefills * 0.1, 100);
        
        return tier1Cost + tier2Cost + tier3Cost;
    }

    displayComparisonResults() {
        const resultsSection = document.getElementById('comparisonResults');
        resultsSection.style.display = 'block';
        
        this.updateSummaryCards();
        this.updateComparisonTable();
    }

    hideComparisonResults() {
        const resultsSection = document.getElementById('comparisonResults');
        resultsSection.style.display = 'none';
    }

    updateSummaryCards() {
        const sortedByValue = [...this.comparisonResults].sort((a, b) => a.totalCost - b.totalCost);
        const sortedByWorstCase = [...this.comparisonResults].sort((a, b) => (a.totalOOP + a.premium) - (b.totalOOP + b.premium));
        const sortedByOOP = [...this.comparisonResults].sort((a, b) => a.totalOOP - b.totalOOP);
        
        // Best Value (lowest total cost)
        const bestValue = sortedByValue[0];
        document.getElementById('bestValuePlan').textContent = bestValue.name;
        document.getElementById('bestValueCost').textContent = `$${bestValue.totalCost.toLocaleString()}`;
        
        // Best for Worst Case (lowest OOP + premium)
        const worstCase = sortedByWorstCase[0];
        document.getElementById('worstCasePlan').textContent = worstCase.name;
        document.getElementById('worstCaseCost').textContent = `$${(worstCase.totalOOP + worstCase.premium).toLocaleString()}`;
        
        // Highest OOP based on usage
        const highestOOP = sortedByOOP[sortedByOOP.length - 1];
        document.getElementById('highestOopPlan').textContent = highestOOP.name;
        document.getElementById('highestOopCost').textContent = `$${highestOOP.totalOOP.toLocaleString()}`;
        
        // Lowest OOP based on usage
        const lowestOOP = sortedByOOP[0];
        document.getElementById('lowestOopPlan').textContent = lowestOOP.name;
        document.getElementById('lowestOopCost').textContent = `$${lowestOOP.totalOOP.toLocaleString()}`;
    }

    updateComparisonTable() {
        const tbody = document.getElementById('comparisonTableBody');
        tbody.innerHTML = '';
        
        this.comparisonResults.forEach(plan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${plan.name}</strong><br><small>${plan.type}</small></td>
                <td>$${plan.premium.toLocaleString()}</td>
                <td>$${plan.basicMedical.toLocaleString()}</td>
                <td>$${plan.majorMedical.toLocaleString()}</td>
                <td>$${plan.drugCosts.toLocaleString()}</td>
                <td>$${plan.totalOOP.toLocaleString()}</td>
                <td><strong>$${plan.totalCost.toLocaleString()}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }
        
        // Show processing state
        document.getElementById('pdfProcessing').style.display = 'block';
        document.getElementById('pdfResults').style.display = 'none';
        
        // Simulate PDF processing (in reality, you'd use a PDF parsing library)
        setTimeout(() => {
            this.simulatePdfProcessing();
        }, 2000);
    }

    simulatePdfProcessing() {
        // This is a simulation - in reality, you'd parse the PDF
        const extractedPlans = [
            {
                name: 'Plan A from PDF',
                type: 'HMO',
                annualDeductible: 1500,
                annualOOPMax: 5000,
                benefits: this.getDefaultBenefits()
            },
            {
                name: 'Plan B from PDF',
                type: 'PPO',
                annualDeductible: 2000,
                annualOOPMax: 6000,
                benefits: this.getDefaultBenefits()
            }
        ];
        
        document.getElementById('pdfProcessing').style.display = 'none';
        document.getElementById('pdfResults').style.display = 'block';
        
        const extractedPlansDiv = document.getElementById('extractedPlans');
        extractedPlansDiv.innerHTML = extractedPlans.map(plan => `
            <div class="extracted-plan">
                <h5>${plan.name} (${plan.type})</h5>
                <p>Deductible: $${plan.annualDeductible.toLocaleString()} | OOP Max: $${plan.annualOOPMax.toLocaleString()}</p>
            </div>
        `).join('');
        
        document.getElementById('confirmPlans').addEventListener('click', () => {
            extractedPlans.forEach(plan => {
                plan.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                this.addPlanToGrid(plan);
            });
            this.hideModal(document.getElementById('pdfUploadModal'));
        });
    }

    getDefaultBenefits() {
        return {
            'Primary Care Visit': { type: 'copay', amount: 25, percentage: 0 },
            'Specialist Visit': { type: 'copay', amount: 50, percentage: 0 },
            'Urgent Care': { type: 'copay', amount: 75, percentage: 0 },
            'Emergency Room': { type: 'copay', amount: 200, percentage: 0 },
            'Lab Tests': { type: 'deductible', amount: 0, percentage: 0 },
            'Imaging (MRI, CT, etc.)': { type: 'deductible+coinsurance', amount: 0, percentage: 20 },
            prescription: {
                'Tier 1-2 (Generic)': { type: 'copay', amount: 10, percentage: 0 },
                'Tier 3-4 (Preferred Brand)': { type: 'copay', amount: 30, percentage: 0 },
                'Tier 5-7 (Non-Preferred/Specialty)': { type: 'copay', amount: 50, percentage: 0 }
            }
        };
    }

    exportToPDF() {
        // This would integrate with a PDF generation library like jsPDF
        alert('PDF export functionality will be implemented with jsPDF library');
    }

    exportToExcel() {
        // This would integrate with a library like SheetJS
        alert('Excel export functionality will be implemented with SheetJS library');
    }

    resetAll() {
        if (confirm('Are you sure you want to reset all data?')) {
            this.selectedPlans = [];
            this.comparisonResults = [];
            this.loadUsageScenario();
            this.updateSelectedPlansSummary();
            this.hideComparisonResults();
            
            // Clear plan grid
            const planGrid = document.getElementById('planGrid');
            planGrid.innerHTML = '';
            
            // Reset all plan cards
            document.querySelectorAll('.plan-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
    }
}

// Initialize the widget when the page loads
let syncWidget;
document.addEventListener('DOMContentLoaded', () => {
    syncWidget = new SyncBenefitComparison();
});



