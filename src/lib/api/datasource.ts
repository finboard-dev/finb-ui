import {fetcher} from "@/lib/axios/config";


export const getAllDataSources = (company_id : any ) => {
    try{
        const response = fetcher.get(`datasource/all?company=${company_id}`)
        return response
    } catch (error) {
        console.error("Error fetching data sources:", error);
    }
}