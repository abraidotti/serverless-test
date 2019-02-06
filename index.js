const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const AWS = require('aws-sdk');


const { REMOTE_MACHINE_PINGS_TABLE } = process.env;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.get('/', (req, res) => {
  res.send('Ping!');
});

// Get Machine endpoint
app.get('/machines/:machineId', (req, res) => {
  const params = {
    TableName: REMOTE_MACHINE_PINGS_TABLE,
    Key: {
      machineId: req.params.machineId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get machine' });
    }
    if (result.Item) {
      const { machineId, time } = result.Item;
      res.json({ machineId, time });
    } else {
      res.status(404).json({ error: 'Machine not found' });
    }
  });
})

// Create Machine endpoint
app.post('/machines', (req, res) => {
  const { machineId, time } = req.body;
  if (typeof machineId !== 'string') {
    res.status(400).json({ error: '"machineId" must be a string' });
  } else if (typeof time !== 'string') {
    res.status(400).json({ error: '"time" must be a string' });
  }

  const params = {
    TableName: REMOTE_MACHINE_PINGS_TABLE,
    Item: {
      machineId,
      time,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create machine' });
    }
    res.json({ machineId, time });
  });
});

module.exports.handler = serverless(app);
