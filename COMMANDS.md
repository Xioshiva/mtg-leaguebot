# MTG League Bot Command Guide

This document lists all available commands for the MTG League Bot. Use these commands to manage tournament results, view leaderboards, and track player scores.

## Command Overview

All commands start with a slash (`/`) in Discord.

## Permission Levels

The commands are divided into two permission levels:

- **View-Only Commands**: Available to all users
- **Administrative Commands**: Requires the **bot-admin** role

## Administrative Commands (Requires bot-admin role)

### `/parseeventlink`
Adds tournament results to the database from a pasted EventLink standings report.

- **Usage**: `/parseeventlink [report]`
- **Parameters**:
  - `report` (required): Paste the entire EventLink standings report text
- **Permission**: Requires bot-admin role
- **Example**: `/parseeventlink EventLink 6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Draft Final Fantasy (8993570)
[...]`

### `/uploadstandings`
Adds tournament results to the database from an uploaded EventLink standings text file.

- **Usage**: `/uploadstandings [file]`
- **Parameters**:
  - `file` (required): A .txt file containing the EventLink standings report
- **Permission**: Requires bot-admin role
- **Example**: `/uploadstandings [attach a tournament-results.txt file]`

### `/exportscores`
Exports scores as a CSV file for a specific format during a league year.

- **Usage**: `/exportscores [format] [year]`
- **Parameters**:
  - `format` (required): The Magic format to export scores for
  - `year` (required): Start year in YYYY format (exports June YYYY to June YYYY+1)
- **Permission**: Requires bot-admin role
- **Example**: `/exportscores Modern 2025` - Exports all Modern format scores from June 2025 to June 2026 as a CSV file

## View-Only Commands (Available to all users)

### `/tournament`
Displays the results for a specific tournament by event ID.

- **Usage**: `/tournament [eventid]`
- **Parameters**:
  - `eventid` (required): The tournament's unique identifier
- **Example**: `/tournament 8993570` - Shows the results for tournament ID 8993570

### `/findevents`
Searches for tournaments by format and/or date.

- **Usage**: `/findevents [format] [date]`
- **Parameters**:
  - `format` (optional): The Magic format (Limited, Standard, etc.)
  - `date` (optional): The event date in YYYY-MM-DD or YYYY-MM format
- **Note**: At least one parameter must be provided
- **Examples**: 
  - `/findevents format:Limited` - Find all Limited tournaments
  - `/findevents date:2025-06-15` - Find all tournaments held on June 15, 2025
  - `/findevents format:Modern date:2025-06` - Find Modern tournaments in June 2025

### `/scoreboard`
Displays the monthly scoreboard of all formats combined.

- **Usage**: `/scoreboard [month]`
- **Parameters**:
  - `month` (optional): Month in YYYY-MM format (defaults to current month)
- **Examples**:
  - `/scoreboard` - Show the current month's scoreboard
  - `/scoreboard 2025-06` - Show the scoreboard for June 2025

### `/formatleaders`
Displays the top 10 players for a specific format during a league year (June to June).

- **Usage**: `/formatleaders [format] [year]`
- **Parameters**:
  - `format` (required): The Magic format to show rankings for
  - `year` (required): Start year in YYYY format (shows June YYYY to June YYYY+1)
- **Example**: `/formatleaders Limited 2025` - Shows top 10 Limited players from June 2025 to June 2026

## Setting Up the bot-admin Role

1. Go to your Discord server settings
2. Navigate to the "Roles" section
3. Create a new role named exactly "bot-admin"
4. Assign this role to users who should have administrative access to the bot
5. The bot will automatically check for this role when administrative commands are used

## Supported Formats

The bot recognizes and categorizes these Magic: The Gathering formats:

- **Limited**: Includes both Draft and Sealed events
- **Standard**: Standard constructed format
- **Modern**: Modern constructed format
- **Pioneer**: Pioneer constructed format
- **Commander**: Multiplayer Commander format
- **Duel Commander**: 1v1 Commander format
- **Legacy**: Legacy constructed format
- **Vintage**: Vintage constructed format

## Format Detection

The bot automatically detects formats from tournament names when parsing EventLink reports. For example:
- "Draft Final Fantasy" will be categorized as "Limited"
- "Duel Commander Weekly" will be categorized as "Duel Commander"

## League Years

League years run from June to June of the following year. For example, the 2025 league year runs from June 2025 to June 2026.

## Quick Reference Examples

- `/scoreboard 2025-06` - Show scores for June 2025
- `/formatleaders Limited 2025` - Show top Limited players for the 2025-2026 season
- `/findevents format:Limited date:2025-06-15` - Find Limited events on June 15, 2025
- `/tournament 8993570` - Show results for tournament ID 8993570
- `/exportscores Modern 2025` - Export all Modern scores for the 2025-2026 season (requires bot-admin)
- `/parseeventlink [paste EventLink report]` - Add tournament results from an EventLink report (requires bot-admin)
- `/uploadstandings [file]` - Upload and process an EventLink standings file (requires bot-admin)