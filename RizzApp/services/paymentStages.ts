export type NumberedPaymentType = `${number}${'st'|'nd'|'rd'|'th'} Payment`;

export function numberedPaymentLabel(value: string | number): NumberedPaymentType {
  const text=String(value).trim();
  if(!/^[1-9]\d{0,3}$/.test(text))throw new Error('Enter a payment number from 1 to 9999');
  const number=Number(text), lastTwo=number%100;
  const suffix=lastTwo>=11&&lastTwo<=13?'th':({1:'st',2:'nd',3:'rd'} as Record<number,string>)[number%10]||'th';
  return `${number}${suffix} Payment` as NumberedPaymentType;
}
