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
        // Bias Risk Score (from 0-3 scale to 0-100)
        const biasScore = (row.bias_risk / 3.0) * 100;

        // Privacy Risk Score
        const privacyScore = (row.privacy_risk / 3.0) * 100;

        // Transparency Risk Score
        const transparencyScore = (row.transparency_risk / 3.0) * 100;

        // Data Sensitivity Score (binary features)
        const dataSensitivity = (
            (row.uses_sensitive_data || 0) * 50 + 
            (row.personal_data || 0) * 50
        );

        // Governance Deficit Score (inverse of governance quality)
        const maxGovernance = 6; // transparency_level(3) + human_oversight(3)
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
        // Fairness audit score ranges from 5.5 to 9.9
        const normalizedFairness = (fairnessAuditScore - 5.5) / (9.9 - 5.5);
        const adjustmentFactor = 1.0 - (normalizedFairness * 0.1);
        return Math.round(baseScore * adjustmentFactor * 100) / 100;
    }

    adjustWithRecency(score, daysSinceAudit) {
        // Adjustment for audit recency
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
        // Calculate component scores
        const componentScores = this.calculateComponentScores(row);

        // Calculate weighted risk score
        let overallScore = this.calculateWeightedRiskScore(componentScores);

        // Adjust with fairness audit
        overallScore = this.adjustWithFairnessAudit(overallScore, row.fairness_audit_score || 7.0);

        // Adjust with recency
        overallScore = this.adjustWithRecency(overallScore, row.days_since_audit || 0);

        // Clamp score between 0 and 100
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

module.exports = RiskScoringEngine;
