"""
Explanation Engine
Generates human-readable explanations for risk predictions
Uses ALL columns to provide comprehensive explanations
"""


class ExplanationEngine:
    """
    Generates detailed, interpretable explanations for AI risk assessments
    Tells users WHY a particular AI system received its risk score
    """
    
    def __init__(self):
        self.explanation_templates = {
            'high_bias': "This AI system shows HIGH BIAS RISK (score: {score}/100). "
                        "It may produce discriminatory or unfair outputs, particularly affecting "
                        "marginalized groups. Bias mitigation strategies are strongly recommended.",
            
            'medium_bias': "This AI system shows MODERATE BIAS RISK (score: {score}/100). "
                          "Some bias concerns exist but are not severe. Regular fairness audits "
                          "should be conducted.",
            
            'low_bias': "This AI system shows LOW BIAS RISK (score: {score}/100). "
                       "Bias mitigation measures appear adequate, though continued monitoring is advised.",
            
            'high_privacy': "CRITICAL PRIVACY CONCERNS (score: {score}/100). This system handles "
                           "sensitive or personal data with inadequate protections. Data breach risks "
                           "are elevated. Enhanced privacy safeguards are urgently needed.",
            
            'medium_privacy': "MODERATE PRIVACY RISKS (score: {score}/100). The system processes "
                             "user data with some privacy protections in place. Consider strengthening "
                             "data minimization and encryption practices.",
            
            'low_privacy': "LOW PRIVACY RISK (score: {score}/100). Privacy protections appear "
                          "adequate for current usage patterns.",
            
            'high_transparency': "LOW TRANSPARENCY (score: {score}/100). This AI system operates "
                                "as a 'black box' with limited explainability. Decision-making processes "
                                "are unclear, hindering accountability and trust.",
            
            'medium_transparency': "MODERATE TRANSPARENCY (score: {score}/100). Some documentation "
                                  "and explainability features exist, but improvements are needed for "
                                  "full accountability.",
            
            'low_transparency': "GOOD TRANSPARENCY (score: {score}/100). System operations and "
                               "decision logic are reasonably well-documented.",
            
            'sensitive_data_usage': "⚠️ DATA SENSITIVITY ALERT: This system processes sensitive "
                                   "data types, increasing potential harm from misuse or breaches.",
            
            'personal_data_usage': "⚠️ PERSONAL DATA HANDLING: System processes personally identifiable "
                                  "information (PII), requiring GDPR/privacy law compliance measures.",
            
            'low_governance': "⚠️ WEAK GOVERNANCE: Limited human oversight (score: {oversight}/3) and "
                             "low transparency (score: {transparency}/3) indicate inadequate governance "
                             "structures. Enhanced human-in-the-loop mechanisms recommended.",
            
            'good_governance': "✓ GOOD GOVERNANCE: Adequate human oversight and transparency measures "
                              "are in place.",
            
            'poor_fairness': "⚠️ POOR FAIRNESS AUDIT (score: {fairness}/10). Independent fairness audit "
                            "reveals significant ethical concerns requiring immediate attention.",
            
            'good_fairness': "✓ GOOD FAIRNESS AUDIT (score: {fairness}/10). Third-party assessment "
                            "confirms acceptable fairness standards.",
            
            'outdated_audit': "⚠️ OUTDATED AUDIT: Last audit was {days} days ago. Risk assessment may "
                             "not reflect current system behavior. Fresh audit recommended.",
            
            'active_monitoring': "✓ ACTIVE MONITORING: Real-time monitoring is enabled, enabling rapid "
                               "detection of ethical issues.",
            
            'no_monitoring': "⚠️ NO REAL-TIME MONITORING: System lacks active monitoring capabilities, "
                            "delaying detection of ethical incidents."
        }
    
    def generate_bias_explanation(self, bias_score):
        """Generate explanation for bias risk"""
        if bias_score >= 70:
            return self.explanation_templates['high_bias'].format(score=bias_score)
        elif bias_score >= 45:
            return self.explanation_templates['medium_bias'].format(score=bias_score)
        else:
            return self.explanation_templates['low_bias'].format(score=bias_score)
    
    def generate_privacy_explanation(self, privacy_score):
        """Generate explanation for privacy risk"""
        if privacy_score >= 70:
            return self.explanation_templates['high_privacy'].format(score=privacy_score)
        elif privacy_score >= 45:
            return self.explanation_templates['medium_privacy'].format(score=privacy_score)
        else:
            return self.explanation_templates['low_privacy'].format(score=privacy_score)
    
    def generate_transparency_explanation(self, transparency_score):
        """Generate explanation for transparency risk"""
        if transparency_score >= 70:
            return self.explanation_templates['high_transparency'].format(score=transparency_score)
        elif transparency_score >= 45:
            return self.explanation_templates['medium_transparency'].format(score=transparency_score)
        else:
            return self.explanation_templates['low_transparency'].format(score=transparency_score)
    
    def generate_governance_explanation(self, transparency_level, human_oversight):
        """Generate explanation for governance quality"""
        total_governance = transparency_level + human_oversight
        
        if total_governance <= 2:
            return self.explanation_templates['low_governance'].format(
                oversight=human_oversight,
                transparency=transparency_level
            )
        else:
            return self.explanation_templates['good_governance']
    
    def generate_fairness_explanation(self, fairness_score):
        """Generate explanation based on fairness audit"""
        if fairness_score < 7.0:
            return self.explanation_templates['poor_fairness'].format(fairness=fairness_score*10)
        else:
            return self.explanation_templates['good_fairness'].format(fairness=fairness_score*10)
    
    def generate_audit_recency_explanation(self, days_since_audit):
        """Generate explanation based on audit age"""
        if days_since_audit > 90:
            return self.explanation_templates['outdated_audit'].format(days=days_since_audit)
        return None
    
    def generate_data_usage_warnings(self, uses_sensitive, has_personal):
        """Generate warnings about data usage"""
        warnings = []
        
        if uses_sensitive:
            warnings.append(self.explanation_templates['sensitive_data_usage'])
        
        if has_personal:
            warnings.append(self.explanation_templates['personal_data_usage'])
        
        return warnings
    
    def generate_monitoring_explanation(self, monitoring_status):
        """Generate explanation based on monitoring status"""
        if monitoring_status == 'Active':
            return self.explanation_templates['active_monitoring']
        else:
            return self.explanation_templates['no_monitoring']
    
    def generate_full_explanation(self, risk_profile, row):
        """
        Generate comprehensive explanation combining all factors
        Returns structured explanation with prioritized insights
        """
        explanations = {
            'critical_concerns': [],
            'moderate_concerns': [],
            'positive_aspects': [],
            'recommendations': []
        }
        
        # Extract component scores
        components = risk_profile['component_breakdown']
        contributing = risk_profile['contributing_factors']
        
        # 1. Bias Risk Explanation
        bias_exp = self.generate_bias_explanation(components['bias_risk']['score'])
        if components['bias_risk']['score'] >= 70:
            explanations['critical_concerns'].append(bias_exp)
            explanations['recommendations'].append("Implement bias detection and mitigation frameworks")
        elif components['bias_risk']['score'] >= 45:
            explanations['moderate_concerns'].append(bias_exp)
        else:
            explanations['positive_aspects'].append(bias_exp)
        
        # 2. Privacy Risk Explanation
        privacy_exp = self.generate_privacy_explanation(components['privacy_risk']['score'])
        if components['privacy_risk']['score'] >= 70:
            explanations['critical_concerns'].append(privacy_exp)
            explanations['recommendations'].append("Enhance data protection and privacy-preserving techniques")
        elif components['privacy_risk']['score'] >= 45:
            explanations['moderate_concerns'].append(privacy_exp)
        else:
            explanations['positive_aspects'].append(privacy_exp)
        
        # 3. Transparency Risk Explanation
        transparency_exp = self.generate_transparency_explanation(
            components['transparency_risk']['score']
        )
        if components['transparency_risk']['score'] >= 70:
            explanations['critical_concerns'].append(transparency_exp)
            explanations['recommendations'].append("Improve model interpretability and documentation")
        elif components['transparency_risk']['score'] >= 45:
            explanations['moderate_concerns'].append(transparency_exp)
        else:
            explanations['positive_aspects'].append(transparency_exp)
        
        # 4. Data Usage Warnings
        data_warnings = self.generate_data_usage_warnings(
            contributing['uses_sensitive_data'],
            contributing['handles_personal_data']
        )
        for warning in data_warnings:
            explanations['moderate_concerns'].append(warning)
        
        # 5. Governance Explanation
        governance_exp = self.generate_governance_explanation(
            contributing['transparency_level'],
            contributing['human_oversight']
        )
        if 'WEAK GOVERNANCE' in governance_exp:
            explanations['moderate_concerns'].append(governance_exp)
            explanations['recommendations'].append("Strengthen human oversight and transparency measures")
        else:
            explanations['positive_aspects'].append(governance_exp)
        
        # 6. Fairness Audit Explanation
        fairness_exp = self.generate_fairness_explanation(contributing['fairness_audit_score'])
        if 'POOR FAIRNESS' in fairness_exp:
            explanations['critical_concerns'].append(fairness_exp)
            explanations['recommendations'].append("Conduct comprehensive fairness remediation")
        else:
            explanations['positive_aspects'].append(fairness_exp)
        
        # 7. Audit Recency
        if 'days_since_audit' in row:
            recency_exp = self.generate_audit_recency_explanation(row['days_since_audit'])
            if recency_exp:
                explanations['moderate_concerns'].append(recency_exp)
                explanations['recommendations'].append("Schedule updated ethics audit")
        
        # 8. Monitoring Status
        monitoring_exp = self.generate_monitoring_explanation(
            contributing['realtime_monitoring']
        )
        if 'NO REAL-TIME MONITORING' in monitoring_exp:
            explanations['moderate_concerns'].append(monitoring_exp)
            explanations['recommendations'].append("Implement real-time ethical monitoring")
        else:
            explanations['positive_aspects'].append(monitoring_exp)
        
        # Build final structured explanation
        full_explanation = {
            'ai_name': row['ai_name'],
            'company': row['company'],
            'overall_risk_score': risk_profile['overall_risk_score'],
            'risk_level': risk_profile['risk_level'],
            
            'summary': self._generate_summary(risk_profile, explanations),
            
            'detailed_explanations': explanations,
            
            'key_insights': self._extract_key_insights(risk_profile, explanations),
            
            'actionable_recommendations': explanations['recommendations']
        }
        
        return full_explanation
    
    def _generate_summary(self, risk_profile, explanations):
        """Generate executive summary"""
        risk_level = risk_profile['risk_level']
        score = risk_profile['overall_risk_score']
        
        critical_count = len(explanations['critical_concerns'])
        moderate_count = len(explanations['moderate_concerns'])
        positive_count = len(explanations['positive_aspects'])
        
        summary_parts = [
            f"Overall Risk Assessment: {risk_level} ({score}/100)",
            f"Identified {critical_count} critical concern(s), {moderate_count} moderate concern(s), "
            f"and {positive_count} positive aspect(s)."
        ]
        
        if critical_count > 0:
            summary_parts.append("IMMEDIATE ATTENTION REQUIRED due to critical ethical risks.")
        
        return " ".join(summary_parts)
    
    def _extract_key_insights(self, risk_profile, explanations):
        """Extract top 3-5 key insights"""
        insights = []
        
        # Highest risk component
        components = risk_profile['component_breakdown']
        highest_risk_component = max(
            components.items(),
            key=lambda x: x[1]['score']
        )
        
        if highest_risk_component[1]['score'] >= 70:
            insights.append(
                f"HIGHEST RISK: {highest_risk_component[0].replace('_', ' ').title()} "
                f"(score: {highest_risk_component[1]['score']}/100)"
            )
        
        # Data sensitivity insight
        if risk_profile['contributing_factors']['uses_sensitive_data']:
            insights.append("Handles sensitive data - requires enhanced safeguards")
        
        if risk_profile['contributing_factors']['handles_personal_data']:
            insights.append("Processes personal data - GDPR compliance required")
        
        # Governance insight
        if risk_profile['contributing_factors']['human_oversight'] < 2:
            insights.append("Limited human oversight increases autonomy risks")
        
        # Monitoring insight
        if risk_profile['contributing_factors']['realtime_monitoring'] == 'Active':
            insights.append("Active monitoring provides early warning capability")
        
        return insights[:5]  # Return top 5 insights
    
    def format_for_display(self, explanation_dict):
        """Format explanation for user-friendly display"""
        output = []
        output.append("="*70)
        output.append(f"ETHICAL RISK ASSESSMENT: {explanation_dict['ai_name']}")
        output.append(f"Company: {explanation_dict['company']}")
        output.append("="*70)
        
        output.append(f"\n📊 OVERALL SCORE: {explanation_dict['overall_risk_score']}/100")
        output.append(f"🎯 RISK LEVEL: {explanation_dict['risk_level']}")
        
        output.append("\n" + "="*70)
        output.append("SUMMARY")
        output.append("="*70)
        output.append(explanation_dict['summary'])
        
        output.append("\n" + "="*70)
        output.append("KEY INSIGHTS")
        output.append("="*70)
        for i, insight in enumerate(explanation_dict['key_insights'], 1):
            output.append(f"{i}. {insight}")
        
        if explanation_dict['detailed_explanations']['critical_concerns']:
            output.append("\n" + "="*70)
            output.append("🚨 CRITICAL CONCERNS")
            output.append("="*70)
            for concern in explanation_dict['detailed_explanations']['critical_concerns']:
                output.append(f"• {concern}")
        
        if explanation_dict['detailed_explanations']['moderate_concerns']:
            output.append("\n" + "="*70)
            output.append("⚠️ MODERATE CONCERNS")
            output.append("="*70)
            for concern in explanation_dict['detailed_explanations']['moderate_concerns']:
                output.append(f"• {concern}")
        
        if explanation_dict['detailed_explanations']['positive_aspects']:
            output.append("\n" + "="*70)
            output.append("✓ POSITIVE ASPECTS")
            output.append("="*70)
            for aspect in explanation_dict['detailed_explanations']['positive_aspects']:
                output.append(f"• {aspect}")
        
        if explanation_dict['actionable_recommendations']:
            output.append("\n" + "="*70)
            output.append("💡 RECOMMENDATIONS")
            output.append("="*70)
            for i, rec in enumerate(explanation_dict['actionable_recommendations'], 1):
                output.append(f"{i}. {rec}")
        
        output.append("\n" + "="*70)
        
        return "\n".join(output)


if __name__ == "__main__":
    # Test the explanation engine
    from data_preprocessor import DataPreprocessor
    from risk_scoring_engine import RiskScoringEngine
    
    preprocessor = DataPreprocessor("Eai database.xlsx")
    preprocessor.load_data()
    preprocessor.prepare_features()
    
    scoring_engine = RiskScoringEngine()
    explanation_engine = ExplanationEngine()
    
    # Test on first 3 rows
    for i in range(3):
        row = preprocessor.df.iloc[i]
        risk_profile = scoring_engine.calculate_detailed_risk_profile(row)
        explanation = explanation_engine.generate_full_explanation(risk_profile, row)
        
        print(f"\n{explanation_engine.format_for_display(explanation)}")
