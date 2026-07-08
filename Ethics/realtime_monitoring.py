"""
Real-time Monitoring Simulation Module
Simulates real-time data feeds and sentiment analysis for ethical risk monitoring
"""

import random
import numpy as np
from datetime import datetime, timedelta


class RealTimeMonitoringSimulator:
    """
    Simulates real-time monitoring of AI systems by generating:
    - News mentions
    - Sentiment analysis
    - Incident reports
    - Risk trend updates
    
    This adds dynamic, time-sensitive data to static dataset
    """
    
    def __init__(self):
        self.sentiment_labels = {
            'very_positive': {'range': (0.8, 1.0), 'color': '#28A745'},
            'positive': {'range': (0.6, 0.8), 'color': '#5CB85C'},
            'neutral': {'range': (0.4, 0.6), 'color': '#F0AD4E'},
            'negative': {'range': (0.2, 0.4), 'color': '#FF9800'},
            'very_negative': {'range': (0.0, 0.2), 'color': '#DC3545'}
        }
        
        # Simulated news sources
        self.news_sources = [
            "TechCrunch", "Wired", "The Verge", "MIT Technology Review",
            "Ars Technica", "ZDNet", "VentureBeat", "Reuters Technology"
        ]
        
        # Ethical concern keywords
        self.concern_keywords = [
            "bias", "discrimination", "privacy breach", "data leak",
            "unethical AI", "algorithmic harm", "fairness concern",
            "transparency issue", "accountability gap", "surveillance"
        ]
        
        self.positive_keywords = [
            "ethical AI", "responsible AI", "fairness improvement",
            "transparency initiative", "privacy-preserving", "audit passed"
        ]
    
    def generate_sentiment_score(self, base_risk_score):
        """
        Generate sentiment score inversely related to risk
        Higher risk → Lower sentiment (more negative coverage)
        """
        # Base sentiment inversely correlated with risk
        base_sentiment = 1.0 - (base_risk_score / 100.0)
        
        # Add randomness
        noise = random.uniform(-0.15, 0.15)
        sentiment = max(0.0, min(1.0, base_sentiment + noise))
        
        return round(sentiment, 3)
    
    def get_sentiment_label(self, score):
        """Convert numerical sentiment to label"""
        for label, config in self.sentiment_labels.items():
            if config['range'][0] <= score <= config['range'][1]:
                return label
        return 'neutral'
    
    def generate_news_mentions(self, ai_name, company, sentiment_score):
        """Generate simulated news mentions"""
        num_mentions = random.randint(2, 8)
        
        # Adjust mention tone based on sentiment
        if sentiment_score < 0.3:
            negative_ratio = 0.7
        elif sentiment_score < 0.5:
            negative_ratio = 0.4
        else:
            negative_ratio = 0.2
        
        mentions = []
        for _ in range(num_mentions):
            is_negative = random.random() < negative_ratio
            
            if is_negative:
                keyword = random.choice(self.concern_keywords)
                headline_templates = [
                    f"{ai_name} faces {keyword} allegations",
                    f"Concerns raised about {company}'s {ai_name} over {keyword}",
                    f"Experts warn about {keyword} risks in {ai_name}",
                    f"{ai_name} under scrutiny for potential {keyword}"
                ]
            else:
                keyword = random.choice(self.positive_keywords)
                headline_templates = [
                    f"{company} improves {keyword} in {ai_name}",
                    f"{ai_name} praised for {keyword} measures",
                    f"Positive steps: {ai_name} adopts {keyword}",
                    f"{company} commits to {keyword} with {ai_name}"
                ]
            
            mentions.append({
                'source': random.choice(self.news_sources),
                'headline': random.choice(headline_templates),
                'timestamp': (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                'sentiment': 'negative' if is_negative else 'positive',
                'url': f"https://example.com/news/{random.randint(1000, 9999)}"
            })
        
        return mentions
    
    def generate_incident_reports(self, ai_name, risk_level):
        """Generate simulated incident reports"""
        # Higher risk = more incidents
        if risk_level == "High":
            num_incidents = random.randint(1, 4)
        elif risk_level == "Medium":
            num_incidents = random.randint(0, 2)
        else:
            num_incidents = random.randint(0, 1)
        
        incidents = []
        incident_types = [
            "Bias incident reported",
            "Privacy complaint filed",
            "Discriminatory output detected",
            "Data access violation",
            "Transparency concern raised",
            "Ethics complaint submitted"
        ]
        
        severity_levels = ["Low", "Medium", "High", "Critical"]
        
        for i in range(num_incidents):
            severity = random.choices(
                severity_levels,
                weights=[0.3, 0.4, 0.2, 0.1] if risk_level != "High" else [0.1, 0.3, 0.4, 0.2]
            )[0]
            
            incidents.append({
                'incident_id': f"INC-{random.randint(10000, 99999)}",
                'type': random.choice(incident_types),
                'severity': severity,
                'date': (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d'),
                'status': random.choice(['Open', 'Under Investigation', 'Resolved']),
                'description': f"Reported issue with {ai_name}: {random.choice(incident_types).lower()}"
            })
        
        return incidents
    
    def calculate_risk_trend(self, current_score, sentiment_score, num_incidents):
        """Calculate whether risk is increasing or decreasing"""
        trend_indicators = []
        
        # Sentiment impact
        if sentiment_score < 0.4:
            trend_indicators.append('increasing')
        elif sentiment_score > 0.7:
            trend_indicators.append('decreasing')
        
        # Incidents impact
        if num_incidents >= 3:
            trend_indicators.append('increasing')
        elif num_incidents == 0:
            trend_indicators.append('stable')
        
        # Determine overall trend
        if trend_indicators.count('increasing') > trend_indicators.count('decreasing'):
            trend = 'increasing'
            change = random.uniform(2, 8)
        elif trend_indicators.count('decreasing') > trend_indicators.count('increasing'):
            trend = 'decreasing'
            change = random.uniform(-8, -2)
        else:
            trend = 'stable'
            change = random.uniform(-2, 2)
        
        projected_score = current_score + change
        projected_score = max(0, min(100, projected_score))
        
        return {
            'current_trend': trend,
            'projected_score': round(projected_score, 2),
            'change_percentage': round(change, 2),
            'confidence': round(random.uniform(0.65, 0.95), 2)
        }
    
    def generate_social_media_metrics(self, ai_name, sentiment_score):
        """Generate simulated social media metrics"""
        base_volume = random.randint(100, 5000)
        
        # Negative sentiment drives more discussion
        if sentiment_score < 0.4:
            volume_multiplier = 2.5
        elif sentiment_score > 0.7:
            volume_multiplier = 1.2
        else:
            volume_multiplier = 1.0
        
        return {
            'mention_count': int(base_volume * volume_multiplier),
            'twitter_mentions': random.randint(50, 2000),
            'reddit_discussions': random.randint(20, 500),
            'linkedin_posts': random.randint(30, 800),
            'sentiment_breakdown': {
                'positive': round(sentiment_score * 100, 1),
                'neutral': round((1 - abs(sentiment_score - 0.5)) * 100, 1),
                'negative': round((1 - sentiment_score) * 100, 1)
            }
        }
    
    def generate_realtime_report(self, row, risk_profile):
        """
        Generate comprehensive real-time monitoring report
        This simulates what would come from live data feeds
        """
        ai_name = row['ai_name']
        company = row['company']
        risk_level = risk_profile['risk_level']
        current_score = risk_profile['overall_risk_score']
        
        # Generate sentiment
        sentiment_score = self.generate_sentiment_score(current_score)
        sentiment_label = self.get_sentiment_label(sentiment_score)
        
        # Generate news
        news_mentions = self.generate_news_mentions(ai_name, company, sentiment_score)
        
        # Generate incidents
        incidents = self.generate_incident_reports(ai_name, risk_level)
        
        # Calculate trend
        risk_trend = self.calculate_risk_trend(current_score, sentiment_score, len(incidents))
        
        # Social media metrics
        social_metrics = self.generate_social_media_metrics(ai_name, sentiment_score)
        
        # Compile full report
        realtime_report = {
            'timestamp': datetime.now().isoformat(),
            'ai_name': ai_name,
            'company': company,
            
            'sentiment_analysis': {
                'score': sentiment_score,
                'label': sentiment_label,
                'color': self.sentiment_labels[sentiment_label]['color'],
                'interpretation': self._interpret_sentiment(sentiment_label)
            },
            
            'news_monitoring': {
                'total_mentions': len(news_mentions),
                'recent_headlines': news_mentions[:3],  # Top 3
                'all_mentions': news_mentions
            },
            
            'incident_tracking': {
                'active_incidents': len([i for i in incidents if i['status'] != 'Resolved']),
                'total_incidents': len(incidents),
                'incidents': incidents
            },
            
            'risk_trend': risk_trend,
            
            'social_mediabuzz': social_metrics,
            
            'alerts': self._generate_alerts(risk_level, sentiment_label, len(incidents)),
            
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return realtime_report
    
    def _interpret_sentiment(self, label):
        """Provide interpretation of sentiment label"""
        interpretations = {
            'very_positive': "Public perception is highly favorable. Minimal ethical concerns raised.",
            'positive': "Public perception is generally favorable with minor concerns.",
            'neutral': "Mixed public perception with balanced positive and negative coverage.",
            'negative': "Public perception is concerning. Notable ethical issues being discussed.",
            'very_negative': "CRITICAL: Public perception is highly negative. Significant ethical controversies active."
        }
        return interpretations.get(label, "Unable to determine sentiment")
    
    def _generate_alerts(self, risk_level, sentiment_label, incident_count):
        """Generate real-time alerts based on conditions"""
        alerts = []
        
        if risk_level == "High":
            alerts.append({
                'level': 'HIGH',
                'type': 'Risk Score',
                'message': 'AI system classified as HIGH RISK - immediate review recommended'
            })
        
        if sentiment_label in ['negative', 'very_negative']:
            alerts.append({
                'level': 'WARNING',
                'type': 'Sentiment Alert',
                'message': f'Negative public sentiment detected ({sentiment_label})'
            })
        
        if incident_count >= 2:
            alerts.append({
                'level': 'CRITICAL' if incident_count >= 3 else 'WARNING',
                'type': 'Incident Alert',
                'message': f'{incident_count} active incidents require attention'
            })
        
        return alerts


if __name__ == "__main__":
    # Test the simulator
    from data_preprocessor import DataPreprocessor
    from risk_scoring_engine import RiskScoringEngine
    
    preprocessor = DataPreprocessor("Eai database.xlsx")
    preprocessor.load_data()
    preprocessor.prepare_features()
    
    scoring_engine = RiskScoringEngine()
    simulator = RealTimeMonitoringSimulator()
    
    # Test on first AI tool
    row = preprocessor.df.iloc[0]
    risk_profile = scoring_engine.calculate_detailed_risk_profile(row)
    realtime_report = simulator.generate_realtime_report(row, risk_profile)
    
    print("\n" + "="*70)
    print("REAL-TIME MONITORING REPORT")
    print("="*70)
    print(f"AI System: {realtime_report['ai_name']}")
    print(f"Generated: {realtime_report['timestamp']}")
    print("="*70)
    
    print(f"\n📊 SENTIMENT ANALYSIS")
    print(f"Score: {realtime_report['sentiment_analysis']['score']}")
    print(f"Label: {realtime_report['sentiment_analysis']['label']}")
    print(f"Interpretation: {realtime_report['sentiment_analysis']['interpretation']}")
    
    print(f"\n📰 NEWS MENTIONS")
    print(f"Total: {realtime_report['news_monitoring']['total_mentions']}")
    for headline in realtime_report['news_monitoring']['recent_headlines']:
        print(f"  • {headline['headline']}")
    
    print(f"\n⚠️ INCIDENTS")
    print(f"Active: {realtime_report['incident_tracking']['active_incidents']}")
    print(f"Total: {realtime_report['incident_tracking']['total_incidents']}")
    
    print(f"\n📈 RISK TREND")
    print(f"Trend: {realtime_report['risk_trend']['current_trend']}")
    print(f"Projected Score: {realtime_report['risk_trend']['projected_score']}")
    print(f"Change: {realtime_report['risk_trend']['change_percentage']}%")
    
    print(f"\n🔔 ALERTS")
    for alert in realtime_report['alerts']:
        print(f"  [{alert['level']}] {alert['message']}")
    
    print("="*70)
