// One-off script to populate the database with a realistic demo dataset
// for reviewing the app. Run with: npm run seed:demo
// WARNING: wipes every collection first — never run this against a
// database with real data you want to keep.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Client = require('../models/Client');
const JobRequirement = require('../models/JobRequirement');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Followup = require('../models/Followup');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const FunnelStage = require('../models/FunnelStage');
const CallDispositionType = require('../models/CallDispositionType');
const LeadSource = require('../models/LeadSource');

const seedFunnelStages = require('./seedFunnelStages');
const seedCallDispositionTypes = require('./seedCallDispositionTypes');
const seedLeadSources = require('./seedLeadSources');

function daysFromNow(days) {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function run() {
  await connectDB();
  console.log('[seed-demo] Connected. Wiping existing data...');

  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    JobRequirement.deleteMany({}),
    Candidate.deleteMany({}),
    Application.deleteMany({}),
    Followup.deleteMany({}),
    CallLog.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    FunnelStage.deleteMany({}),
    CallDispositionType.deleteMany({}),
    LeadSource.deleteMany({}),
  ]);

  await seedFunnelStages();
  await seedCallDispositionTypes();
  await seedLeadSources();

  const stages = await FunnelStage.find();
  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));
  const dispositions = await CallDispositionType.find();
  const dispositionByName = Object.fromEntries(dispositions.map((d) => [d.name, d]));

  console.log('[seed-demo] Creating users...');
  const admin = await User.create({
    name: 'Aditi Sharma',
    email: 'admin@oakhire.com',
    password: 'Admin@123',
    role: 'super_admin',
    phone: '9800000001',
  });

  const [emp1, emp2, emp3] = await Promise.all([
    User.create({ name: 'Rohan Mehta', email: 'rohan@oakhire.com', password: 'Employee@123', role: 'employee', phone: '9800000002' }),
    User.create({ name: 'Priya Nair', email: 'priya@oakhire.com', password: 'Employee@123', role: 'employee', phone: '9800000003' }),
    User.create({ name: 'Karan Singh', email: 'karan@oakhire.com', password: 'Employee@123', role: 'employee', phone: '9800000004' }),
  ]);
  const employees = [emp1, emp2, emp3];

  console.log('[seed-demo] Creating clients...');
  const clientDefs = [
    { companyName: 'Nimbus Technologies', industry: 'SaaS', contactName: 'Vikram Rao', contactEmail: 'vikram@nimbus.io', accountOwner: emp1 },
    { companyName: 'BluePeak Financial', industry: 'Fintech', contactName: 'Anjali Desai', contactEmail: 'anjali@bluepeak.com', accountOwner: emp2 },
    { companyName: 'Orbit Logistics', industry: 'Supply Chain', contactName: 'Manish Gupta', contactEmail: 'manish@orbitlog.com', accountOwner: emp1 },
    { companyName: 'Solstice Healthcare', industry: 'Healthcare', contactName: 'Neha Kapoor', contactEmail: 'neha@solstice.health', accountOwner: emp3 },
    { companyName: 'Vertex Retail', industry: 'E-commerce', contactName: 'Sameer Joshi', contactEmail: 'sameer@vertexretail.com', accountOwner: emp2 },
  ];
  const clients = await Promise.all(
    clientDefs.map((c) =>
      Client.create({
        companyName: c.companyName,
        industry: c.industry,
        contactName: c.contactName,
        contactEmail: c.contactEmail,
        contactPhone: '9811' + Math.floor(100000 + Math.random() * 899999),
        address: 'India',
        status: 'Active',
        accountOwner: c.accountOwner._id,
      })
    )
  );

  console.log('[seed-demo] Creating job requirements...');
  const jrDefs = [
    { title: 'Senior Backend Engineer', client: clients[0], skills: ['Node.js', 'MongoDB', 'AWS'], priority: 'Hot', assignedTo: emp1 },
    { title: 'React Frontend Developer', client: clients[0], skills: ['React', 'TypeScript'], priority: 'Warm', assignedTo: emp1 },
    { title: 'Risk Analyst', client: clients[1], skills: ['Excel', 'Risk Modeling'], priority: 'Hot', assignedTo: emp2 },
    { title: 'DevOps Engineer', client: clients[2], skills: ['Kubernetes', 'CI/CD'], priority: 'Warm', assignedTo: emp1 },
    { title: 'Product Manager', client: clients[3], skills: ['Roadmapping', 'Agile'], priority: 'Cold', assignedTo: emp3 },
    { title: 'QA Automation Engineer', client: clients[4], skills: ['Selenium', 'Cypress'], priority: 'Warm', assignedTo: emp2 },
    { title: 'Data Analyst', client: clients[1], skills: ['SQL', 'Power BI'], priority: 'Hot', assignedTo: emp2 },
  ];
  const jobRequirements = await Promise.all(
    jrDefs.map((j) =>
      JobRequirement.create({
        title: j.title,
        client: j.client._id,
        skills: j.skills,
        experienceMin: 2,
        experienceMax: 8,
        ctcMin: 800000,
        ctcMax: 2200000,
        openings: 2,
        location: 'Bengaluru',
        priority: j.priority,
        engagementType: 'Direct',
        status: 'Open',
        assignedTo: j.assignedTo._id,
        createdBy: j.assignedTo._id,
      })
    )
  );

  console.log('[seed-demo] Creating candidates...');
  const candidateNames = [
    'Aarav Kumar', 'Ishita Verma', 'Rahul Iyer', 'Sneha Reddy', 'Arjun Malhotra',
    'Pooja Bhatt', 'Vivek Chawla', 'Divya Menon', 'Siddharth Rao', 'Kavya Pillai',
    'Nikhil Saxena', 'Ritu Agarwal', 'Aditya Pandey', 'Meera Krishnan', 'Farhan Ahmed',
    'Tanya Kapoor', 'Suresh Babu', 'Ananya Joshi', 'Rajesh Kumar', 'Simran Kaur',
  ];
  const skillSets = [
    ['Node.js', 'MongoDB'], ['React', 'TypeScript'], ['Excel', 'Risk Modeling'],
    ['Kubernetes', 'Docker'], ['SQL', 'Power BI'], ['Java', 'Spring'],
    ['Selenium', 'Cypress'], ['Python', 'Django'], ['Roadmapping', 'Agile'],
  ];
  const candidates = await Promise.all(
    candidateNames.map((name, i) => {
      const owner = employees[i % employees.length];
      return Candidate.create({
        name,
        phone: '98' + String(10000000 + i * 137).slice(0, 8),
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        location: ['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Delhi'][i % 5],
        skills: skillSets[i % skillSets.length],
        totalExperience: 1 + (i % 8),
        currentCompany: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Capgemini'][i % 5],
        currentRole: 'Software Engineer',
        currentCTC: 600000 + i * 50000,
        expectedCTC: 900000 + i * 60000,
        noticePeriod: ['Immediate', '15 days', '30 days', '60 days'][i % 4],
        source: ['Manual', 'Meta', 'Google', 'Referral'][i % 4],
        createdBy: owner._id,
        assignedTo: owner._id,
      });
    })
  );

  console.log('[seed-demo] Creating applications...');
  // A mix of stages so the funnel/dashboards have something to show:
  // a few Sourced/Screening (need open followups), a couple Interview
  // Scheduled, one Offer, one Joined (terminal), one Rejected (terminal).
  // Only the first 12 candidates get an application — the rest are left
  // application-less on purpose, to demo/test candidate-only calls.
  const stagePlan = [
    'Sourced', 'Sourced', 'Screening', 'Screening', 'Interview Scheduled',
    'Interview Scheduled', 'Interview Done', 'Offer', 'Joined', 'Rejected',
    'Sourced', 'Screening',
  ];

  const applications = [];
  for (let i = 0; i < stagePlan.length; i++) {
    const candidate = candidates[i];
    const jobRequirement = jobRequirements[i % jobRequirements.length];
    const stage = stageByName[stagePlan[i]];
    const isTerminal = stage.isTerminal;

    const application = await Application.create({
      candidate: candidate._id,
      jobRequirement: jobRequirement._id,
      funnelStage: stage._id,
      assignedTo: jobRequirement.assignedTo,
      createdBy: jobRequirement.assignedTo,
      status: stage.name === 'Joined' ? 'Joined' : stage.name === 'Rejected' ? 'Rejected' : 'Active',
      rejectionReason: stage.name === 'Rejected' ? 'Client rejected' : undefined,
      joiningDate: stage.name === 'Joined' ? daysFromNow(-3) : undefined,
    });
    applications.push({ application, isTerminal, ownerId: jobRequirement.assignedTo });
  }

  console.log('[seed-demo] Creating follow-ups...');
  const followupTypes = ['Call', 'Email', 'Interview Reminder', 'Document Collection'];
  let followupIndex = 0;
  for (const { application, isTerminal, ownerId } of applications) {
    if (isTerminal) continue;
    followupIndex += 1;

    // Spread across overdue / due today / upcoming so the employee
    // dashboard's three groups all have rows to show.
    const offsetPlan = [-4, -1, 0, 1, 3, 7];
    const offset = offsetPlan[followupIndex % offsetPlan.length];

    const followup = await Followup.create({
      candidate: application.candidate,
      application: application._id,
      assignedTo: ownerId,
      dueDate: daysFromNow(offset),
      type: followupTypes[followupIndex % followupTypes.length],
      status: offset < -2 ? 'Missed' : 'Pending',
      notes: 'Auto-generated demo follow-up.',
      createdBy: ownerId,
      adminNotified: offset < -2,
    });

    if (offset < -2) {
      await Notification.create({
        user: admin._id,
        type: 'followup_missed_escalation',
        message: `Follow-up for a candidate assigned to an employee has been missed for over 2 days.`,
        relatedEntity: { entityType: 'Followup', entityId: followup._id },
      });
    }
  }

  console.log('[seed-demo] Creating call logs...');
  const candidateDispositionNames = Object.values(dispositionByName)
    .filter((d) => d.appliesTo !== 'Client')
    .map((d) => d.name);
  const clientDispositionNames = Object.values(dispositionByName)
    .filter((d) => d.appliesTo !== 'Candidate')
    .map((d) => d.name);

  // Calls against candidates that DO have an application.
  for (let i = 0; i < 12; i++) {
    const { application, ownerId } = applications[i % applications.length];
    const dispositionName = candidateDispositionNames[i % candidateDispositionNames.length];
    const startedAt = daysFromNow(-(i % 6));
    await CallLog.create({
      calleeType: 'Candidate',
      candidate: application.candidate,
      application: application._id,
      employee: ownerId,
      disposition: dispositionByName[dispositionName]._id,
      durationSeconds: 30 + i * 20,
      notes: 'Demo call log entry.',
      callStatus: 'completed',
      startedAt,
      endedAt: new Date(startedAt.getTime() + (30 + i * 20) * 1000),
      createdAt: startedAt,
    });
  }

  // Calls against the application-less candidates — this is what Stage 11's
  // bug fix (Call button must work with no application) demos.
  const looseCandidates = candidates.slice(applications.length);
  for (let i = 0; i < looseCandidates.length; i++) {
    const candidate = looseCandidates[i];
    const owner = employees[i % employees.length];
    const dispositionName = candidateDispositionNames[i % candidateDispositionNames.length];
    const startedAt = daysFromNow(-(i % 4));
    await CallLog.create({
      calleeType: 'Candidate',
      candidate: candidate._id,
      employee: owner._id,
      disposition: dispositionByName[dispositionName]._id,
      durationSeconds: 45 + i * 15,
      notes: 'Sourcing call — no application yet.',
      callStatus: 'completed',
      startedAt,
      endedAt: new Date(startedAt.getTime() + (45 + i * 15) * 1000),
      createdAt: startedAt,
    });
  }

  // One undisposed completed call — tests the "needs details" badge.
  const undisposedCandidate = looseCandidates[0];
  if (undisposedCandidate) {
    const startedAt = daysFromNow(0);
    await CallLog.create({
      calleeType: 'Candidate',
      candidate: undisposedCandidate._id,
      employee: employees[0]._id,
      durationSeconds: 62,
      callStatus: 'completed',
      startedAt,
      endedAt: new Date(startedAt.getTime() + 62 * 1000),
      createdAt: startedAt,
    });
  }

  // Client calls + a couple of client follow-ups.
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const owner = employees[i % employees.length];
    const dispositionName = clientDispositionNames[i % clientDispositionNames.length];
    const startedAt = daysFromNow(-(i % 5));
    const duration = 90 + i * 30;
    await CallLog.create({
      calleeType: 'Client',
      client: client._id,
      jobRequirement: jobRequirements.find((jr) => jr.client.toString() === client._id.toString())?._id,
      contactName: client.contactName,
      contactPhone: client.contactPhone,
      employee: owner._id,
      disposition: dispositionByName[dispositionName]._id,
      durationSeconds: duration,
      notes: 'Demo client call.',
      callStatus: 'completed',
      startedAt,
      endedAt: new Date(startedAt.getTime() + duration * 1000),
      createdAt: startedAt,
    });

    if (i % 2 === 0) {
      await Followup.create({
        client: client._id,
        assignedTo: owner._id,
        dueDate: daysFromNow(i % 2 === 0 ? -1 : 2),
        type: 'Call',
        status: i === 0 ? 'Missed' : 'Pending',
        notes: 'Follow up on open requirement.',
        createdBy: owner._id,
      });
    }
  }

  console.log('[seed-demo] Done.');
  console.log('');
  console.log('Demo logins:');
  console.log('  Super Admin: admin@oakhire.com / Admin@123');
  console.log('  Employee 1:  rohan@oakhire.com / Employee@123');
  console.log('  Employee 2:  priya@oakhire.com / Employee@123');
  console.log('  Employee 3:  karan@oakhire.com / Employee@123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed-demo] Failed:', err);
  process.exit(1);
});
