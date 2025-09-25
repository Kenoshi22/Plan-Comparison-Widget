// Sync Benefit Comparison Widget JavaScript

class SyncBenefitComparison {
    constructor() {
        this.selectedPlans = [];
        this.usageScenario = {
            primaryVisits: 2,
            specialistVisits: 1,
            urgentCareVisits: 0,
            virtualVisits: 0,
            erVisits: 0,
            labTests: 3,
            basicImaging: 0,
            advancedImaging: 0,
            outpatientVisits: 0,
            inpatientVisits: 0,
            surgeryVisits: 0,
            tier1Drugs: 1,
            tier2Drugs: 0,
            tier3Drugs: 0,
            tier4Drugs: 0,
            tier5Drugs: 0,
            tier6Drugs: 0
        };
        this.medicalBills = [];
        this.storedPlans = [];
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
        
        // Medical bills
        document.getElementById('addBillBtn').addEventListener('click', () => this.addMedicalBill());
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
        
        
        // Benefit type changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('benefit-type') || e.target.classList.contains('tier-type')) {
                this.togglePercentageInput(e.target);
            }
        });
        
        // Load stored plans on initialization
        this.loadStoredPlans();
        
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


    togglePercentageInput(selectElement) {
        const row = selectElement.closest('.benefit-item, .tier-item');
        const percentageInput = row.querySelector('.benefit-percentage, .tier-percentage');
        
        if (selectElement.value === 'deductible+coinsurance' || selectElement.value === 'coinsurance') {
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
            premium: 0, // Will be asked when plan is selected
            isCustom: true
        };
        
        if (!plan.name) {
            alert('Please enter a plan name');
            return;
        }
        
        this.addPlanToGrid(plan);
        this.storePlan(plan);
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
            ${plan.isCustom ? '<button class="remove-plan-btn" onclick="syncWidget.removeCustomPlan(\'' + plan.id + '\')">Remove</button>' : ''}
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-plan-btn')) {
                this.selectPlan(plan);
            }
        });
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
            virtualVisits: parseInt(document.getElementById('virtualVisits').value) || 0,
            erVisits: parseInt(document.getElementById('erVisits').value) || 0,
            labTests: parseInt(document.getElementById('labTests').value) || 0,
            basicImaging: parseInt(document.getElementById('basicImaging').value) || 0,
            advancedImaging: parseInt(document.getElementById('advancedImaging').value) || 0,
            outpatientVisits: parseInt(document.getElementById('outpatientVisits').value) || 0,
            inpatientVisits: parseInt(document.getElementById('inpatientVisits').value) || 0,
            surgeryVisits: parseInt(document.getElementById('surgeryVisits').value) || 0,
            tier1Drugs: parseInt(document.getElementById('tier1Drugs').value) || 0,
            tier2Drugs: parseInt(document.getElementById('tier2Drugs').value) || 0,
            tier3Drugs: parseInt(document.getElementById('tier3Drugs').value) || 0,
            tier4Drugs: parseInt(document.getElementById('tier4Drugs').value) || 0,
            tier5Drugs: parseInt(document.getElementById('tier5Drugs').value) || 0,
            tier6Drugs: parseInt(document.getElementById('tier6Drugs').value) || 0
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
                totalCost: costs.basicMedical + costs.majorMedical + costs.drugCosts + (costs.medicalBills || 0) + plan.premium
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
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Virtual Visits'], this.usageScenario.virtualVisits, 75);
        
        // Calculate major medical costs
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Emergency Room'], this.usageScenario.erVisits, 1000);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Basic Imaging'], this.usageScenario.basicImaging, 200);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Advanced Imaging'], this.usageScenario.advancedImaging, 800);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Outpatient Visits'], this.usageScenario.outpatientVisits, 500);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Inpatient Visits'], this.usageScenario.inpatientVisits, 2000);
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Surgery/Procedures'], this.usageScenario.surgeryVisits, 1500);
        
        // Calculate drug costs
        const monthlyDrugCosts = this.calculateDrugCosts(plan.benefits.prescription, this.usageScenario);
        costs.drugCosts = monthlyDrugCosts * 12;
        
        // Calculate medical bills costs
        costs.medicalBills = this.calculateMedicalBillsCosts(plan);
        
        // Calculate total out-of-pocket
        costs.totalOOP = costs.basicMedical + costs.majorMedical + costs.drugCosts + costs.medicalBills;
        
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
            case 'coinsurance':
                return totalCost * (benefit.percentage / 100);
            case 'deductible+copay':
                const dedAmount = Math.min(totalCost, benefit.amount);
                const copayAmount = visits * (benefit.copay || 0);
                return dedAmount + copayAmount;
            default:
                return totalCost;
        }
    }

    calculateDrugCosts(prescriptionBenefits, usageScenario) {
        if (!prescriptionBenefits) return 0;
        
        // Calculate drug costs based on tier usage
        const tier1Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 1'], usageScenario.tier1Drugs, 20);
        const tier2Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 2'], usageScenario.tier2Drugs, 25);
        const tier3Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 3'], usageScenario.tier3Drugs, 30);
        const tier4Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 4 - Preferred Brand Name'], usageScenario.tier4Drugs, 50);
        const tier5Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 5 - Non-Preferred Brand Name'], usageScenario.tier5Drugs, 80);
        const tier6Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 6 - Specialty Drugs'], usageScenario.tier6Drugs, 200);
        
        return tier1Cost + tier2Cost + tier3Cost + tier4Cost + tier5Cost + tier6Cost;
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
                <td>$${(plan.medicalBills || 0).toLocaleString()}</td>
                <td>$${plan.totalOOP.toLocaleString()}</td>
                <td><strong>$${plan.totalCost.toLocaleString()}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }


    getDefaultBenefits() {
        return {
            'Primary Care Visit': { type: 'copay', amount: 25, percentage: 0 },
            'Specialist Visit': { type: 'copay', amount: 50, percentage: 0 },
            'Urgent Care': { type: 'copay', amount: 75, percentage: 0 },
            'Virtual Visits': { type: 'copay', amount: 25, percentage: 0 },
            'Emergency Room': { type: 'copay', amount: 200, percentage: 0 },
            'Lab Tests': { type: 'deductible', amount: 0, percentage: 0 },
            'Basic Imaging': { type: 'copay', amount: 50, percentage: 0 },
            'Advanced Imaging': { type: 'deductible+coinsurance', amount: 0, percentage: 20 },
            'Outpatient Visits': { type: 'deductible+coinsurance', amount: 0, percentage: 20 },
            'Inpatient Visits': { type: 'deductible+coinsurance', amount: 0, percentage: 20 },
            'Surgery/Procedures': { type: 'deductible+coinsurance', amount: 0, percentage: 20 },
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

    // Medical Bills functionality
    addMedicalBill() {
        const description = document.getElementById('billDescription').value;
        const amount = parseFloat(document.getElementById('billAmount').value);
        
        if (!description || !amount || amount <= 0) {
            alert('Please enter a valid description and amount');
            return;
        }
        
        const bill = {
            id: Date.now().toString(),
            description: description,
            amount: amount
        };
        
        this.medicalBills.push(bill);
        this.displayMedicalBills();
        this.performComparison();
        
        // Clear form
        document.getElementById('billDescription').value = '';
        document.getElementById('billAmount').value = '';
    }
    
    displayMedicalBills() {
        const billsList = document.getElementById('billsList');
        billsList.innerHTML = '';
        
        this.medicalBills.forEach(bill => {
            const billElement = document.createElement('div');
            billElement.className = 'bill-item';
            billElement.innerHTML = `
                <div class="bill-info">
                    <div class="bill-description">${bill.description}</div>
                    <div class="bill-amount">$${bill.amount.toLocaleString()}</div>
                </div>
                <div class="bill-costs" id="billCosts-${bill.id}">
                    <!-- Costs will be calculated and displayed here -->
                </div>
                <button class="remove-bill" onclick="syncWidget.removeMedicalBill('${bill.id}')">&times;</button>
            `;
            billsList.appendChild(billElement);
        });
        
        this.updateMedicalBillsCosts();
    }
    
    removeMedicalBill(billId) {
        this.medicalBills = this.medicalBills.filter(bill => bill.id !== billId);
        this.displayMedicalBills();
        this.performComparison();
    }
    
    calculateMedicalBillsCosts(plan) {
        if (this.medicalBills.length === 0) return 0;
        
        let totalCost = 0;
        this.medicalBills.forEach(bill => {
            // For simplicity, we'll use a generic benefit calculation
            // In a real implementation, you'd need to specify which benefit applies
            const benefit = plan.benefits['Emergency Room'] || { type: 'deductible', amount: plan.annualDeductible, percentage: 20 };
            totalCost += this.calculateBenefitCost(benefit, 1, bill.amount);
        });
        
        return totalCost;
    }
    
    updateMedicalBillsCosts() {
        if (this.selectedPlans.length === 0) return;
        
        this.medicalBills.forEach(bill => {
            const costsElement = document.getElementById(`billCosts-${bill.id}`);
            if (!costsElement) return;
            
            costsElement.innerHTML = this.selectedPlans.map(plan => {
                const benefit = plan.benefits['Emergency Room'] || { type: 'deductible', amount: plan.annualDeductible, percentage: 20 };
                const cost = this.calculateBenefitCost(benefit, 1, bill.amount);
                return `
                    <div class="bill-cost">
                        <div class="bill-cost-label">${plan.name}</div>
                        <div class="bill-cost-value">$${cost.toLocaleString()}</div>
                    </div>
                `;
            }).join('');
        });
    }
    
    // Plan storage functionality
    storePlan(plan) {
        this.storedPlans.push(plan);
        localStorage.setItem('storedPlans', JSON.stringify(this.storedPlans));
    }
    
    loadStoredPlans() {
        const stored = localStorage.getItem('storedPlans');
        if (stored) {
            this.storedPlans = JSON.parse(stored);
            this.storedPlans.forEach(plan => {
                this.addPlanToGrid(plan);
            });
        }
    }
    
    removeCustomPlan(planId) {
        // Remove from stored plans
        this.storedPlans = this.storedPlans.filter(plan => plan.id !== planId);
        localStorage.setItem('storedPlans', JSON.stringify(this.storedPlans));
        
        // Remove from selected plans if selected
        this.removeSelectedPlan(planId);
        
        // Remove from grid
        const card = document.querySelector(`[data-plan-id="${planId}"]`);
        if (card) {
            card.remove();
        }
    }

    resetAll() {
        if (confirm('Are you sure you want to reset all data?')) {
            this.selectedPlans = [];
            this.comparisonResults = [];
            this.medicalBills = [];
            this.loadUsageScenario();
            this.updateSelectedPlansSummary();
            this.hideComparisonResults();
            this.displayMedicalBills();
            
            // Clear plan grid
            const planGrid = document.getElementById('planGrid');
            planGrid.innerHTML = '';
            
            // Reset all plan cards
            document.querySelectorAll('.plan-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Reload stored plans
            this.loadStoredPlans();
        }
    }
}

// Initialize the widget when the page loads
let syncWidget;
document.addEventListener('DOMContentLoaded', () => {
    syncWidget = new SyncBenefitComparison();
});



