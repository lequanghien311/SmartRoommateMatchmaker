const express = require('express');
const { pool } = require('../../database/connection');
const env = require('../../config/env');
const { messaging } = require('../../shared/providers');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const RuleBased = require('./providers/RuleBasedMatchingProvider');
const AzureOpenAI = require('./providers/AzureOpenAIMatchingProvider');
const Repository = require('./matching.repository');
const Service = require('./matching.service');
const Controller = require('./matching.controller');

const fallback = new RuleBased();
const provider = env.matchingProvider === 'azure-openai'
  ? new AzureOpenAI({ endpoint: process.env.AZURE_OPENAI_ENDPOINT, apiKey: process.env.AZURE_OPENAI_API_KEY, deployment: process.env.AZURE_OPENAI_DEPLOYMENT, fallback })
  : fallback;
const controller = new Controller(new Service(new Repository(pool), provider, messaging));
const router = express.Router();
router.use(authenticate, authorize('tenant'));
router.get('/', controller.list);
router.get('/:candidateId', controller.detail);
module.exports = { router, provider };

