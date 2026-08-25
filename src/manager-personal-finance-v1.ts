import type { World } from './engine';
import { userManager } from './manager-character';
import { managerContract } from './manager-employment';
import { queueWorldEvent } from './world-core-v2';

export type ManagerWalletEntry={id:string;date:string;type:'salary'|'expense'|'donation'|'school-investment'|'appearance'|'other';amount:number;description:string;referenceId?:string};
export type ManagerPersonalFinance={managerId:string;balance:number;earned:number;spent:number;entries:ManagerWalletEntry[];lastSalaryDate?:string};
const states=new WeakMap<World,Map<string,ManagerPersonalFinance>>();
function state(w:World){let s=states.get(w);if(!s){s=new Map();states.set(w,s)}return s}
function dayDiff(a:string,b:string){return Math.floor((Date.parse(`${a}T12:00:00Z`)-Date.parse(`${b}T12:00:00Z`))/86400000)}
export function managerWallet(w:World,managerId:string){const s=state(w);let x=s.get(managerId);if(!x){x={managerId,balance:25000,earned:0,spent:0,entries:[]};s.set(managerId,x)}return x}
export function creditManagerWallet(w:World,managerId:string,date:string,amount:number,type:ManagerWalletEntry['type'],description:string,referenceId?:string){if(amount<=0)return false;const x=managerWallet(w,managerId),entry:ManagerWalletEntry={id:`mw-${managerId}-${date}-${x.entries.length+1}`,date,type,amount:Math.round(amount),description,referenceId};x.balance+=entry.amount;x.earned+=entry.amount;x.entries.push(entry);return true}
export function debitManagerWallet(w:World,managerId:string,date:string,amount:number,type:ManagerWalletEntry['type'],description:string,referenceId?:string){const x=managerWallet(w,managerId),v=Math.max(0,Math.round(amount));if(v<=0||x.balance<v)return false;const entry:ManagerWalletEntry={id:`mw-${managerId}-${date}-${x.entries.length+1}`,date,type,amount:-v,description,referenceId};x.balance-=v;x.spent+=v;x.entries.push(entry);return true}
export function tickManagerPersonalFinance(w:World,date:string){const m=userManager(w);if(!m)return;const wallet=managerWallet(w,m.id),contract=managerContract(w,m.id);if(!contract||contract.status==='terminated'||contract.status==='expired')return;if(wallet.lastSalaryDate&&dayDiff(date,wallet.lastSalaryDate)<7)return;wallet.lastSalaryDate=date;creditManagerWallet(w,m.id,date,contract.salaryWeekly,'salary',`Salário semanal como treinador do ${contract.clubId}`,contract.id);queueWorldEvent(w,{date,type:'ManagerSalaryPaid',scope:'person',entityIds:[m.id],importance:0,payload:{salary:contract.salaryWeekly,balance:wallet.balance}})}
export function snapshotManagerPersonalFinance(w:World){return{wallets:[...state(w)].map(([k,v])=>[k,JSON.parse(JSON.stringify(v))] as [string,ManagerPersonalFinance])}}
export function restoreManagerPersonalFinance(w:World,x?:ReturnType<typeof snapshotManagerPersonalFinance>){states.set(w,new Map((x?.wallets??[]).map(([k,v])=>[k,JSON.parse(JSON.stringify(v))])))}
