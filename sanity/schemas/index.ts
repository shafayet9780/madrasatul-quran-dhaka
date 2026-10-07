import { feeSettings } from './feeSettings'
import { page } from './page'
import { newsEvent } from './newsEvent'
import { academicProgram } from './academicProgram'
import { facility } from './facility'
import { siteSettings } from './siteSettings'
import { footer } from './footer'
import { preAdmissionForm } from './preAdmissionForm'
import prospectus from './prospectus'
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

export const schemaTypes = [
  feeSettings,
  page,
  newsEvent,
  academicProgram,
  facility,
  siteSettings,
  footer,
  preAdmissionForm,
  prospectus,
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
