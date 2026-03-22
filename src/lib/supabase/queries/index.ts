// Query exports for easy importing
export { getAssignedPatients, getPatientById, getPatientCount } from './patients'
export {
    getPatientRecords,
    getPsychologistRecords,
    getClinicalRecordById,
    createClinicalRecord,
    updateClinicalRecord,
    deleteClinicalRecord,
    getPatientRecordCount
} from './clinical-records'
export {
    getPsychologistAppointments,
    getUpcomingAppointments,
    getPatientAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getTodayAppointments
} from './appointments'
export {
    getVisibleResources,
    getMyResources,
    getPatientResources,
    createResource,
    assignResourceToPatient,
    removeResourceAssignment,
    markResourceViewed,
    deleteResource
} from './resources'
export {
    getEventsWithRegistration,
    getEventById,
    createEvent,
    updateEvent,
    registerForEvent,
    cancelEventRegistration,
    getEventRegistrations
} from './events'
export {
    getInviteCodeByOwner,
    getInviteCodeByCode,
    getInviteAttributionsByReferrer,
    getAttributionForUser,
    getInviteRewardEvents,
    getUnprocessedRewardEvents,
    getInviteSystemStats
} from './invite-referrals'
export { getMonthlySpecializationDemandRanking } from './specialization-waitlist'
