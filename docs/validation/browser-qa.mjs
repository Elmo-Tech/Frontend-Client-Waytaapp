import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir,cp,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '/Users/ashraf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root='/private/tmp/wayta-web-refactor', evidence=`${root}/browser-evidence`;
await mkdir(evidence,{recursive:true});
const uuid=n=>`${n}`.repeat(8)+'-'+`${n}`.repeat(4)+'-4'+`${n}`.repeat(3)+'-8'+`${n}`.repeat(3)+'-'+`${n}`.repeat(12);
const product=uuid(2),branch=uuid(4),templates=['CLASSIC','LIST','GALLERY','MENU','FLOATING','CENTERED','COMPACT','EDITORIAL','EMBER','BLOOM','BREW'];
const requests=[];
const contact=Object.fromEntries(['phone','whatsapp','hotline','facebookUrl','instagramUrl','tiktokUrl','telegramUrl','youtubeUrl','xUrl','snapchatUrl','mapsUrl','websiteUrl'].map(k=>[k,null]));
const api=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost:14480'); let body='';for await(const c of req)body+=c;
 res.setHeader('Access-Control-Allow-Origin',req.headers.origin||'http://localhost:14482');res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Access-Control-Allow-Headers','Content-Type,Idempotency-Key');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Content-Type','application/json');
 const send=(data,status=200)=>{res.statusCode=status;res.end(JSON.stringify(data));};
 if(req.method==='OPTIONS')return send({});
 if(url.pathname.endsWith('/auth/me'))return send({error:{code:'UNAUTHENTICATED'}},req.headers.cookie?.includes('qa_outage=1')?503:401);
 if(url.pathname.endsWith('/landing/plans'))return send({data:{trialDays:15,plans:[]}});
 if(url.pathname.match(/\/public\/qr\/[^/]+\/menu$/)){
  const code=url.pathname.split('/').at(-2),lang=url.searchParams.get('lang')==='ar'?'ar':'en';
  if(code==='missing')return send({error:{code:'QR_NOT_FOUND'}},404);
  if(code==='unavailable')return send({error:{code:'MENU_NOT_AVAILABLE'}},409);
  const exclusive={verde:'VERDE_NAPOLI_V1',sherbiny:'SHERBINY_FIRE_DOUGH_V1',makkboz:'MAKKBOZ_HERITAGE_V1',meat:'MEAT_LOVERS_BUTCHER_V1'}[code];
  return send({data:{context:{entry:{publicCode:code,redirectToSlug:null},platform:{poweredByUrl:'https://waytaapp.com'},qrType:code==='table'?'TABLE':'GENERIC',tableOrdering:code==='table'?'AVAILABLE':null,restaurant:{name:lang==='ar'?'مطعم التجربة':'Pilot Restaurant',currencyCode:'EGP',countryCode:'EG',logoAssetPath:null,coverAssetPath:null,menuTemplate:'CLASSIC',exclusiveRendererKey:exclusive,exclusiveInUse:!!exclusive,contact,shareCode:null,hours:null},branch:code==='table'?{name:'Main branch'}:null,table:code==='table'?{number:'7'}:null,announcements:[],offers:[],suggestions:false,tracking:false,templatesAllowed:true,allowedTemplates:templates,ordering:{pickup:true,delivery:false,whatsapp:false},pickupBranches:[{id:branch,name:'Main branch',hours:null}],deliveryBranches:[],locations:[]},locale:{requested:lang,resolved:lang,default:'en',available:['en','ar']},menu:{id:uuid(5),name:'Main menu',description:'Fresh dishes every day',categories:[{id:uuid(3),name:lang==='ar'?'بيتزا':'Pizza',description:null,imageAssetPath:null,products:[{id:product,name:lang==='ar'?'بيتزا مارجريتا':'Pizza Margherita',description:'Tomato, mozzarella and basil',basePrice:'100.00',discount:null,primaryImageAssetPath:null,availability:'AVAILABLE',featured:true,modifierGroups:[],variants:[]}]}]}}});
 }
 if(req.method==='POST'&&url.pathname.endsWith('/orders')){
  requests.push({path:url.pathname,body:JSON.parse(body)});
  return send({data:{id:uuid(7),status:'PENDING',currencyCode:'EGP',total:'100.00',createdAt:'2026-11-12T10:00:00.000Z',type:'DINE_IN',table:{number:'7'},pickupBranch:null,delivery:null,subtotal:'100.00',deliveryFee:'0.00',discountTotal:'0.00',items:[{productId:product,name:'Pizza Margherita',variantName:null,quantity:1,unitPrice:'100.00',discountAmount:'0.00',lineTotal:'100.00',modifiers:[]}]}});
 }
 return send({error:{code:'NOT_FOUND'}},404);
});
await new Promise(r=>api.listen(14480,r));
await cp(`${root}/project/.next/static`,`${root}/project/.next/standalone/.next/static`,{recursive:true});
await cp(`${root}/project/public`,`${root}/project/.next/standalone/public`,{recursive:true});
const children=[];let browser;
try{
 for(const [name,port]of [['baseline',14481],['project',14482]]){
  const child=spawn(process.execPath,name==='baseline'?[`${root}/baseline/node_modules/next/dist/bin/next`,'start','--port',`${port}`,'--hostname','127.0.0.1']:['server.js'],{cwd:name==='baseline'?`${root}/baseline`:`${root}/project/.next/standalone`,env:{...process.env,PORT:`${port}`,HOSTNAME:'127.0.0.1',API_INTERNAL_URL:'http://localhost:14480',WEB_URL:`http://localhost:${port}`},stdio:['ignore','pipe','pipe']});children.push(child);let logs='';child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);child.on('exit',()=>writeFile(`${evidence}/${name}-server.log`,logs));
  let ready=false;for(let i=0;i<100;i++){try{await fetch(`http://localhost:${port}/robots.txt`);ready=true;break;}catch{await new Promise(r=>setTimeout(r,200));}}assert(ready,`${name} server ready`);
 }
 browser=await chromium.launch({headless:true,executablePath:'/Users/ashraf/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
 const cases=[...templates.map(t=>({path:`/q/pilot?lang=en&template=${t}`,width:390})),...['verde','sherbiny','makkboz','meat'].map(c=>({path:`/q/${c}?lang=en`,width:390})),{path:'/q/pilot?lang=ar',width:390},{path:'/q/pilot?lang=en',width:1440},{path:'/q/missing?lang=en',width:390},{path:'/q/unavailable?lang=ar',width:390},...['/login','/forgot-password','/reset-password','/landing','/landing-clay','/staff','/staff/restaurants/'+uuid(1)+'/menu'].map(path=>({path,width:1440})),{path:'/staff',width:390,outage:true},{path:'/q/table?lang=en',width:390,flow:true}];
 const results=[];
 for(let i=0;i<cases.length;i++){
  if(process.env.QA_CASES&&!process.env.QA_CASES.split(',').includes(String(i)))continue;
  const scenario=cases[i],states=[];
  for(const [label,port]of [['before',14481],['after',14482]]){
   const context=await browser.newContext({viewport:{width:scenario.width,height:900},reducedMotion:'reduce',locale:'en-US',colorScheme:'light'});
   await context.addCookies([{name:'staff_ui_locale',value:'en',domain:'localhost',path:'/'},{name:'guest_theme',value:'light',domain:'localhost',path:'/q'},...(scenario.outage?[{name:'qa_outage',value:'1',domain:'localhost',path:'/'}]:[])]);
   await context.addInitScript(()=>{Date.now=()=>1794477600000;crypto.randomUUID=()=> '66666666-6666-4666-8666-666666666666';});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(`http://localhost:${port}${scenario.path}`,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
   if(scenario.flow){
    await page.getByRole('button',{name:'Add Pizza Margherita',exact:true}).first().click();
    await page.getByRole('button',{name:/View order,/}).click();
    await page.screenshot({path:`${evidence}/${i}-${label}-cart.png`,animations:'disabled'});
    await page.getByRole('button',{name:/^Send order/}).click();
    await page.waitForTimeout(700);
    assert.match(await page.locator('body').innerText(),/received|sent|pending|placed/i,'Order acknowledgement');
   }
   const state=await page.evaluate(()=>({text:document.body.innerText,dir:document.documentElement.dir,overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('input,select,textarea,button')].map(e=>({tag:e.tagName,type:e.type,value:e.value,checked:e.checked,disabled:e.disabled,label:e.getAttribute('aria-label'),text:e.tagName==='BUTTON'?e.innerText:undefined}))}));
   state.errors=errors;state.status=response.status();state.url=new URL(page.url()).pathname+new URL(page.url()).search;
   await page.screenshot({path:`${evidence}/${i}-${label}.png`,animations:'disabled',fullPage:true});
   states.push(state);await context.close();
  }
  assert.deepEqual(states[1],states[0],`case${i} ${scenario.path}`);assert.equal(states[1].errors.length,0,`case${i} no browser errors`);
  results.push({case:i,...scenario,status:states[1].status,url:states[1].url,identicalDom:true,browserErrors:states[1].errors,overflow:states[1].overflow});console.log('PASS',i,scenario.path);
 }
 if(!process.env.QA_CASES||process.env.QA_CASES.split(',').includes('27')){assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);}
 await writeFile(`${evidence}/${process.env.QA_CASES?'targeted-results':'results'}.json`,JSON.stringify({cases:results,orderRequests:requests},null,2));
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();children.forEach(c=>c.kill());api.close();}
