type AdminAuthorizationInput={
 authorization?:string|null;
 cloudflareAccessJwt?:string|null;
 sessionToken?:string|null;
};

export function adminAuthorization(input:AdminAuthorizationInput){
 const inbound=input.authorization?.trim();
 if(inbound&&/^Bearer\s+\S+$/i.test(inbound))return inbound;

 const accessJwt=input.cloudflareAccessJwt?.trim();
 if(accessJwt)return asBearer(accessJwt);

 const sessionToken=input.sessionToken?.trim();
 if(sessionToken)return asBearer(sessionToken);
 return null;
}

function asBearer(token:string){
 return /^Bearer\s+/i.test(token)?token:`Bearer ${token}`;
}
