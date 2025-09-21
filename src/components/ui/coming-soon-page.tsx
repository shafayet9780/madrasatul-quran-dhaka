import Link from 'next/link';
import { ArrowLeft, Mail, Clock, Sparkles } from 'lucide-react';

interface ComingSoonPageProps {
  pageTitle: string;
  expectedLaunch?: string;
  locale: string;
}

export default function ComingSoonPage({ 
  pageTitle, 
  expectedLaunch = "Soon",
  locale
}: ComingSoonPageProps) {
  // Check if current locale is Bengali
  const isBengali = locale === 'bn' || locale === 'bengali';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent-300 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Islamic Geometric Pattern */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full mb-6 shadow-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-6 leading-tight">
          {pageTitle}
        </h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border border-white/20">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-3 bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-3 rounded-full">
              <Clock className="w-5 h-5 text-primary-600" />
              <span className="text-primary-700 font-semibold">{isBengali ? 'শীঘ্রই আসছে' : 'Coming Soon'}</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            {isBengali ? 'আমরা কাজ করছি' : 'We are Working'}
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
            {isBengali 
              ? 'আমরা এই পৃষ্ঠাটি শীঘ্রই প্রস্তুত করার জন্য কাজ করছি।'
              : 'We are working to make this page ready soon.'
            }
          </p>
          
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-3 h-3 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100">
            <p className="text-primary-700 font-medium">
              {isBengali ? 'প্রত্যাশিত লঞ্চ:' : 'Expected Launch:'} <span className="font-bold">{expectedLaunch}</span>
            </p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/"
            className="group inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{isBengali ? 'হোমে ফিরুন' : 'Return Home'}</span>
          </Link>
          
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-primary-700 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-primary-200 hover:border-primary-300"
          >
            <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>{isBengali ? 'যোগাযোগ করুন' : 'Contact Us'}</span>
          </Link>
        </div>
        
        {/* Footer Note */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">Madrasatul Quran</p>
          <p className="text-gray-400 text-xs">{isBengali ? 'ইসলামিক শিক্ষায় উৎকর্ষ' : 'Excellence in Islamic Education'}</p>
        </div>
      </div>
    </div>
  );
}