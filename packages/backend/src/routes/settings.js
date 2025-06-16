// Settings routes and storage
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default settings
const defaultSettings = {
  heartbeatInterval: 10,
  theme: 'dark',
  displayMode: 'standard',
};

// In-memory settings (initially set to defaults)
let settings = { ...defaultSettings };

// File path for persisting settings (future implementation)
const settingsFilePath = path.join(__dirname, '..', '..', 'data', 'settings.json');

export default async function registerSettingsRoutes(fastify) {
  // Create data directory if it doesn't exist
  try {
    await fs.mkdir(path.join(__dirname, '..', '..', 'data'), { recursive: true });
  } catch (error) {
    fastify.log.error('Error creating data directory:', error);
  }

  // Try to load settings from file
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    settings = JSON.parse(data);
    fastify.log.info('Settings loaded from file');
  } catch (error) {
    fastify.log.info('Using default settings');
    // No settings file yet, we'll create one with defaults when settings are updated
  }

  // Get settings
  fastify.get('/api/settings', async (request, reply) => {
    return { settings };
  });

  // Update settings
  fastify.put('/api/settings', async (request, reply) => {
    const newSettings = request.body;
    
    // Update settings
    settings = {
      ...settings,
      ...newSettings,
    };
    
    // Save to file
    try {
      await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));
      fastify.log.info('Settings saved to file');
    } catch (error) {
      fastify.log.error('Error saving settings to file:', error);
      // Continue anyway since we have the settings in memory
    }
    
    return { settings };
  });

  // Reset settings to defaults
  fastify.post('/api/settings/reset', async (request, reply) => {
    settings = { ...defaultSettings };
    
    // Save to file
    try {
      await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));
      fastify.log.info('Settings reset and saved to file');
    } catch (error) {
      fastify.log.error('Error saving reset settings to file:', error);
    }
    
    return { settings };
  });
}
