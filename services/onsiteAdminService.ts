import { onsiteAPI } from "@/services/onsiteApiClient"
import { onsitePaths as path } from "@/services/onsiteConstants"

export const getUsers = () =>
    onsiteAPI.get( path.USERS )

export const getUsersById = ( id: string ) =>
    onsiteAPI.get( `${path.USERS}/${id}` )

export const getOnsiteJobs = () =>
    onsiteAPI.get( path.ONSITE_JOB + "?limit=1000000" )

export const getOnsiteJobsById = ( id: string ) =>
    onsiteAPI.get( `${path.ONSITE_JOB}/${id}` )

export const getTechServiceByJobId = ( jobId: string ) =>
    onsiteAPI.get( `${path.TECH_SERVICE}/byjobId_Onsite/${jobId}` )

export const getTechServiceById = ( id: string ) =>
    onsiteAPI.get( `${path.TECH_SERVICE}/${id}` )

export const getJobByTechUser = ( username: string ) =>
    onsiteAPI.get( `${path.TECH_SERVICE}/bytech_user/${username}` )

export const getBrokenList = () =>
    onsiteAPI.get( path.GET_BROKEN_LIST )

export const getTypeJob = () =>
    onsiteAPI.get( path.GET_BROKEN_LIST + "/" + path.TYPE_JOB )

export const getServiceTime = () =>
    onsiteAPI.get( path.GET_TIME )

export const getItemsByJobId = ( jobId: string ) =>
    onsiteAPI.get( `${path.TECH_SERVICE}/itemsByTech_issues/${jobId}` )

export const getLogsUpdateStatus = ( jobId: string ) =>
    onsiteAPI.get( `${ path.ONSITE_JOB }/getLogs_updatestatus/${jobId}` )

export const getLogsTechnician = () =>
    onsiteAPI.get( `${ path.TECH_SERVICE }/logs` )

export const getLogsLogin = () =>
    onsiteAPI.get( `${ path.AUTH }/get_loglogin` )

export const apiCreateOnsiteJob = ( Jsondata: object ) =>
    onsiteAPI.post( path.ONSITE_JOB, Jsondata )

export const apiCreateTechnician = ( Jsondata: object ) =>
    onsiteAPI.post( path.TECH_SERVICE, Jsondata )

export const apiCreateBrokenList = ( Jsondata: object ) =>
    onsiteAPI.post( path.GET_BROKEN_LIST, Jsondata )

export const apiCreateServiceTime = ( Jsondata: object ) =>
    onsiteAPI.post( path.GET_TIME, Jsondata )

export const apiCreateItems = ( Jsondata: object ) =>
    onsiteAPI.post( `${path.TECH_SERVICE}/addItems`, Jsondata )

export const apiCreateUsers = ( Jsondata: object ) =>
    onsiteAPI.post( path.USERS, Jsondata )

export const apiUpdatePassword = ( Jsondata: object, id: string ) =>
    onsiteAPI.put( `${path.USERS}/password/${id}`, Jsondata )

export const apiUpdateTechService = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( `${path.TECH_SERVICE}/${id}`, Jsondata )

export const apiUpdateOnsiteJob = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( `${path.ONSITE_JOB}/${id}`, Jsondata )

export const apiUpdateUsers = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( `${path.USERS}/updateUser/${id}`, Jsondata )

export const apiUpdateBrokenList = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( `${path.GET_BROKEN_LIST}/${id}`, Jsondata )

export const apiUpdateServiceTime = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( `${path.GET_TIME}/${id}`, Jsondata )

export const apiDeleteBrokenList = ( id: string ) =>
    onsiteAPI.delete( `${path.GET_BROKEN_LIST}/${id}` )

export const apiDeleteServiceTime = ( id: string ) =>
    onsiteAPI.delete( `${path.GET_TIME}/${id}` )

export const apiDeleteItems = ( id: string ) =>
    onsiteAPI.delete( `${path.TECH_SERVICE}/items/${id}` )

export const apiDeleteUsers = ( id: string ) =>
    onsiteAPI.delete( path.USERS + `/${id}` )

export const apiUpdateStatusJobs = ( id: string, Jsondata: object ) =>
    onsiteAPI.patch( `${path.ONSITE_JOB}/updatestatus/${id}`, Jsondata )

export const apiUpdateStatusTechnician = ( id: string, Jsondata: object ) =>
    onsiteAPI.patch( `${path.TECH_SERVICE}/updatestatus/${id}`, Jsondata )

export const apiUpdateStatusEmail = ( id: string, Jsondata: object ) =>
    onsiteAPI.patch( `${path.TECH_SERVICE}/update_sendemail/${id}`, Jsondata )
