import {expect,it} from 'vitest';
import {numberedPaymentLabel} from '../services/paymentStages';
it.each([[1,'1st'],[2,'2nd'],[3,'3rd'],[4,'4th'],[11,'11th'],[12,'12th'],[13,'13th'],[21,'21st'],[22,'22nd'],[23,'23rd'],[111,'111th'],[9999,'9999th']])('formats payment stage %s correctly',(number,label)=>{expect(numberedPaymentLabel(number)).toBe(label+' Payment');});
it.each(['','0','01','-1','1.5','2nd','10000','<script>'])('rejects invalid payment stage %j',value=>{expect(()=>numberedPaymentLabel(value)).toThrow('1 to 9999');});
