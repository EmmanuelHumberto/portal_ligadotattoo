export type AdminApiStatus=401|403|409|422|502;

export function classifyAdminStatus(status:number):AdminApiStatus{
 if(status===401)return 401;
 if(status===403)return 403;
 if(status===409)return 409;
 if(status===422)return 422;
 return 502;
}
