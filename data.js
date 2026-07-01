/* ============================================================
   会議費・交際費監査 デモ用データ生成（単一ソース）
   ブラウザ: window.AUDIT_DATA / Node: require('./data.js')
   決裁50件・うち不備10件（毎5件目）。masters内蔵。
   ============================================================ */
(function(root){
  const pad=(n,l=3)=>String(n).padStart(l,'0');
  const d2=n=>String(n).padStart(2,'0');

  const roleMaster=[
    {roleCode:'R10',roleName:'担当',roleLevel:1},
    {roleCode:'R20',roleName:'課長',roleLevel:2},
    {roleCode:'R30',roleName:'部長',roleLevel:3},
    {roleCode:'R40',roleName:'本部長',roleLevel:4},
    {roleCode:'R50',roleName:'役員',roleLevel:5},
  ];
  const authorityMaster=[
    {approvalCategory:'共通',amountFrom:0,      amountTo:50000,  requiredRoleCode:'R20',requiredRoleLevel:2},
    {approvalCategory:'共通',amountFrom:50001,  amountTo:100000, requiredRoleCode:'R30',requiredRoleLevel:3},
    {approvalCategory:'共通',amountFrom:100001, amountTo:500000, requiredRoleCode:'R40',requiredRoleLevel:4},
    {approvalCategory:'共通',amountFrom:500001, amountTo:999999999,requiredRoleCode:'R50',requiredRoleLevel:5},
  ];
  const accountTaxMaster=[
    {keyword:'会食',   expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'意見交換',expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'懇親',   expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'接待',   expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'手土産', expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'贈答',   expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'ゴルフ', expectedAccountCode:'5210',expectedAccountName:'交際費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'表彰',   expectedAccountCode:'5220',expectedAccountName:'表彰費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'祝賀',   expectedAccountCode:'5220',expectedAccountName:'表彰費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'会議',   expectedAccountCode:'5110',expectedAccountName:'会議費',expectedTaxCode:'T10',expectedTaxRate:0.1},
    {keyword:'打合せ', expectedAccountCode:'5110',expectedAccountName:'会議費',expectedTaxCode:'T10',expectedTaxRate:0.1},
  ];

  const cats=[
    {t:'取引先%sとの会食（実施伺い）',       kw:'会食',   acc:'5210',accName:'交際費'},
    {t:'%s様への手土産・贈答（実施伺い）',   kw:'手土産', acc:'5210',accName:'交際費'},
    {t:'%sとの接待ゴルフコンペ（実施伺い）', kw:'ゴルフ', acc:'5210',accName:'交際費'},
    {t:'%sとの商談打合せ 会議費（実施伺い）',kw:'打合せ', acc:'5110',accName:'会議費'},
    {t:'%s様をお招きした懇親会（実施伺い）', kw:'懇親',   acc:'5210',accName:'交際費'},
  ];
  const vendors=['A商事','B物産','C工業','Dシステム','E商会','F製作所','G興業','Hホールディングス','I産業','J物流'];

  // 不備10件（毎5件目）: 種類を割り当て
  const DEFECTS={5:'auth',10:'timing',15:'account',20:'tax',25:'nojournal',30:'evidence',35:'auth_account',40:'timing_tax',45:'nojournal_auth',50:'evidence_account_timing'};
  const wrongAcc=a=>a==='5210'?'5110':'5210';

  const approvals=[], journals=[], evidences=[];
  for(let i=1;i<=50;i++){
    const c=cats[(i-1)%cats.length];
    const vendor=vendors[(i-1)%vendors.length];
    const id='AP-'+pad(i);
    const day=((i-1)%25)+1;
    let amount=[30000,45000,80000,60000,120000][(i-1)%5];
    let role=amount>100000?'R40':'R30';
    let approvalDate=`2026-05-${d2(day)}`;
    let plannedDate=`2026-06-${d2(day)}`;
    let jAcc=c.acc, jTax=0.1, makeJournal=true;
    let makeEvidence=true, evAmount=null, evConf=0.95;

    const def=DEFECTS[i];
    if(def==='auth'){ amount=300000; role='R20'; }
    else if(def==='timing'){ approvalDate=`2026-06-${d2(Math.min(day+15,28))}`; plannedDate=`2026-06-${d2(day)}`; }
    else if(def==='account'){ jAcc=wrongAcc(c.acc); }
    else if(def==='tax'){ jTax=0.08; }
    else if(def==='nojournal'){ makeJournal=false; }
    else if(def==='evidence'){ makeEvidence=false; }               // 証憑なし → 証憑突合NG
    else if(def==='auth_account'){ amount=250000; role='R20'; jAcc=wrongAcc(c.acc); }
    else if(def==='timing_tax'){ approvalDate=`2026-06-${d2(Math.min(day+15,28))}`; plannedDate=`2026-06-${d2(day)}`; jTax=0.08; }
    else if(def==='nojournal_auth'){ makeJournal=false; amount=300000; role='R20'; }
    else if(def==='evidence_account_timing'){ makeEvidence=false; jAcc=wrongAcc(c.acc); approvalDate=`2026-06-${d2(Math.min(day+15,28))}`; plannedDate=`2026-06-${d2(day)}`; }

    approvals.push({
      approvalId:id,
      approvalTitle:c.t.replace('%s',vendor),
      approvalSummaryAi:`${vendor}に関する${c.kw}案件`,
      requestDetail:`${c.kw}の実施可否をご決裁ください`,
      approvalDate, plannedDate, relatedApprovalId:'',
      approverRoleCode:role, amount, vendor
    });
    if(makeJournal){
      journals.push({
        journalId:'JR-'+pad(i), approvalId:id,
        accountCode:jAcc, accountName:(jAcc===c.acc?c.accName:(jAcc==='5110'?'会議費':jAcc==='5220'?'表彰費':'交際費')),
        taxCode:jTax===0.1?'T10':'T08', taxRate:jTax, amount, postingDate:plannedDate
      });
    }
    if(makeEvidence){
      const total=evAmount!=null?evAmount:amount;
      const taxRate=0.1;
      evidences.push({
        evidenceId:'EV-'+pad(i), approvalId:id,
        evidenceType:(c.kw==='打合せ'?'請求書':'領収書'), vendorName:vendor,
        paymentDate:plannedDate, totalAmount:total,
        taxAmount:Math.round(total-total/(1+taxRate)), taxRate,
        invoiceRegistrationNumber:'T'+String(1000000000000+i), ocrConfidence:evConf
      });
    }
  }

  const DATA={approvals,journals,evidences,roleMaster,authorityMaster,accountTaxMaster,
    meta:{total:50,defect:Object.keys(DEFECTS).length,defectIds:Object.keys(DEFECTS).map(i=>'AP-'+pad(+i))}};
  root.AUDIT_DATA=DATA;
  if(typeof module!=='undefined'&&module.exports) module.exports=DATA;
})(typeof window!=='undefined'?window:globalThis);
