/**
 * n8n Configuration File
 * This file provides configuration for n8n workflow automation
 * 
 * Usage: Export n8n workflows and place them in the workflows/ directory
 */

module.exports = {
  // Basic Configuration
  n8n: {
    host: process.env.N8N_HOST || 'localhost',
    port: process.env.N8N_PORT || 5678,
    protocol: process.env.N8N_PROTOCOL || 'http',
    path: process.env.N8N_PATH || '/',
    
    // Webhook Configuration
    webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:5678/',
    
    // Security
    encryptionKey: process.env.N8N_ENCRYPTION_KEY || 'default_encryption_key_change_me',
    
    // Basic Authentication
    basicAuth: {
      active: process.env.BASIC_AUTH_ACTIVE === 'true',
      user: process.env.BASIC_AUTH_USER || 'admin',
      password: process.env.BASIC_AUTH_PASSWORD || 'password',
    },
    
    // Execution Settings
    execution: {
      timeout: 300, // 5 minutes
      maxData: 10000, // Max data size
      concurrency: 1, // Number of concurrent executions
    },
    
    // Database (for production, use PostgreSQL)
    database: {
      type: 'sqlite', // or 'postgres'
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      name: process.env.DB_NAME || 'n8n',
      user: process.env.DB_USER || 'n8n',
      password: process.env.DB_PASSWORD || 'password',
    },
    
    // Queue Mode (recommended for production)
    executionsMode: process.env.EXECUTIONS_MODE || 'regular', // or 'queue'
    queue: {
      bull: {
        redisHost: process.env.QUEUE_BULL_REDIS_HOST || 'localhost',
        redisPort: process.env.QUEUE_BULL_REDIS_PORT || 6379,
      },
    },
    
    // Binary Data
    binaryDataTTL: 86400, // 24 hours
    binaryDataSize: 100000000, // 100MB
    
    // Workflow Settings
    workflowsPath: '/home/ubuntu/my-react-app/n8n/workflows',
    
    // User Management
    userManagement: {
      disabled: process.env.N8N_USER_MANAGEMENT_DISABLED === 'true',
    },
    
    // Editor Settings
    editorBaseUrl: process.env.N8N_EDITOR_BASE_URL || '/',
    
    // External Hooks
    externalHooks: [],
    
    // Endpoints
    endpoints: {
      rest: '/rest',
      webhook: '/webhook',
      webhookTest: '/webhook-test',
    },
  },
  
  // Workflow Templates
  workflowTemplates: {
    sendProduct: {
      name: 'Send Product to User',
      description: 'Sends product details via email/automation after purchase',
      webhookPath: '/send-product',
      triggers: {
        type: 'webhook',
        method: 'POST',
      },
      steps: [
        {
          name: 'Receive Webhook',
          type: 'n8n-nodes-base.webhook',
        },
        {
          name: 'Get Product Details',
          type: 'n8n-nodes-base.httpRequest',
        },
        {
          name: 'Send Email',
          type: 'n8n-nodes-base.emailSend',
        },
      ],
    },
    
    updateAirtable: {
      name: 'Update Airtable Record',
      description: 'Updates Airtable when order is completed',
      webhookPath: '/update-airtable',
      triggers: {
        type: 'webhook',
        method: 'POST',
      },
    },
  },
  
  // Webhook URLs (configure these in your backend)
  webhookEndpoints: {
    // Local Development
    local: {
      sendProduct: 'http://localhost:5678/webhook/send-product',
      updateAirtable: 'http://localhost:5678/webhook/update-airtable',
    },
    
    // Production
    production: {
      sendProduct: 'https://n8n.yourdomain.com/webhook/send-product',
      updateAirtable: 'https://n8n.yourdomain.com/webhook/update-airtable',
    },
  },
};