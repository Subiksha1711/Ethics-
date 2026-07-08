"""
Data Preprocessing Module for Ethical Risk Assessment Framework
Uses ALL 15 columns from the dataset
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta


class DataPreprocessor:
    """Handles data loading, cleaning, and feature engineering"""
    
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = None
        self.feature_columns = None
        
    def load_data(self):
        """Load Excel dataset"""
        print(f"Loading data from {self.filepath}...")
        self.df = pd.read_excel(self.filepath)
        print(f"✓ Loaded {len(self.df)} rows with {len(self.df.columns)} columns")
        return self.df
    
    def get_column_info(self):
        """Display information about all columns"""
        print("\n" + "="*60)
        print("DATASET COLUMNS (ALL 15 COLUMNS)")
        print("="*60)
        
        column_descriptions = {
            'ai_name': 'Name of the AI tool',
            'company': 'Company/organization name',
            'domain': 'Application domain/category',
            'model_type': 'Type of ML model (DL/ML/GenAI)',
            'uses_sensitive_data': 'Binary: Does it use sensitive data? (0/1)',
            'personal_data': 'Binary: Does it handle personal data? (0/1)',
            'transparency_level': 'Score 0-3: How transparent is the system?',
            'human_oversight': 'Score 0-3: Level of human oversight',
            'bias_risk': 'Score 0-3: Risk of bias (0=low, 3=high)',
            'privacy_risk': 'Score 0-3: Privacy risk level',
            'transparency_risk': 'Score 0-3: Transparency risk level',
            'realtime_monitoring_status': 'Status: Active/Inactive monitoring',
            'fairness_audit_score': 'Score 5.5-9.9: Fairness audit result',
            'last_audit_timestamp': 'Date of last audit',
            'overall_risk_score': 'TARGET: Overall risk score (18-88)'
        }
        
        for col in self.df.columns:
            dtype = self.df[col].dtype
            unique_vals = self.df[col].nunique()
            desc = column_descriptions.get(col, 'No description')
            print(f"{col:30s} | Type: {str(dtype):10s} | Unique: {unique_vals:3d} | {desc}")
        
        print("="*60)
        return column_descriptions
    
    def encode_categorical_features(self):
        """Encode categorical variables"""
        # Encode domain
        domain_mapping = {
            'Vector Database': 0, 'Avatar / Video': 1, 'AI Infrastructure': 2,
            'Audio / Voice': 3, 'Search Engine': 4, 'Music Generation': 5,
            'Code Assistant': 6, 'Legal Tech': 7, 'Writing Assistant': 8,
            'Image Generation': 9, 'Video Editing': 10, 'Note Taking': 11,
            'Meeting Assistant': 12, 'Design Tool': 13, '3D Modeling': 14,
            'Animation': 15, 'Healthcare': 16, 'Education': 17, 'Finance': 18
        }
        
        # Use Label encoding for unknown domains
        self.df['domain_encoded'] = self.df['domain'].map(
            lambda x: domain_mapping.get(x, -1)
        ).fillna(-1)
        
        # Encode model_type
        model_type_mapping = {
            'DL': 0, 'ML': 1, 'GenAI': 2, 'Hybrid': 3
        }
        self.df['model_type_encoded'] = self.df['model_type'].map(
            lambda x: model_type_mapping.get(x, -1)
        )
        
        # Encode realtime_monitoring_status
        self.df['monitoring_encoded'] = self.df['realtime_monitoring_status'].map(
            {'Active': 1, 'Inactive': 0}
        )
        
        print("✓ Categorical features encoded")
        return self.df
    
    def extract_temporal_features(self):
        """Extract features from timestamps"""
        # Convert to datetime
        self.df['last_audit_timestamp'] = pd.to_datetime(self.df['last_audit_timestamp'])
        
        # Days since last audit
        current_date = datetime.now()
        self.df['days_since_audit'] = (current_date - self.df['last_audit_timestamp']).dt.days
        
        # Audit recency score (more recent = higher score)
        max_days = self.df['days_since_audit'].max()
        self.df['audit_recency_score'] = 1 - (self.df['days_since_audit'] / max_days)
        
        print("✓ Temporal features extracted")
        return self.df
    
    def create_composite_features(self):
        """Create advanced composite features"""
        # Total risk from individual components
        self.df['total_component_risk'] = (
            self.df['bias_risk'] + 
            self.df['privacy_risk'] + 
            self.df['transparency_risk']
        )
        
        # Data sensitivity index
        self.df['data_sensitivity_index'] = (
            self.df['uses_sensitive_data'] * 2 + 
            self.df['personal_data'] * 2
        )
        
        # Governance score
        self.df['governance_score'] = (
            self.df['transparency_level'] + 
            self.df['human_oversight']
        )
        
        # Risk per fairness unit
        self.df['risk_fairness_ratio'] = self.df['total_component_risk'] / self.df['fairness_audit_score']
        
        # Weighted risk score
        self.df['weighted_risk'] = (
            self.df['bias_risk'] * 0.4 + 
            self.df['privacy_risk'] * 0.4 + 
            self.df['transparency_risk'] * 0.2
        )
        
        print("✓ Composite features created")
        return self.df
    
    def prepare_features(self):
        """Prepare final feature set using ALL columns"""
        # Step 1: Encode categorical
        self.encode_categorical_features()
        
        # Step 2: Extract temporal features
        self.extract_temporal_features()
        
        # Step 3: Create composite features
        self.create_composite_features()
        
        # Define feature columns (using all available information)
        self.feature_columns = [
            # Original binary features
            'uses_sensitive_data',
            'personal_data',
            
            # Original scores (0-3 scale)
            'transparency_level',
            'human_oversight',
            'bias_risk',
            'privacy_risk',
            'transparency_risk',
            
            # Encoded categorical
            'domain_encoded',
            'model_type_encoded',
            'monitoring_encoded',
            
            # Fairness audit
            'fairness_audit_score',
            
            # Temporal features
            'days_since_audit',
            'audit_recency_score',
            
            # Composite features
            'total_component_risk',
            'data_sensitivity_index',
            'governance_score',
            'risk_fairness_ratio',
            'weighted_risk'
        ]
        
        print(f"\n✓ Final feature set prepared with {len(self.feature_columns)} features")
        print(f"Features: {self.feature_columns}")
        
        return self.feature_columns
    
    def get_feature_matrix(self):
        """Get feature matrix X and target y"""
        if self.feature_columns is None:
            self.prepare_features()
        
        X = self.df[self.feature_columns].values
        y = self.df['overall_risk_score'].values
        
        # Store metadata
        ai_names = self.df['ai_name'].values
        companies = self.df['company'].values
        
        return X, y, ai_names, companies
    
    def get_risk_level(self, score):
        """Convert numerical score to risk level"""
        if score >= 70:
            return "High"
        elif score >= 45:
            return "Medium"
        else:
            return "Low"
    
    def get_all_risk_levels(self):
        """Add risk level column to dataframe"""
        self.df['risk_level'] = self.df['overall_risk_score'].apply(self.get_risk_level)
        return self.df


if __name__ == "__main__":
    # Test the preprocessor
    preprocessor = DataPreprocessor("Eai database.xlsx")
    df = preprocessor.load_data()
    preprocessor.get_column_info()
    preprocessor.prepare_features()
    X, y, names, companies = preprocessor.get_feature_matrix()
    
    print(f"\nFeature matrix shape: {X.shape}")
    print(f"Target vector shape: {y.shape}")
    print(f"\nSample AI tools: {names[:5]}")
    print(f"Sample risk scores: {y[:5]}")
    print(f"Sample risk levels: {[preprocessor.get_risk_level(score) for score in y[:5]]}")
