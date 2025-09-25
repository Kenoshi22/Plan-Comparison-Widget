// Sync Benefit Comparison Widget JavaScript

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
        
        // Service cost reference for calculations
        this.serviceCosts = {
            'Primary Care Visit': 120,
            'Virtual Visits': 150,
            'Specialist Visit': 250,
            'Urgent Care': 450,
            'Emergency Room': 3000,
            'Lab Tests': 100,
            'Basic Imaging': 500,
            'Advanced Imaging': 1500,
            'Outpatient Visits': 3000,
            'Inpatient Visits': 2000, // per day
            'Surgery/Procedures': 4500,
            'Ambulatory Procedures': 4500,
            'Tier 1': 15,
            'Tier 2': 50,
            'Tier 3': 100,
            'Tier 4 - Preferred Brand Name': 200,
            'Tier 5 - Non-Preferred Brand Name': 400,
            'Tier 6 - Specialty Drugs': 600
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
        
        // Premiums
        document.getElementById('savePremiumsBtn').addEventListener('click', () => this.savePremiums());
        
        // Recalculate
        document.getElementById('recalculateBtn').addEventListener('click', () => this.performComparison());
        
        // Load sample plans
        document.getElementById('loadSamplePlansBtn').addEventListener('click', () => this.loadSamplePlans());
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
        
        // Load CSV plans as default
        this.loadCSVPlans();
        
        // Also load any stored plans (user-created plans)
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
        const amountInput = row.querySelector('.benefit-amount, .tier-amount');
        
        if (selectElement.value === 'deductible+coinsurance') {
            // Only show percentage field, hide amount field
            percentageInput.style.display = 'block';
            percentageInput.required = true;
            amountInput.style.display = 'none';
            amountInput.required = false;
            amountInput.value = '';
        } else if (selectElement.value === 'coinsurance') {
            // Only show percentage field, hide amount field
            percentageInput.style.display = 'block';
            percentageInput.required = true;
            amountInput.style.display = 'none';
            amountInput.required = false;
            amountInput.value = '';
        } else if (selectElement.value === 'deductible+copay') {
            // Show amount field for deductible, hide percentage
            percentageInput.style.display = 'none';
            percentageInput.required = false;
            percentageInput.value = '';
            amountInput.style.display = 'block';
            amountInput.required = true;
            amountInput.placeholder = 'Deductible Amount';
        } else {
            // Copay - show amount field, hide percentage
            percentageInput.style.display = 'none';
            percentageInput.required = false;
            percentageInput.value = '';
            amountInput.style.display = 'block';
            amountInput.required = true;
            amountInput.placeholder = 'Copay Amount';
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
            familyDeductible: parseInt(document.getElementById('familyDeductible').value) || 0,
            familyOOPMax: parseInt(document.getElementById('familyOOPMax').value) || 0,
            planYear: parseInt(document.getElementById('planYear').value) || 2025,
            benefits: this.extractBenefits(),
            premium: 0, // Will be entered in premiums section
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
            <div class="plan-type">${plan.type}${plan.metalLevel ? ' - ' + plan.metalLevel : ''}</div>
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
                ${plan.carrier ? `<div class="plan-detail">
                    <span class="plan-detail-label">Carrier:</span>
                    <span class="plan-detail-value">${plan.carrier}</span>
                </div>` : ''}
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
        // Check if plan is already selected
        const existingPlan = this.selectedPlans.find(p => p.id === plan.id);
        if (existingPlan) {
            // Unselect the plan
            this.removeSelectedPlan(plan.id);
            return;
        }
        
        if (this.selectedPlans.length >= 6) {
            alert('You can select up to 6 plans for comparison');
            return;
        }
        
        // Add plan to selected plans (premium will be entered later)
        this.selectedPlans.push(plan);
        this.updatePlanCardSelection(plan.id, true);
        this.updateSelectedPlansSummary();
        this.showEnterPremiumsSection();
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
            const totalOOP = costs.basicMedical + costs.majorMedical + costs.drugCosts + (costs.medicalBills || 0);
            const totalCost = totalOOP + plan.premium;
            
            return {
                ...plan,
                ...costs,
                totalOOP: totalOOP,
                totalCost: totalCost
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
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Primary Care Visit'], this.usageScenario.primaryVisits, 'Primary Care Visit');
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Specialist Visit'], this.usageScenario.specialistVisits, 'Specialist Visit');
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Urgent Care'], this.usageScenario.urgentCareVisits, 'Urgent Care');
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Lab Tests'], this.usageScenario.labTests, 'Lab Tests');
        costs.basicMedical += this.calculateBenefitCost(plan.benefits['Virtual Visits'], this.usageScenario.virtualVisits, 'Virtual Visits');
        
        // Calculate major medical costs
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Emergency Room'], this.usageScenario.erVisits, 'Emergency Room');
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Basic Imaging'], this.usageScenario.basicImaging, 'Basic Imaging');
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Advanced Imaging'], this.usageScenario.advancedImaging, 'Advanced Imaging');
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Outpatient Visits'], this.usageScenario.outpatientVisits, 'Outpatient Visits');
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Inpatient Visits'], this.usageScenario.inpatientVisits, 'Inpatient Visits');
        costs.majorMedical += this.calculateBenefitCost(plan.benefits['Surgery/Procedures'], this.usageScenario.surgeryVisits, 'Surgery/Procedures');
        
        // Calculate drug costs
        const monthlyDrugCosts = this.calculateDrugCosts(plan.benefits.prescription, this.usageScenario);
        costs.drugCosts = monthlyDrugCosts * 12;
        
        // Calculate medical bills costs
        costs.medicalBills = this.calculateMedicalBillsCosts(plan);
        
        // Calculate total out-of-pocket before applying limits
        const totalOOPBeforeLimits = costs.basicMedical + costs.majorMedical + costs.drugCosts + costs.medicalBills;
        
        // Apply deductible and OOP max
        if (totalOOPBeforeLimits > plan.annualDeductible) {
            costs.totalOOP = Math.min(totalOOPBeforeLimits, plan.annualOOPMax);
        } else {
            costs.totalOOP = totalOOPBeforeLimits;
        }
        
        return costs;
    }

    calculateBenefitCost(benefit, visits, serviceType) {
        if (!benefit || visits === 0) return 0;
        
        // Use flat amount from serviceCosts instead of defaultCost parameter
        const serviceCost = this.serviceCosts[serviceType] || 0;
        const totalCost = visits * serviceCost;
        
        switch (benefit.type) {
            case 'copay':
                return visits * benefit.amount;
            case 'deductible+coinsurance':
                // For deductible + coinsurance, use the plan's deductible amount
                const planDeductible = benefit.amount || 0;
                const deductibleAmount = Math.min(totalCost, planDeductible);
                const remainingCost = Math.max(0, totalCost - planDeductible);
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
        
        // Calculate drug costs based on tier usage using flat amounts
        const tier1Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 1'], usageScenario.tier1Drugs, 'Tier 1');
        const tier2Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 2'], usageScenario.tier2Drugs, 'Tier 2');
        const tier3Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 3'], usageScenario.tier3Drugs, 'Tier 3');
        const tier4Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 4 - Preferred Brand Name'], usageScenario.tier4Drugs, 'Tier 4 - Preferred Brand Name');
        const tier5Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 5 - Non-Preferred Brand Name'], usageScenario.tier5Drugs, 'Tier 5 - Non-Preferred Brand Name');
        const tier6Cost = this.calculateBenefitCost(prescriptionBenefits['Tier 6 - Specialty Drugs'], usageScenario.tier6Drugs, 'Tier 6 - Specialty Drugs');
        
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
        
        // Update medical bills breakdown
        this.updateMedicalBillsBreakdown();
    }
    
    updateMedicalBillsBreakdown() {
        const breakdownSection = document.getElementById('medicalBillsBreakdown');
        const breakdownContainer = document.getElementById('billsBreakdownContainer');
        
        if (this.medicalBills.length === 0) {
            breakdownSection.style.display = 'none';
            return;
        }
        
        breakdownSection.style.display = 'block';
        breakdownContainer.innerHTML = '';
        
        this.medicalBills.forEach(bill => {
            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'bill-breakdown-item';
            
            const costs = this.selectedPlans.map(plan => {
                const benefit = plan.benefits[bill.benefitType] || { type: 'deductible', amount: plan.annualDeductible, percentage: 20 };
                const serviceCost = this.serviceCosts[bill.benefitType] || bill.amount;
                const cost = this.calculateBenefitCost(benefit, 1, serviceCost);
                return {
                    planName: plan.name,
                    cost: cost
                };
            });
            
            breakdownItem.innerHTML = `
                <div class="bill-breakdown-header">
                    <div class="bill-breakdown-title">${bill.description}</div>
                    <div class="bill-breakdown-amount">$${bill.amount.toLocaleString()}</div>
                </div>
                <div class="bill-breakdown-benefit">Benefit Type: ${bill.benefitType}</div>
                <div class="bill-breakdown-costs">
                    ${costs.map(cost => `
                        <div class="bill-breakdown-cost">
                            <div class="bill-breakdown-cost-plan">${cost.planName}</div>
                            <div class="bill-breakdown-cost-value">$${cost.cost.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            breakdownContainer.appendChild(breakdownItem);
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
        const benefitType = document.getElementById('billBenefitType').value;
        
        if (!description || !amount || amount <= 0) {
            alert('Please enter a valid description and amount');
            return;
        }
        
        const bill = {
            id: Date.now().toString(),
            description: description,
            amount: amount,
            benefitType: benefitType
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
                    <div class="bill-benefit-type">${bill.benefitType}</div>
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
            const benefit = plan.benefits[bill.benefitType] || { type: 'deductible', amount: plan.annualDeductible, percentage: 20 };
            // Use the bill amount as the service cost for medical bills
            const serviceCost = this.serviceCosts[bill.benefitType] || bill.amount;
            totalCost += this.calculateBenefitCost(benefit, 1, serviceCost);
        });
        
        return totalCost;
    }
    
    updateMedicalBillsCosts() {
        if (this.selectedPlans.length === 0) return;
        
        this.medicalBills.forEach(bill => {
            const costsElement = document.getElementById(`billCosts-${bill.id}`);
            if (!costsElement) return;
            
            costsElement.innerHTML = this.selectedPlans.map(plan => {
                const benefit = plan.benefits[bill.benefitType] || { type: 'deductible', amount: plan.annualDeductible, percentage: 20 };
                const serviceCost = this.serviceCosts[bill.benefitType] || bill.amount;
                const cost = this.calculateBenefitCost(benefit, 1, serviceCost);
                return `
                    <div class="bill-cost">
                        <div class="bill-cost-label">${plan.name}</div>
                        <div class="bill-cost-value">$${cost.toLocaleString()}</div>
                    </div>
                `;
            }).join('');
        });
    }
    
    // Premium handling methods
    showEnterPremiumsSection() {
        const section = document.getElementById('enterPremiumsSection');
        const grid = document.getElementById('premiumsGrid');
        
        grid.innerHTML = '';
        this.selectedPlans.forEach(plan => {
            const premiumGroup = document.createElement('div');
            premiumGroup.className = 'premium-input-group';
            premiumGroup.innerHTML = `
                <div class="premium-plan-name">${plan.name}</div>
                <div class="form-group">
                    <label for="premium-${plan.id}">Monthly Premium ($)</label>
                    <input type="number" id="premium-${plan.id}" class="premium-input" min="0" step="0.01" placeholder="Enter monthly premium">
                </div>
            `;
            grid.appendChild(premiumGroup);
        });
        
        section.style.display = 'block';
    }
    
    savePremiums() {
        let allPremiumsEntered = true;
        
        this.selectedPlans.forEach(plan => {
            const premiumInput = document.getElementById(`premium-${plan.id}`);
            const monthlyPremium = parseFloat(premiumInput.value);
            
            if (isNaN(monthlyPremium) || monthlyPremium < 0) {
                allPremiumsEntered = false;
                premiumInput.style.borderColor = 'var(--danger)';
            } else {
                plan.premium = monthlyPremium * 12; // Convert to annual
                premiumInput.style.borderColor = 'var(--border-gray)';
            }
        });
        
        if (!allPremiumsEntered) {
            alert('Please enter valid monthly premiums for all selected plans');
            return;
        }
        
        // Hide premiums section and show comparison
        document.getElementById('enterPremiumsSection').style.display = 'none';
        this.performComparison();
    }
    
    // Plan storage functionality
    storePlan(plan) {
        this.storedPlans.push(plan);
        localStorage.setItem('storedPlans', JSON.stringify(this.storedPlans));
    }
    
    // CSV plan import functionality
    parseCSVPlans(csvData) {
        console.log('Parsing CSV data...');
        const lines = csvData.split('\n');
        console.log('CSV lines:', lines.length);
        const headers = lines[0].split(',');
        console.log('Headers:', headers);
        const plans = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                console.log('Processing line', i, ':', values[0]);
                const plan = this.createPlanFromCSV(headers, values);
                if (plan) {
                    plans.push(plan);
                    console.log('Added plan:', plan.name);
                }
            }
        }
        
        console.log('Total plans parsed:', plans.length);
        return plans;
    }
    
    createPlanFromCSV(headers, values) {
        try {
            const planData = {};
            headers.forEach((header, index) => {
                planData[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            // Skip if no plan name
            if (!planData['Plan Name']) {
                console.log('Skipping plan - no name:', planData);
                return null;
            }
            
            const plan = {
                id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: planData['Plan Name'],
                type: this.mapNetworkToType(planData['Network']),
                annualDeductible: this.parseAmount(planData[' in-network Deductible (individual) ']),
                annualOOPMax: this.parseAmount(planData[' In-network out of pocket max (individual) ']),
                familyDeductible: this.parseAmount(planData['  in-network deductible (family) ']),
                familyOOPMax: this.parseAmount(planData[' In-network out of pocket max (family) ']),
                planYear: parseInt(planData['Plan Year']) || 2025,
                carrier: planData['Carrier'],
                network: planData['Network'],
                metalLevel: planData['Metal Level'],
                hsa: planData['HSA (y/n)'] === 'Yes',
                productType: planData['Product Type'],
                benefits: this.createBenefitsFromCSV(planData),
                premium: 0,
                isCustom: false,
                isCSV: true
            };
            
            console.log('Created plan:', plan.name, plan.type, plan.metalLevel);
            return plan;
        } catch (error) {
            console.error('Error creating plan from CSV:', error, planData);
            return null;
        }
    }
    
    mapNetworkToType(network) {
        if (network.includes('BlueOptions')) return 'PPO';
        if (network.includes('BlueSelect')) return 'PPO';
        if (network.includes('BlueCare')) return 'HMO';
        if (network.includes('MyBlue')) return 'HMO';
        return 'PPO';
    }
    
    parseAmount(amountStr) {
        if (!amountStr || amountStr === 'Not Covered') return 0;
        const cleaned = amountStr.replace(/[$,]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    createBenefitsFromCSV(planData) {
        const benefits = {};
        
        // Map CSV columns to benefit types
        const benefitMapping = {
            'Family Physician Office visit': 'Primary Care Visit',
            'Family Physician Virtual Visit': 'Virtual Visits',
            'Specialist vist': 'Specialist Visit',
            'Urgent Care': 'Urgent Care',
            'Emergency Room visit': 'Emergency Room',
            'Abulatory Surgery Center': 'Ambulatory Procedures',
            'Inpatient Hospital': 'Inpatient Visits',
            'Outpatient Hospital': 'Outpatient Visits',
            'Independent Clinical Lab': 'Lab Tests',
            'Diagnostic Services': 'Basic Imaging',
            'Imaging Services ': 'Advanced Imaging'
        };
        
        Object.entries(benefitMapping).forEach(([csvKey, benefitKey]) => {
            const value = planData[csvKey];
            if (value && value !== 'Not Covered') {
                benefits[benefitKey] = this.parseBenefitValue(value);
            }
        });
        
        // Add prescription benefits
        benefits.prescription = this.createPrescriptionBenefits(planData);
        
        return benefits;
    }
    
    parseBenefitValue(value) {
        if (value.includes('DED +')) {
            const parts = value.split('DED +');
            const percentage = parseFloat(parts[1].replace('%', ''));
            return {
                type: 'deductible+coinsurance',
                amount: 0, // Will use plan deductible
                percentage: percentage || 0
            };
        } else if (value.includes('%')) {
            const percentage = parseFloat(value.replace('%', ''));
            return {
                type: 'coinsurance',
                amount: 0,
                percentage: percentage || 0
            };
        } else {
            const amount = this.parseAmount(value);
            return {
                type: 'copay',
                amount: amount,
                percentage: 0
            };
        }
    }
    
    createPrescriptionBenefits(planData) {
        const prescriptionBenefits = {};
        
        const tierMapping = {
            'Prescription Tier 1': 'Tier 1',
            'Prescription Tier 2': 'Tier 2',
            'Prescription Tier 3': 'Tier 3',
            'Prescription Tier 4': 'Tier 4 - Preferred Brand Name',
            'Prescription Tier 5': 'Tier 5 - Non-Preferred Brand Name',
            'Prescription Tier 6': 'Tier 6 - Specialty Drugs'
        };
        
        Object.entries(tierMapping).forEach(([csvKey, tierKey]) => {
            const value = planData[csvKey];
            if (value && value !== 'Not Covered') {
                prescriptionBenefits[tierKey] = this.parseBenefitValue(value);
            }
        });
        
        return prescriptionBenefits;
    }
    
    loadCSVPlans() {
        // This would typically load from a file, but for now we'll add the data directly
        const csvData = `Plan Name,Network,Metal Level,HSA (y/n),Product Type,Carrier,Plan Year, in-network Deductible (individual) ,  in-network deductible (family) , Out-of-network Deductible (individual) , Out-of-network Deductible (family) , Coinsurance (in-network) , Coinsurance (out-of-network) , In-network out of pocket max (individual) , In-network out of pocket max (family) , out-of-network out of pocket max (individual)  , out-of-network out of pocket max (family) ,Family Physician Office visit,Family Physician Virtual Visit,Specialist vist,Prescription Deductible ,Prescription Tier 1,Prescription Tier 2,Prescription Tier 3,Prescription Tier 4,Prescription Tier 5,Prescription Tier 6,Prescription Tier 7,Urgent Care,Emergency Room visit,Abulatory Surgery Center,Inpatient Hospital,Outpatient Hospital,Independent Clinical Lab,Diagnostic Services,Imaging Services 
24J01-08,BlueOptions ,Platinum ,No,U65 On Exchange,Florida Blue,2025,$0.00 ,$0.00 ,$500.00 ,$0.00 ,20%,50%,"$2,275.00 ","$4,550.00 ","$12,500.00 ","$25,000.00 ",$10.00 ,$0.00 ,$20.00 ,$0.00 ,$0.00 ,$4.00 ,$10.00 ,$20.00 ,$40.00 ,30%,50%,$20.00 ,$225.00 ,$200.00 ,350 per day 1050 max,$300.00 ,$0.00 ,$75.00 ,$150.00 
1457,BlueSelect,Platinum ,No,U65 On Exchange,Florida Blue,2025,$0.00 ,$0.00 ,$500.00 ,$0.00 ,20%,50%,"$2,275.00 ","$4,550.00 ","$12,500.00 ","$25,000.00 ",$10.00 ,$0.00 ,$20.00 ,$0.00 ,$0.00 ,$4.00 ,$10.00 ,$20.00 ,$40.00 ,30%,50%,$20.00 ,$225.00 ,$200.00 ,350 per day 1050 max,$300.00 ,$0.00 ,$75.00 ,$150.00 
24K01-07 ,BlueCare,Platinum ,No,U65 On Exchange,Florida Blue,2025,$0.00 ,$0.00 ,$500.00 ,$0.00 ,20%,50%,"$2,275.00 ","$4,550.00 ","$12,500.00 ","$25,000.00 ",$10.00 ,$0.00 ,$20.00 ,$0.00 ,$0.00 ,$4.00 ,$10.00 ,$20.00 ,$40.00 ,30%,50%,$20.00 ,$225.00 ,$200.00 ,350 per day 1050 max,$300.00 ,$0.00 ,$75.00 ,$150.00 
24K01-015,BlueCare,Platinum ,No,U65 On Exchange,Florida Blue,2025,$0.00 ,$0.00 ,$500.00 ,$0.00 ,20%,50%,"$2,275.00 ","$4,550.00 ","$12,500.00 ","$25,000.00 ",$10.00 ,$0.00 ,$20.00 ,$0.00 ,$0.00 ,$4.00 ,$10.00 ,$20.00 ,$40.00 ,30%,50%,$20.00 ,$225.00 ,$200.00 ,350 per day 1050 max,$300.00 ,$0.00 ,$75.00 ,$150.00 
24J01-05,BlueOptions ,Platinum ,No,U65 On Exchange,Florida Blue,2025,"$1,000.00 ","$2,000.00 ","$2,000.00 ","$4,000.00 ",10%,50%,"$4,000.00 ","$8,000.00 ","$8,000.00 ","$16,000.00 ",$15.00 ,$0.00 ,$35.00 ,$0.00 ,$0.00 ,$4.00 ,$15.00 ,$23.00 ,$45.00 ,30%,50%,$35.00 ,DED + 10%,DED + 10%,DED + 10%,DED + 10%,$0.00 ,DED + 10%,DED + 10%`;
        
        console.log('Loading CSV plans...');
        const csvPlans = this.parseCSVPlans(csvData);
        console.log('Parsed CSV plans:', csvPlans.length);
        
        csvPlans.forEach(plan => {
            this.storedPlans.push(plan);
            this.addPlanToGrid(plan);
        });
        
        console.log('Total stored plans:', this.storedPlans.length);
        localStorage.setItem('storedPlans', JSON.stringify(this.storedPlans));
    }
    
    loadSamplePlans() {
        // Clear existing plans first
        this.storedPlans = [];
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        // Clear localStorage
        localStorage.removeItem('storedPlans');
        
        // Load CSV plans
        this.loadCSVPlans();
        
        alert('Sample plans loaded successfully!');
    }
    
    loadStoredPlans() {
        const stored = localStorage.getItem('storedPlans');
        if (stored) {
            const storedPlans = JSON.parse(stored);
            // Only add custom plans (not CSV plans) to avoid duplicates
            const customPlans = storedPlans.filter(plan => plan.isCustom);
            customPlans.forEach(plan => {
                this.storedPlans.push(plan);
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
            
            // Hide premiums section
            document.getElementById('enterPremiumsSection').style.display = 'none';
            
            // Reset all plan cards selection but keep them in grid
            document.querySelectorAll('.plan-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Don't clear the plan grid - keep stored plans available
        }
    }
}

// Initialize the widget when the page loads
let syncWidget;
document.addEventListener('DOMContentLoaded', () => {
    syncWidget = new SyncBenefitComparison();
});

