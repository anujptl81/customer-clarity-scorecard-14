
import React from 'react';
import { Target } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ICP Assessment</h1>
            <p className="text-sm text-gray-600">B2B Growth Assessment Tool</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
