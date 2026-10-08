import { onsiteAPI } from "@/services/onsiteApiClient"
import { onsitePaths as path } from "@/services/onsiteConstants"

export const getJobByTechUser = ( id: string ) =>
    onsiteAPI.get( path.TECH_SERVICE + `/bytech_user/${id}` )

export const getJobById = ( id: string ) =>
    onsiteAPI.get( path.TECH_SERVICE + `/${id}` )

export const getItemsByJobId = ( jobId: string ) =>
    onsiteAPI.get( `${path.TECH_SERVICE}/itemsByTech_issues/${jobId}` )

export const apiUploadSignImage = ( Jsondata: object ) =>
    onsiteAPI.post( path.TECH_SERVICE + `/addSignImage`, Jsondata )

export const apiCreateItems = ( Jsondata: object ) =>
    onsiteAPI.post( `${path.TECH_SERVICE}/addItems`, Jsondata )

export const updateTechnicianById = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( path.TECH_SERVICE + `/${id}`, Jsondata )

export const updateSignImage = ( id: string, Jsondata: object ) =>
    onsiteAPI.put( path.TECH_SERVICE + `/addSignImage/${id}`, Jsondata )

export const apiUpdatePassword = ( Jsondata: object, id: string ) =>
    onsiteAPI.put( path.USERS + `/password/${id}`, Jsondata )

export const apiUpdateStatusJobs = ( id: string, Jsondata: object ) =>
    onsiteAPI.patch( `${path.ONSITE_JOB}/updatestatus/${id}`, Jsondata )

export const apiUpdateStatusTechnician = ( id: string, Jsondata: object ) =>
    onsiteAPI.patch( `${path.TECH_SERVICE}/updatestatus/${id}`, Jsondata )

export const apiDeleteItems = ( id: string ) =>
    onsiteAPI.delete( `${path.TECH_SERVICE}/items/${id}` )
