const XLSX = require('xlsx');
const path = require('path');

class DataPreprocessor {
    constructor(filepath) {
        this.filepath = filepath;
        this.df = null;
    }

    loadData() {
        try {
            const workbook = XLSX.readFile(this.filepath);
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            this.df = sheetData;
            console.log(`✓ Loaded ${this.df.length} rows`);
            return this.df;
        } catch (error) {
            console.error(`❌ Error loading data: ${error.message}`);
            throw error;
        }
    }

    getColumnInfo() {
        const columnDescriptions = {
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
        };
        return columnDescriptions;
    }

    encodeCategoricalFeatures() {
        const domainMapping = {
            'Vector Database': 0, 'Avatar / Video': 1, 'AI Infrastructure': 2,
            'Audio / Voice': 3, 'Search Engine': 4, 'Music Generation': 5,
            'Code Assistant': 6, 'Legal Tech': 7, 'Writing Assistant': 8,
            'Image Generation': 9, 'Video Editing': 10, 'Note Taking': 11,
            'Meeting Assistant': 12, 'Design Tool': 13, '3D Modeling': 14,
            'Animation': 15, 'Healthcare': 16, 'Education': 17, 'Finance': 18
        };

        const modelTypeMapping = { 'DL': 0, 'ML': 1, 'GenAI': 2, 'Hybrid': 3 };

        this.df = this.df.map(row => ({
            ...row,
            domain_encoded: domainMapping[row.domain] !== undefined ? domainMapping[row.domain] : -1,
            model_type_encoded: modelTypeMapping[row.model_type] !== undefined ? modelTypeMapping[row.model_type] : -1,
            monitoring_encoded: row.realtime_monitoring_status === 'Active' ? 1 : 0
        }));

        return this.df;
    }

    extractTemporalFeatures() {
        this.df = this.df.map(row => {
            const auditDate = new Date(row.last_audit_timestamp);
            const currentDate = new Date();
            const daysSinceAudit = Math.floor((currentDate - auditDate) / (1000 * 60 * 60 * 24));

            return {
                ...row,
                days_since_audit: daysSinceAudit
            };
        });

        return this.df;
    }

    prepareFeatures() {
        this.encodeCategoricalFeatures();
        this.extractTemporalFeatures();
        console.log('✓ Features prepared');
        return this.df;
    }

    getToolByName(toolName) {
        if (!this.df) return null;
        return this.df.find(row => row.ai_name && row.ai_name.toLowerCase() === toolName.toLowerCase());
    }

    searchTools(query) {
        if (!this.df) return [];
        const queryLower = query.toLowerCase();
        return this.df.filter(row =>
            (row.ai_name && row.ai_name.toLowerCase().includes(queryLower)) ||
            (row.company && row.company.toLowerCase().includes(queryLower)) ||
            (row.domain && row.domain.toLowerCase().includes(queryLower))
        );
    }

    getAllTools() {
        return this.df || [];
    }
}

module.exports = DataPreprocessor;
