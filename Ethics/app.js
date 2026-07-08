/**
 * Ethical Risk Assessment Framework - Browser Version
 * Pure JavaScript implementation running entirely in the browser
 */

// ============ DATA STORAGE ============
let appData = {
    tools: [],
    initialized: false,
    trainedModel: null
};

// ============ TRAINED MODEL CLASS ============
class TrainedRiskModel {
    constructor() {
        this.isTrained = false;
        this.trainingData = [];
        this.modelParameters = {};
        this.accuracy = 0;
        this.featureImportance = {};
    }

    // Train the model using statistical analysis
    train(data) {
        console.log('🧠 Training AI Risk Assessment Model...');
        this.trainingData = data;

        // Calculate statistical patterns
        this.calculateFeatureImportance();
        this.calculateRiskPatterns();
        this.calculatePredictionAccuracy();

        this.isTrained = true;
        console.log('✅ Model trained successfully!');
        console.log(`📊 Training accuracy: ${(this.accuracy * 100).toFixed(1)}%`);
        return this;
    }

    calculateFeatureImportance() {
        const features = ['bias_risk', 'privacy_risk', 'transparency_risk', 'transparency_level', 'human_oversight', 'uses_sensitive_data', 'personal_data'];
        const correlations = {};

        features.forEach(feature => {
            const correlation = this.calculateCorrelation(feature, 'overall_risk_score');
            correlations[feature] = Math.abs(correlation);
        });

        // Sort by importance
        const sorted = Object.entries(correlations).sort(([,a], [,b]) => b - a);
        this.featureImportance = Object.fromEntries(sorted);
    }

    calculateCorrelation(feature, target) {
        const n = this.trainingData.length;
        const sumX = this.trainingData.reduce((sum, item) => sum + item[feature], 0);
        const sumY = this.trainingData.reduce((sum, item) => sum + item[target], 0);
        const sumXY = this.trainingData.reduce((sum, item) => sum + (item[feature] * item[target]), 0);
        const sumX2 = this.trainingData.reduce((sum, item) => sum + (item[feature] ** 2), 0);
        const sumY2 = this.trainingData.reduce((sum, item) => sum + (item[target] ** 2), 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateRiskPatterns() {
        // Calculate average risk scores by domain
        const domainStats = {};
        this.trainingData.forEach(tool => {
            if (!domainStats[tool.domain]) {
                domainStats[tool.domain] = { total: 0, count: 0, tools: [] };
            }
            domainStats[tool.domain].total += tool.overall_risk_score;
            domainStats[tool.domain].count += 1;
            domainStats[tool.domain].tools.push(tool.ai_name);
        });

        this.modelParameters.domainAverages = {};
        Object.keys(domainStats).forEach(domain => {
            this.modelParameters.domainAverages[domain] = domainStats[domain].total / domainStats[domain].count;
        });

        // Calculate company risk patterns
        const companyStats = {};
        this.trainingData.forEach(tool => {
            if (!companyStats[tool.company]) {
                companyStats[tool.company] = { total: 0, count: 0 };
            }
            companyStats[tool.company].total += tool.overall_risk_score;
            companyStats[tool.company].count += 1;
        });

        this.modelParameters.companyAverages = {};
        Object.keys(companyStats).forEach(company => {
            this.modelParameters.companyAverages[company] = companyStats[company].total / companyStats[company].count;
        });
    }

    calculatePredictionAccuracy() {
        let correct = 0;
        const predictions = [];

        this.trainingData.forEach(tool => {
            const predicted = this.predictRiskScore(tool);
            const actual = tool.overall_risk_score;
            const predictedLevel = this.getRiskLevel(predicted);
            const actualLevel = this.getRiskLevel(actual);

            if (predictedLevel === actualLevel) correct++;

            predictions.push({
                tool: tool.ai_name,
                predicted: predicted,
                actual: actual,
                predictedLevel: predictedLevel,
                actualLevel: actualLevel,
                accuracy: Math.abs(predicted - actual) < 10 ? 'good' : 'poor'
            });
        });

        this.accuracy = correct / this.trainingData.length;
        this.predictionHistory = predictions;
    }

    predictRiskScore(tool) {
        // Simple linear prediction based on trained patterns
        let baseScore = 50; // Start with medium risk

        // Adjust based on domain average
        if (this.modelParameters.domainAverages && this.modelParameters.domainAverages[tool.domain]) {
            baseScore = this.modelParameters.domainAverages[tool.domain];
        }

        // Adjust based on company history
        if (this.modelParameters.companyAverages && this.modelParameters.companyAverages[tool.company]) {
            const companyAvg = this.modelParameters.companyAverages[tool.company];
            baseScore = (baseScore + companyAvg) / 2; // Average with domain
        }

        // Adjust based on feature importance
        const featureWeights = {
            bias_risk: 0.25,
            privacy_risk: 0.25,
            transparency_risk: 0.20,
            uses_sensitive_data: 0.15,
            personal_data: 0.10,
            transparency_level: -0.05, // Negative because higher transparency = lower risk
            human_oversight: -0.05
        };

        Object.keys(featureWeights).forEach(feature => {
            if (tool[feature] !== undefined) {
                const weight = featureWeights[feature];
                const value = tool[feature];
                baseScore += weight * value * 10; // Scale adjustment
            }
        });

        return Math.max(0, Math.min(100, baseScore));
    }

    getRiskLevel(score) {
        if (score >= 70) return 'CRITICAL';
        if (score >= 50) return 'HIGH';
        if (score >= 30) return 'MEDIUM';
        return 'LOW';
    }

    getModelInsights() {
        return {
            isTrained: this.isTrained,
            accuracy: this.accuracy,
            featureImportance: this.featureImportance,
            domainPatterns: this.modelParameters.domainAverages,
            companyPatterns: this.modelParameters.companyAverages,
            trainingSize: this.trainingData.length
        };
    }

    predictNewTool(toolData) {
        if (!this.isTrained) return null;

        const predictedScore = this.predictRiskScore(toolData);
        const riskLevel = this.getRiskLevel(predictedScore);

        return {
            predicted_score: Math.round(predictedScore * 100) / 100,
            risk_level: riskLevel,
            confidence: this.accuracy,
            based_on: {
                domain_average: this.modelParameters.domainAverages?.[toolData.domain],
                company_average: this.modelParameters.companyAverages?.[toolData.company]
            }
        };
    }
}

// ============ RISK SCORING ENGINE ============
class RiskScoringEngine {
    constructor() {
        this.riskWeights = {
            'bias_risk': 0.30,
            'privacy_risk': 0.30,
            'transparency_risk': 0.20,
            'data_sensitivity': 0.15,
            'governance_deficit': 0.05
        };
    }

    calculateComponentScores(row) {
        const biasScore = (row.bias_risk / 3.0) * 100;
        const privacyScore = (row.privacy_risk / 3.0) * 100;
        const transparencyScore = (row.transparency_risk / 3.0) * 100;
        
        const dataSensitivity = (
            (row.uses_sensitive_data || 0) * 50 + 
            (row.personal_data || 0) * 50
        );

        const maxGovernance = 6;
        const actualGovernance = (row.transparency_level || 0) + (row.human_oversight || 0);
        const governanceDeficit = ((maxGovernance - actualGovernance) / maxGovernance) * 100;

        return {
            bias_score: biasScore,
            privacy_score: privacyScore,
            transparency_score: transparencyScore,
            data_sensitivity_score: dataSensitivity,
            governance_deficit_score: governanceDeficit
        };
    }

    calculateWeightedRiskScore(componentScores) {
        const weightedScore = (
            componentScores.bias_score * this.riskWeights['bias_risk'] +
            componentScores.privacy_score * this.riskWeights['privacy_risk'] +
            componentScores.transparency_score * this.riskWeights['transparency_risk'] +
            componentScores.data_sensitivity_score * this.riskWeights['data_sensitivity'] +
            componentScores.governance_deficit_score * this.riskWeights['governance_deficit']
        );
        return Math.round(weightedScore * 100) / 100;
    }

    adjustWithFairnessAudit(baseScore, fairnessAuditScore) {
        const normalizedFairness = (fairnessAuditScore - 5.5) / (9.9 - 5.5);
        const adjustmentFactor = 1.0 - (normalizedFairness * 0.1);
        return Math.round(baseScore * adjustmentFactor * 100) / 100;
    }

    adjustWithRecency(score, daysSinceAudit) {
        if (daysSinceAudit > 365) {
            return Math.round(score * 1.15 * 100) / 100;
        } else if (daysSinceAudit > 180) {
            return Math.round(score * 1.10 * 100) / 100;
        }
        return score;
    }

    determineRiskLevel(score) {
        if (score >= 70) return 'CRITICAL';
        if (score >= 50) return 'HIGH';
        if (score >= 30) return 'MEDIUM';
        return 'LOW';
    }

    calculateDetailedRiskProfile(row) {
        const componentScores = this.calculateComponentScores(row);
        let overallScore = this.calculateWeightedRiskScore(componentScores);
        
        overallScore = this.adjustWithFairnessAudit(overallScore, row.fairness_audit_score || 7.0);
        overallScore = this.adjustWithRecency(overallScore, row.days_since_audit || 0);
        
        overallScore = Math.max(0, Math.min(100, overallScore));

        return {
            overall_risk_score: overallScore,
            risk_level: this.determineRiskLevel(overallScore),
            component_scores: componentScores,
            risk_weights: this.riskWeights,
            confidence: 0.85,
            timestamp: new Date().toISOString()
        };
    }
}

// ============ EXPLANATION ENGINE ============
class ExplanationEngine {
    constructor() {
        this.explanationTemplates = {
            'high_bias': "This AI system shows HIGH BIAS RISK (score: {score}/100). It may produce discriminatory or unfair outputs, particularly affecting marginalized groups. Bias mitigation strategies are strongly recommended.",
            'medium_bias': "This AI system shows MODERATE BIAS RISK (score: {score}/100). Some bias concerns exist but are not severe. Regular fairness audits should be conducted.",
            'low_bias': "This AI system shows LOW BIAS RISK (score: {score}/100). Bias mitigation measures appear adequate, though continued monitoring is advised.",
            'high_privacy': "CRITICAL PRIVACY CONCERNS (score: {score}/100). This system handles sensitive or personal data with inadequate protections. Data breach risks are elevated. Enhanced privacy safeguards are urgently needed.",
            'medium_privacy': "MODERATE PRIVACY RISKS (score: {score}/100). The system processes user data with some privacy protections in place. Consider strengthening data minimization and encryption practices.",
            'low_privacy': "LOW PRIVACY RISK (score: {score}/100). Privacy protections appear adequate for current usage patterns.",
            'high_transparency': "LOW TRANSPARENCY (score: {score}/100). This AI system operates as a 'black box' with limited explainability. Decision-making processes are unclear, hindering accountability and trust.",
            'medium_transparency': "MODERATE TRANSPARENCY (score: {score}/100). Some documentation and explainability features exist, but improvements are needed for full accountability.",
            'low_transparency': "GOOD TRANSPARENCY (score: {score}/100). System operations and decision logic are reasonably well-documented.",
            'sensitive_data_usage': "⚠️ DATA SENSITIVITY ALERT: This system processes sensitive data types, increasing potential harm from misuse or breaches.",
            'personal_data_usage': "⚠️ PERSONAL DATA HANDLING: System processes personally identifiable information (PII), requiring GDPR/privacy law compliance measures.",
            'low_governance': "⚠️ WEAK GOVERNANCE: Limited human oversight and low transparency indicate inadequate governance structures. Enhanced human-in-the-loop mechanisms recommended.",
            'good_governance': "✓ GOOD GOVERNANCE: Adequate human oversight and transparency measures are in place.",
            'poor_fairness': "⚠️ POOR FAIRNESS AUDIT: Independent fairness audit reveals significant ethical concerns requiring immediate attention.",
            'good_fairness': "✓ GOOD FAIRNESS AUDIT (score: {fairness}/10). Third-party assessment confirms acceptable fairness standards.",
            'outdated_audit': "⚠️ OUTDATED AUDIT: Fresh audit recommended.",
            'active_monitoring': "✓ ACTIVE MONITORING: Real-time monitoring is enabled, enabling rapid detection of ethical issues.",
            'no_monitoring': "⚠️ NO REAL-TIME MONITORING: System lacks active monitoring capabilities, delaying detection of ethical incidents."
        };
    }

    generateBiasExplanation(biasScore) {
        if (biasScore >= 70) {
            return this.explanationTemplates['high_bias'].replace('{score}', Math.round(biasScore));
        } else if (biasScore >= 40) {
            return this.explanationTemplates['medium_bias'].replace('{score}', Math.round(biasScore));
        } else {
            return this.explanationTemplates['low_bias'].replace('{score}', Math.round(biasScore));
        }
    }

    generatePrivacyExplanation(privacyScore) {
        if (privacyScore >= 70) {
            return this.explanationTemplates['high_privacy'].replace('{score}', Math.round(privacyScore));
        } else if (privacyScore >= 40) {
            return this.explanationTemplates['medium_privacy'].replace('{score}', Math.round(privacyScore));
        } else {
            return this.explanationTemplates['low_privacy'].replace('{score}', Math.round(privacyScore));
        }
    }

    generateTransparencyExplanation(transparencyScore) {
        if (transparencyScore >= 70) {
            return this.explanationTemplates['high_transparency'].replace('{score}', Math.round(transparencyScore));
        } else if (transparencyScore >= 40) {
            return this.explanationTemplates['medium_transparency'].replace('{score}', Math.round(transparencyScore));
        } else {
            return this.explanationTemplates['low_transparency'].replace('{score}', Math.round(transparencyScore));
        }
    }

    generateFullExplanation(riskProfile, row) {
        const insights = [
            this.generateBiasExplanation(riskProfile.component_scores.bias_score),
            this.generatePrivacyExplanation(riskProfile.component_scores.privacy_score),
            this.generateTransparencyExplanation(riskProfile.component_scores.transparency_score)
        ];

        if (row.uses_sensitive_data) {
            insights.push(this.explanationTemplates['sensitive_data_usage']);
        }
        if (row.personal_data) {
            insights.push(this.explanationTemplates['personal_data_usage']);
        }

        const governance = (row.transparency_level || 0) + (row.human_oversight || 0);
        if (governance < 3) {
            insights.push(this.explanationTemplates['low_governance']);
        } else {
            insights.push(this.explanationTemplates['good_governance']);
        }

        const fairnessScore = row.fairness_audit_score || 7.0;
        if (fairnessScore < 7.0) {
            insights.push(this.explanationTemplates['poor_fairness']);
        } else {
            insights.push(this.explanationTemplates['good_fairness'].replace('{fairness}', fairnessScore.toFixed(1)));
        }

        if (row.realtime_monitoring_status === 'Active') {
            insights.push(this.explanationTemplates['active_monitoring']);
        } else {
            insights.push(this.explanationTemplates['no_monitoring']);
        }

        const recommendations = [];
        if (riskProfile.component_scores.bias_score > 60) {
            recommendations.push("Conduct comprehensive fairness audit");
            recommendations.push("Implement bias detection techniques");
        }
        if (riskProfile.component_scores.privacy_score > 60) {
            recommendations.push("Implement end-to-end encryption");
            recommendations.push("Enhance data minimization practices");
            recommendations.push("Conduct privacy impact assessment");
        }
        if (riskProfile.component_scores.transparency_score > 60) {
            recommendations.push("Develop explainability documentation");
            recommendations.push("Create transparency reports");
        }
        if (recommendations.length === 0) {
            recommendations.push("Continue current practices");
            recommendations.push("Conduct periodic audits");
        }

        return {
            key_insights: insights,
            actionable_recommendations: recommendations,
            summary: `${row.ai_name} presents a ${riskProfile.risk_level} ethical risk profile.`,
            generated_at: new Date().toISOString()
        };
    }
}

// ============ REAL-TIME MONITORING ============
class RealTimeMonitoringSimulator {
    generateSentimentAnalysis() {
        const sentiments = ['positive', 'neutral', 'negative'];
        const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const score = Math.random() * 100;

        return {
            label: randomSentiment,
            score: Math.round(score * 100) / 100,
            source: 'social_media_aggregator'
        };
    }

    generateNewsMonitoring() {
        return {
            total_mentions: Math.floor(Math.random() * 100) + 1,
            trending_topics: ['Privacy concerns', 'Regulatory changes', 'Performance updates'],
            sources: ['Twitter', 'Reddit', 'Tech News'],
            sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
        };
    }

    generateRealtimeReport(row, riskProfile) {
        return {
            ai_system: row.ai_name,
            current_risk_score: riskProfile.overall_risk_score,
            risk_level: riskProfile.risk_level,
            sentiment_analysis: this.generateSentimentAnalysis(),
            news_monitoring: this.generateNewsMonitoring(),
            monitoring_timestamp: new Date().toISOString(),
            alert_status: riskProfile.overall_risk_score > 70 ? 'ALERT' : 'NORMAL'
        };
    }
}

// ============ INITIALIZATION ============
const riskScorer = new RiskScoringEngine();
const explanationEngine = new ExplanationEngine();
const realtimeMonitor = new RealTimeMonitoringSimulator();

function initializeSampleData() {
    // Expanded sample data with 50+ AI tools for better model training
    appData.tools = [
        // Original tools with calculated overall_risk_score
        {
            ai_name: "Pinecone", company: "Pinecone", domain: "Vector Database", model_type: "Infrastructure",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 45.2
        },
        {
            ai_name: "ChatGPT", company: "OpenAI", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 3,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-02-10", days_since_audit: 58, overall_risk_score: 52.8
        },
        {
            ai_name: "Midjourney", company: "Midjourney", domain: "Image Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.5, last_audit_timestamp: "2023-12-20", days_since_audit: 111, overall_risk_score: 58.7
        },
        {
            ai_name: "GitHub Copilot", company: "GitHub/Microsoft", domain: "Code Assistant", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-01-05", days_since_audit: 94, overall_risk_score: 38.4
        },
        {
            ai_name: "Adobe Firefly", company: "Adobe", domain: "Image Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 46.8
        },
        {
            ai_name: "Claude", company: "Anthropic", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 3, human_oversight: 3,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.2, last_audit_timestamp: "2024-01-20", days_since_audit: 79, overall_risk_score: 28.6
        },
        {
            ai_name: "Grammarly", company: "Grammarly", domain: "Writing Assistant", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2023-11-15", days_since_audit: 146, overall_risk_score: 48.2
        },
        {
            ai_name: "Copilot Pro", company: "Microsoft", domain: "Code Assistant", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2024-01-10", days_since_audit: 89, overall_risk_score: 42.1
        },
        {
            ai_name: "Gemini", company: "Google", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-02-05", days_since_audit: 63, overall_risk_score: 51.4
        },

        // Additional AI Tools - Large Language Models
        {
            ai_name: "GPT-4", company: "OpenAI", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 3,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-03-01", days_since_audit: 39, overall_risk_score: 49.6
        },
        {
            ai_name: "Bard", company: "Google", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-01-25", days_since_audit: 74, overall_risk_score: 50.8
        },
        {
            ai_name: "Llama 2", company: "Meta", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 3, human_oversight: 3,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.0, last_audit_timestamp: "2024-02-15", days_since_audit: 53, overall_risk_score: 35.2
        },
        {
            ai_name: "PaLM", company: "Google", domain: "AI Infrastructure", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.4, last_audit_timestamp: "2024-01-30", days_since_audit: 69, overall_risk_score: 49.8
        },

        // Code Assistants
        {
            ai_name: "Tabnine", company: "Tabnine", domain: "Code Assistant", model_type: "ML",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-02-20", days_since_audit: 48, overall_risk_score: 36.8
        },
        {
            ai_name: "Kite", company: "Kite", domain: "Code Assistant", model_type: "ML",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 7.0, last_audit_timestamp: "2023-12-01", days_since_audit: 130, overall_risk_score: 41.2
        },
        {
            ai_name: "AWS CodeWhisperer", company: "Amazon", domain: "Code Assistant", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 37.6
        },

        // Image Generation
        {
            ai_name: "DALL-E 3", company: "OpenAI", domain: "Image Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-02-10", days_since_audit: 58, overall_risk_score: 44.8
        },
        {
            ai_name: "Stable Diffusion", company: "Stability AI", domain: "Image Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 3, human_oversight: 3,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.1, last_audit_timestamp: "2024-01-05", days_since_audit: 94, overall_risk_score: 32.4
        },
        {
            ai_name: "Craiyon", company: "Craiyon", domain: "Image Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 1,
            bias_risk: 3, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 6.0, last_audit_timestamp: "2023-10-15", days_since_audit: 167, overall_risk_score: 72.8
        },

        // Writing Assistants
        {
            ai_name: "Jasper", company: "Jasper", domain: "Writing Assistant", model_type: "GenAI",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.8, last_audit_timestamp: "2024-01-20", days_since_audit: 79, overall_risk_score: 54.6
        },
        {
            ai_name: "Copy.ai", company: "Copy.ai", domain: "Writing Assistant", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 46.8
        },
        {
            ai_name: "Writesonic", company: "Writesonic", domain: "Writing Assistant", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.9, last_audit_timestamp: "2024-01-25", days_since_audit: 74, overall_risk_score: 47.2
        },

        // Healthcare AI
        {
            ai_name: "IBM Watson Health", company: "IBM", domain: "Healthcare", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 3, human_oversight: 3,
            bias_risk: 2, privacy_risk: 3, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.5, last_audit_timestamp: "2024-02-15", days_since_audit: 53, overall_risk_score: 58.2
        },
        {
            ai_name: "Google Health AI", company: "Google", domain: "Healthcare", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 3,
            bias_risk: 2, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-01-30", days_since_audit: 69, overall_risk_score: 62.4
        },
        {
            ai_name: "Tempus AI", company: "Tempus", domain: "Healthcare", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-02-05", days_since_audit: 63, overall_risk_score: 64.8
        },

        // Finance AI
        {
            ai_name: "Robinhood Snippets", company: "Robinhood", domain: "Finance", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 3,
            bias_risk: 1, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 58.6
        },
        {
            ai_name: "Kabbage AI", company: "Kabbage", domain: "Finance", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.8, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 66.4
        },
        {
            ai_name: "AlphaSense", company: "AlphaSense", domain: "Finance", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 3, human_oversight: 3,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.0, last_audit_timestamp: "2024-01-20", days_since_audit: 79, overall_risk_score: 48.2
        },

        // Education AI
        {
            ai_name: "Duolingo Max", company: "Duolingo", domain: "Education", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-02-10", days_since_audit: 58, overall_risk_score: 46.8
        },
        {
            ai_name: "Khan Academy AI", company: "Khan Academy", domain: "Education", model_type: "ML",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 3, human_oversight: 3,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.2, last_audit_timestamp: "2024-01-25", days_since_audit: 74, overall_risk_score: 42.6
        },
        {
            ai_name: "Coursera AI", company: "Coursera", domain: "Education", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-02-15", days_since_audit: 53, overall_risk_score: 46.2
        },

        // Legal Tech
        {
            ai_name: "LexisNexis AI", company: "LexisNexis", domain: "Legal Tech", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 3,
            bias_risk: 2, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2024-01-10", days_since_audit: 89, overall_risk_score: 64.2
        },
        {
            ai_name: "Clio AI", company: "Clio", domain: "Legal Tech", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 3, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-02-05", days_since_audit: 63, overall_risk_score: 58.8
        },
        {
            ai_name: "Ross Intelligence", company: "Ross Intelligence", domain: "Legal Tech", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 3, human_oversight: 3,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-01-30", days_since_audit: 69, overall_risk_score: 48.4
        },

        // Meeting Assistants
        {
            ai_name: "Otter.ai", company: "Otter.ai", domain: "Meeting Assistant", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.4, last_audit_timestamp: "2024-02-20", days_since_audit: 48, overall_risk_score: 46.8
        },
        {
            ai_name: "Fireflies.ai", company: "Fireflies.ai", domain: "Meeting Assistant", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 47.6
        },
        {
            ai_name: "Sembly AI", company: "Sembly", domain: "Meeting Assistant", model_type: "GenAI",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 48.2
        },

        // Design Tools
        {
            ai_name: "Canva Magic Design", company: "Canva", domain: "Design Tool", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-01-20", days_since_audit: 79, overall_risk_score: 44.8
        },
        {
            ai_name: "Figma AI", company: "Figma", domain: "Design Tool", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-02-10", days_since_audit: 58, overall_risk_score: 36.4
        },
        {
            ai_name: "Uizard", company: "Uizard", domain: "Design Tool", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 1,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 6.5, last_audit_timestamp: "2023-12-15", days_since_audit: 116, overall_risk_score: 58.8
        },

        // Video Editing
        {
            ai_name: "Runway ML", company: "Runway", domain: "Video Editing", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-01-25", days_since_audit: 74, overall_risk_score: 42.6
        },
        {
            ai_name: "Descript", company: "Descript", domain: "Video Editing", model_type: "GenAI",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-02-15", days_since_audit: 53, overall_risk_score: 46.8
        },
        {
            ai_name: "Pika Labs", company: "Pika Labs", domain: "Video Editing", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 1,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.8, last_audit_timestamp: "2024-01-10", days_since_audit: 89, overall_risk_score: 56.4
        },

        // Note Taking
        {
            ai_name: "Notion AI", company: "Notion", domain: "Note Taking", model_type: "GenAI",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.4, last_audit_timestamp: "2024-02-05", days_since_audit: 63, overall_risk_score: 46.8
        },
        {
            ai_name: "Roam Research", company: "Roam Research", domain: "Note Taking", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 7.0, last_audit_timestamp: "2023-12-20", days_since_audit: 111, overall_risk_score: 48.2
        },
        {
            ai_name: "Obsidian AI", company: "Obsidian", domain: "Note Taking", model_type: "ML",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 3, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.6, last_audit_timestamp: "2024-01-30", days_since_audit: 69, overall_risk_score: 44.8
        },

        // 3D Modeling
        {
            ai_name: "Sculpteo AI", company: "Sculpteo", domain: "3D Modeling", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-02-20", days_since_audit: 48, overall_risk_score: 38.4
        },
        {
            ai_name: "Autodesk Generative Design", company: "Autodesk", domain: "3D Modeling", model_type: "ML",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 3,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.8, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 34.6
        },
        {
            ai_name: "Shapeways AI", company: "Shapeways", domain: "3D Modeling", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Active",
            fairness_audit_score: 6.9, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 52.2
        },

        // Animation
        {
            ai_name: "Toonly", company: "Toonly", domain: "Animation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-01-20", days_since_audit: 79, overall_risk_score: 38.8
        },
        {
            ai_name: "Vyond AI", company: "Vyond", domain: "Animation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-02-10", days_since_audit: 58, overall_risk_score: 37.6
        },
        {
            ai_name: "Powtoon AI", company: "Powtoon", domain: "Animation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 1,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 6.5, last_audit_timestamp: "2023-12-05", days_since_audit: 126, overall_risk_score: 61.8
        },

        // Audio/Voice
        {
            ai_name: "ElevenLabs", company: "ElevenLabs", domain: "Audio / Voice", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.0, last_audit_timestamp: "2024-02-15", days_since_audit: 53, overall_risk_score: 44.2
        },
        {
            ai_name: "Respeecher", company: "Respeecher", domain: "Audio / Voice", model_type: "GenAI",
            uses_sensitive_data: 1, personal_data: 1, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 2, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.2, last_audit_timestamp: "2024-01-25", days_since_audit: 74, overall_risk_score: 46.8
        },
        {
            ai_name: "Murf.ai", company: "Murf.ai", domain: "Audio / Voice", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.4, last_audit_timestamp: "2024-02-05", days_since_audit: 63, overall_risk_score: 37.8
        },

        // Search Engine
        {
            ai_name: "Perplexity AI", company: "Perplexity", domain: "Search Engine", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.5, last_audit_timestamp: "2024-01-30", days_since_audit: 69, overall_risk_score: 42.8
        },
        {
            ai_name: "You.com", company: "You.com", domain: "Search Engine", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.6, last_audit_timestamp: "2024-02-20", days_since_audit: 48, overall_risk_score: 36.8
        },
        {
            ai_name: "Neeva", company: "Neeva", domain: "Search Engine", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 3, human_oversight: 3,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 1, realtime_monitoring_status: "Active",
            fairness_audit_score: 8.0, last_audit_timestamp: "2024-01-10", days_since_audit: 89, overall_risk_score: 28.2
        },

        // Music Generation
        {
            ai_name: "AIVA", company: "AIVA Technologies", domain: "Music Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.3, last_audit_timestamp: "2024-02-01", days_since_audit: 67, overall_risk_score: 37.6
        },
        {
            ai_name: "Amper Music", company: "Amper Music", domain: "Music Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 2, human_oversight: 2,
            bias_risk: 1, privacy_risk: 1, transparency_risk: 2, realtime_monitoring_status: "Active",
            fairness_audit_score: 7.1, last_audit_timestamp: "2024-01-15", days_since_audit: 84, overall_risk_score: 38.8
        },
        {
            ai_name: "Soundraw", company: "Soundraw", domain: "Music Generation", model_type: "GenAI",
            uses_sensitive_data: 0, personal_data: 0, transparency_level: 1, human_oversight: 1,
            bias_risk: 2, privacy_risk: 1, transparency_risk: 3, realtime_monitoring_status: "Inactive",
            fairness_audit_score: 6.8, last_audit_timestamp: "2023-12-10", days_since_audit: 121, overall_risk_score: 56.4
        }
    ];

    // Train the model on the expanded dataset
    appData.trainedModel = new TrainedRiskModel();
    appData.trainedModel.train(appData.tools);

    appData.initialized = true;
    updateStatistics();
}

// ============ UTILITY FUNCTIONS ============
function updateStatistics() {
    const tools = appData.tools;
    const riskScores = tools.map(tool => riskScorer.calculateDetailedRiskProfile(tool).overall_risk_score);
    
    document.getElementById('totalTools').textContent = tools.length;
    document.getElementById('avgRiskScore').textContent = (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(1);
    document.getElementById('maxRiskScore').textContent = Math.max(...riskScores).toFixed(1);
    document.getElementById('minRiskScore').textContent = Math.min(...riskScores).toFixed(1);
}

function displayAllTools() {
    const container = document.getElementById('toolsContainer');
    container.innerHTML = '';

    appData.tools.forEach(tool => {
        const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);
        const card = createToolCard(tool, riskProfile);
        container.appendChild(card);
    });
}

function createToolCard(tool, riskProfile) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    
    const riskClass = riskProfile.risk_level === 'CRITICAL' ? 'risk-high' : 
                      riskProfile.risk_level === 'HIGH' ? 'risk-medium' :
                      riskProfile.risk_level === 'MEDIUM' ? 'risk-medium' : 'risk-low';
    
    card.classList.add(riskClass);
    
    const riskColor = riskProfile.overall_risk_score >= 70 ? '#ef4444' :
                      riskProfile.overall_risk_score >= 50 ? '#f59e0b' : '#10b981';
    
    card.innerHTML = `
        <div class="tool-name">${tool.ai_name}</div>
        <div class="tool-company">${tool.company}</div>
        <div class="tool-meta">
            <span style="color: #6b7280; font-size: 0.9em;">${tool.domain}</span>
            <span style="color: ${riskColor}; font-weight: 600;">${riskProfile.overall_risk_score.toFixed(1)}</span>
        </div>
    `;
    
    card.onclick = () => showToolDetails(tool);
    return card;
}

function showToolDetails(tool) {
    const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);
    const explanation = explanationEngine.generateFullExplanation(riskProfile, tool);
    const realtimeReport = realtimeMonitor.generateRealtimeReport(tool, riskProfile);

    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');

    let html = `
        <div class="modal-header">
            <h2>${tool.ai_name}</h2>
            <span class="close-btn" onclick="closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
            <div class="risk-gauge" style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 3em; font-weight: 700; color: ${riskProfile.overall_risk_score >= 70 ? '#ef4444' : riskProfile.overall_risk_score >= 50 ? '#f59e0b' : '#10b981'};">
                    ${riskProfile.overall_risk_score.toFixed(1)}
                </div>
                <div style="color: #666; font-size: 1.1em;">${riskProfile.risk_level}</div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 10px;">📋 Key Information</div>
                <div style="color: #666; line-height: 1.6;">
                    <div>Company: ${tool.company}</div>
                    <div>Domain: ${tool.domain}</div>
                    <div>Model Type: ${tool.model_type}</div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 10px;">🎯 Risk Component Breakdown</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
                        <div style="color: #666;">Bias Risk</div>
                        <div style="font-weight: 600; color: #1f2937;">${riskProfile.component_scores.bias_score.toFixed(1)}/100</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
                        <div style="color: #666;">Privacy Risk</div>
                        <div style="font-weight: 600; color: #1f2937;">${riskProfile.component_scores.privacy_score.toFixed(1)}/100</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
                        <div style="color: #666;">Transparency Risk</div>
                        <div style="font-weight: 600; color: #1f2937;">${riskProfile.component_scores.transparency_score.toFixed(1)}/100</div>
                    </div>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px;">
                        <div style="color: #666;">Data Sensitivity</div>
                        <div style="font-weight: 600; color: #1f2937;">${riskProfile.component_scores.data_sensitivity_score.toFixed(1)}/100</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 10px;">💡 Key Insights</div>
                <div style="color: #555; line-height: 1.8; font-size: 0.9em;">
                    ${explanation.key_insights.map(insight => `<p style="margin-bottom: 10px;">• ${insight}</p>`).join('')}
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="font-weight: 600; margin-bottom: 10px;">✅ Recommendations</div>
                <div style="color: #555; line-height: 1.8; font-size: 0.9em;">
                    ${explanation.actionable_recommendations.map(rec => `<p style="margin-bottom: 8px;">→ ${rec}</p>`).join('')}
                </div>
            </div>

            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 0.85em; color: #666;">
                <div style="margin-bottom: 8px;">📊 Real-time Monitoring Status: ${realtimeReport.alert_status}</div>
                <div style="margin-bottom: 8px;">📰 Media Mentions: ${realtimeReport.news_monitoring.total_mentions}</div>
                <div>💬 Sentiment: ${realtimeReport.sentiment_analysis.label}</div>
            </div>
        </div>
    `;

    modalContent.innerHTML = html;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

function searchTools() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('toolsContainer');
    container.innerHTML = '';

    const filtered = appData.tools.filter(tool =>
        tool.ai_name.toLowerCase().includes(query) ||
        tool.company.toLowerCase().includes(query) ||
        tool.domain.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No tools found. Try a different search.</div>';
        return;
    }

    filtered.forEach(tool => {
        const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);
        const card = createToolCard(tool, riskProfile);
        container.appendChild(card);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
    displayAllTools();
});
