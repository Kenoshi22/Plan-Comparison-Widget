// Health Plan Comparison Widget - Simplified Version
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
        
        // Zoho GitHub Manager integration
        this.zohoManager = null;
        this.syncStatus = {
            lastSync: null,
            isOnline: navigator.onLine,
            isSyncing: false,
            error: null
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupZohoIntegration();
        this.loadExamplePlans();
        this.loadCustomPlans();
    }

    bindEvents() {
        // Plan selection events
        document.getElementById('addPlanBtn').addEventListener('click', () => this.showModal('customPlanModal'));
        document.getElementById('loadSamplePlansBtn').addEventListener('click', () => this.loadSamplePlans());
        document.getElementById('configureGitHubBtn').addEventListener('click', () => this.showModal('githubConfigModal'));
        document.getElementById('syncPlansBtn').addEventListener('click', () => this.syncPlans());
        
        // Search and filter events
        document.getElementById('planSearchInput').addEventListener('input', () => this.filterPlans());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('metalLevelFilter').addEventListener('change', () => this.filterPlans());
        document.getElementById('networkFilter').addEventListener('change', () => this.filterPlans());
        document.getElementById('carrierFilter').addEventListener('change', () => this.filterPlans());
        
        // Modal events
        document.getElementById('savePlan').addEventListener('click', () => this.saveCustomPlan());
        document.getElementById('cancelPlan').addEventListener('click', () => this.hideModal('customPlanModal'));
        
        // Usage scenario events
        document.getElementById('updateScenarioBtn').addEventListener('click', () => this.updateUsageScenario());
        document.getElementById('performComparisonBtn').addEventListener('click', () => this.performComparison());
        document.getElementById('resetAllBtn').addEventListener('click', () => this.resetAll());
        
        // Medical bills events
        document.getElementById('addBillBtn').addEventListener('click', () => this.addMedicalBill());
        
        // Premiums events
        document.getElementById('savePremiumsBtn').addEventListener('click', () => this.savePremiums());
        
        // Recalculate event
        document.getElementById('recalculateBtn').addEventListener('click', () => this.performComparison());
    }
    
    loadExamplePlans() {
        console.log('Loading example plans...');
        
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
            },
            {
                id: 'example_2',
                name: 'BlueSelect Platinum',
                type: 'PPO',
                annualDeductible: 0,
                annualOOPMax: 2275,
                familyDeductible: 0,
                familyOOPMax: 4550,
                planYear: 2025,
                carrier: 'Florida Blue',
                network: 'BlueSelect',
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
            },
            {
                id: 'example_3',
                name: 'BlueCare Platinum',
                type: 'HMO',
                annualDeductible: 0,
                annualOOPMax: 2275,
                familyDeductible: 0,
                familyOOPMax: 4550,
                planYear: 2025,
                carrier: 'Florida Blue',
                network: 'BlueCare',
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
            },
            {
                id: 'example_4',
                name: 'BlueOptions Gold',
                type: 'PPO',
                annualDeductible: 1000,
                annualOOPMax: 4000,
                familyDeductible: 2000,
                familyOOPMax: 8000,
                planYear: 2025,
                carrier: 'Florida Blue',
                network: 'BlueOptions',
                metalLevel: 'Gold',
                hsa: false,
                productType: 'U65 On Exchange',
                benefits: {
                    primaryCare: { type: 'Copay', amount: 15, percentage: 0 },
                    specialistVisit: { type: 'Copay', amount: 35, percentage: 0 },
                    urgentCare: { type: 'Copay', amount: 35, percentage: 0 },
                    emergencyRoom: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    ambulance: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    inpatient: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    outpatient: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    basicImaging: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    advancedImaging: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    labWork: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 },
                    ambulatoryProcedures: { type: 'Deductible + Coinsurance', amount: 1000, percentage: 10 }
                },
                prescriptionBenefits: {
                    tier1: { type: 'Copay', amount: 4, percentage: 0 },
                    tier2: { type: 'Copay', amount: 15, percentage: 0 },
                    tier3: { type: 'Copay', amount: 23, percentage: 0 },
                    tier4: { type: 'Copay', amount: 45, percentage: 0 },
                    tier5: { type: 'Copay', amount: 0, percentage: 0 },
                    tier6: { type: 'Copay', amount: 0, percentage: 0 }
                },
                premium: 0,
                isCustom: false,
                isExample: true
            },
            {
                id: 'example_5',
                name: 'BlueOptions Silver',
                type: 'PPO',
                annualDeductible: 3000,
                annualOOPMax: 8000,
                familyDeductible: 6000,
                familyOOPMax: 16000,
                planYear: 2025,
                carrier: 'Florida Blue',
                network: 'BlueOptions',
                metalLevel: 'Silver',
                hsa: false,
                productType: 'U65 On Exchange',
                benefits: {
                    primaryCare: { type: 'Copay', amount: 25, percentage: 0 },
                    specialistVisit: { type: 'Copay', amount: 50, percentage: 0 },
                    urgentCare: { type: 'Copay', amount: 50, percentage: 0 },
                    emergencyRoom: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    ambulance: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    inpatient: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    outpatient: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    basicImaging: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    advancedImaging: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    labWork: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 },
                    ambulatoryProcedures: { type: 'Deductible + Coinsurance', amount: 3000, percentage: 30 }
                },
                prescriptionBenefits: {
                    tier1: { type: 'Copay', amount: 10, percentage: 0 },
                    tier2: { type: 'Copay', amount: 25, percentage: 0 },
                    tier3: { type: 'Copay', amount: 50, percentage: 0 },
                    tier4: { type: 'Copay', amount: 100, percentage: 0 },
                    tier5: { type: 'Copay', amount: 200, percentage: 0 },
                    tier6: { type: 'Copay', amount: 300, percentage: 0 }
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
        
        console.log('Loaded example plans:', this.storedPlans.length);
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
                <div class="plan-deductible">Deductible: $${plan.annualDeductible.toLocaleString()}</div>
                <div class="plan-oop">OOP Max: $${plan.annualOOPMax.toLocaleString()}</div>
                ${plan.hsa ? '<div class="plan-hsa">HSA Eligible</div>' : ''}
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
        const selectedPlansDiv = document.getElementById('selectedPlans');
        selectedPlansDiv.innerHTML = '';
        
        this.selectedPlans.forEach(plan => {
            const planDiv = document.createElement('div');
            planDiv.className = 'selected-plan';
            planDiv.innerHTML = `
                <span>${plan.name}</span>
                <button onclick="syncWidget.removeSelectedPlan('${plan.id}')">×</button>
            `;
            selectedPlansDiv.appendChild(planDiv);
        });
    }
    
    removeSelectedPlan(planId) {
        this.selectedPlans = this.selectedPlans.filter(p => p.id !== planId);
        document.querySelector(`[data-plan-id="${planId}"]`).classList.remove('selected');
        this.updateSelectedPlansDisplay();
    }
    
    showEnterPremiumsSection() {
        const section = document.getElementById('enterPremiumsSection');
        section.style.display = 'block';
        
        const premiumsGrid = document.getElementById('premiumsGrid');
        premiumsGrid.innerHTML = '';
        
        this.selectedPlans.forEach(plan => {
            const premiumGroup = document.createElement('div');
            premiumGroup.className = 'premium-input-group';
            premiumGroup.innerHTML = `
                <label class="premium-plan-name">${plan.name}</label>
                <input type="number" class="premium-input" data-plan-id="${plan.id}" placeholder="Monthly Premium" min="0" step="0.01">
            `;
            premiumsGrid.appendChild(premiumGroup);
        });
    }
    
    savePremiums() {
        const premiumInputs = document.querySelectorAll('.premium-input');
        let allFilled = true;
        
        premiumInputs.forEach(input => {
            const planId = input.dataset.planId;
            const monthlyPremium = parseFloat(input.value) || 0;
            const annualPremium = monthlyPremium * 12;
            
            const plan = this.selectedPlans.find(p => p.id === planId);
            if (plan) {
                plan.premium = annualPremium;
            }
            
            if (monthlyPremium === 0) {
                allFilled = false;
            }
        });
        
        if (!allFilled) {
            alert('Please enter monthly premiums for all selected plans.');
            return;
        }
        
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
            row.innerHTML = `
                <td>${result.plan.name}</td>
                <td>$${result.plan.premium.toLocaleString()}</td>
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
    
    loadSamplePlans() {
        // Clear existing plans first
        this.storedPlans = [];
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        // Load example plans
        this.loadExamplePlans();
        
        alert('Sample plans loaded successfully!');
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
        // This would update the usage scenario from form inputs
        console.log('Usage scenario updated');
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
        
        // Save via Zoho or localStorage
        this.saveCustomPlanToZoho(plan);
        
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
    
    // Zoho Integration Methods
    setupZohoIntegration() {
        // Initialize Zoho GitHub Manager if available
        if (window.zohoGitHubManager) {
            this.zohoManager = window.zohoGitHubManager;
        }
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.syncStatus.isOnline = true;
            this.updateSyncStatus();
            this.syncPlans();
        });
        
        window.addEventListener('offline', () => {
            this.syncStatus.isOnline = false;
            this.updateSyncStatus();
        });
        
        // Auto-sync every 5 minutes when online
        setInterval(() => {
            if (this.syncStatus.isOnline && this.zohoManager) {
                this.syncPlans();
            }
        }, 300000); // 5 minutes
    }
    
    async loadCustomPlans() {
        if (!this.zohoManager) {
            console.log('Zoho GitHub Manager not available, loading from localStorage');
            this.loadCustomPlansFromLocalStorage();
            return;
        }
        
        try {
            this.syncStatus.isSyncing = true;
            this.updateSyncStatus();
            
            const result = await this.zohoManager.apiLoadPlans();
            if (result.success) {
                // Filter custom plans from the result
                this.customPlans = result.plans.filter(plan => plan.isCustom);
                this.updatePlanGrid();
                this.syncStatus.lastSync = new Date();
                this.syncStatus.error = null;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading custom plans from Zoho:', error);
            this.syncStatus.error = error.message;
            // Fallback to localStorage
            this.loadCustomPlansFromLocalStorage();
        } finally {
            this.syncStatus.isSyncing = false;
            this.updateSyncStatus();
        }
    }
    
    async saveCustomPlanToZoho(plan) {
        if (!this.zohoManager) {
            console.log('Zoho GitHub Manager not available, saving to localStorage');
            this.saveCustomPlanToLocalStorage(plan);
            return;
        }
        
        try {
            this.syncStatus.isSyncing = true;
            this.updateSyncStatus();
            
            // Add plan to custom plans
            plan.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            plan.isCustom = true;
            plan.createdAt = new Date().toISOString();
            plan.createdBy = this.getCurrentUser();
            
            // Save via Zoho manager
            const result = await this.zohoManager.apiSavePlan(plan);
            
            if (result.success) {
                this.customPlans.push(plan);
                this.updatePlanGrid();
                this.syncStatus.lastSync = new Date();
                this.syncStatus.error = null;
                console.log('Plan saved via Zoho successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving plan via Zoho:', error);
            this.syncStatus.error = error.message;
            // Fallback to localStorage
            this.saveCustomPlanToLocalStorage(plan);
        } finally {
            this.syncStatus.isSyncing = false;
            this.updateSyncStatus();
        }
    }
    
    async syncPlans() {
        if (!this.githubConfig.token || !this.syncStatus.isOnline) {
            return;
        }
        
        try {
            this.syncStatus.isSyncing = true;
            this.updateSyncStatus();
            
            const plans = await this.fetchPlansFromGitHub('custom-plans.json');
            if (plans) {
                this.customPlans = plans;
                this.updatePlanGrid();
                this.syncStatus.lastSync = new Date();
                this.syncStatus.error = null;
            }
        } catch (error) {
            console.error('Error syncing plans:', error);
            this.syncStatus.error = error.message;
        } finally {
            this.syncStatus.isSyncing = false;
            this.updateSyncStatus();
        }
    }
    
    async fetchPlansFromGitHub(filename) {
        const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/plans/${filename}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet, return empty array
                return [];
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = atob(data.content.replace(/\n/g, ''));
        return JSON.parse(content);
    }
    
    async savePlansToGitHub(filename, plans) {
        const url = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/contents/plans/${filename}`;
        
        // First, get the current file to get the SHA
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
        }
        
        // Prepare the content
        const content = btoa(JSON.stringify(plans, null, 2));
        
        const body = {
            message: `Update ${filename} - ${new Date().toISOString()}`,
            content: content,
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
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        return await response.json();
    }
    
    loadCustomPlansFromLocalStorage() {
        const stored = localStorage.getItem('customPlans');
        if (stored) {
            this.customPlans = JSON.parse(stored);
            this.updatePlanGrid();
        }
    }
    
    saveCustomPlanToLocalStorage(plan) {
        this.customPlans.push(plan);
        localStorage.setItem('customPlans', JSON.stringify(this.customPlans));
        this.updatePlanGrid();
    }
    
    updatePlanGrid() {
        // Clear existing custom plans from grid
        document.querySelectorAll('.plan-card[data-plan-id^="custom_"]').forEach(card => card.remove());
        
        // Add all custom plans to grid
        this.customPlans.forEach(plan => {
            this.addPlanToGrid(plan);
        });
    }
    
    getCurrentUser() {
        // In a real implementation, this would get the current user
        // For now, we'll use a simple identifier
        return localStorage.getItem('currentUser') || 'Unknown User';
    }
    
    updateSyncStatus() {
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            let statusText = '';
            if (this.syncStatus.isSyncing) {
                statusText = '🔄 Syncing...';
            } else if (this.syncStatus.error) {
                statusText = `❌ Error: ${this.syncStatus.error}`;
            } else if (this.syncStatus.lastSync) {
                statusText = `✅ Last sync: ${this.syncStatus.lastSync.toLocaleTimeString()}`;
            } else {
                statusText = '⚪ Not synced';
            }
            
            if (!this.syncStatus.isOnline) {
                statusText += ' (Offline)';
            }
            
            statusElement.textContent = statusText;
        }
    }
    
    // Configuration methods
    setGitHubConfig(owner, repo, token) {
        this.githubConfig.owner = owner;
        this.githubConfig.repo = repo;
        this.githubConfig.token = token;
        
        // Save token to localStorage
        localStorage.setItem('githubToken', token);
        localStorage.setItem('githubOwner', owner);
        localStorage.setItem('githubRepo', repo);
        
        // Load custom plans from GitHub
        this.loadCustomPlans();
    }
    
    loadGitHubConfig() {
        // First try to load from config.js (secure method)
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
        
        if (token && owner && repo && !this.githubConfig.token) {
            this.githubConfig.token = token;
            this.githubConfig.owner = owner;
            this.githubConfig.repo = repo;
        }
    }
    
    saveGitHubConfig() {
        const owner = document.getElementById('githubOwner').value;
        const repo = document.getElementById('githubRepo').value;
        const token = document.getElementById('githubToken').value;
        const currentUser = document.getElementById('currentUser').value;
        
        if (!owner || !repo || !token || !currentUser) {
            alert('Please fill in all fields.');
            return;
        }
        
        // Save configuration
        this.setGitHubConfig(owner, repo, token);
        localStorage.setItem('currentUser', currentUser);
        
        // Close modal
        this.hideModal('githubConfigModal');
        
        // Show success message
        alert('GitHub configuration saved! Plans will now sync automatically.');
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
