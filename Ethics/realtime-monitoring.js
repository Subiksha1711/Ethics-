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
            'poor_fairness': "⚠️ POOR FAIRNESS AUDIT (score: {fairness}/10). Independent fairness audit reveals significant ethical concerns requiring immediate attention.",
            'good_fairness': "✓ GOOD FAIRNESS AUDIT (score: {fairness}/10). Third-party assessment confirms acceptable fairness standards.",
            'outdated_audit': "⚠️ OUTDATED AUDIT: Last audit was {days} days ago. Risk assessment may not reflect current system behavior. Fresh audit recommended.",
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

        // Add data sensitivity alerts
        if (row.uses_sensitive_data) {
            insights.push(this.explanationTemplates['sensitive_data_usage']);
        }
        if (row.personal_data) {
            insights.push(this.explanationTemplates['personal_data_usage']);
        }

        // Add governance assessment
        const governance = (row.transparency_level || 0) + (row.human_oversight || 0);
        if (governance < 3) {
            insights.push(this.explanationTemplates['low_governance']);
        } else {
            insights.push(this.explanationTemplates['good_governance']);
        }

        // Add fairness audit assessment
        const fairnessScore = row.fairness_audit_score || 7.0;
        if (fairnessScore < 7.0) {
            insights.push(this.explanationTemplates['poor_fairness'].replace('{fairness}', fairnessScore.toFixed(1)));
        } else {
            insights.push(this.explanationTemplates['good_fairness'].replace('{fairness}', fairnessScore.toFixed(1)));
        }

        // Add audit recency assessment
        if (row.days_since_audit > 180) {
            insights.push(this.explanationTemplates['outdated_audit'].replace('{days}', row.days_since_audit));
        }

        // Add monitoring status
        if (row.realtime_monitoring_status === 'Active') {
            insights.push(this.explanationTemplates['active_monitoring']);
        } else {
            insights.push(this.explanationTemplates['no_monitoring']);
        }

        // Generate recommendations
        const recommendations = [];
        if (riskProfile.component_scores.bias_score > 60) {
            recommendations.push("Conduct comprehensive fairness audit focusing on protected attributes");
            recommendations.push("Implement bias detection and mitigation techniques");
            recommendations.push("Establish ethical review board for model decisions");
        }
        if (riskProfile.component_scores.privacy_score > 60) {
            recommendations.push("Implement end-to-end encryption for data in transit and at rest");
            recommendations.push("Enhance data minimization practices");
            recommendations.push("Deploy differential privacy mechanisms");
            recommendations.push("Conduct privacy impact assessment (PIA)");
        }
        if (riskProfile.component_scores.transparency_score > 60) {
            recommendations.push("Develop explainability documentation for all AI decisions");
            recommendations.push("Create user-facing transparency reports");
            recommendations.push("Implement interpretable ML techniques (LIME, SHAP)");
        }
        if (riskProfile.component_scores.governance_deficit_score > 50) {
            recommendations.push("Increase human oversight mechanisms");
            recommendations.push("Establish AI ethics review processes");
            recommendations.push("Implement monitoring and alerting systems");
        }

        if (recommendations.length === 0) {
            recommendations.push("Continue current practices and conduct periodic audits");
            recommendations.push("Monitor for emerging ethical concerns in user feedback");
        }

        return {
            key_insights: insights,
            actionable_recommendations: recommendations,
            summary: `${row.ai_name} presents a ${riskProfile.risk_level} ethical risk profile. ${insights[0]}`,
            generated_at: new Date().toISOString()
        };
    }
}

module.exports = ExplanationEngine;
