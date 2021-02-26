const csv = require('csv-parser');
const fs = require('fs');
const archiver = require('archiver');
const archive = archiver('zip');
const rimraf = require('rimraf');
const _agent = {"language": "en", "defaultTimezone": "America/New_York"};
const _package = {"version":"1.0.0"};
const folder = 'test';

const output = fs.createWriteStream(`files/${folder}.zip`);

output.on('end', function() {
  console.log('Data has been drained');
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    // log warning
  } else {
    // throw error
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

if (!fs.existsSync(`files/${folder}`)) {
  fs.mkdirSync(`files/${folder}`);
}

if (!fs.existsSync(`files/${folder}/intents`)){
  fs.mkdirSync(`files/${folder}/intents`);
}

fs.writeFileSync(`files/${folder}/agent.json`, JSON.stringify(_agent));
fs.writeFileSync(`files/${folder}/package.json`, JSON.stringify(_package));

fs.createReadStream('csv/dialogflow.csv')
.pipe(csv())
.on('data', (row) => {
  const intent_name = row.Query.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'_').substring(0, 25);
  const intent = {
     "name":intent_name,
     "auto":true,
     "responses":[
        {
           "resetContexts":false,
           "messages":[
              {
                 "type":0,
                 "lang":"en",
                 "speech":[
                    row.Response,
                 ]
              }
           ]
        }
     ]
  };
  const usersays_en = [
     {
        "isTemplate":false,
        "count":0,
        "updated":0,
        "lang":"en",
        "data":[
           {
              "text":row.Query,
              "userDefined":false
           }
        ]
     }
  ];
  fs.writeFileSync(`files/${folder}/intents/${intent_name}.json`, JSON.stringify(intent));
  fs.writeFileSync(`files/${folder}/intents/${intent_name}_usersays_en.json`, JSON.stringify(usersays_en));
})
.on('end', () => {
  archive.directory(`files/${folder}`, false);
  archive.finalize();
  // rimraf.sync(`files/${folder}`);
  console.log('CSV file successfully processed');
});