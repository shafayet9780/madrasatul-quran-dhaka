import type { MultilingualText } from './sanity';
export type FeeLocale = 'bengali' | 'english';
export interface FeePrice {
  status: 'priced' | 'notApplicable' | 'contactOffice';
  amount?: number;
}
export interface FinancialEntry {
  _key: string;
  name: MultilingualText;
  note?: MultilingualText;
  visible: boolean;
}
export interface SchoolFee extends FinancialEntry {
  frequency: 'monthly' | 'oneTime' | 'annual' | 'custom';
  customFrequency?: MultilingualText;
  preHifz: FeePrice;
  hifz: FeePrice;
}
export interface TransportFee extends FinancialEntry {
  price: FeePrice;
}
export interface FeeDiscount {
  _key: string;
  visible: boolean;
  title: MultilingualText;
  description: MultilingualText;
  conditions: MultilingualText;
  appliesTo: string[];
}
export interface FeeSettings {
  _id: string;
  _type: 'feeSettings';
  heading: MultilingualText;
  introduction: MultilingualText;
  preHifzLabel: MultilingualText;
  hifzLabel: MultilingualText;
  transportHeading: MultilingualText;
  transportIntroduction: MultilingualText;
  discountsHeading: MultilingualText;
  paymentHeading: MultilingualText;
  paymentInstructions: MultilingualText;
  unavailableMessage: MultilingualText;
  faqQuestion: MultilingualText;
  faqAnswer: MultilingualText;
  fees: SchoolFee[];
  transport: TransportFee[];
  discounts: FeeDiscount[];
  policies: Array<{ _key: string; text: MultilingualText }>;
}
