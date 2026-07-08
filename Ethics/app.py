"""
Flask REST API Backend for Ethical Risk Assessment Framework
Integrates all components: ML Model, Risk Scoring, Explanation Engine, Real-time Monitoring
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime

# Import our modules
from data_preprocessor import DataPreprocessor
from risk_scoring_engine import RiskScoringEngine
from explanation_engine import ExplanationEngine
from realtime_monitoring import RealTimeMonitoringSimulator


app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend


def convert_to_serializable(obj):
    """Convert numpy/pandas types to Python native types for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif isinstance(obj, (pd.Series,)):
        return obj.tolist()
    return obj


class EthicsAssessmentAPI:
    """Main API handler integrating all components"""
    
    def __init__(self):
        print("Initializing Ethical Risk Assessment API...")
        
        # Load preprocessor and model
        try:
            self.preprocessor = joblib.load('data_preprocessor.pkl')
            self.model_data = joblib.load('risk_prediction_model.pkl')
            self.model = self.model_data['model']
            self.scaler = self.model_data['scaler']
            print("✓ Model and preprocessor loaded")
        except FileNotFoundError:
            print("⚠️ Model files not found. Please train the model first.")
            self.preprocessor = None
            self.model = None
            self.scaler = None
        
        # Initialize engines
        self.scoring_engine = RiskScoringEngine()
        self.explanation_engine = ExplanationEngine()
        self.realtime_simulator = RealTimeMonitoringSimulator()
        
        # Load dataset
        self.df = pd.read_excel('Eai database.xlsx')
        print(f"✓ Dataset loaded: {len(self.df)} AI tools")
    
    def get_ai_tool_by_name(self, ai_name):
        """Find AI tool in dataset by name"""
        matching_rows = self.df[self.df['ai_name'].str.lower() == ai_name.lower()]
        
        if len(matching_rows) == 0:
            return None
        
        return matching_rows.iloc[0]
    
    def find_similar_tools(self, ai_name, top_n=6):
        """Find similar AI tools when requested tool is not in dataset"""
        ai_name_lower = ai_name.lower()
        keywords = ai_name_lower.split()
        
        similar_tools = []
        
        for idx, row in self.df.iterrows():
            score = 0
            reasons = []
            
            # 1. Exact or partial name match (highest priority)
            if ai_name_lower in row['ai_name'].lower():
                score += 20
                reasons.append('name match')
            elif row['ai_name'].lower() in ai_name_lower:
                score += 15
                reasons.append('name contains')
            
            # 2. Company match
            if ai_name_lower in row['company'].lower():
                score += 15
                reasons.append('company match')
            elif row['company'].lower() in ai_name_lower:
                score += 10
                reasons.append('company contains')
            
            # 3. Domain/category match
            if ai_name_lower in row['domain'].lower():
                score += 12
                reasons.append('domain match')
            
            # 4. Keyword matching (for each word in search)
            for keyword in keywords:
                if len(keyword) <= 2:
                    continue
                    
                # Check in AI name
                if keyword in row['ai_name'].lower():
                    score += 8
                    reasons.append(f'keyword "{keyword}" in name')
                
                # Check in company
                if keyword in row['company'].lower():
                    score += 5
                    reasons.append(f'keyword "{keyword}" in company')
                
                # Check in domain
                if keyword in row['domain'].lower():
                    score += 4
                    reasons.append(f'keyword "{keyword}" in domain')
                
                # Check in model type
                if keyword in row['model_type'].lower():
                    score += 3
                    reasons.append(f'keyword "{keyword}" in model type')
            
            # 5. Category-based matching for common AI types
            category_hints = {
                'chat': ['chatbot', 'chat', 'assistant', 'general purpose'],
                'code': ['coding', 'code', 'developer', 'github'],
                'image': ['image', 'picture', 'photo', 'design', 'art'],
                'video': ['video', 'animation', 'movie'],
                'voice': ['voice', 'audio', 'speech', 'music'],
                'search': ['search', 'research'],
                'writing': ['writing', 'text', 'content'],
                'ai': ['ai', 'ml', 'dl', 'genai', 'machine learning', 'deep learning']
            }
            
            for category, category_keywords in category_hints.items():
                if any(cat_key in ai_name_lower for cat_key in category_keywords):
                    # Check if this tool belongs to same category
                    domain_lower = row['domain'].lower()
                    if any(cat_key in domain_lower for cat_key in category_keywords):
                        score += 6
                        reasons.append(f'same category: {category}')
            
            # Only include if there's some relevance
            if score > 0:
                risk_profile = self.scoring_engine.calculate_detailed_risk_profile(row)
                similar_tools.append({
                    'name': row['ai_name'],
                    'company': row['company'],
                    'domain': row['domain'],
                    'risk_score': risk_profile['overall_risk_score'],
                    'risk_level': risk_profile['risk_level'],
                    'relevance_score': score,
                    'match_reasons': reasons[:3]  # Top 3 reasons
                })
        
        # Sort by relevance score
        similar_tools.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # If no similar tools found, return popular/random tools as fallback
        if len(similar_tools) == 0:
            # Get diverse sample from different risk levels
            high_risk = self.df[self.df['overall_risk_score'] >= 60].sample(min(2, len(self.df[self.df['overall_risk_score'] >= 60])), random_state=42)
            med_risk = self.df[(self.df['overall_risk_score'] >= 40) & (self.df['overall_risk_score'] < 60)].sample(min(2, len(self.df[(self.df['overall_risk_score'] >= 40) & (self.df['overall_risk_score'] < 60)])), random_state=42)
            low_risk = self.df[self.df['overall_risk_score'] < 40].sample(min(2, len(self.df[self.df['overall_risk_score'] < 40])), random_state=42)
            
            fallback_tools = pd.concat([high_risk, med_risk, low_risk]).drop_duplicates()
            
            for idx, row in fallback_tools.iterrows():
                risk_profile = self.scoring_engine.calculate_detailed_risk_profile(row)
                similar_tools.append({
                    'name': row['ai_name'],
                    'company': row['company'],
                    'domain': row['domain'],
                    'risk_score': risk_profile['overall_risk_score'],
                    'risk_level': risk_profile['risk_level'],
                    'relevance_score': 0,
                    'match_reasons': ['Popular tool from dataset']
                })
        
        return similar_tools[:top_n]
    
    def analyze_ai_tool(self, ai_name):
        """
        Complete analysis of an AI tool
        Returns comprehensive risk assessment
        """
        # Get AI tool data
        row = self.get_ai_tool_by_name(ai_name)
        
        if row is None:
            return None
        
        # 1. Calculate risk profile using scoring engine
        risk_profile = self.scoring_engine.calculate_detailed_risk_profile(row)
        
        # 2. Generate ML prediction (if model available)
        ml_prediction = None
        if self.model is not None and self.preprocessor is not None:
            # Find index in preprocessed data
            idx = self.df[self.df['ai_name'] == row['ai_name']].index[0]
            
            # Prepare features
            X_all, y_all, _, _ = self.preprocessor.get_feature_matrix()
            X_sample = X_all[idx].reshape(1, -1)
            X_scaled = self.scaler.transform(X_sample)
            
            # Predict
            predicted_score = self.model.predict(X_scaled)[0]
            
            ml_prediction = {
                'predicted_score': round(predicted_score, 2),
                'actual_score': row['overall_risk_score'],
                'confidence': 'high' if abs(predicted_score - row['overall_risk_score']) < 5 else 'medium',
                'model_accuracy': self._calculate_model_accuracy()
            }
        
        # 3. Generate explanations
        explanation = self.explanation_engine.generate_full_explanation(risk_profile, row)
        
        # 4. Generate real-time monitoring report
        realtime_report = self.realtime_simulator.generate_realtime_report(row, risk_profile)
        
        # 5. Compile complete assessment
        assessment = {
            'timestamp': datetime.now().isoformat(),
            'ai_system': {
                'name': row['ai_name'],
                'company': row['company'],
                'domain': row['domain'],
                'model_type': row['model_type'],
                'description': f"{row['ai_name']} by {row['company']} - {row['domain']}"
            },
            
            'risk_assessment': {
                'overall_score': risk_profile['overall_risk_score'],
                'risk_level': risk_profile['risk_level'],
                'risk_color': risk_profile['risk_color'],
                
                'component_breakdown': risk_profile['component_breakdown'],
                
                'contributing_factors': risk_profile['contributing_factors']
            },
            
            'ml_prediction': ml_prediction,
            
            'explanation': {
                'summary': explanation['summary'],
                'key_insights': explanation['key_insights'],
                'critical_concerns': explanation['detailed_explanations']['critical_concerns'],
                'moderate_concerns': explanation['detailed_explanations']['moderate_concerns'],
                'positive_aspects': explanation['detailed_explanations']['positive_aspects'],
                'recommendations': explanation['actionable_recommendations']
            },
            
            'realtime_insights': {
                'sentiment': realtime_report['sentiment_analysis'],
                'news_mentions': realtime_report['news_monitoring']['total_mentions'],
                'active_incidents': realtime_report['incident_tracking']['active_incidents'],
                'risk_trend': realtime_report['risk_trend'],
                'social_buzz': realtime_report['social_mediabuzz'],
                'alerts': realtime_report['alerts']
            },
            
            'dataset_comparison': self.scoring_engine.compare_to_dataset_average(
                risk_profile['overall_risk_score']
            )
        }
        
        return assessment
    
    def _calculate_model_accuracy(self):
        """Calculate model accuracy on full dataset"""
        if self.model is None or self.preprocessor is None:
            return None
        
        X, y, _, _ = self.preprocessor.get_feature_matrix()
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        mae = np.mean(np.abs(predictions - y))
        r2 = 1 - (np.sum((y - predictions)**2) / np.sum((y - np.mean(y))**2))
        
        return {
            'mae': round(mae, 2),
            'r2': round(r2, 4)
        }
    
    def list_all_ai_tools(self):
        """Get list of all AI tools with basic info"""
        tools = []
        
        for idx, row in self.df.iterrows():
            risk_profile = self.scoring_engine.calculate_detailed_risk_profile(row)
            
            tools.append({
                'name': row['ai_name'],
                'company': row['company'],
                'domain': row['domain'],
                'risk_score': risk_profile['overall_risk_score'],
                'risk_level': risk_profile['risk_level'],
                'model_type': row['model_type']
            })
        
        # Sort by risk score (highest first)
        tools.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return tools
    
    def get_statistics(self):
        """Get dataset statistics"""
        risk_scores = self.df['overall_risk_score'].values
        
        return {
            'total_ai_tools': len(self.df),
            'risk_distribution': {
                'high': int((self.df['overall_risk_score'] >= 70).sum()),
                'medium': int(((self.df['overall_risk_score'] >= 45) & 
                              (self.df['overall_risk_score'] < 70)).sum()),
                'low': int((self.df['overall_risk_score'] < 45).sum())
            },
            'average_risk_score': round(risk_scores.mean(), 2),
            'median_risk_score': round(np.median(risk_scores), 2),
            'std_deviation': round(risk_scores.std(), 2),
            'min_risk_score': float(risk_scores.min()),
            'max_risk_score': float(risk_scores.max()),
            'domains': self.df['domain'].unique().tolist(),
            'companies': self.df['company'].unique().tolist()
        }


# Initialize API handler
api_handler = EthicsAssessmentAPI()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Ethical Risk Assessment API'
    })


@app.route('/api/tools', methods=['GET'])
def list_tools():
    """List all AI tools"""
    global api_handler
    tools = api_handler.list_all_ai_tools()
    return jsonify(convert_to_serializable({
        'count': len(tools),
        'tools': tools
    }))


@app.route('/api/tools/<ai_name>', methods=['GET'])
def get_tool_details(ai_name):
    """Get detailed risk assessment for a specific AI tool"""
    global api_handler
    assessment = api_handler.analyze_ai_tool(ai_name)
    
    if assessment is None:
        # Tool not found - return similar tools
        similar_tools = api_handler.find_similar_tools(ai_name)
        
        return jsonify(convert_to_serializable({
            'error': 'not_found',
            'message': f'AI tool "{ai_name}" is not available in our dataset',
            'searched_name': ai_name,
            'similar_tools': similar_tools,
            'suggestion': 'Try one of these similar AI tools or search for another'
        })), 404
    
    return jsonify(convert_to_serializable(assessment))


@app.route('/api/analyze/<ai_name>', methods=['GET'])
def analyze_tool(ai_name):
    """Analyze AI tool (alias for get_tool_details)"""
    return get_tool_details(ai_name)


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get dataset statistics"""
    global api_handler
    stats = api_handler.get_statistics()
    return jsonify(convert_to_serializable(stats))


@app.route('/api/search', methods=['GET'])
def search_tools():
    """Search AI tools by keyword"""
    global api_handler
    query = request.args.get('q', '').lower()
    
    if not query:
        return jsonify({'error': 'Search query required'}), 400
    
    results = []
    for idx, row in api_handler.df.iterrows():
        if (query in row['ai_name'].lower() or 
            query in row['company'].lower() or 
            query in row['domain'].lower()):
            
            risk_profile = api_handler.scoring_engine.calculate_detailed_risk_profile(row)
            results.append({
                'name': row['ai_name'],
                'company': row['company'],
                'domain': row['domain'],
                'risk_score': risk_profile['overall_risk_score'],
                'risk_level': risk_profile['risk_level']
            })
    
    return jsonify({
        'query': query,
        'results_count': len(results),
        'results': results[:20]  # Limit to 20 results
    })


@app.route('/api/compare', methods=['GET'])
def compare_tools():
    """Compare multiple AI tools"""
    global api_handler
    tools_param = request.args.get('tools', '')
    
    if not tools_param:
        return jsonify({'error': 'Tools parameter required'}), 400
    
    tool_names = [t.strip() for t in tools_param.split(',')]
    
    comparisons = []
    for tool_name in tool_names:
        assessment = api_handler.analyze_ai_tool(tool_name)
        if assessment:
            comparisons.append(assessment)
    
    return jsonify({
        'compared_count': len(comparisons),
        'comparisons': comparisons
    })


@app.route('/api/high-risk', methods=['GET'])
def get_high_risk_tools():
    """Get high-risk AI tools"""
    global api_handler
    tools = api_handler.list_all_ai_tools()
    high_risk = [t for t in tools if t['risk_level'] == 'High']
    
    return jsonify({
        'count': len(high_risk),
        'tools': high_risk
    })


@app.route('/api/recommendations/<ai_name>', methods=['GET'])
def get_recommendations(ai_name):
    """Get recommendations for improving ethical risks"""
    global api_handler
    assessment = api_handler.analyze_ai_tool(ai_name)
    
    if assessment is None:
        return jsonify({'error': f'AI tool "{ai_name}" not found'}), 404
    
    return jsonify({
        'ai_name': ai_name,
        'current_risk_score': assessment['risk_assessment']['overall_score'],
        'current_risk_level': assessment['risk_assessment']['risk_level'],
        'recommendations': assessment['explanation']['recommendations']
    })


if __name__ == '__main__':
    print("\n" + "="*70)
    print("STARTING ETHICAL RISK ASSESSMENT API SERVER")
    print("="*70)
    print("\nServer will start at: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET /api/health           - Health check")
    print("  GET /api/tools            - List all AI tools")
    print("  GET /api/tools/<name>     - Get detailed assessment")
    print("  GET /api/statistics       - Get dataset statistics")
    print("  GET /api/search?q=<query> - Search tools")
    print("  GET /api/compare?tools=A,B - Compare tools")
    print("  GET /api/high-risk        - Get high-risk tools")
    print("="*70 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
