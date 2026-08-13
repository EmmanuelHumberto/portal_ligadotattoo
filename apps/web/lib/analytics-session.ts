const KEY='pt:analytics-session:v1';

export function analyticsSessionId(){
 let id=sessionStorage.getItem(KEY);
 if(!id){
  id=crypto.randomUUID();
  sessionStorage.setItem(KEY,id);
 }
 return id;
}
