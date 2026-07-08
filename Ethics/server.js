const express = require('express');
const cors = require('cors');
const path = require('path');
const DataPreprocessor = require('./data-preprocessor');
const RiskScoringEngine = require('./risk-scoring-engine');
const ExplanationEngine = require('./explanation-engine');
const RealTimeMonitoringSimulator = require('./realtime-monitoring-simulator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize components
console.log('\n' + '='.repeat(70));
console.log('ETHICAL RISK ASSESSMENT FRAMEWORK - NODE.JS VERSION');
console.log('='.repeat(70) + '\n');

let preprocessor, riskScorer, explanationEngine, realtimeMonitor;
let initialized = false;

// Initialize system
function initializeSystem() {
    try {
        console.log('🔧 Initializing system components...\n');

        // Initialize data preprocessor
        const dbPath = path.join(__dirname, 'Eai database.xlsx');
        preprocessor = new DataPreprocessor(dbPath);
        preprocessor.loadData();
        preprocessor.prepareFeatures();
        console.log('✓ Data Preprocessor initialized');

        // Initialize engines
        riskScorer = new RiskScoringEngine();
        console.log('✓ Risk Scoring Engine initialized');

        explanationEngine = new ExplanationEngine();
        console.log('✓ Explanation Engine initialized');

        realtimeMonitor = new RealTimeMonitoringSimulator();
        console.log('✓ Real-time Monitoring Simulator initialized');

        initialized = true;
        console.log('\n✅ System initialization complete!\n');
        return true;
    } catch (error) {
        console.error(`\n❌ Initialization error: ${error.message}`);
        console.error(error);
        return false;
    }
}

// Helper function to convert data types
function convertToSerializable(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(convertToSerializable);
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number') {
            result[key] = Number.isNaN(value) ? null : value;
        } else if (typeof value === 'object') {
            result[key] = convertToSerializable(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'operational',
        initialized: initialized,
        timestamp: new Date().toISOString()
    });
});

// Get all AI tools
app.get('/api/tools', (req, res) => {
    try {
        if (!initialized) {
            return res.status(503).json({ error: 'System not initialized' });
        }

        const tools = preprocessor.getAllTools();
        res.json({
            total: tools.length,
            tools: tools.map(tool => ({
                ai_name: tool.ai_name,
                company: tool.company,
                domain: tool.domain,
                model_type: tool.model_type
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    try {
        if (!initialized) {
            return res.status(503).json({ error: 'System not initialized' });
        }

        const tools = preprocessor.getAllTools();
        const riskScores = tools.map(tool => {
            const profile = riskScorer.calculateDetailedRiskProfile(tool);
            return profile.overall_risk_score;
        });

        const avgScore = (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(2);
        const maxScore = Math.max(...riskScores).toFixed(2);
        const minScore = Math.min(...riskScores).toFixed(2);

        const domainCounts = {};
        tools.forEach(tool => {
            domainCounts[tool.domain] = (domainCounts[tool.domain] || 0) + 1;
        });

        res.json({
            total_tools: tools.length,
            average_risk_score: parseFloat(avgScore),
            max_risk_score: parseFloat(maxScore),
            min_risk_score: parseFloat(minScore),
            domains: domainCounts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze specific AI tool
app.get('/api/tools/:name', (req, res) => {
    try {
        if (!initialized) {
            return res.status(503).json({ error: 'System not initialized' });
        }

        const toolName = req.params.name;
        const tool = preprocessor.getToolByName(toolName);

        if (!tool) {
            return res.status(404).json({ error: `AI tool '${toolName}' not found` });
        }

        // Calculate risk profile
        const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);

        // Generate explanation
        const explanation = explanationEngine.generateFullExplanation(riskProfile, tool);

        // Generate real-time report
        const realtimeReport = realtimeMonitor.generateRealtimeReport(tool, riskProfile);

        res.json({
            ai_system: {
                name: tool.ai_name,
                company: tool.company,
                domain: tool.domain,
                model_type: tool.model_type
            },
            risk_assessment: riskProfile,
            explanation: explanation,
            realtime_monitoring: realtimeReport,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search AI tools
app.get('/api/search', (req, res) => {
    try {
        if (!initialized) {
            return res.status(503).json({ error: 'System not initialized' });
        }

        const query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({ error: 'Search query required' });
        }

        const results = preprocessor.searchTools(query);
        const analyzed = results.map(tool => {
            const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);
            return {
                ai_name: tool.ai_name,
                company: tool.company,
                domain: tool.domain,
                risk_score: riskProfile.overall_risk_score,
                risk_level: riskProfile.risk_level
            };
        });

        res.json({
            query: query,
            total_results: analyzed.length,
            results: analyzed
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compare multiple tools
app.get('/api/compare', (req, res) => {
    try {
        if (!initialized) {
            return res.status(503).json({ error: 'System not initialized' });
        }

        const toolsParam = req.query.tools;
        if (!toolsParam) {
            return res.status(400).json({ error: 'tools parameter required (comma-separated names)' });
        }

        const toolNames = toolsParam.split(',').map(name => name.trim());
        const comparison = [];

        toolNames.forEach(toolName => {
            const tool = preprocessor.getToolByName(toolName);
            if (tool) {
                const riskProfile = riskScorer.calculateDetailedRiskProfile(tool);
                comparison.push({
                    ai_name: tool.ai_name,
                    company: tool.company,
                    domain: tool.domain,
                    risk_score: riskProfile.overall_risk_score,
                    risk_level: riskProfile.risk_level,
                    components: riskProfile.component_scores
                });
            }
        });

        res.json({
            total_compared: comparison.length,
            comparison: comparison,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System status and info
app.get('/api/system-info', (req, res) => {
    try {
        const tools = preprocessor.getAllTools();
        const riskScores = tools.map(tool => {
            const profile = riskScorer.calculateDetailedRiskProfile(tool);
            return profile.overall_risk_score;
        });

        res.json({
            framework: 'Ethical Risk Assessment Framework',
            version: '2.0-nodejs',
            language: 'Node.js/JavaScript',
            status: 'operational',
            database: 'Eai database.xlsx',
            total_ai_tools: tools.length,
            average_risk_score: (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(2),
            api_endpoints: [
                'GET /api/health',
                'GET /api/tools',
                'GET /api/tools/:name',
                'GET /api/statistics',
                'GET /api/search?q=<query>',
                'GET /api/compare?tools=<names>',
                'GET /api/system-info'
            ]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        available_endpoints: [
            'GET /api/health',
            'GET /api/tools',
            'GET /api/tools/:name',
            'GET /api/statistics',
            'GET /api/search?q=<query>',
            'GET /api/compare?tools=<names>',
            'GET /api/system-info'
        ]
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log(`🚀 SERVER STARTED`);
    console.log('='.repeat(70));
    console.log(`\n🌐 API running at: http://localhost:${PORT}`);
    console.log(`📚 Frontend available at: http://localhost:${PORT}`);

    console.log('\n📋 Available API Endpoints:\n');
    console.log(`  GET  /api/health                    - System health check`);
    console.log(`  GET  /api/tools                     - List all AI tools`);
    console.log(`  GET  /api/tools/<name>              - Analyze specific tool`);
    console.log(`  GET  /api/statistics                - View dataset statistics`);
    console.log(`  GET  /api/search?q=<query>          - Search AI tools`);
    console.log(`  GET  /api/compare?tools=A,B         - Compare multiple tools`);
    console.log(`  GET  /api/system-info               - System information`);
    console.log('\n' + '='.repeat(70) + '\n');
});

// Initialize on startup
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});

// Initialize system
const initSuccess = initializeSystem();
if (!initSuccess) {
    console.error('Failed to initialize system. Server may be non-functional.');
}
