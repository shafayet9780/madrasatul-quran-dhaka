import { feeSettings } from './feeSettings'
import { homePage } from './homePage'
import { campusDay } from './campusDay'
import { album } from './album'
import { notice } from './notice'
import { testimonial } from './testimonial'
import { siteSettings } from './siteSettings'
import { pagesOnOff } from './pagesOnOff'
import { seoSettings } from './seoSettings'
import { preAdmissionForm } from './preAdmissionForm'
import { department } from './department'
import { director } from './director'
import { teacher } from './teacher'
import { advisor } from './advisor'
import { vercelBlobFile } from './vercelBlobFile'
import { downloadCategory } from './downloadCategory'
import { downloadable } from './downloadable'
import { publicDownloadSettings } from './publicDownloadSettings'
import { surveyArea } from './surveyArea'
import { surveyClass } from './surveyClass'
import { surveyTeacher } from './surveyTeacher'
import { surveyTemplate } from './surveyTemplate'
import { surveyRound } from './surveyRound'
import { admissionFormTypes } from './admissionForm'
import { policies } from './policies'
import { curriculum } from './curriculum'

export const schemaTypes = [
  feeSettings,
  homePage,
  campusDay,
  album,
  notice,
  testimonial,
  siteSettings,
  pagesOnOff,
  seoSettings,
  policies,
  curriculum,
  preAdmissionForm,
  department,
  director,
  teacher,
  advisor,
  vercelBlobFile,
  downloadCategory,
  downloadable,
  publicDownloadSettings,
  surveyArea,
  surveyClass,
  surveyTeacher,
  surveyTemplate,
  surveyRound,
  ...admissionFormTypes,
]
