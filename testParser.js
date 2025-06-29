/**
 * Test script for EventLink parser
 * 
 * This script contains various test cases to validate and stress test 
 * the EventLink parser functionality.
 * 
 * Run with: node testParser.js
 */

import { parseEventLinkReport } from './eventLinkParser.js';
import logger from './logger.js';
import chalk from 'chalk';
import process from 'process';

// Utility functions for testing with chalk
const log = {
  success: (msg) => logger.info(chalk.green(`✅ ${msg}`)),
  error: (msg) => logger.error(chalk.red(`❌ ${msg}`)),
  info: (msg) => logger.info(chalk.blue(`ℹ️ ${msg}`)),
  warn: (msg) => logger.warn(chalk.yellow(`⚠️ ${msg}`))
};

// Test runner
function runTest(name, testFn) {
  process.stdout.write(`Running test: ${name}... `);
  try {
    testFn();
    log.success('PASSED\n');
    return true;
  } catch (error) {
    log.error('FAILED');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack.split('\n').slice(1, 3).join('\n'));
    console.log('\n');
    return false;
  }
}

// Test cases

// Test Case 1: Standard EventLink format with line breaks
const standardInput = `EventLink            6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Draft Final Fantasy (8993570)
Event Date: 6/10/2025
Event Information: membre 17 chf non membre 20 chf

Opponents Match Win Percent : OMW%
Game Win Percent : GW%
Opponents Game Win Percent : OGW%


Rank   Name                    Pod    Points OMW%   GW%    OGW%  
-------------------------------------------------------------------------------
1      Alexey Paulot           1      9      44     85     44    
2      Gil Ferrari             1      6      66     66     66    
3      Zacharie Jourdain       1      6      44     80     47    
4      Elliot Grange           1      6      33     57     36    
5      mark schwass            1      3      77     33     74    
6      mi KL                   1      3      55     42     56    
7      Gassmann Noé            1      1      66     33     58    
8      Nicolas Casademont      1      1      44     33     47    

EventLink - Copyright © 2025 - Wizards of the Coast LLC`;

// Test Case 2: Single line format (no line breaks)
const singleLineInput = `EventLink 6/12/2025, 1:52 PM Report: Standings by Rank Event: Draft Final Fantasy (8993570) Event Date: 6/10/2025 Event Information: membre 17 chf non membre 20 chf Opponents Match Win Percent : OMW% Game Win Percent : GW% Opponents Game Win Percent : OGW% Rank Name Pod Points OMW% GW% OGW% ------------------------------------------------------------------------------- 1 Alexey Paulot 1 9 44 85 44 2 Gil Ferrari 1 6 66 66 66 3 Zacharie Jourdain 1 6 44 80 47 4 Elliot Grange 1 6 33 57 36 5 mark schwass 1 3 77 33 74 6 mi KL 1 3 55 42 56 7 Gassmann Noé 1 1 66 33 58 8 Nicolas Casademont 1 1 44 33 47 EventLink - Copyright © 2025 - Wizards of the Coast LLC`;

// Test Case 3: Different format (Modern)
const modernInput = `EventLink            6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Modern Monday (8993571)
Event Date: 6/10/2025
Event Information: membre 17 chf non membre 20 chf

Opponents Match Win Percent : OMW%
Game Win Percent : GW%
Opponents Game Win Percent : OGW%


Rank   Name                    Pod    Points OMW%   GW%    OGW%  
-------------------------------------------------------------------------------
1      John Smith              1      9      44     85     44    
2      Jane Doe                1      6      66     66     66    
3      Bob Brown               1      6      44     80     47    

EventLink - Copyright © 2025 - Wizards of the Coast LLC`;

// Test Case 4: Special characters in names
const specialCharsInput = `EventLink            6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Duel Commander Weekly (8993572)
Event Date: 6/10/2025
Event Information: membre 17 chf non membre 20 chf

Opponents Match Win Percent : OMW%
Game Win Percent : GW%
Opponents Game Win Percent : OGW%


Rank   Name                    Pod    Points OMW%   GW%    OGW%  
-------------------------------------------------------------------------------
1      Jérôme O'Connell        1      9      44     85     44    
2      María-José García       1      6      66     66     66    
3      Günther Müller          1      6      44     80     47    

EventLink - Copyright © 2025 - Wizards of the Coast LLC`;

// Test Case 5: Missing event info
const missingEventInfo = `Rank   Name                    Pod    Points OMW%   GW%    OGW%  
-------------------------------------------------------------------------------
1      Alexey Paulot           1      9      44     85     44    
2      Gil Ferrari             1      6      66     66     66    
3      Zacharie Jourdain       1      6      44     80     47    
`;

// Test Case 6: Empty input
const emptyInput = ``;

// Test Case 7: Malformed input
const malformedInput = `This is not an EventLink report.
Just some random text that doesn't match the format.
No player data here.`;

// Test Case 8: Extra spacing and inconsistent formatting
const inconsistentInput = `EventLink            6/12/2025,   1:52 PM
Report:    Standings by Rank
Event:   Standard  FNM   (8993573)
Event Date:   6/10/2025


Rank   Name                    Pod    Points   OMW%     GW%      OGW%  
-------------------------------------------------------------------------------
1      Player  One             1      9        44       85       44    
2      Player  Two             1      6        66       66       66    
`;

// Test Case 9: Different number of players
const manyPlayersInput = `EventLink            6/12/2025, 1:52 PM
Report: Standings by Rank
Event: Draft Championship (8993574)
Event Date: 6/10/2025

Rank   Name                    Pod    Points OMW%   GW%    OGW%  
-------------------------------------------------------------------------------
1      Player 1                1      9      44     85     44    
2      Player 2                1      6      66     66     66    
3      Player 3                1      6      44     80     47    
4      Player 4                1      6      33     57     36    
5      Player 5                1      3      77     33     74    
6      Player 6                1      3      55     42     56    
7      Player 7                1      1      66     33     58    
8      Player 8                1      1      44     33     47    
9      Player 9                1      0      40     30     45    
10     Player 10               1      0      38     28     44    
11     Player 11               1      0      37     27     43    
12     Player 12               1      0      36     26     42    
13     Player 13               1      0      35     25     41    
14     Player 14               1      0      34     24     40    
15     Player 15               1      0      33     23     39    
16     Player 16               1      0      32     22     38    
`;

// Test Case 10: Format edge cases
const formatEdgeCases = [
  `Event: Draft Something (8993575)`,
  `Event: Sealed Deck League (8993576)`,
  `Event: Duel Commander Tournament (8993577)`,
  `Event: Commander Night (8993578)`,
  `Event: Standard Showdown (8993579)`,
  `Event: Modern Masters (8993580)`,
  `Event: Pioneer Challenge (8993581)`,
  `Event: Legacy Open (8993582)`,
  `Event: Vintage Championship (8993583)`,
  `Event: Unknown Format (8993584)`,
];

// Run the tests
let passedCount = 0;
let totalTests = 0;

// Test 1: Standard input
totalTests++;
passedCount += runTest('Standard EventLink format', () => {
  const result = parseEventLinkReport(standardInput);
  
  if (result.players.length !== 8) throw new Error(`Expected 8 players, got ${result.players.length}`);
  if (result.eventInfo.eventName !== 'Draft Final Fantasy') throw new Error(`Wrong event name`);
  if (result.eventInfo.eventId !== '8993570') throw new Error(`Wrong event ID`);
  if (result.eventInfo.format !== 'Limited') throw new Error(`Wrong format detection`);
  if (result.players[0].name !== 'Alexey Paulot') throw new Error(`Wrong first player name`);
  if (result.players[0].points !== 9) throw new Error(`Wrong first player points`);
});

// Test 2: Single line input
totalTests++;
passedCount += runTest('Single line input (no line breaks)', () => {
  const result = parseEventLinkReport(singleLineInput);
  
  if (result.players.length !== 8) throw new Error(`Expected 8 players, got ${result.players.length}`);
  if (result.eventInfo.eventName !== 'Draft Final Fantasy') throw new Error(`Wrong event name`);
  if (result.eventInfo.format !== 'Limited') throw new Error(`Wrong format detection`);
});

// Test 3: Different format
totalTests++;
passedCount += runTest('Different format (Modern)', () => {
  const result = parseEventLinkReport(modernInput);
  
  if (result.players.length !== 3) throw new Error(`Expected 3 players, got ${result.players.length}`);
  if (result.eventInfo.eventName !== 'Modern Monday') throw new Error(`Wrong event name`);
  if (result.eventInfo.format !== 'Modern') throw new Error(`Wrong format detection`);
});

// Test 4: Special characters in names
totalTests++;
passedCount += runTest('Special characters in names', () => {
  const result = parseEventLinkReport(specialCharsInput);
  
  if (result.players.length !== 3) throw new Error(`Expected 3 players, got ${result.players.length}`);
  if (!result.players.some(p => p.name === 'Jérôme O\'Connell')) throw new Error(`Special character name not found`);
  if (result.eventInfo.format !== 'Duel Commander') throw new Error(`Wrong format detection`);
});

// Test 5: Missing event info
totalTests++;
passedCount += runTest('Missing event info', () => {
  const result = parseEventLinkReport(missingEventInfo);
  
  if (result.players.length !== 3) throw new Error(`Expected 3 players, got ${result.players.length}`);
  // Should still parse player data even with missing event info
});

// Test 6: Empty input
totalTests++;
passedCount += runTest('Empty input', () => {
  try {
    parseEventLinkReport(emptyInput);
    throw new Error(`Expected error for empty input but none was thrown`);
  } catch (error) {
    // This should throw an error, so the test passes
    if (!error.message.includes('Empty text')) {
      throw new Error(`Wrong error message: ${error.message}`);
    }
  }
});

// Test 7: Malformed input
totalTests++;
passedCount += runTest('Malformed input', () => {
  const result = parseEventLinkReport(malformedInput);
  
  if (result.players.length !== 0) throw new Error(`Expected 0 players, got ${result.players.length}`);
  // Should return empty players array for malformed input
});

// Test 8: Inconsistent spacing
totalTests++;
passedCount += runTest('Inconsistent spacing', () => {
  const result = parseEventLinkReport(inconsistentInput);
  
  if (result.players.length !== 2) throw new Error(`Expected 2 players, got ${result.players.length}`);
  if (result.eventInfo.eventName !== 'Standard  FNM') throw new Error(`Wrong event name`);
  if (result.eventInfo.format !== 'Standard') throw new Error(`Wrong format detection`);
});

// Test 9: Many players
totalTests++;
passedCount += runTest('Many players', () => {
  const result = parseEventLinkReport(manyPlayersInput);
  
  if (result.players.length !== 16) throw new Error(`Expected 16 players, got ${result.players.length}`);
  if (result.eventInfo.eventName !== 'Draft Championship') throw new Error(`Wrong event name`);
  if (result.eventInfo.format !== 'Limited') throw new Error(`Wrong format detection`);
});

// Test 10: Format detection edge cases
totalTests++;
passedCount += runTest('Format detection edge cases', () => {
  const formats = [];
  
  for (const input of formatEdgeCases) {
    const result = parseEventLinkReport(input);
    formats.push(result.eventInfo.format);
  }
  
  if (formats[0] !== 'Limited') throw new Error(`Expected 'Limited' for Draft`);
  if (formats[1] !== 'Limited') throw new Error(`Expected 'Limited' for Sealed`);
  if (formats[2] !== 'Duel Commander') throw new Error(`Expected 'Duel Commander'`);
  if (formats[3] !== 'Commander') throw new Error(`Expected 'Commander'`);
  if (formats[4] !== 'Standard') throw new Error(`Expected 'Standard'`);
  if (formats[5] !== 'Modern') throw new Error(`Expected 'Modern'`);
  if (formats[6] !== 'Pioneer') throw new Error(`Expected 'Pioneer'`);
  if (formats[7] !== 'Legacy') throw new Error(`Expected 'Legacy'`);
  if (formats[8] !== 'Vintage') throw new Error(`Expected 'Vintage'`);
  if (formats[9] !== 'Unknown') throw new Error(`Expected 'Unknown'`);
});

// Print the summary
log.info(`\n===== TEST SUMMARY =====`);
log.info(`Total tests: ${totalTests}`);
log.success(`Passed: ${passedCount}`);
if (passedCount < totalTests) {
  log.error(`Failed: ${totalTests - passedCount}`);
}
log.info(`========================\n`);

// Bonus: Performance test
log.info(`\n===== PERFORMANCE TEST =====`);
log.info(`Parsing a standard input 1000 times...`);

const startTime = process.hrtime();
for (let i = 0; i < 1000; i++) {
  parseEventLinkReport(standardInput);
}
const [seconds, nanoseconds] = process.hrtime(startTime);
const totalTime = seconds + nanoseconds / 1e9;

log.info(`Completed in ${totalTime.toFixed(3)} seconds`);
log.info(`Average time per parse: ${(totalTime * 1000 / 1000).toFixed(3)} ms`);
log.info(`============================\n`);