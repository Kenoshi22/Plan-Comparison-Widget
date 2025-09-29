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
        this.filteredPlans = [];
        this.currentPage = 1;
        this.plansPerPage = 9;
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
        
        // Scenario button events
        document.getElementById('lightUsageBtn').addEventListener('click', () => this.setUsageScenario('light'));
        document.getElementById('mediumUsageBtn').addEventListener('click', () => this.setUsageScenario('medium'));
        document.getElementById('heavyUsageBtn').addEventListener('click', () => this.setUsageScenario('heavy'));
    }
    
    async loadExamplePlans() {
        console.log('Loading plans from all-plans.json...');
        
        // Try multiple possible paths for the JSON file
        const possiblePaths = [
            'https://kenoshi22.github.io/plan-comparison-widget/plans/all-plans.json',
            'https://kenoshi22.github.io/Plan-Comparison-Widget/plans/all-plans.json',
            'https://kenoshi22.github.io/Health_Plan_Comparison/plans/all-plans.json',
            'https://kenoshi22.github.io/plans/all-plans.json',
            './plans/all-plans.json',
            '../plans/all-plans.json',
            'plans/all-plans.json'
        ];
        
        let plans = null;
        let lastError = null;
        
        for (const path of possiblePaths) {
            try {
                console.log(`Trying to load from: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    plans = await response.json();
                    console.log(`Successfully loaded plans from: ${path}`, plans.length);
                    break;
                } else {
                    console.log(`Failed to load from ${path}: ${response.status}`);
                }
            } catch (error) {
                console.log(`Error loading from ${path}:`, error.message);
                lastError = error;
            }
        }
        
        if (plans && Array.isArray(plans)) {
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
            this.filteredPlans = [...this.storedPlans];
            this.updatePlanGridDisplay();
        } else {
            console.error('Error loading plans from all paths:', lastError);
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
            this.filteredPlans = [...this.storedPlans];
            this.updatePlanGridDisplay();
        }
    }
    
    addPlanToGrid(plan) {
        // Don't add directly to grid, instead update the display
        this.updatePlanGridDisplay();
    }
    
    updatePlanGridDisplay() {
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.plansPerPage;
        const endIndex = startIndex + this.plansPerPage;
        const plansToShow = this.storedPlans.slice(startIndex, endIndex);
        
        plansToShow.forEach(plan => {
            const planCard = this.createPlanCard(plan);
            planGrid.appendChild(planCard);
        });
        
        this.updatePaginationControls();
    }
    
    updatePaginationControls() {
        const totalPages = Math.ceil(this.storedPlans.length / this.plansPerPage);
        
        // Remove existing pagination controls
        const existingPagination = document.getElementById('planPagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        if (totalPages <= 1) return;
        
        // Create pagination controls
        const paginationDiv = document.createElement('div');
        paginationDiv.id = 'planPagination';
        paginationDiv.className = 'pagination-controls';
        paginationDiv.innerHTML = `
            <button id="prevPageBtn" class="btn btn-outline btn-sm" ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
            <span class="pagination-info">
                Page ${this.currentPage} of ${totalPages} (${this.storedPlans.length} plans)
            </span>
            <button id="nextPageBtn" class="btn btn-outline btn-sm" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;
        
        // Insert after the plan grid
        const planGrid = document.getElementById('planGrid');
        planGrid.parentNode.insertBefore(paginationDiv, planGrid.nextSibling);
        
        // Add event listeners
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updatePlanGridDisplay();
            }
        });
        
        document.getElementById('nextPageBtn').addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updatePlanGridDisplay();
            }
        });
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
                premiumGroup.className = 'premium-display-group';
                premiumGroup.innerHTML = `
                    <div class="premium-plan-name">${plan.name}</div>
                    <div class="premium-display">$${(plan.premium / 12).toFixed(2)}/month</div>
                `;
                premiumsGrid.appendChild(premiumGroup);
            });
        } else {
            section.style.display = 'none';
        }
    }
    
    savePremiums() {
        // Since we're using the plan's existing premium data, we don't need to validate inputs
        // Just proceed with the comparison using the plan's current premium values
        console.log('Using existing premium data:', this.selectedPlans.map(p => ({ name: p.name, monthly: p.premium/12, annual: p.premium })));
        this.performComparison();
        
        // Scroll to the calculation section
        const calculationSection = document.getElementById('planBenefitsViewer');
        if (calculationSection) {
            calculationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
        this.updateSummaryCards();
        this.updatePlanBenefitsViewer();
        
        // Show the comparison results section
        const comparisonResults = document.getElementById('comparisonResults');
        if (comparisonResults) {
            comparisonResults.style.display = 'block';
        }
        
        // Show the plan benefits viewer
        const planBenefitsViewer = document.getElementById('planBenefitsViewer');
        if (planBenefitsViewer) {
            planBenefitsViewer.style.display = 'block';
        }
    }
    
    calculatePlanCosts(plan) {
        let totalOOP = 0;
        let totalCost = 0;
        
        // Calculate basic medical costs (lab tests, primary care, specialist, urgent care, virtual visits)
        const basicMedicalCosts = this.calculateBasicMedicalCosts(plan);
        totalOOP += basicMedicalCosts;
        totalCost += basicMedicalCosts;
        
        // Calculate major medical costs (advanced imaging, ER, inpatient, outpatient, ambulatory procedures)
        const majorMedicalCosts = this.calculateMajorMedicalCosts(plan);
        totalOOP += majorMedicalCosts;
        totalCost += majorMedicalCosts;
        
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
            basicMedicalCosts,
            majorMedicalCosts,
            prescriptionCosts,
            medicalBillsCosts,
            totalOOP,
            totalCost
        };
    }
    
    calculateBasicMedicalCosts(plan) {
        let totalCost = 0;
        
        // Primary care visits
        if (this.usageScenario.primaryCareVisits > 0) {
            const benefit = plan.benefits.primaryCare;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.primaryCareVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.primaryCareVisits * (benefit.amount + (150 * benefit.percentage / 100));
                }
            }
        }
        
        // Specialist visits
        if (this.usageScenario.specialistVisits > 0) {
            const benefit = plan.benefits.specialistVisit;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.specialistVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.specialistVisits * (benefit.amount + (200 * benefit.percentage / 100));
                }
            }
        }
        
        // Urgent care visits
        if (this.usageScenario.urgentCareVisits > 0) {
            const benefit = plan.benefits.urgentCare;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.urgentCareVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.urgentCareVisits * (benefit.amount + (150 * benefit.percentage / 100));
                }
            }
        }
        
        // Lab tests
        if (this.usageScenario.labTests > 0) {
            const benefit = plan.benefits.labWork;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.labTests * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.labTests * (benefit.amount + (100 * benefit.percentage / 100));
                }
            }
        }
        
        return totalCost;
    }
    
    calculateMajorMedicalCosts(plan) {
        let totalCost = 0;
        
        // Emergency room visits
        if (this.usageScenario.emergencyRoomVisits > 0) {
            const benefit = plan.benefits.emergencyRoom;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.emergencyRoomVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.emergencyRoomVisits * (benefit.amount + (2000 * benefit.percentage / 100));
                }
            }
        }
        
        // Inpatient stays
        if (this.usageScenario.inpatientDays > 0) {
            const benefit = plan.benefits.inpatient;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.inpatientDays * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.inpatientDays * (benefit.amount + (2000 * benefit.percentage / 100));
                }
            }
        }
        
        // Outpatient visits
        if (this.usageScenario.outpatientVisits > 0) {
            const benefit = plan.benefits.outpatient;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.outpatientVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.outpatientVisits * (benefit.amount + (500 * benefit.percentage / 100));
                }
            }
        }
        
        // Advanced imaging
        if (this.usageScenario.advancedImagingVisits > 0) {
            const benefit = plan.benefits.advancedImaging;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.advancedImagingVisits * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.advancedImagingVisits * (benefit.amount + (1000 * benefit.percentage / 100));
                }
            }
        }
        
        // Ambulatory procedures
        if (this.usageScenario.ambulatoryProcedures > 0) {
            const benefit = plan.benefits.ambulatoryProcedures;
            if (benefit && benefit.type !== 'Not Covered') {
                if (benefit.type === 'Copay') {
                    totalCost += this.usageScenario.ambulatoryProcedures * benefit.amount;
                } else if (benefit.type === 'Deductible + Coinsurance') {
                    totalCost += this.usageScenario.ambulatoryProcedures * (benefit.amount + (800 * benefit.percentage / 100));
                }
            }
        }
        
        return totalCost;
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
    
    updatePlanBenefitsViewer() {
        const container = document.getElementById('benefitsComparisonContainer');
        container.innerHTML = '';
        
        if (this.selectedPlans.length === 0) return;
        
        // Create a table for benefits comparison
        const table = document.createElement('table');
        table.className = 'benefits-comparison-table';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Benefit</th>';
        this.selectedPlans.forEach(plan => {
            const th = document.createElement('th');
            th.innerHTML = `
                <div class="plan-header">
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-details">${plan.metalLevel} • ${plan.network}</div>
                </div>
            `;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        // Define benefits to compare
        const benefits = [
            { key: 'primaryCare', label: 'Primary Care Visit' },
            { key: 'specialistVisit', label: 'Specialist Visit' },
            { key: 'urgentCare', label: 'Urgent Care' },
            { key: 'emergencyRoom', label: 'Emergency Room' },
            { key: 'inpatient', label: 'Inpatient Stay' },
            { key: 'outpatient', label: 'Outpatient Visit' },
            { key: 'basicImaging', label: 'Basic Imaging' },
            { key: 'advancedImaging', label: 'Advanced Imaging' },
            { key: 'labWork', label: 'Lab Tests' },
            { key: 'ambulatoryProcedures', label: 'Ambulatory Procedures' }
        ];
        
        // Add medical benefits rows
        benefits.forEach(benefit => {
            const row = document.createElement('tr');
            const labelCell = document.createElement('td');
            labelCell.textContent = benefit.label;
            row.appendChild(labelCell);
            
            this.selectedPlans.forEach(plan => {
                const cell = document.createElement('td');
                const planBenefit = plan.benefits[benefit.key];
                if (planBenefit) {
                    if (planBenefit.type === 'Copay') {
                        cell.innerHTML = `<span class="benefit-type">$${planBenefit.amount}</span> <span class="benefit-desc">copay</span>`;
                    } else if (planBenefit.type === 'Deductible + Coinsurance') {
                        cell.innerHTML = `<span class="benefit-type">$${planBenefit.amount} + ${planBenefit.percentage}%</span> <span class="benefit-desc">deductible + coinsurance</span>`;
                    } else if (planBenefit.type === 'Coinsurance') {
                        cell.innerHTML = `<span class="benefit-type">${planBenefit.percentage}%</span> <span class="benefit-desc">coinsurance</span>`;
                    } else if (planBenefit.type === 'Deductible + Copay') {
                        cell.innerHTML = `<span class="benefit-type">$${planBenefit.amount}</span> <span class="benefit-desc">deductible + copay</span>`;
                    } else if (planBenefit.type === 'Deductible') {
                        cell.innerHTML = `<span class="benefit-type">Deductible</span> <span class="benefit-desc">applies</span>`;
                    } else {
                        cell.innerHTML = `<span class="benefit-type">${planBenefit.type}</span>`;
                    }
                } else {
                    cell.innerHTML = `<span class="benefit-type not-covered">Not Covered</span>`;
                }
                row.appendChild(cell);
            });
            
            table.appendChild(row);
        });
        
        // Add prescription benefits section
        const prescriptionHeader = document.createElement('tr');
        prescriptionHeader.className = 'prescription-header';
        prescriptionHeader.innerHTML = '<td colspan="' + (this.selectedPlans.length + 1) + '"><strong>Prescription Benefits</strong></td>';
        table.appendChild(prescriptionHeader);
        
        const prescriptionTiers = [
            { key: 'tier1', label: 'Tier 1 (Generic)' },
            { key: 'tier2', label: 'Tier 2 (Preferred Generic)' },
            { key: 'tier3', label: 'Tier 3 (Preferred Brand)' },
            { key: 'tier4', label: 'Tier 4 (Non-Preferred Brand)' },
            { key: 'tier5', label: 'Tier 5 (Specialty)' },
            { key: 'tier6', label: 'Tier 6 (Specialty High Cost)' }
        ];
        
        prescriptionTiers.forEach(tier => {
            const row = document.createElement('tr');
            const labelCell = document.createElement('td');
            labelCell.textContent = tier.label;
            row.appendChild(labelCell);
            
            this.selectedPlans.forEach(plan => {
                const cell = document.createElement('td');
                const tierBenefit = plan.prescriptionBenefits[tier.key];
                if (tierBenefit) {
                    if (tierBenefit.type === 'Copay') {
                        cell.innerHTML = `<span class="benefit-type">$${tierBenefit.amount}</span> <span class="benefit-desc">copay</span>`;
                    } else if (tierBenefit.type === 'Deductible + Coinsurance') {
                        cell.innerHTML = `<span class="benefit-type">$${tierBenefit.amount} + ${tierBenefit.percentage}%</span> <span class="benefit-desc">deductible + coinsurance</span>`;
                    } else if (tierBenefit.type === 'Coinsurance') {
                        cell.innerHTML = `<span class="benefit-type">${tierBenefit.percentage}%</span> <span class="benefit-desc">coinsurance</span>`;
                    } else if (tierBenefit.type === 'Deductible + Copay') {
                        cell.innerHTML = `<span class="benefit-type">$${tierBenefit.amount}</span> <span class="benefit-desc">deductible + copay</span>`;
                    } else if (tierBenefit.type === 'Deductible') {
                        cell.innerHTML = `<span class="benefit-type">Deductible</span> <span class="benefit-desc">applies</span>`;
                    } else {
                        cell.innerHTML = `<span class="benefit-type">${tierBenefit.type}</span>`;
                    }
                } else {
                    cell.innerHTML = `<span class="benefit-type not-covered">Not Covered</span>`;
                }
                row.appendChild(cell);
            });
            
            table.appendChild(row);
        });
        
        container.appendChild(table);
    }
    
    updateSummaryCards() {
        if (this.comparisonResults.length === 0) return;
        
        // Sort results by different criteria
        const byTotalCost = [...this.comparisonResults].sort((a, b) => a.totalCost - b.totalCost);
        const byTotalOOP = [...this.comparisonResults].sort((a, b) => a.totalOOP - b.totalOOP);
        const byWorstCase = [...this.comparisonResults].sort((a, b) => b.totalCost - a.totalCost);
        
        // Best Value (lowest total cost)
        const bestValue = byTotalCost[0];
        document.getElementById('bestValuePlan').textContent = bestValue.plan.name;
        document.getElementById('bestValueCost').textContent = `$${bestValue.totalCost.toLocaleString()}`;
        
        // Best for Worst Case (highest total cost - most comprehensive coverage)
        const worstCase = byWorstCase[0];
        document.getElementById('worstCasePlan').textContent = worstCase.plan.name;
        document.getElementById('worstCaseCost').textContent = `$${worstCase.totalCost.toLocaleString()}`;
        
        // Highest OOP Based on Usage
        const highestOOP = byTotalOOP[byTotalOOP.length - 1];
        document.getElementById('highestOopPlan').textContent = highestOOP.plan.name;
        document.getElementById('highestOopCost').textContent = `$${highestOOP.totalOOP.toLocaleString()}`;
        
        // Lowest OOP Based on Usage
        const lowestOOP = byTotalOOP[0];
        document.getElementById('lowestOopPlan').textContent = lowestOOP.plan.name;
        document.getElementById('lowestOopCost').textContent = `$${lowestOOP.totalOOP.toLocaleString()}`;
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
                <td>$${result.basicMedicalCosts.toLocaleString()}</td>
                <td>$${result.majorMedicalCosts.toLocaleString()}</td>
                <td>$${result.prescriptionCosts.toLocaleString()}</td>
                <td>$${result.medicalBillsCosts.toLocaleString()}</td>
                <td>$${result.totalOOP.toLocaleString()}</td>
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
    
    setUsageScenario(scenario) {
        const scenarios = {
            light: {
                primaryVisits: 2,
                specialistVisits: 2,
                urgentCareVisits: 2,
                erVisits: 0,
                inpatientVisits: 0,
                outpatientVisits: 0,
                basicImaging: 1,
                advancedImaging: 0,
                labTests: 1,
                surgeryVisits: 0,
                tier1Drugs: 2,
                tier2Drugs: 1,
                tier3Drugs: 0,
                tier4Drugs: 0,
                tier5Drugs: 0,
                tier6Drugs: 0
            },
            medium: {
                primaryVisits: 4,
                specialistVisits: 5,
                urgentCareVisits: 0,
                erVisits: 0,
                inpatientVisits: 0,
                outpatientVisits: 1,
                basicImaging: 3,
                advancedImaging: 1,
                labTests: 1,
                surgeryVisits: 0,
                tier1Drugs: 2,
                tier2Drugs: 3,
                tier3Drugs: 2,
                tier4Drugs: 0,
                tier5Drugs: 0,
                tier6Drugs: 0
            },
            heavy: {
                primaryVisits: 6,
                specialistVisits: 12,
                urgentCareVisits: 0,
                erVisits: 1,
                inpatientVisits: 3, // 3 day stay
                outpatientVisits: 2,
                basicImaging: 4,
                advancedImaging: 2,
                labTests: 6,
                surgeryVisits: 0,
                tier1Drugs: 0,
                tier2Drugs: 3,
                tier3Drugs: 3,
                tier4Drugs: 3,
                tier5Drugs: 0,
                tier6Drugs: 0
            }
        };
        
        const selectedScenario = scenarios[scenario];
        if (selectedScenario) {
            // Update all form inputs
            Object.keys(selectedScenario).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = selectedScenario[key];
                }
            });
            
            // Update the usage scenario object
            this.updateUsageScenario();
            
            // Highlight the selected button
            document.querySelectorAll('.scenario-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(scenario + 'UsageBtn').classList.add('active');
            
            console.log(`${scenario} usage scenario applied:`, this.usageScenario);
        }
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
        
        // Filter the stored plans array
        this.filteredPlans = this.storedPlans.filter(plan => {
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
            
            return show;
        });
        
        // Reset to first page and update display
        this.currentPage = 1;
        this.updateFilteredPlanGridDisplay();
        this.updateSearchResultsInfo(this.filteredPlans.length, this.storedPlans.length);
    }
    
    updateFilteredPlanGridDisplay() {
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.plansPerPage;
        const endIndex = startIndex + this.plansPerPage;
        const plansToShow = this.filteredPlans.slice(startIndex, endIndex);
        
        plansToShow.forEach(plan => {
            const planCard = this.createPlanCard(plan);
            planGrid.appendChild(planCard);
        });
        
        this.updateFilteredPaginationControls();
    }
    
    updateFilteredPaginationControls() {
        const totalPages = Math.ceil(this.filteredPlans.length / this.plansPerPage);
        
        // Remove existing pagination controls
        const existingPagination = document.getElementById('planPagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        if (totalPages <= 1) return;
        
        // Create pagination controls
        const paginationDiv = document.createElement('div');
        paginationDiv.id = 'planPagination';
        paginationDiv.className = 'pagination-controls';
        paginationDiv.innerHTML = `
            <button id="prevPageBtn" class="btn btn-outline btn-sm" ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
            <span class="pagination-info">
                Page ${this.currentPage} of ${totalPages} (${this.filteredPlans.length} plans)
            </span>
            <button id="nextPageBtn" class="btn btn-outline btn-sm" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;
        
        // Insert after the plan grid
        const planGrid = document.getElementById('planGrid');
        planGrid.parentNode.insertBefore(paginationDiv, planGrid.nextSibling);
        
        // Add event listeners
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateFilteredPlanGridDisplay();
            }
        });
        
        document.getElementById('nextPageBtn').addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateFilteredPlanGridDisplay();
            }
        });
    }
    
    clearSearch() {
        document.getElementById('planSearchInput').value = '';
        document.getElementById('metalLevelFilter').value = '';
        document.getElementById('networkFilter').value = '';
        document.getElementById('carrierFilter').value = '';
        this.filteredPlans = [...this.storedPlans];
        this.currentPage = 1;
        this.updatePlanGridDisplay();
        this.updateSearchResultsInfo(this.storedPlans.length, this.storedPlans.length);
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

// Toggle function for cost reference
function toggleCostReference() {
    const content = document.getElementById('costReferenceContent');
    const toggle = document.getElementById('costReferenceToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// Initialize the widget when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.syncWidget = new SyncBenefitComparison();
});
