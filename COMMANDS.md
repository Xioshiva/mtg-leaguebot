# MTG League Bot Command Guide

This document lists all available commands for the MTG League Bot. Use these commands to manage tournament results, view leaderboards, and track player scores.

## Command Overview

All commands start with a slash (`/`) in Discord.

## Administrative Commands

### `/parseeventlink`
Adds tournament results to the database from a pasted EventLink standings report.

- **Usage**: `/parseeventlink [report]`
- **Parameters**:
  - `report` (required): Paste the entire EventLink standings report text
- **Example**: `/parseeventlink EventLink 6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Draft Final Fantasy (8993570)
[...]`

### `/uploadstandings`
Adds tournament results to the database from an uploaded EventLink standings text file.

- **Usage**: `/uploadstandings [file]`
- **Parameters**:
  - `file` (required): A .txt file containing the EventLink standings report
- **Example**: `/uploadstandings [attach a tournament-results.txt file]`

### `/exportscores`
Exports scores as a CSV file for a specific format during a league year.

- **Usage**: `/exportscores [format] [year]`
- **Parameters**:
  - `format` (required): The Magic format to export scores for
  - `year` (required): The year in YYYY format (exports June YYYY-1 to May YYYY)
- **Example**: `/exportscores Modern 2025` - Exports all Modern format scores from June 2024 to May 2025 as a CSV file

### `/deleteevent`
Deletes a tournament and all associated player scores by event ID.

- **Usage**: `/deleteevent [eventid] [confirm]`
- **Parameters**:
  - `eventid` (required): The tournament's unique identifier to delete
  - `confirm` (required): Must be set to `true` to confirm deletion
- **Example**: `/deleteevent 8993570 confirm:true` - Deletes tournament ID 8993570 and all its scores
- **Warning**: This action cannot be undone

## View-Only Commands

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

### `/formatleaders`
Displays the top 10 players for a specific format during a league year (June to May).

- **Usage**: `/formatleaders [format] [year]`
- **Parameters**:
  - `format` (required): The Magic format to show rankings for
  - `year` (required): The year in YYYY format (shows June YYYY-1 to May YYYY)
- **Example**: `/formatleaders Limited 2025` - Shows top 10 Limited players from June 2024 to May 2025
- **Note**: Now includes the number of events each player has participated in

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

League years run from June of one year to May of the following year. For example, the 2025 league year runs from June 2024 to May 2025.

## Quick Reference Examples

- `/formatleaders Limited 2025` - Show top Limited players from June 2024 to May 2025
- `/findevents format:Limited date:2025-06-15` - Find Limited events on June 15, 2025
- `/tournament 8993570` - Show results for tournament ID 8993570
- `/exportscores Modern 2025` - Export all Modern scores from June 2024 to May 2025
- `/parseeventlink [paste EventLink report]` - Add tournament results from an EventLink report
- `/uploadstandings [file]` - Upload and process an EventLink standings file
- `/deleteevent 8993570 confirm:true` - Delete tournament ID 8993570 and all its scores