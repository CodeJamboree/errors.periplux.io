/*
linter/validator/builder

TODO:
validate table names in select from/join, update, delete, insert
validate columns belong to tables/aliases
ensure any local variables are assigned and used
ensure local variables are correct data types for known variables v_error_message TEXT
define list of known variables?
validate procedure calls exist, and have correct number of variables
verify transactions have commit/rollback
verify transactions are rolled back within exit handlers
LIMIT on all update/delete/insert/select
Ensure p_page_size does not exceed 100
Ensure p_page_size is at least 5
Ensure p_page_number is 1 or more
Ensure p_page_number is changed to last page if too high
Ensure p_page_number is INOUT
Separate individual rules into own JS files
IF with matching END IF;
IF condition ends with THEN (not BEGIN)

temp table script execution - only one selection at end
*/

const fs = require('fs');
const path = require('path');

const directoryPath = './db/tables';
const dataPath = './db/data';
const procedurePath = './db/procedures';

let relationships = {};
const tableOrder = [];
const parameters = {};

let parameterSuffixes = {};
let dataTypesPath = './scripts/data/data_types.json';
if (fs.existsSync(dataTypesPath)) {
  let temp = JSON.parse(fs.readFileSync(dataTypesPath, 'utf-8'));
  let keys = Object.keys(temp);
  keys.sort();
  const sortedTemp = {};
  keys.forEach(key => {
    sortedTemp[key] = temp[key];
  });

  fs.writeFileSync(dataTypesPath, JSON.stringify(sortedTemp, null, 2), 'utf-8');
  parameterSuffixes = dataTypesPath;
}

let knownParameters = [];
const knownParametersPath = './scripts/data/parameters.txt';
if (fs.existsSync(knownParametersPath)) {
  knownParameters = fs.readFileSync(knownParametersPath, 'utf-8').split('\n').filter(Boolean);
  knownParameters.sort();
  fs.writeFileSync(knownParametersPath, knownParameters.join('\n') + '\n', 'utf-8');
}

let procMessages = [];
const messagesPath = './scripts/data/messages.txt';
if (fs.existsSync(messagesPath)) {
  procMessages = fs.readFileSync(messagesPath, 'utf-8').split('\n').filter(Boolean);
  procMessages.sort();
  fs.writeFileSync(messagesPath, procMessages.join('\n') + '\n', 'utf-8');
}

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  const relevantFiles = files.filter(file => path.extname(file).toLowerCase() === '.sql');
  //CREATE TABLE account_lock_history
  const createTableRegex = /CREATE\s+TABLE\s+`?(\w+)`?\s*\(/i;
  const foreignKeyRegex = /REFERENCES\s+`?(\w+)`?\s*\(/gi;

  let failed = false;
  relevantFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    let match = createTableRegex.exec(content);
    if (match === null) {
      console.log(`Table not found in ${file}`);
      return;
    }

    const tableName = match[1];
    if (`${tableName}.sql` !== file) {
      console.warn(`Table ${tableName} in ${file}`);
    }
    if (/;\s*$/g.test(content)) {
      console.error(`${file} ends with semicolon.`);
      failed = true;
    }
    relationships[tableName] = relationships[tableName] ?? [];

    foreignKeyRegex.lastIndex = 0;
    while ((match = foreignKeyRegex.exec(content)) !== null) {
      const [_, referencedTable] = match;
      relationships[tableName].push(referencedTable);
    }
  });
  if (failed) return;

  let remainingTables = Object.keys(relationships);

  // Anyone referencing an unknown table?
  remainingTables.forEach(currentTable => {
    const dependencies = relationships[currentTable];
    dependencies.forEach(dependency => {
      if (!remainingTables.includes(dependency)) {
        console.error(`${currentTable} references ${dependency}, but it does not exist!`);
        failed = true;
      }
    })
  });
  if (failed) {
    return;
  }

  let round = 0;
  while (remainingTables.length !== 0) {
    round++;
    if (round >= 1024) {
      console.error(`Deep relationships ${round}. Exiting possible infinite loop.`);
      console.log('Remaining Tables', remainingTables);
      console.log('Relationships', relationships);
      return;
    }

    remainingTables.filter(table => {
      return relationships[table].length === 0;
    }).forEach(currentTable => {
      tableOrder.push(currentTable);
      Object.keys(relationships).forEach(table => {
        if (relationships[table].includes(currentTable)) {
          relationships[table] = relationships[table].filter(
            dependsOnTable => dependsOnTable !== currentTable
          );
        }
      });
      const { [currentTable]: dropped, ...newRelationships } = relationships;
      relationships = newRelationships;
      // delete relationships.currentTable;
    });
    remainingTables = Object.keys(relationships);
  }

  if (!fs.existsSync('build')) {
    fs.mkdirSync('build', { recursive: true });
  }

  let outputPath = 'build/create-tables.sql';
  fs.writeFileSync(outputPath, "", { encoding: 'utf-8', });
  let sql;
  tableOrder.forEach(table => {
    sql = fs.readFileSync(path.join(directoryPath, `${table}.sql`), 'utf-8');
    fs.appendFileSync(outputPath, sql + ';\n', 'utf-8');
  });
  outputPath = 'build/drop-tables.sql';
  sql = tableOrder.slice(0).reverse().map(table => `DROP TABLE IF EXISTS ${table};`).join('\n');
  fs.writeFileSync(outputPath, sql, 'utf-8');

  outputPath = 'build/create-data.sql';
  fs.writeFileSync(outputPath, '', 'utf-8');
  tableOrder.map(table => {
    if (fs.existsSync(path.join(dataPath, `${table}.sql`), 'utf-8')) {
      sql = fs.readFileSync(path.join(dataPath, `${table}.sql`), 'utf-8');
      fs.appendFileSync(outputPath, sql + '\n', 'utf-8');
    };
  });

  fs.writeFileSync('build/create-procedures.sql', '', 'utf-8');
  fs.writeFileSync('build/drop-procedures.sql', '', 'utf-8');
  const createProcedureRegex = /CREATE\s+PROCEDURE\s+(\w+)\s*\(/i;

  fs.readdirSync(procedurePath)
    .filter(file => file.toLowerCase().endsWith(".sql"))
    .forEach(file => {
      const filePath = path.join(procedurePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      let match = createProcedureRegex.exec(content);
      if (match === null) {
        console.log(`Procedure not found in ${file}`);
        return;
      }

      const procedureName = match[1];
      if (`${procedureName}.sql` !== file) {
        console.warn(`Procedure ${procedureName} in ${file}`);
      }
      if (!/;\s*$/g.test(content)) {
        console.error(`${file} does not end with semicolon.`);
        failed = true;
        return;
      }
      if (!/DELIMITER \/\//.test(content)) {
        console.error(`${file} does not contain 'DELIMITER //'`);
        return;
      }
      if (!/DELIMITER ;/m.test(content)) {
        console.error(`${file} does not contain 'DELIMITER ;'`);
        return;
      }
      if (!/END\s*\/\//.test(content)) {
        console.error(`${file} does not end procedure with END//`);
        return;
      }
      if (!/DROP PROCEDURE IF EXISTS \w+;/.test(content)) {
        console.error(`${file} does not drop procedure if it exists prior to creating`);
        return;
      }

      // Paramters
      //const parameterBlock = /CREATE PROCEDURE \w+\s*\(.*?\)\s*BEGIN/m;
      const parameterBlock = /CREATE PROCEDURE \w+\s*\(([\s\S]*?)\)\s*(this_proc\s*:\s*)?BEGIN/;
      if ((match = parameterBlock.exec(content)) !== null) {
        const parameterDefinition = match[1];
        const procLogic = content.substring(match.index + match[0].length);
        const lines = parameterDefinition.split('\n');
        const parameterPattern = /^\s*([A-Z]+)\s+([a-z][a-z_]+)\s+([A-Z]+(\(\d+\))?),?$/;
        let currentDirection = 'IN';
        lines.forEach(line => {
          if (line.trim() === '') return;
          match = parameterPattern.exec(line);
          const paramDef = match[0];

          if (match === null) {
            console.warn(`Unexpected parameter format ${line} in ${file}`);
          } else {
            const direction = match[1];
            const name = match[2];
            const type = match[3];

            if (!procLogic.includes(name)) {
              console.warn(`Parameter '${name}' is never used in ${file}`);
            }
            if (!name.startsWith('p_')) {
              console.error(`Parameter '${name}' must be prefixed with 'p_' in ${file}`);
              return;
            }
            if (name === 'p_id') {
              console.error(`${name} is too generic to understand what it relates to in ${file}`);
              return;
            }
            if (name.endsWith('_offset')) {
              console.error(`Disallowed ${name}. Pagination parameters must be p_page_number and p_page_size in ${file}`);
              return;
            }
            if (name.endsWith('_page_number')) {
              if (direction !== 'IN') {
                console.error(`${direction} ${name} expected to be IN in ${file}`);
                return;
              }
              if (!parameterDefinition.includes('_page_size')) {
                console.error(`${name} must have corresponding page size in ${file}`);
                return;
              }
              if (!parameterDefinition.includes('p_affected_rows')) {
                console.error(`${name} must have corresponding p_affected_rows in ${file}`);
                return;
              }
              const offsetCalc = `_page_size * (${name} - 1);`;
              if (!content.includes(offsetCalc)) {
                console.error(`Expected offset calcualtion '...${offsetCalc}' not found in ${file}`);
              }
              if (!content.includes('OFFSET v_page_offset')) {
                console.error(`OFFSET v_page_offset not found in ${file}`);
                return;
              }
              if (!content.includes(`${name} < 1`)) {
                console.warn(`Missing check for page number less than 1 ${file}`);
                //} else if (!content.includes('Invalid pagination')) {
                //console.warn(`Missing pagination validation ${file}`);
              }
            }
            if (name.endsWith('_page_size')) {
              if (direction !== 'IN') {
                console.error(`${direction} ${name} expected to be IN in ${file}`);
                return;
              }
              if (!parameterDefinition.includes('_page_number')) {
                console.error(`${name} must have corresponding page number in ${file}`);
                return;
              }
              if (!content.includes(`${name} BETWEEN 1 AND 100`)) {
                console.warn(`Missing page size validation between 1 and 100 in ${file}`);
              }

              if (!content.includes(`LIMIT ${name}`)) {
                console.error(`'LIMIT ${name}' not found in ${file}`);
                return;
              }
            }
            if (name.endsWith('_affected_rows')) {
              if (direction !== 'OUT') {
                console.error(`${direction} ${name} expected to be OUT in ${file}`);
                return;
              }
            }

            let failed = false;
            Object.keys(parameterSuffixes).forEach(suffix => {
              if (name.endsWith(`_${suffix}`)) {
                if (type !== parameterSuffixes[suffix]) {
                  console.error(`${name} ${type} was expected to be ${parameterSuffixes[suffix]} in ${file}`);
                  failed = true;
                }
              }
            });
            if (failed) return;

            if (!knownParameters.includes(name)) {
              console.warn(`${name} is not a known parameter in ${file}`);
              knownParameters.push(name);
            }
            if (name in parameters) {
              if (type !== parameters[name]) {
                console.warn(`Expected ${name} to be ${parameters[name]} but was ${type} in ${file}`);
              }
            } else {
              parameters[name] = type;
              // console.log(`Setting ${name} as ${type} in ${file}`);
            }
            if (!['IN', 'INOUT', 'OUT'].includes(direction)) {
              console.warn(`Parameter ${name} has an unknown direction ${direction} in ${file}`);
            } else {
              if (direction !== currentDirection) {
                switch (currentDirection) {
                  case 'IN':
                    break;
                  case 'INOUT':
                    if (direction === 'IN') {
                      console.warn(`Parameter ${name} is ${direction} following ${currentDirection} in ${file}`);
                    }
                    break;
                  case 'OUT':
                    console.warn(`Parameter ${name} is ${direction} following ${currentDirection} in ${file}`);
                    break;
                  default:
                    console.log(paramDef);
                    console.error(`Unknown direction '${direction}' for ${name} in ${file}`);
                    break;
                }
                currentDirection = direction;
              }
            }
          }
        });
      } else {
        console.error(`Missing parameters in ${file}`);
      }

      if ((match = /\s+LIMIT\s*\d+/i.test(content)) !== null) {
        const limit = parseInt(match[1]);
        if (limit > 1) {
          console.warn(`Unexpected limit '${limit}'. Expected LIMIT 0, 1, or p_page_size parameter in ${file}`);
        }
      }
      if ((match = /\s+OFFSET\s+(\w+)/i.exec(content)) !== null) {
        const offset = match[1];
        if (offset !== 'v_page_offset') {
          console.warn(`Unexpected offset '${offset}'. Expected 'OFFSET v_page_offset' in ${file}`);
        }
      }

      // if (!/DECLARE EXIT HANDLER FOR SQLEXCEPTION/.test(content)) {
      //   console.warn(`SQL Exceptions not handled in ${file}`);
      //   // } else if (!/SET p_message = 'SQL Exception';/.test(content)) {
      //   //   console.warn(`Exit handler not setting p_message = 'SQL Exception' in ${file}`);
      // } else if (!content.includes('GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;')) {
      //   console.warn(`Missing 'GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;' in ${file}`)
      //   //SELECT v_error_message AS CreateAccount;
      // } else if ((match = /SELECT\s+v_error_message\s+AS\s+`proc_message`\s*;/.exec(content)) === null) {
      //   console.warn(`Missing 'SELECT v_error_message AS \`proc_message\`;' in ${file}`);
      // }

      // if (!/SET p_message = 'Success';/.test(content)) {
      //   console.warn(`Missing SET p_message = 'Success'; in ${file}`);
      // }
      // if (!/OUT p_message VARCHAR\(255\)\s*\)/.test(content)) {
      //   console.warn(`Last parameter is not 'OUT p_message VARCHAR(255)' in ${file}`);
      // }
      // if (!/\(\s*IN p_session_id VARCHAR\(64\)/.test(content)) {
      //   console.warn(`First parameter is not 'IN p_session_id VARCHAR(64)' in ${file}`);
      // }
      // const messageStringPattern = /SET\s+p_message\s*=\s*'([^']*)'\s*;/g;
      // while ((match = messageStringPattern.exec(content)) !== null) {
      //   let message = match[1];
      //   if (!procMessages.includes(message)) {
      //     if (message.startsWith('DEBUG:')) {
      //       console.log(`Debug artifact '${message}' in ${file}.`);
      //     } else {
      //       console.warn(`Message '${message}' is not a standard message in ${file}.`);
      //     }
      //   }
      // }
      // const messagePattern = /SET\s+p_message\s*=\s*(.*)\s*;/g
      // while ((match = messagePattern.exec(content)) !== null) {
      //   let line = match[0];
      //   let message = match[1];
      //   messageStringPattern.lastIndex = 0;
      //   if (/SET\s+p_message\s*=\s*v_[a-z\d]+_message\s*;/.test(line)) {
      //     // all okay
      //   } else if (!messageStringPattern.test(line)) {
      //     console.warn(`Message '${message}' is not a standard message or v_*_message assignment in ${file}.`);
      //   }
      // }

      fs.appendFileSync('build/create-procedures.sql', content + '\n', 'utf-8');
      fs.appendFileSync('build/drop-procedures.sql', `DROP PROCEDURE IF EXISTS ${procedureName};\n`, 'utf-8');

    });
  fs.appendFileSync('build/create-procedures.sql', '', 'utf-8');

  outputPath = 'build/post-data-setup.sql';
  fs.writeFileSync(outputPath, '', 'utf-8');

  fs.readdirSync('db/setup')
    .filter(file => file.toLowerCase().endsWith(".sql"))
    .forEach(file => {
      const filePath = path.join('db/setup', file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (!/;\s*$/g.test(content)) {
        console.error(`${file} does not end with semicolon.`);
        failed = true;
        return;
      }
      fs.appendFileSync('build/post-data-setup.sql', content + '\n', 'utf-8');
    });

  outputPath = 'build/rebuild.sql';
  fs.writeFileSync(outputPath, '', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/drop-procedures.sql', 'utf-8') + '\n', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/drop-tables.sql', 'utf-8') + '\n', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/create-tables.sql', 'utf-8') + '\n', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/create-procedures.sql', 'utf-8') + '\n', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/create-data.sql', 'utf-8') + '\n', 'utf-8');
  fs.appendFileSync(outputPath, fs.readFileSync('build/post-data-setup.sql', 'utf-8') + '\n', 'utf-8');
  console.log(outputPath);
});
