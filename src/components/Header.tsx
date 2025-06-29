
import React from 'react';
import { Target } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Target className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">ICP Assessment</h1>
            <p className="text-xs sm:text-sm text-gray-600">B2B Growth Assessment Tool</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
