import 'dotenv/config';

import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import * as db from './db.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as eventParser from './eventLinkParser.js';
import fetch from 'node-fetch';
import logger from './logger.js';

// Define __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds] // Only need Guilds intent for slash commands
});

const PREFIX = '!';

// Define slash commands
const commands = [
  
  new SlashCommandBuilder()
    .setName('parseeventlink')
    .setDescription('Parse EventLink standings report')
    .addStringOption(option => 
      option.setName('report')
        .setDescription('Paste the EventLink report text')
        .setRequired(true)),
        
  new SlashCommandBuilder()
    .setName('uploadstandings')
    .setDescription('Upload EventLink standings text file')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('Text file containing EventLink standings')
        .setRequired(true)),
  
  // Command to show scores for a specific tournament
  new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Show scores for a specific tournament')
    .addStringOption(option => 
      option.setName('eventid')
        .setDescription('The tournament event ID')
        .setRequired(true)),
  
  // Command to show top players for a format over a league year
  new SlashCommandBuilder()
    .setName('formatleaders')
    .setDescription('Show top players for a format over a league year')
    .addStringOption(option => 
      option.setName('format')
        .setDescription('Game format')
        .setRequired(true)
        .addChoices(
          { name: 'Limited', value: 'Limited' },
          { name: 'Standard', value: 'Standard' },
          { name: 'Modern', value: 'Modern' },
          { name: 'Pioneer', value: 'Pioneer' },
          { name: 'Commander', value: 'Commander' },
          { name: 'Duel Commander', value: 'Duel Commander' },
          { name: 'Legacy', value: 'Legacy' },
          { name: 'Vintage', value: 'Vintage' }
        ))
    .addStringOption(option => 
      option.setName('year')
        .setDescription('Year to check (YYYY format, will show June YYYY to May YYYY+1)')
        .setRequired(true)),
  
  // Command to export scores as CSV
  new SlashCommandBuilder()
    .setName('exportscores')
    .setDescription('Export scores as CSV file for a format over a league year')
    .addStringOption(option => 
      option.setName('format')
        .setDescription('Game format')
        .setRequired(true)
        .addChoices(
          { name: 'Limited', value: 'Limited' },
          { name: 'Standard', value: 'Standard' },
          { name: 'Modern', value: 'Modern' },
          { name: 'Pioneer', value: 'Pioneer' },
          { name: 'Commander', value: 'Commander' },
          { name: 'Duel Commander', value: 'Duel Commander' },
          { name: 'Legacy', value: 'Legacy' },
          { name: 'Vintage', value: 'Vintage' }
        ))
    .addStringOption(option => 
      option.setName('year')
        .setDescription('Year to export (YYYY format, will export June YYYY-1 to May YYYY)')
        .setRequired(true)),
  
  // Command to find events by date and/or format
  new SlashCommandBuilder()
    .setName('findevents')
    .setDescription('Find events by date and/or format')
    .addStringOption(option => 
      option.setName('format')
        .setDescription('Game format')
        .setRequired(false)
        .addChoices(
          { name: 'Limited', value: 'Limited' },
          { name: 'Standard', value: 'Standard' },
          { name: 'Modern', value: 'Modern' },
          { name: 'Pioneer', value: 'Pioneer' },
          { name: 'Commander', value: 'Commander' },
          { name: 'Duel Commander', value: 'Duel Commander' },
          { name: 'Legacy', value: 'Legacy' },
          { name: 'Vintage', value: 'Vintage' }
        ))
    .addStringOption(option => 
      option.setName('date')
        .setDescription('Date (YYYY-MM-DD) or month (YYYY-MM)')
        .setRequired(false)),
  
  // Command to delete an event by ID
  new SlashCommandBuilder()
    .setName('deleteevent')
    .setDescription('Delete an event and all its scores by event ID')
    .addStringOption(option => 
      option.setName('eventid')
        .setDescription('The tournament event ID to delete')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('confirm')
        .setDescription('Confirm deletion (set to true to confirm)')
        .setRequired(true)),
];

// Register slash commands when the bot starts
client.once('ready', async () => {
  logger.info(`✅ Logged in as ${client.user.tag}`);
  
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    logger.info('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    
    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Error refreshing application commands:', error);
  }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Command handler for /addscore (if you still have it)
  if (commandName === 'addscore') {

    const points = interaction.options.getInteger('points');
    const month = new Date().toISOString().slice(0, 7);
    
    db.addScore(interaction.user.id, interaction.user.username, month, points);
    await interaction.reply(`Added ${points} points for ${interaction.user.username} in ${month}.`);
  }

  // Update the parseeventlink command with detailed logging
  if (commandName === 'parseeventlink') {
    logger.info(`Command triggered: parseeventlink by user ${interaction.user.tag}`);
  
    const reportText = interaction.options.getString('report');
    logger.info('Report text length:', reportText ? reportText.length : 0);
    logger.debug('First 100 characters of report:', reportText ? reportText.substring(0, 100) : 'empty');
    
    try {
      logger.info('Attempting to parse report...');
      // Process the provided report text
      const result = eventParser.parseEventLinkReport(reportText);
      
      logger.info('Parse result:', {
        hasEventInfo: !!result.eventInfo,
        eventName: result.eventInfo?.eventName || 'undefined',
        eventId: result.eventInfo?.eventId || 'undefined',
        eventDate: result.eventInfo?.eventDate || 'undefined',
        format: result.eventInfo?.format || 'undefined',
        playerCount: result.players?.length || 0
      });
      
      if (!result.players || result.players.length === 0) {
        logger.warn('No players found in the report');
        return interaction.reply("I couldn't find any player data in the report. Make sure it's in the correct format.");
      }
      
      // Log first player data as sample
      if (result.players.length > 0) {
        logger.debug('Sample player data (first player):', result.players[0]);
      }
      
      // Acknowledge receipt
      await interaction.deferReply();
      logger.info('Interaction deferred. Starting to process player data...');
      
      // Process each player's results
      let successCount = 0;
      
      for (const player of result.players) {
        const month = new Date(result.eventInfo.eventDate).toISOString().slice(0, 7);
        const points = player.points;
        const format = result.eventInfo.format || 'Unknown';
        const eventId = result.eventInfo.eventId || null;
        const eventName = result.eventInfo.eventName || null;
        
        logger.debug(`Processing player: ${player.name}, points: ${points}, format: ${format}`);
        
        try {
          // Add to database with eventName included
          await db.addScore(player.name, player.name, month, points, format, eventId, eventName);
          successCount++;
          logger.debug(`Successfully added score for ${player.name}`);
        } catch (dbError) {
          logger.error(`Error adding score for player ${player.name}:`, dbError);
        }
      }
      
      logger.info(`Processed ${successCount}/${result.players.length} players successfully`);
      
      // Create an embed with the summary
      const embed = new EmbedBuilder()
        .setTitle(`📊 Tournament Results Added`)
        .setColor(0x00AE86)
        .setDescription(
          `**Event**: ${result.eventInfo.eventName}\n` +
          `**Event ID**: \`${result.eventInfo.eventId || 'Unknown'}\`\n` +
          `**Date**: ${result.eventInfo.eventDate}\n` +
          `**Format**: ${result.eventInfo.format || 'Unknown'}\n` +
          `**Players**: ${result.players.length}\n\n` +
          `Added ${successCount} player results to the database.`
        )
        .setFooter({ text: 'Points have been added to this month\'s scoreboard.' });
        
      logger.info('Sending success response to user');
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error parsing report:', error);
      logger.error('Error stack:', error.stack);
      return interaction.reply("There was an error processing the report. Make sure it's in the correct format.");
    }
  }
  
  // Add the admin check to /uploadstandings command

  if (commandName === 'uploadstandings') {
    
    const file = interaction.options.getAttachment('file');
    logger.info(`User ${interaction.user.tag} uploaded file: ${file.name}`);
    
    if (!file.name.endsWith('.txt')) {
      logger.warn(`User ${interaction.user.tag} uploaded invalid file type: ${file.name}`);
      return interaction.reply("Please upload a .txt file with the EventLink standings report.");
    }
    
    try {
      // Acknowledge receipt
      await interaction.deferReply();
      
      // Download the file content
      const response = await fetch(file.url);
      const reportText = await response.text();
      logger.info(`Downloaded file content, size: ${reportText.length} characters`);
      
      // Process the file content
      const result = eventParser.parseEventLinkReport(reportText);
      
      if (result.players.length === 0) {
        logger.warn('No players found in the uploaded file');
        return interaction.editReply("I couldn't find any player data in the file. Make sure it's in the correct format.");
      }
      
      logger.info(`Found ${result.players.length} players in file ${file.name}`);
      
      // Process each player's results
      let successCount = 0;
      
      for (const player of result.players) {
        const month = new Date(result.eventInfo.eventDate).toISOString().slice(0, 7);
        const points = player.points;
        const format = result.eventInfo.format || 'Unknown';
        const eventId = result.eventInfo.eventId || null;
        const eventName = result.eventInfo.eventName || null;
        
        // Add to database with eventName included
        await db.addScore(player.name, player.name, month, points, format, eventId, eventName);
        successCount++;
      }
      
      logger.info(`Processed ${successCount}/${result.players.length} players from file successfully`);
      
      // Create an embed with the summary
      const embed = new EmbedBuilder()
        .setTitle(`📊 Tournament Results Added`)
        .setColor(0x00AE86)
        .setDescription(
          `**Event**: ${result.eventInfo.eventName}\n` +
          `**Event ID**: \`${result.eventInfo.eventId || 'Unknown'}\`\n` +
          `**Date**: ${result.eventInfo.eventDate}\n` +
          `**Format**: ${result.eventInfo.format || 'Unknown'}\n` +
          `**Players**: ${result.players.length}\n\n` +
          `Added ${successCount} player results to the database.`
        )
        .setFooter({ text: 'Points have been added to this month\'s scoreboard.' });
        
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error processing file:', error);
      logger.error('Error stack:', error.stack);
      return interaction.editReply("There was an error processing the file. Make sure it's in the correct format.");
    }
  }
  
  // Command to show tournament scores
  if (commandName === 'tournament') {
    const eventId = interaction.options.getString('eventid');
    
    // Acknowledge the request
    await interaction.deferReply();
    
    db.getEventScores(eventId, (rows) => {
      if (!rows.length) return interaction.editReply(`No scores found for tournament ID ${eventId}.`);
      
      // Get event info from the first row
      const eventName = rows[0].eventName || 'Unknown Tournament';
      const eventDate = rows[0].month || 'Unknown Date';
      const format = rows[0].format || 'Unknown Format';
      
      const embed = new EmbedBuilder()
        .setTitle(`🏆 Tournament Results: ${eventName}`)
        .setColor(0x00AE86)
        .setDescription(
          `**Date**: ${eventDate}\n` +
          `**Format**: ${format}\n` +
          `**Event ID**: ${eventId}\n\n` +
          rows
            .map((r, i) => `${i + 1}. **${r.username}** – ${r.score} pts`)
            .join('\n')
        );
      
      interaction.editReply({ embeds: [embed] });
    });
  }

    // Command to show format leaders
  if (commandName === 'formatleaders') {
    const format = interaction.options.getString('format');
    const yearStr = interaction.options.getString('year');
    
    // Validate year input
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return interaction.reply('Please provide a valid year in YYYY format.');
    }
    
    // Calculate start and end months for the league year (June of previous year to May of current year)
    const startMonth = `${year-1}-06`; // June of the previous year
    const endMonth = `${year}-05`;     // May of the current year
    
    // Acknowledge the request
    await interaction.deferReply();
    
    db.getFormatLeaders(format, startMonth, endMonth, 10, (players) => {
      if (!players.length) {
        return interaction.editReply(`No scores found for ${format} from June ${year-1} to May ${year}.`);
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`🏆 Top 10 ${format} Players: ${year-1}-${year} Season`)
        .setColor(0x00AE86)
        .setDescription(
          players
            .map((p, i) => `${i + 1}. **${p.username}** – ${p.score} pts (${p.eventCount || 1} events)`)
            .join('\n')
        )
        .setFooter({ text: `Season period: June ${year-1} to May ${year}` });
      
      interaction.editReply({ embeds: [embed] });
    });
  }

  // Command to export scores as CSV
  if (commandName === 'exportscores') {
    const format = interaction.options.getString('format');
    const yearStr = interaction.options.getString('year');
    
    // Validate year input
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return interaction.reply('Please provide a valid year in YYYY format.');
    }
    
    // Calculate start and end months for the league year (June of previous year to May of current year)
    const startMonth = `${year-1}-06`; // June of the previous year
    const endMonth = `${year}-05`;     // May of the current year
    
    // Acknowledge the request
    await interaction.deferReply();
    
    db.getAllFormatScores(format, startMonth, endMonth, async (scores) => {
      if (!scores.length) {
        return interaction.editReply(`No scores found for ${format} from June ${year-1} to May ${year}.`);
      }
      
      try {
        // Group by username to count number of events per player
        const playerEvents = {};
        
        scores.forEach(score => {
          if (!playerEvents[score.username]) {
            playerEvents[score.username] = new Set();
          }
          // Only count unique events
          if (score.eventId) {
            playerEvents[score.username].add(score.eventId);
          }
        });
        
        // Create CSV content
        let csvContent = 'Username,Month,Score,EventID,Format,EventCount\n';
        
        scores.forEach(score => {
          const eventCount = playerEvents[score.username]?.size || 1;
          csvContent += `"${score.username}","${score.month}",${score.score},"${score.eventId || ''}","${score.format || ''}",${eventCount}\n`;
        });
        
        // Create a temporary file
        const seasonName = `${year-1}-${year}`;
        const fileName = `${format.replace(/ /g, '_')}_scores_${seasonName}.csv`;
        const filePath = path.join(process.cwd(), fileName);
        
        await fs.writeFile(filePath, csvContent);
        
        // Send the file as attachment
        await interaction.editReply({
          content: `Here are the ${format} scores for the ${year-1}-${year} season:`,
          files: [{
            attachment: filePath,
            name: fileName
          }]
        });
        
        // Delete the file after sending
        setTimeout(async () => {
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.error('Error deleting temporary file:', err);
          }
        }, 5000);
        
      } catch (error) {
        console.error('Error creating CSV file:', error);
        return interaction.editReply('There was an error creating the CSV file.');
      }
    });
  }

  // Command to find events by date and/or format
  if (commandName === 'findevents') {
    const format = interaction.options.getString('format');
    const date = interaction.options.getString('date');
    
    if (!format && !date) {
      return interaction.reply('Please provide at least a format or date to search for events.');
    }
    
    // Validate date format if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
      if (!dateRegex.test(date)) {
        return interaction.reply('Please use YYYY-MM-DD or YYYY-MM format for the date.');
      }
    }
    
    // Acknowledge the request
    await interaction.deferReply();
    
    // Search for events
    db.findEvents({ format, date }, (events) => {
      if (!events.length) {
        let message = 'No events found';
        if (format) message += ` for format "${format}"`;
        if (date) message += ` on or during ${date}`;
        return interaction.editReply(message + '.');
      }
      
      // Build a nice embed with the found events
      const embed = new EmbedBuilder()
        .setTitle(`🎲 Found Events`)
        .setColor(0x00AE86)
        .setDescription(
          events.map((event, i) => {
            // Skip events with null/undefined eventId
            if (!event._id) return '';
            
            return `${i + 1}. **${event.format || 'Unknown Format'}** - ${event.month || 'Unknown Date'}\n` +
                   `   Event ID: \`${event._id}\` (${event.playerCount} players)`;
          }).filter(entry => entry !== '').join('\n\n')
        )
        .setFooter({ text: `Use /tournament command with an event ID to see detailed results` });
      
      interaction.editReply({ embeds: [embed] });
    });
  }


  // Command to delete an event
  if (commandName === 'deleteevent') {
    
    const eventId = interaction.options.getString('eventid');
    const confirmDelete = interaction.options.getBoolean('confirm');
    
    if (!confirmDelete) {
      return interaction.reply({
        content: 'Deletion cancelled. Set the confirm option to true if you want to delete this event.',
        ephemeral: true
      });
    }
    
    // Acknowledge the request
    await interaction.deferReply();
    
    try {
      // First, get the event info to show what's being deleted
      db.getEventScores(eventId, async (rows) => {
        if (!rows.length) {
          return interaction.editReply(`No event found with ID ${eventId}.`);
        }
        
        // Get event info from the first row
        const eventName = rows[0].eventName || 'Unknown Tournament';
        const eventDate = rows[0].month || 'Unknown Date';
        const format = rows[0].format || 'Unknown Format';
        const playerCount = rows.length;
        
        // Delete the event
        db.deleteEventById(eventId, (success, error) => {
          if (error) {
            logger.error(`Error deleting event ${eventId}:`, error);
            return interaction.editReply(`Error deleting event: ${error.message || 'Unknown error'}`);
          }
          
          if (success) {
            logger.info(`Successfully deleted event ${eventId} (${eventName}) with ${playerCount} players`);
            
            // Create an embed with the summary of what was deleted
            const embed = new EmbedBuilder()
              .setTitle(`🗑️ Tournament Deleted`)
              .setColor(0xFF0000)
              .setDescription(
                `**Event**: ${eventName}\n` +
                `**Date**: ${eventDate}\n` +
                `**Format**: ${format}\n` +
                `**Event ID**: ${eventId}\n` +
                `**Players**: ${playerCount}\n\n` +
                `All scores associated with this tournament have been deleted.`
              )
              .setFooter({ text: `Deleted by ${interaction.user.tag}` });
              
            return interaction.editReply({ embeds: [embed] });
          } else {
            return interaction.editReply(`No event found with ID ${eventId} or no scores were deleted.`);
          }
        });
      });
    } catch (error) {
      logger.error('Error in delete event command:', error);
      return interaction.editReply('There was an error processing your request.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

