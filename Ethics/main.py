"""
Main Runner Script for Ethical Risk Assessment Framework
This script trains the model and provides instructions for running the system
"""

import sys
import os


def print_banner(text):
    """Print formatted banner"""
    print("\n" + "="*70)
    print(text.center(70))
    print("="*70 + "\n")


def check_dependencies():
    """Check if all required packages are installed"""
    print_banner("CHECKING DEPENDENCIES")
    
    required_packages = [
        'pandas', 'numpy', 'sklearn', 'openpyxl', 'flask', 'flask_cors', 'joblib'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("\nInstall with: pip install " + " ".join(missing))
        return False
    
    print("\n✅ All dependencies installed!")
    return True


def train_model():
    """Train the ML model"""
    print_banner("TRAINING ML MODEL")
    
    try:
        from data_preprocessor import DataPreprocessor
        from model_trainer import train_and_save_model
        
        # Load and preprocess data
        preprocessor = DataPreprocessor("Eai database.xlsx")
        preprocessor.load_data()
        preprocessor.prepare_features()
        
        # Train model
        trainer, results = train_and_save_model(preprocessor)
        
        print("\n✅ Model training completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        return False


def test_system():
    """Test the complete system"""
    print_banner("TESTING SYSTEM")
    
    try:
        from data_preprocessor import DataPreprocessor
        from risk_scoring_engine import RiskScoringEngine
        from explanation_engine import ExplanationEngine
        from realtime_monitoring import RealTimeMonitoringSimulator
        import joblib
        
        # Load components
        print("Loading preprocessor...")
        preprocessor = joblib.load('data_preprocessor.pkl')
        
        print("Loading model...")
        model_data = joblib.load('risk_prediction_model.pkl')
        
        print("Initializing engines...")
        scoring_engine = RiskScoringEngine()
        explanation_engine = ExplanationEngine()
        realtime_simulator = RealTimeMonitoringSimulator()
        
        # Test on sample AI tool
        print("\nTesting on Pinecone...")
        row = preprocessor.df[preprocessor.df['ai_name'] == 'Pinecone'].iloc[0]
        
        # Calculate risk profile
        risk_profile = scoring_engine.calculate_detailed_risk_profile(row)
        print(f"✓ Risk Score: {risk_profile['overall_risk_score']}")
        print(f"✓ Risk Level: {risk_profile['risk_level']}")
        
        # Generate explanation
        explanation = explanation_engine.generate_full_explanation(risk_profile, row)
        print(f"✓ Generated {len(explanation['key_insights'])} key insights")
        print(f"✓ Generated {len(explanation['actionable_recommendations'])} recommendations")
        
        # Generate real-time report
        realtime_report = realtime_simulator.generate_realtime_report(row, risk_profile)
        print(f"✓ Generated real-time monitoring report")
        print(f"  Sentiment: {realtime_report['sentiment_analysis']['label']}")
        print(f"  News mentions: {realtime_report['news_monitoring']['total_mentions']}")
        
        print("\n✅ System test passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def show_instructions():
    """Show usage instructions"""
    print_banner("SYSTEM READY - USAGE INSTRUCTIONS")
    
    print("""
🎯 ETHICAL RISK ASSESSMENT FRAMEWORK IS READY!

📋 WHAT YOU HAVE:
   ✓ Dataset: 100 AI tools with 15 features each
   ✓ ML Model: Trained to predict ethical risk scores
   ✓ Risk Scoring Engine: Multi-dimensional risk assessment
   ✓ Explanation Engine: Interpretable AI explanations
   ✓ Real-time Monitoring: Simulated live data feeds
   ✓ Flask API Backend: RESTful web service
   ✓ HTML Frontend: User-friendly interface

🚀 TO START THE SYSTEM:

   Step 1: Start Backend Server
   ──────────────────────────────
   Command: python app.py
   
   This starts the API server at: http://localhost:5000
   
   Available API endpoints:
   • GET /api/tools              - List all AI tools
   • GET /api/tools/<name>       - Analyze specific AI tool
   • GET /api/statistics         - View dataset statistics
   • GET /api/search?q=<query>   - Search AI tools
   • GET /api/compare?tools=A,B  - Compare multiple tools

   Step 2: Open Frontend
   ──────────────────────────────
   Open index.html in your web browser
   
   Or use a simple HTTP server:
   Command: python -m http.server 8080
   
   Then visit: http://localhost:8080/index.html

📊 FEATURES:
   • Analyze ethical risks of 100 AI tools
   • Get detailed risk breakdowns (bias, privacy, transparency)
   • Receive actionable recommendations
   • View real-time monitoring simulations
   • Compare multiple AI systems
   • Search and filter capabilities

🔧 TECHNOLOGY STACK:
   • Backend: Python + Flask (REST API)
   • Machine Learning: scikit-learn (Random Forest)
   • Data Processing: pandas, numpy
   • Frontend: HTML5 + CSS3 + JavaScript
   • No deep learning frameworks - pure classical ML!

📝 EXAMPLE USAGE:
   
   1. Analyze ChatGPT:
      curl http://localhost:5000/api/tools/ChatGPT
   
   2. Get statistics:
      curl http://localhost:5000/api/statistics
   
   3. Search for tools:
      curl "http://localhost:5000/api/search?q=chat"

⚙️  SYSTEM ARCHITECTURE:
   
   User → Frontend (index.html)
            ↓
   Backend API (app.py - Flask)
            ↓
   ML Model + Risk Engines
            ↓
   Dataset (100 AI tools × 15 features)
            ↓
   Output: Risk Score + Explanation + Real-time Insights

🎉 READY TO USE!
    """)


def main():
    """Main entry point"""
    print_banner("ETHICAL RISK ASSESSMENT FRAMEWORK")
    print("Initializing system setup...\n")
    
    # Check if we're in the right directory
    if not os.path.exists('Eai database.xlsx'):
        print("❌ Error: 'Eai database.xlsx' not found!")
        print("Please run this script from the project directory.")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Train model if not already trained
    if not os.path.exists('risk_prediction_model.pkl'):
        print("\n📚 Training ML model for the first time...\n")
        if not train_model():
            sys.exit(1)
    else:
        print("\n✅ Model already trained (found risk_prediction_model.pkl)")
    
    # Test the system
    print("\n🧪 Running system tests...\n")
    if not test_system():
        print("\n⚠️  System tests failed, but you can still try to run the app.")
    
    # Show instructions
    show_instructions()


if __name__ == "__main__":
    main()
