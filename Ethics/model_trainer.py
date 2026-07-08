"""
ML Model Training Pipeline using scikit-learn
Predicts overall_risk_score using all 15 columns from dataset
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, Lasso
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import warnings
warnings.filterwarnings('ignore')


class RiskPredictionModel:
    """Machine Learning model for ethical risk prediction"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.training_history = {}
        
    def prepare_data(self, X, y):
        """Split and scale the data"""
        # Split: 80% train, 20% test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print(f"✓ Data split: {len(X_train)} train, {len(X_test)} test samples")
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def train_multiple_models(self, X, y):
        """Train multiple models and compare performance"""
        X_train, X_test, y_train, y_test = self.prepare_data(X, y)
        
        models = {
            'Random Forest': RandomForestRegressor(
                n_estimators=100, 
                max_depth=10,
                random_state=42,
                n_jobs=-1
            ),
            'Gradient Boosting': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                random_state=42
            ),
            'Ridge Regression': Ridge(alpha=1.0),
            'Lasso Regression': Lasso(alpha=0.1),
            'SVR': SVR(kernel='rbf', C=100, epsilon=0.1),
            'Neural Network': MLPRegressor(
                hidden_layer_sizes=(100, 50),
                max_iter=500,
                random_state=42
            )
        }
        
        results = {}
        
        print("\n" + "="*70)
        print("TRAINING MULTIPLE MODELS - PERFORMANCE COMPARISON")
        print("="*70)
        
        for name, model in models.items():
            print(f"\nTraining {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Metrics
            train_mse = mean_squared_error(y_train, y_pred_train)
            test_mse = mean_squared_error(y_test, y_pred_test)
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
            cv_mean = cv_scores.mean()
            cv_std = cv_scores.std()
            
            results[name] = {
                'model': model,
                'train_mse': train_mse,
                'test_mse': test_mse,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'test_mae': test_mae,
                'cv_r2_mean': cv_mean,
                'cv_r2_std': cv_std
            }
            
            print(f"  Test R²: {test_r2:.4f}")
            print(f"  Test MAE: {test_mae:.2f}")
            print(f"  CV R²: {cv_mean:.4f} (+/- {cv_std*2:.4f})")
        
        # Find best model based on test R²
        best_model_name = max(results, key=lambda x: results[x]['test_r2'])
        best_result = results[best_model_name]
        
        print("\n" + "="*70)
        print(f"✓ BEST MODEL: {best_model_name}")
        print(f"  Test R²: {best_result['test_r2']:.4f}")
        print(f"  Test MAE: {best_result['test_mae']:.2f}")
        print(f"  CV R²: {best_result['cv_r2_mean']:.4f}")
        print("="*70)
        
        # Store best model
        self.model = best_result['model']
        self.training_history = results
        
        return results, best_model_name
    
    def train_final_model(self, X, y, model_name='Random Forest'):
        """Train final model on all data"""
        print(f"\nTraining final model ({model_name}) on ALL {len(X)} samples...")
        
        if model_name == 'Random Forest':
            self.model = RandomForestRegressor(
                n_estimators=200,
                max_depth=12,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif model_name == 'Gradient Boosting':
            self.model = GradientBoostingRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
        
        # Scale data
        X_scaled = self.scaler.fit_transform(X)
        
        # Train on ALL data
        self.model.fit(X_scaled, y)
        
        # Evaluate on training data
        y_pred = self.model.predict(X_scaled)
        mse = mean_squared_error(y, y_pred)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        
        print(f"✓ Final Model Trained")
        print(f"  Training R²: {r2:.4f}")
        print(f"  Training MAE: {mae:.2f}")
        print(f"  Training MSE: {mse:.2f}")
        
        return self.model
    
    def predict(self, X):
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def predict_single(self, feature_vector):
        """Predict risk score for a single AI tool"""
        feature_vector = np.array(feature_vector).reshape(1, -1)
        prediction = self.predict(feature_vector)[0]
        return prediction
    
    def get_feature_importance(self, feature_names):
        """Get feature importance scores"""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            importance_df = list(zip(feature_names, importances))
            importance_df.sort(key=lambda x: x[1], reverse=True)
            
            print("\n" + "="*70)
            print("FEATURE IMPORTANCE (Top factors affecting risk score)")
            print("="*70)
            for i, (name, imp) in enumerate(importance_df, 1):
                bar = "█" * int(imp * 20)
                print(f"{i:2d}. {name:30s} {bar} {imp:.4f}")
            print("="*70)
            
            return importance_df
        else:
            print("Feature importance not available for this model")
            return None
    
    def save_model(self, filepath='risk_prediction_model.pkl'):
        """Save trained model to disk"""
        if self.model is None:
            raise ValueError("No model to save!")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }
        
        joblib.dump(model_data, filepath)
        print(f"✓ Model saved to {filepath}")
    
    def load_model(self, filepath='risk_prediction_model.pkl'):
        """Load trained model from disk"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data.get('feature_columns', None)
        print(f"✓ Model loaded from {filepath}")
        return self.model


def train_and_save_model(preprocessor, model_name='Random Forest'):
    """Complete training pipeline"""
    print("\n" + "="*70)
    print("STARTING ML MODEL TRAINING PIPELINE")
    print("="*70)
    
    # Get data
    X, y, ai_names, companies = preprocessor.get_feature_matrix()
    preprocessor.feature_columns = preprocessor.feature_columns
    
    # Train models
    trainer = RiskPredictionModel()
    trainer.feature_columns = preprocessor.feature_columns
    
    # Compare multiple models
    results, best_model = trainer.train_multiple_models(X, y)
    
    # Train final model on all data
    trainer.train_final_model(X, y, model_name=best_model)
    
    # Get feature importance
    trainer.get_feature_importance(preprocessor.feature_columns)
    
    # Save model
    trainer.save_model('risk_prediction_model.pkl')
    
    # Also save preprocessor
    import joblib
    joblib.dump(preprocessor, 'data_preprocessor.pkl')
    print("✓ Preprocessor saved")
    
    return trainer, results


if __name__ == "__main__":
    # Import preprocessor
    from data_preprocessor import DataPreprocessor
    
    # Load and preprocess data
    preprocessor = DataPreprocessor("Eai database.xlsx")
    preprocessor.load_data()
    preprocessor.prepare_features()
    
    # Train model
    trainer, results = train_and_save_model(preprocessor)
    
    # Test prediction
    print("\n" + "="*70)
    print("TESTING PREDICTIONS")
    print("="*70)
    
    # Test on first 5 samples
    X_test, y_test, _, _ = preprocessor.get_feature_matrix()
    predictions = trainer.predict(X_test[:5])
    
    print(f"\n{'AI Tool':<25} | {'Actual':<10} | {'Predicted':<10} | {'Error':<10}")
    print("-"*65)
    
    for i in range(5):
        ai_name = preprocessor.df.iloc[i]['ai_name']
        actual = y_test[i]
        pred = predictions[i]
        error = abs(actual - pred)
        print(f"{ai_name:<25} | {actual:<10.2f} | {pred:<10.2f} | {error:<10.2f}")
