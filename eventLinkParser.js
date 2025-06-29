/**
 * Parser for EventLink standings reports
 * Extracts tournament information and player results
 */
import logger from './logger.js';
import { promises as fs } from 'fs';

// Parse the event link report text
export function parseEventLinkReport(text) {
  logger.info('parseEventLinkReport called');
  
  if (!text) {
    logger.error('Error: Empty text provided to parseEventLinkReport');
    throw new Error('Empty text provided to parser');
  }
  
  // First, try to normalize the text
  // Convert any Windows-style line endings to Unix-style
  let normalizedText = text.replace(/\r\n/g, '\n');
  
  // If there are very few or no line breaks, this might be a copy-paste issue
  // where line breaks were lost. Try to reconstruct them based on known patterns.
  if (normalizedText.split('\n').filter(line => line.trim() !== '').length < 5) {
    logger.info('Few line breaks detected, attempting to reconstruct line breaks...');
    
    // Insert line breaks before each key section
    normalizedText = normalizedText
      .replace(/EventLink\s+/g, '\nEventLink ')
      .replace(/Report:\s+/g, '\nReport: ')
      .replace(/Event:\s+/g, '\nEvent: ')
      .replace(/Event Date:\s+/g, '\nEvent Date: ')
      .replace(/Event Information:\s+/g, '\nEvent Information: ')
      .replace(/Opponents Match Win Percent/g, '\nOpponents Match Win Percent')
      .replace(/Game Win Percent/g, '\nGame Win Percent')
      .replace(/Opponents Game Win Percent/g, '\nOpponents Game Win Percent')
      .replace(/Rank\s+Name\s+Pod\s+Points/g, '\nRank   Name                    Pod    Points')
      .replace(/----+/g, '\n-------------------------------------------------------------------------------');
    
    // Try to identify and separate player rows
    normalizedText = normalizedText.replace(/(\d+)\s+([A-Za-z\s]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g, 
      '\n$1      $2           $3      $4      $5     $6     $7');
    
    logger.info('After reconstruction, text has this many lines:', 
      normalizedText.split('\n').filter(line => line.trim() !== '').length);
  }
  
  // Split into lines and remove empty ones
  const lines = normalizedText.split('\n').filter(line => line.trim() !== '');
  logger.info(`Text split into ${lines.length} non-empty lines`);
  
  if (lines.length < 5) {
    logger.warn('Warning: Very few lines in report, might be incomplete. Line count:', lines.length);
  }
  
  let result = {
    eventInfo: {},
    players: []
  };
  
  // Debug output of first few lines to verify format
  logger.debug('First 5 lines of the report:');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    logger.debug(`Line ${i}: ${lines[i].substring(0, 80)}${lines[i].length > 80 ? '...' : ''}`);
  }
  
  // Extract event information (header)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract event name and ID
    if (line.includes('Event:')) {
      logger.debug('Found Event line:', line);
      const eventMatch = line.match(/Event:\s+(.*?)\s+\((\d+)\)/);
      if (eventMatch) {
        result.eventInfo.eventName = eventMatch[1];
        result.eventInfo.eventId = eventMatch[2];
        logger.debug(`Extracted event name: ${eventMatch[1]}, event ID: ${eventMatch[2]}`);
      } else {
        logger.warn('Event line found but couldn\'t extract name/ID with regex:', line);
      }
    }
    
    // Extract event date
    if (line.includes('Event Date:')) {
      logger.debug('Found Event Date line:', line);
      const dateMatch = line.match(/Event Date:\s+(.*)/);
      if (dateMatch) {
        result.eventInfo.eventDate = dateMatch[1];
        logger.debug(`Extracted event date: ${dateMatch[1]}`);
      } else {
        logger.warn('Event Date line found but couldn\'t extract date with regex:', line);
      }
    }
    
    // Extract additional event information
    if (line.includes('Event Information:')) {
      logger.debug('Found Event Information line:', line);
      const infoMatch = line.match(/Event Information:\s+(.*)/);
      if (infoMatch) {
        result.eventInfo.additionalInfo = infoMatch[1];
        logger.debug(`Extracted additional info: ${infoMatch[1]}`);
      }
    }
  }
  
  // Try to parse player data - we'll use a different approach since line breaks might be unreliable
  // Look for patterns in the full text that match player entries
  logger.info('Attempting to extract player data using regex patterns...');
  
  // This regex looks for patterns like: 1 Alexey Paulot 1 9 44 85 44
  // It captures rank, name, pod, points, and percentages
  const playerRegex = /(\d+)\s+([A-Za-zÀ-ÿ\s.']+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
  
  let playerMatch;
  let playerCount = 0;
  
  // Loop through all player matches
  while ((playerMatch = playerRegex.exec(normalizedText)) !== null) {
    const [_, rank, name, pod, points, omw, gw, ogw] = playerMatch;
    
    // Skip if this looks like a header row
    if (name.trim().toLowerCase() === 'name') continue;
    
    logger.debug(`Matched player data: rank=${rank}, name="${name.trim()}", pod=${pod}, points=${points}`);
    playerCount++;
    
    result.players.push({
      rank: parseInt(rank),
      name: name.trim(),
      pod: parseInt(pod),
      points: parseInt(points),
      matchesPlayed: Math.ceil(parseInt(points) / 3),
      omwPercentage: parseInt(omw),
      gwPercentage: parseInt(gw),
      ogwPercentage: parseInt(ogw)
    });
  }
  
  logger.info(`Extracted ${playerCount} players from the data`);
  
  // Summary of extracted data
  logger.info('Extraction summary:', {
    eventName: result.eventInfo.eventName || 'not found',
    eventDate: result.eventInfo.eventDate || 'not found',
    playerCount: result.players.length
  });
  
  if (result.players.length === 0) {
    logger.warn('Warning: No player data was extracted from the report');
  }
  
  // Extract format from event name
  if (result.eventInfo.eventName) {
    const eventName = result.eventInfo.eventName.toLowerCase();
    logger.debug('Attempting to detect format from event name:', result.eventInfo.eventName);
    
    // Format detection with proper categorization
    if (eventName.includes('draft') || eventName.includes('sealed')) {
      result.eventInfo.format = 'Limited';
      logger.debug('Format detected as Limited');
    } else if (eventName.includes('duel commander')) {
      result.eventInfo.format = 'Duel Commander';
      logger.debug('Format detected as Duel Commander');
    } else if (eventName.includes('commander')) {
      result.eventInfo.format = 'Commander';
      logger.debug('Format detected as Commander');
    } else if (eventName.includes('standard')) {
      result.eventInfo.format = 'Standard';
      logger.debug('Format detected as Standard');
    } else if (eventName.includes('modern')) {
      result.eventInfo.format = 'Modern';
      logger.debug('Format detected as Modern');
    } else if (eventName.includes('pioneer')) {
      result.eventInfo.format = 'Pioneer';
      logger.debug('Format detected as Pioneer');
    } else if (eventName.includes('legacy')) {
      result.eventInfo.format = 'Legacy';
      logger.debug('Format detected as Legacy');
    } else if (eventName.includes('vintage')) {
      result.eventInfo.format = 'Vintage';
      logger.debug('Format detected as Vintage');
    } else {
      // If no specific format was found, use the first word as a fallback
      result.eventInfo.format = result.eventInfo.eventName.split(' ')[0];
      logger.debug('No specific format detected, using first word as format:', result.eventInfo.format);
    }
    
    // Preserve the original event name for reference
    result.eventInfo.originalEventName = result.eventInfo.eventName;
  } else {
    logger.warn('No event name found, cannot detect format');
  }
  
  return result;
}

// Helper function to read from file
export async function parseEventLinkFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseEventLinkReport(content);
  } catch (error) {
    logger.error('Error reading or parsing file:', error);
    throw error;
  }
}