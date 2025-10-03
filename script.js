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
        this.prescriptionDrugs = []; // New array to store individual drugs
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
            'tier1': 15,
            'tier2': 50,
            'tier3': 100,
            'tier4': 200,
            'tier5': 400,
            'tier6': 600
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
        
        // Drug events
        document.getElementById('addDrugBtn').addEventListener('click', () => this.addPrescriptionDrug());
        
        // Premiums events
        document.getElementById('savePremiumsBtn').addEventListener('click', () => {
            console.log('Save Premiums button clicked!');
            this.savePremiums();
        });
        
        // Recalculate event
        document.getElementById('recalculateBtn').addEventListener('click', () => this.performComparison());
        
        // Export events
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportToExcel());
        
        // Usage scenario events - add listeners to all usage input fields
        const usageInputs = [
            'primaryVisits', 'specialistVisits', 'urgentCareVisits', 'erVisits',
            'inpatientVisits', 'outpatientVisits', 'basicImaging', 'advancedImaging',
            'labTests', 'surgeryVisits'
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
        
        // Try multiple possible paths for the JSON file (prioritize local files)
        const possiblePaths = [
            './plans/all-plans.json',
            '../plans/all-plans.json',
            'plans/all-plans.json',
            'https://kenoshi22.github.io/plan-comparison-widget/plans/all-plans.json',
            'https://kenoshi22.github.io/Plan-Comparison-Widget/plans/all-plans.json',
            'https://kenoshi22.github.io/Health_Plan_Comparison/plans/all-plans.json',
            'https://kenoshi22.github.io/plans/all-plans.json'
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
            
            // Validate plan data structure
            const firstPlan = this.storedPlans[0];
            if (firstPlan && (!firstPlan.benefits || !firstPlan.prescriptionBenefits)) {
                console.error('Plan data structure is invalid - missing benefits or prescriptionBenefits');
                console.error('First plan structure:', firstPlan);
                this.displayError('Plan data is corrupted. Please check the all-plans.json file.');
                return;
            }
            
            this.filteredPlans = [...this.storedPlans];
            this.updatePlanGridDisplay();
        } else {
            console.error('Error loading plans from all paths:', lastError);
            console.log('Falling back to hardcoded example plans...');
            
            // Fallback to hardcoded example plans if JSON loading fails
            const examplePlans = [
                {
                    id: '1449',
                    name: '1449',
                    type: 'PPO',
                    annualDeductible: 6500,
                    annualOOPMax: 9200,
                    familyDeductible: 13000,
                    familyOOPMax: 18400,
                    planYear: 2025,
                    carrier: 'Florida Blue',
                    network: 'BlueOptions',
                    metalLevel: 'Silver',
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
                    premium: 6000,
                    isCustom: false,
                    isExample: true
                },
                {
                    id: '1456',
                    name: '1456',
                    type: 'PPO',
                    annualDeductible: 2800,
                    annualOOPMax: 7150,
                    familyDeductible: 5600,
                    familyOOPMax: 14300,
                    planYear: 2025,
                    carrier: 'Florida Blue',
                    network: 'BlueOptions',
                    metalLevel: 'Gold',
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
                    premium: 6600,
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
                    <div class="premium-input-group">
                        <label for="premium-${plan.id}" class="premium-label">Monthly Premium ($)</label>
                        <input type="number" 
                               id="premium-${plan.id}" 
                               class="premium-input" 
                               value="${(plan.premium / 12).toFixed(2)}" 
                               min="0" 
                               step="0.01" 
                               placeholder="Enter monthly premium">
                        <div class="premium-note">Annual: $<span class="annual-premium">${plan.premium.toFixed(2)}</span></div>
                    </div>
                `;
                premiumsGrid.appendChild(premiumGroup);
                
                // Add event listener to update annual premium when monthly changes
                const monthlyInput = premiumGroup.querySelector('.premium-input');
                const annualDisplay = premiumGroup.querySelector('.annual-premium');
                
                monthlyInput.addEventListener('input', () => {
                    const monthlyValue = parseFloat(monthlyInput.value) || 0;
                    const annualValue = monthlyValue * 12;
                    annualDisplay.textContent = annualValue.toFixed(2);
                    
                    // Update the plan's premium value
                    plan.premium = annualValue;
                });
            });
        } else {
            section.style.display = 'none';
        }
    }
    
    savePremiums() {
        console.log('savePremiums called');
        console.log('Selected plans:', this.selectedPlans.length);
        
        // Collect premium values from input fields
        this.selectedPlans.forEach(plan => {
            const premiumInput = document.getElementById(`premium-${plan.id}`);
            console.log(`Looking for premium input: premium-${plan.id}`, premiumInput);
            if (premiumInput) {
                const monthlyPremium = parseFloat(premiumInput.value) || 0;
                plan.premium = monthlyPremium * 12; // Convert to annual
                console.log(`Updated ${plan.name}: monthly=${monthlyPremium}, annual=${plan.premium}`);
            }
        });
        
        console.log('Updated premium data:', this.selectedPlans.map(p => ({ name: p.name, monthly: p.premium/12, annual: p.premium })));
        this.performComparison();
        
        // Scroll to the calculation section
        const calculationSection = document.getElementById('planBenefitsViewer');
        if (calculationSection) {
            calculationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    performComparison() {
        console.log('performComparison called');
        console.log('Selected plans count:', this.selectedPlans.length);
        
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
        
        console.log('Comparison results:', this.comparisonResults);
        
        this.updateComparisonTable();
        this.updateMedicalBillsBreakdown();
        this.updateSummaryCards();
        this.updatePlanBenefitsViewer();
        
        // Show the comparison results section
        const comparisonResults = document.getElementById('comparisonResults');
        console.log('comparisonResults element:', comparisonResults);
        if (comparisonResults) {
            comparisonResults.style.display = 'block';
            console.log('Set comparisonResults display to block');
        }
        
        // Show the plan benefits viewer
        const planBenefitsViewer = document.getElementById('planBenefitsViewer');
        console.log('planBenefitsViewer element:', planBenefitsViewer);
        if (planBenefitsViewer) {
            planBenefitsViewer.style.display = 'block';
            console.log('Set planBenefitsViewer display to block');
        }
    }
    
    calculatePlanCosts(plan) {
        console.log(`Calculating costs for plan: ${plan.name}`);
        console.log('Plan data:', {
            name: plan.name,
            premium: plan.premium,
            annualDeductible: plan.annualDeductible,
            annualOOPMax: plan.annualOOPMax
        });
        
        // Check for NaN in plan data
        if (isNaN(plan.premium) || isNaN(plan.annualDeductible) || isNaN(plan.annualOOPMax)) {
            console.error('NaN detected in plan data:', {
                name: plan.name,
                premium: plan.premium,
                annualDeductible: plan.annualDeductible,
                annualOOPMax: plan.annualOOPMax
            });
        }
        
        // Calculate all service costs with proper deductible tracking
        const serviceCosts = this.calculateAllServiceCosts(plan);
        console.log('Service costs calculated:', serviceCosts);
        
        // Total cost = out-of-pocket costs + annual premium
        const totalCost = serviceCosts.totalOOP + plan.premium;
        console.log('Total cost calculation:', {
            totalOOP: serviceCosts.totalOOP,
            premium: plan.premium,
            totalCost: totalCost
        });
        
        // Check for NaN values
        if (isNaN(totalCost) || isNaN(serviceCosts.totalOOP)) {
            console.error('NaN detected in calculation:', {
                plan: plan.name,
                serviceCosts,
                premium: plan.premium,
                totalCost
            });
        }
        
        return {
            basicMedicalCosts: serviceCosts.basicMedicalCosts,
            majorMedicalCosts: serviceCosts.majorMedicalCosts,
            prescriptionCosts: serviceCosts.prescriptionCosts,
            medicalBillsCosts: serviceCosts.medicalBillsCosts,
            totalOOP: serviceCosts.totalOOP,
            totalCost
        };
    }
    
    calculateAllServiceCosts(plan) {
        console.error(`=== STARTING calculateAllServiceCosts FOR PLAN ${plan.name} ===`);
        let totalOOP = 0;
        let deductibleUsed = 0;
        const annualDeductible = plan.annualDeductible;
        const annualOOPMax = plan.annualOOPMax;
        
        // Track costs by category
        let basicMedicalCosts = 0;
        let majorMedicalCosts = 0;
        let prescriptionCosts = 0;
        let medicalBillsCosts = 0;
        
        console.log(`Starting calculation for plan ${plan.name}:`, {
            erVisits: this.usageScenario.erVisits,
            inpatientVisits: this.usageScenario.inpatientVisits,
            outpatientVisits: this.usageScenario.outpatientVisits,
            advancedImaging: this.usageScenario.advancedImaging,
            surgeryVisits: this.usageScenario.surgeryVisits,
            usageScenario: this.usageScenario
        });
        
        // Calculate basic medical costs
        if (this.usageScenario.primaryCareVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.primaryCare, this.usageScenario.primaryCareVisits, 'Primary Care Visit', deductibleUsed, annualDeductible);
            console.log(`Primary Care for plan ${plan.name}:`, {
                visits: this.usageScenario.primaryCareVisits,
                benefit: plan.benefits.primaryCare,
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            basicMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        if (this.usageScenario.specialistVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.specialistVisit, this.usageScenario.specialistVisits, 'Specialist Visit', deductibleUsed, annualDeductible);
            basicMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        if (this.usageScenario.urgentCareVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.urgentCare, this.usageScenario.urgentCareVisits, 'Urgent Care', deductibleUsed, annualDeductible);
            basicMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        if (this.usageScenario.labTests > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.labWork, this.usageScenario.labTests, 'Lab Tests', deductibleUsed, annualDeductible);
            basicMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        // Calculate major medical costs
        console.error(`=== MAJOR MEDICAL CALCULATION FOR PLAN ${plan.name} ===`);
        console.error(`Usage scenario:`, this.usageScenario);
        console.error(`Plan benefits:`, plan.benefits);
        
        console.log(`Before major medical calculation - majorMedicalCosts: ${majorMedicalCosts}`);
        console.log(`Major medical usage values:`, {
            emergencyRoomVisits: this.usageScenario.emergencyRoomVisits,
            inpatientDays: this.usageScenario.inpatientDays,
            outpatientVisits: this.usageScenario.outpatientVisits,
            advancedImagingVisits: this.usageScenario.advancedImagingVisits,
            ambulatoryProcedures: this.usageScenario.ambulatoryProcedures
        });
        
        console.log(`Checking Emergency Room: erVisits = ${this.usageScenario.erVisits}`);
        if (this.usageScenario.erVisits > 0) {
            console.log(`Calculating Emergency Room for plan ${plan.name}:`, {
                visits: this.usageScenario.erVisits,
                benefit: plan.benefits.emergencyRoom,
                serviceCosts: this.serviceCosts,
                deductibleUsed,
                annualDeductible
            });
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.emergencyRoom, this.usageScenario.erVisits, 'Emergency Room', deductibleUsed, annualDeductible);
            console.log(`Emergency Room result for plan ${plan.name}:`, {
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            // Safety check for NaN
            if (isNaN(cost.cost)) {
                console.error(`NaN detected in Emergency Room cost for plan ${plan.name}:`, cost);
                cost.cost = 0;
            }
            if (isNaN(cost.deductibleUsed)) {
                console.error(`NaN detected in Emergency Room deductibleUsed for plan ${plan.name}:`, cost);
                cost.deductibleUsed = 0;
            }
            
            majorMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
            console.log(`After Emergency Room - majorMedicalCosts: ${majorMedicalCosts}, cost.cost: ${cost.cost}`);
        }
        
        console.log(`Checking Inpatient: inpatientVisits = ${this.usageScenario.inpatientVisits}`);
        if (this.usageScenario.inpatientVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.inpatient, this.usageScenario.inpatientVisits, 'Inpatient Visits', deductibleUsed, annualDeductible);
            console.log(`Inpatient for plan ${plan.name}:`, {
                visits: this.usageScenario.inpatientVisits,
                benefit: plan.benefits.inpatient,
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            // Safety check for NaN
            if (isNaN(cost.cost)) {
                console.error(`NaN detected in major medical cost for plan ${plan.name}:`, cost);
                cost.cost = 0;
            }
            if (isNaN(cost.deductibleUsed)) {
                console.error(`NaN detected in major medical deductibleUsed for plan ${plan.name}:`, cost);
                cost.deductibleUsed = 0;
            }
            
            majorMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        console.log(`Checking Outpatient: outpatientVisits = ${this.usageScenario.outpatientVisits}`);
        if (this.usageScenario.outpatientVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.outpatient, this.usageScenario.outpatientVisits, 'Outpatient Visits', deductibleUsed, annualDeductible);
            console.log(`Outpatient for plan ${plan.name}:`, {
                visits: this.usageScenario.outpatientVisits,
                benefit: plan.benefits.outpatient,
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            // Safety check for NaN
            if (isNaN(cost.cost)) {
                console.error(`NaN detected in major medical cost for plan ${plan.name}:`, cost);
                cost.cost = 0;
            }
            if (isNaN(cost.deductibleUsed)) {
                console.error(`NaN detected in major medical deductibleUsed for plan ${plan.name}:`, cost);
                cost.deductibleUsed = 0;
            }
            
            majorMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        console.log(`Checking Advanced Imaging: advancedImaging = ${this.usageScenario.advancedImaging}`);
        if (this.usageScenario.advancedImaging > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.advancedImaging, this.usageScenario.advancedImaging, 'Advanced Imaging', deductibleUsed, annualDeductible);
            console.log(`Advanced Imaging for plan ${plan.name}:`, {
                visits: this.usageScenario.advancedImaging,
                benefit: plan.benefits.advancedImaging,
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            // Safety check for NaN
            if (isNaN(cost.cost)) {
                console.error(`NaN detected in major medical cost for plan ${plan.name}:`, cost);
                cost.cost = 0;
            }
            if (isNaN(cost.deductibleUsed)) {
                console.error(`NaN detected in major medical deductibleUsed for plan ${plan.name}:`, cost);
                cost.deductibleUsed = 0;
            }
            
            majorMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        console.log(`Checking Surgery: surgeryVisits = ${this.usageScenario.surgeryVisits}`);
        if (this.usageScenario.surgeryVisits > 0) {
            const cost = this.calculateServiceCostWithDeductible(plan.benefits.ambulatoryProcedures, this.usageScenario.surgeryVisits, 'Ambulatory Procedures', deductibleUsed, annualDeductible);
            console.log(`Ambulatory Procedures for plan ${plan.name}:`, {
                visits: this.usageScenario.surgeryVisits,
                benefit: plan.benefits.ambulatoryProcedures,
                cost: cost.cost,
                deductibleUsed: cost.deductibleUsed
            });
            // Safety check for NaN
            if (isNaN(cost.cost)) {
                console.error(`NaN detected in major medical cost for plan ${plan.name}:`, cost);
                cost.cost = 0;
            }
            if (isNaN(cost.deductibleUsed)) {
                console.error(`NaN detected in major medical deductibleUsed for plan ${plan.name}:`, cost);
                cost.deductibleUsed = 0;
            }
            
            majorMedicalCosts += cost.cost;
            deductibleUsed += cost.deductibleUsed;
        }
        
        // Calculate prescription costs from individual drugs
        this.prescriptionDrugs.forEach(drug => {
            if (plan.prescriptionBenefits[drug.tier]) {
                const benefit = plan.prescriptionBenefits[drug.tier];
                let visits = drug.quantity;
                
                // Calculate visits based on frequency
                switch (drug.frequency) {
                    case '1monthly':
                        visits = drug.quantity * 1; // 1 time per year
                        break;
                    case 'monthly':
                        visits = drug.quantity * 12; // 12 months per year
                        break;
                    case '3months':
                        visits = drug.quantity * 4; // 4 times per year
                        break;
                    case '6months':
                        visits = drug.quantity * 2; // 2 times per year
                        break;
                    case '9months':
                        visits = drug.quantity * 1.33; // ~1.33 times per year
                        break;
                    case '12months':
                        visits = drug.quantity * 1; // 1 time per year
                        break;
                    case 'onetime':
                        visits = drug.quantity; // One-time purchase
                        break;
                    default:
                        visits = drug.quantity;
                }
                
                const cost = this.calculateServiceCostWithDeductible(benefit, visits, drug.tier, deductibleUsed, annualDeductible);
                console.log(`Prescription drug for plan ${plan.name}:`, {
                    drug: drug,
                    visits: visits,
                    benefit: benefit,
                    cost: cost.cost,
                    deductibleUsed: cost.deductibleUsed
                });
                prescriptionCosts += cost.cost;
                deductibleUsed += cost.deductibleUsed;
            }
        });
        
        // Calculate medical bills costs
        this.medicalBills.forEach(bill => {
            const benefit = plan.benefits[this.mapServiceTypeToBenefitKey(bill.benefitType)];
            
            if (benefit) {
                // Calculate cost using the actual bill amount
                const cost = this.calculateMedicalBillCost(benefit, bill.amount, deductibleUsed, annualDeductible);
                medicalBillsCosts += cost.cost;
                deductibleUsed += cost.deductibleUsed;
                
                console.log(`Medical bill calculation for ${bill.description}:`, {
                    billAmount: bill.amount,
                    benefitType: bill.benefitType,
                    benefit: benefit,
                    calculatedCost: cost.cost,
                    deductibleUsed: cost.deductibleUsed
                });
            }
        });
        
        // Calculate total OOP with NaN safety check
        totalOOP = (basicMedicalCosts || 0) + (majorMedicalCosts || 0) + (prescriptionCosts || 0) + (medicalBillsCosts || 0);
        
        // Check for NaN in individual components
        if (isNaN(basicMedicalCosts)) {
            console.error(`NaN in basicMedicalCosts for plan ${plan.name}:`, basicMedicalCosts);
            basicMedicalCosts = 0;
        }
        if (isNaN(majorMedicalCosts)) {
            console.error(`NaN in majorMedicalCosts for plan ${plan.name}:`, majorMedicalCosts);
            majorMedicalCosts = 0;
        }
        if (isNaN(prescriptionCosts)) {
            console.error(`NaN in prescriptionCosts for plan ${plan.name}:`, prescriptionCosts);
            prescriptionCosts = 0;
        }
        if (isNaN(medicalBillsCosts)) {
            console.error(`NaN in medicalBillsCosts for plan ${plan.name}:`, medicalBillsCosts);
            medicalBillsCosts = 0;
        }
        
        // Recalculate totalOOP after fixing NaN values
        totalOOP = basicMedicalCosts + majorMedicalCosts + prescriptionCosts + medicalBillsCosts;
        
        console.log(`Plan ${plan.name} OOP calculation:`, {
            basicMedicalCosts,
            majorMedicalCosts,
            prescriptionCosts,
            medicalBillsCosts,
            totalOOPBeforeCap: totalOOP,
            annualOOPMax,
            deductibleUsed
        });
        
        // Cap at out-of-pocket maximum
        if (totalOOP > annualOOPMax) {
            console.log(`Capping OOP for plan ${plan.name}: ${totalOOP} -> ${annualOOPMax}`);
            totalOOP = annualOOPMax;
        }
        
        console.log(`Final OOP for plan ${plan.name}:`, totalOOP);
        
        return {
            basicMedicalCosts,
            majorMedicalCosts,
            prescriptionCosts,
            medicalBillsCosts,
            totalOOP
        };
    }
    
    calculateServiceCostWithDeductible(benefit, visits, serviceType, deductibleUsed, annualDeductible) {
        if (!benefit || benefit.type === 'Not Covered') {
            return { cost: 0, deductibleUsed: 0 };
        }
        
        // Validate inputs
        if (isNaN(visits) || visits < 0) {
            console.error(`Invalid visits value for ${serviceType}:`, visits);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        if (isNaN(deductibleUsed) || deductibleUsed < 0) {
            console.error(`Invalid deductibleUsed value for ${serviceType}:`, deductibleUsed);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        if (isNaN(annualDeductible) || annualDeductible < 0) {
            console.error(`Invalid annualDeductible value for ${serviceType}:`, annualDeductible);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        const serviceCost = this.serviceCosts[serviceType] || 0;
        const totalServiceCost = serviceCost * visits;
        const remainingDeductible = Math.max(0, annualDeductible - deductibleUsed);
        
        // Debug logging for NaN detection
        if (isNaN(serviceCost) || isNaN(visits) || isNaN(totalServiceCost) || isNaN(annualDeductible) || isNaN(deductibleUsed)) {
            console.error('NaN detected in calculateServiceCostWithDeductible:', {
                serviceType,
                serviceCost,
                visits,
                totalServiceCost,
                annualDeductible,
                deductibleUsed,
                benefit,
                serviceCosts: this.serviceCosts
            });
            return { cost: 0, deductibleUsed: 0 };
        }
        
        // Additional safety check for serviceCosts
        if (!this.serviceCosts || !this.serviceCosts[serviceType]) {
            console.error(`Missing service cost for ${serviceType}:`, {
                serviceType,
                serviceCosts: this.serviceCosts,
                availableKeys: this.serviceCosts ? Object.keys(this.serviceCosts) : 'serviceCosts is undefined'
            });
            return { cost: 0, deductibleUsed: 0 };
        }
        
        // Validate benefit structure
        if (!benefit.type) {
            console.error(`Missing benefit type for ${serviceType}:`, benefit);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        console.log(`Calculating ${serviceType}:`, {
            benefitType: benefit.type,
            benefit: benefit,
            visits: visits,
            serviceCost: serviceCost,
            totalServiceCost: totalServiceCost,
            deductibleUsed: deductibleUsed,
            annualDeductible: annualDeductible,
            remainingDeductible: remainingDeductible
        });
        
        switch (benefit.type) {
            case 'Copay':
                // Flat copay per visit, regardless of service cost
                const copayCost = benefit.amount * visits;
                console.log(`Copay calculation: ${benefit.amount} * ${visits} = ${copayCost}`);
                const result = { cost: copayCost, deductibleUsed: 0 };
                console.log(`Copay result:`, result);
                return result;
                
            case 'Coinsurance':
                // Pure percentage split - patient pays percentage of total cost
                return { cost: totalServiceCost * (benefit.percentage / 100), deductibleUsed: 0 };
                
            case 'Deductible + Coinsurance':
                // Patient pays full cost until deductible is met, then percentage
                if (totalServiceCost <= remainingDeductible) {
                    return { cost: totalServiceCost, deductibleUsed: totalServiceCost };
                } else {
                    const afterDeductible = totalServiceCost - remainingDeductible;
                    return { 
                        cost: remainingDeductible + (afterDeductible * (benefit.percentage / 100)), 
                        deductibleUsed: remainingDeductible 
                    };
                }
                
            case 'Deductible + Copay':
                // Patient pays full cost until deductible is met, then flat copay
                console.log(`Deductible + Copay calculation for ${serviceType}:`, {
                    benefitDeductible: benefit.amount,
                    benefitCopay: benefit.copay,
                    deductibleUsed,
                    annualDeductible,
                    totalServiceCost,
                    visits
                });
                
                // Validate benefit properties
                const benefitDeductible = benefit.amount || 0;
                const benefitCopay = benefit.copay || 0;
                
                // Handle missing copay property for Deductible + Copay benefits
                if (benefit.type === 'Deductible + Copay' && !benefit.hasOwnProperty('copay')) {
                    console.warn(`Missing copay property for Deductible + Copay benefit in ${serviceType}, using amount as copay after deductible:`, benefit);
                    // For this data structure, treat the amount as the copay after meeting the annual deductible
                    const copayAmount = benefit.amount || 0;
                    
                    if (deductibleUsed >= annualDeductible) {
                        // Annual deductible is already met, apply copay
                        const copayCost = copayAmount * visits;
                        console.log(`Annual deductible met, applying copay: ${copayAmount} * ${visits} = ${copayCost}`);
                        return { cost: copayCost, deductibleUsed: 0 };
                    } else {
                        // Annual deductible not met, pay full service cost until deductible is reached
                        const remainingDeductible = annualDeductible - deductibleUsed;
                        const costBeforeDeductible = Math.min(totalServiceCost, remainingDeductible);
                        const costAfterDeductible = Math.max(0, totalServiceCost - remainingDeductible);
                        const copayCost = costAfterDeductible > 0 ? copayAmount * visits : 0;
                        const totalCost = costBeforeDeductible + copayCost;
                        
                        console.log(`Annual deductible not met, cost breakdown:`, {
                            costBeforeDeductible,
                            costAfterDeductible,
                            copayCost,
                            totalCost,
                            remainingDeductible
                        });
                        
                        return { 
                            cost: totalCost, 
                            deductibleUsed: costBeforeDeductible 
                        };
                    }
                }
                
                // Safety check for NaN values
                if (isNaN(benefitDeductible) || isNaN(benefitCopay)) {
                    console.error(`NaN detected in Deductible + Copay benefit for ${serviceType}:`, {
                        benefitDeductible,
                        benefitCopay,
                        benefit
                    });
                    return { cost: 0, deductibleUsed: 0 };
                }
                
                const totalDeductibleUsed = deductibleUsed + benefitDeductible;
                
                if (totalDeductibleUsed <= annualDeductible) {
                    // Deductible is met, apply copay
                    const copayCost = benefitCopay * visits;
                    console.log(`Deductible met, applying copay: ${benefitCopay} * ${visits} = ${copayCost}`);
                    
                    // Safety check for NaN result
                    if (isNaN(copayCost)) {
                        console.error(`NaN detected in copay calculation for ${serviceType}:`, {
                            benefitCopay,
                            visits,
                            copayCost
                        });
                        return { cost: 0, deductibleUsed: 0 };
                    }
                    
                    return { 
                        cost: copayCost, 
                        deductibleUsed: 0 // No additional deductible used since we're past it
                    };
                } else {
                    // Deductible not met, pay full service cost
                    console.log(`Deductible not met, paying full service cost: ${totalServiceCost}`);
                    return { 
                        cost: totalServiceCost, 
                        deductibleUsed: Math.min(totalServiceCost, remainingDeductible)
                    };
                }
                
            case 'Deductible':
                // Patient pays full cost until deductible is met, then nothing
                const deductibleAmount = benefit.amount || 0;
                const deductibleToUse = Math.min(totalServiceCost, Math.min(deductibleAmount, remainingDeductible));
                return { cost: deductibleToUse, deductibleUsed: deductibleToUse };
                
            default:
                return { cost: 0, deductibleUsed: 0 };
        }
    }
    
    // Calculate medical bill cost using actual bill amount
    calculateMedicalBillCost(benefit, billAmount, deductibleUsed, annualDeductible) {
        if (!benefit || benefit.type === 'Not Covered') {
            return { cost: 0, deductibleUsed: 0 };
        }
        
        // Validate inputs
        if (isNaN(billAmount) || billAmount < 0) {
            console.error(`Invalid bill amount:`, billAmount);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        if (isNaN(deductibleUsed) || deductibleUsed < 0) {
            console.error(`Invalid deductibleUsed value:`, deductibleUsed);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        if (isNaN(annualDeductible) || annualDeductible < 0) {
            console.error(`Invalid annualDeductible value:`, annualDeductible);
            return { cost: 0, deductibleUsed: 0 };
        }
        
        const remainingDeductible = Math.max(0, annualDeductible - deductibleUsed);
        
        console.log(`Calculating medical bill cost:`, {
            benefitType: benefit.type,
            billAmount: billAmount,
            deductibleUsed: deductibleUsed,
            annualDeductible: annualDeductible,
            remainingDeductible: remainingDeductible
        });
        
        switch (benefit.type) {
            case 'Copay':
                // Flat copay per bill, regardless of bill amount
                const copayCost = benefit.amount;
                console.log(`Copay calculation: ${benefit.amount} = ${copayCost}`);
                return { cost: copayCost, deductibleUsed: 0 };
                
            case 'Coinsurance':
                // Pure percentage split - patient pays percentage of bill amount
                const coinsuranceCost = billAmount * (benefit.percentage / 100);
                console.log(`Coinsurance calculation: ${billAmount} * ${benefit.percentage}% = ${coinsuranceCost}`);
                return { cost: coinsuranceCost, deductibleUsed: 0 };
                
            case 'Deductible + Coinsurance':
                // Patient pays full bill until deductible is met, then percentage
                if (billAmount <= remainingDeductible) {
                    console.log(`Deductible + Coinsurance: Bill ${billAmount} <= remaining deductible ${remainingDeductible}, pay full amount`);
                    return { cost: billAmount, deductibleUsed: billAmount };
                } else {
                    const afterDeductible = billAmount - remainingDeductible;
                    const cost = remainingDeductible + (afterDeductible * (benefit.percentage / 100));
                    console.log(`Deductible + Coinsurance: Bill ${billAmount} > remaining deductible ${remainingDeductible}, cost = ${cost}`);
                    return { 
                        cost: cost, 
                        deductibleUsed: remainingDeductible 
                    };
                }
                
            case 'Deductible + Copay':
                // Patient pays full bill until deductible is met, then flat copay
                if (deductibleUsed >= annualDeductible) {
                    // Annual deductible is already met, apply copay
                    const copayCost = benefit.amount;
                    console.log(`Deductible + Copay: Annual deductible met, apply copay ${copayCost}`);
                    return { cost: copayCost, deductibleUsed: 0 };
                } else {
                    // Annual deductible not met, pay full bill amount until deductible is reached
                    const costBeforeDeductible = Math.min(billAmount, remainingDeductible);
                    const costAfterDeductible = Math.max(0, billAmount - remainingDeductible);
                    const copayCost = costAfterDeductible > 0 ? benefit.amount : 0;
                    const totalCost = costBeforeDeductible + copayCost;
                    
                    console.log(`Deductible + Copay: Annual deductible not met`, {
                        costBeforeDeductible,
                        costAfterDeductible,
                        copayCost,
                        totalCost,
                        remainingDeductible
                    });
                    
                    return { 
                        cost: totalCost, 
                        deductibleUsed: costBeforeDeductible 
                    };
                }
                
            case 'Deductible':
                // Patient pays full bill until deductible is met, then nothing
                const deductibleAmount = benefit.amount || 0;
                const deductibleToUse = Math.min(billAmount, Math.min(deductibleAmount, remainingDeductible));
                console.log(`Deductible: Bill ${billAmount}, deductible to use ${deductibleToUse}`);
                return { cost: deductibleToUse, deductibleUsed: deductibleToUse };
                
            default:
                console.log(`Unknown benefit type: ${benefit.type}, returning 0 cost`);
                return { cost: 0, deductibleUsed: 0 };
        }
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
                    <div class="plan-financials">
                        <div class="plan-deductible">Deductible: $${plan.annualDeductible.toLocaleString()}</div>
                        <div class="plan-oopm">OOP Max: $${plan.annualOOPMax.toLocaleString()}</div>
                    </div>
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
        
        // Calculate the three specific options
        const lowestOutOfPocketCosts = this.findLowestOutOfPocketCosts();
        const bestOptions = this.findBestOptions();
        const highestOutOfPocketCosts = this.findHighestOutOfPocketCosts();
        
        // Update the display
        this.updateSummaryCard('lowestOopCard', 'Lowest Out-of-Pocket Costs', lowestOutOfPocketCosts, 'lowest-oop');
        this.updateSummaryCard('bestValueCard', 'Best Options', bestOptions, 'best-options');
        this.updateSummaryCard('highestOopCard', 'Highest Out-of-Pocket Costs', highestOutOfPocketCosts, 'highest-oop');
    }
    
    findLowestOutOfPocketCosts() {
        // Plan with the lowest premium + Max out of pocket total
        return this.comparisonResults.reduce((lowest, current) => {
            const currentTotal = current.plan.premium + current.plan.annualOOPMax;
            const lowestTotal = lowest.plan.premium + lowest.plan.annualOOPMax;
            return currentTotal < lowestTotal ? current : lowest;
        });
    }
    
    findBestOptions() {
        // Plan with the cheapest overall cost based on usage scenario
        return this.comparisonResults.reduce((best, current) => {
            console.log('Comparing plans for best options:', {
                best: { name: best.plan.name, totalCost: best.totalCost },
                current: { name: current.plan.name, totalCost: current.totalCost }
            });
            
            if (isNaN(current.totalCost)) {
                console.error('NaN totalCost found in current plan:', current);
            }
            if (isNaN(best.totalCost)) {
                console.error('NaN totalCost found in best plan:', best);
            }
            
            return current.totalCost < best.totalCost ? current : best;
        });
    }
    
    findHighestOutOfPocketCosts() {
        // Plan with the highest Premium + Max out of pocket total
        return this.comparisonResults.reduce((highest, current) => {
            const currentTotal = current.plan.premium + current.plan.annualOOPMax;
            const highestTotal = highest.plan.premium + highest.plan.annualOOPMax;
            
            console.log('Comparing plans for highest OOP costs:', {
                highest: { name: highest.plan.name, totalCost: highest.totalCost, premium: highest.plan.premium, oopMax: highest.plan.annualOOPMax },
                current: { name: current.plan.name, totalCost: current.totalCost, premium: current.plan.premium, oopMax: current.plan.annualOOPMax }
            });
            
            if (isNaN(currentTotal)) {
                console.error('NaN in currentTotal calculation:', {
                    premium: current.plan.premium,
                    oopMax: current.plan.annualOOPMax,
                    currentTotal
                });
            }
            
            return currentTotal > highestTotal ? current : highest;
        });
    }
    
    updateSummaryCard(cardId, title, plan, highlightClass) {
        const card = document.getElementById(cardId);
        const titleElement = card.querySelector('h4');
        
        // Debug logging for summary cards
        console.log(`Updating summary card ${cardId}:`, {
            planName: plan.plan.name,
            totalCost: plan.totalCost,
            totalOOP: plan.totalOOP,
            premium: plan.plan.premium
        });
        
        // Get the correct element IDs based on cardId
        let planNameElement, planCostElement;
        if (cardId === 'lowestOopCard') {
            planNameElement = document.getElementById('lowestOopPlan');
            planCostElement = document.getElementById('lowestOopCost');
        } else if (cardId === 'bestValueCard') {
            planNameElement = document.getElementById('bestValuePlan');
            planCostElement = document.getElementById('bestValueCost');
        } else if (cardId === 'highestOopCard') {
            planNameElement = document.getElementById('highestOopPlan');
            planCostElement = document.getElementById('highestOopCost');
        }
        
        // Update title
        titleElement.textContent = title;
        
        // Update plan name and cost
        if (planNameElement && planCostElement) {
            planNameElement.textContent = plan.plan.name;
            
            // Safe formatting for cost to prevent NaN display
            const safeFormat = (value) => {
                if (isNaN(value) || value === null || value === undefined) {
                    return '$0';
                }
                return `$${value.toLocaleString()}`;
            };
            
            planCostElement.textContent = safeFormat(plan.totalCost);
        }
        
        // Add highlight class
        card.className = `summary-card ${highlightClass}`;
        
        // Show the card
        card.style.display = 'block';
    }
    
    updateComparisonTable() {
        const tableBody = document.getElementById('comparisonTableBody');
        tableBody.innerHTML = '';
        
        this.comparisonResults.forEach(result => {
            const row = document.createElement('tr');
            const monthlyPremium = result.plan.premium / 12;
            
            // Helper function to safely format numbers
            const safeFormat = (value) => {
                if (isNaN(value) || value === null || value === undefined) {
                    return '$0';
                }
                return `$${value.toLocaleString()}`;
            };
            
            // Debug logging for the problematic plans
            if (result.plan.name === '1449' || result.plan.name === '1456') {
                console.log(`Plan ${result.plan.name} values:`, {
                    basicMedicalCosts: result.basicMedicalCosts,
                    majorMedicalCosts: result.majorMedicalCosts,
                    prescriptionCosts: result.prescriptionCosts,
                    medicalBillsCosts: result.medicalBillsCosts,
                    totalOOP: result.totalOOP,
                    totalCost: result.totalCost,
                    premium: result.plan.premium
                });
            }
            
            row.innerHTML = `
                <td><strong>${result.plan.name}</strong></td>
                <td>${safeFormat(result.plan.annualDeductible)}</td>
                <td>${safeFormat(result.plan.annualOOPMax)}</td>
                <td>${safeFormat(result.plan.premium)} <small>($${monthlyPremium.toFixed(2)}/mo)</small></td>
                <td>${safeFormat(result.basicMedicalCosts)}</td>
                <td>${safeFormat(result.majorMedicalCosts)}</td>
                <td>${safeFormat(result.prescriptionCosts)}</td>
                <td>${safeFormat(result.medicalBillsCosts)}</td>
                <td>${safeFormat(result.totalOOP)}</td>
                <td><strong>${safeFormat(result.totalCost)}</strong></td>
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
        const container = document.getElementById('billsList');
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
    
    addPrescriptionDrug() {
        const drugType = document.getElementById('drugType').value;
        const quantity = parseInt(document.getElementById('drugQuantity').value);
        const tier = document.getElementById('drugTier').value;
        const frequency = document.getElementById('drugFrequency').value;
        
        if (!drugType || !quantity || !tier || !frequency) {
            alert('Please fill in all fields for the prescription drug.');
            return;
        }
        
        const drug = {
            id: Date.now(),
            drugType,
            quantity,
            tier,
            frequency
        };
        
        this.prescriptionDrugs.push(drug);
        this.displayPrescriptionDrugs();
        this.performComparison();
        
        // Clear form
        document.getElementById('drugType').value = '';
        document.getElementById('drugQuantity').value = '1';
        document.getElementById('drugTier').value = '';
        document.getElementById('drugFrequency').value = '';
    }
    
    displayPrescriptionDrugs() {
        const tableBody = document.getElementById('drugsTableBody');
        tableBody.innerHTML = '';
        
        if (this.prescriptionDrugs.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="empty-table-message">
                    No prescription drugs added yet. Use the form above to add drugs.
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }
        
        this.prescriptionDrugs.forEach(drug => {
            const row = document.createElement('tr');
            const frequencyText = this.getFrequencyText(drug.frequency);
            const tierDisplayName = this.getTierDisplayName(drug.tier);
            
            row.innerHTML = `
                <td class="drug-type">${drug.drugType}</td>
                <td class="drug-tier">${tierDisplayName}</td>
                <td class="drug-quantity">${drug.quantity}</td>
                <td class="drug-frequency">${frequencyText}</td>
                <td>
                    <button class="remove-drug-btn" onclick="syncWidget.removePrescriptionDrug(${drug.id})">
                        Remove
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    getTierDisplayName(tierKey) {
        const tierMap = {
            'tier1': 'Tier 1',
            'tier2': 'Tier 2',
            'tier3': 'Tier 3',
            'tier4': 'Tier 4',
            'tier5': 'Tier 5',
            'tier6': 'Tier 6'
        };
        return tierMap[tierKey] || tierKey;
    }
    
    removePrescriptionDrug(drugId) {
        this.prescriptionDrugs = this.prescriptionDrugs.filter(drug => drug.id !== drugId);
        this.displayPrescriptionDrugs();
        this.performComparison();
    }
    
    getFrequencyText(frequency) {
        const frequencyMap = {
            '1monthly': '1 Monthly',
            'monthly': 'Monthly - indefinitely',
            '3months': '3 Months',
            '6months': '6 Months',
            '9months': '9 Months',
            '12months': '12 Months',
            'onetime': 'One-time purchase'
        };
        return frequencyMap[frequency] || frequency;
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
        this.prescriptionDrugs = [];
        
        // Clear UI
        document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
        document.getElementById('selectedPlans').innerHTML = '';
        document.getElementById('comparisonTableBody').innerHTML = '';
        document.getElementById('billsList').innerHTML = '';
        document.getElementById('medicalBillsBreakdown').innerHTML = '';
        document.getElementById('drugsTableBody').innerHTML = '';
        document.getElementById('enterPremiumsSection').style.display = 'none';
        
        // Reset usage scenario
        Object.keys(this.usageScenario).forEach(key => {
            this.usageScenario[key] = 0;
        });
        
        // Reset form
        document.getElementById('usageScenarioForm').reset();
        
        // Clear drug form
        document.getElementById('drugType').value = '';
        document.getElementById('drugQuantity').value = '1';
        document.getElementById('drugTier').value = '';
        document.getElementById('drugFrequency').value = '';
    }
    
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    setUsageScenario(scenario) {
        console.log(`Setting usage scenario to: ${scenario}`);
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
                surgeryVisits: 0
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
                surgeryVisits: 0
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
                surgeryVisits: 0
            }
        };
        
        const selectedScenario = scenarios[scenario];
        if (selectedScenario) {
            // Clear existing prescription drugs
            this.prescriptionDrugs = [];
            
            // Update all form inputs
            Object.keys(selectedScenario).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = selectedScenario[key];
                }
            });
            
            // Add preloaded prescription drugs based on scenario
            if (scenario === 'light') {
                this.prescriptionDrugs = [
                    { id: 1, drugType: 'Generic', quantity: 1, tier: 'tier1', frequency: '3months' },
                    { id: 2, drugType: 'Generic', quantity: 1, tier: 'tier2', frequency: '3months' },
                    { id: 3, drugType: 'Generic', quantity: 1, tier: 'tier3', frequency: '3months' }
                ];
            } else if (scenario === 'medium') {
                this.prescriptionDrugs = [
                    { id: 1, drugType: 'Generic', quantity: 1, tier: 'tier2', frequency: 'monthly' },
                    { id: 2, drugType: 'Generic', quantity: 2, tier: 'tier3', frequency: 'monthly' }
                ];
            } else if (scenario === 'heavy') {
                this.prescriptionDrugs = [
                    { id: 1, drugType: 'Generic', quantity: 3, tier: 'tier2', frequency: 'monthly' },
                    { id: 2, drugType: 'Generic', quantity: 2, tier: 'tier3', frequency: 'monthly' },
                    { id: 3, drugType: 'Generic', quantity: 1, tier: 'tier4', frequency: 'monthly' }
                ];
            }
            
            // Update the usage scenario object
            this.updateUsageScenario();
            
            // Display the preloaded drugs
            this.displayPrescriptionDrugs();
            
            // Highlight the selected button
            document.querySelectorAll('.scenario-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(scenario + 'UsageBtn').classList.add('active');
            
            // Update the usage scenario object from the form inputs
            this.updateUsageScenario();
            
            console.log(`${scenario} usage scenario applied:`, this.usageScenario);
            console.log(`${scenario} prescription drugs applied:`, this.prescriptionDrugs);
        }
    }
    
    updateUsageScenario() {
        console.log('Updating usage scenario from form inputs...');
        // Update usage scenario from form inputs
        this.usageScenario = {
            primaryCareVisits: parseInt(document.getElementById('primaryVisits')?.value || 0),
            specialistVisits: parseInt(document.getElementById('specialistVisits')?.value || 0),
            urgentCareVisits: parseInt(document.getElementById('urgentCareVisits')?.value || 0),
            erVisits: parseInt(document.getElementById('erVisits')?.value || 0),
            ambulanceRides: 0, // Not in form
            inpatientVisits: parseInt(document.getElementById('inpatientVisits')?.value || 0),
            outpatientVisits: parseInt(document.getElementById('outpatientVisits')?.value || 0),
            basicImaging: parseInt(document.getElementById('basicImaging')?.value || 0),
            advancedImaging: parseInt(document.getElementById('advancedImaging')?.value || 0),
            labTests: parseInt(document.getElementById('labTests')?.value || 0),
            surgeryVisits: parseInt(document.getElementById('surgeryVisits')?.value || 0)
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
    
    // Export Methods
    exportToPDF() {
        if (this.comparisonResults.length === 0) {
            alert('Please run a comparison first before exporting to PDF.');
            return;
        }
        
        try {
            // Create a new window for PDF content
            const printWindow = window.open('', '_blank');
            const currentDate = new Date().toLocaleDateString();
            
            // Get usage scenario details
            const usageDetails = this.getUsageScenarioDetails();
            const drugDetails = this.getDrugDetails();
            
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Health Plan Comparison Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #011689; margin-bottom: 10px; }
                        .header p { color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #011689; color: white; font-weight: bold; }
                        .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                        .summary h3 { color: #011689; margin-bottom: 10px; }
                        .summary-item { margin-bottom: 5px; }
                        .best-value { background-color: #d4edda; }
                        .section { margin-bottom: 25px; }
                        .section h3 { color: #011689; border-bottom: 2px solid #011689; padding-bottom: 5px; }
                        .benefits-table th, .benefits-table td { padding: 6px; font-size: 11px; }
                        .page-break { page-break-before: always; }
                        .usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                        .usage-section { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                        .drug-item { background: #e9ecef; padding: 8px; margin: 5px 0; border-radius: 3px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Health Plan Comparison Report</h1>
                        <p>Generated on ${currentDate}</p>
                    </div>
                    
                    <div class="summary">
                        <h3>Executive Summary</h3>
                        <div class="summary-item"><strong>Best Value Plan:</strong> ${this.comparisonResults[0].plan.name} - $${this.comparisonResults[0].totalCost.toLocaleString()}</div>
                        <div class="summary-item"><strong>Total Plans Compared:</strong> ${this.comparisonResults.length}</div>
                        <div class="summary-item"><strong>Report Date:</strong> ${currentDate}</div>
                    </div>
                    
                    <div class="section">
                        <h3>Usage Scenario</h3>
                        <div class="usage-grid">
                            <div class="usage-section">
                                <h4>Medical Services</h4>
                                ${usageDetails}
                            </div>
                            <div class="usage-section">
                                <h4>Prescription Drugs</h4>
                                ${drugDetails}
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Cost Comparison</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Plan Name</th>
                                        <th>Deductible</th>
                                        <th>OOP Max</th>
                                        <th>Annual Premium</th>
                                        <th>Basic Medical</th>
                                        <th>Major Medical</th>
                                        <th>Drug Costs</th>
                                        <th>Medical Bills</th>
                                        <th>Out-of-Pocket Costs</th>
                                        <th>Total Annual Cost</th>
                                    </tr>
                                </thead>
                            <tbody>
            `;
            
            this.comparisonResults.forEach((result, index) => {
                const rowClass = index === 0 ? 'best-value' : '';
                htmlContent += `
                    <tr class="${rowClass}">
                        <td><strong>${result.plan.name}</strong></td>
                        <td>$${result.plan.annualDeductible.toLocaleString()}</td>
                        <td>$${result.plan.annualOOPMax.toLocaleString()}</td>
                        <td>$${result.plan.premium.toLocaleString()}</td>
                        <td>$${result.basicMedicalCosts.toLocaleString()}</td>
                        <td>$${result.majorMedicalCosts.toLocaleString()}</td>
                        <td>$${result.prescriptionCosts.toLocaleString()}</td>
                        <td>$${result.medicalBillsCosts.toLocaleString()}</td>
                        <td>$${result.totalOOP.toLocaleString()}</td>
                        <td><strong>$${result.totalCost.toLocaleString()}</strong></td>
                    </tr>
                `;
            });
            
            htmlContent += `
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="page-break"></div>
                    
                    <div class="section">
                        <h3>Plan Benefits Comparison</h3>
                        <table class="benefits-table">
                            <thead>
                                <tr>
                                    <th>Benefit</th>
            `;
            
            // Add plan names as headers
            this.comparisonResults.forEach(result => {
                htmlContent += `<th>${result.plan.name}</th>`;
            });
            
            htmlContent += `
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Add benefits rows
            const benefits = [
                { name: 'Primary Care', key: 'primaryCare' },
                { name: 'Specialist Visit', key: 'specialistVisit' },
                { name: 'Emergency Room', key: 'emergencyRoom' },
                { name: 'Inpatient', key: 'inpatient' },
                { name: 'Outpatient', key: 'outpatient' },
                { name: 'Urgent Care', key: 'urgentCare' },
                { name: 'Lab Work', key: 'labWork' },
                { name: 'Advanced Imaging', key: 'advancedImaging' },
                { name: 'Ambulatory Procedures', key: 'ambulatoryProcedures' }
            ];
            
            benefits.forEach(benefit => {
                htmlContent += `<tr><td><strong>${benefit.name}</strong></td>`;
                this.comparisonResults.forEach(result => {
                    const benefitData = result.plan.benefits[benefit.key];
                    if (benefitData && benefitData.type !== 'Not Covered') {
                        if (benefitData.type === 'Copay') {
                            htmlContent += `<td>$${benefitData.amount} copay</td>`;
                        } else if (benefitData.type === 'Deductible + Coinsurance') {
                            htmlContent += `<td>$${benefitData.amount} deductible + ${benefitData.percentage}% coinsurance</td>`;
                        } else if (benefitData.type === 'Coinsurance') {
                            htmlContent += `<td>${benefitData.percentage}% coinsurance</td>`;
                        } else if (benefitData.type === 'Deductible + Copay') {
                            htmlContent += `<td>$${benefitData.amount} deductible + $${benefitData.copay} copay</td>`;
                        } else {
                            htmlContent += `<td>${benefitData.type}</td>`;
                        }
                    } else {
                        htmlContent += `<td>Not Covered</td>`;
                    }
                });
                htmlContent += `</tr>`;
            });
            
            // Add prescription benefits
            const prescriptionTiers = [
                { key: 'tier1', name: 'Tier 1' },
                { key: 'tier2', name: 'Tier 2' },
                { key: 'tier3', name: 'Tier 3' },
                { key: 'tier4', name: 'Tier 4' },
                { key: 'tier5', name: 'Tier 5' },
                { key: 'tier6', name: 'Tier 6' }
            ];
            prescriptionTiers.forEach(tier => {
                htmlContent += `<tr><td><strong>${tier.name}</strong></td>`;
                this.comparisonResults.forEach(result => {
                    const benefitData = result.plan.prescriptionBenefits[tier.key];
                    if (benefitData && benefitData.type !== 'Not Covered') {
                        if (benefitData.type === 'Copay') {
                            htmlContent += `<td>$${benefitData.amount} copay</td>`;
                        } else if (benefitData.type === 'Deductible + Coinsurance') {
                            htmlContent += `<td>$${benefitData.amount} deductible + ${benefitData.percentage}% coinsurance</td>`;
                        } else if (benefitData.type === 'Coinsurance') {
                            htmlContent += `<td>${benefitData.percentage}% coinsurance</td>`;
                        } else if (benefitData.type === 'Deductible + Copay') {
                            htmlContent += `<td>$${benefitData.amount} deductible + $${benefitData.copay} copay</td>`;
                        } else {
                            htmlContent += `<td>${benefitData.type}</td>`;
                        }
                    } else {
                        htmlContent += `<td>Not Covered</td>`;
                    }
                });
                htmlContent += `</tr>`;
            });
            
            htmlContent += `
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h3>Plan Details</h3>
            `;
            
            this.comparisonResults.forEach((result, index) => {
                htmlContent += `
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h4>${result.plan.name}</h4>
                        <p><strong>Plan Type:</strong> ${result.plan.planType}</p>
                        <p><strong>Network:</strong> ${result.plan.networkName || 'Not specified'}</p>
                        <p><strong>Annual Deductible:</strong> $${result.plan.annualDeductible.toLocaleString()}</p>
                        <p><strong>Annual Out-of-Pocket Maximum:</strong> $${result.plan.annualOOPMax.toLocaleString()}</p>
                        <p><strong>Annual Premium:</strong> $${result.plan.premium.toLocaleString()}</p>
                    </div>
                `;
            });
            
            htmlContent += `
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }
    
    getUsageScenarioDetails() {
        let details = '';
        if (this.usageScenario.primaryCareVisits > 0) details += `<div>Primary Care: ${this.usageScenario.primaryCareVisits} visits</div>`;
        if (this.usageScenario.specialistVisits > 0) details += `<div>Specialist: ${this.usageScenario.specialistVisits} visits</div>`;
        if (this.usageScenario.urgentCareVisits > 0) details += `<div>Urgent Care: ${this.usageScenario.urgentCareVisits} visits</div>`;
        if (this.usageScenario.emergencyRoomVisits > 0) details += `<div>Emergency Room: ${this.usageScenario.emergencyRoomVisits} visits</div>`;
        if (this.usageScenario.inpatientDays > 0) details += `<div>Inpatient: ${this.usageScenario.inpatientDays} days</div>`;
        if (this.usageScenario.outpatientVisits > 0) details += `<div>Outpatient: ${this.usageScenario.outpatientVisits} visits</div>`;
        if (this.usageScenario.basicImagingVisits > 0) details += `<div>Basic Imaging: ${this.usageScenario.basicImagingVisits} visits</div>`;
        if (this.usageScenario.advancedImagingVisits > 0) details += `<div>Advanced Imaging: ${this.usageScenario.advancedImagingVisits} visits</div>`;
        if (this.usageScenario.labTests > 0) details += `<div>Lab Tests: ${this.usageScenario.labTests} tests</div>`;
        if (this.usageScenario.ambulatoryProcedures > 0) details += `<div>Ambulatory Procedures: ${this.usageScenario.ambulatoryProcedures} procedures</div>`;
        return details || '<div>No medical services specified</div>';
    }
    
    getDrugDetails() {
        if (this.prescriptionDrugs.length === 0) {
            return '<div>No prescription drugs specified</div>';
        }
        
        let details = '';
        this.prescriptionDrugs.forEach(drug => {
            const frequencyText = this.getFrequencyText(drug.frequency);
            details += `<div class="drug-item">${drug.drugType} - ${drug.tier} (${drug.quantity} ${frequencyText})</div>`;
        });
        return details;
    }
    
    exportToExcel() {
        if (this.comparisonResults.length === 0) {
            alert('Please run a comparison first before exporting to Excel.');
            return;
        }
        
        try {
            // Create CSV content
            let csvContent = 'Plan Name,Deductible,OOP Max,Annual Premium,Basic Medical,Major Medical,Drug Costs,Medical Bills,Out-of-Pocket Costs,Total Annual Cost\n';
            
            this.comparisonResults.forEach(result => {
                csvContent += `"${result.plan.name}",${result.plan.annualDeductible},${result.plan.annualOOPMax},${result.plan.premium},${result.basicMedicalCosts},${result.majorMedicalCosts},${result.prescriptionCosts},${result.medicalBillsCosts},${result.totalOOP},${result.totalCost}\n`;
            });
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `health_plan_comparison_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('Error generating Excel file. Please try again.');
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