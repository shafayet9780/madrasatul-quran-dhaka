'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CalendarDaysIcon, ClockIcon, QuestionMarkCircleIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function ImportantDates() {
  const t = useTranslations('admissions.importantDates');

  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentAge: '',
    program: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const importantDates = [
    {
      date: '2025-01-15',
      title: t('dates.applicationOpen'),
      description: t('dates.applicationOpenDesc'),
      type: 'application',
    },
    {
      date: '2025-02-28',
      title: t('dates.applicationDeadline'),
      description: t('dates.applicationDeadlineDesc'),
      type: 'deadline',
    },
    {
      date: '2025-03-15',
      title: t('dates.entranceExam'),
      description: t('dates.entranceExamDesc'),
      type: 'exam',
    },
    {
      date: '2025-03-25',
      title: t('dates.interview'),
      description: t('dates.interviewDesc'),
      type: 'interview',
    },
    {
      date: '2025-04-05',
      title: t('dates.resultPublication'),
      description: t('dates.resultPublicationDesc'),
      type: 'result',
    },
    {
      date: '2025-04-20',
      title: t('dates.admissionConfirmation'),
      description: t('dates.admissionConfirmationDesc'),
      type: 'confirmation',
    },
  ];

  const faqs = [
    {
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer'),
    },
    {
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer'),
    },
    {
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer'),
    },
    {
      question: t('faq.q4.question'),
      answer: t('faq.q4.answer'),
    },
    {
      question: t('faq.q5.question'),
      answer: t('faq.q5.answer'),
    },
    {
      question: t('faq.q6.question'),
      answer: t('faq.q6.answer'),
    },
  ];

  const getDateTypeColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
      case 'exam': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interview': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'result': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmation': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setFormStatus('success');
      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        studentAge: '',
        program: '',
        subject: '',
        message: '',
      });
    } catch {
      setFormStatus('error');
    }
  };

  const isFormValid = inquiryForm.name && inquiryForm.email && inquiryForm.phone && inquiryForm.message;

  return (
    <section className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-8 py-6 border-b">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="p-8">
        {/* Important Dates Calendar */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('calendar.title')}
          </h3>
          
          <div className="grid gap-4">
            {importantDates.map((dateItem, index) => {
              const date = new Date(dateItem.date);
              const isUpcoming = date > new Date();
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    isUpcoming ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isUpcoming ? 'bg-primary-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          <CalendarDaysIcon className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {dateItem.title}
                        </h4>
                        <p className="text-gray-600 mb-2">
                          {dateItem.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {date.toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDateTypeColor(dateItem.type)}`}>
                      {t(`calendar.${dateItem.type}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('inquiry.title')}
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-6">
            {formStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('inquiry.success.title')}
                </h4>
                <p className="text-gray-600 mb-4">
                  {t('inquiry.success.message')}
                </p>
                <button
                  onClick={() => setFormStatus('idle')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  {t('inquiry.success.newInquiry')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={t('inquiry.form.namePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={t('inquiry.form.emailPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.phone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={t('inquiry.form.phonePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.studentAge')}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="18"
                      value={inquiryForm.studentAge}
                      onChange={(e) => setInquiryForm({...inquiryForm, studentAge: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={t('inquiry.form.studentAgePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.program')}
                    </label>
                    <select
                      value={inquiryForm.program}
                      onChange={(e) => setInquiryForm({...inquiryForm, program: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('inquiry.form.programPlaceholder')}</option>
                      <option value="primary">{t('inquiry.form.programs.primary')}</option>
                      <option value="secondary">{t('inquiry.form.programs.secondary')}</option>
                      <option value="higher">{t('inquiry.form.programs.higher')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inquiry.form.subject')}
                    </label>
                    <select
                      value={inquiryForm.subject}
                      onChange={(e) => setInquiryForm({...inquiryForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('inquiry.form.subjectPlaceholder')}</option>
                      <option value="admission">{t('inquiry.form.subjects.admission')}</option>
                      <option value="curriculum">{t('inquiry.form.subjects.curriculum')}</option>
                      <option value="fees">{t('inquiry.form.subjects.fees')}</option>
                      <option value="facilities">{t('inquiry.form.subjects.facilities')}</option>
                      <option value="other">{t('inquiry.form.subjects.other')}</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('inquiry.form.message')} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t('inquiry.form.messagePlaceholder')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {t('inquiry.form.note')}
                  </p>
                  <button
                    type="submit"
                    disabled={!isFormValid || formStatus === 'submitting'}
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {formStatus === 'submitting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('inquiry.form.submitting')}
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        {t('inquiry.form.submit')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('faq.title')}
          </h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <QuestionMarkCircleIcon 
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-gray-700 border-t border-gray-100">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}