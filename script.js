// Health Plan Comparison Widget - Simplified Version
class SyncBenefitComparison {
    constructor() {
        this.selectedPlans = [];
        this.comparisonResults = [];
        this.usageScenario = {
            primaryCareVisits: 0,
            specialistVisits: 0,
            urgentCareVisits: 0,
            emergencyRoomVisits: 0,
            ambulanceRides: 0,
            inpatientDays: 0,
            outpatientVisits: 0,
            basicImagingVisits: 0,
            advancedImagingVisits: 0,
            labTests: 0,
            ambulatoryProcedures: 0,
            prescriptionTier1: 0,
            prescriptionTier2: 0,
            prescriptionTier3: 0,
            prescriptionTier4: 0,
            prescriptionTier5: 0,
            prescriptionTier6: 0
        };
        this.medicalBills = [];
        this.storedPlans = [];
        this.customPlans = [];
        this.serviceCosts = {
            'Primary Care Visit': 120,
            'Specialist Visit': 250,
            'Urgent Care': 450,
            'Emergency Room': 3000,
            'Ambulance': 0,
            'Inpatient Visits': 2000,
            'Outpatient Visits': 3000,
            'Basic Imaging': 500,
            'Advanced Imaging': 1500,
            'Lab Tests': 100,
            'Ambulatory Procedures': 4500,
            'Tier 1': 15,
            'Tier 2': 50,
            'Tier 3': 100,
            'Tier 4 - Preferred Brand Name': 200,
            'Tier 5 - Non-Preferred Brand Name': 400,
            'Tier 6 - Specialty Drugs': 600
        };
        
        // GitHub API configuration for saving to plans folder
        this.githubConfig = {
            owner: '', // Your GitHub username/organization
            repo: 'Health_Plan_Comparison', // Your repository name
            token: '', // GitHub personal access token
            branch: 'main' // Default branch
        };
        
        // Load GitHub config from localStorage or environment
        this.loadGitHubConfig();
        
        // Initialize asynchronously
        this.init().catch(error => {
            console.error('Error initializing widget:', error);
        });
    }

    async init() {
        this.bindEvents();
        await this.loadExamplePlans();
        this.loadCustomPlans();
    }

    bindEvents() {
        // Plan selection events
        document.getElementById('addPlanBtn').addEventListener('click', () => this.showModal('customPlanModal'));
        document.getElementById('loadSamplePlansBtn').addEventListener('click', () => this.loadSamplePlans());
        
        // Search and filter events
        document.getElementById('planSearchInput').addEventListener('input', () => this.filterPlans());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('metalLevelFilter').addEventListener('change', () => this.filterPlans());
        document.getElementById('networkFilter').addEventListener('change', () => this.filterPlans());
        document.getElementById('carrierFilter').addEventListener('change', () => this.filterPlans());
        
        // Modal events
        document.getElementById('savePlan').addEventListener('click', () => this.saveCustomPlan());
        document.getElementById('cancelPlan').addEventListener('click', () => this.hideModal('customPlanModal'));
        
        // Reset event
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
        
        // Medical bills events
        document.getElementById('addBillBtn').addEventListener('click', () => this.addMedicalBill());
        
        // Premiums events
        document.getElementById('savePremiumsBtn').addEventListener('click', () => this.savePremiums());
        
        // Recalculate event
        document.getElementById('recalculateBtn').addEventListener('click', () => this.performComparison());
        
        // Usage scenario events - add listeners to all usage input fields
        const usageInputs = [
            'primaryVisits', 'specialistVisits', 'urgentCareVisits', 'erVisits',
            'inpatientVisits', 'outpatientVisits', 'basicImaging', 'advancedImaging',
            'labTests', 'surgeryVisits', 'tier1Drugs', 'tier2Drugs', 'tier3Drugs',
            'tier4Drugs', 'tier5Drugs', 'tier6Drugs'
        ];
        
        usageInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.updateUsageScenario());
            }
        });
    }
    
    async loadExamplePlans() {
        console.log('Loading plans from all-plans.json...');
        
        try {
            // Try to load from the plans directory
            const response = await fetch('./Plan-Comparison-Widget/plans/all-plans.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const plans = await response.json();
            console.log('Loaded plans from JSON file:', plans.length);
            
            // Add all plans to the stored plans and grid
            plans.forEach(plan => {
                // Ensure the plan has the required structure
                if (!plan.id) {
                    plan.id = plan.name || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                
                // Set default values for missing fields
                plan.isCustom = false;
                plan.isExample = false;
                plan.premium = plan.premium || 0;
                
                this.storedPlans.push(plan);
                this.addPlanToGrid(plan);
            });
            
            console.log('Successfully loaded', this.storedPlans.length, 'plans');
            
        } catch (error) {
            console.error('Error loading plans from JSON file:', error);
            console.log('Falling back to hardcoded example plans...');
            
            // Fallback to hardcoded example plans if JSON loading fails
            const examplePlans = [
                {
                    id: 'example_1',
                    name: 'BlueOptions Platinum',
                    type: 'PPO',
                    annualDeductible: 0,
                    annualOOPMax: 2275,
                    familyDeductible: 0,
                    familyOOPMax: 4550,
                    planYear: 2025,
                    carrier: 'Florida Blue',
                    network: 'BlueOptions',
                    metalLevel: 'Platinum',
                    hsa: false,
                    productType: 'U65 On Exchange',
                    benefits: {
                        primaryCare: { type: 'Copay', amount: 10, percentage: 0 },
                        specialistVisit: { type: 'Copay', amount: 20, percentage: 0 },
                        urgentCare: { type: 'Copay', amount: 20, percentage: 0 },
                        emergencyRoom: { type: 'Copay', amount: 225, percentage: 0 },
                        ambulance: { type: 'Copay', amount: 0, percentage: 0 },
                        inpatient: { type: 'Copay', amount: 200, percentage: 0 },
                        outpatient: { type: 'Copay', amount: 300, percentage: 0 },
                        basicImaging: { type: 'Copay', amount: 75, percentage: 0 },
                        advancedImaging: { type: 'Copay', amount: 150, percentage: 0 },
                        labWork: { type: 'Copay', amount: 0, percentage: 0 },
                        ambulatoryProcedures: { type: 'Copay', amount: 0, percentage: 0 }
                    },
                    prescriptionBenefits: {
                        tier1: { type: 'Copay', amount: 4, percentage: 0 },
                        tier2: { type: 'Copay', amount: 10, percentage: 0 },
                        tier3: { type: 'Copay', amount: 20, percentage: 0 },
                        tier4: { type: 'Copay', amount: 40, percentage: 0 },
                        tier5: { type: 'Copay', amount: 0, percentage: 0 },
                        tier6: { type: 'Copay', amount: 0, percentage: 0 }
                    },
                    premium: 0,
                    isCustom: false,
                    isExample: true
                }
            ];
            
            examplePlans.forEach(plan => {
                this.storedPlans.push(plan);
                this.addPlanToGrid(plan);
            });
            
            console.log('Loaded fallback example plans:', this.storedPlans.length);
        }
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
        
        const isSelected = this.selectedPlans.some(p => p.id === plan.id);
        if (isSelected) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="plan-header">
                <h3>${plan.name}</h3>
                ${plan.isCustom ? '<button class="remove-plan-btn" onclick="event.stopPropagation(); syncWidget.removeCustomPlan(\'' + plan.id + '\')">×</button>' : ''}
            </div>
            <div class="plan-details">
                <div class="plan-type">${plan.type} - ${plan.metalLevel}</div>
                <div class="plan-carrier">${plan.carrier}</div>
                <div class="plan-network">${plan.network}</div>
                <div class="plan-deductible">Deductible: $${plan.annualDeductible.toLocaleString()}</div>
                <div class="plan-oop">OOP Max: $${plan.annualOOPMax.toLocaleString()}</div>
                ${plan.hsa ? '<div class="plan-hsa">HSA Eligible</div>' : ''}
                ${plan.productType ? `<div class="plan-product-type">${plan.productType}</div>` : ''}
            </div>
        `;
        
        card.addEventListener('click', () => this.selectPlan(plan));
        return card;
    }
    
    selectPlan(plan) {
        const existingIndex = this.selectedPlans.findIndex(p => p.id === plan.id);
        
        if (existingIndex > -1) {
            // Plan is already selected, unselect it
            this.selectedPlans.splice(existingIndex, 1);
            document.querySelector(`[data-plan-id="${plan.id}"]`).classList.remove('selected');
        } else {
            // Add plan to selection
            this.selectedPlans.push(plan);
            document.querySelector(`[data-plan-id="${plan.id}"]`).classList.add('selected');
        }
        
        this.updateSelectedPlansDisplay();
        this.showEnterPremiumsSection();
    }
    
    updateSelectedPlansDisplay() {
        const selectedPlansDiv = document.getElementById('selectedPlansList');
        const selectedPlansSummary = document.getElementById('selectedPlansSummary');
        const selectedCount = document.getElementById('selectedCount');
        
        selectedPlansDiv.innerHTML = '';
        
        if (this.selectedPlans.length > 0) {
            selectedPlansSummary.style.display = 'block';
            selectedCount.textContent = this.selectedPlans.length;
            
            this.selectedPlans.forEach(plan => {
                const planDiv = document.createElement('div');
                planDiv.className = 'selected-plan-tag';
                planDiv.innerHTML = `
                    <span>${plan.name}</span>
                    <button class="remove-plan" onclick="syncWidget.removeSelectedPlan('${plan.id}')">×</button>
                `;
                selectedPlansDiv.appendChild(planDiv);
            });
        } else {
            selectedPlansSummary.style.display = 'none';
        }
    }
    
    removeSelectedPlan(planId) {
        this.selectedPlans = this.selectedPlans.filter(p => p.id !== planId);
        document.querySelector(`[data-plan-id="${planId}"]`).classList.remove('selected');
        this.updateSelectedPlansDisplay();
        this.showEnterPremiumsSection();
    }
    
    showEnterPremiumsSection() {
        const section = document.getElementById('enterPremiumsSection');
        if (this.selectedPlans.length > 0) {
            section.style.display = 'block';
            
            const premiumsGrid = document.getElementById('premiumsGrid');
            premiumsGrid.innerHTML = '';
            
            this.selectedPlans.forEach(plan => {
                const premiumGroup = document.createElement('div');
                premiumGroup.className = 'premium-input-group';
                premiumGroup.innerHTML = `
                    <div class="premium-plan-name">${plan.name}</div>
                    <input type="number" class="premium-input" data-plan-id="${plan.id}" placeholder="Enter monthly premium ($)" min="0" step="0.01">
                `;
                premiumsGrid.appendChild(premiumGroup);
            });
        } else {
            section.style.display = 'none';
        }
    }
    
    savePremiums() {
        const premiumInputs = document.querySelectorAll('.premium-input');
        let allFilled = true;
        let hasValidPremiums = false;
        
        premiumInputs.forEach(input => {
            const planId = input.dataset.planId;
            const monthlyPremium = parseFloat(input.value) || 0;
            const annualPremium = monthlyPremium * 12;
            
            const plan = this.selectedPlans.find(p => p.id === planId);
            if (plan) {
                plan.premium = annualPremium;
                if (monthlyPremium > 0) {
                    hasValidPremiums = true;
                }
            }
            
            if (monthlyPremium === 0) {
                allFilled = false;
            }
        });
        
        if (!allFilled) {
            alert('Please enter monthly premiums for all selected plans.');
            return;
        }
        
        if (!hasValidPremiums) {
            alert('Please enter valid monthly premiums (greater than $0) for at least one plan.');
            return;
        }
        
        console.log('Premiums saved:', this.selectedPlans.map(p => ({ name: p.name, monthly: p.premium/12, annual: p.premium })));
        this.performComparison();
    }
    
    performComparison() {
        if (this.selectedPlans.length < 2) {
            alert('Please select at least 2 plans to compare.');
            return;
        }
        
        this.comparisonResults = this.selectedPlans.map(plan => {
            const costs = this.calculatePlanCosts(plan);
            return {
                plan: plan,
                ...costs
            };
        });
        
        this.updateComparisonTable();
        this.updateMedicalBillsBreakdown();
        
        // Show the comparison results section
        const comparisonResults = document.getElementById('comparisonResults');
        if (comparisonResults) {
            comparisonResults.style.display = 'block';
        }
    }
    
    calculatePlanCosts(plan) {
        let totalOOP = 0;
        let totalCost = 0;
        
        // Calculate medical costs
        const medicalCosts = this.calculateMedicalCosts(plan);
        totalOOP += medicalCosts;
        totalCost += medicalCosts;
        
        // Calculate prescription costs
        const prescriptionCosts = this.calculateDrugCosts(plan.prescriptionBenefits, this.usageScenario);
        totalOOP += prescriptionCosts;
        totalCost += prescriptionCosts;
        
        // Calculate medical bills costs
        const medicalBillsCosts = this.calculateMedicalBillsCosts(plan);
        totalOOP += medicalBillsCosts;
        totalCost += medicalBillsCosts;
        
        // Apply deductible and OOP max
        if (totalOOP > plan.annualDeductible) {
            const afterDeductible = totalOOP - plan.annualDeductible;
            totalOOP = plan.annualDeductible + (afterDeductible * 0.2); // Assume 20% coinsurance after deductible
        }
        
        if (totalOOP > plan.annualOOPMax) {
            totalOOP = plan.annualOOPMax;
        }
        
        totalCost = totalOOP + plan.premium;
        
        return {
            medicalCosts,
            prescriptionCosts,
            medicalBillsCosts,
            totalOOP,
            totalCost
        };
    }
    
    calculateMedicalCosts(plan) {
        let total = 0;
        
        Object.entries(this.usageScenario).forEach(([key, visits]) => {
            if (visits > 0 && key !== 'prescriptionTier1' && key !== 'prescriptionTier2' && key !== 'prescriptionTier3' && key !== 'prescriptionTier4' && key !== 'prescriptionTier5' && key !== 'prescriptionTier6') {
                const serviceType = this.mapUsageKeyToServiceType(key);
                const benefit = plan.benefits[this.mapServiceTypeToBenefitKey(serviceType)];
                if (benefit) {
                    total += this.calculateBenefitCost(benefit, visits, serviceType);
                }
            }
        });
        
        return total;
    }
    
    calculateBenefitCost(benefit, visits, serviceType) {
        const serviceCost = this.serviceCosts[serviceType] || 0;
        const totalServiceCost = serviceCost * visits;
        
        if (benefit.type === 'Copay') {
            return benefit.amount * visits;
        } else if (benefit.type === 'Deductible + Coinsurance') {
            const deductibleAmount = benefit.amount || 0;
            if (totalServiceCost <= deductibleAmount) {
                return totalServiceCost;
            } else {
                const afterDeductible = totalServiceCost - deductibleAmount;
                return deductibleAmount + (afterDeductible * (benefit.percentage / 100));
            }
        } else if (benefit.type === 'Coinsurance') {
            return totalServiceCost * (benefit.percentage / 100);
        } else if (benefit.type === 'Deductible + Copay') {
            return benefit.copay * visits;
        }
        
        return 0;
    }
    
    calculateDrugCosts(prescriptionBenefits, usageScenario) {
        let total = 0;
        
        const tierMapping = {
            'prescriptionTier1': 'Tier 1',
            'prescriptionTier2': 'Tier 2',
            'prescriptionTier3': 'Tier 3',
            'prescriptionTier4': 'Tier 4 - Preferred Brand Name',
            'prescriptionTier5': 'Tier 5 - Non-Preferred Brand Name',
            'prescriptionTier6': 'Tier 6 - Specialty Drugs'
        };
        
        Object.entries(tierMapping).forEach(([usageKey, tierKey]) => {
            const visits = usageScenario[usageKey] || 0;
            if (visits > 0 && prescriptionBenefits[tierKey]) {
                const benefit = prescriptionBenefits[tierKey];
                const serviceCost = this.serviceCosts[tierKey] || 0;
                const totalServiceCost = serviceCost * visits;
                
                if (benefit.type === 'Copay') {
                    total += benefit.amount * visits;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    const deductibleAmount = benefit.amount || 0;
                    if (totalServiceCost <= deductibleAmount) {
                        total += totalServiceCost;
                    } else {
                        const afterDeductible = totalServiceCost - deductibleAmount;
                        total += deductibleAmount + (afterDeductible * (benefit.percentage / 100));
                    }
                } else if (benefit.type === 'Coinsurance') {
                    total += totalServiceCost * (benefit.percentage / 100);
                } else if (benefit.type === 'Deductible + Copay') {
                    total += benefit.copay * visits;
                }
            }
        });
        
        return total;
    }
    
    calculateMedicalBillsCosts(plan) {
        let total = 0;
        
        this.medicalBills.forEach(bill => {
            const serviceCost = this.serviceCosts[bill.benefitType] || bill.amount;
            const benefit = plan.benefits[this.mapServiceTypeToBenefitKey(bill.benefitType)];
            
            if (benefit) {
                if (benefit.type === 'Copay') {
                    total += benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    const deductibleAmount = benefit.amount || 0;
                    if (serviceCost <= deductibleAmount) {
                        total += serviceCost;
                    } else {
                        const afterDeductible = serviceCost - deductibleAmount;
                        total += deductibleAmount + (afterDeductible * (benefit.percentage / 100));
                    }
                } else if (benefit.type === 'Coinsurance') {
                    total += serviceCost * (benefit.percentage / 100);
                } else if (benefit.type === 'Deductible + Copay') {
                    total += benefit.copay;
                }
            }
        });
        
        return total;
    }
    
    mapUsageKeyToServiceType(key) {
        const mapping = {
            'primaryCareVisits': 'Primary Care Visit',
            'specialistVisits': 'Specialist Visit',
            'urgentCareVisits': 'Urgent Care',
            'emergencyRoomVisits': 'Emergency Room',
            'ambulanceRides': 'Ambulance',
            'inpatientDays': 'Inpatient Visits',
            'outpatientVisits': 'Outpatient Visits',
            'basicImagingVisits': 'Basic Imaging',
            'advancedImagingVisits': 'Advanced Imaging',
            'labTests': 'Lab Tests',
            'ambulatoryProcedures': 'Ambulatory Procedures'
        };
        return mapping[key] || key;
    }
    
    mapServiceTypeToBenefitKey(serviceType) {
        const mapping = {
            'Primary Care Visit': 'primaryCare',
            'Specialist Visit': 'specialistVisit',
            'Urgent Care': 'urgentCare',
            'Emergency Room': 'emergencyRoom',
            'Ambulance': 'ambulance',
            'Inpatient Visits': 'inpatient',
            'Outpatient Visits': 'outpatient',
            'Basic Imaging': 'basicImaging',
            'Advanced Imaging': 'advancedImaging',
            'Lab Tests': 'labWork',
            'Ambulatory Procedures': 'ambulatoryProcedures'
        };
        return mapping[serviceType] || serviceType;
    }
    
    updateComparisonTable() {
        const tableBody = document.getElementById('comparisonTableBody');
        tableBody.innerHTML = '';
        
        this.comparisonResults.forEach(result => {
            const row = document.createElement('tr');
            const monthlyPremium = result.plan.premium / 12;
            row.innerHTML = `
                <td>${result.plan.name}</td>
                <td>$${result.plan.premium.toLocaleString()} <small>($${monthlyPremium.toFixed(2)}/mo)</small></td>
                <td>$${result.medicalCosts.toLocaleString()}</td>
                <td>$${result.prescriptionCosts.toLocaleString()}</td>
                <td>$${result.medicalBillsCosts.toLocaleString()}</td>
                <td>$${result.totalOOP.toLocaleString()}</td>
                <td>$${result.totalCost.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    updateMedicalBillsBreakdown() {
        const breakdown = document.getElementById('medicalBillsBreakdown');
        breakdown.innerHTML = '';
        
        if (this.medicalBills.length === 0) return;
        
        const header = document.createElement('div');
        header.className = 'bill-breakdown-header';
        header.innerHTML = '<h3>Medical Bills Breakdown</h3>';
        breakdown.appendChild(header);
        
        this.medicalBills.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.className = 'bill-breakdown-item';
            
            const title = document.createElement('div');
            title.className = 'bill-breakdown-title';
            title.textContent = bill.description;
            billDiv.appendChild(title);
            
            const amount = document.createElement('div');
            amount.className = 'bill-breakdown-amount';
            amount.textContent = `$${bill.amount.toLocaleString()}`;
            billDiv.appendChild(amount);
            
            const benefit = document.createElement('div');
            benefit.className = 'bill-breakdown-benefit';
            benefit.textContent = bill.benefitType;
            billDiv.appendChild(benefit);
            
            const costs = document.createElement('div');
            costs.className = 'bill-breakdown-costs';
            
            this.comparisonResults.forEach(result => {
                const costDiv = document.createElement('div');
                costDiv.className = 'bill-breakdown-cost';
                
                const planName = document.createElement('div');
                planName.className = 'bill-breakdown-cost-plan';
                planName.textContent = result.plan.name;
                costDiv.appendChild(planName);
                
                const costValue = document.createElement('div');
                costValue.className = 'bill-breakdown-cost-value';
                costValue.textContent = `$${result.medicalBillsCosts.toLocaleString()}`;
                costDiv.appendChild(costValue);
                
                costs.appendChild(costDiv);
            });
            
            billDiv.appendChild(costs);
            breakdown.appendChild(billDiv);
        });
    }
    
    addMedicalBill() {
        const description = document.getElementById('billDescription').value;
        const amount = parseFloat(document.getElementById('billAmount').value);
        const benefitType = document.getElementById('billBenefitType').value;
        
        if (!description || !amount || !benefitType) {
            alert('Please fill in all fields for the medical bill.');
            return;
        }
        
        const bill = {
            id: Date.now(),
            description,
            amount,
            benefitType
        };
        
        this.medicalBills.push(bill);
        this.displayMedicalBills();
        this.performComparison();
        
        // Clear form
        document.getElementById('billDescription').value = '';
        document.getElementById('billAmount').value = '';
        document.getElementById('billBenefitType').value = '';
    }
    
    displayMedicalBills() {
        const container = document.getElementById('medicalBillsList');
        container.innerHTML = '';
        
        this.medicalBills.forEach(bill => {
            const billDiv = document.createElement('div');
            billDiv.className = 'bill-item';
            billDiv.innerHTML = `
                <div class="bill-info">
                    <div class="bill-description">${bill.description}</div>
                    <div class="bill-amount">$${bill.amount.toLocaleString()}</div>
                    <div class="bill-benefit-type">${bill.benefitType}</div>
                </div>
                <button class="remove-bill" onclick="syncWidget.removeMedicalBill(${bill.id})">×</button>
            `;
            container.appendChild(billDiv);
        });
    }
    
    removeMedicalBill(billId) {
        this.medicalBills = this.medicalBills.filter(bill => bill.id !== billId);
        this.displayMedicalBills();
            this.performComparison();
        }
    
    async loadSamplePlans() {
        // Clear existing plans first
        this.storedPlans = [];
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        // Load plans from JSON file
        await this.loadExamplePlans();
        
        // Show success message with count
        const planCount = this.storedPlans.length;
        alert(`Plan library loaded successfully! ${planCount} plans are now available.`);
    }
    
    resetAll() {
        this.selectedPlans = [];
        this.comparisonResults = [];
        this.medicalBills = [];
        
        // Clear UI
        document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
        document.getElementById('selectedPlans').innerHTML = '';
        document.getElementById('comparisonTableBody').innerHTML = '';
        document.getElementById('medicalBillsList').innerHTML = '';
        document.getElementById('medicalBillsBreakdown').innerHTML = '';
        document.getElementById('enterPremiumsSection').style.display = 'none';
        
        // Reset usage scenario
        Object.keys(this.usageScenario).forEach(key => {
            this.usageScenario[key] = 0;
        });
        
        // Reset form
        document.getElementById('usageScenarioForm').reset();
    }
    
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    updateUsageScenario() {
        // Update usage scenario from form inputs
        this.usageScenario = {
            primaryCareVisits: parseInt(document.getElementById('primaryVisits')?.value || 0),
            specialistVisits: parseInt(document.getElementById('specialistVisits')?.value || 0),
            urgentCareVisits: parseInt(document.getElementById('urgentCareVisits')?.value || 0),
            emergencyRoomVisits: parseInt(document.getElementById('erVisits')?.value || 0),
            ambulanceRides: 0, // Not in form
            inpatientDays: parseInt(document.getElementById('inpatientVisits')?.value || 0),
            outpatientVisits: parseInt(document.getElementById('outpatientVisits')?.value || 0),
            basicImagingVisits: parseInt(document.getElementById('basicImaging')?.value || 0),
            advancedImagingVisits: parseInt(document.getElementById('advancedImaging')?.value || 0),
            labTests: parseInt(document.getElementById('labTests')?.value || 0),
            ambulatoryProcedures: parseInt(document.getElementById('surgeryVisits')?.value || 0),
            prescriptionTier1: parseInt(document.getElementById('tier1Drugs')?.value || 0),
            prescriptionTier2: parseInt(document.getElementById('tier2Drugs')?.value || 0),
            prescriptionTier3: parseInt(document.getElementById('tier3Drugs')?.value || 0),
            prescriptionTier4: parseInt(document.getElementById('tier4Drugs')?.value || 0),
            prescriptionTier5: parseInt(document.getElementById('tier5Drugs')?.value || 0),
            prescriptionTier6: parseInt(document.getElementById('tier6Drugs')?.value || 0)
        };
        
        console.log('Usage scenario updated:', this.usageScenario);
    }
    
    saveCustomPlan() {
        // Get form data
        const planName = document.getElementById('planName').value;
        const planType = document.getElementById('planType').value;
        const annualDeductible = parseFloat(document.getElementById('annualDeductible').value) || 0;
        const annualOOPMax = parseFloat(document.getElementById('annualOOPMax').value) || 0;
        const familyDeductible = parseFloat(document.getElementById('familyDeductible').value) || 0;
        const familyOOPMax = parseFloat(document.getElementById('familyOOPMax').value) || 0;
        const planYear = parseInt(document.getElementById('planYear').value) || 2025;
        const carrier = document.getElementById('carrier').value;
        const network = document.getElementById('network').value;
        const metalLevel = document.getElementById('metalLevel').value;
        const hsa = document.getElementById('hsa').checked;
        const productType = document.getElementById('productType').value;
        
        if (!planName || !planType) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Create plan object
        const plan = {
            name: planName,
            type: planType,
            annualDeductible: annualDeductible,
            annualOOPMax: annualOOPMax,
            familyDeductible: familyDeductible,
            familyOOPMax: familyOOPMax,
            planYear: planYear,
            carrier: carrier,
            network: network,
            metalLevel: metalLevel,
            hsa: hsa,
            productType: productType,
            benefits: this.getBenefitsFromForm(),
            prescriptionBenefits: this.getPrescriptionBenefitsFromForm(),
            premium: 0,
            isCustom: true
        };
        
        // Save via JSON file storage
        this.saveCustomPlanToFile(plan);
        
        // Close modal and clear form
        this.hideModal('customPlanModal');
        this.clearCustomPlanForm();
    }
    
    getBenefitsFromForm() {
        // This would extract benefits from the form
        // For now, return default structure
        return {
            primaryCare: { type: 'Copay', amount: 0, percentage: 0 },
            specialistVisit: { type: 'Copay', amount: 0, percentage: 0 },
            urgentCare: { type: 'Copay', amount: 0, percentage: 0 },
            emergencyRoom: { type: 'Copay', amount: 0, percentage: 0 },
            ambulance: { type: 'Copay', amount: 0, percentage: 0 },
            inpatient: { type: 'Copay', amount: 0, percentage: 0 },
            outpatient: { type: 'Copay', amount: 0, percentage: 0 },
            basicImaging: { type: 'Copay', amount: 0, percentage: 0 },
            advancedImaging: { type: 'Copay', amount: 0, percentage: 0 },
            labWork: { type: 'Copay', amount: 0, percentage: 0 },
            ambulatoryProcedures: { type: 'Copay', amount: 0, percentage: 0 }
        };
    }
    
    getPrescriptionBenefitsFromForm() {
        // This would extract prescription benefits from the form
        // For now, return default structure
        return {
            tier1: { type: 'Copay', amount: 0, percentage: 0 },
            tier2: { type: 'Copay', amount: 0, percentage: 0 },
            tier3: { type: 'Copay', amount: 0, percentage: 0 },
            tier4: { type: 'Copay', amount: 0, percentage: 0 },
            tier5: { type: 'Copay', amount: 0, percentage: 0 },
            tier6: { type: 'Copay', amount: 0, percentage: 0 }
        };
    }
    
    clearCustomPlanForm() {
        document.getElementById('planName').value = '';
        document.getElementById('planType').value = '';
        document.getElementById('annualDeductible').value = '';
        document.getElementById('annualOOPMax').value = '';
        document.getElementById('familyDeductible').value = '';
        document.getElementById('familyOOPMax').value = '';
        document.getElementById('planYear').value = '2025';
        document.getElementById('carrier').value = '';
        document.getElementById('network').value = '';
        document.getElementById('metalLevel').value = '';
        document.getElementById('hsa').checked = false;
        document.getElementById('productType').value = '';
    }
    
    // Direct JSON File Storage Methods
    async saveCustomPlanToFile(plan) {
        try {
            // Add plan to custom plans array
            plan.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            plan.isCustom = true;
            plan.createdAt = new Date().toISOString();
            
            this.customPlans.push(plan);
            
            // Save to localStorage for immediate use
            localStorage.setItem('customPlans', JSON.stringify(this.customPlans));
            
            // Write directly to JSON file
            await this.writeToJsonFile();
            
            // Update the plan grid
            this.updatePlanGrid();
            
            console.log('Plan saved successfully:', plan.name);
            // Show a subtle notification instead of an alert
            this.showNotification(`Plan "${plan.name}" saved successfully!`);
            
            // Notify parent window (Zoho widget) about successful save
            window.parent.postMessage({
                type: 'PLAN_SAVED',
                planName: plan.name,
                success: true
            }, '*');
            
            return { success: true, plan: plan };
        } catch (error) {
            console.error('Error saving plan:', error);
            alert(`Error saving plan: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Load GitHub configuration
    loadGitHubConfig() {
        // Listen for configuration from parent window (Zoho widget)
        window.addEventListener('message', (event) => {
            // Verify origin for security
            if (event.origin !== window.location.origin && 
                !event.origin.includes('zoho') && 
                !event.origin.includes('localhost')) {
                console.log('Ignoring message from untrusted origin:', event.origin);
                return;
            }
            
            if (event.data.type === 'GITHUB_CONFIG') {
                console.log('Received GitHub config from parent window');
                this.githubConfig = { ...this.githubConfig, ...event.data.config };
                console.log('GitHub config updated:', {
                    owner: this.githubConfig.owner,
                    repo: this.githubConfig.repo,
                    hasToken: !!this.githubConfig.token,
                    branch: this.githubConfig.branch
                });
                
                // Notify parent that config was received
                window.parent.postMessage({
                    type: 'CONFIG_RECEIVED',
                    success: true
                }, '*');
            }
        });
        
        // Try to load from config.js first (secure method)
        if (window.GitHubConfig) {
            this.githubConfig.owner = window.GitHubConfig.owner || this.githubConfig.owner;
            this.githubConfig.repo = window.GitHubConfig.repo || this.githubConfig.repo;
            this.githubConfig.token = window.GitHubConfig.token || this.githubConfig.token;
            this.githubConfig.branch = window.GitHubConfig.branch || this.githubConfig.branch;
        }
        
        // Fallback to localStorage (less secure but user-configured)
        const token = localStorage.getItem('githubToken');
        const owner = localStorage.getItem('githubOwner');
        const repo = localStorage.getItem('githubRepo');
        const branch = localStorage.getItem('githubBranch');
        
        if (token && owner && repo && !this.githubConfig.token) {
            this.githubConfig.token = token;
            this.githubConfig.owner = owner;
            this.githubConfig.repo = repo;
            this.githubConfig.branch = branch || 'main';
        }
        
        console.log('GitHub config loaded:', {
            owner: this.githubConfig.owner,
            repo: this.githubConfig.repo,
            hasToken: !!this.githubConfig.token,
            branch: this.githubConfig.branch
        });
    }
    
    // Write directly to GitHub repository (background operation)
    async writeToJsonFile() {
        try {
            // Check if GitHub config is available
            if (!this.githubConfig.token || !this.githubConfig.owner || !this.githubConfig.repo) {
                console.log('GitHub configuration not available, falling back to localStorage');
                return await this.fallbackToLocalStorage();
            }
            
            const plansData = {
                lastUpdated: new Date().toISOString(),
                plans: this.customPlans,
                totalPlans: this.customPlans.length
            };
            
            const jsonString = JSON.stringify(plansData, null, 2);
            
            // Save to GitHub repository
            const result = await this.saveToGitHub('plans/custom-plans.json', jsonString);
            
            if (result.success) {
                console.log('Custom plans saved to GitHub repository');
                return { success: true, method: 'GitHub API' };
            } else {
                console.log('GitHub save failed, falling back to localStorage:', result.error);
                return await this.fallbackToLocalStorage();
            }
            
        } catch (error) {
            console.error('Error writing to GitHub:', error);
            return await this.fallbackToLocalStorage();
        }
    }
    
    // Fallback method for localStorage
    async fallbackToLocalStorage() {
        try {
            const plansData = {
                lastUpdated: new Date().toISOString(),
                plans: this.customPlans,
                totalPlans: this.customPlans.length
            };
            
            const jsonString = JSON.stringify(plansData, null, 2);
            localStorage.setItem('customPlansJson', jsonString);
            
            console.log('Plans data saved to localStorage as fallback');
            return { success: true, method: 'localStorage Fallback' };
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Save file to GitHub repository
    async saveToGitHub(filePath, content) {
        try {
            const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${filePath}`;
            
            // First, try to get the current file to get the SHA (for updates)
            let sha = null;
            try {
                const getResponse = await fetch(url, {
                    headers: {
                        'Authorization': `token ${this.githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                // File doesn't exist yet, that's okay
                console.log('File does not exist yet, will create new file');
            }
            
            // Prepare the content (base64 encoded)
            const contentBase64 = btoa(unescape(encodeURIComponent(content)));
            
            const body = {
                message: `Update custom plans - ${new Date().toISOString()}`,
                content: contentBase64,
                branch: this.githubConfig.branch
            };
            
            if (sha) {
                body.sha = sha;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('File saved to GitHub successfully:', result.commit.html_url);
                return { success: true, commitUrl: result.commit.html_url };
            } else {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
            }
            
        } catch (error) {
            console.error('Error saving to GitHub:', error);
            return { success: false, error: error.message };
        }
    }
    
    loadCustomPlans() {
        try {
            // Try to load from GitHub first if config is available
            if (this.githubConfig.token && this.githubConfig.owner && this.githubConfig.repo) {
                this.loadPlansFromGitHub();
            } else {
                // Fallback to localStorage
                this.loadPlansFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading custom plans:', error);
            this.customPlans = [];
        }
    }
    
    // Load plans from GitHub repository
    async loadPlansFromGitHub() {
        try {
            const result = await this.fetchFromGitHub('plans/all-plans.json');
            if (result.success && result.data) {
                const jsonData = JSON.parse(result.data);
                if (jsonData && jsonData.plans) {
                    this.customPlans = jsonData.plans;
                    localStorage.setItem('customPlans', JSON.stringify(this.customPlans));
                    this.updatePlanGrid();
                    console.log('Loaded custom plans from GitHub:', this.customPlans.length);
                    
                    // Notify parent window about successful load
                    window.parent.postMessage({
                        type: 'PLAN_LOADED',
                        count: this.customPlans.length,
                        success: true
                    }, '*');
                    
                    return;
                }
            }
            // If GitHub load fails, fallback to localStorage
            this.loadPlansFromLocalStorage();
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            this.loadPlansFromLocalStorage();
        }
    }
    
    // Load plans from localStorage
    loadPlansFromLocalStorage() {
        const stored = localStorage.getItem('customPlans');
        if (stored) {
            this.customPlans = JSON.parse(stored);
            this.updatePlanGrid();
            console.log('Loaded custom plans from localStorage:', this.customPlans.length);
        }
    }
    
    // Fetch file content from GitHub
    async fetchFromGitHub(filePath) {
        try {
            const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/${filePath}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content.replace(/\n/g, ''));
                return { success: true, data: content };
            } else if (response.status === 404) {
                // File doesn't exist yet, return empty
                return { success: true, data: null };
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching from GitHub:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Show subtle notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    
    
    
    
    
    updatePlanGrid() {
        // Clear existing custom plans from grid
        document.querySelectorAll('.plan-card[data-plan-id^="custom_"]').forEach(card => card.remove());
        
        // Add all custom plans to grid
        this.customPlans.forEach(plan => {
            this.addPlanToGrid(plan);
        });
    }
    
    
    // Search and Filter Methods
    filterPlans() {
        const searchTerm = document.getElementById('planSearchInput').value.toLowerCase();
        const metalLevel = document.getElementById('metalLevelFilter').value;
        const network = document.getElementById('networkFilter').value;
        const carrier = document.getElementById('carrierFilter').value;
        
        const planCards = document.querySelectorAll('.plan-card');
        let visibleCount = 0;
        
        planCards.forEach(card => {
            const planId = card.getAttribute('data-plan-id');
            const plan = this.storedPlans.find(p => p.id === planId);
            
            if (!plan) return;
            
            let show = true;
            
            // Text search
            if (searchTerm) {
                const searchableText = `${plan.name} ${plan.carrier} ${plan.network} ${plan.metalLevel}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    show = false;
                }
            }
            
            // Metal level filter
            if (metalLevel && plan.metalLevel !== metalLevel) {
                show = false;
            }
            
            // Network filter
            if (network && plan.network !== network) {
                show = false;
            }
            
            // Carrier filter
            if (carrier && plan.carrier !== carrier) {
                show = false;
            }
            
            if (show) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });
        
        this.updateSearchResultsInfo(visibleCount, planCards.length);
    }
    
    clearSearch() {
        document.getElementById('planSearchInput').value = '';
        document.getElementById('metalLevelFilter').value = '';
        document.getElementById('networkFilter').value = '';
        document.getElementById('carrierFilter').value = '';
        this.filterPlans();
    }
    
    updateSearchResultsInfo(visibleCount, totalCount) {
        let infoElement = document.getElementById('searchResultsInfo');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'searchResultsInfo';
            infoElement.className = 'search-results-info';
            document.querySelector('.plan-search-section').appendChild(infoElement);
        }
        
        if (visibleCount === totalCount) {
            infoElement.style.display = 'none';
        } else {
            infoElement.style.display = 'block';
            infoElement.textContent = `Showing ${visibleCount} of ${totalCount} plans`;
        }
    }
}

// Initialize the widget when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.syncWidget = new SyncBenefitComparison();
});



