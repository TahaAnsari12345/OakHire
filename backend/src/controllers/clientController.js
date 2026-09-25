const Client = require('../models/Client');
const { getPagination, buildPaginatedResponse, applyOwnershipFilter } = require('../utils/queryHelpers');
const { buildClientTimeline } = require('../services/timelineService');

function cleanContacts(contacts) {
  if (!Array.isArray(contacts)) return undefined;
  return contacts
    .filter((c) => c && c.name && c.name.trim())
    .map(({ name, designation, phone, email }) => ({ name, designation, phone, email }));
}

async function listClients(req, res) {
  const { search, status, industry } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};
  if (search) filter.companyName = new RegExp(search, 'i');
  if (status) filter.status = status;
  if (industry) filter.industry = new RegExp(industry, 'i');

  filter = applyOwnershipFilter(req, filter, 'accountOwner');

  const [data, total] = await Promise.all([
    Client.find(filter)
      .populate('accountOwner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

async function getClient(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id }, 'accountOwner');
  const client = await Client.findOne(filter).populate('accountOwner', 'name email');

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }
  res.json({ client });
}

async function createClient(req, res) {
  const { companyName, industry, contactName, contactPhone, contactEmail, additionalContacts, address, status, accountOwner } =
    req.body;

  if (!companyName) {
    return res.status(400).json({ message: 'companyName is required' });
  }

  const ownerId = req.user.role === 'super_admin' && accountOwner ? accountOwner : req.user.id;

  const client = await Client.create({
    companyName,
    industry,
    contactName,
    contactPhone,
    contactEmail,
    additionalContacts: cleanContacts(additionalContacts) || [],
    address,
    status,
    accountOwner: ownerId,
  });

  res.status(201).json({ client });
}

async function updateClient(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id }, 'accountOwner');
  const client = await Client.findOne(filter);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const updatable = ['companyName', 'industry', 'contactName', 'contactPhone', 'contactEmail', 'address', 'status'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) client[field] = req.body[field];
  });
  const contacts = cleanContacts(req.body.additionalContacts);
  if (contacts) client.additionalContacts = contacts;

  if (req.user.role === 'super_admin' && req.body.accountOwner) {
    client.accountOwner = req.body.accountOwner;
  }

  await client.save();
  res.json({ client });
}

async function deleteClient(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id }, 'accountOwner');
  const client = await Client.findOneAndDelete(filter);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }
  res.status(204).send();
}

/** GET /api/clients/:id/timeline — calls + follow-ups, gated on client ownership. */
async function getClientTimeline(req, res) {
  const client = await Client.findOne(applyOwnershipFilter(req, { _id: req.params.id }, 'accountOwner'));
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }
  const events = await buildClientTimeline(client._id);
  res.json({ events });
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient, getClientTimeline };
