"""
Risk Scoring Engine
Calculates detailed risk breakdown using all dataset features
"""

import numpy as np


class RiskScoringEngine:
    """
    Calculates comprehensive risk scores based on multiple dimensions
    Uses ALL columns from the dataset for scoring
    """
    
    def __init__(self):
        self.risk_weights = {
            'bias_risk': 0.30,          # 30% weight
            'privacy_risk': 0.30,       # 30% weight
            'transparency_risk': 0.20,  # 20% weight
            'data_sensitivity': 0.15,   # 15% weight
            'governance_deficit': 0.05  # 5% weight
        }
        
    def calculate_component_scores(self, row):
        """Calculate individual risk component scores (0-100)"""
        
        # Bias Risk Score (from 0-3 scale to 0-100)
        bias_score = (row['bias_risk'] / 3.0) * 100
        
        # Privacy Risk Score
        privacy_score = (row['privacy_risk'] / 3.0) * 100
        
        # Transparency Risk Score
        transparency_score = (row['transparency_risk'] / 3.0) * 100
        
        # Data Sensitivity Score (binary features)
        data_sensitivity = (
            row['uses_sensitive_data'] * 50 + 
            row['personal_data'] * 50
        )
        
        # Governance Deficit Score (inverse of governance quality)
        max_governance = 6  # transparency_level(3) + human_oversight(3)
        actual_governance = row['transparency_level'] + row['human_oversight']
        governance_deficit = ((max_governance - actual_governance) / max_governance) * 100
        
        return {
            'bias_score': bias_score,
            'privacy_score': privacy_score,
            'transparency_score': transparency_score,
            'data_sensitivity_score': data_sensitivity,
            'governance_deficit_score': governance_deficit
        }
    
    def calculate_weighted_risk_score(self, component_scores):
        """Calculate weighted overall risk score"""
        weighted_score = (
            component_scores['bias_score'] * self.risk_weights['bias_risk'] +
            component_scores['privacy_score'] * self.risk_weights['privacy_risk'] +
            component_scores['transparency_score'] * self.risk_weights['transparency_risk'] +
            component_scores['data_sensitivity_score'] * self.risk_weights['data_sensitivity'] +
            component_scores['governance_deficit_score'] * self.risk_weights['governance_deficit']
        )
        return weighted_score
    
    def adjust_with_fairness_audit(self, base_score, fairness_audit_score):
        """Adjust score based on fairness audit results"""
        # Fairness audit score ranges from 5.5 to 9.9
        # Normalize to 0-1 scale (higher fairness = lower risk)
        normalized_fairness = (fairness_audit_score - 5.5) / (9.9 - 5.5)
        
        # Adjustment factor: good fairness reduces risk by up to 10%
        adjustment_factor = 1.0 - (normalized_fairness * 0.1)
        
        adjusted_score = base_score * adjustment_factor
        return adjusted_score
    
    def adjust_with_recency(self, score, days_since_audit):
        """Adjust score based on audit recency"""
        # Older audits increase uncertainty/risk
        if days_since_audit > 30:
            recency_penalty = min(days_since_audit / 365, 0.15)  # Max 15% penalty
            score = score * (1 + recency_penalty)
        
        return score
    
    def get_risk_level(self, score):
        """Convert numerical score to risk level"""
        if score >= 70:
            return "High"
        elif score >= 45:
            return "Medium"
        else:
            return "Low"
    
    def get_risk_color(self, score):
        """Get color code for risk level"""
        if score >= 70:
            return "#DC3545"  # Red - High risk
        elif score >= 45:
            return "#FFC107"  # Yellow - Medium risk
        else:
            return "#28A745"  # Green - Low risk
    
    def calculate_detailed_risk_profile(self, row):
        """
        Calculate comprehensive risk profile for an AI tool
        Returns detailed breakdown with all metrics
        """
        # Step 1: Calculate component scores
        components = self.calculate_component_scores(row)
        
        # Step 2: Calculate weighted base score
        base_score = self.calculate_weighted_risk_score(components)
        
        # Step 3: Adjust with fairness audit
        adjusted_score = self.adjust_with_fairness_audit(
            base_score, 
            row['fairness_audit_score']
        )
        
        # Step 4: Adjust with audit recency
        final_score = self.adjust_with_recency(
            adjusted_score, 
            row.get('days_since_audit', 0)
        )
        
        # Cap score at 100
        final_score = min(final_score, 100)
        
        # Step 5: Determine risk level
        risk_level = self.get_risk_level(final_score)
        risk_color = self.get_risk_color(final_score)
        
        # Step 6: Build risk profile
        risk_profile = {
            'overall_risk_score': round(final_score, 2),
            'risk_level': risk_level,
            'risk_color': risk_color,
            
            'component_breakdown': {
                'bias_risk': {
                    'score': round(components['bias_score'], 2),
                    'level': self.get_risk_level(components['bias_score']),
                    'weight': self.risk_weights['bias_risk']
                },
                'privacy_risk': {
                    'score': round(components['privacy_score'], 2),
                    'level': self.get_risk_level(components['privacy_score']),
                    'weight': self.risk_weights['privacy_risk']
                },
                'transparency_risk': {
                    'score': round(components['transparency_score'], 2),
                    'level': self.get_risk_level(components['transparency_score']),
                    'weight': self.risk_weights['transparency_risk']
                },
                'data_sensitivity': {
                    'score': round(components['data_sensitivity_score'], 2),
                    'level': self.get_risk_level(components['data_sensitivity_score']),
                    'weight': self.risk_weights['data_sensitivity']
                },
                'governance': {
                    'score': round(components['governance_deficit_score'], 2),
                    'level': self.get_risk_level(components['governance_deficit_score']),
                    'weight': self.risk_weights['governance_deficit']
                }
            },
            
            'contributing_factors': {
                'uses_sensitive_data': bool(row['uses_sensitive_data']),
                'handles_personal_data': bool(row['personal_data']),
                'transparency_level': row['transparency_level'],
                'human_oversight': row['human_oversight'],
                'fairness_audit_score': row['fairness_audit_score'],
                'realtime_monitoring': row['realtime_monitoring_status']
            }
        }
        
        return risk_profile
    
    def compare_to_dataset_average(self, score, dataset_mean=48.0, dataset_std=15.3):
        """Compare individual score to dataset average"""
        z_score = (score - dataset_mean) / dataset_std
        
        if z_score > 1.5:
            comparison = "Significantly above average risk"
        elif z_score > 0.5:
            comparison = "Above average risk"
        elif z_score > -0.5:
            comparison = "Average risk level"
        elif z_score > -1.5:
            comparison = "Below average risk"
        else:
            comparison = "Significantly below average risk"
        
        return {
            'comparison': comparison,
            'z_score': round(z_score, 2),
            'percentile': round(min(max((z_score + 3) / 6 * 100, 0), 100), 1)
        }


if __name__ == "__main__":
    # Test the risk scoring engine
    from data_preprocessor import DataPreprocessor
    
    preprocessor = DataPreprocessor("Eai database.xlsx")
    preprocessor.load_data()
    preprocessor.prepare_features()
    
    engine = RiskScoringEngine()
    
    # Test on first row
    test_row = preprocessor.df.iloc[0]
    profile = engine.calculate_detailed_risk_profile(test_row)
    
    print("\n" + "="*70)
    print("RISK PROFILE EXAMPLE")
    print("="*70)
    print(f"AI Tool: {test_row['ai_name']}")
    print(f"Overall Risk Score: {profile['overall_risk_score']}")
    print(f"Risk Level: {profile['risk_level']}")
    print(f"Risk Color: {profile['risk_color']}")
    print("\nComponent Breakdown:")
    for component, data in profile['component_breakdown'].items():
        print(f"  {component}: {data['score']} ({data['level']})")
    print("="*70)
