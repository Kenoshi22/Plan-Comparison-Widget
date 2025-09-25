// Health Plan Comparison Widget JavaScript

(function() {
    'use strict';
    
    // Sample health plan data
    const samplePlans = [
        {
            id: 'plan-1',
            name: 'Blue Cross Blue Shield Gold',
            type: 'Gold',
            premium: 450,
            deductible: { individual: 1500, family: 3000 },
            outOfPocketMax: { individual: 6000, family: 12000 },
            coinsurance: 20,
            subsidy: 0,
            benefits: {
                primaryCare: { copay: 25, visits: 'unlimited' },
                specialist: { copay: 50, visits: 'unlimited' },
                urgentCare: { copay: 75, visits: 'unlimited' },
                emergencyRoom: { copay: 300, visits: 'unlimited' },
                hospitalInpatient: { coinsurance: 20, days: 'unlimited' },
                hospitalOutpatient: { coinsurance: 20, visits: 'unlimited' },
                imaging: { coinsurance: 20, visits: 'unlimited' },
                virtualCare: { copay: 0, visits: 'unlimited' },
                prescriptions: {
                    tier1: { copay: 10, generic: true },
                    tier2: { copay: 30, generic: false },
                    tier3: { copay: 60, generic: false }
                }
            }
        },
        {
            id: 'plan-2',
            name: 'Aetna Silver Plus',
            type: 'Silver',
            premium: 320,
            deductible: { individual: 2500, family: 5000 },
            outOfPocketMax: { individual: 8000, family: 16000 },
            coinsurance: 30,
            subsidy: 150,
            benefits: {
                primaryCare: { copay: 30, visits: 'unlimited' },
                specialist: { copay: 60, visits: 'unlimited' },
                urgentCare: { copay: 100, visits: 'unlimited' },
                emergencyRoom: { copay: 400, visits: 'unlimited' },
                hospitalInpatient: { coinsurance: 30, days: 'unlimited' },
                hospitalOutpatient: { coinsurance: 30, visits: 'unlimited' },
                imaging: { coinsurance: 30, visits: 'unlimited' },
                virtualCare: { copay: 15, visits: 'unlimited' },
                prescriptions: {
                    tier1: { copay: 15, generic: true },
                    tier2: { copay: 40, generic: false },
                    tier3: { copay: 80, generic: false }
                }
            }
        },
        {
            id: 'plan-3',
            name: 'Cigna Bronze Basic',
            type: 'Bronze',
            premium: 280,
            deductible: { individual: 4000, family: 8000 },
            outOfPocketMax: { individual: 9000, family: 18000 },
            coinsurance: 40,
            subsidy: 200,
            benefits: {
                primaryCare: { copay: 40, visits: 'unlimited' },
                specialist: { copay: 80, visits: 'unlimited' },
                urgentCare: { copay: 120, visits: 'unlimited' },
                emergencyRoom: { copay: 500, visits: 'unlimited' },
                hospitalInpatient: { coinsurance: 40, days: 'unlimited' },
                hospitalOutpatient: { coinsurance: 40, visits: 'unlimited' },
                imaging: { coinsurance: 40, visits: 'unlimited' },
                virtualCare: { copay: 25, visits: 'unlimited' },
                prescriptions: {
                    tier1: { copay: 20, generic: true },
                    tier2: { copay: 50, generic: false },
                    tier3: { copay: 100, generic: false }
                }
            }
        },
        {
            id: 'plan-4',
            name: 'UnitedHealthcare Platinum',
            type: 'Platinum',
            premium: 520,
            deductible: { individual: 1000, family: 2000 },
            outOfPocketMax: { individual: 4000, family: 8000 },
            coinsurance: 10,
            subsidy: 0,
            benefits: {
                primaryCare: { copay: 15, visits: 'unlimited' },
                specialist: { copay: 30, visits: 'unlimited' },
                urgentCare: { copay: 50, visits: 'unlimited' },
                emergencyRoom: { copay: 200, visits: 'unlimited' },
                hospitalInpatient: { coinsurance: 10, days: 'unlimited' },
                hospitalOutpatient: { coinsurance: 10, visits: 'unlimited' },
                imaging: { coinsurance: 10, visits: 'unlimited' },
                virtualCare: { copay: 0, visits: 'unlimited' },
                prescriptions: {
                    tier1: { copay: 5, generic: true },
                    tier2: { copay: 20, generic: false },
                    tier3: { copay: 40, generic: false }
                }
            }
        }
    ];

    // Usage scenarios
    const scenarios = {
        basic: {
            name: 'Basic Use',
            description: 'Typical usage for a healthy individual with routine care needs',
            usage: {
                primaryCareVisits: 4, // Quarterly
                specialistVisits: 3,
                urgentCareVisits: 3,
                emergencyRoomVisits: 0,
                hospitalInpatientDays: 0,
                hospitalOutpatientVisits: 0,
                imagingVisits: 2,
                virtualCareVisits: 6,
                prescriptions: {
                    tier1: 12, // Monthly for a year
                    tier2: 6,
                    tier3: 3
                },
                labTests: 4
            }
        },
        worst: {
            name: 'Worst Case',
            description: 'Maximum out-of-pocket scenario with extensive medical needs',
            usage: {
                primaryCareVisits: 12,
                specialistVisits: 20,
                urgentCareVisits: 8,
                emergencyRoomVisits: 2,
                hospitalInpatientDays: 5,
                hospitalOutpatientVisits: 10,
                imagingVisits: 8,
                virtualCareVisits: 15,
                prescriptions: {
                    tier1: 24,
                    tier2: 18,
                    tier3: 12
                },
                labTests: 12
            }
        },
        custom: {
            name: 'Custom Scenario',
            description: 'Define your own usage patterns',
            usage: {
                primaryCareVisits: 0,
                specialistVisits: 0,
                urgentCareVisits: 0,
                emergencyRoomVisits: 0,
                hospitalInpatientDays: 0,
                hospitalOutpatientVisits: 0,
                imagingVisits: 0,
                virtualCareVisits: 0,
                prescriptions: {
                    tier1: 0,
                    tier2: 0,
                    tier3: 0
                },
                labTests: 0
            }
        }
    };

    // Global state
    let selectedPlans = [];
    let currentScenario = 'basic';
    let comparisonResults = [];

    // Initialize widget
    function init() {
        console.log('Health Plan Comparison Widget: Initializing...');
        
        // Initialize Zoho CRM if available
        if (typeof ZOHO !== 'undefined') {
            ZOHO.CRM.init().then(function() {
                console.log('Zoho CRM initialized successfully');
                setupEventListeners();
                loadSamplePlans();
                updateCalculationButton();
            }).catch(function(error) {
                console.log('Zoho CRM init error:', error);
                setupEventListeners();
                loadSamplePlans();
                updateCalculationButton();
            });
        } else {
            console.log('Zoho CRM not available, running in standalone mode');
            setupEventListeners();
            loadSamplePlans();
            updateCalculationButton();
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Plan selection
        document.getElementById('addPlanBtn').addEventListener('click', showPlanModal);
        document.getElementById('loadSamplePlansBtn').addEventListener('click', loadSamplePlans);
        document.getElementById('resetBtn').addEventListener('click', resetAll);
        
        // Scenario tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                switchScenario(this.dataset.scenario);
            });
        });
        
        // Calculate button
        document.getElementById('calculateBtn').addEventListener('click', calculateComparison);
        
        // Export buttons
        document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
        document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
        
        // Modal events
        document.querySelector('.close').addEventListener('click', hidePlanModal);
        document.getElementById('savePlanBtn').addEventListener('click', savePlan);
        document.getElementById('cancelPlanBtn').addEventListener('click', hidePlanModal);
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('planModal');
            if (event.target === modal) {
                hidePlanModal();
            }
        });
    }

    // Load sample plans
    function loadSamplePlans() {
        const planGrid = document.getElementById('planGrid');
        planGrid.innerHTML = '';
        
        samplePlans.forEach(plan => {
            const planCard = createPlanCard(plan);
            planGrid.appendChild(planCard);
        });
        
        loadScenarioContent();
    }

    // Create plan card
    function createPlanCard(plan) {
        const card = document.createElement('div');
        card.className = 'plan-card';
        card.dataset.planId = plan.id;
        
        const netPremium = plan.premium - plan.subsidy;
        
        card.innerHTML = `
            <div class="plan-actions">
                <button onclick="editPlan('${plan.id}')" title="Edit Plan">✏️</button>
                <button onclick="removePlan('${plan.id}')" title="Remove Plan">🗑️</button>
            </div>
            <h3>${plan.name}</h3>
            <div class="plan-type">${plan.type} Plan</div>
            <div class="plan-summary">
                <p><strong>Premium:</strong> $${plan.premium}/month</p>
                <p><strong>After Subsidy:</strong> $${netPremium}/month</p>
                <p><strong>Deductible:</strong> $${plan.deductible.individual} individual / $${plan.deductible.family} family</p>
                <p><strong>Out-of-Pocket Max:</strong> $${plan.outOfPocketMax.individual} individual / $${plan.outOfPocketMax.family} family</p>
                <p><strong>Coinsurance:</strong> ${plan.coinsurance}%</p>
            </div>
        `;
        
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.plan-actions')) {
                togglePlanSelection(plan.id);
            }
        });
        
        return card;
    }

    // Toggle plan selection
    function togglePlanSelection(planId) {
        const card = document.querySelector(`[data-plan-id="${planId}"]`);
        const plan = samplePlans.find(p => p.id === planId);
        
        if (selectedPlans.includes(planId)) {
            selectedPlans = selectedPlans.filter(id => id !== planId);
            card.classList.remove('selected');
        } else {
            if (selectedPlans.length < 6) {
                selectedPlans.push(planId);
                card.classList.add('selected');
            } else {
                showNotification('You can compare up to 6 plans at a time.', 'warning');
            }
        }
        
        updateSelectedPlansSummary();
        updateCalculationButton();
    }

    // Load scenario content
    function loadScenarioContent() {
        const content = document.getElementById('scenarioContent');
        const scenario = scenarios[currentScenario];
        
        content.innerHTML = `
            <div class="scenario-${currentScenario} active">
                <div class="scenario-description">
                    <h4>${scenario.name}</h4>
                    <p>${scenario.description}</p>
                </div>
                ${getScenarioForm(scenario)}
            </div>
        `;
        
        // Add event listeners for custom scenario inputs
        if (currentScenario === 'custom') {
            addCustomScenarioListeners();
        }
    }

    // Get scenario form
    function getScenarioForm(scenario) {
        if (currentScenario === 'custom') {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label>Primary Care Visits (per year)</label>
                        <input type="number" id="primaryCareVisits" value="${scenario.usage.primaryCareVisits}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Specialist Visits (per year)</label>
                        <input type="number" id="specialistVisits" value="${scenario.usage.specialistVisits}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Urgent Care Visits (per year)</label>
                        <input type="number" id="urgentCareVisits" value="${scenario.usage.urgentCareVisits}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Emergency Room Visits (per year)</label>
                        <input type="number" id="emergencyRoomVisits" value="${scenario.usage.emergencyRoomVisits}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Hospital Inpatient Days (per year)</label>
                        <input type="number" id="hospitalInpatientDays" value="${scenario.usage.hospitalInpatientDays}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Hospital Outpatient Visits (per year)</label>
                        <input type="number" id="hospitalOutpatientVisits" value="${scenario.usage.hospitalOutpatientVisits}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Imaging Visits (per year)</label>
                        <input type="number" id="imagingVisits" value="${scenario.usage.imagingVisits}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Virtual Care Visits (per year)</label>
                        <input type="number" id="virtualCareVisits" value="${scenario.usage.virtualCareVisits}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tier 1 Prescriptions (per year)</label>
                        <input type="number" id="tier1Prescriptions" value="${scenario.usage.prescriptions.tier1}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Tier 2 Prescriptions (per year)</label>
                        <input type="number" id="tier2Prescriptions" value="${scenario.usage.prescriptions.tier2}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tier 3 Prescriptions (per year)</label>
                        <input type="number" id="tier3Prescriptions" value="${scenario.usage.prescriptions.tier3}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Lab Tests (per year)</label>
                        <input type="number" id="labTests" value="${scenario.usage.labTests}" min="0">
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="scenario-usage">
                    <h4>Included in this scenario:</h4>
                    <ul>
                        <li>Primary Care Visits: ${scenario.usage.primaryCareVisits} per year</li>
                        <li>Specialist Visits: ${scenario.usage.specialistVisits} per year</li>
                        <li>Urgent Care Visits: ${scenario.usage.urgentCareVisits} per year</li>
                        <li>Emergency Room Visits: ${scenario.usage.emergencyRoomVisits} per year</li>
                        <li>Hospital Inpatient Days: ${scenario.usage.hospitalInpatientDays} per year</li>
                        <li>Hospital Outpatient Visits: ${scenario.usage.hospitalOutpatientVisits} per year</li>
                        <li>Imaging Visits: ${scenario.usage.imagingVisits} per year</li>
                        <li>Virtual Care Visits: ${scenario.usage.virtualCareVisits} per year</li>
                        <li>Prescriptions: Tier 1 (${scenario.usage.prescriptions.tier1}), Tier 2 (${scenario.usage.prescriptions.tier2}), Tier 3 (${scenario.usage.prescriptions.tier3})</li>
                        <li>Lab Tests: ${scenario.usage.labTests} per year</li>
                    </ul>
                </div>
            `;
        }
    }

    // Add custom scenario listeners
    function addCustomScenarioListeners() {
        const inputs = document.querySelectorAll('#scenarioContent input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                updateCustomScenario();
            });
        });
    }

    // Update custom scenario
    function updateCustomScenario() {
        scenarios.custom.usage = {
            primaryCareVisits: parseInt(document.getElementById('primaryCareVisits').value) || 0,
            specialistVisits: parseInt(document.getElementById('specialistVisits').value) || 0,
            urgentCareVisits: parseInt(document.getElementById('urgentCareVisits').value) || 0,
            emergencyRoomVisits: parseInt(document.getElementById('emergencyRoomVisits').value) || 0,
            hospitalInpatientDays: parseInt(document.getElementById('hospitalInpatientDays').value) || 0,
            hospitalOutpatientVisits: parseInt(document.getElementById('hospitalOutpatientVisits').value) || 0,
            imagingVisits: parseInt(document.getElementById('imagingVisits').value) || 0,
            virtualCareVisits: parseInt(document.getElementById('virtualCareVisits').value) || 0,
            prescriptions: {
                tier1: parseInt(document.getElementById('tier1Prescriptions').value) || 0,
                tier2: parseInt(document.getElementById('tier2Prescriptions').value) || 0,
                tier3: parseInt(document.getElementById('tier3Prescriptions').value) || 0
            },
            labTests: parseInt(document.getElementById('labTests').value) || 0
        };
    }

    // Switch scenario
    function switchScenario(scenario) {
        currentScenario = scenario;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-scenario="${scenario}"]`).classList.add('active');
        
        // Load scenario content
        loadScenarioContent();
    }

    // Calculate comparison
    function calculateComparison() {
        if (selectedPlans.length === 0) {
            alert('Please select at least one plan to compare.');
            return;
        }
        
        showLoading();
        
        setTimeout(() => {
            const usage = currentScenario === 'custom' ? scenarios.custom.usage : scenarios[currentScenario].usage;
            comparisonResults = [];
            
            selectedPlans.forEach(planId => {
                const plan = samplePlans.find(p => p.id === planId);
                const result = calculatePlanCosts(plan, usage);
                comparisonResults.push(result);
            });
            
            // Sort by total cost
            comparisonResults.sort((a, b) => a.totalCost - b.totalCost);
            
            displayResults();
            hideLoading();
        }, 1000);
    }

    // Calculate plan costs
    function calculatePlanCosts(plan, usage) {
        const netPremium = plan.premium - plan.subsidy;
        const annualPremium = netPremium * 12;
        
        let totalBenefitsCost = 0;
        let deductibleUsed = 0;
        let outOfPocketUsed = 0;
        
        // Calculate primary care costs
        const primaryCareCost = usage.primaryCareVisits * plan.benefits.primaryCare.copay;
        totalBenefitsCost += primaryCareCost;
        deductibleUsed += primaryCareCost;
        
        // Calculate specialist costs
        const specialistCost = usage.specialistVisits * plan.benefits.specialist.copay;
        totalBenefitsCost += specialistCost;
        deductibleUsed += specialistCost;
        
        // Calculate urgent care costs
        const urgentCareCost = usage.urgentCareVisits * plan.benefits.urgentCare.copay;
        totalBenefitsCost += urgentCareCost;
        deductibleUsed += urgentCareCost;
        
        // Calculate emergency room costs
        const emergencyRoomCost = usage.emergencyRoomVisits * plan.benefits.emergencyRoom.copay;
        totalBenefitsCost += emergencyRoomCost;
        deductibleUsed += emergencyRoomCost;
        
        // Calculate virtual care costs
        const virtualCareCost = usage.virtualCareVisits * plan.benefits.virtualCare.copay;
        totalBenefitsCost += virtualCareCost;
        deductibleUsed += virtualCareCost;
        
        // Calculate prescription costs
        const prescriptionCost = 
            (usage.prescriptions.tier1 * plan.benefits.prescriptions.tier1.copay) +
            (usage.prescriptions.tier2 * plan.benefits.prescriptions.tier2.copay) +
            (usage.prescriptions.tier3 * plan.benefits.prescriptions.tier3.copay);
        totalBenefitsCost += prescriptionCost;
        deductibleUsed += prescriptionCost;
        
        // Calculate lab test costs (assuming $100 per test, subject to deductible)
        const labTestCost = usage.labTests * 100;
        totalBenefitsCost += labTestCost;
        deductibleUsed += labTestCost;
        
        // Calculate hospital costs (simplified)
        const hospitalInpatientCost = usage.hospitalInpatientDays * 2000; // $2000 per day
        const hospitalOutpatientCost = usage.hospitalOutpatientVisits * 500; // $500 per visit
        const imagingCost = usage.imagingVisits * 800; // $800 per imaging visit
        
        const hospitalCosts = hospitalInpatientCost + hospitalOutpatientCost + imagingCost;
        
        // Apply deductible and coinsurance
        let remainingDeductible = Math.max(0, plan.deductible.individual - deductibleUsed);
        let coinsuranceAmount = 0;
        
        if (hospitalCosts > remainingDeductible) {
            const amountOverDeductible = hospitalCosts - remainingDeductible;
            coinsuranceAmount = amountOverDeductible * (plan.coinsurance / 100);
        }
        
        const totalHospitalCost = Math.min(hospitalCosts, plan.deductible.individual) + coinsuranceAmount;
        totalBenefitsCost += totalHospitalCost;
        
        // Calculate out-of-pocket maximum
        const totalOutOfPocket = totalBenefitsCost;
        const finalOutOfPocket = Math.min(totalOutOfPocket, plan.outOfPocketMax.individual);
        
        const totalCost = annualPremium + finalOutOfPocket;
        
        return {
            plan: plan,
            annualPremium: annualPremium,
            benefitsCost: finalOutOfPocket,
            totalCost: totalCost,
            deductibleUsed: Math.min(deductibleUsed, plan.deductible.individual),
            coinsurancePaid: coinsuranceAmount,
            outOfPocketUsed: finalOutOfPocket,
            breakdown: {
                primaryCare: primaryCareCost,
                specialist: specialistCost,
                urgentCare: urgentCareCost,
                emergencyRoom: emergencyRoomCost,
                virtualCare: virtualCareCost,
                prescriptions: prescriptionCost,
                labTests: labTestCost,
                hospital: totalHospitalCost
            }
        };
    }

    // Display results
    function displayResults() {
        const container = document.getElementById('resultsContainer');
        const summaryCards = document.getElementById('summaryCards');
        
        if (comparisonResults.length === 0) {
            container.innerHTML = '<div class="no-results"><p>No results to display</p></div>';
            summaryCards.style.display = 'none';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create header
        const header = document.createElement('thead');
        header.innerHTML = `
            <tr>
                <th>Plan Name</th>
                <th>Annual Premium</th>
                <th>Benefits Cost</th>
                <th>Total Cost</th>
                <th>Deductible Used</th>
                <th>Out-of-Pocket Used</th>
                <th>Savings vs. Highest</th>
            </tr>
        `;
        table.appendChild(header);
        
        // Create body
        const body = document.createElement('tbody');
        const highestCost = Math.max(...comparisonResults.map(r => r.totalCost));
        
        comparisonResults.forEach((result, index) => {
            const row = document.createElement('tr');
            const savings = highestCost - result.totalCost;
            const savingsPercent = ((savings / highestCost) * 100).toFixed(1);
            
            row.innerHTML = `
                <td class="plan-name">${result.plan.name}</td>
                <td class="cost-value">$${result.annualPremium.toLocaleString()}</td>
                <td class="cost-value">$${result.benefitsCost.toLocaleString()}</td>
                <td class="cost-value ${index === 0 ? 'low' : index === comparisonResults.length - 1 ? 'high' : 'medium'}">$${result.totalCost.toLocaleString()}</td>
                <td>$${result.deductibleUsed.toLocaleString()}</td>
                <td>$${result.outOfPocketUsed.toLocaleString()}</td>
                <td class="cost-value ${savings > 0 ? 'low' : ''}">$${savings.toLocaleString()} (${savingsPercent}%)</td>
            `;
            body.appendChild(row);
        });
        
        table.appendChild(body);
        container.innerHTML = '';
        container.appendChild(table);
        
        // Update summary cards
        updateSummaryCards();
        
        // Enable export buttons
        document.getElementById('exportPdfBtn').disabled = false;
        document.getElementById('exportExcelBtn').disabled = false;
    }
    
    // Update summary cards
    function updateSummaryCards() {
        const summaryCards = document.getElementById('summaryCards');
        summaryCards.style.display = 'grid';
        
        // Find best value plan (lowest total cost)
        const bestValue = comparisonResults[0]; // Already sorted by total cost
        document.getElementById('bestValuePlan').textContent = bestValue.plan.name;
        document.getElementById('bestValueCost').textContent = `$${bestValue.totalCost.toLocaleString()}`;
        
        // Find lowest premium plan
        const lowestPremium = comparisonResults.reduce((min, current) => 
            current.annualPremium < min.annualPremium ? current : min
        );
        document.getElementById('lowestPremiumPlan').textContent = lowestPremium.plan.name;
        document.getElementById('lowestPremiumCost').textContent = `$${lowestPremium.annualPremium.toLocaleString()}`;
        
        // Find lowest out-of-pocket plan
        const lowestOOP = comparisonResults.reduce((min, current) => 
            current.outOfPocketUsed < min.outOfPocketUsed ? current : min
        );
        document.getElementById('lowestOOPPlan').textContent = lowestOOP.plan.name;
        document.getElementById('lowestOOPCost').textContent = `$${lowestOOP.outOfPocketUsed.toLocaleString()}`;
    }

    // Show loading
    function showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    // Hide loading
    function hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    // Show plan modal
    function showPlanModal() {
        document.getElementById('planModal').style.display = 'block';
        loadPlanForm();
    }

    // Hide plan modal
    function hidePlanModal() {
        document.getElementById('planModal').style.display = 'none';
    }

    // Load plan form
    function loadPlanForm() {
        const body = document.getElementById('planModalBody');
        body.innerHTML = `
            <div class="form-section">
                <h4>Basic Plan Information</h4>
                <div class="form-group">
                    <label>Plan Name *</label>
                    <input type="text" id="planName" placeholder="Enter plan name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Plan Type</label>
                        <select id="planType">
                            <option value="Bronze">Bronze</option>
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Monthly Premium ($)</label>
                        <input type="number" id="planPremium" min="0" step="0.01" placeholder="0.00">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>Deductibles & Out-of-Pocket Maximums</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Individual Deductible ($)</label>
                        <input type="number" id="individualDeductible" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Family Deductible ($)</label>
                        <input type="number" id="familyDeductible" min="0" placeholder="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Individual Out-of-Pocket Max ($)</label>
                        <input type="number" id="individualOOP" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Family Out-of-Pocket Max ($)</label>
                        <input type="number" id="familyOOP" min="0" placeholder="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Coinsurance (%)</label>
                        <input type="number" id="coinsurance" min="0" max="100" step="0.1" placeholder="20">
                    </div>
                    <div class="form-group">
                        <label>Subsidy ($/month)</label>
                        <input type="number" id="subsidy" min="0" step="0.01" placeholder="0.00">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>Copays & Benefits</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Primary Care Visit Copay ($)</label>
                        <input type="number" id="primaryCareCopay" min="0" step="0.01" placeholder="25">
                    </div>
                    <div class="form-group">
                        <label>Specialist Visit Copay ($)</label>
                        <input type="number" id="specialistCopay" min="0" step="0.01" placeholder="50">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Urgent Care Copay ($)</label>
                        <input type="number" id="urgentCareCopay" min="0" step="0.01" placeholder="75">
                    </div>
                    <div class="form-group">
                        <label>Emergency Room Copay ($)</label>
                        <input type="number" id="emergencyRoomCopay" min="0" step="0.01" placeholder="300">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Virtual Care Copay ($)</label>
                        <input type="number" id="virtualCareCopay" min="0" step="0.01" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Hospital Inpatient Daily Rate ($)</label>
                        <input type="number" id="hospitalInpatientRate" min="0" step="0.01" placeholder="2000">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>Prescription Drug Benefits</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tier 1 (Generic) Copay ($)</label>
                        <input type="number" id="tier1Copay" min="0" step="0.01" placeholder="10">
                    </div>
                    <div class="form-group">
                        <label>Tier 2 (Preferred Brand) Copay ($)</label>
                        <input type="number" id="tier2Copay" min="0" step="0.01" placeholder="30">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tier 3 (Non-Preferred Brand) Copay ($)</label>
                        <input type="number" id="tier3Copay" min="0" step="0.01" placeholder="60">
                    </div>
                    <div class="form-group">
                        <label>Specialty Drugs Copay ($)</label>
                        <input type="number" id="specialtyCopay" min="0" step="0.01" placeholder="100">
                    </div>
                </div>
            </div>
        `;
    }

    // Save plan
    function savePlan() {
        const name = document.getElementById('planName').value;
        const type = document.getElementById('planType').value;
        const premium = parseFloat(document.getElementById('planPremium').value) || 0;
        const individualDeductible = parseInt(document.getElementById('individualDeductible').value) || 0;
        const familyDeductible = parseInt(document.getElementById('familyDeductible').value) || 0;
        const individualOOP = parseInt(document.getElementById('individualOOP').value) || 0;
        const familyOOP = parseInt(document.getElementById('familyOOP').value) || 0;
        const coinsurance = parseFloat(document.getElementById('coinsurance').value) || 0;
        const subsidy = parseFloat(document.getElementById('subsidy').value) || 0;
        
        // Get copay values
        const primaryCareCopay = parseFloat(document.getElementById('primaryCareCopay').value) || 25;
        const specialistCopay = parseFloat(document.getElementById('specialistCopay').value) || 50;
        const urgentCareCopay = parseFloat(document.getElementById('urgentCareCopay').value) || 75;
        const emergencyRoomCopay = parseFloat(document.getElementById('emergencyRoomCopay').value) || 300;
        const virtualCareCopay = parseFloat(document.getElementById('virtualCareCopay').value) || 0;
        const hospitalInpatientRate = parseFloat(document.getElementById('hospitalInpatientRate').value) || 2000;
        const tier1Copay = parseFloat(document.getElementById('tier1Copay').value) || 10;
        const tier2Copay = parseFloat(document.getElementById('tier2Copay').value) || 30;
        const tier3Copay = parseFloat(document.getElementById('tier3Copay').value) || 60;
        const specialtyCopay = parseFloat(document.getElementById('specialtyCopay').value) || 100;
        
        if (!name.trim()) {
            showNotification('Please enter a plan name.', 'warning');
            return;
        }
        
        const newPlan = {
            id: 'plan-' + Date.now(),
            name: name.trim(),
            type: type,
            premium: premium,
            deductible: { individual: individualDeductible, family: familyDeductible },
            outOfPocketMax: { individual: individualOOP, family: familyOOP },
            coinsurance: coinsurance,
            subsidy: subsidy,
            benefits: {
                primaryCare: { copay: primaryCareCopay, visits: 'unlimited' },
                specialist: { copay: specialistCopay, visits: 'unlimited' },
                urgentCare: { copay: urgentCareCopay, visits: 'unlimited' },
                emergencyRoom: { copay: emergencyRoomCopay, visits: 'unlimited' },
                hospitalInpatient: { coinsurance: coinsurance, days: 'unlimited', dailyRate: hospitalInpatientRate },
                hospitalOutpatient: { coinsurance: coinsurance, visits: 'unlimited' },
                imaging: { coinsurance: coinsurance, visits: 'unlimited' },
                virtualCare: { copay: virtualCareCopay, visits: 'unlimited' },
                prescriptions: {
                    tier1: { copay: tier1Copay, generic: true },
                    tier2: { copay: tier2Copay, generic: false },
                    tier3: { copay: tier3Copay, generic: false },
                    specialty: { copay: specialtyCopay, generic: false }
                }
            }
        };
        
        samplePlans.push(newPlan);
        loadSamplePlans();
        hidePlanModal();
        showNotification(`Plan "${name}" has been added successfully!`, 'success');
    }

    // Edit plan
    function editPlan(planId) {
        const plan = samplePlans.find(p => p.id === planId);
        if (!plan) return;
        
        showPlanModal();
        
        // Populate form with existing data
        setTimeout(() => {
            document.getElementById('planName').value = plan.name;
            document.getElementById('planType').value = plan.type;
            document.getElementById('planPremium').value = plan.premium;
            document.getElementById('individualDeductible').value = plan.deductible.individual;
            document.getElementById('familyDeductible').value = plan.deductible.family;
            document.getElementById('individualOOP').value = plan.outOfPocketMax.individual;
            document.getElementById('familyOOP').value = plan.outOfPocketMax.family;
            document.getElementById('coinsurance').value = plan.coinsurance;
            document.getElementById('subsidy').value = plan.subsidy;
        }, 100);
    }

    // Remove plan
    function removePlan(planId) {
        if (confirm('Are you sure you want to remove this plan?')) {
            samplePlans = samplePlans.filter(p => p.id !== planId);
            selectedPlans = selectedPlans.filter(id => id !== planId);
            loadSamplePlans();
        }
    }

    // Export to PDF
    function exportToPDF() {
        if (comparisonResults.length === 0) {
            alert('Please calculate comparison results first.');
            return;
        }
        
        // Simple PDF generation using browser print
        const printWindow = window.open('', '_blank');
        const content = generateExportContent('PDF');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Health Plan Comparison Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .scenario { margin: 20px 0; padding: 15px; background: #f9f9f9; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    // Export to Excel
    function exportToExcel() {
        if (comparisonResults.length === 0) {
            alert('Please calculate comparison results first.');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Plan Name,Annual Premium,Benefits Cost,Total Cost,Deductible Used,Out-of-Pocket Used,Savings\n';
        
        const highestCost = Math.max(...comparisonResults.map(r => r.totalCost));
        
        comparisonResults.forEach(result => {
            const savings = highestCost - result.totalCost;
            csvContent += `"${result.plan.name}",${result.annualPremium},${result.benefitsCost},${result.totalCost},${result.deductibleUsed},${result.outOfPocketUsed},${savings}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'health_plan_comparison.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Generate export content
    function generateExportContent(format) {
        const scenario = scenarios[currentScenario];
        const date = new Date().toLocaleDateString();
        
        let content = `
            <div class="header">
                <h1>Health Plan Comparison Report</h1>
                <p>Generated on ${date}</p>
                <p>Scenario: ${scenario.name}</p>
            </div>
            
            <div class="scenario">
                <h3>Usage Scenario</h3>
                <p>${scenario.description}</p>
                <ul>
                    <li>Primary Care Visits: ${scenario.usage.primaryCareVisits} per year</li>
                    <li>Specialist Visits: ${scenario.usage.specialistVisits} per year</li>
                    <li>Urgent Care Visits: ${scenario.usage.urgentCareVisits} per year</li>
                    <li>Emergency Room Visits: ${scenario.usage.emergencyRoomVisits} per year</li>
                    <li>Hospital Inpatient Days: ${scenario.usage.hospitalInpatientDays} per year</li>
                    <li>Hospital Outpatient Visits: ${scenario.usage.hospitalOutpatientVisits} per year</li>
                    <li>Imaging Visits: ${scenario.usage.imagingVisits} per year</li>
                    <li>Virtual Care Visits: ${scenario.usage.virtualCareVisits} per year</li>
                    <li>Prescriptions: Tier 1 (${scenario.usage.prescriptions.tier1}), Tier 2 (${scenario.usage.prescriptions.tier2}), Tier 3 (${scenario.usage.prescriptions.tier3})</li>
                    <li>Lab Tests: ${scenario.usage.labTests} per year</li>
                </ul>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Plan Name</th>
                        <th>Annual Premium</th>
                        <th>Benefits Cost</th>
                        <th>Total Cost</th>
                        <th>Deductible Used</th>
                        <th>Out-of-Pocket Used</th>
                        <th>Savings vs. Highest</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        const highestCost = Math.max(...comparisonResults.map(r => r.totalCost));
        
        comparisonResults.forEach(result => {
            const savings = highestCost - result.totalCost;
            const savingsPercent = ((savings / highestCost) * 100).toFixed(1);
            
            content += `
                <tr>
                    <td>${result.plan.name}</td>
                    <td>$${result.annualPremium.toLocaleString()}</td>
                    <td>$${result.benefitsCost.toLocaleString()}</td>
                    <td>$${result.totalCost.toLocaleString()}</td>
                    <td>$${result.deductibleUsed.toLocaleString()}</td>
                    <td>$${result.outOfPocketUsed.toLocaleString()}</td>
                    <td>$${savings.toLocaleString()} (${savingsPercent}%)</td>
                </tr>
            `;
        });
        
        content += `
                </tbody>
            </table>
        `;
        
        return content;
    }

    // Update selected plans summary
    function updateSelectedPlansSummary() {
        const summary = document.getElementById('selectedPlansSummary');
        const count = document.getElementById('selectedCount');
        const list = document.getElementById('selectedPlansList');
        
        if (selectedPlans.length === 0) {
            summary.style.display = 'none';
            return;
        }
        
        summary.style.display = 'block';
        count.textContent = selectedPlans.length;
        
        list.innerHTML = '';
        selectedPlans.forEach(planId => {
            const plan = samplePlans.find(p => p.id === planId);
            if (plan) {
                const chip = document.createElement('div');
                chip.className = 'selected-plan-chip';
                chip.innerHTML = `
                    ${plan.name}
                    <span class="remove-chip" onclick="removeSelectedPlan('${planId}')">×</span>
                `;
                list.appendChild(chip);
            }
        });
    }
    
    // Remove selected plan
    function removeSelectedPlan(planId) {
        const card = document.querySelector(`[data-plan-id="${planId}"]`);
        if (card) {
            card.classList.remove('selected');
        }
        selectedPlans = selectedPlans.filter(id => id !== planId);
        updateSelectedPlansSummary();
        updateCalculationButton();
    }
    
    // Update calculation button state
    function updateCalculationButton() {
        const btn = document.getElementById('calculateBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        
        if (selectedPlans.length === 0) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-icon">📊</span>Select Plans to Compare';
            exportPdfBtn.disabled = true;
            exportExcelBtn.disabled = true;
        } else {
            btn.disabled = false;
            btn.innerHTML = `<span class="btn-icon">📊</span>Calculate Comparison (${selectedPlans.length} plans)`;
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Reset all data
    function resetAll() {
        if (confirm('Are you sure you want to reset all data? This will clear all selected plans and results.')) {
            selectedPlans = [];
            comparisonResults = [];
            currentScenario = 'basic';
            
            // Reset UI
            document.querySelectorAll('.plan-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-scenario="basic"]').classList.add('active');
            
            updateSelectedPlansSummary();
            updateCalculationButton();
            loadScenarioContent();
            
            // Reset results
            const container = document.getElementById('resultsContainer');
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">📊</div>
                    <h3>No Comparison Results</h3>
                    <p>Select at least one plan and click "Calculate Comparison" to see detailed cost analysis</p>
                </div>
            `;
            
            document.getElementById('summaryCards').style.display = 'none';
            
            showNotification('All data has been reset.', 'success');
        }
    }
    
    // Global functions for external access
    window.editPlan = editPlan;
    window.removePlan = removePlan;
    window.removeSelectedPlan = removeSelectedPlan;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
