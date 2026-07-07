import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  setApiUserId,
  apiUserData,
  apiAddMedication,
  apiToggleMedication,
  apiDeleteMedication,
  apiAddAppointment,
  apiDeleteAppointment,
  apiSaveEmergencyProfile,
  apiRegisterDonor,
  apiRequestBlood,
  apiHealth,
} from '../api/client';

const DataContext = createContext(null);

const EMPTY = {
  medications: [],
  appointments: [],
  emergencyProfile: {
    bloodGroup: 'B+',
    allergies: '',
    conditions: '',
    medications: '',
    emergencyContact: '',
    cnic: '',
    phone: '',
    address: '',
  },
  bloodDonors: [],
  bloodRequests: [],
  triageHistory: [],
  prescriptions: [],
  activityLog: [],
};

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(`healthhub_${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function buildTriageCarePlan(triage, symptoms) {
  const facility = triage.facilities?.[0];
  const steps = [];
  const ts = Date.now();

  if (triage.urgency === 'emergency') {
    steps.push({
      id: `step-${ts}-1`,
      type: 'emergency',
      title: 'Call emergency services',
      detail: 'Dial 1122 immediately based on your triage result.',
      route: null,
      action: 'call1122',
      done: false,
    });
    steps.push({
      id: `step-${ts}-2`,
      type: 'profile',
      title: 'Confirm emergency profile',
      detail: 'Make sure your QR medical ID is up to date for responders.',
      route: '/app/emergency',
      done: false,
    });
  }

  if (facility && triage.urgency !== 'self-care') {
    steps.push({
      id: `step-${ts}-3`,
      type: 'queue',
      title: `Join queue at ${facility.name}`,
      detail: `Estimated wait: ${triage.estimated_wait}. City: ${triage.city}.`,
      route: '/app/queue',
      payload: { hospitalId: facility.id, hospitalName: facility.name, reason: triage.condition },
      done: false,
    });
    steps.push({
      id: `step-${ts}-4`,
      type: 'appointment',
      title: 'Book a follow up visit',
      detail: `Schedule with ${facility.name} after initial care.`,
      route: '/app/appointments',
      payload: { hospital: facility.name, type: triage.condition, city: triage.city },
      done: false,
    });
  }

  steps.push({
    id: `step-${ts}-5`,
    type: 'assistant',
    title: 'Learn more about your condition',
    detail: `Ask the health assistant about ${triage.condition}.`,
    route: '/app/assistant',
    payload: { prefilledQuestion: `Tell me about ${triage.condition} and what I should do in Pakistan.` },
    done: false,
  });

  return {
    id: ts,
    startedAt: new Date().toISOString(),
    symptoms,
    triage,
    facility,
    steps,
    status: 'active',
  };
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [medications, setMedications] = useState(EMPTY.medications);
  const [appointments, setAppointments] = useState(EMPTY.appointments);
  const [emergencyProfile, setEmergencyProfileState] = useState(EMPTY.emergencyProfile);
  const [bloodDonors, setBloodDonors] = useState(EMPTY.bloodDonors);
  const [bloodRequests, setBloodRequests] = useState(EMPTY.bloodRequests);
  const [triageHistory, setTriageHistory] = useState(EMPTY.triageHistory);
  const [prescriptions, setPrescriptions] = useState(EMPTY.prescriptions);
  const [activityLog, setActivityLog] = useState(EMPTY.activityLog);
  const [carePlan, setCarePlan] = useState(() => loadLocal('carePlan', []));
  const [activeCase, setActiveCase] = useState(() => loadLocal('activeCase', null));
  const [activeQueue, setActiveQueue] = useState(() => loadLocal('activeQueue', null));
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const persistLocal = (key, val) => localStorage.setItem(`healthhub_${key}`, JSON.stringify(val));

  useEffect(() => { persistLocal('carePlan', carePlan); }, [carePlan]);
  useEffect(() => { persistLocal('activeCase', activeCase); }, [activeCase]);
  useEffect(() => { persistLocal('activeQueue', activeQueue); }, [activeQueue]);

  const applyUserData = useCallback((data) => {
    setMedications(data.medications || []);
    setAppointments(data.appointments || []);
    setEmergencyProfileState(data.emergencyProfile || EMPTY.emergencyProfile);
    setBloodDonors(data.bloodDonors || []);
    setBloodRequests(data.bloodRequests || []);
    setTriageHistory(data.triageHistory || []);
    setPrescriptions(data.prescriptions || []);
    setActivityLog(data.activityLog || []);
  }, []);

  const refreshData = useCallback(async () => {
    if (!user?.email) return;
    setApiUserId(user.email);
    setLoading(true);
    setSyncError(null);
    try {
      const [data, health] = await Promise.all([apiUserData(), apiHealth()]);
      applyUserData(data);
      setLlmStatus(health.llm);
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email, applyUserData]);

  useEffect(() => {
    if (user?.email) {
      setApiUserId(user.email);
      refreshData();
    }
  }, [user?.email, refreshData]);

  const completeCareStep = (stepId) => {
    setCarePlan((plan) => plan.map((s) => (s.id === stepId ? { ...s, done: true } : s)));
    if (activeCase) {
      setActiveCase((c) => ({
        ...c,
        steps: c.steps.map((s) => (s.id === stepId ? { ...s, done: true } : s)),
      }));
    }
  };

  const startTriageFlow = (triage, symptoms) => {
    const entry = {
      ...triage,
      id: triage.id || Date.now(),
      at: triage.at || new Date().toISOString(),
      symptomsPreview: symptoms.slice(0, 80),
    };
    setTriageHistory((h) => {
      const exists = h.some((x) => x.id === entry.id);
      return exists ? h : [entry, ...h].slice(0, 20);
    });

    const newCase = buildTriageCarePlan(triage, symptoms);
    setActiveCase(newCase);
    setCarePlan(newCase.steps);
    refreshData();
    return newCase;
  };

  const completePrescriptionFlow = (rx) => {
    const entry = { ...rx, id: rx.id || Date.now(), at: rx.at || new Date().toISOString() };
    setPrescriptions((p) => {
      const exists = p.some((x) => x.id === entry.id);
      return exists ? p : [entry, ...p].slice(0, 10);
    });

    const steps = [];
    if (rx.medicines?.length) {
      steps.push({
        id: `rx-${Date.now()}-1`,
        type: 'medications',
        title: 'Add scanned medicines to reminders',
        detail: `${rx.medicines.length} medicine(s) detected from your prescription.`,
        route: '/app/medications',
        payload: { fromPrescription: true, medicines: rx.suggested_reminders },
        done: false,
      });
    }
    steps.push({
      id: `rx-${Date.now()}-2`,
      type: 'appointment',
      title: 'Schedule a follow up',
      detail: 'Book a visit to review your new prescription with a doctor.',
      route: '/app/appointments',
      payload: { type: 'Prescription follow up' },
      done: false,
    });

    setCarePlan((plan) => [...steps, ...plan]);
    if (activeCase) {
      setActiveCase((c) => ({ ...c, steps: [...steps, ...c.steps] }));
    } else {
      setActiveCase({ id: Date.now(), startedAt: new Date().toISOString(), status: 'prescription', steps });
    }
    refreshData();
    return entry;
  };

  const addMedication = async (med) => {
    const item = await apiAddMedication({ ...med, source: med.source || 'manual' });
    setMedications((m) => [...m, item]);
    refreshData();
    return item;
  };

  const addMedicationsFromPrescription = async (reminders) => {
    for (const r of reminders || []) {
      await apiAddMedication({
        name: r.medicine,
        dose: 'As prescribed',
        time: '08:00',
        frequency: r.time || 'As prescribed',
        notes: r.note,
        source: 'prescription',
      });
    }
    const step = carePlan.find((s) => s.type === 'medications' && !s.done);
    if (step) completeCareStep(step.id);
    await refreshData();
  };

  const toggleMedication = async (id) => {
    const { taken } = await apiToggleMedication(id);
    setMedications((m) => m.map((x) => (x.id === id ? { ...x, taken } : x)));
  };

  const deleteMedication = async (id) => {
    await apiDeleteMedication(id);
    setMedications((m) => m.filter((x) => x.id !== id));
    refreshData();
  };

  const addAppointment = async (appt) => {
    const item = await apiAddAppointment(appt);
    setAppointments((a) => [...a, item]);
    const step = carePlan.find((s) => s.type === 'appointment' && !s.done);
    if (step) completeCareStep(step.id);
    refreshData();
    return item;
  };

  const deleteAppointment = async (id) => {
    await apiDeleteAppointment(id);
    setAppointments((a) => a.filter((x) => x.id !== id));
  };

  const setEmergencyProfile = async (profile) => {
    setEmergencyProfileState(profile);
    await apiSaveEmergencyProfile(profile);
  };

  const setQueueResult = (queueData) => {
    setActiveQueue(queueData);
    const step = carePlan.find((s) => s.type === 'queue' && !s.done);
    if (step) completeCareStep(step.id);
    refreshData();
  };

  const registerDonor = async (donor) => {
    const item = await apiRegisterDonor(donor);
    setBloodDonors((d) => [...d, item]);
    refreshData();
  };

  const requestBlood = async (req) => {
    const item = await apiRequestBlood({
      ...req,
      bloodGroup: req.bloodGroup || emergencyProfile.bloodGroup,
    });
    setBloodRequests((r) => [...r, item]);
    refreshData();
    return item;
  };

  const pendingSteps = carePlan.filter((s) => !s.done);
  const completedSteps = carePlan.filter((s) => s.done);

  return (
    <DataContext.Provider value={{
      medications, addMedication, addMedicationsFromPrescription, toggleMedication, deleteMedication,
      appointments, addAppointment, deleteAppointment,
      emergencyProfile, setEmergencyProfile,
      bloodDonors, registerDonor, bloodRequests, requestBlood,
      triageHistory, startTriageFlow,
      prescriptions, completePrescriptionFlow,
      activityLog,
      carePlan, pendingSteps, completedSteps, completeCareStep,
      activeCase, activeQueue, setQueueResult,
      loading, llmStatus, syncError, refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
