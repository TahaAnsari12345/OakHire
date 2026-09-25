import { useEffect, useState } from 'react';
import api from '../api/axios';

export function useCandidateOptions() {
  const [candidates, setCandidates] = useState([]);
  useEffect(() => {
    api.get('/candidates', { params: { limit: 100 } }).then(({ data }) => setCandidates(data.data)).catch(() => setCandidates([]));
  }, []);
  return candidates;
}

export function useJobRequirementOptions() {
  const [jobRequirements, setJobRequirements] = useState([]);
  useEffect(() => {
    api.get('/job-requirements', { params: { limit: 100 } }).then(({ data }) => setJobRequirements(data.data)).catch(() => setJobRequirements([]));
  }, []);
  return jobRequirements;
}

export function useFunnelStageOptions() {
  const [stages, setStages] = useState([]);
  useEffect(() => {
    api.get('/funnel-stages').then(({ data }) => setStages(data.stages)).catch(() => setStages([]));
  }, []);
  return stages;
}

export function useDispositionOptions() {
  const [dispositionTypes, setDispositionTypes] = useState([]);
  useEffect(() => {
    api.get('/call-disposition-types').then(({ data }) => setDispositionTypes(data.dispositionTypes)).catch(() => setDispositionTypes([]));
  }, []);
  return dispositionTypes;
}

export function useLeadSourceOptions() {
  const [leadSources, setLeadSources] = useState([]);
  useEffect(() => {
    api.get('/lead-sources').then(({ data }) => setLeadSources(data.leadSources)).catch(() => setLeadSources([]));
  }, []);
  return leadSources;
}
