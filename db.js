// db.js - MongoDB version
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// Get your MongoDB Atlas connection string from .env file
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Database and collection names
const dbName = 'mtgLeague';
const scoresCollection = 'scores';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    logger.info('✅ Connected to MongoDB Atlas');
    return client.db(dbName);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize the DB connection
let database;
(async () => {
  database = await connectToDatabase();
  
  // Create a unique compound index for user_id and month
  try {
    await database.collection(scoresCollection).createIndex(
      { user_id: 1, month: 1 }, 
      { unique: true }
    );
    logger.info('✅ Database indexes created');
  } catch (err) {
    logger.info('Index might already exist:', err.message);
  }
})();

/**
 * Add or update a user's score for a given month
 * @param {string} userId - Discord user ID
 * @param {string} username - Discord username
 * @param {string} month - Month in YYYY-MM format
 * @param {number} points - Points to add
 * @param {string} format - Game format (Limited, Modern, etc.)
 * @param {string} eventId - Event ID
 * @param {string} eventName - Event name
 */
export async function addScore(userId, username, month, points, format = null, eventId = null, eventName = null) {
  try {
    await database.collection(scoresCollection).updateOne(
      { user_id: userId, month: month, format: format, eventId: eventId },
      { 
        $inc: { score: points },
        $set: { 
          username: username,
          format: format,
          eventId: eventId,
          eventName: eventName
        } 
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    logger.error('Error adding score:', error);
    return false;
  }
}

/**
 * Get the top scores for a specific month
 * @param {string} month - Month in YYYY-MM format
 * @param {function} callback - Callback function for results
 */
export function getScores(month, callback) {
  database.collection(scoresCollection)
    .find({ month: month })
    .sort({ score: -1 })
    .limit(20)
    .toArray()
    .then(docs => {
      callback(docs);
    })
    .catch(err => {
      logger.error('Error fetching scores:', err);
      callback([]);
    });
}

/**
 * Get scores for a specific event
 * @param {string} eventId - Event ID
 * @param {function} callback - Callback function for results
 */
export function getEventScores(eventId, callback) {
  database.collection(scoresCollection)
    .find({ eventId: eventId })
    .sort({ score: -1 })
    .toArray()
    .then(docs => {
      callback(docs);
    })
    .catch(err => {
      logger.error('Error fetching event scores:', err);
      callback([]);
    });
}

/**
 * Get top players for a specific format over a league year
 * @param {string} format - Game format (Limited, Modern, etc.)
 * @param {string} startMonth - Start month in YYYY-MM format (typically a June)
 * @param {string} endMonth - End month in YYYY-MM format (typically next June)
 * @param {number} limit - Maximum number of players to return
 * @param {function} callback - Callback function for results
 */
export function getFormatLeaders(format, startMonth, endMonth, limit, callback) {
  // Convert months to dates for comparison
  const startDate = new Date(startMonth + '-01');
  const endDate = new Date(endMonth + '-31');
  
  // First get all scores for the format within the date range
  database.collection(scoresCollection)
    .find({ 
      format: format,
      month: { 
        $gte: startMonth, 
        $lte: endMonth 
      } 
    })
    .toArray()
    .then(docs => {
      // Group scores by player name and sum them
      const playerScores = {};
      
      docs.forEach(doc => {
        if (!playerScores[doc.username]) {
          playerScores[doc.username] = {
            score: 0,
            eventCount: 0
          };
        }
        playerScores[doc.username].score += doc.score;
        playerScores[doc.username].eventCount += 1; // Count each entry as an event
      });
      
      // Convert to array and sort
      const sortedPlayers = Object.entries(playerScores)
        .map(([username, data]) => ({ 
          username, 
          score: data.score,
          eventCount: data.eventCount 
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      callback(sortedPlayers);
    })
    .catch(err => {
      logger.error('Error fetching format leaders:', err);
      callback([]);
    });
}

/**
 * Get all scores for a specific format over a league year
 * @param {string} format - Game format (Limited, Modern, etc.)
 * @param {string} startMonth - Start month in YYYY-MM format (typically a June)
 * @param {string} endMonth - End month in YYYY-MM format (typically next June)
 * @param {function} callback - Callback function for results
 */
export function getAllFormatScores(format, startMonth, endMonth, callback) {
  database.collection(scoresCollection)
    .find({ 
      format: format,
      month: { 
        $gte: startMonth, 
        $lte: endMonth 
      } 
    })
    .sort({ month: 1, username: 1 })
    .toArray()
    .then(docs => {
      callback(docs);
    })
    .catch(err => {
      logger.error('Error fetching all format scores:', err);
      callback([]);
    });
}

/**
 * Get events by date and/or format
 * @param {object} query - Query parameters
 * @param {string} query.format - Game format (Limited, Modern, etc.)
 * @param {string} query.date - Date to search for (YYYY-MM-DD or YYYY-MM)
 * @param {function} callback - Callback function for results
 */
export function findEvents(query, callback) {
  const filter = {};
  
  if (query.format) {
    filter.format = query.format;
  }
  
  if (query.date) {
    // If it's a full date (YYYY-MM-DD)
    if (query.date.length === 10) {
      filter.month = query.date.substring(0, 7); // Extract YYYY-MM part
    } 
    // If it's just a month (YYYY-MM)
    else if (query.date.length === 7) {
      filter.month = query.date;
    }
  }
  
  // Get distinct event IDs with format and date filters
  database.collection(scoresCollection)
    .aggregate([
      { $match: filter },
      { $group: {
        _id: "$eventId",
        month: { $first: "$month" },
        format: { $first: "$format" },
        eventName: { $first: "$eventName" },
        playerCount: { $sum: 1 }
      }},
      { $sort: { month: -1 } } // Sort by most recent first
    ])
    .toArray()
    .then(events => {
      callback(events);
    })
    .catch(err => {
      logger.error('Error finding events:', err);
      callback([]);
    });
}

/**
 * Delete an event and all associated scores by event ID
 * @param {string} eventId - The ID of the event to delete
 * @param {Function} callback - Callback function(success, error)
 */
export function deleteEventById(eventId, callback) {
  try {
    // Use the existing database connection
    database.collection(scoresCollection)
      .deleteMany({ eventId: eventId })
      .then(result => {
        // Return true if at least one document was deleted
        if (result.deletedCount > 0) {
          logger.info(`Deleted ${result.deletedCount} scores for event ID ${eventId}`);
          return callback(true);
        } else {
          logger.warn(`No scores found for event ID ${eventId}`);
          return callback(false);
        }
      })
      .catch(error => {
        logger.error('Error deleting event:', error);
        return callback(false, error);
      });
  } catch (error) {
    logger.error('Exception in deleteEventById:', error);
    return callback(false, error);
  }
}

/**
 * Get scores for a specific date range and optional format
 * @param {string} startMonth - Start month in YYYY-MM format
 * @param {string} endMonth - End month in YYYY-MM format
 * @param {string|null} format - Optional format to filter by
 * @param {function} callback - Callback function for results
 */
export function getAllScores(startMonth, endMonth, format, callback) {
  const collection = database.collection(scoresCollection);
  const query = {
    month: { $gte: startMonth, $lte: endMonth }
  };
  
  // Add format to query if specified
  if (format) {
    query.format = format;
  }
  
  collection.find(query).toArray()
    .then(results => {
      callback(results);
    })
    .catch(err => {
      logger.error('Error getting scores:', err);
      callback([]);
    });
}

// Graceful shutdown - close MongoDB connection when the app terminates
process.on('SIGINT', () => {
  client.close().then(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});
