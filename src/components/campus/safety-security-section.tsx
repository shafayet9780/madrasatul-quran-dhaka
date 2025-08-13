'use client';

import { useTranslations } from 'next-intl';
import { Shield, Camera, Heart, Phone, Clock, Users, AlertTriangle, CheckCircle, Lock, Eye } from 'lucide-react';

interface SafetyMeasure {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

interface Policy {
  id: string;
  title: string;
  description: string;
  points: string[];
}

interface EmergencyContact {
  id: string;
  title: string;
  number: string;
  description: string;
  available: string;
  icon: React.ReactNode;
}

export default function SafetySecuritySection() {
  const t = useTranslations('campus.safety');

  const safetyMeasures: SafetyMeasure[] = [
    {
      id: '1',
      title: 'Advanced Security Systems',
      description: 'Comprehensive CCTV surveillance and access control systems throughout the campus',
      icon: <Camera className="w-8 h-8 text-blue-600" />,
      features: [
        '24/7 CCTV Monitoring',
        'Controlled Access Points',
        'Security Guard Posts',
        'Visitor Management System',
        'Emergency Alert System'
      ]
    },
    {
      id: '2',
      title: 'Medical & Health Facilities',
      description: 'On-campus medical support with qualified healthcare professionals',
      icon: <Heart className="w-8 h-8 text-red-600" />,
      features: [
        'Qualified School Nurse',
        'First Aid Stations',
        'Emergency Medical Kit',
        'Health Screening Programs',
        'Nearby Hospital Partnership'
      ]
    },
    {
      id: '3',
      title: 'Emergency Response Protocols',
      description: 'Well-defined emergency procedures and regular safety drills',
      icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
      features: [
        'Fire Safety Drills',
        'Evacuation Procedures',
        'Emergency Communication',
        'Staff Training Programs',
        'Crisis Management Team'
      ]
    },
    {
      id: '4',
      title: 'Child Protection Measures',
      description: 'Comprehensive child safety and protection policies',
      icon: <Shield className="w-8 h-8 text-green-600" />,
      features: [
        'Background Checked Staff',
        'Anti-Bullying Policies',
        'Safe Transportation',
        'Supervised Activities',
        'Parent Communication System'
      ]
    }
  ];

  const policies: Policy[] = [
    {
      id: '1',
      title: 'Student Welfare Policy',
      description: 'Comprehensive guidelines ensuring the physical, emotional, and spiritual well-being of all students',
      points: [
        'Zero tolerance for bullying or harassment of any kind',
        'Regular counseling and guidance sessions for students',
        'Islamic values-based character development programs',
        'Healthy meal programs with nutritious food options',
        'Regular health check-ups and medical monitoring'
      ]
    },
    {
      id: '2',
      title: 'Campus Safety Protocols',
      description: 'Strict safety measures and protocols to maintain a secure learning environment',
      points: [
        'Mandatory visitor registration and identification',
        'Supervised entry and exit procedures for students',
        'Regular safety inspections of all facilities and equipment',
        'Emergency evacuation plans practiced monthly',
        'Secure storage of all hazardous materials in laboratories'
      ]
    },
    {
      id: '3',
      title: 'Digital Safety & Privacy',
      description: 'Protection of student data and safe use of technology resources',
      points: [
        'Secure student information management systems',
        'Internet safety education and filtered access',
        'Privacy protection for student records and communications',
        'Cyberbullying prevention and reporting mechanisms',
        'Regular updates to security software and systems'
      ]
    }
  ];

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      title: 'School Emergency Hotline',
      number: '+880 1712-345678',
      description: 'Primary emergency contact for all school-related incidents',
      available: '24/7 Available',
      icon: <Phone className="w-6 h-6 text-red-600" />
    },
    {
      id: '2',
      title: 'Principal Office',
      number: '+880 1812-345678',
      description: 'Direct line to principal for urgent matters and emergencies',
      available: 'School Hours',
      icon: <Users className="w-6 h-6 text-blue-600" />
    },
    {
      id: '3',
      title: 'Medical Emergency',
      number: '+880 1912-345678',
      description: 'School nurse and medical emergency response team',
      available: 'School Hours + Events',
      icon: <Heart className="w-6 h-6 text-green-600" />
    },
    {
      id: '4',
      title: 'Security Office',
      number: '+880 1612-345678',
      description: 'Campus security for safety concerns and incidents',
      available: '24/7 Available',
      icon: <Shield className="w-6 h-6 text-purple-600" />
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary-600 mr-3" />
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
              Safety & Security
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            {t('title')}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Safety Measures Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {t('measures.title')}
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our comprehensive safety infrastructure ensures a secure and protected environment for all students and staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyMeasures.map((measure) => (
              <div
                key={measure.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 group transform hover:-translate-y-2"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {measure.icon}
                </div>

                {/* Content */}
                <h4 className="font-bold text-text-primary mb-3 group-hover:text-primary-700 transition-colors">
                  {measure.title}
                </h4>
                <p className="text-text-secondary text-sm mb-4">
                  {measure.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {measure.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Student Welfare Policies */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {t('policies.title')}
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our comprehensive policies ensure the well-being, safety, and development of every student in our care.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border-l-4 border-primary-500"
              >
                <h4 className="font-bold text-xl text-text-primary mb-4">
                  {policy.title}
                </h4>
                <p className="text-text-secondary mb-6">
                  {policy.description}
                </p>
                
                <ul className="space-y-3">
                  {policy.points.map((point, index) => (
                    <li key={index} className="flex items-start text-sm text-text-secondary">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 md:p-12 border border-red-100">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-red-600 mr-3" />
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                Emergency Support
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {t('emergency.title')}
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto">
              {t('emergency.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center group"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 mx-auto group-hover:bg-primary-100 transition-colors">
                  {contact.icon}
                </div>

                {/* Contact Info */}
                <h4 className="font-semibold text-text-primary mb-2">
                  {contact.title}
                </h4>
                <a
                  href={`tel:${contact.number}`}
                  className="text-lg font-bold text-primary-600 hover:text-primary-700 transition-colors block mb-2"
                >
                  {contact.number}
                </a>
                <p className="text-sm text-text-secondary mb-3">
                  {contact.description}
                </p>
                
                {/* Availability */}
                <div className="flex items-center justify-center text-xs text-green-600 bg-green-50 rounded-full px-3 py-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {contact.available}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Emergency Info */}
          <div className="mt-12 bg-white rounded-2xl p-8 border border-orange-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-text-primary mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  Emergency Procedures
                </h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• In case of medical emergency, contact school nurse immediately</li>
                  <li>• For security concerns, alert campus security first</li>
                  <li>• Parents will be notified within 15 minutes of any incident</li>
                  <li>• Emergency evacuation routes are posted in every classroom</li>
                  <li>• All staff are trained in basic first aid and CPR</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-text-primary mb-4 flex items-center">
                  <Lock className="w-5 h-5 text-blue-600 mr-2" />
                  Security Features
                </h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• 24/7 CCTV monitoring with recorded footage</li>
                  <li>• Controlled access with ID card system</li>
                  <li>• Regular security patrols during school hours</li>
                  <li>• Visitor registration and escort policy</li>
                  <li>• Direct communication with local police station</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-sm text-text-secondary">Security Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-sm text-text-secondary">Staff Background Checked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">15min</div>
              <div className="text-sm text-text-secondary">Emergency Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">5+</div>
              <div className="text-sm text-text-secondary">Years Zero Incidents</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}