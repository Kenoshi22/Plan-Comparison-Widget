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
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadExamplePlans();
    }
    
    bindEvents() {
        // Plan selection events
        document.getElementById('addCustomPlanBtn').addEventListener('click', () => this.showModal('customPlanModal'));
        document.getElementById('uploadPDFBtn').addEventListener('click', () => this.showModal('uploadPDFModal'));
        document.getElementById('loadSamplePlansBtn').addEventListener('click', () => this.loadSamplePlans());
        
        // Modal events
        document.getElementById('saveCustomPlanBtn').addEventListener('click', () => this.saveCustomPlan());
        document.getElementById('cancelCustomPlanBtn').addEventListener('click', () => this.hideModal('customPlanModal'));
        document.getElementById('cancelUploadBtn').addEventListener('click', () => this.hideModal('uploadPDFModal'));
        
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
        // This would save a custom plan
        console.log('Custom plan saved');
    }
}

// Initialize the widget when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.syncWidget = new SyncBenefitComparison();
});


